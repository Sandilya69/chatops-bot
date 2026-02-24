import { SlashCommandBuilder } from 'discord.js';
import Role from '../models/Role.js';
import { hasRole } from '../lib/roles.js';
import { logCommand } from '../lib/commandAudit.js';
import logger from '../lib/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('addrole')
    .setDescription('Add a new user role (Admin only)')
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

      // Check if the executor is an admin
      const executorId = interaction.user.id;
      const isAdmin = await hasRole(executorId, 'admin');
      if (!isAdmin && executorId !== process.env.ROOT_USER_ID) {
        await logCommand(executorId, 'addrole', 'denied');
        return interaction.editReply({ 
          content: '🚫 Only admins can add roles.' 
        });
      }

      const userId = interaction.options.getString('user_id');
      const role = interaction.options.getString('role');

      // Check if role already exists for this user
      const existingRole = await Role.findOne({ userId });
      if (existingRole) {
        return interaction.editReply({
          content: `⚠️ Role already exists for user_id: ${userId} (${existingRole.role}). Use /deleterole first to update.`
        });
      }

      await Role.create({ userId, role });
      await logCommand(executorId, 'addrole', 'success', { targetUser: userId, roleAssigned: role });
      logger.info('Role added', { executorId, targetUser: userId, role });

      return interaction.editReply({
        content: `✅ Role added successfully for user_id: ${userId} (${role})`
      });

    } catch (error) {
      logger.error('AddRole command error', { error: error.message });
      
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
