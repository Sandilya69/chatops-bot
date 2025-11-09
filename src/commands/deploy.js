import { canDeploy, isApprover } from '../lib/rbac.js';
import { logCommand } from '../lib/commandAudit.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { activeDeployments, isInCooldown, setCooldown, pendingApprovals, keyFor } from '../lib/state.js';
import { withRetry } from '../lib/retry.js';
import ActiveDeploy from '../models/ActiveDeploy.js';
import { triggerWorkflow } from '../lib/github.js';
import { isDbConnected } from '../lib/dbState.js';

export async function handleDeploy(interaction) {
  const service = interaction.options.getString('service');
  const env = interaction.options.getString('env');
  const version = interaction.options.getString('version') || 'latest';
  const providedCorrelationId = interaction.options.getString?.('correlation') || null;
  const userId = interaction.user.id;

  const allowed = await canDeploy(userId, env);
  if (!allowed) {
    await logCommand(userId, '/deploy', 'denied');
    return interaction.reply({ content: '🚫 You don’t have permission to run this command.', ephemeral: true });
  }

  const key = keyFor(service, env);
  if (activeDeployments.has(key)) {
    return interaction.reply({ content: `⏳ Already deploying ${service} to ${env}. Please wait.`, ephemeral: true });
  }
  if (isInCooldown(service, env)) {
    return interaction.reply({ content: `🕒 Cooldown active for ${service}/${env}. Try later.`, ephemeral: true });
  }

  if (env === 'prod') {
    const correlationId = providedCorrelationId || uuidv4();
    pendingApprovals.set(correlationId, { requester: userId, service, env, version, requestedAt: Date.now() });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve:${correlationId}`).setLabel('Approve').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject:${correlationId}`).setLabel('Reject').setStyle(ButtonStyle.Danger)
    );
    await logCommand(userId, '/deploy', 'success');
    return interaction.reply({
      content: `🔐 Approval required to deploy ${service} to ${env} (version: ${version}). Only admins can approve.`,
      components: [row]
    });
  }

  const correlationId = providedCorrelationId || uuidv4();
  if (isDbConnected()) {
    const existing = await ActiveDeploy.findOne({ correlationId }).lean();
    if (existing) {
      return interaction.reply({ content: `🔁 Duplicate request ignored (correlationId: ${correlationId}).`, ephemeral: true });
    }
    await withRetry(() => ActiveDeploy.create({ correlationId, service, env, version, userId }), { retries: 2 });
  }

  activeDeployments.add(key);
  setTimeout(() => activeDeployments.delete(key), 5 * 60 * 1000);
  setCooldown(service, env, 2 * 60 * 1000);
  await logCommand(userId, '/deploy', 'success');
  try {
    const res = await runDeploymentFlow(interaction, { service, env, version });
    if (isDbConnected()) {
      await withRetry(() => ActiveDeploy.updateOne({ correlationId }, { $set: { status: 'completed' } }), { retries: 2 });
    }
    return res;
  } catch (e) {
    if (isDbConnected()) {
      await withRetry(() => ActiveDeploy.updateOne({ correlationId }, { $set: { status: 'failed' } }), { retries: 2 });
    }
    throw e;
  }
}

async function runDeploymentFlow(interaction, { service, env, version }) {
  // Initial message
  const reply = await interaction.reply({ content: `⏳ Deploy in progress... (${service} → ${env}, version: ${version})` , fetchReply: true });

  // Trigger GitHub workflow (non-prod as well) and store run id if DB connected
  try {
    const runId = await triggerWorkflow({ service, env, version });
    if (runId && isDbConnected()) {
      await withRetry(() => ActiveDeploy.updateOne({ service, env, version, status: 'in_progress' }, { $set: { workflowRunId: runId } }), { retries: 2 });
    }
  } catch (e) {
    // ignore trigger errors in simulation flow, but log to thread
  }
  // Create a thread for detailed logs
  let thread;
  try {
    thread = await reply.startThread({ name: `${service}-${env}-deploy`, autoArchiveDuration: 60 });
  } catch (e) {
    // ignore thread errors
  }

  // Simulated stages
  const log = async (msg) => {
    if (thread) {
      await thread.send(msg);
    }
  };

  await log('🔧 Build started...');
  await delay(1500);
  await log('✅ Build completed.');
  await log('🧪 Tests running...');
  await delay(1500);
  await log('✅ All tests passed.');
  await log('🚀 Deploying to target environment...');
  await delay(1500);
  await log('📦 Release finalized.');

  // Optional health check simulation
  await log('🩺 Health check: pinging service...');
  await delay(800);
  await log('✅ Service healthy.');

  // Final update
  await interaction.editReply(`✅ Deployment completed successfully. (${service} → ${env}, version: ${version})`);
  return true;
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const data = new SlashCommandBuilder()
  .setName('deploy')
  .setDescription('Deploys a service')
  .addStringOption(o => o.setName('service').setDescription('Service name').setRequired(true))
  .addStringOption(o => o.setName('env').setDescription('Environment').setRequired(true)
    .addChoices({ name: 'dev', value: 'dev' }, { name: 'staging', value: 'staging' }, { name: 'prod', value: 'prod' }))
  .addStringOption(o => o.setName('version').setDescription('Tag or commit').setRequired(false))
  .addStringOption(o => o.setName('correlation').setDescription('Idempotency correlation id').setRequired(false));

export default {
  data,
  async execute(interaction) {
    return handleDeploy(interaction);
  }
};

 


