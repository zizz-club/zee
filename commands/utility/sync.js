// This command should call the cmd-handler.js file to update the commands
import { SlashCommandBuilder } from 'discord.js';
import { logger } from '../../utility/logger.js';

export const data = new SlashCommandBuilder()
  .setName('sync')
  .setDescription('Synchronize the bot\'s commands with Discord\'s API.');

// Execute the sync command, which triggers a reload of all commands
export async function execute(interaction) {
  // Validate the interaction
  if (!interaction || typeof interaction.isCommand !== 'function' || !interaction.isCommand()) {
    logger.warn('sync.js execute() called with invalid or non-command interaction');
    return;
  }
  logger.debug('sync command received');
  await interaction.reply({ content: 'Synchronizing commands...' });
  try {
    // Dynamically import to avoid circular dependency
    const { syncCommands } = await import('../../utility/cmd-handler.js');
    if (typeof syncCommands !== 'function') {
      logger.error('syncCommands is not a function in cmd-handler.js');
      await interaction.editReply('❌ Internal error: syncCommands not available.');
      return;
    }
    const result = await syncCommands();
    if (result && result.success) {
      await interaction.editReply('✅ Commands synchronized successfully!');
    } else {
      await interaction.editReply('❌ Failed to synchronize commands. Check logs for details.');
    }
  } catch (err) {
    logger.error('Error running syncCommands:', err);
    await interaction.editReply('❌ An error occurred while synchronizing commands.');
  }
  logger.debug('sync command executed');
}