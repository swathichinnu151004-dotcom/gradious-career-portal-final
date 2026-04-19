import { useEffect, useState } from "react";

export const AUTH_API_BASE = "http://localhost:5000/api";

export function normalizeGoogleWebClientId(value) {
  let s = String(value || "").trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

export function getEnvGoogleClientId() {
  return normalizeGoogleWebClientId(process.env.REACT_APP_GOOGLE_CLIENT_ID);
}

/**
 * Resolves Web client id from env or GET /auth/google-client-id.
 */
export function useGoogleAuthClientId() {
  const envClientId = getEnvGoogleClientId();
  const [remoteClientId, setRemoteClientId] = useState(null);

  useEffect(() => {
    if (envClientId) {
      setRemoteClientId("");
      return;
    }
    let cancelled = false;
    fetch(`${AUTH_API_BASE}/auth/google-client-id`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((data) => {
        if (cancelled) return;
        setRemoteClientId(
          normalizeGoogleWebClientId(
            typeof data?.clientId === "string" ? data.clientId : ""
          )
        );
      })
      .catch(() => {
        if (!cancelled) setRemoteClientId("");
      });
    return () => {
      cancelled = true;
    };
  }, [envClientId]);

  const effectiveClientId = envClientId || (remoteClientId ?? "");
  const loadingRemote = !envClientId && remoteClientId === null;

  return { effectiveClientId, loadingRemote };
}
