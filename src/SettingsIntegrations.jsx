import { useMemo, useState } from "react";

const clients = [
  {
    id: "nexiq-prod",
    name: "NexIQ Production",
    plan: "Enterprise",
    region: "Mumbai DC",
    owner: "Ops Admin",
    status: "Healthy",
    apps: 14,
    integrations: 8,
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
  },
];

const integrations = [
  { name: "Prometheus", type: "Metrics", endpoint: "https://metrics.nexiq.local", status: "Connected", sync: "22 sec ago" },
  { name: "Loki", type: "Logs", endpoint: "https://logs.nexiq.local", status: "Connected", sync: "48 sec ago" },
  { name: "Elasticsearch", type: "Search / app logs", endpoint: "https://es.nexiq.local", status: "Connected", sync: "1 min ago" },
  { name: "Kubernetes", type: "Cluster API", endpoint: "nexiq-prod-le", status: "Connected", sync: "Live" },
  { name: "SNMP Network", type: "Network Devices", endpoint: "10.10.0.0/16", status: "Pending", sync: "Needs approval" },
  { name: "SSO / SAML", type: "Identity", endpoint: "sso.nexiq.local", status: "Connected", sync: "Policy active" },
  { name: "Slack", type: "Notifications", endpoint: "#nexiq-alerts", status: "Connected", sync: "Live" },
  { name: "PostgreSQL", type: "Application DB", endpoint: "postgresql://nexiq-db", status: "Connected", sync: "15 sec ago" },
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

const adminSettings = [
  { label: "Multi-client isolation", value: "Tenant scoped", detail: "Every query carries client_id, role, and data-source scope." },
  { label: "RBAC mode", value: "Admin / Operator / Viewer", detail: "Role policy controls settings, integrations, and chat access." },
  { label: "Audit logging", value: "Enabled", detail: "Admin changes and integration tests are written to audit events." },
  { label: "Data retention", value: "90 days", detail: "Logs, chat history, and integration events follow tenant policy." },
];

const applications = [
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
  const [selectedClientId, setSelectedClientId] = useState(clients[0].id);
  const selectedClient = useMemo(
    () => clients.find((client) => client.id === selectedClientId) ?? clients[0],
    [selectedClientId],
  );

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
        <div className="settings-summary-card">
          <strong>{selectedClient.name}</strong>
          <span>{selectedClient.plan} plan</span>
          <StatusPill status={selectedClient.status} />
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
              <small>{client.region} · {client.owner}</small>
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
              <strong>{selectedClient.apps}</strong>
            </div>
            <div>
              <span>Integrations</span>
              <strong>{selectedClient.integrations}</strong>
            </div>
            <div>
              <span>Region</span>
              <strong>{selectedClient.region}</strong>
            </div>
            <div>
              <span>Owner</span>
              <strong>{selectedClient.owner}</strong>
            </div>
          </div>
        </section>
      </section>

      <section className="settings-card">
        <div className="settings-card-header horizontal">
          <div>
            <p>Integration Options</p>
            <strong>All connectors</strong>
          </div>
          <button className="settings-action" type="button">Add integration</button>
        </div>
        <div className="integration-grid">
          {integrations.map((integration) => (
            <article key={integration.name} className="integration-card">
              <div>
                <strong>{integration.name}</strong>
                <span>{integration.type}</span>
              </div>
              <StatusPill status={integration.status} />
              <small>{integration.endpoint}</small>
              <em>{integration.sync}</em>
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
            <button className="settings-action" type="button">Browse catalog</button>
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
                <small>{setting.value}</small>
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
            {applications.map((application) => (
              <div key={`${application.client}-${application.app}`} className="application-row">
                <div>
                  <strong>{application.app}</strong>
                  <span>{application.client}</span>
                </div>
                <span>{application.data}</span>
                <StatusPill status={application.health} />
              </div>
            ))}
          </div>
        </section>
      </section>
    </div>
  );
}
