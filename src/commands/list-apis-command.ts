import { Command } from './command-interface';
import { Database } from '../db';
import { createApiService } from '../services/api-service';

/**
 * Command for listing all API endpoints
 */
export const createListApisCommand = (): Command => ({
  name: '/list',
  
  execute: async (chatId: number, args: string[], db: Database, _botToken: string, _userId?: number): Promise<string> => {
    try {
      const apiService = createApiService(db);
      
      // Only list APIs owned by this chat
      const apis = await apiService.listApis(chatId);
      
      if (apis.length === 0) {
        return 'No API endpoints configured for this chat.';
      }
      
      const apiList = apis.map(api => `- ${api.name}: ${api.url}`).join('\n');
      return `Configured API endpoints for this chat:\n${apiList}`;
    } catch (error) {
      console.error('Error listing APIs:', error);
      return 'Error retrieving API endpoints.';
    }
  }
}); 