const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const { createItem, RARITY_COLORS } = require('../db/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('createitem')
    .setDescription('Define a new item that can be added to inventories (admin only)')
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addStringOption(opt =>
      opt.setName('name').setDescription('Item name').setRequired(true)
    )
    .addStringOption(opt =>
      opt.setName('description').setDescription('Flavour text / lore description').setRequired(false)
    )
    .addStringOption(opt =>
      opt.setName('rarity')
        .setDescription('Item rarity (default: common)')
        .setRequired(false)
        .addChoices(
          { name: '⬜ Common',    value: 'common' },
          { name: '🟩 Uncommon',  value: 'uncommon' },
          { name: '🟦 Rare',      value: 'rare' },
          { name: '🟪 Epic',      value: 'epic' },
          { name: '🟨 Legendary', value: 'legendary' },
        )
    )
    .addAttachmentOption(opt =>
      opt.setName('image').setDescription('Upload an image').setRequired(false)
    )
    .addBooleanOption(opt =>
      opt.setName('hidden')
        .setDescription('Always hide this item from other players, regardless of inventory setting (default: false)')
        .setRequired(false)
    ),

    async execute(interaction) {
    const name        = interaction.options.getString('name');
    const description = interaction.options.getString('description') ?? null;
    const rarity      = interaction.options.getString('rarity') ?? 'common';
    const attachment  = interaction.options.getAttachment('image') ?? null;
    const imageUrl    = attachment?.url ?? null;
    const hidden      = interaction.options.getBoolean('hidden') ?? false;

    const itemId = createItem(interaction.guildId, name, description, rarity, imageUrl, hidden);

    const embed = new EmbedBuilder()
      .setColor(RARITY_COLORS[rarity])
      .setTitle('Item created')
      .addFields(
        { name: 'Name',        value: name,                           inline: true },
        { name: 'Rarity',      value: rarity,                         inline: true },
        { name: 'Item ID',     value: `#${itemId}`,                   inline: true },
        { name: 'Hidden',      value: hidden ? '🔒 Yes' : '👁️ No',    inline: true },
        { name: 'Image',       value: imageUrl ? '✅ Set' : '*None*',  inline: true },
        { name: 'Description', value: description ?? '*None*' },
      )
      .setFooter({ text: 'Use /additem to give this item to a player.' })
      .setTimestamp();

    if (imageUrl) embed.setThumbnail(imageUrl);

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
