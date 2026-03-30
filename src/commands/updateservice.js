import { SlashCommandBuilder } from 'discord.js';
import Service from '../models/Service.js';
import { isDbConnected } from '../lib/dbState.js';
import { hasRole } from '../lib/roles.js';
import { logCommand } from '../lib/commandAudit.js';
import logger from '../lib/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('updateservice')
    .setDescription('Update a registered service (Admin only)')
    .addStringOption(o => o.setName('name').setDescription('Service name to update').setRequired(true))
    .addStringOption(o => o.setName('owner').setDescription('New GitHub Owner/Org').setRequired(false))
    .addStringOption(o => o.setName('repo').setDescription('New GitHub Repository').setRequired(false))
    .addStringOption(o => o.setName('workflow').setDescription('New workflow filename').setRequired(false)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ flags: 64 });

      if (!isDbConnected()) {
        return interaction.editReply({ content: '❌ Database offline.' });
      }

      const userId = interaction.user.id;
      const isAdmin = await hasRole(userId, 'admin');
      if (!isAdmin && userId !== process.env.ROOT_USER_ID) {
        return interaction.editReply({ content: '🚫 Only admins can update services.' });
      }

      const name = interaction.options.getString('name');
      const newOwner = interaction.options.getString('owner');
      const newRepo = interaction.options.getString('repo');
      const newWorkflow = interaction.options.getString('workflow');

      const service = await Service.findOne({ name });
      if (!service) {
        return interaction.editReply({ content: `❌ Service **${name}** not found.` });
      }

      // Build update object
      const updates = {};
      if (newOwner || newRepo) {
        const currentParts = service.repo.split('/');
        const owner = newOwner || currentParts[0];
        const repo = newRepo || currentParts[1];
        updates.repo = `${owner}/${repo}`;
      }
      if (newWorkflow) {
        updates.workflow_id = newWorkflow;
      }

      if (Object.keys(updates).length === 0) {
        return interaction.editReply({ content: '⚠️ No changes provided. Use `owner`, `repo`, or `workflow` options.' });
      }

      await Service.updateOne({ name }, { $set: updates });
      const updated = await Service.findOne({ name }).lean();

      await logCommand(userId, 'updateservice', 'success', { name, updates });
      logger.info('Service updated', { userId, name, updates });

      return interaction.editReply({
        content: `✅ **Service Updated!**\nService: \`${name}\`\nRepo: \`${updated.repo}\`\nWorkflow: \`${updated.workflow_id}\``
      });

    } catch (error) {
      logger.error('UpdateService error', { error: error.message });
      try {
        if (interaction.deferred || interaction.replied) {
          return interaction.editReply({ content: `❌ Error: ${error.message}` });
        }
        return interaction.reply({ content: '❌ Error updating service.', flags: 64 });
      } catch (e) {
        logger.error('UpdateService: reply failed', { error: e.message });
      }
    }
  }
};
