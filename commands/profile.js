const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getBalance, getInventory } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription("View a player's character sheet")
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Player to inspect (leave blank for yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const isSelf = target.id === interaction.user.id;

    const user = getUser(target.id, interaction.guildId);

    if (!user || !user.name) {
      return interaction.reply({
        content: isSelf
          ? "❌ You don't have a character yet. Ask an admin to run `/createplayer` for you."
          : `❌ <@${target.id}> doesn't have a character registered yet.`,
        ephemeral: true,
      });
    }

    const bal   = getBalance(target.id, interaction.guildId);
    const items = getInventory(target.id, interaction.guildId);

    const visibleItems = isSelf
      ? items.length
      : items.filter(i => !i.item_hidden && !i.inv_hidden).length;

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(user.name)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '🎒 Items',      value: visibleItems.toString(), inline: true },
        { name: '──── Wallet ────', value: '\u200b' },
        { name: '🪙 Platinum', value: bal.platinum.toLocaleString(), inline: true },
        { name: '🟡 Gold',     value: bal.gold.toLocaleString(),     inline: true },
        { name: '⚪ Silver',   value: bal.silver.toLocaleString(),   inline: true },
        { name: '🟤 Copper',   value: bal.copper.toLocaleString(),   inline: true },
      )
      .setFooter({ text: `Discord: ${target.username}` })
      .setTimestamp();

    if (user.administrator) embed.setAuthor({ name: '⭐ Administrator' });

    await interaction.reply({ embeds: [embed], ephemeral: isSelf });
  },
};