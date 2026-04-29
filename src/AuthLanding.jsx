import { useState } from "react";

const authFeatures = [
  { label: "Multi-client workspace", detail: "Switch between clients, applications, integrations, and environments without losing operational context." },
  { label: "Evidence-first answers", detail: "Ask about failures and get cited metrics, logs, runbooks, Kubernetes events, and application data." },
  { label: "Admin settings included", detail: "Manage SSO, RBAC, retention, audit logging, connector status, and client-level application details." },
];

const trustLogos = ["Prometheus", "Loki", "Elasticsearch", "Kubernetes", "Slack", "PostgreSQL"];

const landingStats = [
  { label: "clients monitored", value: "24" },
  { label: "apps connected", value: "186" },
  { label: "integrations ready", value: "38" },
];

const topologyNodes = [
  { label: "Observe", tone: "mint" },
  { label: "Clients", tone: "blue" },
  { label: "Apps", tone: "gold" },
  { label: "Logs", tone: "rose" },
  { label: "Admin", tone: "slate" },
  { label: "Runbooks", tone: "mint" },
];

const insightRows = [
  ["checkout-api", "OOM root cause", "hot"],
  ["Job queue", "depth risk", "warn"],
  ["Tenant acme API", "within SLA", "good"],
  ["Admin audit", "enabled", "good"],
];

function AuthForm({ mode, onModeChange, onAuthenticate, authError }) {
  const isSignup = mode === "signup";
  const [form, setForm] = useState({
    name: "NexIQ Admin",
    email: "admin@nexiq.ai",
    password: "demo1234",
    company: "NexIQ Production",
  });

  const handleSubmit = (event) => {
    event.preventDefault();
    const email = form.email.trim();
    onAuthenticate({
      name: isSignup ? form.name.trim() : "NexIQ Admin",
      email,
      company: isSignup ? form.company.trim() : "NexIQ Production",
      role: "Admin",
    });
  };

  return (
    <section className="auth-card">
      <p>{isSignup ? "Create Account" : "Welcome Back"}</p>
      <h2>{isSignup ? "Start your NexIQ workspace" : "Sign in to NexIQ"}</h2>
      <span>
        {isSignup
          ? "Create a secure admin profile for client integrations and AI operations."
          : "Use the demo credentials below to open the local workspace."}
      </span>

      {authError && (
        <p className="auth-error" role="alert">
          {authError}
        </p>
      )}

      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        {isSignup && (
          <>
            <label>
              Full name
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              />
            </label>
            <label>
              Company / client
              <input
                value={form.company}
                onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
              />
            </label>
          </>
        )}
        <label>
          Work email
          <input
            type="text"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={form.password}
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
          />
        </label>
        <button className="auth-primary" type="submit">
          {isSignup ? "Create workspace" : "Sign in"}
        </button>
      </form>

      <button
        className="auth-link"
        type="button"
        onClick={() => onModeChange(isSignup ? "signin" : "signup")}
      >
        {isSignup ? "Already have an account? Sign in" : "New to NexIQ? Create an account"}
      </button>
    </section>
  );
}

