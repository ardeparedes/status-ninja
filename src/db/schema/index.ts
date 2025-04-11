import { text, sqliteTable, integer } from 'drizzle-orm/sqlite-core';

export const apiTable = sqliteTable('apis', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  url: text('url').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull(),
  ownerId: integer('owner_id').notNull() // Chat ID that owns this API
});

export const chatTable = sqliteTable('chats', {
  id: integer('id').primaryKey(), // Telegram chat ID
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
});

export const apiChatsTable = sqliteTable('api_chats', {
  id: text('id').primaryKey(),
  apiId: text('api_id').notNull().references(() => apiTable.id),
  chatId: integer('chat_id').notNull().references(() => chatTable.id),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull()
}); 