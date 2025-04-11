import { Command } from './command-interface';
import { Database } from '../db';

/**
 * Help command handler
 */
export const createHelpCommand = (): Command => ({
  name: '/help',
  
  execute: async (_chatId: number, _args: string[], _db: Database, _botToken: string, _userId?: number): Promise<string> => {
    return `Status Bot Help

Available commands:
/add <n> <url> - Add a new API to monitor
/list - List your monitored APIs
/delete <n> - Delete one of your APIs
/subscribe <api_name> - Subscribe this chat to an API
/unsubscribe <api_name> - Unsubscribe this chat from an API
/help - Show this help message

Made for API monitoring`;
  }
});

/**
 * Start command handler (alias for Help)
 */
export const createStartCommand = (): Command => ({
  name: '/start',
  
  execute: async (chatId: number, args: string[], db: Database, botToken: string, userId?: number): Promise<string> => {
    const helpCommand = createHelpCommand();
    return helpCommand.execute(chatId, args, db, botToken, userId);
  }
}); 