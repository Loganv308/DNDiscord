const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getInventory } = require('../db/database');

const RARITY_BADGE = {
  common:    '⬜',
  uncommon:  '🟩',
  rare:      '🟦',
  epic:      '🟪',
  legendary: '🟨',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('inventory')
    .setDescription('View an inventory')
    .addUserOption(opt =>
      opt.setName('user')
        .setDescription('Player to inspect (leave blank for yourself)')
        .setRequired(false)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user') ?? interaction.user;
    const isSelf = target.id === interaction.user.id;
    const items  = getInventory(target.id, interaction.guildId);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle(`${isSelf ? 'Your' : `${target.displayName}'s`} inventory`)
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();

    if (items.length === 0) {
      embed.setDescription('*Empty — nothing here yet.*');
    } else {
      // An item is hidden from others if EITHER the item-level OR inventory-level hidden flag is set
      const isHidden = item => item.item_hidden || item.inv_hidden;

      const lines = items.map((item, i) => {
        if (!isSelf && isHidden(item)) {
          return `${i + 1}. 🔒 *Hidden item*`;
        }
        const badge   = RARITY_BADGE[item.rarity] ?? '⬜';
        const qty     = item.amount > 1 ? ` ×${item.amount}` : '';
        const invLock = item.inv_hidden  ? ' 🔒' : '';
        const itmLock = item.item_hidden ? ' 🔐' : ''; // different icon: globally hidden at item level
        return `${i + 1}. ${badge} **${item.name}**${qty}${invLock}${itmLock}`;
      });

      // Chunk into fields (Discord 1024-char limit per field)
      const chunks = [];
      let current = '';
      for (const line of lines) {
        if ((current + '\n' + line).length > 1000) { chunks.push(current); current = line; }
        else current = current ? current + '\n' + line : line;
      }
      if (current) chunks.push(current);

      chunks.forEach((chunk, idx) => {
        embed.addFields({ name: idx === 0 ? `Items (${items.length})` : '\u200b', value: chunk });
      });

      // If viewing own inventory and only one item, show its image
      if (isSelf && items.length === 1 && items[0].image_url) {
        embed.setImage(items[0].image_url);
      }

      if (!isSelf) {
        const hiddenCount = items.filter(i => isHidden(i)).length;
        if (hiddenCount > 0) embed.setFooter({ text: `🔒 ${hiddenCount} item(s) hidden from view` });
      } else {
        embed.setFooter({ text: '🔒 hidden from others  |  🔐 hidden at item level' });
      }
    }

    await interaction.reply({ embeds: [embed], ephemeral: isSelf });
  },
};
