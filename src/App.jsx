import { lazy, Suspense, useMemo, useState } from "react";
import AuthLanding from "./AuthLanding.jsx";

const ObservabilityChat = lazy(() => import("../observability-chat.jsx"));
const ArchDiagram = lazy(() => import("../arch-diagram.jsx"));
const LinkedEyeArchitecture = lazy(() => import("../linkedeye-architecture.jsx"));
const SettingsIntegrations = lazy(() => import("./SettingsIntegrations.jsx"));

const views = [
  {
    id: "observability",
    eyebrow: "Live Workspace",
    title: "Observability Chat",
    icon: "AI",
    navLabel: "Observe",
    navStatus: "Live",
    description: "Ask natural-language questions across metrics, logs, pods, and tenant-scoped application data.",
    component: ObservabilityChat,
  },
  {
    id: "platform",
    eyebrow: "Architecture Map",
    title: "NexIQ Platform",
    icon: "AR",
    navLabel: "Architecture",
    navStatus: "Map",
    description: "Explore product layers, MCP connectivity, query flow, and data flow.",
    component: ArchDiagram,
  },
  {
    id: "product",
    eyebrow: "Product Studio",
    title: "Product Structure",
    icon: "PR",
    navLabel: "Product",
    navStatus: "Studio",
    description: "Review the product family, open-source MCP servers, and deployment structure.",
    component: LinkedEyeArchitecture,
  },
  {
    id: "settings",
    eyebrow: "Admin Console",
    title: "Settings & Integrations",
    icon: "SE",
    navLabel: "Settings",
    navStatus: "Admin",
    description: "Manage multi-client details, integration options, admin settings, and application data.",
    component: SettingsIntegrations,
  },
];

function isValidUser(value) {
  return Boolean(
    value
      && typeof value === "object"
      && typeof value.name === "string"
      && value.name.trim().length > 0
      && typeof value.email === "string"
      && value.email.trim().length > 0
      && typeof value.role === "string"
      && value.role.trim().length > 0,
  );
}

function getStoredUser() {
  try {
    const stored = window.localStorage.getItem("nexiq-user");
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return isValidUser(parsed) ? parsed : null;
  } catch {
    window.localStorage.removeItem("nexiq-user");
    return null;
  }
}

function WorkspaceLoading() {
  return (
    <div className="workspace-loading" role="status" aria-live="polite">
      <div className="loading-orb">NQ</div>
      <strong>Loading NexIQ workspace</strong>
      <span>Preparing dashboards, connectors, and AI context...</span>
    </div>
  );
}

export default function App() {
  const [activeViewId, setActiveViewId] = useState(views[0].id);
  const [authMode, setAuthMode] = useState("landing");
  const [authError, setAuthError] = useState(null);
  const [user, setUser] = useState(getStoredUser);
  const activeView = useMemo(
    () => views.find((view) => view.id === activeViewId) ?? views[0],
    [activeViewId],
  );
  const ActiveComponent = activeView.component;

  const handleAuthenticate = (nextUser) => {
    const name = String(nextUser?.name ?? "NexIQ Admin").trim() || "NexIQ Admin";
    const email = String(nextUser?.email ?? "").trim();
    const role = String(nextUser?.role ?? "Admin").trim() || "Admin";
    if (!email) {
      setAuthError("Enter a work email to continue.");
      return;
    }
    const sessionUser = {
      name,
      email,
      role,
      company: nextUser?.company,
      signedInAt: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem("nexiq-user", JSON.stringify(sessionUser));
      setAuthError(null);
      setUser(sessionUser);
    } catch {
      setAuthError("Could not save your session. Turn off private browsing, allow site data, or free disk space, then try again.");
    }
  };

  const handleSignOut = () => {
    window.localStorage.removeItem("nexiq-user");
    setUser(null);
    setAuthMode("landing");
  };

  if (!user) {
    return (
      <AuthLanding
        mode={authMode}
        onModeChange={(next) => {
          setAuthError(null);
          setAuthMode(next);
        }}
        onAuthenticate={handleAuthenticate}
        authError={authError}
      />
    );
  }

  return (
    <main className="app-shell">
      <aside className="app-sidebar">
        <div className="sidebar-topbar">
          <div className="brand-lockup">
            <div className="brand-mark">NQ</div>
            <div>
              <p className="eyebrow">NexIQ</p>
              <h1>Command center</h1>
            </div>
          </div>
          <button className="sidebar-command" type="button" aria-label="Open command menu">
            ⌘K
          </button>
        </div>

        <div className="sidebar-section-label">Workspace</div>
        <nav className="view-tabs" aria-label="Application views">
          {views.map((view) => (
            <button
              key={view.id}
              className={view.id === activeViewId ? "view-tab active" : "view-tab"}
              type="button"
              onClick={() => setActiveViewId(view.id)}
            >
              <span className="view-tab-icon" aria-hidden="true">{view.icon}</span>
              <span className="view-tab-copy">
                <strong>{view.navLabel}</strong>
              </span>
              <span className="view-tab-status" aria-hidden="true">{view.navStatus}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-note">
          <div className="sidebar-note-head">
            <span className="status-light" />
            <span>{user.role}</span>
          </div>
          <strong>{user.name}</strong>
          <small>{user.email}</small>
          <button className="signout-button" type="button" onClick={handleSignOut}>
            Sign out
          </button>
        </div>
      </aside>

      <section className="workspace">
        <header className="workspace-header" aria-live="polite">
          <div>
            <p>{activeView.eyebrow}</p>
            <h2>{activeView.title}</h2>
            <span>{activeView.description}</span>
          </div>
        </header>

        <section
          className={
            activeView.id === "settings" ? "view-stage light-legacy-surface" : "view-stage view-stage--dark"
          }
        >
          <Suspense fallback={<WorkspaceLoading />}>
            <ActiveComponent />
          </Suspense>
        </section>
      </section>
    </main>
  );
}
