import { SlashCommandBuilder } from 'discord.js';
import Role from '../models/Role.js';
import { hasRole } from '../lib/roles.js';
import { logCommand } from '../lib/commandAudit.js';
import logger from '../lib/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('deleterole')
    .setDescription('Delete a user role from the database (Admin only)')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('Discord user ID')
        .setRequired(true)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Check if the executor is an admin
      const executorId = interaction.user.id;
      const isAdmin = await hasRole(executorId, 'admin');
      if (!isAdmin && executorId !== process.env.ROOT_USER_ID) {
        return interaction.editReply({ 
          content: '🚫 Only admins can delete roles.' 
        });
      }

      const userId = interaction.options.getString('user_id');

      // Try to delete the role
      const result = await Role.deleteOne({ userId });

      if (result.deletedCount === 0) {
        return interaction.editReply({
          content: `⚠️ No record found for user_id: ${userId}`
        });
      }

      await logCommand(executorId, 'deleterole', 'success', { targetUser: userId });
      logger.info('Role deleted', { executorId, targetUser: userId });

      return interaction.editReply({
        content: `🗑️ Role deleted for user_id: ${userId}`
      });

    } catch (error) {
      logger.error('DeleteRole command error', { error: error.message });
      
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          content: `❌ Error deleting role: ${error.message}`
        });
      }
      
      return interaction.reply({
        content: '❌ Error deleting role.',
        ephemeral: true
      });
    }
  }
};
