# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install            # one-time
npm run dev            # Vite dev server on :8080 (host 0.0.0.0, falls forward if 8080 busy)
npm run build          # Vite production build → ./dist
npm run preview        # serve ./dist on :8080 (also exposes /api/integration-probe)

npm run docker:build       # vite build on host, then `docker build -f Dockerfile`
npm run docker:build:full  # multi-stage build that runs `npm ci && vite build` inside Docker
```

There is no test runner, lint, or typecheck script configured — `npm run build` is the only correctness gate.

## Stack

React 19 + Vite 8 + Tailwind 4 (via `@tailwindcss/vite`), `recharts` for charts. JS/JSX only — no TypeScript. ESM (`"type": "module"`).

## Architecture

### Single-page shell with lazy view modules

`src/main.jsx` mounts `<App>` inside `<ErrorBoundary>`. `src/App.jsx` is the entire app shell:

1. **Auth gate.** If no valid user is in `localStorage["skrgus-user"]`, render `AuthLanding`. There is no real auth — `handleAuthenticate` just validates name/email/role shape and persists the object. Demo/marketing UI.
2. **Workspace.** Once "signed in", render a fixed sidebar + a single `<ActiveComponent />` mounted in `<Suspense>`. The sidebar's resizable width is persisted in `localStorage["skrgus-sidebar-width"]` (clamped 240–480, default 292).

The four views in App.jsx's `views` array are lazy-imported. **Three of them live at the repo root, not in `src/`:**

- `observability-chat.jsx` — main demo view (chart + chat scenarios, recharts)
- `arch-diagram.jsx` — architecture map
- `ask-argus-finspot-architecture.jsx` — product structure (component: `AskArgusFinspot`)
- `src/SettingsIntegrations.jsx` — admin/integrations panel (the only view inside `src/`)

When adding a view, register it in the `views` array in `src/App.jsx` (id, eyebrow, title, icon, navLabel, navStatus, description, component). The `id === "settings"` and `id === "observability"` strings are hardcoded in the stage-class selector — keep them or update both places.

### Branding

The repo directory is `nexiq` and `package.json` `name` is `skrgus`, but the product is consistently branded **"SK RGUS"** with the assistant **"Ask Argus"**. UI strings, localStorage keys (`skrgus-*`), the nginx image tag (`skrgus-web`), and k8s manifests all use `skrgus`. Don't introduce a new brand name unless asked.

### Integration probe (dev/preview only backend)

Settings → Integrations runs reachability checks. There are two cooperating pieces:

- `integrationProbeDevPlugin.js` — Vite plugin registered in `vite.config.js`. Adds `GET /api/integration-probe?url=...` middleware to **both** `configureServer` and `configurePreviewServer`. Performs the fetch from Node (no CORS) with a 12s timeout, returns `{ ok, detail, via: "server" }`.
- `src/integrationProbe.js` — client. `probeHttp` first tries the same-origin dev endpoint; if the response isn't a valid `via: "server"` JSON, falls back to a direct browser `fetch` (subject to CORS). `resolveProbeTarget` filters out non-HTTP schemes (postgres://, mongodb://, redis://...), Slack channel IDs (`#...`), and CIDRs.

In the production nginx image there is **no** `/api/integration-probe`; probes silently degrade to the browser-fetch path. If you need server-side probes in production, add a real backend — don't extend the Vite dev plugin.

### Dev tunnels

`vite.config.js` allow-lists `*.loca.lt`, `*.localtunnel.me`, `*.ngrok-free.app`, `*.ngrok.io`, `*.trycloudflare.com` for both `server` and `preview`. Add new tunnel hosts there, not via env.

## Deployment

Two Dockerfiles, intentionally distinct:

- **`Dockerfile`** (used by `npm run docker:build` and the GitHub Action) — assumes `./dist` is already built on the host. Just nginx + static assets. Faster, avoids npm-in-Docker TLS/proxy issues. The action runs `actions/checkout` only — there is no `npm ci` step in the workflow, which means **CI relies on `dist/` being committed**. `dist/` is currently checked in.
- **`Dockerfile.build`** — multi-stage; runs `npm ci && vite build` inside the image. Use when the host can't build (CI without Node, corporate proxy with custom CA, etc.).

`nginx.conf` is an SPA fallback (`try_files $uri $uri/ /index.html`) with a 1-year immutable cache on `/assets/` (Vite's hashed bundle output).

`.github/workflows/docker-publish.yml` pushes to `ghcr.io/<owner>/<repo>` on push to `main`, on `v*` tags, or via manual dispatch. `k8s/deployment.yaml` ships with `image: skrgus-web:latest` — retag to the GHCR image before applying.

## Conventions worth knowing

- **Three view files at the repo root** (`observability-chat.jsx`, `arch-diagram.jsx`, `ask-argus-finspot-architecture.jsx`) are imported as `../foo.jsx` from `src/App.jsx`. This is deliberate — don't "tidy" them into `src/` without updating the import paths and Vite's lazy-import URLs.
- **Inline styles + a shared color palette object** are the norm in the diagram/view files (search `const C = {` in `arch-diagram.jsx`, `const COLORS = {` in `ask-argus-finspot-architecture.jsx`). The shell (App, AuthLanding, SettingsIntegrations) uses Tailwind utility classes + `src/styles.css`. Match the file's existing style — don't mix.
- LocalStorage keys are namespaced `skrgus-*`. If you add new persisted state, follow that prefix.
