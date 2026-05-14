const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { addBalance, getBalance, CURRENCIES } = require('../db/database');

const CURRENCY_EMOJI = { platinum: '🪙', gold: '🟡', silver: '⚪', copper: '🟤' };

module.exports = {
  data: new SlashCommandBuilder()
    .setName('addbalance')
    .setDescription('Add or remove currency from a player (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('user').setDescription('Target player').setRequired(true)
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
      opt.setName('amount')
        .setDescription('Amount to add (use negative to subtract)')
        .setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('reason').setDescription('Reason (shown in embed)').setRequired(false)
    ),

  async execute(interaction) {
    const target   = interaction.options.getUser('user');
    const currency = interaction.options.getString('currency');
    const amount   = interaction.options.getInteger('amount');
    const reason   = interaction.options.getString('reason') ?? 'No reason given';

    const newBal = addBalance(target.id, interaction.guildId, currency, amount);
    const emoji  = CURRENCY_EMOJI[currency];
    const sign   = amount >= 0 ? '+' : '';

    const embed = new EmbedBuilder()
      .setColor(amount >= 0 ? 0x57F287 : 0xED4245)
      .setTitle('Balance updated')
      .addFields(
        { name: 'Player',       value: `<@${target.id}>`,                             inline: true },
        { name: 'Currency',     value: `${emoji} ${currency}`,                        inline: true },
        { name: 'Change',       value: `${sign}${amount.toLocaleString()}`,            inline: true },
        { name: 'New balance',  value: `${newBal[currency].toLocaleString()} ${emoji}`, inline: true },
        { name: 'Reason',       value: reason },
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
