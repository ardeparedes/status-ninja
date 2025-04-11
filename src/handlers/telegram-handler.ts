import { Database } from '../db';
import { CommandRegistry } from '../commands/command-registry';
import { parseCommand, TelegramMessage } from '../commands/command-interface';
import { NotificationService } from '../services/notification-service';
import { PermissionService } from '../services/permission-service';
import { ChatService } from '../services/chat-service';

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
 * Handler for Telegram webhook updates
 */
export class TelegramHandler {
  private commandRegistry: CommandRegistry;
  private notificationService: NotificationService;
  private permissionService: PermissionService;
  private chatService: ChatService;
  
  constructor(private db: Database, private botToken: string) {
    this.commandRegistry = new CommandRegistry();
    this.notificationService = new NotificationService(botToken);
    this.permissionService = new PermissionService(db, botToken);
    this.chatService = new ChatService(db);
  }
  
  /**
   * Handle a Telegram update
   */
  async handleUpdate(update: TelegramUpdate): Promise<Response> {
    // Log incoming update for debugging
    console.log(`Processing update ID: ${update.update_id}`);
    
    // Handle regular messages
    if (update.message?.text) {
      return this.handleMessage(update.message);
    }
    
    // Handle edited messages
    if (update.edited_message?.text) {
      return this.handleMessage(update.edited_message);
    }
    
    // Handle my_chat_member updates (bot added to/removed from chats)
    if (update.my_chat_member) {
      return this.handleChatMemberUpdate(update.my_chat_member);
    }
    
    // Default response for unhandled update types
    return new Response('Update received but not processed', { status: 200 });
  }
  
  /**
   * Handle a text message
   */
  private async handleMessage(message: TelegramMessage): Promise<Response> {
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
        
        await this.chatService.ensureChatExists(chatId, chatDescription);
      } catch (error) {
        console.error(`Error auto-registering chat ${chatId}:`, error);
        // Continue with command processing even if registration fails
      }
    }
    
    // Find and execute the command
    try {
      if (this.commandRegistry.hasCommand(command)) {
        const commandHandler = this.commandRegistry.getCommand(command)!;
        
        // Extract API name for permission check if relevant
        let apiName: string | undefined;
        if (['/delete', '/subscribe', '/unsubscribe'].includes(command) && args.length > 0) {
          apiName = args[0];
        }
        
        // We'll let the command handlers handle API existence checks themselves
        // instead of doing it here, to avoid double-messaging
        
        // Check permissions
        const isAuthorized = await this.permissionService.isAuthorized(chatId, userId, apiName);
        
        if (!isAuthorized) {
          // For API-specific operations, give more specific error message
          if (apiName && ['delete', 'subscribe', 'unsubscribe'].some(cmd => command.includes(cmd))) {
            await this.notificationService.sendTelegramMessage(
              chatId, 
              `⚔️ Ninja blockade: You don't have permission to manage the API "${apiName}".`
            );
          } else {
            await this.notificationService.sendTelegramMessage(
              chatId, 
              '📜 Ninja scroll: In private chats, you can only manage your own APIs. In group chats, only administrators can use management commands.'
            );
          }
          return new Response('Unauthorized', { status: 403 });
        }
        
        // Execute the command - all API existence checks should happen inside the command handlers
        const responseText = await commandHandler.execute(chatId, args, this.db, this.botToken, userId);
        
        await this.notificationService.sendTelegramMessage(chatId, responseText);
        return new Response('OK', { status: 200 });
      } else {
        await this.notificationService.sendTelegramMessage(
          chatId, 
          '💨 Ninja vanish: Unknown command. Use /help to see available commands.'
        );
        return new Response('OK', { status: 200 });
      }
    } catch (error) {
      console.error(`Error processing command "${command}" in chat ${chatId}:`, error);
      await this.notificationService.sendTelegramMessage(
        chatId, 
        '🗡️ Ninja strike failed: Something went wrong. Please try again.'
      );
      return new Response('Error', { status: 500 });
    }
  }
  
  /**
   * Handle chat member update (bot added/removed)
   */
  private async handleChatMemberUpdate(chatMemberUpdate: TelegramUpdate['my_chat_member']): Promise<Response> {
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
      
      await this.chatService.ensureChatExists(chatId, chatDescription);
      
      // Welcome message
      await this.notificationService.sendTelegramMessage(
        chatId, 
        '🥷 Thanks for adding Status Ninja Bot! I will monitor your APIs. Use /help to see available commands.'
      );
    } catch (error) {
      console.error(`Error auto-registering chat ${chatId}:`, error);
    }
    
    return new Response('OK', { status: 200 });
  }
} 