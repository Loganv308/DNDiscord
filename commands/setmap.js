const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { setMap } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setmap')
    .setDescription('Set or update the campaign map image (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('url')
        .setDescription('Direct image URL (upload to Imgur first for best results)')
        .setRequired(true)
    ),

  async execute(interaction) {
    const url = interaction.options.getString('url');

    try { new URL(url); } catch {
      return interaction.reply({ content: '❌ That doesn\'t look like a valid URL.', ephemeral: true });
    }

    setMap(interaction.guildId, url);

    await interaction.reply({ content: '✅ Campaign map updated!', ephemeral: true });
  },
};