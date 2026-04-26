import { useState } from "react";

const C = {
  bg: "#060d18", surface: "#0a1628", card: "#0f1f35",
  border: "#1e3a5f", borderLight: "#2a4a6b",
  blue: "#1a56db", cyan: "#0891b2", green: "#059669",
  orange: "#d97706", red: "#dc2626", purple: "#7c3aed",
  textPrimary: "#e2e8f0", textSecondary: "#94a3b8",
  textMuted: "#64748b", white: "#ffffff",
};

const TAB_DEFS = [
  { id: "overview",     label: "System Overview",     icon: "🏗️" },
  { id: "flow",         label: "Query Flow",          icon: "⚡" },
  { id: "mcp",          label: "MCP Connectivity",    icon: "🔌" },
  { id: "dataflow",     label: "Data Flow",           icon: "📊" },
];

// ── Shared Components ─────────────────────────────────────────
const Box = ({ label, sub, color = C.blue, icon = "", width = "auto", onClick, active }) => (
  <div onClick={onClick} style={{
    background: active ? color + "33" : C.card,
    border: `1px solid ${active ? color : C.border}`,
    borderLeft: `3px solid ${color}`,
    borderRadius: 8, padding: "8px 12px", width,
    cursor: onClick ? "pointer" : "default",
    transition: "all 0.2s",
    boxShadow: active ? `0 0 12px ${color}44` : "none",
  }}>
    <div style={{ fontSize: 12, fontWeight: 700, color: active ? color : C.textPrimary, fontFamily: "monospace" }}>
      {icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}
    </div>
    {sub && <div style={{ fontSize: 10, color: C.textMuted, marginTop: 3, fontFamily: "monospace" }}>{sub}</div>}
  </div>
);

const Arrow = ({ dir = "down", color = C.border, label = "" }) => {
  const isH = dir === "right" || dir === "left";
  return (
    <div style={{ display: "flex", flexDirection: isH ? "row" : "column",
      alignItems: "center", justifyContent: "center", gap: 2,
      minWidth: isH ? 40 : "auto", minHeight: isH ? "auto" : 30 }}>
      {label && <span style={{ fontSize: 9, color: C.textMuted, fontFamily: "monospace" }}>{label}</span>}
      <div style={{
        width: isH ? 40 : 2, height: isH ? 2 : 24,
        background: `linear-gradient(${isH ? "90deg" : "180deg"}, transparent, ${color} 30%, ${color} 70%, transparent)`,
        position: "relative"
      }}>
        <div style={{
          position: "absolute",
          right: dir === "right" ? -4 : "auto",
          left: dir === "left" ? -4 : "auto",
          bottom: dir === "down" ? -4 : "auto",
          top: dir === "up" ? -4 : "auto",
          width: 0, height: 0,
          borderLeft: isH ? `6px solid ${color}` : "4px solid transparent",
          borderRight: isH ? "none" : "4px solid transparent",
          borderTop: isH ? "4px solid transparent" : "none",
          borderBottom: isH ? "4px solid transparent" : `6px solid ${color}`,
          transform: dir === "left" ? "scaleX(-1)" : "none",
        }} />
      </div>
    </div>
  );
};

const Layer = ({ title, color, children, note }) => (
  <div style={{
    background: color + "11", border: `1px solid ${color}33`,
    borderRadius: 10, padding: "12px 16px", marginBottom: 8
  }}>
    <div style={{ fontSize: 10, fontWeight: 700, color, fontFamily: "monospace",
      letterSpacing: "0.1em", marginBottom: 10, textTransform: "uppercase" }}>
      {title}
      {note && <span style={{ color: C.textMuted, fontWeight: 400, marginLeft: 8, fontSize: 9 }}>— {note}</span>}
    </div>
    {children}
  </div>
);

const Chip = ({ text, color }) => (
  <span style={{ background: color + "22", border: `1px solid ${color}55`,
    borderRadius: 4, padding: "2px 7px", fontSize: 10, color, fontFamily: "monospace", marginRight: 4 }}>
    {text}
  </span>
);

