export function requiresHumanApproval({ publicConfidence }) {
  return Number(publicConfidence) < 55;
}
