const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createPlayer, hasPlayer } = require('../db/database');

const CLASS_EMOJI = {
  barbarian: '⚔️', bard: '🎵', cleric: '✝️', druid: '🌿',
  fighter: '🛡️', monk: '👊', paladin: '⚜️', ranger: '🏹',
  rogue: '🗡️', sorcerer: '🔮', warlock: '👁️', wizard: '📚',
  other: '🎲',
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createplayer')
    .setDescription('Register a D&D character for a Discord user')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addUserOption(opt =>
      opt.setName('user').setDescription('Discord user to register as a player').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('name').setDescription('Character name').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('class')
        .setDescription('Character class')
        .setRequired(true)
        .addChoices(
          { name: '⚔️ Barbarian', value: 'barbarian' },
          { name: '🎵 Bard',      value: 'bard' },
          { name: '✝️ Cleric',    value: 'cleric' },
          { name: '🌿 Druid',     value: 'druid' },
          { name: '🛡️ Fighter',   value: 'fighter' },
          { name: '👊 Monk',      value: 'monk' },
          { name: '⚜️ Paladin',   value: 'paladin' },
          { name: '🏹 Ranger',    value: 'ranger' },
          { name: '🗡️ Rogue',     value: 'rogue' },
          { name: '🔮 Sorcerer',  value: 'sorcerer' },
          { name: '👁️ Warlock',   value: 'warlock' },
          { name: '📚 Wizard',    value: 'wizard' },
          { name: '🎲 Other',     value: 'other' },
        )
    )
    .addIntegerOption(opt =>
      opt.setName('level')
        .setDescription('Starting level (default: 1)')
        .setRequired(false)
        .setMinValue(1)
        .setMaxValue(20)
    )
    .addIntegerOption(opt =>
      opt.setName('hitpoints')
        .setDescription('Starting hit points (default: 100)')
        .setRequired(false)
        .setMinValue(1)
    ),

  async execute(interaction) {
    const target     = interaction.options.getUser('user');
    const name       = interaction.options.getString('name');
    const playerClass = interaction.options.getString('class');
    const level      = interaction.options.getInteger('level') ?? 1;
    const hitpoints  = interaction.options.getInteger('hitpoints') ?? 100;

    if (target.bot) {
      return interaction.reply({ content: '❌ You cannot register a bot as a player.', ephemeral: true });
    }

    const alreadyExists = hasPlayer(target.id, interaction.guildId);
    createPlayer(target.id, interaction.guildId, name, playerClass, level, hitpoints);

    const emoji = CLASS_EMOJI[playerClass] ?? '🎲';

    const embed = new EmbedBuilder()
      .setColor(0x9B59B6)
      .setTitle(alreadyExists ? 'Character updated' : 'Character created')
      .setDescription(`<@${target.id}> is now playing as **${name}**`)
      .setThumbnail(target.displayAvatarURL())
      .addFields(
        { name: 'Class',      value: `${emoji} ${playerClass.charAt(0).toUpperCase() + playerClass.slice(1)}`, inline: true },
        { name: 'Level',      value: level.toString(),      inline: true },
        { name: 'Hit Points', value: `❤️ ${hitpoints}`,    inline: true },
      )
      .setTimestamp();

    if (alreadyExists) {
      embed.setFooter({ text: 'Previous character data was overwritten.' });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
