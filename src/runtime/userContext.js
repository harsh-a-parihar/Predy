/**
 * Helpers to expose current user in config (optional mirror for debugging).
 * Prefer reading from GET /api/predy/status → data.user.
 */

import { getUser } from "../user/userStore.js";

export function getCurrentUserFromRequest(req) {
  const uid = req?.headers?.["x-user-id"] || req?.headers?.["X-User-Id"];
  if (!uid) return null;
  return getUser(String(uid).trim());
}
