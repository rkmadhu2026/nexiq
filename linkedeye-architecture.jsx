import { useState } from "react";

const COLORS = {
  cyan: "#b89562", blue: "#7a8494", green: "#22c55e",
  orange: "#f59e0b", red: "#ef4444",
  /** AI / orchestration layer — warm bronze-slate (matches app tokens, not Tailwind purple) */
  purple: "#8b7355",
  slate: "#64748b", teal: "#14b8a6"
};

// ── Shared primitives ─────────────────────────────────────────
const Box = ({ color = "#b89562", title, subtitle, icon, width = 140, onClick, active }) => (
  <div onClick={onClick} style={{
    width, border: `1px solid ${active ? color : color + "55"}`,
    borderRadius: 8, padding: "10px 12px", cursor: onClick ? "pointer" : "default",
    background: active ? color + "22" : color + "0a",
    transition: "all 0.2s", boxShadow: active ? `0 0 16px ${color}44` : "none",
    minWidth: width
  }}>
    <div style={{ fontSize: 18, marginBottom: 4 }}>{icon}</div>
    <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "monospace", letterSpacing: 0.5 }}>{title}</div>
    {subtitle && <div style={{ fontSize: 9, color: "#64748b", marginTop: 2, fontFamily: "monospace" }}>{subtitle}</div>}
  </div>
);

const Arrow = ({ dir = "right", color = "#334155", label }) => {
  const styles = {
    right: { display: "flex", alignItems: "center", gap: 4 },
    down: { display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }
  };
  return (
    <div style={styles[dir]}>
      {label && <span style={{ fontSize: 9, color: "#475569", fontFamily: "monospace" }}>{label}</span>}
      {dir === "right" && <div style={{ width: 40, height: 1, background: color, position: "relative" }}>
        <div style={{ position: "absolute", right: -1, top: -3, width: 0, height: 0,
          borderLeft: `6px solid ${color}`, borderTop: "4px solid transparent", borderBottom: "4px solid transparent" }} />
      </div>}
      {dir === "down" && <div style={{ width: 1, height: 32, background: color, position: "relative" }}>
        <div style={{ position: "absolute", bottom: -1, left: -3, width: 0, height: 0,
          borderTop: `6px solid ${color}`, borderLeft: "4px solid transparent", borderRight: "4px solid transparent" }} />
      </div>}
    </div>
  );
};

const SectionTitle = ({ children, color = "#b89562" }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
    <div style={{ width: 3, height: 16, background: color, borderRadius: 2 }} />
    <span style={{ fontSize: 11, fontWeight: 700, color, fontFamily: "monospace", letterSpacing: 1, textTransform: "uppercase" }}>{children}</span>
  </div>
);

const Badge = ({ children, color }) => (
  <span style={{ fontSize: 9, padding: "2px 6px", borderRadius: 3, border: `1px solid ${color}44`,
    color, background: color + "15", fontFamily: "monospace", fontWeight: 600 }}>{children}</span>
);

