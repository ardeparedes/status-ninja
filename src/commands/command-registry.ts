import { Command } from './command-interface';
import { createStartCommand, createHelpCommand } from './help-command';
import { createAddApiCommand } from './add-api-command';
import { createListApisCommand } from './list-apis-command';
import { createDeleteApiCommand } from './delete-api-command';
import { createSubscribeCommand, createUnsubscribeCommand } from './subscription-commands';

/**
 * Creates a registry of all available commands following DIP
 */
export const createCommandRegistry = () => {
  const commands: Map<string, Command> = new Map();
  
  /**
   * Register a command
   */
  const registerCommand = (command: Command): void => {
    commands.set(command.name, command);
  };
  
  // Register all available commands
  const registerInitialCommands = () => {
    registerCommand(createStartCommand());
    registerCommand(createHelpCommand());
    registerCommand(createAddApiCommand());
    registerCommand(createListApisCommand());
    registerCommand(createDeleteApiCommand());
    registerCommand(createSubscribeCommand());
    registerCommand(createUnsubscribeCommand());
  };
  
  /**
   * Get a command by name
   */
  const getCommand = (name: string): Command | undefined => {
    return commands.get(name);
  };
  
  /**
   * Check if a command exists
   */
  const hasCommand = (name: string): boolean => {
    return commands.has(name);
  };
  
  /**
   * Get all registered commands
   */
  const getAllCommands = (): Command[] => {
    return Array.from(commands.values());
  };
  
  // Register the initial commands
  registerInitialCommands();
  
  return {
    registerCommand,
    getCommand,
    hasCommand,
    getAllCommands
  };
}; 