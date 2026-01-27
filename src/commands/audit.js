import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import ActiveDeploy from '../models/ActiveDeploy.js';
import { isDbConnected } from '../lib/dbState.js';

const data = new SlashCommandBuilder()
    .setName('audit')
    .setDescription('View deployment audit trail')
    .addStringOption(o => o.setName('correlation').setDescription('Correlation ID').setRequired(false))
    .addStringOption(o => o.setName('service').setDescription('Service name').setRequired(false))
    .addIntegerOption(o => o.setName('limit').setDescription('Number of recent deployments').setRequired(false));

async function execute(interaction) {
    if (!isDbConnected()) {
        return interaction.reply({ content: '⚠️ Database not connected. Audit logs unavailable.', ephemeral: true });
    }

    const correlationId = interaction.options.getString('correlation');
    const service = interaction.options.getString('service');
    const limit = interaction.options.getInteger('limit') || 5;

    try {
        let query = {};
        if (correlationId) {
            query.correlationId = correlationId;
        }
        if (service) {
            query.service = service;
        }

        const deployments = await ActiveDeploy.find(query)
            .sort({ startedAt: -1 })
            .limit(limit)
            .lean();

        if (!deployments || deployments.length === 0) {
            return interaction.reply({ content: '📭 No deployment records found.', ephemeral: true });
        }

        // Create embed for each deployment
        const embeds = deployments.map(dep => {
            const embed = new EmbedBuilder()
                .setTitle(`📋 Deployment Audit: ${dep.service}`)
                .setColor(dep.status === 'completed' ? 0x00FF00 : dep.status === 'failed' ? 0xFF0000 : 0xFFFF00)
                .addFields(
                    { name: '🆔 Correlation ID', value: dep.correlationId, inline: false },
                    { name: '🔧 Service → Env', value: `${dep.service} → ${dep.env}`, inline: true },
                    { name: '📦 Version', value: dep.version, inline: true },
                    { name: '✅ Status', value: dep.status.toUpperCase(), inline: true }
                );

            // Add commit metadata if available
            if (dep.commitAuthor) {
                embed.addFields(
                    { name: '👤 Code Author (WHO)', value: dep.commitAuthor, inline: true },
                    { name: '🔗 Commit SHA', value: dep.commitSha || 'N/A', inline: true },
                    { name: '📝 Changes (WHAT)', value: dep.commitMessage?.substring(0, 200) || 'N/A', inline: false }
                );
            }

            if (dep.commitUrl) {
                embed.addFields({ name: '🔗 GitHub Link', value: `[View Commit](${dep.commitUrl})`, inline: false });
            }

            embed.addFields(
                { name: '👨‍💻 Deployed By', value: `<@${dep.userId}>`, inline: true },
                { name: '⏰ Time', value: new Date(dep.startedAt).toLocaleString(), inline: true }
            );

            if (dep.workflowRunId) {
                embed.addFields({ name: '🔄 GitHub Run ID', value: dep.workflowRunId.toString(), inline: true });
            }

            return embed;
        });

        // Send up to 10 embeds (Discord limit)
        const embedsToSend = embeds.slice(0, 10);
        await interaction.reply({ embeds: embedsToSend });

    } catch (err) {
        console.error('Audit command error:', err);
        return interaction.reply({ content: '⚠️ Error fetching audit logs.', ephemeral: true });
    }
}

export default { data, execute };
