const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DB_PATH = path.join(__dirname, '../data.db');

// ─── Bootstrap ─────────────────────────────────────────────────────────────
// sql.js is async to initialise (loads a WASM binary), so we expose a
// promise that index.js awaits before logging the bot in.

let db;

const ready = initSqlJs().then(SQL => {
  const fileBuffer = fs.existsSync(DB_PATH) ? fs.readFileSync(DB_PATH) : null;
  db = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database();
  db.run('PRAGMA foreign_keys = ON;');
  createSchema();
  return db;
});

// Persist the in-memory database to disk after every write
function save() {
  fs.writeFileSync(DB_PATH, Buffer.from(db.export()));
}

// ─── Tiny query helpers (mirror better-sqlite3's API) ─────────────────────

function run(sql, params = []) {
  db.run(sql, params);
  save();
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const row = stmt.step() ? stmt.getAsObject() : undefined;
  stmt.free();
  return row;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows = [];
  while (stmt.step()) rows.push(stmt.getAsObject());
  stmt.free();
  return rows;
}

function transaction(fn) {
  db.run('BEGIN;');
  try {
    fn();
    db.run('COMMIT;');
    save();
  } catch (err) {
    db.run('ROLLBACK;');
    throw err;
  }
}

// ─── Schema ────────────────────────────────────────────────────────────────

