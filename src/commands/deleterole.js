import { SlashCommandBuilder } from 'discord.js';
import Role from '../models/Role.js';

export default {
  data: new SlashCommandBuilder()
    .setName('deleterole')
    .setDescription('Delete a user role from the database')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('Discord user ID')
        .setRequired(true)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.options.getString('user_id');

      // Try to delete the role
      const result = await Role.deleteOne({ userId });

      if (result.deletedCount === 0) {
        return interaction.editReply({
          content: `⚠️ No record found for user_id: ${userId}`
        });
      }

      return interaction.editReply({
        content: `🗑️ Role deleted for user_id: ${userId}`
      });

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('DeleteRole command error:', error);
      
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