// ── TAB 1: Product Overview ───────────────────────────────────
function ProductOverview() {
  const products = [
    { name: "TenantOps Chat", sub: "Multi-tenant observability", color: COLORS.cyan, icon: "📊",
      desc: "Natural language across metrics, logs, and tenant-scoped app data. Charts and log viewers inline — one workspace per client or region.",
      targets: ["SaaS", "Platform teams"], stack: ["Elasticsearch", "Prometheus", "Loki"] },
    { name: "NexusIQ", sub: "On-Prem MSP Platform", color: COLORS.blue, icon: "🖥",
      desc: "Multi-tenant AI observability for MSPs. Monitors servers, K8s, network devices, storage across all client environments.",
      targets: ["MSPs", "NOC Teams"], stack: ["SNMP", "K8s API", "Node Exporter"] },
    { name: "NexIQ AI", sub: "Enterprise ITSM + AI", color: COLORS.purple, icon: "👁",
      desc: "ITSM with an AI layer: incidents, CMDB, and operational data unified. Geographic drill-down, hardware health, and audit-ready history.",
      targets: ["Enterprises", "GCCs"], stack: ["NexIQ DB", "All Sources"] },
  ];

  const mcpServers = [
    { name: "prometheus-mcp", color: COLORS.orange, icon: "🔥" },
    { name: "elasticsearch-mcp", color: COLORS.orange, icon: "🔍" },
    { name: "loki-mcp", color: COLORS.teal, icon: "📋" },
    { name: "kubernetes-mcp", color: COLORS.blue, icon: "⚙️" },
    { name: "snmp-network-mcp", color: COLORS.green, icon: "🌐" },
    { name: "tenant-data-mcp", color: COLORS.red, icon: "📈" },
    { name: "nexiq-db-mcp", color: COLORS.purple, icon: "🗄️" },
    { name: "runbook-mcp", color: COLORS.cyan, icon: "📖" },
  ];

  return (
    <div style={{ padding: 32 }}>
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: "#f1f5f9", fontFamily: "monospace", marginBottom: 4 }}>
          Santhira Technologies
        </div>
        <div style={{ fontSize: 13, color: "#64748b", fontFamily: "monospace" }}>
          AI-Native Infrastructure Intelligence Platform — Product Family
        </div>
      </div>

      {/* Product cards */}
      <SectionTitle color={COLORS.cyan}>Product Family</SectionTitle>
      <div style={{ display: "flex", gap: 16, marginBottom: 32, flexWrap: "wrap" }}>
        {products.map((p, i) => (
          <div key={i} style={{ flex: 1, minWidth: 220, border: `1px solid ${p.color}44`,
            borderRadius: 12, padding: 20, background: p.color + "08" }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{p.icon}</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: p.color, fontFamily: "monospace", marginBottom: 2 }}>{p.name}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", fontFamily: "monospace", marginBottom: 10 }}>{p.sub}</div>
            <div style={{ fontSize: 11, color: "#cbd5e1", lineHeight: 1.6, marginBottom: 12 }}>{p.desc}</div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 8 }}>
              {p.targets.map(t => <Badge key={t} color={p.color}>{t}</Badge>)}
            </div>
            <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
              {p.stack.map(s => <Badge key={s} color={COLORS.slate}>{s}</Badge>)}
            </div>
          </div>
        ))}
      </div>

      {/* Open Source MCP */}
      <SectionTitle color={COLORS.green}>Open Source MCP Servers — github.com/santhira-technologies</SectionTitle>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 32 }}>
        {mcpServers.map((m, i) => (
          <div key={i} style={{ border: `1px solid ${m.color}44`, borderRadius: 8, padding: "10px 14px",
            background: m.color + "0a", display: "flex", alignItems: "center", gap: 8 }}>
            <span>{m.icon}</span>
            <span style={{ fontSize: 10, fontWeight: 600, color: m.color, fontFamily: "monospace" }}>{m.name}</span>
            <Badge color={COLORS.green}>MIT</Badge>
          </div>
        ))}
      </div>

      {/* Revenue model */}
      <SectionTitle color={COLORS.orange}>Revenue Model</SectionTitle>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 12 }}>
        {[
          { tier: "Starter", price: "₹15,000/mo", clients: "5 environments", color: COLORS.teal },
          { tier: "Growth", price: "₹35,000/mo", clients: "20 environments", color: COLORS.blue },
          { tier: "Enterprise", price: "₹80,000/mo", clients: "Unlimited + white-label", color: COLORS.purple },
        ].map((t, i) => (
          <div key={i} style={{ border: `1px solid ${t.color}44`, borderRadius: 8, padding: 16, background: t.color + "0a" }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: t.color, fontFamily: "monospace" }}>{t.tier}</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#f1f5f9", marginTop: 4 }}>{t.price}</div>
            <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4, fontFamily: "monospace" }}>{t.clients}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB 2: Full Architecture ──────────────────────────────────
