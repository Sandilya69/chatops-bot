import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import ActiveDeploy from '../models/ActiveDeploy.js';
import { canDeploy } from '../lib/rbac.js';
import { logCommand } from '../lib/commandAudit.js';
import logger from '../lib/logger.js';

export async function handleRollback(interaction) {
  const service = interaction.options.getString('service');
  const env = 'prod'; // Rollbacks are typically for prod emergencies
  const userId = interaction.user.id;

  // 1. RBAC Check
  const allowed = await canDeploy(userId, env);
  if (!allowed) {
    await logCommand(userId, 'rollback', 'denied', { service, env });
    logger.warn('Rollback denied by RBAC', { userId, service });
    return interaction.reply({ content: '🚫 Rollback is a protected action. Only authorized users can perform it.', ephemeral: true });
  }

  // 2. Find last successful deploy for this service/env
  const lastSuccess = await ActiveDeploy.findOne({ service, env, status: 'completed' }).sort({ createdAt: -1 }).lean();

  if (!lastSuccess) {
    return interaction.reply({ content: `❌ No successful deployment found for **${service}** in **${env}** to rollback to.`, ephemeral: true });
  }

  const version = lastSuccess.version;
  const commitSha = lastSuccess.commitSha || version;

  // 3. Confirmation UI
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`confirm_rollback:${service}:${commitSha}`).setLabel(`🚨 CONFIRM ROLLBACK to ${version}`).setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId('cancel_rollback').setLabel('Cancel').setStyle(ButtonStyle.Secondary)
  );

  await logCommand(userId, 'rollback', 'success', { service, env, targetVersion: version });
  logger.info('Rollback confirmation requested', { userId, service, version });

  await interaction.reply({
    content: `⚠️ **ROLLBACK REQUEST** ⚠️\n\n**Service:** ${service}\n**Target:** ${env}\n**Reverting To:** ${version} (SHA: ${commitSha})\n\nAre you sure? This will immediately re-deploy this version.`,
    components: [row],
    ephemeral: true
  });
}

const data = new SlashCommandBuilder()
  .setName('rollback')
  .setDescription('Revert a service to the last known good version (Step 8)')
  .addStringOption(o => o.setName('service').setDescription('Service name to rollback').setRequired(true));

export default {
  data,
  async execute(interaction) {
    return handleRollback(interaction);
  }
};
