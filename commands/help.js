const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require('discord.js');

// ─── Command reference data ────────────────────────────────────────────────

const CATEGORIES = {
  character: {
    label: '🧙 Character',
    description: 'Create and view player characters',
    color: 0x9B59B6,
    commands: [
      {
        name: '/createplayer @user name class [level] [hp]',
        access: '🔒 Admin',
        desc: 'Register a D&D character for a Discord user. Class is chosen from a full dropdown (Barbarian → Wizard + Other). Running it again on the same user updates their character.',
      },
      {
        name: '/profile [@user]',
        access: '👤 Anyone',
        desc: 'View a character sheet showing class, level, HP, all four currency balances, and visible item count. Viewing your own profile is private (ephemeral); viewing others is public.',
      },
    ],
  },

  currency: {
    label: '🪙 Currency',
    description: 'Manage platinum, gold, silver, and copper',
    color: 0xF4C542,
    commands: [
      {
        name: '/balance [@user]',
        access: '👤 Anyone',
        desc: 'Check a player\'s wallet. Shows all four currencies (platinum, gold, silver, copper). Checking yourself is private; checking others is public.',
      },
      {
        name: '/give @user currency amount',
        access: '👤 Anyone',
        desc: 'Transfer currency from your wallet to another player. Pick the currency from a dropdown. Fails with a clear message if you don\'t have enough.',
      },
      {
        name: '/addbalance @user currency amount [reason]',
        access: '🔒 Admin',
        desc: 'Add or remove any currency from a player. Use a negative amount to subtract. An optional reason is shown in the confirmation embed.',
      },
    ],
  },

  items: {
    label: '📦 Items',
    description: 'Define and manage items',
    color: 0x5865F2,
    commands: [
      {
        name: '/createitem name [description] [rarity] [image_url] [hidden]',
        access: '🔒 Admin',
        desc: 'Define a new item for this server. Rarity options: Common, Uncommon, Rare, Epic, Legendary. Paste a Discord attachment URL or direct image link for the item image. Setting hidden:true makes the item globally secret — no one else can see it in any inventory.',
      },
      {
        name: '/itemlist',
        access: '🔒 Admin',
        desc: 'Browse all items defined on this server with their rarity badges, IDs, and descriptions.',
      },
      {
        name: '/additem @user item [amount] [hidden]',
        access: '🔒 Admin',
        desc: 'Give an item to a player\'s inventory. The item must exist (create it with /createitem first). Use hidden:true to hide just this player\'s copy, even if the item itself is not globally hidden.',
      },
      {
        name: '/removeitem @user item [amount]',
        access: '🔒 Admin',
        desc: 'Remove one or more of an item from a player\'s inventory. If the quantity hits zero the slot is removed entirely.',
      },
    ],
  },

  inventory: {
    label: '🎒 Inventory',
    description: 'View and trade items between players',
    color: 0x57F287,
    commands: [
      {
        name: '/inventory [@user]',
        access: '👤 Anyone',
        desc: 'View an inventory. Your own is private (ephemeral) and shows everything including hidden items with lock icons. Others\' inventories show hidden items as 🔒 Hidden item — the name and details are concealed. 🔒 = hidden for this player only. 🔐 = globally hidden at item level.',
      },
      {
        name: '/giveitem @user item [amount]',
        access: '👤 Anyone',
        desc: 'Transfer one or more of your items to another player. The item must be in your inventory. Transferred items are always visible to their new owner.',
      },
    ],
  },
};

// ─── Embed builders ────────────────────────────────────────────────────────

function buildOverviewEmbed() {
  return new EmbedBuilder()
    .setColor(0x5865F2)
    .setTitle('📖 Bot Help')
    .setDescription(
      'This bot manages D&D characters, a multi-currency economy, and item inventories.\n\n' +
      'Use the menu below to browse commands by category.\n\n' +
      '🔒 **Admin** — requires *Manage Server* permission\n' +
      '👤 **Anyone** — available to all players'
    )
    .addFields(
      Object.values(CATEGORIES).map(cat => ({
        name: cat.label,
        value: cat.description,
        inline: true,
      }))
    )
    .setFooter({ text: 'Select a category below to see detailed command info' })
    .setTimestamp();
}

function buildCategoryEmbed(categoryKey) {
  const cat = CATEGORIES[categoryKey];
  const embed = new EmbedBuilder()
    .setColor(cat.color)
    .setTitle(`${cat.label} Commands`)
    .setFooter({ text: '🔒 Admin = Manage Server permission required' })
    .setTimestamp();

  for (const cmd of cat.commands) {
    embed.addFields({
      name: `${cmd.access}  \`${cmd.name}\``,
      value: cmd.desc,
    });
  }

  return embed;
}

function buildSelectMenu(selectedKey = null) {
  const options = Object.entries(CATEGORIES).map(([key, cat]) =>
    new StringSelectMenuOptionBuilder()
      .setLabel(cat.label)
      .setDescription(cat.description)
      .setValue(key)
      .setDefault(key === selectedKey)
  );

  // Add overview option at the top
  options.unshift(
    new StringSelectMenuOptionBuilder()
      .setLabel('📖 Overview')
      .setDescription('Show all categories')
      .setValue('overview')
      .setDefault(selectedKey === null || selectedKey === 'overview')
  );

  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('help_menu')
      .setPlaceholder('Browse a category...')
      .addOptions(options)
  );
}

// ─── Command ───────────────────────────────────────────────────────────────

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Show all bot commands and how to use them'),

  async execute(interaction) {
    await interaction.reply({
      embeds: [buildOverviewEmbed()],
      components: [buildSelectMenu('overview')],
      ephemeral: true,
    });
  },

  // Called from index.js when a select menu interaction fires with customId 'help_menu'
  async handleSelect(interaction) {
    const selected = interaction.values[0];
    const embed = selected === 'overview'
      ? buildOverviewEmbed()
      : buildCategoryEmbed(selected);

    await interaction.update({
      embeds: [embed],
      components: [buildSelectMenu(selected)],
    });
  },
};
