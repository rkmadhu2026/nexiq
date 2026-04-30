/**
 * Vite plugin: GET /api/integration-probe?url=https%3A%2F%2F...
 * Runs fetch() from Node during `vite` and `vite preview` so probes are not limited by browser CORS.
 */

const PROBE_MS = 12000;

async function probeUrlFromServer(urlString) {
  const parsed = new URL(urlString);
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only http(s) URLs");
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), PROBE_MS);
  try {
    const res = await fetch(urlString, {
      method: "GET",
      redirect: "follow",
      signal: ctrl.signal,
      headers: {
        Accept: "*/*",
        "User-Agent": "SKRGUS-integration-probe/1.0",
      },
    });
    clearTimeout(timer);
    const status = res.status;
    if (status >= 200 && status < 400) {
      return { ok: true, detail: `HTTP ${status}`, via: "server" };
    }
    return { ok: false, detail: `HTTP ${status}`, via: "server" };
  } catch (e) {
    clearTimeout(timer);
    if (e?.name === "AbortError") {
      return { ok: false, detail: `Timeout (~${PROBE_MS / 1000}s)`, via: "server" };
    }
    const msg = typeof e?.message === "string" ? e.message : "Network error";
    return { ok: false, detail: msg.slice(0, 120), via: "server" };
  }
}

function integrationProbeMiddleware() {
  return async function integrationProbeMiddlewareInner(req, res, next) {
    let resolved;
    try {
      resolved = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    } catch {
      next();
      return;
    }

    if (resolved.pathname !== "/api/integration-probe") {
      next();
      return;
    }

    const target = resolved.searchParams.get("url");
    if (!target || !target.trim()) {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, detail: "Missing url query parameter", via: "server" }));
      return;
    }

    try {
      new URL(target);
    } catch {
      res.statusCode = 400;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, detail: "Invalid url", via: "server" }));
      return;
    }

    try {
      const result = await probeUrlFromServer(target);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify(result));
    } catch (e) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(
        JSON.stringify({
          ok: false,
          detail: String(e?.message || e).slice(0, 160),
          via: "server",
        }),
      );
    }
  };
}

export function integrationProbeDevPlugin() {
  const mw = integrationProbeMiddleware();
  return {
    name: "skrgus-integration-probe",
    configureServer(server) {
      server.middlewares.use(mw);
    },
    configurePreviewServer(server) {
      server.middlewares.use(mw);
    },
  };
}
