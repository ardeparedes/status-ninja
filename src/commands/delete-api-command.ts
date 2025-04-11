import { Command } from './command-interface';
import { Database } from '../db';
import { ApiService } from '../services/api-service';
import { apiTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Command for deleting an API endpoint
 */
export class DeleteApiCommand implements Command {
  name = '/delete';
  
  private apiService: ApiService;

  constructor(private db: Database) {
    this.apiService = new ApiService(db);
  }

  async execute(chatId: number, args: string[], db: Database, _botToken: string, _userId?: number): Promise<string> {
    if (args.length < 1) {
      return 'Usage: /delete <name>';
    }

    const name = args[0];
    
    try {
      // First check if the API exists
      const apis = await db.select().from(apiTable).where(eq(apiTable.name, name));
      
      if (apis.length === 0) {
        return `👁️ Ninja vision failed: API endpoint "${name}" not found.`;
      }
      
      // Now check if the user owns this API
      if (apis[0].ownerId !== chatId) {
        return `⚔️ Ninja blockade: You don't have permission to delete API "${name}".`;
      }
      
      // User owns the API and it exists, proceed with deletion
      const result = await this.apiService.deleteApi(name, chatId);
      
      if (!result.success) {
        return result.message;
      }
      
      return `🗑️ API endpoint "${name}" has been deleted.`;
    } catch (error) {
      console.error('Error in DeleteApiCommand:', error);
      return "❌ Failed to delete API endpoint. Please try again later.";
    }
  }
} 