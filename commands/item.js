const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { findItem, listItems } = require('../db/database');

const RARITY_BADGE = {
  common:    '⬜',
  uncommon:  '🟩',
  rare:      '🟦',
  epic:      '🟪',
  legendary: '🟨',
};

const RARITY_COLORS = {
  common:    0xAAAAAA,
  uncommon:  0x57F287,
  rare:      0x5865F2,
  epic:      0xAB47BC,
  legendary: 0xF4C542,
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('item')
    .setDescription('View details about a specific item')
    .addStringOption(opt =>
      opt.setName('name')
        .setDescription('Item name to look up')
        .setRequired(true)
        .setAutocomplete(true)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const items   = listItems(interaction.guildId);

    const filtered = items
      .filter(item => item.name.toLowerCase().includes(focused))
      .slice(0, 25) // Discord max
      .map(item => ({ name: item.name, value: item.name }));

    await interaction.respond(filtered);
  },

  async execute(interaction) {
    const query = interaction.options.getString('name');
    const item  = findItem(interaction.guildId, query);

    if (!item) {
      return interaction.reply({
        content: `❌ No item found matching **${query}**.`,
        ephemeral: true,
      });
    }

    const badge  = RARITY_BADGE[item.rarity] ?? '⬜';
    const color  = RARITY_COLORS[item.rarity] ?? 0xAAAAAA;
    const rarity = item.rarity.charAt(0).toUpperCase() + item.rarity.slice(1);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle(`${badge} ${item.name}`)
      .addFields(
        { name: 'Rarity', value: rarity,                inline: true },
        { name: 'ID',     value: `\`#${item.item_id}\``, inline: true },
      )
      .setTimestamp();

    if (item.description) embed.setDescription(`*${item.description}*`);
    if (item.image_url)   embed.setImage(item.image_url);

    await interaction.reply({ embeds: [embed] });
  },
};