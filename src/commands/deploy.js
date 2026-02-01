import { canDeploy, isApprover } from '../lib/rbac.js';
import { logCommand } from '../lib/commandAudit.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder } from 'discord.js';
import { v4 as uuidv4 } from 'uuid';
import { activeDeployments, isInCooldown, setCooldown, pendingApprovals, keyFor } from '../lib/state.js';
import { withRetry } from '../lib/retry.js';
import ActiveDeploy from '../models/ActiveDeploy.js';
import { triggerWorkflow } from '../lib/github.js';
import { isDbConnected } from '../lib/dbState.js';
import { pollWorkflowStatus } from '../lib/statusPoller.js';
import { deploymentCounter, deploymentDuration } from '../lib/metrics.js';

import { isRateLimited, getRemainingCooldown } from '../lib/rateLimiter.js';

import Service from '../models/Service.js';

export async function handleDeploy(interaction) {
  const serviceName = interaction.options.getString('service');
  const env = interaction.options.getString('env');
  const version = interaction.options.getString('version') || 'latest';
  const providedCorrelationId = interaction.options.getString?.('correlation') || null;
  const userId = interaction.user.id;

  // Step 9: Multi-Repo Lookup
  let serviceDetails = null;
  if (isDbConnected()) {
      serviceDetails = await Service.findOne({ name: serviceName }).lean();
  }

  // Fallback for demo/legacy: use env vars if service not in DB
  if (!serviceDetails && process.env.GITHUB_REPO) {
      serviceDetails = {
          repo: process.env.GITHUB_REPO,
          workflow_id: 'deploy.yml'
      };
  }

  if (!serviceDetails) {
      return interaction.reply({ content: `❌ Error: Service **${serviceName}** is not registered in the database.`, ephemeral: true });
  }

  // Step 6: Rate Limiting
  if (isRateLimited(userId, serviceName, 30000)) {
      const remaining = getRemainingCooldown(userId, serviceName, 30000);
      return interaction.reply({ content: `⚠️ **Rate Limit Active!** Please wait ${remaining}s before deploying **${serviceName}** again.`, ephemeral: true });
  }

  const allowed = await canDeploy(userId, env);
  if (!allowed) {
    await logCommand(userId, '/deploy', 'denied');
    return interaction.reply({ content: '🚫 You don’t have permission to run this command.', ephemeral: true });
  }

  const key = keyFor(serviceName, env);
  if (activeDeployments.has(key)) {
    return interaction.reply({ content: `⏳ Already deploying ${serviceName} to ${env}. Please wait.`, ephemeral: true });
  }
  if (isInCooldown(serviceName, env)) {
    return interaction.reply({ content: `🕒 Cooldown active for ${serviceName}/${env}. Try later.`, ephemeral: true });
  }

  if (env === 'prod') {
    const correlationId = providedCorrelationId || uuidv4();
    pendingApprovals.set(correlationId, { requester: userId, service: serviceName, env, version, requestedAt: Date.now() });
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId(`approve:${correlationId}`).setLabel('Approve').setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId(`reject:${correlationId}`).setLabel('Reject').setStyle(ButtonStyle.Danger)
    );
    await logCommand(userId, '/deploy', 'success');
    return interaction.reply({
      content: `🔐 Approval required to deploy ${serviceName} to ${env} (version: ${version}). Only admins can approve.`,
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
  setCooldown(serviceName, env, 2 * 60 * 1000);
  await logCommand(userId, '/deploy', 'success');
  try {
    const res = await runDeploymentFlow(interaction, { service: serviceName, env, version, serviceDetails, correlationId });
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

async function runDeploymentFlow(interaction, { service, env, version, serviceDetails, correlationId }) {
  // Initial message
  const reply = await interaction.reply({ content: `⏳ **Deploy Initiated (v4 Polling Mode)**\n**Service:** ${service}\n**Env:** ${env}\n**Version:** ${version}` , fetchReply: true });

  const startTime = Date.now();
  let thread;
  try {
    thread = await reply.startThread({ name: `${service}-${env}-deploy`, autoArchiveDuration: 60 });
  } catch (e) {
    // ignore thread errors
  }

  const log = async (msg) => {
    if (thread) await thread.send(msg);
  };

  if (isDbConnected()) {
      await withRetry(() => ActiveDeploy.updateOne({ correlationId }, { $set: { threadId: thread?.id, channelId: interaction.channelId } }), { retries: 2 });
  }

  // Trigger GitHub workflow
  try {
    const runId = await triggerWorkflow({ 
        service, 
        env, 
        version,
        repoInfo: { owner: serviceDetails?.owner, repo: serviceDetails?.repo },
        workflowId: serviceDetails?.workflow_id
    });
    
    if (!runId) {
      throw new Error('GitHub API returned no run ID. Check tokens or workflow file.');
    }

    await log(`🚀 Workflow Dispatched! Run ID: ${runId}`);
    if (isDbConnected()) {
      await withRetry(() => ActiveDeploy.updateOne({ service, env, version, status: 'in_progress' }, { $set: { workflowRunId: runId } }), { retries: 2 });
    }

    // Start Polling (Step 4)
    await log('⏳ Waiting for workflow completion...');
    let lastStatus = '';
    const repoInfo = { owner: serviceDetails?.owner, repo: serviceDetails?.repo };
    const result = await pollWorkflowStatus(runId, repoInfo, async (status) => {
      if (status !== lastStatus) {
        lastStatus = status;
        await log(`🔄 Status: **${status.toUpperCase().replace('_', ' ')}**`);
      }
    });

    // Handle Conclusion
    const duration = (Date.now() - startTime) / 1000;
    deploymentDuration.labels(service, env).observe(duration);

    if (result === 'success') {
      deploymentCounter.labels(service, env, 'success').inc();
      await log('✅ **Build & Deploy Successful!**');
      await interaction.editReply(`✅ Deployment Successful! (${service} → ${env})`);
      if (isDbConnected()) {
        await withRetry(() => ActiveDeploy.updateOne({ service, env, version, status: 'in_progress' }, { $set: { status: 'completed' } }), { retries: 2 });
      }
    } else {
      deploymentCounter.labels(service, env, 'failed').inc();
      await log(`❌ **Workflow Failed.** Conclusion: ${result}`);
      await interaction.editReply(`❌ Deployment Failed. Check logs.`);
      if (isDbConnected()) {
         await withRetry(() => ActiveDeploy.updateOne({ service, env, version, status: 'in_progress' }, { $set: { status: 'failed' } }), { retries: 2 });
      }
      throw new Error(`Workflow failed with conclusion: ${result}`);
    }

    return true;

  } catch (e) {
    console.error('GitHub Trigger/Polling Failed:', e);
    await log(`❌ **CRITICAL ERROR**: Deployment Failed.\nreason: ${e.message}`);
    await interaction.editReply(`❌ Deployment Failed. View thread for details.`);
    if (isDbConnected()) {
      await withRetry(() => ActiveDeploy.updateOne({ service, env, version, status: 'in_progress' }, { $set: { status: 'failed' } }), { retries: 2 });
    }
    throw e;
  }
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

 


