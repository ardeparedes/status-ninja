import { Database } from '../db';

/**
 * Interface for command handlers, following Command Pattern and OCP
 */
export interface Command {
  /**
   * The command name (e.g. /start, /help)
   */
  name: string;
  
  /**
   * Execute the command with given arguments and return a message
   */
  execute(
    chatId: number, 
    args: string[], 
    db: Database, 
    botToken: string,
    userId?: number
  ): Promise<string>;
}

/**
 * Type for a telegram message structure
 */
export interface TelegramMessage {
  message_id: number;
  from: {
    id: number;
    first_name: string;
    username?: string;
  };
  chat: {
    id: number;
    type: string;
    title?: string;
    first_name?: string;
    username?: string;
  };
  date: number;
  edit_date?: number;
  text?: string;
}

/**
 * Command arguments parser
 */
export function parseCommand(text: string): { command: string; args: string[] } {
  const parts = text.split(' ');
  const command = parts[0].toLowerCase();
  const args = parts.slice(1).filter(arg => arg.trim() !== '');
  return { command, args };
} 