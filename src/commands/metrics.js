import { SlashCommandBuilder } from 'discord.js';
import CommandAudit from '../models/CommandAudit.js';

export default {
  data: new SlashCommandBuilder()
    .setName('metrics')
    .setDescription('Show ChatOps command and deployment metrics'),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      // eslint-disable-next-line no-console
      console.log('[METRICS] querying audit logs...');
      const total = await CommandAudit.countDocuments({});
      const success = await CommandAudit.countDocuments({ status: 'success' });
      const failed = await CommandAudit.countDocuments({ status: { $in: ['failed', 'denied', 'error'] } });
      // eslint-disable-next-line no-console
      console.log('[METRICS] counts:', { total, success, failed });
      const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

      return interaction.editReply(
        `📊 Metrics Summary\nTotal: ${total}\n✅ Success: ${success}\n❌ Failed: ${failed}\n📈 Success Rate: ${successRate}%`
      );
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Metrics command error:', e);
      return interaction.editReply('❌ Error fetching metrics.');
    }
  }
};


