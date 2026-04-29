import { useMemo, useState } from "react";

import { probeIntegrationEndpoint } from "./integrationProbe.js";

const initialClients = [
  {
    id: "nexiq-prod",
    name: "NexIQ Production",
    plan: "Enterprise",
    region: "Mumbai DC",
    owner: "Ops Admin",
    status: "Healthy",
    apps: 14,
    integrations: 8,
    authProvider: "SAML 2.0 · Okta",
    directoryTenantId: "nexiq-prod-01",
    oauthAudience: "https://api.nexiq.ai",
    sessionPolicy: "SSO required · MFA enforced (Admin)",
    lastDirectorySync: "4 min ago",
  },
  {
    id: "alpha-capital",
    name: "Alpha Capital",
    plan: "Growth",
    region: "Bengaluru DC",
    owner: "NOC Lead",
    status: "Review",
    apps: 9,
    integrations: 6,
    authProvider: "OIDC · Azure AD",
    directoryTenantId: "alpha-capital.onmicrosoft.com",
    oauthAudience: "api://nexiq-alpha",
    sessionPolicy: "SSO required · MFA optional",
    lastDirectorySync: "18 min ago",
  },
  {
    id: "vertex-msp",
    name: "Vertex MSP",
    plan: "Starter",
    region: "Pune Edge",
    owner: "Tenant Admin",
    status: "Healthy",
    apps: 5,
    integrations: 4,
    authProvider: "SAML 2.0 · Google Workspace",
    directoryTenantId: "vertex-msp.com",
    oauthAudience: "https://gateway.vertex-msp.local",
    sessionPolicy: "SSO optional · IP allowlist",
    lastDirectorySync: "1 hr ago",
  },
];

const initialIntegrations = [
  { name: "Prometheus", type: "Metrics", endpoint: "https://metrics.nexiq.local", status: "Connected", sync: "22 sec ago", lastVerified: "—" },
  { name: "Loki", type: "Logs", endpoint: "https://logs.nexiq.local", status: "Connected", sync: "48 sec ago", lastVerified: "—" },
  { name: "Elasticsearch", type: "Search / app logs", endpoint: "https://es.nexiq.local", status: "Connected", sync: "1 min ago", lastVerified: "—" },
  { name: "Kubernetes", type: "Cluster API", endpoint: "nexiq-prod-le", status: "Connected", sync: "Live", lastVerified: "—" },
  { name: "SNMP Network", type: "Network Devices", endpoint: "10.10.0.0/16", status: "Pending", sync: "Needs approval", lastVerified: "—" },
  { name: "SSO / SAML", type: "Identity", endpoint: "sso.nexiq.local", status: "Connected", sync: "Policy active", lastVerified: "—" },
  { name: "Slack", type: "Notifications", endpoint: "#nexiq-alerts", status: "Connected", sync: "Live", lastVerified: "—" },
  { name: "PostgreSQL", type: "Application DB", endpoint: "postgresql://nexiq-db", status: "Connected", sync: "15 sec ago", lastVerified: "—" },
];

const connectorCatalog = [
  { name: "Google Drive", category: "Knowledge", detail: "Runbooks, PDFs, SOP documents", status: "Connected", icon: "GD" },
  { name: "Slack", category: "Messages", detail: "Incident channels and alert threads", status: "Connected", icon: "SL" },
  { name: "GitHub", category: "Code", detail: "Repos, releases, deployment notes", status: "Connected", icon: "GH" },
  { name: "Jira", category: "Tickets", detail: "Incidents, tasks, change records", status: "Pending", icon: "JI" },
  { name: "Confluence", category: "Docs", detail: "Architecture pages and policies", status: "Connected", icon: "CF" },
  { name: "ServiceNow", category: "ITSM", detail: "CMDB, incidents, approvals", status: "Review", icon: "SN" },
];

