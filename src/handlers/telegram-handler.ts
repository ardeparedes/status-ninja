import { Database } from '../db';
import { createCommandRegistry } from '../commands/command-registry';
import { parseCommand, TelegramMessage } from '../commands/command-interface';
import { createNotificationService } from '../services/notification-service';
import { createPermissionService } from '../services/permission-service';
import { createChatService } from '../services/chat-service';

// Type for Telegram update
export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  my_chat_member?: {
    chat: {
      id: number;
      type: string;
      title?: string;
    };
    from: {
      id: number;
    };
    date: number;
  };
}

/**
 * Factory function for handling Telegram webhook updates
 */
export const createTelegramHandler = (db: Database, botToken: string) => {
  const commandRegistry = createCommandRegistry();
  const notificationService = createNotificationService(botToken);
  const permissionService = createPermissionService(db, botToken);
  const chatService = createChatService(db);

  /**
   * Handle a text message
   */
  const handleMessage = async (message: TelegramMessage): Promise<Response> => {
    if (!message.text) {
      return new Response('OK', { status: 200 });
    }
    
    const { command, args } = parseCommand(message.text);
    const chatId = message.chat.id;
    const userId = message.from.id;
    
    // Log the chat type and ID for debugging
    console.log(`Chat type: ${message.chat.type}, Chat ID: ${chatId}, User ID: ${userId}`);
    
    // Auto-register the chat if it's a command (not just random text)
    if (command.startsWith('/')) {
      try {
        // Get a description for the chat from its title or type
        let chatDescription = 'Direct message';
        if (message.chat.type === 'group' || message.chat.type === 'supergroup') {
          chatDescription = message.chat.title || 'Group chat';
        }
        
        await chatService.ensureChatExists(chatId, chatDescription);
      } catch (error) {
        console.error(`Error auto-registering chat ${chatId}:`, error);
        // Continue with command processing even if registration fails
      }
    }
    
    // Find and execute the command
    try {
      if (commandRegistry.hasCommand(command)) {
        const commandHandler = commandRegistry.getCommand(command)!;
        
        // Extract API name for permission check if relevant
        let apiName: string | undefined;
        if (['/delete', '/subscribe', '/unsubscribe'].includes(command) && args.length > 0) {
          apiName = args[0];
        }
        
        // We'll let the command handlers handle API existence checks themselves
        // instead of doing it here, to avoid double-messaging
        
        // Check permissions
        const isAuthorized = await permissionService.isAuthorized(chatId, userId, apiName);
        
        if (!isAuthorized) {
          // For API-specific operations, give more specific error message
          if (apiName && ['delete', 'subscribe', 'unsubscribe'].some(cmd => command.includes(cmd))) {
            await notificationService.sendTelegramMessage(
              chatId, 
              `Access denied: You don't have permission to manage the API "${apiName}".`
            );
          } else {
            await notificationService.sendTelegramMessage(
              chatId, 
              'Note: In private chats, you can only manage your own APIs. In group chats, only administrators can use management commands.'
            );
          }
          return new Response('Unauthorized', { status: 403 });
        }
        
        // Execute the command - all API existence checks should happen inside the command handlers
        const responseText = await commandHandler.execute(chatId, args, db, botToken, userId);
        
        await notificationService.sendTelegramMessage(chatId, responseText);
        return new Response('OK', { status: 200 });
      } else {
        await notificationService.sendTelegramMessage(
          chatId, 
          'Unknown command. Use /help to see available commands.'
        );
        return new Response('OK', { status: 200 });
      }
    } catch (error) {
      console.error(`Error processing command "${command}" in chat ${chatId}:`, error);
      await notificationService.sendTelegramMessage(
        chatId, 
        'Error: Something went wrong. Please try again.'
      );
      return new Response('Error', { status: 500 });
    }
  };

  /**
   * Handle chat member update (bot added/removed)
   */
  const handleChatMemberUpdate = async (chatMemberUpdate: TelegramUpdate['my_chat_member']): Promise<Response> => {
    if (!chatMemberUpdate) {
      return new Response('OK', { status: 200 });
    }
    
    const chatId = chatMemberUpdate.chat.id;
    console.log(`Bot membership changed in chat: ${chatId}`);
    
    // Auto-register the chat when the bot is added
    try {
      // Get a description based on chat type
      let chatDescription = 'Direct message';
      if (chatMemberUpdate.chat.type === 'group' || chatMemberUpdate.chat.type === 'supergroup') {
        chatDescription = chatMemberUpdate.chat.title || 'Group chat';
      }
      
      await chatService.ensureChatExists(chatId, chatDescription);
      
      // Welcome message
      await notificationService.sendTelegramMessage(
        chatId, 
        'Thanks for adding Status Bot! I will monitor your APIs. Use /help to see available commands.'
      );
    } catch (error) {
      console.error(`Error auto-registering chat ${chatId}:`, error);
    }
    
    return new Response('OK', { status: 200 });
  };

  /**
   * Handle a Telegram update
   */
  const handleUpdate = async (update: TelegramUpdate): Promise<Response> => {
    // Log incoming update for debugging
    console.log(`Processing update ID: ${update.update_id}`);
    
    // Handle regular messages
    if (update.message?.text) {
      return handleMessage(update.message);
    }
    
    // Handle edited messages
    if (update.edited_message?.text) {
      return handleMessage(update.edited_message);
    }
    
    // Handle my_chat_member updates (bot added to/removed from chats)
    if (update.my_chat_member) {
      return handleChatMemberUpdate(update.my_chat_member);
    }
    
    // Default response for unhandled update types
    return new Response('Update received but not processed', { status: 200 });
  };

  return {
    handleUpdate
  };
}; 