/**
 * Integration HTTP(S) probes. Prefer same-origin `/api/integration-probe` (Vite dev/preview Node fetch,
 * no CORS). Falls back to browser fetch when static hosting has no probe API.
 */

const PROBE_MS = 12000;

function abortAfter(ms) {
  const ctrl = new AbortController();
  const id = window.setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, cancel: () => window.clearTimeout(id) };
}

/**
 * @returns {Promise<{ ok: boolean, detail: string, via: 'server' } | null>}
 */
async function probeViaDevServer(url) {
  try {
    const qs = new URLSearchParams({ url });
    const r = await fetch(`/api/integration-probe?${qs.toString()}`, {
      method: "GET",
      credentials: "omit",
      headers: { Accept: "application/json" },
    });
    const raw = await r.text();
    let data;
    try {
      data = JSON.parse(raw);
    } catch {
      return null;
    }
    if (typeof data?.ok !== "boolean" || typeof data?.detail !== "string") return null;
    if (data.via !== "server") return null;
    return { ok: data.ok, detail: data.detail, via: "server" };
  } catch {
    return null;
  }
}

/**
 * @param {string} endpoint User-entered endpoint / URL / hostname / DB URI / channel id.
 * @returns {{ url: string } | null}
 */
export function resolveProbeTarget(endpoint) {
  const trimmed = endpoint.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      return { url: new URL(trimmed).href };
    } catch {
      return null;
    }
  }

  if (/^(postgresql|postgres|mysql|mongodb|redis):\/\//i.test(trimmed)) return null;
  if (trimmed.startsWith("#")) return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}\/\d{1,2}$/.test(trimmed)) return null;

  const hostLike = /^[a-z0-9][a-z0-9.-]*\.[a-z]{2,}$/i.test(trimmed);
  if (hostLike) {
    return { url: `https://${trimmed}/` };
  }

  return null;
}

/**
 * @param {string} url Absolute HTTP(S) URL.
 * @returns {Promise<{ ok: boolean, detail: string, via: 'server' | 'browser' }>}
 */
export async function probeHttp(url) {
  const server = await probeViaDevServer(url);
  if (server) {
    return server;
  }

  const { signal, cancel } = abortAfter(PROBE_MS);
  try {
    const res = await fetch(url, {
      method: "GET",
      mode: "cors",
      credentials: "omit",
      redirect: "follow",
      cache: "no-store",
      signal,
    });
    cancel();
    const status = res.status;
    if (status >= 200 && status < 400) {
      return { ok: true, detail: `HTTP ${status}`, via: "browser" };
    }
    return { ok: false, detail: `HTTP ${status}`, via: "browser" };
  } catch (e) {
    cancel();
    if (e?.name === "AbortError") {
      return { ok: false, detail: `Timeout (~${PROBE_MS / 1000}s)`, via: "browser" };
    }
    return { ok: false, detail: "Unreachable or blocked (CORS / network)", via: "browser" };
  }
}

/**
 * @param {string} endpoint
 * @returns {Promise<{ skipped: boolean, ok: boolean, summary: string }>}
 */
export async function probeIntegrationEndpoint(endpoint) {
  const target = resolveProbeTarget(endpoint);
  if (!target) {
    return {
      skipped: true,
      ok: false,
      summary: "Skipped · not an HTTP(S) URL",
    };
  }

  const result = await probeHttp(target.url);
  const viaNote = result.via === "server" ? " · dev server" : "";
  return {
    skipped: false,
    ok: result.ok,
    summary: result.ok
      ? `Probe OK · ${result.detail}${viaNote}`
      : `Probe failed · ${result.detail}${viaNote}`,
  };
}
