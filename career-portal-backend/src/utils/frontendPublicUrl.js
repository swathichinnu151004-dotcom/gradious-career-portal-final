/**
 * Links inside emails (recruiter invite, password reset).
 *
 * - FRONTEND_URL — used for OAuth redirects and as fallback for email links.
 * - EMAIL_LINK_BASE_URL — optional: when set, invite/reset links use this base instead
 *   of FRONTEND_URL. Use for demos (same Wi‑Fi: http://YOUR_PC_IP:3000, or a tunnel URL)
 *   while keeping FRONTEND_URL=http://localhost:3000 for your own browser.
 */

const logger = require("./logger");

let warnedLoopbackEmailBaseOnce = false;

function normalizeBase(raw) {
  return String(raw || "")
    .trim()
    .replace(/\/+$/, "");
}

/** Base URL for links in outgoing email (invite, password reset). */
function baseForEmailLinks() {
  const override = normalizeBase(process.env.EMAIL_LINK_BASE_URL);
  if (override) return override;
  return normalizeBase(process.env.FRONTEND_URL);
}

function isLoopbackBase(base) {
  if (!base) return false;
  try {
    const withProto = /^https?:\/\//i.test(base) ? base : `http://${base}`;
    const u = new URL(withProto);
    const h = String(u.hostname || "").toLowerCase();
    return (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h === "[::1]" ||
      h === "::1"
    );
  } catch {
    return /localhost|127\.0\.0\.1/i.test(base);
  }
}

function normalizeFrontendBase() {
  return normalizeBase(process.env.FRONTEND_URL);
}

/**
 * @returns {{ ok: true } | { ok: false, status: number, message: string }}
 */
function assertFrontendUrlOkForEmailLinks() {
  const base = baseForEmailLinks();
  if (!base) {
    return {
      ok: false,
      status: 500,
      message:
        "Set FRONTEND_URL in career-portal-backend/.env (e.g. http://localhost:3000). For demo invites to other people’s devices, also set EMAIL_LINK_BASE_URL to a URL they can open (see .env.example).",
    };
  }

  if (isLoopbackBase(base) && !warnedLoopbackEmailBaseOnce) {
    warnedLoopbackEmailBaseOnce = true;
    logger.warn(
      "[email] Invite/reset links use a loopback host — they only work on your PC. Before demo: set EMAIL_LINK_BASE_URL to your Wi‑Fi URL (http://YOUR_IP:3000) or a tunnel URL, then restart the server."
    );
  }

  return { ok: true };
}

/**
 * @param {string} pathWithLeadingSlash e.g. "/recruiter-signup"
 * @param {Record<string, string>} query
 * @returns {{ ok: true, url: string } | { ok: false, status: number, message: string }}
 */
function buildEmailAppUrl(pathWithLeadingSlash, query) {
  const baseCheck = assertFrontendUrlOkForEmailLinks();
  if (!baseCheck.ok) return baseCheck;

  const base = baseForEmailLinks();
  const q = new URLSearchParams(query).toString();
  const path = pathWithLeadingSlash.startsWith("/")
    ? pathWithLeadingSlash
    : `/${pathWithLeadingSlash}`;
  const url = `${base}${path}${q ? `?${q}` : ""}`;
  return { ok: true, url };
}

function recruiterSignupInviteUrl(token) {
  return buildEmailAppUrl("/recruiter-signup", { token });
}

function passwordResetUrl(token) {
  return buildEmailAppUrl("/reset-password", { token });
}

module.exports = {
  normalizeFrontendBase,
  assertFrontendUrlOkForEmailLinks,
  recruiterSignupInviteUrl,
  passwordResetUrl,
};