export default function AuthLanding({ mode, onModeChange, onAuthenticate, authError = null }) {
  if (mode === "signin" || mode === "signup") {
    return (
      <main className="auth-shell">
        <div className="auth-brand">
          <div className="brand-mark">NQ</div>
          <span>NexusIQ</span>
        </div>
        <AuthForm
          mode={mode}
          onModeChange={onModeChange}
          onAuthenticate={onAuthenticate}
          authError={authError}
        />
      </main>
    );
  }

  return (
    <main className="auth-shell landing">
      <nav className="landing-nav">
        <div className="auth-brand">
          <div className="brand-mark">NQ</div>
          <span>NexusIQ</span>
        </div>
        <div className="landing-menu" aria-label="Landing page sections">
          <span>Workspace</span>
          <span>Integrations</span>
          <span>Admin</span>
          <span>Security</span>
        </div>
        <div>
          <button type="button" onClick={() => onModeChange("signin")}>Sign in</button>
          <button type="button" onClick={() => onModeChange("signup")}>Sign up</button>
        </div>
      </nav>

      <section className="landing-hero innovative">
        <div className="hero-copy">
          <div className="hero-live-row">
            <span className="live-pill">NexIQ desktop</span>
            <span>Observability, client apps, integrations, and admin settings in one clean workspace</span>
          </div>
          <h1 className="hero-title">
            <span>One calm workspace for</span>
            <span>multi-client operations.</span>
            <em>Built for real incidents.</em>
          </h1>
          <span>
            NexIQ brings your observability chat, product architecture, client application details,
            integration status, and admin controls into a single light desktop interface.
          </span>
          <div className="landing-actions">
            <button type="button" onClick={() => onModeChange("signup")}>Open NexIQ workspace</button>
            <button type="button" onClick={() => onModeChange("signin")}>Open demo console</button>
          </div>
          <small className="landing-note">Demo tenant included · light UI · admin settings and integrations built in</small>
          <div className="landing-stats">
            {landingStats.map((stat) => (
              <div key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="landing-preview mission-control" aria-label="NexIQ desktop preview">
          <div className="preview-header">
            <span />
            <span />
            <span />
            <b>NexIQ Desktop Preview</b>
          </div>
          <div className="topology-card">
            <div className="topology-core">
              <span>NQ</span>
              <strong>NexIQ Workspace</strong>
            </div>
            <div className="topology-ring">
              {topologyNodes.map((node) => (
                <div key={node.label} className={`topology-node ${node.tone}`}>{node.label}</div>
              ))}
            </div>
          </div>
          <div className="ai-agent-card">
            <div className="agent-orb">AI</div>
            <div>
              <small>Root-cause answer with evidence</small>
              <strong>“Why is checkout-api pod crashing?”</strong>
              <span>Restarts, logs, heap pressure, and recommended action in one response.</span>
            </div>
          </div>
          <div className="preview-grid">
            <div><span>Clients</span><b>24</b></div>
            <div><span>Apps</span><b>186</b></div>
            <div><span>Signals</span><b>8.4M</b></div>
          </div>
          <div className="preview-transactions">
            {insightRows.map(([label, value, tone]) => (
              <div key={label}>
                <span>{label}</span>
                <b className={tone}>{value}</b>
              </div>
            ))}
          </div>
          <small>Prometheus · Loki · Elasticsearch · Kubernetes · Slack · PostgreSQL</small>
        </div>
      </section>

      <section className="landing-trust-strip">
        <span>Designed around the integrations operations teams already use</span>
        <div>
          {trustLogos.map((logo) => <strong key={logo}>{logo}</strong>)}
        </div>
      </section>

      <section className="landing-features">
        {authFeatures.map((feature) => (
          <article key={feature.label}>
            <strong>{feature.label}</strong>
            <span>{feature.detail}</span>
          </article>
        ))}
      </section>

      <section className="landing-proof">
        <div>
          <p>Why this feels better</p>
          <h2>Less visual noise. More operational context.</h2>
          <span>
            The landing now mirrors the actual product: light panels, clear hierarchy, client context,
            integration state, and AI answers with supporting evidence.
          </span>
        </div>
        <blockquote>
          “NexIQ puts the client, app, integration, and evidence in one workspace without making the UI feel heavy.”
          <cite>Platform Operations · NexIQ demo tenant</cite>
        </blockquote>
      </section>

      <section className="landing-final-cta">
        <div>
          <h2>Start from the workspace, not a marketing page.</h2>
          <span>Open the demo and review observability chat, product structure, settings, integrations, and client application data.</span>
        </div>
        <button type="button" onClick={() => onModeChange("signup")}>Enter workspace</button>
      </section>
    </main>
  );
}
