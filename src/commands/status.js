import { SlashCommandBuilder } from 'discord.js';
import { getRunStatus } from '../lib/github.js';
import ActiveDeploy from '../models/ActiveDeploy.js';

export default {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('Check GitHub Actions workflow status')
    .addStringOption(o => o.setName('correlation').setDescription('Correlation ID').setRequired(false))
    .addIntegerOption(o => o.setName('run_id').setDescription('Workflow run id').setRequired(false)),

  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      const corr = interaction.options.getString('correlation');
      const runIdInput = interaction.options.getInteger('run_id');
      let runId = runIdInput;
      if (!runId && corr) {
        const rec = await ActiveDeploy.findOne({ correlationId: corr }).lean();
        runId = rec?.workflowRunId;
      }
      if (!runId) {
        return interaction.editReply({ content: 'Please provide run_id or correlation.' });
      }
      const data = await getRunStatus(runId);
      const txt = `Run #${runId}: status=${data.status}, conclusion=${data.conclusion || 'n/a'}\n${data.html_url}`;
      return interaction.editReply({ content: txt });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Status command error:', err);
      if (interaction.deferred || interaction.replied) {
        return interaction.editReply({ content: '⚠️ Failed to fetch status.' });
      }
      return interaction.reply({ content: '⚠️ Failed to fetch status.', ephemeral: true });
    }
  }
};


