import { Command } from './command-interface';
import { Database } from '../db';
import { ChatService } from '../services/chat-service';
import { ApiService } from '../services/api-service';

/**
 * Command for subscribing a chat to an API
 */
export class SubscribeCommand implements Command {
  name = '/subscribe';
  
  async execute(chatId: number, args: string[], db: Database, _botToken: string, _userId?: number): Promise<string> {
    if (args.length < 1) {
      return 'Usage: /subscribe <api_name>';
    }

    const apiName = args[0];
    
    try {
      const apiService = new ApiService(db);
      const chatService = new ChatService(db);
      
      // Get the API ID - pass chatId to check ownership
      const apiResult = await apiService.getApiByName(apiName, chatId);
      
      if (!apiResult.success || !apiResult.api) {
        return apiResult.message || `Cannot find API "${apiName}".`;
      }
      
      // Subscribe the chat
      await chatService.subscribeToApi(chatId, apiResult.api.id);
      
      return `Successfully subscribed to "${apiName}" API health checks.`;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
      console.error('Error subscribing to API:', error);
      return 'Error subscribing to API. Please try again.';
    }
  }
}

/**
 * Command for unsubscribing a chat from an API
 */
export class UnsubscribeCommand implements Command {
  name = '/unsubscribe';
  
  async execute(chatId: number, args: string[], db: Database, _botToken: string, _userId?: number): Promise<string> {
    if (args.length < 1) {
      return 'Usage: /unsubscribe <api_name>';
    }

    const apiName = args[0];
    
    try {
      const apiService = new ApiService(db);
      const chatService = new ChatService(db);
      
      // Get the API ID - pass chatId to check ownership
      const apiResult = await apiService.getApiByName(apiName, chatId);
      
      if (!apiResult.success || !apiResult.api) {
        return apiResult.message || `Cannot find API "${apiName}".`;
      }
      
      // Unsubscribe the chat
      await chatService.unsubscribeFromApi(chatId, apiResult.api.id);
      
      return `Successfully unsubscribed from "${apiName}" API health checks.`;
    } catch (error) {
      if (error instanceof Error) {
        return error.message;
      }
      console.error('Error unsubscribing from API:', error);
      return 'Error unsubscribing from API. Please try again.';
    }
  }
} 