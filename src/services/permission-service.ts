import { Database } from '../db';
import { apiTable } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Factory function for permission check utilities
 */
export const createPermissionService = (db: Database, botToken: string) => {
  /**
   * Check if a user is authorized to perform an action on an API
   * 
   * @param chatId The chat ID where the command is being executed
   * @param userId The user ID executing the command (in groups)
   * @param apiName Optional API name if we're checking permission for a specific API
   */
  const isAuthorized = async (chatId: number, userId: number, apiName?: string): Promise<boolean> => {
    // Private chats: the user is implicitly authorized for their own chat
    if (chatId > 0) {
      // For API-specific operations, check if the user owns the API
      if (apiName) {
        const apis = await db.select()
          .from(apiTable)
          .where(eq(apiTable.name, apiName));
          
        if (apis.length === 0) {
          return true; // Let the command handler handle non-existent APIs
        }
        
        // Check if this chat owns the API
        return apis[0].ownerId === chatId;
      }
      
      return true; // In private chats, users can manage their own chats
    } 
    
    // Group chats: only admins can perform actions
    return isGroupAdmin(chatId, userId);
  };
  
  /**
   * Check if a user is an admin in a group chat
   */
  const isGroupAdmin = async (chatId: number, userId: number): Promise<boolean> => {
    try {
      const response = await fetch(`https://api.telegram.org/bot${botToken}/getChatMember`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: userId
        })
      });
      
      interface ChatMemberResponse {
        ok: boolean;
        result?: {
          status: string;
        };
      }
      
      const data = await response.json() as ChatMemberResponse;
      
      if (!data.ok || !data.result) {
        return false;
      }
      
      // Admin statuses in Telegram: creator, administrator
      const adminStatuses = ['creator', 'administrator'];
      return adminStatuses.includes(data.result.status);
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false; // Default to deny on error
    }
  };

  return {
    isAuthorized
  };
}; 