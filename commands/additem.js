const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { findItem, listItems, addItemToInventory, RARITY_COLORS } = require('../db/database');

const RARITY_BADGE = { common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '🟨' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('additem')
    .setDescription('Add an item to a player\'s inventory (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('user').setDescription('Target player').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('item').setDescription('Item to add').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Quantity to add (default: 1)').setRequired(false).setMinValue(1)
    )
    .addBooleanOption(opt =>
      opt.setName('hidden').setDescription('Hide from other players? (default: false)').setRequired(false)
    ),

  async autocomplete(interaction) {
    const focused = interaction.options.getFocused().toLowerCase();
    const items = listItems(interaction.guildId);
    const filtered = items
      .filter(i => i.name.toLowerCase().includes(focused))
      .slice(0, 25);
    await interaction.respond(
      filtered.map(i => ({
        name: `${RARITY_BADGE[i.rarity] ?? '⬜'} ${i.name} — ${i.rarity}`,
        value: i.name,
      }))
    );
  },

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const name   = interaction.options.getString('item');
    const amount = interaction.options.getInteger('amount') ?? 1;
    const hidden = interaction.options.getBoolean('hidden') ?? false;

    const item = findItem(interaction.guildId, name);
    if (!item) {
      return interaction.reply({
        content: `❌ No item named **${name}** exists. Create it first with \`/createitem\`.`,
        ephemeral: true,
      });
    }

    addItemToInventory(target.id, interaction.guildId, item.item_id, amount, hidden);

    const embed = new EmbedBuilder()
      .setColor(RARITY_COLORS[item.rarity] ?? 0xAAAAAA)
      .setTitle('Item added to inventory')
      .addFields(
        { name: 'Player',     value: `<@${target.id}>`,                  inline: true },
        { name: 'Item',       value: item.name,                           inline: true },
        { name: 'Quantity',   value: amount.toString(),                   inline: true },
        { name: 'Rarity',     value: item.rarity,                         inline: true },
        { name: 'Visibility', value: hidden ? '🔒 Hidden' : '👁️ Visible', inline: true },
      )
      .setTimestamp();

    if (item.image_url) embed.setThumbnail(item.image_url);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
