# Discord Inventory & Currency Bot

A simple Discord bot with a coin economy and item inventory system.

## Setup

1. **Create a bot** at https://discord.com/developers/applications
   - Enable the `applications.commands` scope
   - Copy your **Bot Token**, **Application ID**, and **Guild (Server) ID**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Fill in BOT_TOKEN, CLIENT_ID, GUILD_ID
   ```

4. **Register slash commands** (run once, or whenever you change commands)
   ```bash
   npm run deploy
   ```

5. **Start the bot**
   ```bash
   npm start
   ```

---

## Commands

### 💰 Currency

| Command | Who | Description |
|---|---|---|
| `/balance` | Anyone | Check your own balance (private) |
| `/balance @user` | Anyone | Check another player's balance |
| `/give @user amount` | Anyone | Transfer your coins to another player |
| `/addbalance @user amount [reason]` | Admin | Add or remove coins (use negative to subtract) |

### 🎒 Inventory

| Command | Who | Description |
|---|---|---|
| `/inventory` | Anyone | View your own inventory (private) |
| `/inventory @user` | Anyone | View another player's visible items |
| `/giveitem @user item` | Anyone | Transfer one of your items to another player |
| `/additem @user item [note] [hidden]` | Admin | Add an item; `hidden: true` hides it from others |
| `/removeitem @user item` | Admin | Remove an item from a player's inventory |

---

## Hidden items

When an admin adds an item with `hidden: true`, other players see:
```
3. 🔒 Hidden item
```
The owner always sees the full name and note. Hidden items stay hidden even if given away (they become visible on transfer via `/giveitem`).

## Data

The bot creates `data.db` (SQLite) in the project root on first run. Back this file up to preserve player data.
