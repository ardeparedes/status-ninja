import { Database } from '../db';
import { chatTable, apiChatsTable } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

/**
 * Factory function for chat management operations
 */
export const createChatService = (db: Database) => {
  /**
   * Ensure a chat is registered (register it if it doesn't exist)
   */
  const ensureChatExists = async (chatId: number, description?: string): Promise<void> => {
    // Check if chat already exists
    const existingChats = await db.select()
      .from(chatTable)
      .where(eq(chatTable.id, chatId));
      
    if (existingChats.length > 0) {
      return; // Chat already exists, nothing to do
    }
    
    // Add the new chat
    await db.insert(chatTable).values({
      id: chatId,
      description: description || null,
      createdAt: new Date()
    });
    
    console.log(`Chat ${chatId} auto-registered`);
  };

  /**
   * Add a new chat
   */
  const addChat = async (chatId: number, description?: string): Promise<void> => {
    // Check if chat already exists
    const existingChats = await db.select()
      .from(chatTable)
      .where(eq(chatTable.id, chatId));
      
    if (existingChats.length > 0) {
      throw new Error(`Error: Chat with ID ${chatId} already exists.`);
    }
    
    // Add the new chat
    await db.insert(chatTable).values({
      id: chatId,
      description: description || null,
      createdAt: new Date()
    });
  };

  /**
   * List all chats
   */
  const listChats = async () => {
    return db.select().from(chatTable);
  };

  /**
   * Remove a chat by ID
   */
  const removeChat = async (chatId: number): Promise<void> => {
    // Check if chat exists
    const chats = await db.select()
      .from(chatTable)
      .where(eq(chatTable.id, chatId));
      
    if (chats.length === 0) {
      throw new Error(`Error: Chat with ID ${chatId} not found.`);
    }
    
    // First remove all API subscriptions for this chat
    await db.delete(apiChatsTable)
      .where(eq(apiChatsTable.chatId, chatId));
    
    // Then remove the chat
    await db.delete(chatTable)
      .where(eq(chatTable.id, chatId));
  };

  /**
   * Subscribe a chat to an API
   */
  const subscribeToApi = async (chatId: number, apiId: string): Promise<void> => {
    // First ensure the chat exists
    await ensureChatExists(chatId);
    
    // Check if subscription already exists
    const existingSubscriptions = await db.select()
      .from(apiChatsTable)
      .where(
        and(
          eq(apiChatsTable.chatId, chatId),
          eq(apiChatsTable.apiId, apiId)
        )
      );
      
    if (existingSubscriptions.length > 0) {
      throw new Error('Error: This chat is already subscribed to that API.');
    }
    
    // Create new subscription
    await db.insert(apiChatsTable).values({
      id: uuidv4(),
      apiId,
      chatId,
      createdAt: new Date()
    });
  };

  /**
   * Unsubscribe a chat from an API
   */
  const unsubscribeFromApi = async (chatId: number, apiId: string): Promise<void> => {
    // Check if subscription exists
    const subscriptions = await db.select()
      .from(apiChatsTable)
      .where(
        and(
          eq(apiChatsTable.chatId, chatId),
          eq(apiChatsTable.apiId, apiId)
        )
      );
      
    if (subscriptions.length === 0) {
      throw new Error('Error: This chat is not subscribed to that API.');
    }
    
    // Remove subscription
    await db.delete(apiChatsTable)
      .where(
        and(
          eq(apiChatsTable.chatId, chatId),
          eq(apiChatsTable.apiId, apiId)
        )
      );
  };

  return {
    ensureChatExists,
    addChat,
    listChats,
    removeChat,
    subscribeToApi,
    unsubscribeFromApi
  };
}; 