function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS user (
      user_id       TEXT NOT NULL,
      guild_id      TEXT NOT NULL,
      name          TEXT,
      class         TEXT,
      level         INTEGER NOT NULL DEFAULT 1,
      hitpoints     INTEGER NOT NULL DEFAULT 100,
      administrator INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (user_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS balance (
      balance_id  INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     TEXT NOT NULL,
      guild_id    TEXT NOT NULL,
      platinum    INTEGER NOT NULL DEFAULT 0,
      gold        INTEGER NOT NULL DEFAULT 0,
      silver      INTEGER NOT NULL DEFAULT 0,
      copper      INTEGER NOT NULL DEFAULT 0,
      UNIQUE (user_id, guild_id)
    );

    CREATE TABLE IF NOT EXISTS item (
      item_id     INTEGER PRIMARY KEY AUTOINCREMENT,
      guild_id    TEXT NOT NULL,
      name        TEXT NOT NULL,
      description TEXT,
      rarity      TEXT NOT NULL DEFAULT 'common',
      image_url   TEXT,
      hidden      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id   TEXT NOT NULL,
      guild_id  TEXT NOT NULL,
      item_id   INTEGER NOT NULL,
      amount    INTEGER NOT NULL DEFAULT 1,
      hidden    INTEGER NOT NULL DEFAULT 0,
      timestamp TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
}

// ─── Internal helpers ──────────────────────────────────────────────────────

function ensureUser(userId, guildId) {
  run(`INSERT OR IGNORE INTO user (user_id, guild_id) VALUES (?, ?)`, [userId, guildId]);
  run(`INSERT OR IGNORE INTO balance (user_id, guild_id) VALUES (?, ?)`, [userId, guildId]);
}

// ─── User / Player helpers ─────────────────────────────────────────────────

function hasPlayer(userId, guildId) {
  const row = get(`SELECT name FROM user WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
  return !!(row && row.name);
}

function createPlayer(userId, guildId, name, playerClass, level = 1, hitpoints = 100) {
  run(`
    INSERT INTO user (user_id, guild_id, name, class, level, hitpoints)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET
      name      = excluded.name,
      class     = excluded.class,
      level     = excluded.level,
      hitpoints = excluded.hitpoints
  `, [userId, guildId, name, playerClass, level, hitpoints]);
  run(`INSERT OR IGNORE INTO balance (user_id, guild_id) VALUES (?, ?)`, [userId, guildId]);
}

function getUser(userId, guildId) {
  return get(`SELECT * FROM user WHERE user_id = ? AND guild_id = ?`, [userId, guildId]);
}

function updateUser(userId, guildId, fields) {
  const allowed = ['name', 'class', 'level', 'hitpoints', 'administrator'];
  const keys = Object.keys(fields).filter(k => allowed.includes(k));
  if (!keys.length) return;
  const set = keys.map(k => `${k} = ?`).join(', ');
  run(`UPDATE user SET ${set} WHERE user_id = ? AND guild_id = ?`,
    [...keys.map(k => fields[k]), userId, guildId]);
}

// ─── Balance helpers ───────────────────────────────────────────────────────

const CURRENCIES = ['platinum', 'gold', 'silver', 'copper'];

function getBalance(userId, guildId) {
  ensureUser(userId, guildId);
  return get(`SELECT platinum, gold, silver, copper FROM balance WHERE user_id = ? AND guild_id = ?`,
    [userId, guildId]);
}

function addBalance(userId, guildId, currency, amount) {
  if (!CURRENCIES.includes(currency)) throw new Error(`Invalid currency: ${currency}`);
  ensureUser(userId, guildId);
  run(`UPDATE balance SET ${currency} = ${currency} + ? WHERE user_id = ? AND guild_id = ?`,
    [amount, userId, guildId]);
  return getBalance(userId, guildId);
}

function transferBalance(fromId, toId, guildId, currency, amount) {
  if (!CURRENCIES.includes(currency)) throw new Error(`Invalid currency: ${currency}`);
  const fromBal = getBalance(fromId, guildId);
  if (fromBal[currency] < amount)
    return { success: false, reason: 'insufficient_funds', have: fromBal[currency] };
  transaction(() => {
    db.run(`UPDATE balance SET ${currency} = ${currency} - ? WHERE user_id = ? AND guild_id = ?`,
      [amount, fromId, guildId]);
    db.run(`UPDATE balance SET ${currency} = ${currency} + ? WHERE user_id = ? AND guild_id = ?`,
      [amount, toId, guildId]);
  });
  return { success: true };
}

// ─── Item helpers ──────────────────────────────────────────────────────────

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

const RARITY_COLORS = {
  common:    0xAAAAAA,
  uncommon:  0x57F287,
  rare:      0x5865F2,
  epic:      0xAB47BC,
  legendary: 0xF4C542,
};

function createItem(guildId, name, description = null, rarity = 'common', imageUrl = null, hidden = false) {
  run(`INSERT INTO item (guild_id, name, description, rarity, image_url, hidden) VALUES (?, ?, ?, ?, ?, ?)`,
    [guildId, name, description, rarity, imageUrl, hidden ? 1 : 0]);
  return get(`SELECT last_insert_rowid() AS id`).id;
}

function getItem(itemId) {
  return get(`SELECT * FROM item WHERE item_id = ?`, [itemId]);
}

function findItem(guildId, name) {
  return get(`SELECT * FROM item WHERE guild_id = ? AND name LIKE ? LIMIT 1`, [guildId, name]);
}

function listItems(guildId) {
  return all(`SELECT * FROM item WHERE guild_id = ? ORDER BY rarity, name`, [guildId]);
}

// ─── Inventory helpers ─────────────────────────────────────────────────────

function getInventory(userId, guildId) {
  return all(`
    SELECT inv.id, inv.item_id, inv.amount, inv.hidden AS inv_hidden, inv.timestamp,
           it.name, it.description, it.rarity, it.image_url,
           it.hidden AS item_hidden
    FROM inventory inv
    JOIN item it ON inv.item_id = it.item_id
    WHERE inv.user_id = ? AND inv.guild_id = ?
    ORDER BY inv.timestamp ASC
  `, [userId, guildId]);
}

function addItemToInventory(userId, guildId, itemId, amount = 1, hidden = false) {
  ensureUser(userId, guildId);
  const existing = get(`
    SELECT id FROM inventory
    WHERE user_id = ? AND guild_id = ? AND item_id = ? AND hidden = ?
  `, [userId, guildId, itemId, hidden ? 1 : 0]);

  if (existing) {
    run(`UPDATE inventory SET amount = amount + ? WHERE id = ?`, [amount, existing.id]);
  } else {
    run(`INSERT INTO inventory (user_id, guild_id, item_id, amount, hidden) VALUES (?, ?, ?, ?, ?)`,
      [userId, guildId, itemId, amount, hidden ? 1 : 0]);
  }
}

function removeItemFromInventory(userId, guildId, itemId, amount = 1) {
  const row = get(`
    SELECT id, amount FROM inventory
    WHERE user_id = ? AND guild_id = ? AND item_id = ? LIMIT 1
  `, [userId, guildId, itemId]);
  if (!row) return false;

  if (row.amount <= amount) {
    run(`DELETE FROM inventory WHERE id = ?`, [row.id]);
  } else {
    run(`UPDATE inventory SET amount = amount - ? WHERE id = ?`, [amount, row.id]);
  }
  return true;
}

function transferItem(fromId, toId, guildId, itemId, amount = 1) {
  const row = get(`
    SELECT id, amount FROM inventory
    WHERE user_id = ? AND guild_id = ? AND item_id = ? LIMIT 1
  `, [fromId, guildId, itemId]);
  if (!row) return { success: false, reason: 'not_found' };
  if (row.amount < amount) return { success: false, reason: 'insufficient_amount', have: row.amount };

  transaction(() => {
    if (row.amount <= amount) {
      db.run(`DELETE FROM inventory WHERE id = ?`, [row.id]);
    } else {
      db.run(`UPDATE inventory SET amount = amount - ? WHERE id = ?`, [amount, row.id]);
    }
    const existing = get(`
      SELECT id FROM inventory WHERE user_id = ? AND guild_id = ? AND item_id = ? AND hidden = 0
    `, [toId, guildId, itemId]);
    if (existing) {
      db.run(`UPDATE inventory SET amount = amount + ? WHERE id = ?`, [amount, existing.id]);
    } else {
      db.run(`INSERT INTO inventory (user_id, guild_id, item_id, amount, hidden) VALUES (?, ?, ?, ?, 0)`,
        [toId, guildId, itemId, amount]);
    }
  });
  return { success: true };
}

module.exports = {
  ready,
  CURRENCIES, RARITIES, RARITY_COLORS,
  hasPlayer, createPlayer, getUser, updateUser,
  getBalance, addBalance, transferBalance,
  createItem, getItem, findItem, listItems,
  getInventory, addItemToInventory, removeItemFromInventory, transferItem,
};