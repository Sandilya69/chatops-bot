import { SlashCommandBuilder } from 'discord.js';
import CommandAudit from '../models/CommandAudit.js';
import logger from '../lib/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('metrics')
    .setDescription('Show ChatOps command and deployment metrics'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      logger.info('[METRICS] querying audit logs...');
      const total = await CommandAudit.countDocuments({});
      const success = await CommandAudit.countDocuments({ status: 'success' });
      const failed = await CommandAudit.countDocuments({ status: { $in: ['failed', 'denied', 'error'] } });
      logger.info('[METRICS] counts', { total, success, failed });
      const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

      return interaction.editReply(
        `📊 Metrics Summary\nTotal: ${total}\n✅ Success: ${success}\n❌ Failed: ${failed}\n📈 Success Rate: ${successRate}%`
      );
    } catch (e) {
      logger.error('Metrics command error', { error: e.message });
      return interaction.editReply('❌ Error fetching metrics.');
    }
  }
};