// ── Tab 1: System Overview ────────────────────────────────────
function OverviewTab() {
  const [hovered, setHovered] = useState(null);

  const layers = [
    {
      id: "l1", title: "L1 — User Interface",
      color: C.cyan, note: "Next.js 15 + Slack Bot",
      items: [
        { label: "Web Chat UI", sub: "Grafana charts + Datadog logs", icon: "💬" },
        { label: "Slack Bot", sub: "Slack Bolt + PNG charts", icon: "💬" },
        { label: "Auth UI", sub: "Keycloak / Clerk.dev SSO", icon: "🔐" },
      ]
    },
    {
      id: "l2", title: "L2 — API Gateway",
      color: C.blue, note: "FastAPI + WebSocket",
      items: [
        { label: "FastAPI Server", sub: "WebSocket /chat endpoint", icon: "⚡" },
        { label: "JWT Auth", sub: "Token validation + RBAC", icon: "🔐" },
        { label: "Multi-Tenant Router", sub: "Tenant context injection", icon: "🏢" },
        { label: "Rate Limiter", sub: "Redis-backed throttling", icon: "⏱️" },
      ]
    },
    {
      id: "l3", title: "L3 — LangGraph Agent",
      color: C.purple, note: "Stateful AI orchestration",
      items: [
        { label: "Intent Classifier", sub: "LLM → query type", icon: "🧠" },
        { label: "Tool Selector", sub: "Pick MCP servers", icon: "🎯" },
        { label: "Data Fetcher", sub: "Parallel MCP calls", icon: "📡" },
        { label: "Chart Builder", sub: "Prom → Recharts JSON", icon: "📈" },
        { label: "AI Synthesizer", sub: "LLM reads real data", icon: "✨" },
      ]
    },
    {
      id: "l4", title: "L4 — MCP Servers",
      color: C.orange, note: "Open Source MIT — one per data source",
      items: [
        { label: "prometheus-mcp", sub: ":8001 SSE", icon: "📊" },
        { label: "elasticsearch-mcp", sub: ":8002 SSE", icon: "🔍" },
        { label: "loki-mcp", sub: ":8003 SSE", icon: "📋" },
        { label: "kubernetes-mcp", sub: ":8004 SSE", icon: "☸️" },
        { label: "nexiq-db-mcp", sub: ":8005 SSE", icon: "🗄️" },
        { label: "runbook-mcp", sub: ":8006 SSE RAG", icon: "📖" },
      ]
    },
    {
      id: "l5", title: "L5 — Data Sources",
      color: C.green, note: "Existing infrastructure — no replacement",
      items: [
        { label: "Prometheus", sub: ":9090 PromQL", icon: "🔥" },
        { label: "Elasticsearch", sub: ":9200 app-logs-*", icon: "🔍" },
        { label: "Loki", sub: ":3100 LogQL", icon: "📦" },
        { label: "Kubernetes API", sub: ":6443 REST", icon: "☸️" },
        { label: "PostgreSQL", sub: ":5432 nexiq", icon: "🐘" },
        { label: "pgVector/Qdrant", sub: "vector similarity", icon: "🧮" },
      ]
    },
    {
      id: "l6", title: "L6 — Physical Infrastructure",
      color: C.textMuted, note: "NexIQ production — KVM hosts, VMs, switches",
      items: [
        { label: "KVM Hosts", sub: "KVM1-KVM5 (10.10.0.x)", icon: "🖥️" },
        { label: "51 Virtual Machines", sub: "Apps, Gateway, Workers…", icon: "💻" },
        { label: "Network Devices", sub: "Cisco, Aruba, Huawei, Fortigate", icon: "🌐" },
        { label: "Storage (SAN/NAS)", sub: "fs-storage", icon: "💾" },
      ]
    },
  ];

  return (
    <div>
      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20, fontFamily: "monospace" }}>
        Six-layer architecture — each layer communicates only through defined interfaces. No layer knows the internals of another.
      </div>
      {layers.map((layer, li) => (
        <div key={layer.id}>
          <Layer title={layer.title} color={layer.color} note={layer.note}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {layer.items.map((item, i) => (
                <Box key={i} label={item.label} sub={item.sub} icon={item.icon}
                  color={layer.color}
                  active={hovered === `${layer.id}-${i}`}
                  onClick={() => setHovered(hovered === `${layer.id}-${i}` ? null : `${layer.id}-${i}`)}
                />
              ))}
            </div>
          </Layer>
          {li < layers.length - 1 && (
            <div style={{ display: "flex", justifyContent: "center", margin: "4px 0" }}>
              <Arrow dir="down" color={layer.color} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Tab 2: Query Flow ─────────────────────────────────────────
function FlowTab() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      n: "1", title: "Engineer Asks Question",
      color: C.cyan, icon: "💬",
      component: "Frontend / Slack",
      desc: "Engineer types natural language in chat UI or Slack. WebSocket connection established. Query sent to FastAPI.",
      example: "\"Why is checkout-api pod crashing?\"",
      time: "~0ms"
    },
    {
      n: "2", title: "Auth + Tenant Routing",
      color: C.blue, icon: "🔐",
      component: "FastAPI Gateway",
      desc: "JWT token validated. Tenant ID extracted. Request context injected. Forwarded to LangGraph agent with full context.",
      example: "tenant=acme-corp, user=ops-admin, session=abc123",
      time: "~10ms"
    },
    {
      n: "3", title: "Intent Classification",
      color: C.purple, icon: "🧠",
      component: "LangGraph — Intent Classifier Node",
      desc: "Small LLM call (fast model). Query classified into one of 8 intent types. No data access at this stage. Conditional edge routes to correct next nodes.",
      example: "\"Why is checkout-api pod crashing?\" → POD_CRASH",
      time: "~150ms"
    },
    {
      n: "4", title: "Parallel Data Fetch",
      color: C.orange, icon: "📡",
      component: "LangGraph — Data Fetcher Node → MCP Servers",
      desc: "Based on POD_CRASH intent: calls prometheus-mcp (restart count), loki-mcp (crash logs), kubernetes-mcp (events) simultaneously via SSE transport. Real data only.",
      example: "prometheus-mcp.get_pod_restarts() + loki-mcp.get_crash_logs() + kubernetes-mcp.get_k8s_events()",
      time: "~400ms (parallel)"
    },
    {
      n: "5", title: "Chart Building",
      color: C.green, icon: "📈",
      component: "LangGraph — Chart Builder Node",
      desc: "If metrics data returned: converts Prometheus time-series format into Recharts JSON spec. Frontend renders this as Grafana-style inline chart. Log data formatted for Datadog-style table.",
      example: "{ type: 'AreaChart', data: [...60 datapoints], threshold: 80, color: '#ef4444' }",
      time: "~50ms"
    },
    {
      n: "6", title: "AI Synthesis",
      color: C.red, icon: "✨",
      component: "LangGraph — AI Synthesizer Node",
      desc: "LLM receives ALL fetched data. System prompt forbids guessing — only explain what data shows. Generates: severity badge, root cause, evidence citations, fix commands. Streams word by word to client.",
      example: "\"checkout-api OOMKilled — 14 restarts. Java heap 503MB > 512MB limit. Fix: increase memory to 1Gi\"",
      time: "~600ms (streaming)"
    },
  ];

  return (
    <div>
      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20, fontFamily: "monospace" }}>
        Every query follows this deterministic 6-step pipeline. LLM is invoked only AFTER all data is fetched — total latency ~1.2 seconds.
      </div>

      {/* Step selector */}
      <div style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {steps.map((s, i) => (
          <button key={i} onClick={() => setActiveStep(i)} style={{
            background: activeStep === i ? s.color + "33" : C.card,
            border: `1px solid ${activeStep === i ? s.color : C.border}`,
            borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            color: activeStep === i ? s.color : C.textSecondary,
            fontSize: 12, fontFamily: "monospace", fontWeight: 700,
            transition: "all 0.2s"
          }}>
            Step {s.n}
          </button>
        ))}
      </div>

      {/* Flow diagram */}
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {steps.map((step, i) => (
          <div key={i}>
            <div onClick={() => setActiveStep(i)} style={{
              display: "flex", alignItems: "stretch", gap: 0, cursor: "pointer",
              transition: "all 0.2s"
            }}>
              {/* Step number */}
              <div style={{
                width: 48, minHeight: 60, display: "flex", alignItems: "center",
                justifyContent: "center", flexDirection: "column",
                background: activeStep === i ? step.color + "33" : C.card,
                border: `1px solid ${activeStep === i ? step.color : C.border}`,
                borderRight: "none", borderRadius: "8px 0 0 8px",
                transition: "all 0.2s"
              }}>
                <div style={{ fontSize: 16 }}>{step.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: step.color, fontFamily: "monospace" }}>
                  {step.n}
                </div>
              </div>

              {/* Content */}
              <div style={{
                flex: 1, padding: "12px 16px",
                background: activeStep === i ? step.color + "11" : C.surface,
                border: `1px solid ${activeStep === i ? step.color : C.border}`,
                borderLeft: "none", borderRadius: "0 8px 8px 0",
                transition: "all 0.2s"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: step.color, fontFamily: "monospace" }}>
                      {step.title}
                    </span>
                    <span style={{ fontSize: 10, color: C.textMuted, marginLeft: 10, fontFamily: "monospace" }}>
                      {step.component}
                    </span>
                  </div>
                  <span style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace",
                    background: C.card, padding: "2px 6px", borderRadius: 4, border: `1px solid ${C.border}` }}>
                    {step.time}
                  </span>
                </div>

                {activeStep === i && (
                  <div style={{ marginTop: 10 }}>
                    <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.6, marginBottom: 8 }}>
                      {step.desc}
                    </div>
                    <div style={{
                      background: C.bg, border: `1px solid ${step.color}44`,
                      borderRadius: 6, padding: "8px 12px",
                      fontSize: 11, color: step.color, fontFamily: "monospace"
                    }}>
                      → {step.example}
                    </div>
                  </div>
                )}
              </div>
            </div>
            {i < steps.length - 1 && (
              <div style={{ marginLeft: 24, padding: "2px 0" }}>
                <Arrow dir="down" color={step.color} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: 20, padding: 12, background: C.green + "11",
        border: `1px solid ${C.green}33`, borderRadius: 8 }}>
        <div style={{ fontSize: 11, color: C.green, fontFamily: "monospace", fontWeight: 700 }}>
          ✓ Zero Hallucination Guarantee
        </div>
        <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 4, fontFamily: "monospace" }}>
          The LLM (Step 6) receives only the data fetched in Step 4. System prompt explicitly forbids answering from memory.
          Every claim in the output is traceable to a specific metric value, log line, or K8s event.
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: MCP Connectivity ───────────────────────────────────
function MCPTab() {
  const [selected, setSelected] = useState(null);

  const mcpServers = [
    {
      name: "prometheus-mcp", port: "8001", color: C.orange, icon: "🔥",
      license: "MIT Open Source",
      dataSource: "Prometheus :9090",
      tools: ["get_cpu_usage(server, duration)", "get_memory_usage(server, duration)", "get_pod_restarts(namespace, threshold)", "get_queue_metrics(queue, tenant)", "get_api_latency(tenant, percentile)"],
      intents: ["METRICS", "POD_CRASH", "COMBINED"],
      output: "Time-series data → Recharts chart spec",
    },
    {
      name: "elasticsearch-mcp", port: "8002", color: C.blue, icon: "🔍",
      license: "MIT Open Source",
      dataSource: "Elasticsearch :9200",
      tools: ["get_workflow_by_id(workflow_id)", "get_workflow_failures(duration, tenant_id)", "get_tenant_usage(date_range)", "get_failure_patterns(duration)"],
      intents: ["WORKFLOW_ANALYSIS", "COMBINED"],
      output: "Log entries + aggregations → Datadog log viewer",
    },
    {
      name: "loki-mcp", port: "8003", color: C.cyan, icon: "📋",
      license: "MIT Open Source",
      dataSource: "Loki :3100",
      tools: ["get_pod_logs(pod, level, limit)", "get_app_errors(service, duration)", "get_nginx_errors(service, status_code)", "get_crash_logs(pod, lookback)"],
      intents: ["POD_CRASH", "API_ERROR", "APP_LOGS"],
      output: "Log entries with level/timestamp → Datadog log viewer",
    },
    {
      name: "kubernetes-mcp", port: "8004", color: C.purple, icon: "☸️",
      license: "MIT Open Source",
      dataSource: "K8s API :6443",
      tools: ["get_pod_status(namespace)", "get_k8s_events(pod)", "get_node_health()", "get_deployment_info(name)"],
      intents: ["POD_CRASH", "HARDWARE", "COMBINED"],
      output: "Pod status + events → AI analysis context",
    },
    {
      name: "nexiq-db-mcp", port: "8005", color: C.green, icon: "🗄️",
      license: "MIT Open Source",
      dataSource: "PostgreSQL :5432",
      tools: ["get_device_health(site)", "get_url_ssl_status(url)", "get_open_tickets(priority)", "get_site_summary(site_id)", "get_hardware_status(host)"],
      intents: ["URL_SSL", "HARDWARE", "COMBINED"],
      output: "Device status + ticket data → AI analysis context",
    },
    {
      name: "runbook-mcp", port: "8006", color: "#7c3aed", icon: "📖",
      license: "MIT Open Source",
      dataSource: "pgVector / Qdrant",
      tools: ["search_runbook_rag(query, top_k)", "get_sop_by_issue(issue_type)", "ingest_new_runbook(doc_path)"],
      intents: ["ALL queries"],
      output: "Relevant runbook sections + SOP steps → AI recommendation",
    },
  ];

  const sel = selected !== null ? mcpServers[selected] : null;

  return (
    <div>
      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16, fontFamily: "monospace" }}>
        6 independent MCP servers. Each deployed as Docker container. LangGraph agent connects via SSE transport. Click a server to see details.
      </div>

      {/* Agent box */}
      <div style={{ background: "#7c3aed22", border: "1px solid #7c3aed55",
        borderRadius: 10, padding: "12px 20px", marginBottom: 12, textAlign: "center" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: "#a855f7", fontFamily: "monospace" }}>
          🧠 LangGraph Agent (Tool Selector + Data Fetcher)
        </div>
        <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginTop: 4 }}>
          Discovers tools dynamically via MCP protocol — no hardcoded integrations
        </div>
      </div>

      {/* SSE arrows */}
      <div style={{ display: "flex", justifyContent: "space-around", marginBottom: 4 }}>
        {mcpServers.map((_, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center", flex: 1 }}>
            <Arrow dir="down" color={mcpServers[i].color} label="SSE" />
          </div>
        ))}
      </div>

      {/* MCP server grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 12 }}>
        {mcpServers.map((s, i) => (
          <div key={i} onClick={() => setSelected(selected === i ? null : i)} style={{
            background: selected === i ? s.color + "22" : C.card,
            border: `1px solid ${selected === i ? s.color : C.border}`,
            borderRadius: 8, padding: "10px 12px", cursor: "pointer", transition: "all 0.2s",
            boxShadow: selected === i ? `0 0 16px ${s.color}33` : "none"
          }}>
            <div style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: s.color, fontFamily: "monospace" }}>
              {s.name}
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace" }}>:{s.port} • {s.license}</div>
            <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 4, fontFamily: "monospace" }}>
              → {s.dataSource}
            </div>
          </div>
        ))}
      </div>

      {/* Detail panel */}
      {sel && (
        <div style={{ background: sel.color + "11", border: `1px solid ${sel.color}44`,
          borderRadius: 10, padding: "16px 20px", marginBottom: 12 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: sel.color, fontFamily: "monospace", marginBottom: 12 }}>
            {sel.icon} {sel.name} — Detail
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginBottom: 6, textTransform: "uppercase" }}>
                Tools Exposed
              </div>
              {sel.tools.map((t, i) => (
                <div key={i} style={{ fontSize: 10, color: C.textSecondary, fontFamily: "monospace",
                  background: C.bg, padding: "4px 8px", borderRadius: 4, marginBottom: 3,
                  border: `1px solid ${C.border}` }}>
                  {t}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginBottom: 6, textTransform: "uppercase" }}>
                Triggered By Intents
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
                {sel.intents.map((t, i) => (
                  <Chip key={i} text={t} color={sel.color} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace", marginBottom: 4, textTransform: "uppercase" }}>
                Output Format
              </div>
              <div style={{ fontSize: 11, color: C.textSecondary, fontFamily: "monospace",
                background: C.bg, padding: "8px 10px", borderRadius: 6, border: `1px solid ${C.border}` }}>
                {sel.output}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data sources */}
      <div style={{ display: "flex", justifyContent: "space-around", marginTop: 8, marginBottom: 4 }}>
        {mcpServers.map((_, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "center", flex: 1 }}>
            <Arrow dir="down" color={mcpServers[i].color} label="HTTP" />
          </div>
        ))}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {["Prometheus :9090", "Elasticsearch :9200", "Loki :3100",
          "Kubernetes :6443", "PostgreSQL :5432", "pgVector/Qdrant"].map((ds, i) => (
          <div key={i} style={{ background: C.green + "11", border: `1px solid ${C.green}33`,
            borderRadius: 6, padding: "8px 10px", textAlign: "center" }}>
            <div style={{ fontSize: 10, color: C.green, fontFamily: "monospace", fontWeight: 700 }}>
              {["🔥","🔍","📦","☸️","🐘","🧮"][i]} {ds}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 4: Data Flow ──────────────────────────────────────────
function DataFlowTab() {
  const flows = [
    {
      query: "\"Show CPU of prod-api-02 last 1 hour\"",
      intent: "METRICS", color: C.orange,
      steps: [
        { from: "Engineer", to: "WebSocket", data: "Plain text query" },
        { from: "FastAPI", to: "LangGraph", data: "JWT validated request + tenant context" },
        { from: "Intent Classifier", to: "prometheus-mcp", data: "Intent=METRICS, entity=prod-api-02, duration=1h" },
        { from: "prometheus-mcp", to: "Prometheus :9090", data: "PromQL: node_cpu_seconds_total{instance='prod-api-02'}" },
        { from: "Prometheus", to: "Chart Builder", data: "60 datapoints × [timestamp, cpu%] values" },
        { from: "Chart Builder", to: "AI Synthesizer", data: "Recharts JSON spec + peak/avg/threshold metadata" },
        { from: "AI Synthesizer", to: "Frontend", data: "{ answer: '...CPU peaked at 94% at 14:32...', chart: {...}, citations: ['prometheus:node_cpu'] }" },
      ]
    },
    {
      query: "\"Why was workflow #8821 rejected?\"",
      intent: "WORKFLOW_ANALYSIS", color: C.blue,
      steps: [
        { from: "Engineer", to: "WebSocket", data: "Plain text query" },
        { from: "FastAPI", to: "LangGraph", data: "Authenticated request, tenant=acme-corp" },
        { from: "Intent Classifier", to: "elasticsearch-mcp", data: "Intent=WORKFLOW_ANALYSIS, workflow_id=8821" },
        { from: "elasticsearch-mcp", to: "Elasticsearch :9200", data: "ES Query DSL on app-logs-* scoped by tenant_id" },
        { from: "Elasticsearch", to: "AI Synthesizer", data: "Log entries: policy_check=FAIL, quota vs budget fields" },
        { from: "runbook-mcp", to: "pgVector", data: "RAG search: 'workflow quota rejection'" },
        { from: "AI Synthesizer", to: "Frontend", data: "{ severity: 'error', answer: 'Rejected: tenant quota', logs: [...], fix: 'Notify tenant admin...' }" },
      ]
    },
    {
      query: "\"Why is checkout-api pod crashing?\"",
      intent: "POD_CRASH", color: C.red,
      steps: [
        { from: "Engineer", to: "WebSocket", data: "Plain text query" },
        { from: "Intent Classifier", to: "3 MCP servers", data: "Intent=POD_CRASH — PARALLEL fetch initiated" },
        { from: "prometheus-mcp", to: "Prometheus", data: "kube_pod_container_status_restarts_total{pod='checkout-api.*'}" },
        { from: "loki-mcp", to: "Loki :3100", data: "LogQL: {pod='checkout-api'} |= 'ERROR' last 100 lines" },
        { from: "kubernetes-mcp", to: "K8s API :6443", data: "GET /api/v1/namespaces/prod/events?field=checkout-api" },
        { from: "All 3 MCP responses", to: "AI Synthesizer", data: "restarts=14, logs=[OOMKilled×3, OutOfMemoryError], events=[OOMKilled at 14:32,14:38,14:51]" },
        { from: "AI Synthesizer", to: "Frontend", data: "{ severity: 'critical', answer: 'OOMKilled — heap 503MB > 512MB limit', chart: restartBarChart, logs: crashLogs, fix: 'kubectl set resources...' }" },
      ]
    },
  ];

  const [selectedFlow, setSelectedFlow] = useState(0);
  const flow = flows[selectedFlow];

  return (
    <div>
      <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 16, fontFamily: "monospace" }}>
        Trace the exact data path for each query type. Every byte that flows through the system is shown here.
      </div>

      {/* Flow selector */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        {flows.map((f, i) => (
          <button key={i} onClick={() => setSelectedFlow(i)} style={{
            background: selectedFlow === i ? f.color + "22" : C.card,
            border: `1px solid ${selectedFlow === i ? f.color : C.border}`,
            borderRadius: 6, padding: "6px 12px", cursor: "pointer",
            color: selectedFlow === i ? f.color : C.textSecondary,
            fontSize: 11, fontFamily: "monospace", fontWeight: 700,
            transition: "all 0.2s", textAlign: "left"
          }}>
            <div style={{ marginBottom: 2 }}>{f.intent}</div>
            <div style={{ fontSize: 10, color: selectedFlow === i ? f.color + "aa" : C.textMuted, fontWeight: 400 }}>
              {f.query.substring(0, 32)}...
            </div>
          </button>
        ))}
      </div>

      {/* Query display */}
      <div style={{ background: flow.color + "11", border: `1px solid ${flow.color}44`,
        borderRadius: 8, padding: "10px 16px", marginBottom: 16 }}>
        <span style={{ fontSize: 11, color: C.textMuted, fontFamily: "monospace" }}>Query: </span>
        <span style={{ fontSize: 12, color: flow.color, fontFamily: "monospace", fontWeight: 700 }}>{flow.query}</span>
        <Chip text={flow.intent} color={flow.color} />
      </div>

      {/* Data flow steps */}
      {flow.steps.map((step, i) => (
        <div key={i} style={{ display: "flex", alignItems: "stretch", gap: 0, marginBottom: 0 }}>
          <div style={{ width: 24, display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ width: 20, height: 20, borderRadius: "50%",
              background: flow.color + "33", border: `2px solid ${flow.color}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 9, fontWeight: 700, color: flow.color, fontFamily: "monospace",
              flexShrink: 0 }}>
              {i + 1}
            </div>
            {i < flow.steps.length - 1 && (
              <div style={{ width: 2, flex: 1, background: flow.color + "44", minHeight: 16 }} />
            )}
          </div>
          <div style={{ flex: 1, padding: "0 0 12px 10px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 11, color: C.textSecondary, fontFamily: "monospace", fontWeight: 700 }}>
                {step.from}
              </span>
              <span style={{ fontSize: 10, color: C.textMuted }}>→</span>
              <span style={{ fontSize: 11, color: flow.color, fontFamily: "monospace", fontWeight: 700 }}>
                {step.to}
              </span>
            </div>
            <div style={{ fontSize: 10, color: C.textMuted, fontFamily: "monospace",
              background: C.bg, padding: "5px 10px", borderRadius: 5,
              border: `1px solid ${C.border}`, wordBreak: "break-all", lineHeight: 1.5 }}>
              {step.data}
            </div>
          </div>
        </div>
      ))}

      <div style={{ marginTop: 8, padding: 12, background: flow.color + "11",
        border: `1px solid ${flow.color}33`, borderRadius: 8 }}>
        <div style={{ fontSize: 11, color: flow.color, fontFamily: "monospace", fontWeight: 700 }}>
          ✓ Result: Real data cited in every response
        </div>
        <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 4, fontFamily: "monospace" }}>
          The LLM receives the raw data from the final step above. It explains what the data shows — never what it thinks might be wrong.
        </div>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function ArchDiagram() {
  const [activeTab, setActiveTab] = useState("overview");

  return (
    <div style={{ background: C.bg, minHeight: "100vh", color: C.textPrimary,
      fontFamily: "system-ui, sans-serif", padding: 24 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, display: "flex", alignItems: "center",
            justifyContent: "center", fontSize: 18,
            background: "linear-gradient(135deg, #0891b2, #1a56db)" }}>👁</div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: C.white, letterSpacing: -0.5 }}>
              NexIQ AI Platform
            </div>
            <div style={{ fontSize: 12, color: C.textMuted, fontFamily: "monospace" }}>
              Product Structure • Flow • Connectivity — Santhira Technologies
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {["LangGraph", "MCP", "Prometheus", "Elasticsearch", "Loki", "K8s", "Next.js 15"].map(t => (
            <Chip key={t} text={t} color={C.cyan} />
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 20, borderBottom: `1px solid ${C.border}`, paddingBottom: 0 }}>
        {TAB_DEFS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            background: activeTab === tab.id ? C.blue + "22" : "transparent",
            border: `1px solid ${activeTab === tab.id ? C.blue : "transparent"}`,
            borderBottom: activeTab === tab.id ? `2px solid ${C.blue}` : "2px solid transparent",
            borderRadius: "6px 6px 0 0", padding: "8px 14px", cursor: "pointer",
            color: activeTab === tab.id ? C.blue : C.textMuted,
            fontSize: 12, fontFamily: "monospace", fontWeight: activeTab === tab.id ? 700 : 400,
            transition: "all 0.2s",
          }}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ maxWidth: 900 }}>
        {activeTab === "overview"  && <OverviewTab />}
        {activeTab === "flow"      && <FlowTab />}
        {activeTab === "mcp"       && <MCPTab />}
        {activeTab === "dataflow"  && <DataFlowTab />}
      </div>
    </div>
  );
}
