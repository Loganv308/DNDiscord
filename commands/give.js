const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { transferBalance, getBalance } = require('../db/database');

const CURRENCY_EMOJI = { platinum: '🪙', gold: '🟡', silver: '⚪', copper: '🟤' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('give')
    .setDescription('Give currency to another player')
    .addUserOption(opt =>
      opt.setName('user').setDescription('Player to give currency to').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('currency')
        .setDescription('Currency type')
        .setRequired(true)
        .addChoices(
          { name: '🪙 Platinum', value: 'platinum' },
          { name: '🟡 Gold',     value: 'gold' },
          { name: '⚪ Silver',   value: 'silver' },
          { name: '🟤 Copper',   value: 'copper' },
        )
    )
    .addIntegerOption(opt =>
      opt.setName('amount').setDescription('Amount to give').setRequired(true).setMinValue(1)
    ),

  async execute(interaction) {
    const target   = interaction.options.getUser('user');
    const currency = interaction.options.getString('currency');
    const amount   = interaction.options.getInteger('amount');
    const emoji    = CURRENCY_EMOJI[currency];

    if (target.id === interaction.user.id)
      return interaction.reply({ content: '❌ You cannot give currency to yourself.', ephemeral: true });
    if (target.bot)
      return interaction.reply({ content: '❌ You cannot give currency to a bot.', ephemeral: true });

    const result = transferBalance(interaction.user.id, target.id, interaction.guildId, currency, amount);

    if (!result.success) {
      return interaction.reply({
        content: `❌ You only have **${result.have.toLocaleString()} ${emoji} ${currency}** — not enough to give **${amount.toLocaleString()}**.`,
        ephemeral: true,
      });
    }

    const embed = new EmbedBuilder()
      .setColor(0x57F287)
      .setTitle('Currency transferred')
      .setDescription(`<@${interaction.user.id}> gave **${amount.toLocaleString()} ${emoji} ${currency}** to <@${target.id}>`)
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};
