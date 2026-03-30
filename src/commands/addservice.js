import { SlashCommandBuilder } from 'discord.js';
import Service from '../models/Service.js';
import { isDbConnected } from '../lib/dbState.js';
import { hasRole } from '../lib/roles.js';
import logger from '../lib/logger.js';

export async function handleAddService(interaction) {
  await interaction.deferReply({ ephemeral: true });

  if (!isDbConnected()) {
    return interaction.editReply({ content: '❌ Database offline. Cannot add services.' });
  }

  const userId = interaction.user.id;
  const isAdmin = await hasRole(userId, 'admin');

  if (!isAdmin && userId !== process.env.ROOT_USER_ID) {
    return interaction.editReply({ content: '🚫 Only admins can add new services.' });
  }

  const name = interaction.options.getString('name');
  const owner = interaction.options.getString('owner');
  const repo = interaction.options.getString('repo');
  const workflow = interaction.options.getString('workflow') || 'deploy.yml';

  // ── Input Validation ──
  const { validateServiceName, validateGitHubOwner, validateGitHubRepo, validateWorkflowFile } = await import('../lib/security.js');
  
  const nameCheck = validateServiceName(name);
  if (!nameCheck.valid) return interaction.editReply({ content: `❌ ${nameCheck.error}` });
  
  const ownerCheck = validateGitHubOwner(owner);
  if (!ownerCheck.valid) return interaction.editReply({ content: `❌ ${ownerCheck.error}` });
  
  const repoCheck = validateGitHubRepo(repo);
  if (!repoCheck.valid) return interaction.editReply({ content: `❌ ${repoCheck.error}` });
  
  const workflowCheck = validateWorkflowFile(workflow);
  if (!workflowCheck.valid) return interaction.editReply({ content: `❌ ${workflowCheck.error}` });

  try {
    const existing = await Service.findOne({ name });
    if (existing) {
      return interaction.editReply({ content: `⚠️ Service **${name}** already exists. Use /updateservice to modify it.` });
    }

    const repoFullName = `${owner}/${repo}`;
    await Service.create({ 
        name, 
        repo: repoFullName, 
        workflow_id: workflow 
    });

    await interaction.editReply({ content: `✅ **Service Registered!**\nService: \`${name}\`\nRepo: \`${repoFullName}\`\nWorkflow: \`${workflow}\`\n\nYou can now deploy this service using \`/deploy service:${name}\`.` });

  } catch (e) {
    logger.error('AddService failed', { error: e.message, name });
    await interaction.editReply({ content: '❌ Failed to register service.' });
  }
}

const data = new SlashCommandBuilder()
  .setName('addservice')
  .setDescription('Register a new service (Admin only)')
  .addStringOption(o => o.setName('name').setDescription('Service name (e.g. api, web)').setRequired(true))
  .addStringOption(o => o.setName('owner').setDescription('GitHub Owner/Org').setRequired(true))
  .addStringOption(o => o.setName('repo').setDescription('GitHub Repository').setRequired(true))
  .addStringOption(o => o.setName('workflow').setDescription('Workflow filename (default: deploy.yml)').setRequired(false));

export default {
  data,
  async execute(interaction) {
    return handleAddService(interaction);
  }
};
