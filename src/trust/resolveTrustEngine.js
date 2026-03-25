import { ethers, Wallet } from "ethers";
import { VeriBondEngine } from "./VeriBondEngine.js";
import { getUser } from "../user/userStore.js";

function normalizeAddr(a) {
  try {
    return ethers.getAddress(String(a).trim());
  } catch {
    return null;
  }
}

function addressFromPrivateKey(pk) {
  if (!pk || typeof pk !== "string" || !pk.startsWith("0x") || pk.length < 64) return null;
  try {
    return new Wallet(pk).address;
  } catch {
    return null;
  }
}

/**
 * @param {import("../utils/config.js").config} config
 * @param {VeriBondEngine | null} defaultEngine
 */
export function createResolveTrustEngine(config, defaultEngine) {
  /**
   * @param {import("express").Request} req
   * @returns {VeriBondEngine}
   */
  return function resolveTrustEngine(req) {
    const uid = req.headers["x-user-id"] || req.headers["X-User-Id"];
    if (uid) {
      const u = getUser(String(uid).trim());
      if (!u) {
        throw new Error("Invalid X-User-Id — link wallet first");
      }
      if (!u.onboardedAt) {
        throw new Error("User must complete onboarding (POST /user/onboard)");
      }
      const swarmAgents = { ...(u.swarmAgents || {}) };

      /** Server-stored key (dev / headless tests) */
      if (u.privateKey && String(u.privateKey).length > 10) {
        return new VeriBondEngine({
          config,
          privateKey: u.privateKey,
          swarmAgents,
          linkedWallet: u.linkedWallet
        });
      }

      /**
       * Browser-wallet sessions: no PK on server. If the linked address matches
       * PRIVATE_KEY in .env, the API can sign on behalf of the same account (demo).
       */
      const envAddr = addressFromPrivateKey(config.privateKey);
      const linked = normalizeAddr(u.linkedWallet);
      if (envAddr && linked && envAddr.toLowerCase() === linked.toLowerCase()) {
        return new VeriBondEngine({
          config,
          privateKey: config.privateKey,
          swarmAgents,
          linkedWallet: u.linkedWallet
        });
      }

      throw new Error(
        "This session has no server signing key. Connect the same wallet as PRIVATE_KEY in .env for API-side staking, or use client-side contract calls from the dashboard."
      );
    }
    if (defaultEngine) {
      return defaultEngine;
    }
    throw new Error(
      "Set X-User-Id after onboarding, or configure PRIVATE_KEY in .env for legacy single-wallet mode."
    );
  };
}
