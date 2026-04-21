/**
 * REST API base URL ending with `/api` (no trailing slash after `api`).
 * - Honors REACT_APP_API_URL when set.
 * - If that URL uses localhost/127.0.0.1 but the page is opened from another host
 *   (phone/tablet via LAN IP), the API host is rewritten to match the page so
 *   requests hit your dev machine instead of the device’s loopback.
 * - Otherwise uses the same host as the page (avoids localhost vs 127.0.0.1 mismatches).
 * - On CRA dev ports 3000/3001, targets the same hostname on port 5000.
 */
function loopbackHost(h) {
  return h === "localhost" || h === "127.0.0.1";
}

/** Rewrite env API URL when opened from LAN so mobile/other devices still reach the backend. */
function apiUrlFromEnvForWindow(fromEnv, win) {
  const trimmed = String(fromEnv).trim().replace(/\/$/, "");
  if (!win?.location) return trimmed;
  const { protocol, hostname: pageHost } = win.location;
  if (loopbackHost(pageHost)) return trimmed;

  let u;
  try {
    const withProto = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `http://${trimmed}`;
    u = new URL(withProto);
  } catch {
    return trimmed;
  }

  if (!loopbackHost(u.hostname)) return trimmed;

  const portPart = u.port ? `:${u.port}` : "";
  let path = (u.pathname || "").replace(/\/+$/, "");
  if (!path || path === "/") path = "/api";
  return `${protocol}//${pageHost}${portPart}${path}`;
}

export function getApiBaseUrl() {
  const fromEnv = process.env.REACT_APP_API_URL;
  if (fromEnv != null && String(fromEnv).trim() !== "") {
    if (typeof window !== "undefined" && window.location) {
      return apiUrlFromEnvForWindow(fromEnv, window);
    }
    return String(fromEnv).trim().replace(/\/$/, "");
  }

  if (typeof window === "undefined" || !window.location) {
    return "http://localhost:5000/api";
  }

  const { protocol, hostname, port } = window.location;

  if (port === "3000" || port === "3001") {
    return `${protocol}//${hostname}:5000/api`;
  }

  const portPart = port ? `:${port}` : "";
  return `${protocol}//${hostname}${portPart}/api`;
}

/** Server origin without `/api` — for uploads and static paths */
export function getServerOrigin() {
  return getApiBaseUrl().replace(/\/api\/?$/, "").replace(/\/$/, "");
}
