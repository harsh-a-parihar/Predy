import { config } from "../utils/config.js";

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

/**
 * @typedef {{ fullAutonomy: boolean, autoApprovePercent: number }} AutonomyPolicy
 */

export function normalizeAutonomy(input = {}) {
  const full =
    Boolean(input.fullAutonomy) ||
    Boolean(input.full_autonomy) ||
    String(input.mode || "").toLowerCase() === "full" ||
    String(input.mode || "").toLowerCase() === "you_are_on_your_own";

  const raw = input.autoApprovePercent ?? input.auto_approve_percent;
  const pct =
    raw === undefined || raw === null || raw === ""
      ? config.defaultAutonomyAutoApprovePercent
      : Number(raw);

  return {
    fullAutonomy: full,
    autoApprovePercent: clamp(Number.isFinite(pct) ? pct : 95, 0, 100)
  };
}

/**
 * When public confidence is below 55%, require human approval unless:
 * - full autonomy ("you are on your own"), or
 * - probabilistic auto-approve (default 95% of low-confidence cases still proceed).
 */
export function shouldPauseForApproval({ publicConfidence, autonomy }) {
  const a = autonomy || normalizeAutonomy({});
  if (a.fullAutonomy) return false;
  if (Number(publicConfidence) >= 55) return false;
  if (Math.random() * 100 < a.autoApprovePercent) return false;
  return true;
}

/** @deprecated use shouldPauseForApproval */
export function requiresHumanApproval({ publicConfidence }) {
  return shouldPauseForApproval({
    publicConfidence,
    autonomy: normalizeAutonomy({ fullAutonomy: false, autoApprovePercent: 0 })
  });
}
