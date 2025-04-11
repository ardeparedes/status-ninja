import { Command } from './command-interface';
import { StartCommand, HelpCommand } from './help-command';
import { AddApiCommand } from './add-api-command';
import { ListApisCommand } from './list-apis-command';
import { DeleteApiCommand } from './delete-api-command';
import { SubscribeCommand, UnsubscribeCommand } from './subscription-commands';

/**
 * Registry for all available commands following DIP
 */
export class CommandRegistry {
  private commands: Map<string, Command> = new Map();
  
  constructor() {
    // Register all available commands
    this.registerCommand(new StartCommand());
    this.registerCommand(new HelpCommand());
    this.registerCommand(new AddApiCommand());
    this.registerCommand(new ListApisCommand());
    this.registerCommand(new DeleteApiCommand());
    this.registerCommand(new SubscribeCommand());
    this.registerCommand(new UnsubscribeCommand());
  }
  
  /**
   * Register a command
   */
  registerCommand(command: Command): void {
    this.commands.set(command.name, command);
  }
  
  /**
   * Get a command by name
   */
  getCommand(name: string): Command | undefined {
    return this.commands.get(name);
  }
  
  /**
   * Check if a command exists
   */
  hasCommand(name: string): boolean {
    return this.commands.has(name);
  }
  
  /**
   * Get all registered commands
   */
  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }
} 