const historyEvents = [
  { time: "08:31", title: "Slack connector synced", detail: "Indexed 42 new alert messages from #nexiq-alerts.", actor: "System" },
  { time: "08:24", title: "Jira connector requested", detail: "Waiting for tenant admin approval for Alpha Capital.", actor: "Ops Admin" },
  { time: "08:12", title: "NexIQ Production policy updated", detail: "Data retention changed to 90 days for chat and connector events.", actor: "Admin" },
  { time: "07:58", title: "GitHub connector tested", detail: "Repository access verified for nexiq-ai and mcp-tooling.", actor: "System" },
  { time: "07:45", title: "Google Drive source added", detail: "Runbook folder connected to Runbook RAG application.", actor: "SRE Team" },
];

const initialAdminSettings = [
  { label: "Multi-client isolation", value: "Tenant scoped", detail: "Every query carries client_id, role, and data-source scope." },
  { label: "RBAC mode", value: "Admin / Operator / Viewer", detail: "Role policy controls settings, integrations, and chat access." },
  { label: "Audit logging", value: "Enabled", detail: "Admin changes and integration tests are written to audit events." },
  { label: "Data retention", value: "90 days", detail: "Logs, chat history, and integration events follow tenant policy." },
];

const initialApplications = [
  { app: "Observability Chat", client: "NexIQ Production", owner: "Platform Team", data: "Metrics, logs, events", health: "Healthy" },
  { app: "Workflow automation", client: "Alpha Capital", owner: "BizOps", data: "Tenant workflows, policy events", health: "Healthy" },
  { app: "Network Monitor", client: "Vertex MSP", owner: "NOC Team", data: "SNMP, device inventory", health: "Attention" },
  { app: "Runbook RAG", client: "NexIQ Production", owner: "SRE Team", data: "SOPs, incidents", health: "Healthy" },
];

function StatusPill({ status }) {
  const tone = status === "Connected" || status === "Healthy" ? "good" : "warn";
  return <span className={`settings-pill ${tone}`}>{status}</span>;
}

