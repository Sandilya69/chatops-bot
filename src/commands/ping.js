import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('ping')
    .setDescription('Replies with Pong!'),
  async execute(interaction) {
    try {
      await interaction.deferReply({ ephemeral: true });
      await interaction.editReply('🏓 Pong!');
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('Ping command error:', error);
      if (interaction.deferred || interaction.replied) {
        await interaction.editReply('❌ Error responding to ping.');
      } else {
        await interaction.reply('❌ Error handling ping command.');
      }
    }
  },
};

import { getUserRole } from '../lib/roles.js';
import { logAudit } from '../lib/audit.js';

export async function handlePing(interaction) {
  const userId = interaction.user.id;
  const role = await getUserRole(userId);
  await logAudit('ping', userId, { command: 'ping', status: 'success', role });
  return interaction.reply('🏓 Pong!');
}