function ArchitectureDiagram() {
  const layers = [
    {
      label: "INTERFACE LAYER", color: COLORS.cyan,
      items: [
        { icon: "🌐", name: "Web Chat", sub: "Next.js 15", color: COLORS.cyan },
        { icon: "💬", name: "Slack Bot", sub: "Slack Bolt", color: COLORS.cyan },
        { icon: "📱", name: "Mobile", sub: "Kural App", color: COLORS.cyan },
      ]
    },
    {
      label: "API GATEWAY", color: COLORS.blue,
      items: [
        { icon: "⚡", name: "FastAPI", sub: "WebSocket + REST", color: COLORS.blue },
        { icon: "🔐", name: "Auth", sub: "Keycloak / JWT", color: COLORS.blue },
        { icon: "🏢", name: "Multi-Tenant", sub: "RBAC Router", color: COLORS.blue },
      ]
    },
    {
      label: "AI ORCHESTRATION", color: COLORS.purple,
      items: [
        { icon: "🧠", name: "LangGraph", sub: "Agent Graph", color: COLORS.purple },
        { icon: "🔀", name: "Intent Classifier", sub: "LLM Router", color: COLORS.purple },
        { icon: "📝", name: "Synthesizer", sub: "DeepSeek / GPT-4o", color: COLORS.purple },
      ]
    },
    {
      label: "MCP TOOL LAYER (Open Source)", color: COLORS.green,
      items: [
        { icon: "🔥", name: "prometheus-mcp", sub: ":8001", color: COLORS.orange },
        { icon: "🔍", name: "elasticsearch-mcp", sub: ":8002", color: COLORS.orange },
        { icon: "📋", name: "loki-mcp", sub: ":8003", color: COLORS.teal },
        { icon: "⚙️", name: "kubernetes-mcp", sub: ":8004", color: COLORS.blue },
        { icon: "🌐", name: "snmp-network-mcp", sub: ":8005", color: COLORS.green },
        { icon: "📈", name: "tenant-data-mcp", sub: ":8006", color: COLORS.red },
        { icon: "🗄️", name: "nexiq-db-mcp", sub: ":8007", color: COLORS.purple },
        { icon: "📖", name: "runbook-mcp", sub: ":8008", color: COLORS.cyan },
      ]
    },
    {
      label: "DATA SOURCES (On-Premise)", color: COLORS.orange,
      items: [
        { icon: "📊", name: "Prometheus", sub: "Metrics TSDB", color: COLORS.orange },
        { icon: "🔎", name: "Elasticsearch", sub: "App & audit logs", color: COLORS.orange },
        { icon: "📜", name: "Loki", sub: "App Logs", color: COLORS.teal },
        { icon: "☸️", name: "Kubernetes", sub: "K8s API", color: COLORS.blue },
        { icon: "🌐", name: "SNMP Devices", sub: "Cisco/Aruba/Huawei", color: COLORS.green },
        { icon: "🗃️", name: "PostgreSQL", sub: "NexIQ DB", color: COLORS.purple },
        { icon: "📚", name: "pgVector", sub: "RAG Embeddings", color: COLORS.cyan },
      ]
    },
  ];

  return (
    <div style={{ padding: 32 }}>
      <SectionTitle color={COLORS.cyan}>Full Stack Architecture — NexIQ AI (On-Premise)</SectionTitle>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {layers.map((layer, li) => (
          <div key={li}>
            <div style={{ border: `1px solid ${layer.color}33`, borderRadius: 10, padding: "16px 20px",
              background: layer.color + "06", marginBottom: 0 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: layer.color, fontFamily: "monospace",
                letterSpacing: 2, marginBottom: 12 }}>{layer.label}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {layer.items.map((item, ii) => (
                  <div key={ii} style={{ border: `1px solid ${item.color}44`, borderRadius: 7,
                    padding: "8px 12px", background: item.color + "10", minWidth: 100 }}>
                    <div style={{ fontSize: 16, marginBottom: 3 }}>{item.icon}</div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: item.color, fontFamily: "monospace" }}>{item.name}</div>
                    <div style={{ fontSize: 9, color: "#475569", fontFamily: "monospace" }}>{item.sub}</div>
                  </div>
                ))}
              </div>
            </div>
            {li < layers.length - 1 && (
              <div style={{ display: "flex", justifyContent: "center", padding: "6px 0" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                  <div style={{ width: 1, height: 16, background: "#334155" }} />
                  <div style={{ width: 0, height: 0, borderTop: "5px solid #334155",
                    borderLeft: "4px solid transparent", borderRight: "4px solid transparent" }} />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── TAB 3: MCP Connectivity ───────────────────────────────────
function MCPConnectivity() {
  const [selected, setSelected] = useState(null);

  const mcpServers = [
    { id: "prometheus", name: "prometheus-mcp", port: 8001, color: COLORS.orange, icon: "🔥",
      tools: ["get_cpu_usage(server, duration)", "get_memory_usage(server)", "get_pod_restarts(ns)", "get_queue_metrics(queue)", "get_api_latency(tenant)"],
      connects: "Prometheus HTTP API :9090", license: "MIT", npm: "@santhira/prometheus-mcp" },
    { id: "elasticsearch", name: "elasticsearch-mcp", port: 8002, color: "#f59e0b", icon: "🔍",
      tools: ["get_workflow_by_id(id)", "get_workflow_failures(duration, tenant)", "get_tenant_usage(date)", "get_failure_patterns(window)"],
      connects: "Elasticsearch REST :9200", license: "MIT", npm: "@santhira/elasticsearch-mcp" },
    { id: "loki", name: "loki-mcp", port: 8003, color: COLORS.teal, icon: "📋",
      tools: ["get_pod_logs(pod, level)", "get_app_errors(service)", "get_nginx_logs(status)", "get_crash_logs(pod)"],
      connects: "Loki HTTP API :3100", license: "MIT", npm: "@santhira/loki-mcp" },
    { id: "kubernetes", name: "kubernetes-mcp", port: 8004, color: COLORS.blue, icon: "☸️",
      tools: ["get_pod_status(ns)", "get_k8s_events(pod)", "get_node_health()", "get_deployment(name)"],
      connects: "K8s API Server :6443", license: "MIT", npm: "@santhira/kubernetes-mcp" },
    { id: "snmp", name: "snmp-network-mcp", port: 8005, color: COLORS.green, icon: "🌐",
      tools: ["get_switch_ports(ip)", "get_device_cpu(ip)", "get_interface_traffic(ip,port)", "get_arp_table(ip)"],
      connects: "SNMP v2/v3 UDP :161", license: "MIT", npm: "@santhira/snmp-network-mcp" },
    { id: "tenantdata", name: "tenant-data-mcp", port: 8006, color: COLORS.red, icon: "📈",
      tools: ["get_workflow_rejection_reason(id)", "get_tenant_quota_usage(tenant)", "get_background_job_stats()", "get_tenant_health(tenant)"],
      connects: "Elasticsearch app indices (tenant-scoped)", license: "MIT", npm: "@santhira/tenant-data-mcp" },
    { id: "nexiq", name: "nexiq-db-mcp", port: 8007, color: COLORS.purple, icon: "👁",
      tools: ["get_device_health(site)", "get_url_ssl(url)", "get_open_tickets()", "get_site_summary(site)"],
      connects: "PostgreSQL :5432", license: "Proprietary", npm: "Internal" },
    { id: "runbook", name: "runbook-mcp", port: 8008, color: COLORS.cyan, icon: "📖",
      tools: ["search_runbook_rag(query)", "get_sop_by_issue(type)", "ingest_runbook(doc)", "list_runbooks()"],
      connects: "pgVector / Qdrant", license: "MIT", npm: "@santhira/runbook-mcp" },
  ];

  const sel = selected ? mcpServers.find(m => m.id === selected) : null;

  return (
    <div style={{ padding: 32 }}>
      <SectionTitle color={COLORS.green}>MCP Server Connectivity Map — Click any server to inspect</SectionTitle>

      <div style={{ display: "flex", gap: 20 }}>
        {/* Left: LangGraph agent */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          <div style={{ border: `2px solid ${COLORS.purple}66`, borderRadius: 12, padding: "16px 20px",
            background: COLORS.purple + "15", textAlign: "center", width: 130 }}>
            <div style={{ fontSize: 24 }}>🧠</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: COLORS.purple, fontFamily: "monospace", marginTop: 4 }}>LangGraph</div>
            <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace" }}>MCP Client</div>
          </div>
          <div style={{ fontSize: 9, color: "#334155", fontFamily: "monospace", textAlign: "center" }}>
            Discovers tools<br />via MCP protocol
          </div>
        </div>

        {/* Connector line */}
        <div style={{ display: "flex", alignItems: "center" }}>
          <div style={{ width: 40, height: 1, background: "#334155" }} />
          <div style={{ width: 0, height: 0, borderLeft: "6px solid #334155",
            borderTop: "4px solid transparent", borderBottom: "4px solid transparent" }} />
        </div>

        {/* Right: MCP servers grid */}
        <div style={{ flex: 1 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8 }}>
            {mcpServers.map(m => (
              <div key={m.id} onClick={() => setSelected(selected === m.id ? null : m.id)}
                style={{ border: `1px solid ${selected === m.id ? m.color : m.color + "44"}`,
                  borderRadius: 8, padding: "10px 12px", cursor: "pointer",
                  background: selected === m.id ? m.color + "20" : m.color + "08",
                  transition: "all 0.2s",
                  boxShadow: selected === m.id ? `0 0 12px ${m.color}44` : "none" }}>
                <div style={{ fontSize: 18 }}>{m.icon}</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: m.color, fontFamily: "monospace", marginTop: 4 }}>{m.name}</div>
                <div style={{ fontSize: 9, color: "#475569", fontFamily: "monospace" }}>:{m.port}</div>
                <div style={{ marginTop: 4 }}>
                  <Badge color={m.license === "MIT" ? COLORS.green : COLORS.orange}>{m.license}</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detail panel */}
      {sel && (
        <div style={{ marginTop: 20, border: `1px solid ${sel.color}44`, borderRadius: 12,
          padding: 20, background: sel.color + "08" }}>
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: sel.color, fontFamily: "monospace", marginBottom: 12 }}>
                {sel.icon} {sel.name}
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace", marginBottom: 4 }}>CONNECTS TO</div>
                <Badge color={sel.color}>{sel.connects}</Badge>
              </div>
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace", marginBottom: 4 }}>INSTALL</div>
                <div style={{ background: "#26221c", borderRadius: 4, padding: "6px 10px",
                  fontSize: 10, color: "#22c55e", fontFamily: "monospace" }}>
                  npx {sel.npm}
                </div>
              </div>
            </div>
            <div style={{ flex: 2, minWidth: 260 }}>
              <div style={{ fontSize: 9, color: "#64748b", fontFamily: "monospace", marginBottom: 8 }}>EXPOSED TOOLS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {sel.tools.map((t, i) => (
                  <div key={i} style={{ background: "#26221c", borderRadius: 4, padding: "6px 10px",
                    fontSize: 10, color: sel.color, fontFamily: "monospace", border: `1px solid ${sel.color}22` }}>
                    <span style={{ color: "#64748b" }}>fn</span> {t}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── TAB 4: Data Flow ──────────────────────────────────────────
function DataFlow() {
  const [active, setActive] = useState(0);

  const flows = [
    {
      name: "Pod Crash Query",
      query: "Why is checkout-api pod crashing?",
      color: COLORS.red,
      steps: [
        { step: "1", label: "User Query", detail: "Engineer types question in chat or Slack", icon: "💬", color: COLORS.cyan },
        { step: "2", label: "Intent Classification", detail: "LLM classifies: POD_CRASH → routes to pod tools", icon: "🧠", color: COLORS.purple },
        { step: "3", label: "prometheus-mcp", detail: "get_pod_restarts() → 14 restarts in 2h", icon: "🔥", color: COLORS.orange },
        { step: "4", label: "loki-mcp", detail: "get_crash_logs(checkout-api) → OOMKilled logs", icon: "📋", color: COLORS.teal },
        { step: "5", label: "kubernetes-mcp", detail: "get_k8s_events(checkout-api) → OOMKilled reason", icon: "☸️", color: COLORS.blue },
        { step: "6", label: "runbook-mcp", detail: "search_runbook_rag('OOM pod') → fix steps", icon: "📖", color: COLORS.cyan },
        { step: "7", label: "AI Synthesizer", detail: "LLM reads all data → plain English explanation", icon: "📝", color: COLORS.purple },
        { step: "8", label: "Response", detail: "Root cause + Grafana chart + fix commands", icon: "✅", color: COLORS.green },
      ]
    },
    {
      name: "Workflow rejection query",
      query: "Why was workflow #8821 rejected?",
      color: COLORS.orange,
      steps: [
        { step: "1", label: "User Query", detail: "Operator asks about a specific workflow run", icon: "💬", color: COLORS.cyan },
        { step: "2", label: "Intent Classification", detail: "LLM classifies: WORKFLOW_ANALYSIS + workflow_id=8821", icon: "🧠", color: COLORS.purple },
        { step: "3", label: "tenant-data-mcp", detail: "get_workflow_rejection_reason(8821) → policy / quota code", icon: "📈", color: COLORS.red },
        { step: "4", label: "elasticsearch-mcp", detail: "get_workflow_by_id(8821) → full log line with tenant context", icon: "🔍", color: COLORS.orange },
        { step: "5", label: "runbook-mcp", detail: "search_runbook_rag('workflow quota rejection')", icon: "📖", color: COLORS.cyan },
        { step: "6", label: "AI Synthesizer", detail: "LLM reads ES log → explains quota/policy failure in plain English", icon: "📝", color: COLORS.purple },
        { step: "7", label: "Response", detail: "Log view + rejection reason + tenant admin action", icon: "✅", color: COLORS.green },
      ]
    },
    {
      name: "Metrics Query",
      query: "Show CPU of prod-api-02 last 1 hour",
      color: COLORS.blue,
      steps: [
        { step: "1", label: "User Query", detail: "Engineer asks for specific server metrics", icon: "💬", color: COLORS.cyan },
        { step: "2", label: "Intent Classification", detail: "LLM classifies: METRICS + extracts server=prod-api-02, duration=1h", icon: "🧠", color: COLORS.purple },
        { step: "3", label: "prometheus-mcp", detail: "get_cpu_usage(prod-api-02, 1h) → time-series data", icon: "🔥", color: COLORS.orange },
        { step: "4", label: "Chart Builder", detail: "Prometheus data → Recharts LineChart spec JSON", icon: "📊", color: COLORS.blue },
        { step: "5", label: "AI Synthesizer", detail: "LLM reads peak/avg/trend → explains in plain English", icon: "📝", color: COLORS.purple },
        { step: "6", label: "Response", detail: "Grafana-style inline chart + AI insight + correlation", icon: "✅", color: COLORS.green },
      ]
    },
  ];

  const f = flows[active];

  return (
    <div style={{ padding: 32 }}>
      <SectionTitle color={COLORS.cyan}>LangGraph Query Flow — Step by Step</SectionTitle>

      {/* Flow selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {flows.map((fl, i) => (
          <button key={i} onClick={() => setActive(i)}
            style={{ border: `1px solid ${active === i ? fl.color : fl.color + "44"}`,
              borderRadius: 8, padding: "8px 16px", cursor: "pointer",
              background: active === i ? fl.color + "20" : "transparent",
              color: active === i ? fl.color : "#64748b", fontSize: 11,
              fontFamily: "monospace", fontWeight: 600, transition: "all 0.2s" }}>
            {fl.name}
          </button>
        ))}
      </div>

      {/* Query display */}
      <div style={{ background: "#252220", borderRadius: 8, padding: "12px 16px", marginBottom: 24,
        border: `1px solid ${f.color}44`, display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>Engineer types:</span>
        <span style={{ fontSize: 12, color: f.color, fontFamily: "monospace", fontWeight: 600 }}>"{f.query}"</span>
      </div>

      {/* Flow steps */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {f.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "stretch", gap: 0 }}>
            {/* Timeline */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", width: 40, flexShrink: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: "50%", border: `2px solid ${s.color}`,
                background: s.color + "20", display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 700, color: s.color, fontFamily: "monospace", flexShrink: 0 }}>
                {s.step}
              </div>
              {i < f.steps.length - 1 && (
                <div style={{ width: 1, flex: 1, background: "#4a443c", minHeight: 16 }} />
              )}
            </div>

            {/* Content */}
            <div style={{ flex: 1, paddingLeft: 12, paddingBottom: i < f.steps.length - 1 ? 16 : 0, paddingTop: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 14 }}>{s.icon}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace", paddingLeft: 22, lineHeight: 1.5 }}>
                {s.detail}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Key principle */}
      <div style={{ marginTop: 24, border: `1px solid ${COLORS.green}44`, borderRadius: 8, padding: "12px 16px",
        background: COLORS.green + "08" }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: COLORS.green, fontFamily: "monospace", marginBottom: 6 }}>
          ◈ ZERO HALLUCINATION PRINCIPLE
        </div>
        <div style={{ fontSize: 11, color: "#94a3b8", fontFamily: "monospace" }}>
          LLM is called ONLY in steps 2 and 7. All data is fetched from real sources first.
          The synthesizer node reads actual data — it never guesses or invents information.
          Every answer cites which MCP tool returned which data.
        </div>
      </div>
    </div>
  );
}

// ── TAB 5: Project Structure ──────────────────────────────────
function ProjectStructure() {
  const [expanded, setExpanded] = useState(new Set(["root", "mcp", "agent", "api", "frontend"]));

  const toggle = (id) => {
    const next = new Set(expanded);
    next.has(id) ? next.delete(id) : next.add(id);
    setExpanded(next);
  };

  const dirs = [
    { id: "mcp", label: "mcp-servers/", color: COLORS.green, icon: "📦", desc: "Open source MCP servers",
      children: [
        { label: "prometheus-mcp/", color: COLORS.orange, children: ["server.py", "tools/cpu_metrics.py", "tools/pod_metrics.py", "Dockerfile"] },
        { label: "elasticsearch-mcp/", color: COLORS.orange, children: ["server.py", "tools/workflow_lookup.py", "tools/pattern_detection.py", "Dockerfile"] },
        { label: "loki-mcp/", color: COLORS.teal, children: ["server.py", "tools/pod_logs.py", "tools/crash_logs.py", "Dockerfile"] },
        { label: "kubernetes-mcp/", color: COLORS.blue, children: ["server.py", "tools/pod_status.py", "tools/k8s_events.py", "Dockerfile"] },
        { label: "snmp-network-mcp/", color: COLORS.green, children: ["server.py", "tools/switch_ports.py", "tools/device_cpu.py", "Dockerfile"] },
        { label: "tenant-data-mcp/", color: COLORS.red, children: ["server.py", "tools/workflow_rejection.py", "tools/tenant_quota.py"] },
        { label: "nexiq-db-mcp/", color: COLORS.purple, children: ["server.py", "tools/device_health.py", "tools/url_checks.py"] },
        { label: "runbook-mcp/", color: COLORS.cyan, children: ["server.py", "tools/search_runbook.py", "vector_store/"] },
      ]
    },
    { id: "agent", label: "agent/", color: COLORS.purple, icon: "🧠", desc: "LangGraph orchestrator",
      children: [
        { label: "graph.py", color: COLORS.purple },
        { label: "state.py", color: COLORS.purple },
        { label: "mcp_client.py", color: COLORS.purple },
        { label: "nodes/", color: COLORS.purple, children: ["intent_classifier.py", "data_fetcher.py", "chart_builder.py", "synthesizer.py"] },
        { label: "prompts/", color: COLORS.purple, children: ["classifier_prompt.py", "synthesizer_prompt.py"] },
      ]
    },
    { id: "api", label: "api/", color: COLORS.blue, icon: "⚡", desc: "FastAPI backend",
      children: [
        { label: "main.py", color: COLORS.blue },
        { label: "routes/", color: COLORS.blue, children: ["chat.py (WebSocket)", "health.py", "history.py"] },
        { label: "middleware/", color: COLORS.blue, children: ["auth.py (Keycloak)", "tenant.py", "rate_limit.py"] },
        { label: "models/", color: COLORS.blue, children: ["query.py", "response.py"] },
      ]
    },
    { id: "frontend", label: "frontend/", color: COLORS.cyan, icon: "🌐", desc: "Next.js 15 UI",
      children: [
        { label: "components/Chat/", color: COLORS.cyan, children: ["ChatWindow.tsx", "MessageRenderer.tsx", "TypingIndicator.tsx"] },
        { label: "components/Grafana/", color: COLORS.orange, children: ["GrafanaChart.tsx", "CpuChart.tsx", "LatencyChart.tsx"] },
        { label: "components/Datadog/", color: COLORS.teal, children: ["LogViewer.tsx", "LogRow.tsx", "LogFilter.tsx"] },
        { label: "components/AIResponse/", color: COLORS.purple, children: ["SeverityBadge.tsx", "RootCausePanel.tsx", "FixPanel.tsx"] },
      ]
    },
    { id: "slack", label: "slack-bot/", color: COLORS.green, icon: "💬", desc: "Slack interface",
      children: [{ label: "bot.py", color: COLORS.green }, { label: "handlers/message.py", color: COLORS.green }, { label: "chart_renderer.py", color: COLORS.green }]
    },
    { id: "infra", label: "infra/", color: COLORS.slate, icon: "🐳", desc: "Docker + Helm",
      children: [{ label: "docker-compose.yml", color: COLORS.slate }, { label: "helm/Chart.yaml", color: COLORS.slate }, { label: "nginx/nginx.conf", color: COLORS.slate }]
    },
  ];

  const renderChildren = (children, depth = 0) => (
    <div style={{ paddingLeft: 16 }}>
      {children.map((child, i) => (
        <div key={i}>
          {typeof child === "string" ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
              <span style={{ color: "#334155", fontSize: 10 }}>├─</span>
              <span style={{ fontSize: 10, color: "#64748b", fontFamily: "monospace" }}>{child}</span>
            </div>
          ) : (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "3px 0" }}>
                <span style={{ color: "#334155", fontSize: 10 }}>├─</span>
                <span style={{ fontSize: 10, color: child.color, fontFamily: "monospace", fontWeight: 600 }}>{child.label}</span>
              </div>
              {child.children && renderChildren(child.children, depth + 1)}
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={{ padding: 32 }}>
      <SectionTitle color={COLORS.cyan}>Project File Structure — nexiq-ai/</SectionTitle>
      <div style={{ background: "#1a1714", borderRadius: 10, padding: 20, fontFamily: "monospace", fontSize: 11 }}>
        <div style={{ color: "#ede8df", marginBottom: 12, fontSize: 12, fontWeight: 700 }}>📁 nexiq-ai/</div>
        {dirs.map(dir => (
          <div key={dir.id} style={{ marginBottom: 4 }}>
            <div onClick={() => toggle(dir.id)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 8px",
                borderRadius: 6, cursor: "pointer", border: `1px solid ${dir.color}22`,
                background: dir.color + "08", marginBottom: 4 }}>
              <span>{expanded.has(dir.id) ? "▼" : "▶"}</span>
              <span style={{ color: dir.color }}>{dir.icon}</span>
              <span style={{ color: dir.color, fontWeight: 700 }}>{dir.label}</span>
              <span style={{ color: "#475569", fontSize: 10 }}>— {dir.desc}</span>
            </div>
            {expanded.has(dir.id) && dir.children && renderChildren(dir.children)}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function LinkedEyeArchitecture() {
  const [tab, setTab] = useState(0);

  const tabs = [
    { label: "Product Overview", icon: "🏗", component: ProductOverview },
    { label: "Architecture", icon: "⚡", component: ArchitectureDiagram },
    { label: "MCP Connectivity", icon: "🔗", component: MCPConnectivity },
    { label: "Data Flow", icon: "🌊", component: DataFlow },
    { label: "File Structure", icon: "📁", component: ProjectStructure },
  ];

  const ActiveComponent = tabs[tab].component;

  return (
    <div style={{ minHeight: "100vh", background: "#171512", color: "#ede8df" }}>
      <style>{`* { box-sizing: border-box; } button { outline: none; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #4a443c; }`}</style>

      {/* Header */}
      <div style={{ borderBottom: "1px solid #3a3630", padding: "14px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "#1e1c17", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg, #b89562, #6b5838)",
            display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>👁</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#ede8df", fontFamily: "monospace" }}>NexIQ AI</div>
            <div style={{ fontSize: 9, color: "#8c8478", fontFamily: "monospace" }}>Product Architecture & Structure</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {["On-Premise", "LangGraph", "MCP", "Open Source"].map(b => (
            <span key={b} style={{ fontSize: 9, padding: "3px 8px", borderRadius: 4,
              border: "1px solid #3d3932", color: "#8c8478", fontFamily: "monospace" }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom: "1px solid #3a3630", padding: "0 32px", background: "#1e1c17" }}>
        <div style={{ display: "flex", gap: 0 }}>
          {tabs.map((t, i) => (
            <button key={i} onClick={() => setTab(i)}
              style={{ padding: "12px 16px", border: "none", background: "transparent",
                cursor: "pointer", fontFamily: "monospace", fontSize: 11,
                color: tab === i ? "#b89562" : "#7d766c",
                borderBottom: tab === i ? "2px solid #b89562" : "2px solid transparent",
                transition: "all 0.2s", display: "flex", alignItems: "center", gap: 6 }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
        <ActiveComponent />
      </div>
    </div>
  );
}
