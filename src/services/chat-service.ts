import { Database } from '../db';
import { chatTable, apiChatsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service for handling chat management operations
 */
export class ChatService {
  constructor(private db: Database) {}

  /**
   * Ensure a chat is registered (register it if it doesn't exist)
   */
  async ensureChatExists(chatId: number, description?: string): Promise<void> {
    // Check if chat already exists
    const existingChats = await this.db.select()
      .from(chatTable)
      .where(eq(chatTable.id, chatId));
      
    if (existingChats.length > 0) {
      return; // Chat already exists, nothing to do
    }
    
    // Add the new chat
    await this.db.insert(chatTable).values({
      id: chatId,
      description: description || null,
      createdAt: new Date()
    });
    
    console.log(`Chat ${chatId} auto-registered`);
  }

  /**
   * Add a new chat
   */
  async addChat(chatId: number, description?: string): Promise<void> {
    // Check if chat already exists
    const existingChats = await this.db.select()
      .from(chatTable)
      .where(eq(chatTable.id, chatId));
      
    if (existingChats.length > 0) {
      throw new Error(`📜 Ninja scroll: Chat with ID ${chatId} already exists.`);
    }
    
    // Add the new chat
    await this.db.insert(chatTable).values({
      id: chatId,
      description: description || null,
      createdAt: new Date()
    });
  }

  /**
   * List all chats
   */
  async listChats() {
    return this.db.select().from(chatTable);
  }

  /**
   * Remove a chat by ID
   */
  async removeChat(chatId: number): Promise<void> {
    // Check if chat exists
    const chats = await this.db.select()
      .from(chatTable)
      .where(eq(chatTable.id, chatId));
      
    if (chats.length === 0) {
      throw new Error(`👁️ Ninja vision failed: Chat with ID ${chatId} not found.`);
    }
    
    // First remove all API subscriptions for this chat
    await this.db.delete(apiChatsTable)
      .where(eq(apiChatsTable.chatId, chatId));
    
    // Then remove the chat
    await this.db.delete(chatTable)
      .where(eq(chatTable.id, chatId));
  }

  /**
   * Subscribe a chat to an API
   */
  async subscribeToApi(chatId: number, apiId: string): Promise<void> {
    // First ensure the chat exists
    await this.ensureChatExists(chatId);
    
    // Check if subscription already exists
    const existingSubscriptions = await this.db.select()
      .from(apiChatsTable)
      .where(
        and(
          eq(apiChatsTable.chatId, chatId),
          eq(apiChatsTable.apiId, apiId)
        )
      );
      
    if (existingSubscriptions.length > 0) {
      throw new Error('🎭 Ninja mask: This chat is already subscribed to that API.');
    }
    
    // Create new subscription
    await this.db.insert(apiChatsTable).values({
      id: uuidv4(),
      apiId,
      chatId,
      createdAt: new Date()
    });
  }

  /**
   * Unsubscribe a chat from an API
   */
  async unsubscribeFromApi(chatId: number, apiId: string): Promise<void> {
    // Check if subscription exists
    const subscriptions = await this.db.select()
      .from(apiChatsTable)
      .where(
        and(
          eq(apiChatsTable.chatId, chatId),
          eq(apiChatsTable.apiId, apiId)
        )
      );
      
    if (subscriptions.length === 0) {
      throw new Error('🌑 Ninja shadow: This chat is not subscribed to that API.');
    }
    
    // Remove subscription
    await this.db.delete(apiChatsTable)
      .where(
        and(
          eq(apiChatsTable.chatId, chatId),
          eq(apiChatsTable.apiId, apiId)
        )
      );
  }
} 