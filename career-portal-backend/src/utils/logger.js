/**
 * Centralized server logging for the Gradious Career Portal API.
 *
 * Use this module instead of raw `console.*` so messages share a prefix,
 * respect log levels, and can be tuned per environment.
 *
 * Environment:
 * - `NODE_ENV=production` → default minimum level is **info** (debug is silent).
 * - Otherwise → default minimum level is **debug**.
 * - `LOG_LEVEL=error|warn|info|debug` overrides the default minimum level.
 */

const LEVEL_ORDER = { error: 0, warn: 1, info: 2, debug: 3 };

function minLevel() {
  const fromEnv = (process.env.LOG_LEVEL || "").toLowerCase().trim();
  if (fromEnv && LEVEL_ORDER[fromEnv] !== undefined) {
    return LEVEL_ORDER[fromEnv];
  }
  return process.env.NODE_ENV === "production"
    ? LEVEL_ORDER.info
    : LEVEL_ORDER.debug;
}

const threshold = minLevel();

function shouldLog(level) {
  return LEVEL_ORDER[level] <= threshold;
}

function write(level, args) {
  if (!shouldLog(level)) return;
  const prefix = "[gradious-api]";
  const tag = `[${level.toUpperCase()}]`;
  if (level === "error") {
    console.error(prefix, tag, ...args);
  } else if (level === "warn") {
    console.warn(prefix, tag, ...args);
  } else if (level === "debug") {
    console.debug(prefix, tag, ...args);
  } else {
    console.log(prefix, tag, ...args);
  }
}

const logger = {
  /** Verbose diagnostics (disabled in production by default). */
  debug: (...args) => write("debug", args),
  /** Normal operational messages (startup, successful side effects). */
  info: (...args) => write("info", args),
  /** Recoverable issues, deprecated usage, external service degradation. */
  warn: (...args) => write("warn", args),
  /** Failures and exceptions — always emitted when at or above `error` threshold. */
  error: (...args) => write("error", args),
};

module.exports = logger;
