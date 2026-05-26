require('dotenv').config();
const { Client, GatewayIntentBits, Collection, Events } = require('discord.js');
const fs = require('fs');
const path = require('path');
const { ready: dbReady } = require('./db/database');

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load all command files
const commandsPath = path.join(__dirname, 'commands');
for (const file of fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'))) {
  const command = require(path.join(commandsPath, file));
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
  }
}

client.once(Events.ClientReady, () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    // ── Autocomplete ────────────────────────────────────────────────────
    if (interaction.isAutocomplete()) {
      const command = client.commands.get(interaction.commandName);
      if (!command?.autocomplete) return;
      await command.autocomplete(interaction);
      return;
    }

    // ── Slash commands ──────────────────────────────────────────────────
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;
      await command.execute(interaction);
      return;
    }

    // ── Select menus ────────────────────────────────────────────────────
    if (interaction.isStringSelectMenu()) {
      if (interaction.customId === 'help_menu') {
        const help = client.commands.get('help');
        if (help?.handleSelect) await help.handleSelect(interaction);
      }
      return;
    }
  } catch (err) {
    console.error('Interaction error:', err);
    const msg = { content: '❌ Something went wrong.', ephemeral: true };
    try {
      interaction.replied || interaction.deferred
        ? await interaction.followUp(msg)
        : await interaction.reply(msg);
    } catch { /* interaction may have already expired */ }
  }
});

// Wait for the database to initialise before connecting to Discord
dbReady
  .then(() => {
    console.log('✅ Database ready');
    return client.login(process.env.BOT_TOKEN);
  })
  .catch(err => {
    console.error('❌ Failed to initialise database:', err);
    process.exit(1);
  });
