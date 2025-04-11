import { Database } from '../db';
import { apiTable, apiChatsTable, chatTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Type for API record
 */
export interface Api {
  id: string;
  name: string;
  url: string;
  createdAt: Date;
  ownerId: number;
}

/**
 * Service for handling API management operations
 */
export class ApiService {
  constructor(private db: Database) {}

  /**
   * Add a new API endpoint
   */
  async addApi(name: string, url: string, ownerId: number): Promise<string> {
    const apiId = uuidv4();
    await this.db.insert(apiTable).values({
      id: apiId,
      name,
      url,
      createdAt: new Date(),
      ownerId
    });
    return apiId;
  }

  /**
   * List all API endpoints
   * If ownerId is provided, only list APIs owned by that chat
   */
  async listApis(ownerId?: number) {
    if (ownerId) {
      return this.db.select()
        .from(apiTable)
        .where(eq(apiTable.ownerId, ownerId));
    }
    
    return this.db.select().from(apiTable);
  }

  /**
   * Delete an API endpoint by name
   * If ownerId is provided, only allow deletion if the chat owns the API
   * @returns {Promise<{success: boolean, message: string, apiId?: string}>} Result object with operation status
   */
  async deleteApi(name: string, ownerId?: number): Promise<{success: boolean, message: string, apiId?: string}> {
    const apis = await this.db.select().from(apiTable).where(eq(apiTable.name, name));
    
    if (apis.length === 0) {
      return {
        success: false,
        message: `👁️ Ninja vision failed: API endpoint "${name}" not found.`
      };
    }
    
    const apiId = apis[0].id;
    
    // Check ownership if ownerId provided
    if (ownerId && apis[0].ownerId !== ownerId) {
      return {
        success: false,
        message: `⚔️ Ninja blockade: You don't have permission to delete API "${name}".`
      };
    }
    
    try {
      // First delete any subscriptions
      await this.db.delete(apiChatsTable).where(eq(apiChatsTable.apiId, apiId));
      
      // Then delete the API
      await this.db.delete(apiTable).where(eq(apiTable.id, apiId));
      
      return {
        success: true,
        message: `API endpoint "${name}" deleted successfully.`,
        apiId
      };
    } catch (error) {
      console.error('Error during API deletion:', error);
      return {
        success: false,
        message: '🗡️ Ninja strike failed: Database error while deleting API.'
      };
    }
  }

  /**
   * Get API by name
   * If ownerId is provided, only return if the chat owns the API
   * @returns {Promise<{success: boolean, api?: Api, message?: string}>} Result with API or error message
   */
  async getApiByName(name: string, ownerId?: number): Promise<{success: boolean, api?: Api, message?: string}> {
    const apis = await this.db.select().from(apiTable).where(eq(apiTable.name, name));
    
    if (apis.length === 0) {
      return {
        success: false,
        message: `👁️ Ninja vision failed: API endpoint "${name}" not found.`
      };
    }
    
    // Check ownership if ownerId provided
    if (ownerId && apis[0].ownerId !== ownerId) {
      return {
        success: false,
        message: `⚔️ Ninja blockade: You don't have permission to access API "${name}".`
      };
    }
    
    return {
      success: true,
      api: apis[0]
    };
  }

  /**
   * Get subscribed chat IDs for an API
   */
  async getSubscribedChatIds(apiId: string): Promise<number[]> {
    const apiChats = await this.db.select({
      chatId: chatTable.id
    })
    .from(apiChatsTable)
    .leftJoin(chatTable, eq(apiChatsTable.chatId, chatTable.id))
    .where(eq(apiChatsTable.apiId, apiId));
    
    return apiChats
      .filter(ac => ac.chatId !== null)
      .map(ac => ac.chatId!);
  }
} 