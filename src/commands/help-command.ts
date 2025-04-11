import { Command } from './command-interface';
import { Database } from '../db';

/**
 * Help command handler
 */
export class HelpCommand implements Command {
  name = '/help';
  
  async execute(_chatId: number, _args: string[], _db: Database, _botToken: string, _userId?: number): Promise<string> {
    return `🥷 Status Ninja Bot Help

Available commands:
⚔️ /add <name> <url> - Add a new API to monitor
📜 /list - List your monitored APIs
🔪 /delete <name> - Delete one of your APIs
👁️ /subscribe <api_name> - Subscribe this chat to an API
💨 /unsubscribe <api_name> - Unsubscribe this chat from an API
🥋 /help - Show this help message

Made with 🗡️ for API monitoring`;
  }
}

/**
 * Start command handler (alias for Help)
 */
export class StartCommand implements Command {
  name = '/start';
  
  async execute(chatId: number, args: string[], db: Database, botToken: string, userId?: number): Promise<string> {
    const helpCommand = new HelpCommand();
    return helpCommand.execute(chatId, args, db, botToken, userId);
  }
} 