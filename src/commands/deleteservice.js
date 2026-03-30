import { SlashCommandBuilder } from 'discord.js';
import Service from '../models/Service.js';
import { isDbConnected } from '../lib/dbState.js';
import { hasRole } from '../lib/roles.js';
import { logCommand } from '../lib/commandAudit.js';
import logger from '../lib/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('deleteservice')
    .setDescription('Delete a registered service (Admin only)')
    .addStringOption(o => o.setName('name').setDescription('Service name to delete').setRequired(true)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: 64 });

      if (!isDbConnected()) {
        return interaction.editReply({ content: '❌ Database offline.' });
      }

      const userId = interaction.user.id;
      const isAdmin = await hasRole(userId, 'admin');
      if (!isAdmin && userId !== process.env.ROOT_USER_ID) {
        return interaction.editReply({ content: '🚫 Only admins can delete services.' });
      }

      const name = interaction.options.getString('name');
      const service = await Service.findOne({ name }).lean();

      if (!service) {
        return interaction.editReply({ content: `❌ Service **${name}** not found.` });
      }

      await Service.deleteOne({ name });

      await logCommand(userId, 'deleteservice', 'success', { name, repo: service.repo });
      logger.info('Service deleted', { userId, name, repo: service.repo });

      return interaction.editReply({
        content: `🗑️ **Service Deleted!**\nService: \`${name}\`\nRepo: \`${service.repo}\`\n\nYou can re-register it using \`/addservice\`.`
      });

    } catch (error) {
      logger.error('DeleteService error', { error: error.message });
      try {
        if (interaction.deferred || interaction.replied) {
          return interaction.editReply({ content: `❌ Error: ${error.message}` });
        }
        return interaction.reply({ content: '❌ Error deleting service.', flags: 64 });
      } catch (e) {
        logger.error('DeleteService: reply failed', { error: e.message });
      }
    }
  }
};
