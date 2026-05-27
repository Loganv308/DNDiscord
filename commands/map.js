// commands/map.js
const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getMap } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('map')
    .setDescription('Displays the current campaign map'),

  async execute(interaction) {
    const mapUrl = getMap(interaction.guildId);

    if (!mapUrl) {
      return interaction.reply({
        content: '❌ No map has been set yet. Ask an admin to use `/setmap`.',
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x2C2F33)
      .setTitle('🗺️ Campaign Map')
      .setImage(mapUrl)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};