import { SlashCommandBuilder } from 'discord.js';

export default {
  data: new SlashCommandBuilder()
    .setName('hello')
    .setDescription('A simple hello command to test deployment')
    .addStringOption(option =>
      option
        .setName('name')
        .setDescription('Your name')
        .setRequired(false)
    ),

  async execute(interaction) {
    const name = interaction.options.getString('name') || 'World';
    
    await interaction.reply({
      content: `👋 Hello, ${name}!\n\n✅ This command was deployed using the ChatOps bot!\n🚀 Deployment workflow is working perfectly!`,
      ephemeral: false
    });
  },
};
