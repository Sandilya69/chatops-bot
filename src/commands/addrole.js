import { SlashCommandBuilder } from 'discord.js';
import Role from '../models/Role.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a new user role to the database')
    .addStringOption(option =>
      option.setName('user_id')
        .setDescription('Discord user ID')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('role')
        .setDescription('Role to assign')
        .setRequired(true)
        .addChoices(
          { name: 'admin', value: 'admin' },
          { name: 'developer', value: 'developer' },
          { name: 'tester', value: 'tester' },
          { name: 'viewer', value: 'viewer' }
        )),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const userId = interaction.options.getString('user_id');
      const role = interaction.options.getString('role');

      // Check if role already exists for this user
      const existingRole = await Role.findOne({ userId });
      if (existingRole) {
        return interaction.editReply({
          content: `⚠️ Role already exists for user_id: ${userId} (${existingRole.role}). Use /deleterole first to update.`
        });
      }

      // Insert new role
      await Role.create({ userId, role });

      return interaction.editReply({
        content: `✅ Role added successfully for user_id: ${userId} (${role})`
      });

    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('AddRole command error:', error);
      
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({
          content: `❌ Error adding role: ${error.message}`
        });
      }
      
      return interaction.reply({
        content: '❌ Error adding role.',
        ephemeral: true
      });
    }
  }
};
