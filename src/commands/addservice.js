import { SlashCommandBuilder } from 'discord.js';
import Service from '../models/Service.js';
import { isDbConnected } from '../lib/dbState.js';
import { hasRole } from '../lib/roles.js';

export async function handleAddService(interaction) {
  if (!isDbConnected()) {
    return interaction.reply({ content: '❌ Database offline. Cannot add services.', ephemeral: true });
  }

  const userId = interaction.user.id;
  const isAdmin = await hasRole(userId, 'admin');

  if (!isAdmin && userId !== process.env.ROOT_USER_ID) {
    return interaction.reply({ content: '🚫 Only admins can add new services.', ephemeral: true });
  }

  const name = interaction.options.getString('name');
  const owner = interaction.options.getString('owner');
  const repo = interaction.options.getString('repo');
  const workflow = interaction.options.getString('workflow') || 'deploy.yml';

  try {
    const existing = await Service.findOne({ name });
    if (existing) {
        return interaction.reply({ content: `⚠️ Service **${name}** already exists. Use /updateservice to modify it.`, ephemeral: true });
    }

    const repoFullName = `${owner}/${repo}`;
    await Service.create({ 
        name, 
        repo: repoFullName, 
        workflow_id: workflow 
    });

    await interaction.reply({ content: `✅ **Service Registered!**\nService: \`${name}\`\nRepo: \`${repoFullName}\`\nWorkflow: \`${workflow}\`\n\nYou can now deploy this service using \`/deploy service:${name}\`.` });

  } catch (e) {
    console.error(e);
    await interaction.reply({ content: '❌ Failed to register service.', ephemeral: true });
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
