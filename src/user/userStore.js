import { randomUUID } from "node:crypto";
import { ethers } from "ethers";
import { config } from "../utils/config.js";
import {
  buildRecordFromDb,
  findSwarmByUserId,
  findUserByWallet,
  upsertSwarmRow,
  upsertUserRow
} from "../db/index.js";

/**
 * In-memory multi-user store (no simulation — real sessions).
 * Persisted to SQLite by wallet address (see ../db/index.js).
 */

/** @typedef {{ name?: string, email?: string, background?: string, [k: string]: unknown }} UserDetails */

/** @typedef {{
 *   userId: string,
 *   swarmId: string | null,
 *   linkedWallet: string,
 *   privateKey: string | null,
 *   userDetails: UserDetails,
 *   linkedAt: string,
 *   onboardedAt: string | null,
 *   swarmAgents: Record<string, string>,
 *   swarmMeta: Record<string, { goal?: string, skills?: string[], permissions?: string[], walletLinked?: boolean, createdAt?: string, txHash?: string, agentURI?: string }>
 * }} UserRecord */

const usersById = new Map();
/** @type {Map<string, string>} wallet lower -> userId */
const walletIndex = new Map();

function syncConfigMirror(rec) {
  if (!rec) {
    config.currentUser = null;
    config.linkedWallet = null;
    config.dynamicSwarm = null;
    return;
  }
  config.currentUser = rec.userId;
  config.linkedWallet = rec.linkedWallet;
  config.dynamicSwarm = {
    userId: rec.userId,
    swarmId: rec.swarmId,
    swarmAgents: rec.swarmAgents || {},
    swarmMeta: rec.swarmMeta || {},
    onboardedAt: rec.onboardedAt,
    linkedAt: rec.linkedAt
  };
}

function normalizeWallet(w) {
  return ethers.getAddress(String(w).trim());
}

function persistUserProfile(rec) {
  try {
    upsertUserRow({
      userId: rec.userId,
      wallet: rec.linkedWallet,
      email: rec.userDetails?.email,
      displayName: rec.userDetails?.name,
      profile: rec.userDetails || {}
    });
  } catch (e) {
    console.error("userStore.persistUserProfile", e?.message || e);
  }
}

export function verifyWalletMatchesPrivateKey(wallet, privateKey) {
  const pk = String(privateKey).trim();
  const w = new ethers.Wallet(pk.startsWith("0x") ? pk : `0x${pk}`);
  return w.address.toLowerCase() === normalizeWallet(wallet).toLowerCase();
}

/**
 * EIP-191 link — no private key stored on server (browser-wallet flow).
 * @param {{ wallet: string, signature: string, message: string, userDetails?: UserDetails }} body
 */
export function linkWalletWithSignature(body) {
  const wallet = normalizeWallet(body.wallet);
  const message = String(body.message || "");
  const signature = String(body.signature || "");
  if (!message || !signature) {
    throw new Error("message and signature required");
  }
  let recovered;
  try {
    recovered = ethers.verifyMessage(message, signature);
  } catch (e) {
    throw new Error(`Invalid signature: ${e?.message || e}`);
  }
  if (recovered.toLowerCase() !== wallet.toLowerCase()) {
    throw new Error("Signature does not match wallet address");
  }

  const existingMem = walletIndex.get(wallet.toLowerCase());
  if (existingMem) {
    const rec = usersById.get(existingMem);
    if (rec) {
      rec.userDetails = { ...rec.userDetails, ...(body.userDetails || {}) };
      rec.linkedAt = new Date().toISOString();
      syncConfigMirror(rec);
      persistUserProfile(rec);
      return { userId: rec.userId, reconnected: true, restoredFromDb: false };
    }
  }

  const urow = findUserByWallet(wallet);
  if (urow) {
    const srow = findSwarmByUserId(urow.user_id);
    const rec = buildRecordFromDb(urow, srow);
    rec.userDetails = { ...rec.userDetails, ...(body.userDetails || {}) };
    rec.linkedAt = new Date().toISOString();
    usersById.set(rec.userId, rec);
    walletIndex.set(wallet.toLowerCase(), rec.userId);
    syncConfigMirror(rec);
    persistUserProfile(rec);
    return { userId: rec.userId, reconnected: true, restoredFromDb: true };
  }

  const userId = `user-${randomUUID()}`;
  /** @type {UserRecord} */
  const rec = {
    userId,
    swarmId: null,
    linkedWallet: wallet,
    privateKey: null,
    userDetails: body.userDetails || {},
    linkedAt: new Date().toISOString(),
    onboardedAt: null,
    swarmAgents: {},
    swarmMeta: {}
  };
  usersById.set(userId, rec);
  walletIndex.set(wallet.toLowerCase(), userId);
  syncConfigMirror(rec);
  persistUserProfile(rec);
  return { userId, reconnected: false, restoredFromDb: false };
}

