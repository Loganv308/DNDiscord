const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { findItem, transferItem, RARITY_COLORS } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('giveitem')
    .setDescription('Give one of your items to another player')
    .addUserOption(opt =>
      opt.setName('user').setDescription('Player to give the item to').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('item').setDescription('Name of the item to give').setRequired(true)
    )
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Quantity to give (default: 1)').setRequired(false).setMinValue(1)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const name   = interaction.options.getString('item');
    const amount = interaction.options.getInteger('amount') ?? 1;

    if (target.id === interaction.user.id)
      return interaction.reply({ content: '❌ You cannot give an item to yourself.', ephemeral: true });
    if (target.bot)
      return interaction.reply({ content: '❌ You cannot give items to a bot.', ephemeral: true });

    const item = findItem(interaction.guildId, name);
    if (!item) {
      return interaction.reply({
        content: `❌ No item named **${name}** exists.`,
        ephemeral: true,
      });
    }

    const result = transferItem(interaction.user.id, target.id, interaction.guildId, item.item_id, amount);

    if (result.reason === 'not_found') {
      return interaction.reply({ content: `❌ You don't have **${item.name}** in your inventory.`, ephemeral: true });
    }
    if (result.reason === 'insufficient_amount') {
      return interaction.reply({
        content: `❌ You only have **${result.have}x ${item.name}** — not enough to give **${amount}**.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(RARITY_COLORS[item.rarity] ?? 0xAAAAAA)
      .setTitle('Item transferred')
      .setDescription(`<@${interaction.user.id}> gave **${amount}x ${item.name}** to <@${target.id}>`)
      .setFooter({ text: 'Transferred items are visible to their new owner.' })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
