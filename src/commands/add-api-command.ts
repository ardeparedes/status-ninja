import { Command } from './command-interface';
import { Database } from '../db';
import { createApiService } from '../services/api-service';

/**
 * Command for adding a new API endpoint
 */
export const createAddApiCommand = (): Command => ({
  name: '/add',
  
  execute: async (chatId: number, args: string[], db: Database, _botToken: string, _userId?: number): Promise<string> => {
    if (args.length < 2) {
      return 'Usage: /add <n> <url>';
    }

    const name = args[0];
    const url = args[1];
    
    try {
      const apiService = createApiService(db);
      
      // Set the owner to the current chat ID
      await apiService.addApi(name, url, chatId);
      
      return `API endpoint "${name}" added successfully.`;
    } catch (error) {
      console.error('Error adding API:', error);
      return 'Error adding API. Please try again.';
    }
  }
}); 