export default function SettingsIntegrations() {
  const [editMode, setEditMode] = useState(false);
  const [clients, setClients] = useState(() => initialClients.map((c) => ({ ...c })));
  const [integrations, setIntegrations] = useState(() => initialIntegrations.map((row) => ({ ...row })));
  const [adminSettings, setAdminSettings] = useState(() => initialAdminSettings.map((row) => ({ ...row })));
  const [applications, setApplications] = useState(() => initialApplications.map((row) => ({ ...row })));

  const [selectedClientId, setSelectedClientId] = useState(initialClients[0].id);
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0],
    [clients, selectedClientId],
  );

  const patchClient = (patch) => {
    setClients((prev) => prev.map((c) => (c.id === selectedClientId ? { ...c, ...patch } : c)));
  };

  const patchIntegration = (name, patch) => {
    setIntegrations((prev) =>
      prev.map((row) => {
        if (row.name !== name) return row;
        const merged = { ...row, ...patch };
        if ("endpoint" in patch && patch.endpoint !== row.endpoint) {
          merged.probeSummary = undefined;
          merged.probeTier = undefined;
        }
        return merged;
      }),
    );
  };

  const patchAdmin = (label, patch) => {
    setAdminSettings((prev) => prev.map((row) => (row.label === label ? { ...row, ...patch } : row)));
  };

  const patchApplication = (index, patch) => {
    setApplications((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  };

  const [verifyingIntegrations, setVerifyingIntegrations] = useState(false);
  const [probeMeta, setProbeMeta] = useState(null);

  const verifyAllIntegrations = async () => {
    setVerifyingIntegrations(true);
    const stamp = new Date().toLocaleString(undefined, { dateStyle: "short", timeStyle: "short" });
    try {
      const results = await Promise.all(
        integrations.map(async (row) => {
          const pr = await probeIntegrationEndpoint(row.endpoint);
          const tier = pr.skipped ? "skip" : pr.ok ? "ok" : "fail";
          return {
            name: row.name,
            patch: {
              lastVerified: stamp,
              probeSummary: pr.summary,
              probeTier: tier,
            },
            skipped: pr.skipped,
            ok: pr.ok && !pr.skipped,
          };
        }),
      );

      setIntegrations((prev) =>
        prev.map((row) => {
          const hit = results.find((r) => r.name === row.name);
          return hit ? { ...row, ...hit.patch } : row;
        }),
      );

      const ok = results.filter((r) => r.ok).length;
      const skipped = results.filter((r) => r.skipped).length;
      const failed = results.length - ok - skipped;
      setProbeMeta({ stamp, ok, skipped, failed });
    } finally {
      setVerifyingIntegrations(false);
    }
  };

  const integrationConnectedCount = integrations.filter((i) => i.status === "Connected").length;

  const probeBannerSecondary =
    probeMeta != null
      ? `${probeMeta.ok} HTTP OK · ${probeMeta.failed} failed · ${probeMeta.skipped} skipped · Full check ${probeMeta.stamp}`
      : "Dev server runs probes via Node (no CORS). Static/nginx-only builds fall back to browser fetch.";

  return (
    <div className="settings-page">
      <section className="settings-hero">
        <div>
          <p>Admin Settings</p>
          <h3>Multi-client integrations and application data</h3>
          <span>
            Manage tenant details, connector status, permissions, and application inventory from one NexIQ control plane.
          </span>
        </div>
        <div className="settings-summary-card settings-summary-actions">
          <strong>{selectedClient.name}</strong>
          <span>{selectedClient.plan} plan</span>
          <StatusPill status={selectedClient.status} />
          <button
            type="button"
            className={`settings-edit-toggle ${editMode ? "active" : ""}`}
            onClick={() => setEditMode((v) => !v)}
          >
            {editMode ? "Done" : "Edit workspace"}
          </button>
        </div>
      </section>

      <section className="settings-grid">
        <aside className="settings-card client-list">
          <div className="settings-card-header">
            <p>Clients</p>
            <strong>Multi-client workspace</strong>
          </div>
          {clients.map((client) => (
            <button
              key={client.id}
              className={client.id === selectedClientId ? "client-row active" : "client-row"}
              type="button"
              onClick={() => setSelectedClientId(client.id)}
            >
              <span>{client.name}</span>
              <small>
                {client.region} · {client.owner}
              </small>
            </button>
          ))}
        </aside>

        <section className="settings-card client-detail">
          <div className="settings-card-header">
            <p>Client Details</p>
            <strong>{selectedClient.name}</strong>
          </div>
          <div className="detail-metrics">
            <div>
              <span>Applications</span>
              {editMode ? (
                <input
                  className="settings-field"
                  type="number"
                  min={0}
                  value={selectedClient.apps}
                  onChange={(e) => patchClient({ apps: Number(e.target.value) || 0 })}
                />
              ) : (
                <strong>{selectedClient.apps}</strong>
              )}
            </div>
            <div>
              <span>Integrations</span>
              {editMode ? (
                <input
                  className="settings-field"
                  type="number"
                  min={0}
                  value={selectedClient.integrations}
                  onChange={(e) => patchClient({ integrations: Number(e.target.value) || 0 })}
                />
              ) : (
                <strong>{selectedClient.integrations}</strong>
              )}
            </div>
            <div>
              <span>Region</span>
              {editMode ? (
                <input
                  className="settings-field"
                  value={selectedClient.region}
                  onChange={(e) => patchClient({ region: e.target.value })}
                />
              ) : (
                <strong>{selectedClient.region}</strong>
              )}
            </div>
            <div>
              <span>Owner</span>
              {editMode ? (
                <input
                  className="settings-field"
                  value={selectedClient.owner}
                  onChange={(e) => patchClient({ owner: e.target.value })}
                />
              ) : (
                <strong>{selectedClient.owner}</strong>
              )}
            </div>
          </div>
          {editMode && (
            <div className="settings-edit-row">
              <label>
                Display name
                <input
                  className="settings-field"
                  value={selectedClient.name}
                  onChange={(e) => patchClient({ name: e.target.value })}
                />
              </label>
              <label>
                Plan
                <input
                  className="settings-field"
                  value={selectedClient.plan}
                  onChange={(e) => patchClient({ plan: e.target.value })}
                />
              </label>
              <label>
                Status
                <select
                  className="settings-field"
                  value={selectedClient.status}
                  onChange={(e) => patchClient({ status: e.target.value })}
                >
                  <option value="Healthy">Healthy</option>
                  <option value="Review">Review</option>
                  <option value="Attention">Attention</option>
                </select>
              </label>
            </div>
          )}
          <div className="settings-auth-panel">
            <div className="settings-auth-heading">
              <p>Authentication</p>
              <strong>Directory & API identity for this client</strong>
              <span>
                SSO tenant, OAuth audience, and policy shown to NexIQ gateways for this workspace.
              </span>
            </div>
            <div className="settings-auth-grid">
              <div>
                <span className="settings-auth-label">Identity provider</span>
                {editMode ? (
                  <input
                    className="settings-field"
                    value={selectedClient.authProvider}
                    onChange={(e) => patchClient({ authProvider: e.target.value })}
                  />
                ) : (
                  <strong>{selectedClient.authProvider}</strong>
                )}
              </div>
              <div>
                <span className="settings-auth-label">Directory / tenant ID</span>
                {editMode ? (
                  <input
                    className="settings-field"
                    value={selectedClient.directoryTenantId}
                    onChange={(e) => patchClient({ directoryTenantId: e.target.value })}
                  />
                ) : (
                  <strong>{selectedClient.directoryTenantId}</strong>
                )}
              </div>
              <div>
                <span className="settings-auth-label">OAuth / API audience</span>
                {editMode ? (
                  <input
                    className="settings-field"
                    value={selectedClient.oauthAudience}
                    onChange={(e) => patchClient({ oauthAudience: e.target.value })}
                  />
                ) : (
                  <strong>{selectedClient.oauthAudience}</strong>
                )}
              </div>
              <div>
                <span className="settings-auth-label">Session policy</span>
                {editMode ? (
                  <input
                    className="settings-field"
                    value={selectedClient.sessionPolicy}
                    onChange={(e) => patchClient({ sessionPolicy: e.target.value })}
                  />
                ) : (
                  <strong>{selectedClient.sessionPolicy}</strong>
                )}
              </div>
              <div>
                <span className="settings-auth-label">Last directory sync</span>
                {editMode ? (
                  <input
                    className="settings-field"
                    value={selectedClient.lastDirectorySync}
                    onChange={(e) => patchClient({ lastDirectorySync: e.target.value })}
                  />
                ) : (
                  <strong>{selectedClient.lastDirectorySync}</strong>
                )}
              </div>
            </div>
          </div>
        </section>
      </section>

      <section className="settings-card">
        <div className="integration-verify-bar">
          <div>
            <strong>
              {integrationConnectedCount}/{integrations.length} marked Connected
            </strong>
            <span>{probeBannerSecondary}</span>
          </div>
          <button
            type="button"
            className="settings-action"
            disabled={verifyingIntegrations}
            onClick={() => void verifyAllIntegrations()}
          >
            {verifyingIntegrations ? "Verifying…" : "Verify all integrations"}
          </button>
        </div>
        <div className="settings-card-header horizontal">
          <div>
            <p>Integration Options</p>
            <strong>All connectors</strong>
          </div>
          <button className="settings-action" type="button" disabled={!editMode}>
            Add integration
          </button>
        </div>
        <div className="integration-grid">
          {integrations.map((integration) => (
            <article key={integration.name} className="integration-card">
              <div>
                <strong>{integration.name}</strong>
                <span>{integration.type}</span>
              </div>
              {editMode ? (
                <input
                  className="settings-field settings-field-inline"
                  value={integration.status}
                  onChange={(e) => patchIntegration(integration.name, { status: e.target.value })}
                />
              ) : (
                <StatusPill status={integration.status} />
              )}
              {editMode ? (
                <input
                  className="settings-field"
                  value={integration.endpoint}
                  onChange={(e) => patchIntegration(integration.name, { endpoint: e.target.value })}
                />
              ) : (
                <small>{integration.endpoint}</small>
              )}
              {editMode ? (
                <input
                  className="settings-field settings-field-em"
                  value={integration.sync}
                  onChange={(e) => patchIntegration(integration.name, { sync: e.target.value })}
                />
              ) : (
                <em>{integration.sync}</em>
              )}
              <div className="integration-probe-footer">
                <small className="integration-last-verified">Last verified: {integration.lastVerified}</small>
                {integration.probeSummary != null && integration.probeTier != null && (
                  <small className={`integration-probe-detail integration-probe-detail--${integration.probeTier}`}>
                    {integration.probeSummary}
                  </small>
                )}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="settings-grid connectors-history">
        <section className="settings-card">
          <div className="settings-card-header horizontal">
            <div>
              <p>Connectors</p>
              <strong>External knowledge sources</strong>
            </div>
            <button className="settings-action" type="button" disabled={!editMode}>
              Browse catalog
            </button>
          </div>
          <div className="connector-catalog">
            {connectorCatalog.map((connector) => (
              <article key={connector.name} className="connector-card">
                <div className="connector-icon">{connector.icon}</div>
                <div>
                  <strong>{connector.name}</strong>
                  <span>{connector.category}</span>
                  <small>{connector.detail}</small>
                </div>
                <StatusPill status={connector.status} />
              </article>
            ))}
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <p>History</p>
            <strong>Connector and admin activity</strong>
          </div>
          <div className="history-list">
            {historyEvents.map((event) => (
              <article key={`${event.time}-${event.title}`} className="history-row">
                <time>{event.time}</time>
                <div>
                  <strong>{event.title}</strong>
                  <span>{event.detail}</span>
                </div>
                <small>{event.actor}</small>
              </article>
            ))}
          </div>
        </section>
      </section>

      <section className="settings-grid bottom">
        <section className="settings-card">
          <div className="settings-card-header">
            <p>Admin Settings</p>
            <strong>Security and data policy</strong>
          </div>
          <div className="settings-list">
            {adminSettings.map((setting) => (
              <div key={setting.label} className="settings-list-row">
                <div>
                  <strong>{setting.label}</strong>
                  <span>{setting.detail}</span>
                </div>
                {editMode ? (
                  <input
                    className="settings-field settings-field-value"
                    value={setting.value}
                    onChange={(e) => patchAdmin(setting.label, { value: e.target.value })}
                  />
                ) : (
                  <small>{setting.value}</small>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="settings-card">
          <div className="settings-card-header">
            <p>Application Details</p>
            <strong>Client application data</strong>
          </div>
          <div className="application-table">
            {applications.map((application, index) => (
              <div key={`${application.client}-${application.app}-${index}`} className="application-row">
                <div>
                  {editMode ? (
                    <>
                      <input
                        className="settings-field"
                        value={application.app}
                        onChange={(e) => patchApplication(index, { app: e.target.value })}
                      />
                      <input
                        className="settings-field settings-field-sub"
                        value={application.client}
                        onChange={(e) => patchApplication(index, { client: e.target.value })}
                      />
                    </>
                  ) : (
                    <>
                      <strong>{application.app}</strong>
                      <span>{application.client}</span>
                    </>
                  )}
                </div>
                {editMode ? (
                  <input
                    className="settings-field"
                    value={application.data}
                    onChange={(e) => patchApplication(index, { data: e.target.value })}
                  />
                ) : (
                  <span>{application.data}</span>
                )}
                {editMode ? (
                  <select
                    className="settings-field settings-field-compact"
                    value={application.health}
                    onChange={(e) => patchApplication(index, { health: e.target.value })}
                  >
                    <option value="Healthy">Healthy</option>
                    <option value="Attention">Attention</option>
                  </select>
                ) : (
                  <StatusPill status={application.health} />
                )}
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
