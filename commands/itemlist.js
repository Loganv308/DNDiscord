const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { listItems } = require('../db/database');

const RARITY_BADGE = {
  common:    '⬜',
  uncommon:  '🟩',
  rare:      '🟦',
  epic:      '🟪',
  legendary: '🟨',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('itemlist')
    .setDescription('Browse all items defined on this server (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const items = listItems(interaction.guildId);

    const embed = new EmbedBuilder()
      .setColor(0x5865F2)
      .setTitle('Item registry')
      .setTimestamp();

    if (items.length === 0) {
      embed.setDescription('*No items defined yet. Use `/createitem` to add some.*');
    } else {
      const lines = items.map(item => {
        const badge = RARITY_BADGE[item.rarity] ?? '⬜';
        const desc  = item.description ? ` — *${item.description}*` : '';
        return `${badge} **${item.name}** \`#${item.item_id}\`${desc}`;
      });

      // Chunk into fields
      const chunks = [];
      let current = '';
      for (const line of lines) {
        if ((current + '\n' + line).length > 1000) { chunks.push(current); current = line; }
        else current = current ? current + '\n' + line : line;
      }
      if (current) chunks.push(current);

      chunks.forEach((chunk, idx) => {
        embed.addFields({ name: idx === 0 ? `${items.length} item(s)` : '\u200b', value: chunk });
      });
    }

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
