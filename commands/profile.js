const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getUser, getBalance, getInventory } = require('../db/database');

const CLASS_EMOJI = {
  barbarian: '⚔️', bard: '🎵', cleric: '✝️', druid: '🌿',
  fighter: '🛡️', monk: '👊', paladin: '⚜️', ranger: '🏹',
  rogue: '🗡️', sorcerer: '🔮', warlock: '👁️', wizard: '📚',
  other: '🎲',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('profile')
    .setDescription('View a player\'s character sheet')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Player to inspect (leave blank for yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const isSelf = target.id === interaction.user.id;

    const user = getUser(target.id, interaction.guildId);

    // No character registered yet
    if (!user || !user.name) {
      return interaction.reply({
        content: isSelf
          ? '❌ You don\'t have a character yet. Ask an admin to run `/createplayer` for you.'
          : `❌ <@${target.id}> doesn't have a character registered yet.`,
        ephemeral: true,
      });
    }

    const bal      = getBalance(target.id, interaction.guildId);
    const items    = getInventory(target.id, interaction.guildId);
    const emoji    = CLASS_EMOJI[user.class] ?? '🎲';
    const capClass = user.class
      ? user.class.charAt(0).toUpperCase() + user.class.slice(1)
      : 'Unknown';

    // Count visible items (to others) vs total
    const visibleItems = isSelf
      ? items.length
      : items.filter(i => !i.item_hidden && !i.inv_hidden).length;

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(`${user.name}`)
      .setDescription(`${emoji} **${capClass}** — Level ${user.level}`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: '❤️ Hit Points', value: user.hitpoints.toString(), inline: true },
        { name: '📊 Level',      value: user.level.toString(),     inline: true },
        { name: '🎒 Items',      value: visibleItems.toString(),   inline: true },
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
