import { SlashCommandBuilder, REST, Routes } from 'discord.js';
import dotenv from 'dotenv';
import { logger } from './logger.js';
dotenv.config();
logger.debug('dotenv loaded');

// Load environment variables
const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const guildId = process.env.DISCORD_GUILD_ID;
if (!token || !clientId || !guildId) {
  logger.error('DISCORD_TOKEN, DISCORD_CLIENT_ID, or DISCORD_GUILD_ID is not set in the environment variables.');
  process.exit(1);
}
logger.debug('Environment variables loaded');

// Define slash commands
// Each command file must export both 'data' (SlashCommandBuilder) and 'execute' (function)
const commands = [];
const commandFiles = ['../commands/utility/ping.js', '../commands/utility/sync.js'];
const loadedCommandNames = [];
logger.debug('Starting command file import loop');
for (const file of commandFiles) {
  logger.debug(`Attempting to import command file: ${file}`);
  try {
    const cmdModule = await import(file);
    logger.debug(`Imported command file: ${file}`);
    if (!cmdModule || !cmdModule.data) {
      logger.warn(`Command file ${file} is empty or missing 'data' export. Skipping.`);
      continue;
    }
    if (loadedCommandNames.includes(cmdModule.data.name)) {
      logger.warn(`Duplicate command name detected: ${cmdModule.data.name}. Skipping.`);
      continue;
    }
    commands.push(cmdModule.data);
    loadedCommandNames.push(cmdModule.data.name);
    logger.debug(`Loaded command: ${cmdModule.data.name}`);
  } catch (err) {
    logger.error(`Failed to load command file ${file}:`, err);
  }
}
logger.info(`Syncing the following commands: ${loadedCommandNames.join(', ') || '(none)'}`);
logger.debug('Command import loop complete');
const commandData = commands.map(command => command.toJSON());
const commandNames = commands.map(command => command.name);
const rest = new REST().setToken(token);
logger.debug('REST client created');

// Register slash commands with Discord
export async function syncCommands() {
  logger.debug('syncCommands() called');
  try {
    logger.info('Started refreshing application (/) commands.');
    // Fetch currently registered commands
    const currentCommands = await rest.get(Routes.applicationGuildCommands(clientId, guildId));
    logger.debug('Fetched current commands from Discord');
    // Find commands to delete (registered but not in local commands)
    const toDelete = currentCommands.filter(cmd => !commandNames.includes(cmd.name));
    logger.debug(`Commands to delete: ${toDelete.map(c => c.name).join(', ')}`);
    // Delete removed commands
    for (const cmd of toDelete) {
      logger.info(`Deleting command: ${cmd.name}`);
      await rest.delete(Routes.applicationGuildCommand(clientId, guildId, cmd.id));
    }
    // Register/update current commands
    logger.debug('Registering/updating current commands');
    await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
      body: commandData,
    });
    logger.info('Successfully reloaded application (/) commands.');
    logger.debug('Commands registered successfully');
    return { success: true };
  } catch (error) {
    logger.error('syncCommands() error:', error);
    return { success: false, error };
  }
}

// Only run main() if this file is executed directly, not when imported
if (import.meta.url === process.argv[1] || import.meta.url === `file://${process.argv[1]}`) {
  logger.debug('main() entrypoint');
  (async () => {
    const result = await syncCommands();
    if (!result.success) {
      logger.error('Failed to sync commands:', result.error);
      process.exit(1);
    }
    logger.debug('main() finished successfully');
    process.exit(0);
  })();
}

// Command execution handler (not used in index.js, but exported for modularity)
export async function execute(interaction) {
  if (!interaction || typeof interaction.isCommand !== 'function' || !interaction.isCommand()) {
    logger.warn('execute() called with invalid or non-command interaction');
    return;
  }
  const { commandName } = interaction;
  if (!commandNames.includes(commandName)) {
    logger.warn(`Interaction commandName not found: ${commandName}`);
    return;
  }
  try {
    await interaction.deferReply();
    const command = commands.find(cmd => cmd.name === commandName);
    if (!command || typeof command.execute !== 'function') {
      logger.error(`No valid execute function for command: ${commandName}`);
      await interaction.editReply({
        content: 'This command is not implemented correctly!',
        ephemeral: true,
      });
      return;
    }
    logger.debug(`Executing command: ${commandName}`);
    await command.execute(interaction);
  } catch (error) {
    logger.error('execute() error:', error);
    await interaction.editReply({
      content: 'There was an error while executing this command!',
      ephemeral: true,
    });
  }
}

export default commands;
