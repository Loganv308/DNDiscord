# ⚔️ D&D Discord Bot

A Discord bot built for tabletop RPG groups. It manages **D&D character sheets**, a **multi-currency economy** (platinum, gold, silver, copper), and a full **item inventory system** with rarity tiers, images, and hidden items for secret quests.

---

## Features

- 🧙 **Character profiles** — link D&D characters to Discord users with class, level, and HP
- 🪙 **Multi-currency wallet** — platinum, gold, silver, and copper per player
- 🎒 **Item inventories** — add, remove, and trade items between players
- 📦 **Item registry** — define reusable items with descriptions, rarity, and images
- 🔒 **Hidden items** — secret quest items invisible to other players
- 🔍 **Autocomplete** — item fields suggest matching items as you type
- 📖 **In-bot help menu** — browsable `/help` command with category navigation

---

## Requirements

- [Node.js](https://nodejs.org/) v18 or newer
- A Discord account and server where you have admin access

---

## Setup

### 1. Create a Discord bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) and click **New Application**
2. Name your bot, then go to the **Bot** tab
3. Click **Reset Token** and copy your **Bot Token** — keep this secret
4. Scroll down and enable **Message Content Intent** if prompted
5. Go to **OAuth2 → General** and copy your **Client ID**
6. Copy your Discord **Server (Guild) ID** by right-clicking your server name with Developer Mode enabled (`Settings → Advanced → Developer Mode`)

### 2. Invite the bot to your server

In the Developer Portal go to **OAuth2 → URL Generator** and check:

- ✅ `bot`
- ✅ `applications.commands`

Then under **Bot Permissions** check:

- ✅ Send Messages
- ✅ Use Slash Commands
- ✅ Embed Links

Copy the generated URL, open it in your browser, and invite the bot to your server.

### 3. Install dependencies

```bash
npm install
```

> No C++ build tools required — this bot uses `sql.js`, a pure JavaScript SQLite driver.

### 4. Configure environment

```bash
cp .env.example .env
```

Open `.env` and fill in your values:

```env
BOT_TOKEN=your_bot_token_here
CLIENT_ID=your_application_id_here
GUILD_ID=your_server_id_here
```

### 5. Register slash commands

Run this once to register all slash commands with Discord. Re-run it any time you add or change commands.

```bash
npm run deploy
```

### 6. Start the bot

```bash
npm start
```

You should see:
```
✅ Database ready
✅ Logged in as YourBot#1234
```

---

## Commands

Use `/help` inside Discord for an interactive, categorised command reference. Full details below.

---

### 🧙 Character

| Command | Access | Description |
|---|---|---|
| `/createplayer @user name class [level] [hp]` | 🔒 Admin | Register a D&D character for a Discord user. Choosing the same user again updates their character. |
| `/profile [@user]` | 👤 Anyone | View a character sheet — class, level, HP, full wallet balance, and item count. Viewing yourself is private; viewing others is public. |

**Available classes:** Barbarian, Bard, Cleric, Druid, Fighter, Monk, Paladin, Ranger, Rogue, Sorcerer, Warlock, Wizard, Other

---

### 🪙 Currency

Players have four separate currency balances. They do not auto-convert between tiers — 100 copper is not 1 silver unless your DM decides it is.

| Command | Access | Description |
|---|---|---|
| `/balance [@user]` | 👤 Anyone | Check a player's wallet. Shows all four currencies. |
| `/give @user currency amount` | 👤 Anyone | Transfer currency from your wallet to another player. |
| `/addbalance @user currency amount [reason]` | 🔒 Admin | Add or remove currency from a player. Use a **negative amount** to subtract (e.g. `-50` to deduct 50 gold). |

---

### 📦 Items

Items are defined server-wide in a registry before they can be given to players. This keeps names consistent and lets you attach descriptions, rarity, and images once rather than per-grant.

| Command | Access | Description |
|---|---|---|
| `/createitem name [description] [rarity] [image_url] [hidden]` | 🔒 Admin | Define a new item. See [Item Rarity](#item-rarity) and [Item Images](#item-images) below. |
| `/itemlist` | 🔒 Admin | Browse all items defined on this server. |
| `/additem @user item [amount] [hidden]` | 🔒 Admin | Add an item to a player's inventory. The item field autocompletes from the registry. |
| `/removeitem @user item [amount]` | 🔒 Admin | Remove one or more of an item from a player's inventory. |

#### Item Rarity

| Badge | Tier | Colour |
|---|---|---|
| ⬜ | Common | Grey |
| 🟩 | Uncommon | Green |
| 🟦 | Rare | Blue |
| 🟪 | Epic | Purple |
| 🟨 | Legendary | Gold |

---

### 🎒 Inventory

| Command | Access | Description |
|---|---|---|
| `/inventory [@user]` | 👤 Anyone | View an inventory. Your own is private and shows everything. Others' inventories hide secret items. |
| `/giveitem @user item [amount]` | 👤 Anyone | Give one of your items to another player. The item field autocompletes from your own inventory. Transferred items are always visible to their new owner. |

---

## Hidden Items

There are two independent hidden flags that work together:

| Flag | Set by | Effect |
|---|---|---|
| **Item-level hidden** (`/createitem hidden:true`) | Admin at item creation | This item type is always secret for *everyone* who has it — good for quest keys, secret artefacts, etc. Shown as 🔐 to the owner. |
| **Inventory-level hidden** (`/additem hidden:true`) | Admin when granting | Hides *this player's copy* only — another player could have the same item visibly. Shown as 🔒 to the owner. |

Either flag (or both) causes the item to appear as `🔒 Hidden item` to anyone else viewing that player's inventory. The owner always sees the full name and details.

When a player uses `/giveitem` to transfer an item, it **becomes visible** to the new owner regardless of the inventory-level flag. Item-level hidden items remain secret.

---

## Item Images

The simplest way to add images is to use Discord itself:

1. Create a private channel (e.g. `#item-images`) visible only to admins
2. Upload your image to that channel
3. Right-click the image → **Copy Link** (not "Copy Image")
4. Paste the URL into `/createitem image_url:`

> ⚠️ Discord CDN links can expire if the source message is deleted. Keep the `#item-images` channel intact and don't delete those messages.

For permanent image hosting, [Imgur](https://imgur.com) is a free alternative — upload the image and use the direct `.png` or `.jpg` link.

---

## Data & Backups

The bot stores all data in `data.db` (SQLite) in the project root, created automatically on first run.

**Back this file up regularly.** Copying it to another location is all that's needed — it's a single self-contained file.

```bash
# Example: manual backup
cp data.db data.db.backup
```

---

## Project Structure

```
discord-bot/
├── index.js              # Bot entry point
├── deploy-commands.js    # Register slash commands with Discord (run once)
├── .env.example          # Environment variable template
├── commands/
│   ├── help.js           # /help — interactive help menu
│   ├── createplayer.js   # /createplayer
│   ├── profile.js        # /profile
│   ├── balance.js        # /balance
│   ├── addbalance.js     # /addbalance
│   ├── give.js           # /give
│   ├── createitem.js     # /createitem
│   ├── itemlist.js       # /itemlist
│   ├── additem.js        # /additem  (autocomplete)
│   ├── removeitem.js     # /removeitem  (autocomplete)
│   ├── inventory.js      # /inventory
│   └── giveitem.js       # /giveitem  (autocomplete)
└── db/
    └── database.js       # Schema, queries, and persistence
```

---

## Typical Admin Workflow

```
1. /createplayer  → Register each player's character
2. /createitem    → Define items (swords, potions, quest keys, etc.)
3. /additem       → Grant items to players as the campaign progresses
4. /addbalance    → Reward or deduct currency for in-game events
```

Players can then use `/profile`, `/inventory`, `/balance`, `/give`, and `/giveitem` themselves.

---

## Troubleshooting

**Commands not showing up in Discord**
Run `npm run deploy` — this registers commands with Discord. It can take up to an hour to propagate globally, but guild-specific commands (as configured here) are usually instant.

**`npm install` fails with native build errors**
This bot uses `sql.js` (pure JavaScript) and has no native dependencies. If you see build errors, make sure you don't have an old `node_modules` folder from a previous version. Delete it and re-run `npm install`.

**Bot is online but not responding**
Check that the bot has the `applications.commands` OAuth2 scope and that slash commands were deployed with `npm run deploy`.

**Images not showing in embeds**
The Discord CDN link may have expired (the source message was deleted) or the URL is not a direct image link. Re-upload the image and update the item, or switch to Imgur for permanent hosting.