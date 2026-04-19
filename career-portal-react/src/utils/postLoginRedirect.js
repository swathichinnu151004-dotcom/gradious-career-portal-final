/**
 * Where to send a candidate after login. Blocks open redirects.
 * @param {string} candidate Path + optional query, e.g. `/user/jobs?department=Sales`
 * @returns {string|null} Safe path or null to use default dashboard
 */
export function getSafeUserPostLoginPath(candidate) {
  if (!candidate || typeof candidate !== "string") return null;
  const trimmed = candidate.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return null;
  if (trimmed.includes("://")) return null;
  const pathOnly = trimmed.split("?")[0];
  if (pathOnly.startsWith("/user/") || pathOnly.startsWith("/job-details")) {
    return trimmed;
  }
  return null;
}
