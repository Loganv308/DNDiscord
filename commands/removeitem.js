const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { findItem, listItems, removeItemFromInventory } = require('../db/database');

const RARITY_BADGE = { common: '⬜', uncommon: '🟩', rare: '🟦', epic: '🟪', legendary: '🟨' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('removeitem')
    .setDescription('Remove an item from a player\'s inventory (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('user').setDescription('Target player').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('item').setDescription('Item to remove').setRequired(true).setAutocomplete(true)
    )
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Quantity to remove (default: 1)').setRequired(false).setMinValue(1)
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

    const item = findItem(interaction.guildId, name);
    if (!item) {
      return interaction.reply({
        content: `❌ No item named **${name}** exists in this server.`,
        ephemeral: true,
      });
    }

    const removed = removeItemFromInventory(target.id, interaction.guildId, item.item_id, amount);
    if (!removed) {
      return interaction.reply({
        content: `❌ <@${target.id}> doesn't have **${item.name}** in their inventory.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0xED4245)
      .setTitle('Item removed')
      .addFields(
        { name: 'Player',   value: `<@${target.id}>`, inline: true },
        { name: 'Item',     value: item.name,          inline: true },
        { name: 'Quantity', value: amount.toString(),  inline: true },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
