import { Command } from './command-interface';
import { Database } from '../db';
import { createApiService } from '../services/api-service';
import { apiTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Command for deleting an API endpoint
 */
export const createDeleteApiCommand = (): Command => {
  return {
    name: '/delete',
    
    execute: async (chatId: number, args: string[], db: Database, _botToken: string, _userId?: number): Promise<string> => {
      if (args.length < 1) {
        return 'Usage: /delete <n>';
      }

      const name = args[0];
      
      try {
        const apiService = createApiService(db);
        
        // First check if the API exists
        const apis = await db.select().from(apiTable).where(eq(apiTable.name, name));
        
        if (apis.length === 0) {
          return `Error: API endpoint "${name}" not found.`;
        }
        
        // Now check if the user owns this API
        if (apis[0].ownerId !== chatId) {
          return `Access denied: You don't have permission to delete API "${name}".`;
        }
        
        // User owns the API and it exists, proceed with deletion
        const result = await apiService.deleteApi(name, chatId);
        
        if (!result.success) {
          return result.message;
        }
        
        return `API endpoint "${name}" has been deleted.`;
      } catch (error) {
        console.error('Error in DeleteApiCommand:', error);
        return "Failed to delete API endpoint. Please try again later.";
      }
    }
  };
}; 