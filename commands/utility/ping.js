// Import the SlashCommandBuilder from discord.js
import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utility/logger.js';

// Define the ping command data
export const data = new SlashCommandBuilder()
  .setName('ping')
  .setDescription('Replies with Pong and latency.');

// Execute the ping command and reply with latency
export async function execute(interaction) {
  // Validate the interaction
  if (!interaction || typeof interaction.isCommand !== 'function' || !interaction.isCommand()) {
    logger.warn('ping.js execute() called with invalid or non-command interaction');
    return;
  }
  logger.debug('ping command received');
  await interaction.reply({ content: 'Pinging...' });
  const sent = await interaction.fetchReply();
  const latency = sent.createdTimestamp - interaction.createdTimestamp;
  logger.debug(`Calculated latency: ${latency}ms`);
  await interaction.editReply(`🏓 Pong! Latency: ${latency}ms`);
}
