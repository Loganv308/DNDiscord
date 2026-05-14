const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getBalance } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('balance')
    .setDescription('Check a player\'s currency balance')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('User to check (leave blank for yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const isSelf = target.id === interaction.user.id;
    const bal = getBalance(target.id, interaction.guildId);

    const embed = new EmbedBuilder()
      .setColor(0xF4C542)
      .setTitle(`${isSelf ? 'Your' : `${target.displayName}'s`} balance`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '🪙 Platinum', value: bal.platinum.toLocaleString(), inline: true },
        { name: '🟡 Gold',     value: bal.gold.toLocaleString(),     inline: true },
        { name: '⚪ Silver',   value: bal.silver.toLocaleString(),   inline: true },
        { name: '🟤 Copper',   value: bal.copper.toLocaleString(),   inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: isSelf });
  },
};
