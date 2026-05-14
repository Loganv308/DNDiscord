const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { findItem, addItemToInventory, RARITY_COLORS } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('additem')
    .setDescription('Add an item to a player\'s inventory (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('user').setDescription('Target player').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('item').setDescription('Item name (must exist — use /createitem first)').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Quantity to add (default: 1)').setRequired(false).setMinValue(1)
    )
    .addBooleanOption(opt =>
      opt.setName('hidden').setDescription('Hide from other players? (default: false)').setRequired(false)
    ),

  async execute(interaction) {
    const target  = interaction.options.getUser('user');
    const name    = interaction.options.getString('item');
    const amount  = interaction.options.getInteger('amount') ?? 1;
    const hidden  = interaction.options.getBoolean('hidden') ?? false;

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
        { name: 'Player',     value: `<@${target.id}>`,                 inline: true },
        { name: 'Item',       value: item.name,                          inline: true },
        { name: 'Quantity',   value: amount.toString(),                  inline: true },
        { name: 'Rarity',     value: item.rarity,                        inline: true },
        { name: 'Visibility', value: hidden ? '🔒 Hidden' : '👁️ Visible', inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
