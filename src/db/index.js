import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { config } from "../utils/config.js";

let _db = null;

function dbPath() {
  const p = config.predyDbPath || path.join(process.cwd(), "data", "predy.db");
  return path.resolve(p);
}

export function getDb() {
  if (_db) return _db;
  const file = dbPath();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  _db = new Database(file);
  _db.pragma("journal_mode = WAL");
  _db.pragma("foreign_keys = ON");
  _db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      user_id TEXT PRIMARY KEY,
      wallet_address TEXT NOT NULL COLLATE NOCASE,
      email TEXT,
      display_name TEXT,
      profile_json TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
    CREATE TABLE IF NOT EXISTS swarms (
      swarm_id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      onboarded_at TEXT NOT NULL,
      swarm_agents_json TEXT NOT NULL,
      swarm_meta_json TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_swarms_user ON swarms(user_id);
  `);
  return _db;
}

/**
 * @param {string} wallet checksummed
 */
export function findUserByWallet(wallet) {
  const db = getDb();
  const row = db.prepare("SELECT * FROM users WHERE lower(wallet_address) = lower(?)").get(wallet);
  return row || null;
}

/**
 * @param {string} userId
 */
export function findSwarmByUserId(userId) {
  const db = getDb();
  return db.prepare("SELECT * FROM swarms WHERE user_id = ?").get(userId) || null;
}

/**
 * @param {{
 *   userId: string,
 *   wallet: string,
 *   email?: string,
 *   displayName?: string,
 *   profile?: object
 * }} p
 */
export function upsertUserRow(p) {
  const db = getDb();
  const now = new Date().toISOString();
  const profileJson = p.profile ? JSON.stringify(p.profile) : "{}";
  db.prepare(
    `INSERT INTO users (user_id, wallet_address, email, display_name, profile_json, created_at, updated_at)
     VALUES (@userId, @wallet, @email, @displayName, @profileJson, @now, @now)
     ON CONFLICT(user_id) DO UPDATE SET
       email = excluded.email,
       display_name = excluded.display_name,
       profile_json = excluded.profile_json,
       updated_at = excluded.updated_at`
  ).run({
    userId: p.userId,
    wallet: p.wallet,
    email: p.email || "",
    displayName: p.displayName || "",
    profileJson,
    now
  });
}

/**
 * @param {object} userRow
 * @param {object | null} swarmRow
 */
export function buildRecordFromDb(userRow, swarmRow) {
  const profile = userRow.profile_json ? JSON.parse(userRow.profile_json) : {};
  const rec = {
    userId: userRow.user_id,
    linkedWallet: userRow.wallet_address,
    privateKey: null,
    userDetails: profile,
    linkedAt: userRow.updated_at,
    swarmId: null,
    onboardedAt: null,
    swarmAgents: {},
    swarmMeta: {}
  };
  if (swarmRow) {
    rec.swarmId = swarmRow.swarm_id;
    rec.onboardedAt = swarmRow.onboarded_at;
    rec.swarmAgents = JSON.parse(swarmRow.swarm_agents_json || "{}");
    rec.swarmMeta = JSON.parse(swarmRow.swarm_meta_json || "{}");
  }
  return rec;
}

/**
 * @param {{
 *   userId: string,
 *   swarmId: string,
 *   swarmAgents: Record<string, string>,
 *   swarmMeta: Record<string, unknown>
 * }} p
 */
export function upsertSwarmRow(p) {
  const db = getDb();
  const now = new Date().toISOString();
  db.prepare(
    `INSERT INTO swarms (swarm_id, user_id, onboarded_at, swarm_agents_json, swarm_meta_json)
     VALUES (@swarmId, @userId, @onboardedAt, @agents, @meta)
     ON CONFLICT(swarm_id) DO UPDATE SET
       swarm_agents_json = excluded.swarm_agents_json,
       swarm_meta_json = excluded.swarm_meta_json,
       onboarded_at = excluded.onboarded_at`
  ).run({
    swarmId: p.swarmId,
    userId: p.userId,
    onboardedAt: now,
    agents: JSON.stringify(p.swarmAgents),
    meta: JSON.stringify(p.swarmMeta)
  });
  db.prepare("UPDATE users SET updated_at = ? WHERE user_id = ?").run(now, p.userId);
}