/**
 * @param {{ wallet: string, privateKey: string, userDetails?: UserDetails }} body
 */
export function linkWallet(body) {
  const wallet = normalizeWallet(body.wallet);
  if (!verifyWalletMatchesPrivateKey(wallet, body.privateKey)) {
    throw new Error("privateKey does not match wallet address");
  }

  const pkNorm = body.privateKey.trim().startsWith("0x") ? body.privateKey.trim() : `0x${body.privateKey.trim()}`;

  const existingMem = walletIndex.get(wallet.toLowerCase());
  if (existingMem) {
    const rec = usersById.get(existingMem);
    if (rec) {
      rec.privateKey = pkNorm;
      rec.userDetails = { ...rec.userDetails, ...(body.userDetails || {}) };
      rec.linkedAt = new Date().toISOString();
      syncConfigMirror(rec);
      persistUserProfile(rec);
      return { userId: rec.userId, reconnected: true, restoredFromDb: false };
    }
  }

  const urow = findUserByWallet(wallet);
  if (urow) {
    const srow = findSwarmByUserId(urow.user_id);
    const rec = buildRecordFromDb(urow, srow);
    rec.privateKey = pkNorm;
    rec.userDetails = { ...rec.userDetails, ...(body.userDetails || {}) };
    rec.linkedAt = new Date().toISOString();
    usersById.set(rec.userId, rec);
    walletIndex.set(wallet.toLowerCase(), rec.userId);
    syncConfigMirror(rec);
    persistUserProfile(rec);
    return { userId: rec.userId, reconnected: true, restoredFromDb: true };
  }

  const userId = `user-${randomUUID()}`;
  /** @type {UserRecord} */
  const rec = {
    userId,
    swarmId: null,
    linkedWallet: wallet,
    privateKey: pkNorm,
    userDetails: body.userDetails || {},
    linkedAt: new Date().toISOString(),
    onboardedAt: null,
    swarmAgents: {},
    swarmMeta: {}
  };
  usersById.set(userId, rec);
  walletIndex.set(wallet.toLowerCase(), userId);
  syncConfigMirror(rec);
  persistUserProfile(rec);
  return { userId, reconnected: false, restoredFromDb: false };
}

export function disconnectUser(userId) {
  const rec = usersById.get(userId);
  if (!rec) return false;
  walletIndex.delete(rec.linkedWallet.toLowerCase());
  usersById.delete(userId);
  if (config.currentUser === userId) {
    syncConfigMirror(null);
  }
  return true;
}

export function getUser(userId) {
  return usersById.get(userId) || null;
}

export function setOnboarded(userId, { swarmId, swarmAgents, swarmMeta }) {
  const rec = usersById.get(userId);
  if (!rec) throw new Error("User not found");
  rec.swarmId = swarmId;
  rec.swarmAgents = swarmAgents;
  rec.swarmMeta = swarmMeta || {};
  rec.onboardedAt = new Date().toISOString();
  syncConfigMirror(rec);
  try {
    upsertSwarmRow({ userId, swarmId, swarmAgents, swarmMeta: rec.swarmMeta });
    persistUserProfile(rec);
  } catch (e) {
    console.error("userStore.setOnboarded.persist", e?.message || e);
  }
}
