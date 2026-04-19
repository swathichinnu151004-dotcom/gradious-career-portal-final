/**
 * Client-side logging helper for the Gradious Career Portal SPA.
 *
 * - **development**: `debug` / `info` / `warn` / `error` go to the console.
 * - **production**: only `warn` and `error` are printed (reduces noise and data leakage).
 *
 * Prefer `logger.error` in catch blocks instead of bare `console.error`.
 */

const isDev = process.env.NODE_ENV === "development";

function safeArgs(args) {
  return args;
}

export const logger = {
  debug: (...args) => {
    if (isDev) console.debug("[gradious-app][DEBUG]", ...safeArgs(args));
  },
  info: (...args) => {
    if (isDev) console.info("[gradious-app][INFO]", ...safeArgs(args));
  },
  warn: (...args) => {
    console.warn("[gradious-app][WARN]", ...safeArgs(args));
  },
  error: (...args) => {
    console.error("[gradious-app][ERROR]", ...safeArgs(args));
  },
};

export default logger;
