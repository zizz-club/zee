// index.js
import dotenv from 'dotenv';
import { logger } from './utility/logger.js';
import { setBotStatus, startStatusRotation } from './utility/status.js';
import { Client, GatewayIntentBits, REST } from 'discord.js';

// Enable or disable debug logging globally
// Set to true to enable debug logs, false to disable them
globalThis.DEBUG_MODE = true;

// --- Bot Status Configuration ---
// List of statuses to rotate through after startup
// Each object:
// message: 'The message to display'
// status: 'online' | 'idle' | 'dnd' | 'invisible',
// type: 0 = Playing, 1 = Streaming, 2 = Listening, 3 = Watching, 4 = Custom
// Example:
/*
globalThis.BOT_STATUSES = [
	{
		message: 'The bot is online! and Playing',
		status: 'online',
		type: 0
	},
	{
		message: 'The bot is idle! and Watching',
		status: 'idle',
		type: 3
	},
	{
		message: 'The bot is busy! and Streaming',
		status: 'dnd',
		type: 1
	},
];
*/
globalThis.BOT_STATUSES = [
  {
    message: 'Online!',
    status: 'online',
    type: 4
  },
  {
    message: '/ping',
    status: 'online',
    type: 0
  },
];
// Interval (ms) for rotating statuses
// 1000ms = 1s
// If only one status, no rotation will occur
globalThis.BOT_STATUS_INTERVAL = 30000;
// Status to show during startup
// type: 4 = Custom, see discord.js ActivityType
// status: 'online' | 'idle' | 'dnd' | 'invisible'
globalThis.BOT_STARTUP_STATUS = {
  message: 'Starting up...',
  status: 'dnd',
  type: 4
};

// --- Environment Setup ---
dotenv.config();
logger.debug('dotenv loaded');

// --- Discord Token ---
const token = process.env.DISCORD_TOKEN;
if (!token) {
  logger.error('DISCORD_TOKEN is not set in the environment variables.');
  process.exit(1);
}
logger.debug('Discord token loaded');

// --- Discord Client Setup ---
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
logger.debug('Discord client created');

// --- Bot Ready Event ---
client.once('ready', async () => {
  logger.info(`Logged in as ${client.user.tag}`);
  // Wait a moment to ensure Discord is ready for presence update
  await new Promise(res => setTimeout(res, 2000));
  await setBotStatus(client, globalThis.BOT_STARTUP_STATUS);
  logger.debug('Startup status set');
  try {
    // Dynamically import and update commands after ready
    await import('./utility/cmd-handler.js');
    logger.debug('cmd-handler.js imported successfully');
    // Wait a moment before starting status rotation
    await new Promise(res => setTimeout(res, 1000));
    startStatusRotation(client, globalThis.BOT_STATUSES, globalThis.BOT_STATUS_INTERVAL);
  } catch (error) {
    logger.error('Error updating commands:', error);
    // Set status to 'Error loading!' if failed
    await setBotStatus(client, { message: 'Error loading!', status: 'idle', type: 0 });
  }
});

// --- Command Loading ---
const commandFiles = [
  './commands/utility/ping.js',
  './commands/utility/sync.js',
];
logger.debug('Command files loaded');

const commands = [];
for (const file of commandFiles) {
  try {
    const cmdModule = await import(file);
    if (!cmdModule || !cmdModule.data) {
      logger.warn(`Command file ${file} is empty or missing 'data' export. Skipping.`);
      continue;
    }
    if (typeof cmdModule.data.name !== 'string' || !cmdModule.execute || typeof cmdModule.execute !== 'function') {
      logger.warn(`Command file ${file} is missing a valid name or execute function. Skipping.`);
      continue;
    }
    commands.push(cmdModule);
    logger.debug(`Loaded command: ${cmdModule.data.name}`);
  } catch (err) {
    logger.error(`Failed to load command file ${file}:`, err);
  }
}
logger.debug('Commands imported successfully');

// --- Command Handler ---
client.on('interactionCreate', async interaction => {
  if (!interaction.isCommand()) return;
  const command = commands.find(cmd => cmd.data && cmd.data.name === interaction.commandName);
  if (!command) {
    logger.debug(`Command not found: ${interaction.commandName}`);
    return;
  }
  try {
    logger.debug(`Executing command: ${interaction.commandName}`);
    await command.execute(interaction);
  } catch (error) {
    logger.error(`Error executing command ${interaction.commandName}:`, error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
    } else {
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  }
});

// --- Bot Login ---
client.login(token);
logger.debug('client.login called');
