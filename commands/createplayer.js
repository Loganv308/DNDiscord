const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createPlayer, hasPlayer } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createplayer')
    .setDescription('Register a character for a Discord user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('user').setDescription('Discord user to register as a player').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('name').setDescription('Character name').setRequired(true)
    ),

  async execute(interaction) {
    const target = interaction.options.getUser('user');
    const name   = interaction.options.getString('name');

    if (target.bot) {
      return interaction.reply({ content: '❌ You cannot register a bot as a player.', ephemeral: true });
    }

    const alreadyExists = hasPlayer(target.id, interaction.guildId);
    createPlayer(target.id, interaction.guildId, name);

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(alreadyExists ? '✏️ Character Updated' : '✅ Character Created')
      .setDescription(`<@${target.id}> is now playing as **${name}**`)
      .setThumbnail(target.displayAvatarURL())
      .setTimestamp();

    if (alreadyExists) {
      embed.setFooter({ text: 'Previous character data was overwritten.' });
    }

    await interaction.reply({ embeds: [embed] });
  },
};