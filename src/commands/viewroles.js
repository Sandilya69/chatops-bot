import { SlashCommandBuilder } from 'discord.js';
import Role from '../models/Role.js';
import logger from '../lib/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('viewroles')
    .setDescription('List all user roles from the database'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Fetch all roles from database
      const roles = await Role.find({}).sort({ userId: 1 }).lean();

      if (!roles || roles.length === 0) {
        return interaction.editReply({
          content: '📜 No roles found in database.'
        });
      }

      // Format the roles list
      let message = '📜 **Roles in Database:**\n\n';
      roles.forEach((r, index) => {
        message += `${index + 1}. \`${r.userId}\` — **${r.role}**\n`;
      });

      // Discord message limit is 2000 chars, split if needed
      if (message.length > 2000) {
        message = message.substring(0, 1997) + '...';
      }

      return interaction.editReply({ content: message });

    } catch (error) {
      logger.error('ViewRoles command error', { error: error.message });
      
      try {
        if (interaction.deferred || interaction.replied) {
          return interaction.editReply({
            content: `❌ Error fetching roles: ${error.message}`
          });
        }
        
        return interaction.reply({
          content: '❌ Error fetching roles.',
          flags: 64
        });
      } catch (replyErr) {
        logger.error('ViewRoles: Failed to send error reply', { error: replyErr.message });
      }
    }
  }
};
