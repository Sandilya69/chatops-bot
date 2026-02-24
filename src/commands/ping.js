import { SlashCommandBuilder } from 'discord.js';
import { getUserRole } from '../lib/rbac.js';
import { logCommand } from '../lib/commandAudit.js';
import logger from '../lib/logger.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Health check — checks bot and DB status'),

  async execute(interaction) {
    try {
      await interaction.deferReply();
      const userId = interaction.user.id;
      const role = await getUserRole(userId);
      await logCommand(userId, 'ping', 'success', { role });
      logger.info('Ping command executed', { userId, role });
      await interaction.editReply({
        content: `🏓 Pong! Bot online. Your role: **${role ?? 'none'}**`,
      });
    } catch (error) {
      logger.error('Ping command error', { error: error.message });
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('❌ Error responding to ping.');
      } else {
        await interaction.reply('❌ Error handling ping command.');
      }
    }
  },
};
