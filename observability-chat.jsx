import { useState, useRef, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, AreaChart, Area, BarChart, Bar } from "recharts";

// ── Sample Data ──────────────────────────────────────────────
const cpuData = Array.from({ length: 60 }, (_, i) => ({
  time: `${String(Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`,
  value: i < 20 ? 30 + Math.random() * 15 : i < 35 ? 60 + Math.random() * 30 : i < 45 ? 88 + Math.random() * 8 : 45 + Math.random() * 20,
  threshold: 80,
}));

const latencyData = Array.from({ length: 48 }, (_, i) => ({
  time: `${String(8 + Math.floor(i / 4)).padStart(2, "0")}:${String((i % 4) * 15).padStart(2, "0")}`,
  p50: 130 + Math.random() * 20,
  p95: 280 + Math.random() * 60,
  p99: 330 + Math.random() * 80 + (i > 30 && i < 38 ? 200 : 0),
}));

const queueData = Array.from({ length: 40 }, (_, i) => ({
  time: `Day ${1 + Math.floor(i / 8)}`,
  avg: 200 + i * 15 + Math.random() * 50,
  max: 400 + i * 25 + Math.random() * 100,
  threshold: 1000,
}));

const podRestartData = [
  { pod: "checkout-api", restarts: 14, namespace: "prod" },
  { pod: "notify-worker", restarts: 3, namespace: "prod" },
  { pod: "auth-service", restarts: 7, namespace: "prod" },
  { pod: "sync-worker", restarts: 1, namespace: "prod" },
  { pod: "edge-gateway", restarts: 0, namespace: "prod" },
];

const workflowSampleLogs = [
  { time: "14:32:18.443", level: "ERROR", service: "workflow-engine", message: "Workflow #8821 REJECTED — policy_check=FAIL tenant=acme-corp budget_remaining=1200 quota_required=4200", exchange: "tenant-acme" },
  { time: "14:32:17.891", level: "WARN",  service: "workflow-engine", message: "Tenant acme-corp approaching monthly automation quota (82% used)", exchange: "tenant-acme" },
  { time: "14:32:15.220", level: "INFO",  service: "api-gateway", message: "Workflow #8821 submitted by user=u_8841 region=eu-west", exchange: "tenant-acme" },
  { time: "14:31:52.100", level: "ERROR", service: "workflow-engine", message: "Workflow #8818 REJECTED — policy_check=FAIL tenant=acme-corp", exchange: "tenant-acme" },
  { time: "14:31:40.003", level: "INFO",  service: "policy-service", message: "Quota recompute scheduled for tenant acme-corp", exchange: "" },
  { time: "14:30:11.800", level: "INFO",  service: "api-gateway", message: "Regional health OK — eu-west API latency 138ms", exchange: "tenant-acme" },
];

const podLogs = [
  { time: "14:38:22.100", level: "FATAL", service: "checkout-api", message: "java.lang.OutOfMemoryError: Java heap space — Container will be terminated" },
  { time: "14:38:21.880", level: "ERROR", service: "checkout-api", message: "GC overhead limit exceeded — heap usage 98% (503MB / 512MB limit)" },
  { time: "14:38:18.442", level: "ERROR", service: "checkout-api", message: "Cannot allocate memory for new CheckoutProcessor thread" },
  { time: "14:38:10.001", level: "WARN",  service: "checkout-api", message: "Heap usage at 89% — approaching OOM threshold" },
  { time: "14:32:07.553", level: "FATAL", service: "checkout-api", message: "java.lang.OutOfMemoryError: Java heap space (previous crash)" },
  { time: "14:31:55.200", level: "WARN",  service: "checkout-api", message: "Memory leak suspected in CheckoutProcessor.execute() — objects not GC'd" },
];

const apiLogs = [
  { time: "12:31:44", level: "ERROR", service: "billing-api", message: "DB Connection timeout after 5s — pool exhausted (20/20 connections active)" },
  { time: "12:31:43", level: "ERROR", service: "billing-api", message: "Invoice batch delayed — cannot acquire DB connection" },
  { time: "12:31:41", level: "ERROR", service: "invoice-worker", message: "Job #458903 delayed 120ms — awaiting idempotency lock" },
  { time: "12:31:38", level: "INFO",  service: "invoice-worker", message: "Job #458900 completed (98ms)" },
  { time: "12:31:35", level: "WARN",  service: "db-pool", message: "Connection pool at 95% capacity — consider increasing pool_size" },
  { time: "12:31:30", level: "INFO",  service: "edge-gateway", message: "API Response Time: 350ms (+45% above baseline 241ms)" },
];

// ── Pre-defined Chat Scenarios ────────────────────────────────
const QUERIES = [
  "Show CPU of prod-api-02 last 1 hour",
  "Why was workflow #8821 rejected?",
  "Why is checkout-api pod crashing?",
  "Show API latency for tenant acme today",
  "Why is billing-api returning 500 errors?",
  "Show job queue depth trend",
];

const RESPONSES = {
  "Show CPU of prod-api-02 last 1 hour": {
    type: "metrics",
    severity: "warning",
    summary: "CPU spike on prod-api-02 at 14:32 — correlates with scheduled ETL for multiple tenants.",
    insight:
      "NexIQ Production — workload on prod-api-02 driven mainly by tenant-batch-export and analytics-etl-scheduler. Peak CPU 94% at 14:32 during cross-tenant batch export window. Normalized after 14:38. Pattern repeats daily — consider staggering tenant jobs or moving heavy tenants to a dedicated node pool.",
    fix: "No immediate action if within SLO. If it recurs >3 days, reschedule batch to 16:30 UTC or split tenant batches.",
    chart: { type: "cpu", data: cpuData, title: "prod-api-02 — CPU Usage %", yLabel: "CPU %", threshold: 80, color: "#f59e0b" },
    instanceLabel: "prod-api-02",
    clientName: "NexIQ Production",
    applicationNames: ["tenant-batch-export", "analytics-etl-scheduler", "cross-tenant-export"],
    regionLabel: "Mumbai DC · nexiq-prod-le",
    sources: ["prometheus:node_cpu_seconds_total{instance='prod-api-02'}", "loki:{job='tenant-batch-export'}"],
  },
  "Why was workflow #8821 rejected?": {
    type: "logs",
    severity: "error",
    summary: "Workflow #8821 rejected — tenant acme-corp failed policy / quota check.",
    insight: "Tenant acme-corp: budget_remaining 1200 vs quota_required 4200 for this automation. Third rejection for this tenant in 2 hours — all policy/quota failures. Recommend notifying tenant admin to raise quota or split workflows.",
    fix: "Rejection is expected under policy. Notify tenant admin for acme-corp to adjust quota or reduce concurrent workflows.",
    logs: workflowSampleLogs,
    sources: ["elasticsearch:app-logs-* workflow_id=8821", "elasticsearch:app-logs-* tenant_id=acme-corp"],
  },
  "Why is checkout-api pod crashing?": {
    type: "combined",
    severity: "critical",
    summary: "checkout-api OOMKilled — Java heap exhausted. 14 restarts in 2 hours.",
    insight: "Container memory limit is 512Mi but heap usage peaks at ~503MB. OutOfMemoryError in CheckoutProcessor thread. Memory leak suspected — objects not being GC'd. Pattern started 09:15 during multi-tenant checkout traffic spike.",
    fix: "Immediate: kubectl set resources deploy/checkout-api --limits=memory=1Gi\nPermanent: Profile heap with JVM flags -Xmx768m -XX:+HeapDumpOnOutOfMemoryError",
    chart: { type: "bar", data: podRestartData, title: "Pod Restarts — Production Namespace", yLabel: "Restarts", color: "#ef4444" },
    logs: podLogs,
    sources: ["prometheus:kube_pod_container_status_restarts_total", "loki:{pod='checkout-api'}", "k8s:events"],
  },
  "Show API latency for tenant acme today": {
    type: "metrics",
    severity: "warning",
    summary: "P99 latency up to 372ms for tenant acme-corp — 26% above 30-day baseline for this tenant.",
    insight: "P50 stable at 130-150ms. P95 elevated 280-335ms. P99 spikes 370-400ms aligned with batch windows at 09:30, 10:30, 12:00, 13:30. Other tenants in the same region show normal P99 — points to tenant-specific traffic, not regional outage.",
    fix: "Within SLA for now. If P99 stays >400ms, scale checkout-api replicas for acme shard or review noisy-neighbor limits per tenant.",
    chart: { type: "latency", data: latencyData, title: "API latency percentiles — tenant acme (today)", yLabel: "Latency µs", color: "#3b82f6" },
    sources: ["prometheus:http_request_duration_seconds{tenant='acme-corp'}", "elasticsearch:app-logs-* tenant=acme-corp"],
  },
  "Why is billing-api returning 500 errors?": {
    type: "combined",
    severity: "critical",
    summary: "billing-api 500 errors — PostgreSQL connection pool exhausted. 23 errors/min.",
    insight: "DB pool at max (20/20) at 12:28. Requests time out after 5s → HTTP 500. Started during invoice run across several tenants. Response time rose from 241ms baseline to 350ms (+45%).",
    fix: "Immediate: kubectl rollout restart deploy/billing-api (releases stale connections)\nConfig: DATABASE_POOL_SIZE=50 in billing-api ConfigMap",
    chart: { type: "bar", data: podRestartData, title: "Service error rate", yLabel: "Errors/min", color: "#ef4444" },
    logs: apiLogs,
    sources: ["prometheus:http_requests_total{status=~'5..'}", "loki:{job='nginx'} |= '500'", "loki:{app='billing-api'} |= 'ERROR'"],
  },
  "Show job queue depth trend": {
    type: "metrics",
    severity: "critical",
    summary: "Async job queue RISING — avg depth 772, max 988. Threshold 1000 almost breached.",
    insight: "Depth growing over 5 days (avg 232 → 772). Max 988. Correlates with new tenants onboarded and higher background job volume. At current growth, breach expected within ~2 days without worker scale-up.",
    fix: "Scale worker deployment (e.g. notify-worker replicas 4 → 8).\nAlert if rolling avg depth > 850.",
    chart: { type: "queue", data: queueData, title: "Job queue depth (last 5 days)", yLabel: "Queued jobs", threshold: 1000, color: "#f59e0b" },
    sources: ["prometheus:job_queue_depth{queue='default'}"],
  },
};

// ── Level Colors ─────────────────────────────────────────────
const levelConfig = {
  FATAL: { bg: "bg-red-900/60", text: "text-red-300", border: "border-red-700", dot: "#ef4444" },
  ERROR: { bg: "bg-red-900/40", text: "text-red-400", border: "border-red-800", dot: "#f87171" },
  WARN:  { bg: "bg-yellow-900/30", text: "text-yellow-400", border: "border-yellow-800", dot: "#fbbf24" },
  INFO:  { bg: "bg-slate-800/40", text: "text-slate-400", border: "border-slate-700", dot: "#94a3b8" },
  DEBUG: { bg: "bg-slate-900/30", text: "text-slate-500", border: "border-slate-800", dot: "#64748b" },
};

const severityConfig = {
  critical: { icon: "🔴", label: "CRITICAL", color: "text-red-400", border: "border-red-500/40", bg: "bg-red-950/30" },
  error:    { icon: "🔴", label: "ERROR",    color: "text-red-400", border: "border-red-500/40", bg: "bg-red-950/30" },
  warning:  { icon: "🟡", label: "WARNING",  color: "text-yellow-400", border: "border-yellow-500/40", bg: "bg-yellow-950/20" },
  info:     { icon: "🟢", label: "OK",       color: "text-green-400", border: "border-green-500/40", bg: "bg-green-950/20" },
};

// ── Custom Tooltip ────────────────────────────────────────────
/** Tenant / workload context shown above charts when the backend attaches scope labels */
function QueryScopeStrip({ instanceLabel, clientName, applicationNames, regionLabel }) {
  const hasAny =
    instanceLabel ||
    clientName ||
    (applicationNames && applicationNames.length > 0) ||
    regionLabel;
  if (!hasAny) return null;

  return (
    <div
      className="rounded-lg border border-cyan-800/35 px-3 py-2.5 mb-3 text-xs font-mono"
      style={{ background: "rgba(8, 145, 178, 0.07)" }}
    >
      <div className="text-[10px] uppercase tracking-[0.14em] text-cyan-500/90 mb-2">Query scope · client & applications</div>
      <div className="flex flex-wrap gap-x-8 gap-y-2 text-[13px] leading-snug">
        {instanceLabel ? (
          <div className="min-w-0">
            <span className="text-gray-500 block text-[11px] mb-0.5">Instance</span>
            <span className="text-gray-100">{instanceLabel}</span>
          </div>
        ) : null}
        {clientName ? (
          <div className="min-w-0">
            <span className="text-gray-500 block text-[11px] mb-0.5">Client</span>
            <span className="text-gray-100">{clientName}</span>
          </div>
        ) : null}
        {applicationNames && applicationNames.length > 0 ? (
          <div className="min-w-0 flex-1 basis-[min(100%,14rem)]">
            <span className="text-gray-500 block text-[11px] mb-0.5">Applications / jobs</span>
            <span className="text-gray-100 break-words">{applicationNames.join(" · ")}</span>
          </div>
        ) : null}
        {regionLabel ? (
          <div className="min-w-0">
            <span className="text-gray-500 block text-[11px] mb-0.5">Region / cluster</span>
            <span className="text-gray-100">{regionLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const GrafanaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-gray-900 border border-gray-600 rounded px-3 py-2 shadow-xl text-xs font-mono">
      <div className="text-gray-400 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="flex gap-2">
          <span>{p.name}:</span>
          <span className="font-bold">{typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</span>
        </div>
      ))}
    </div>
  );
};

// ── Chart Renderer ────────────────────────────────────────────
function GrafanaChart({ chart }) {
  if (!chart) return null;

  const gridProps = { stroke: "#1e293b", strokeDasharray: "3 3" };
  const axisProps = { tick: { fill: "#64748b", fontSize: 10, fontFamily: "monospace" }, axisLine: { stroke: "#334155" } };

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-gray-700/60" style={{ background: "#0f172a" }}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-700/50" style={{ background: "#1e293b" }}>
        <span className="text-xs font-mono text-gray-300">{chart.title}</span>
        <div className="flex gap-2 text-xs text-gray-500 font-mono">
          <span>●  Live</span>
          <span className="text-gray-600">|</span>
          <span>Last 1h</span>
        </div>
      </div>
      <div className="p-3" style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          {chart.type === "cpu" ? (
            <AreaChart data={chart.data}>
              <defs>
                <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={chart.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={chart.color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="time" {...axisProps} interval={9} />
              <YAxis {...axisProps} domain={[0, 100]} unit="%" />
              <Tooltip content={<GrafanaTooltip />} />
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Threshold 80%", fill: "#ef4444", fontSize: 9, fontFamily: "monospace" }} />
              <Area type="monotone" dataKey="value" stroke={chart.color} strokeWidth={1.5} fill="url(#cpuGrad)" name="CPU %" dot={false} />
            </AreaChart>
          ) : chart.type === "latency" ? (
            <LineChart data={chart.data}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="time" {...axisProps} interval={7} />
              <YAxis {...axisProps} />
              <Tooltip content={<GrafanaTooltip />} />
              <ReferenceLine y={350} stroke="#ef4444" strokeDasharray="4 4" />
              <Line type="monotone" dataKey="p50" stroke="#22c55e" strokeWidth={1.5} dot={false} name="P50" />
              <Line type="monotone" dataKey="p95" stroke="#f59e0b" strokeWidth={1.5} dot={false} name="P95" />
              <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={2} dot={false} name="P99" />
            </LineChart>
          ) : chart.type === "queue" ? (
            <AreaChart data={chart.data}>
              <defs>
                <linearGradient id="queueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="time" {...axisProps} />
              <YAxis {...axisProps} />
              <Tooltip content={<GrafanaTooltip />} />
              <ReferenceLine y={1000} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Threshold 1000", fill: "#ef4444", fontSize: 9, fontFamily: "monospace" }} />
              <Area type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={1} fill="url(#maxGrad)" name="Max" dot={false} />
              <Area type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2} fill="url(#queueGrad)" name="Avg" dot={false} />
            </AreaChart>
          ) : (
            <BarChart data={chart.data} layout="vertical">
              <CartesianGrid {...gridProps} horizontal={false} />
              <XAxis type="number" {...axisProps} />
              <YAxis type="category" dataKey="pod" {...axisProps} width={110} />
              <Tooltip content={<GrafanaTooltip />} />
              <Bar dataKey="restarts" fill="#ef4444" name="Restarts" radius={[0, 3, 3, 0]}
                label={{ position: "right", fill: "#94a3b8", fontSize: 10, fontFamily: "monospace" }} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <div className="flex gap-4 px-4 pb-3 text-xs font-mono text-gray-500">
        {chart.type === "latency" && (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-green-500 inline-block" /> P50</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 inline-block" /> P95</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> P99</span>
          </>
        )}
        {chart.type === "queue" && (
          <>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-yellow-500 inline-block" /> Avg Queue</span>
            <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-red-500 inline-block" /> Max Queue</span>
            <span className="flex items-center gap-1"><span className="w-3 h-1 border-t-2 border-dashed border-red-500 inline-block" /> Threshold</span>
          </>
        )}
      </div>
    </div>
  );
}

// ── Datadog-style Log Viewer ──────────────────────────────────
function LogViewer({ logs, title = "Log Results" }) {
  const [filter, setFilter] = useState("");
  const [levelFilter, setLevelFilter] = useState("ALL");

  const filtered = logs.filter(l => {
    const matchText = filter === "" || l.message.toLowerCase().includes(filter.toLowerCase()) || l.service.includes(filter);
    const matchLevel = levelFilter === "ALL" || l.level === levelFilter;
    return matchText && matchLevel;
  });

  const levels = ["ALL", ...new Set(logs.map(l => l.level))];

  return (
    <div className="mt-3 rounded-lg overflow-hidden border border-gray-700/60 text-xs font-mono" style={{ background: "#0a0f1e" }}>
      {/* Datadog-style header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-700/50" style={{ background: "#111827" }}>
        <div className="flex items-center gap-2">
          <span className="text-gray-400">{title}</span>
          <span className="px-1.5 py-0.5 rounded text-gray-500 border border-gray-700" style={{ background: "#1f2937" }}>
            {filtered.length} events
          </span>
        </div>
        <div className="flex gap-2">
          {levels.map(l => (
            <button key={l} onClick={() => setLevelFilter(l)}
              className={`px-2 py-0.5 rounded border text-xs transition-all ${levelFilter === l ? "border-blue-500 text-blue-400 bg-blue-950/30" : "border-gray-700 text-gray-500 hover:border-gray-500"}`}>
              {l}
            </button>
          ))}
        </div>
      </div>
      {/* Search bar */}
      <div className="px-3 py-2 border-b border-gray-800/50" style={{ background: "#0f172a" }}>
        <input value={filter} onChange={e => setFilter(e.target.value)}
          placeholder="Filter logs..." className="w-full bg-transparent text-gray-300 placeholder-gray-600 outline-none text-xs" />
      </div>
      {/* Column headers */}
      <div className="grid gap-2 px-3 py-1.5 border-b border-gray-800/50 text-gray-600 text-xs"
        style={{ gridTemplateColumns: "90px 60px 110px 1fr", background: "#0d1520" }}>
        <span>TIMESTAMP</span>
        <span>LEVEL</span>
        <span>SERVICE</span>
        <span>MESSAGE</span>
      </div>
      {/* Log rows */}
      <div className="max-h-56 overflow-y-auto">
        {filtered.map((log, i) => {
          const cfg = levelConfig[log.level] || levelConfig.INFO;
          return (
            <div key={i}
              className={`grid gap-2 px-3 py-1.5 border-b border-gray-800/30 hover:bg-gray-800/20 transition-colors ${i === 0 && log.level === "FATAL" ? "bg-red-950/20" : ""}`}
              style={{ gridTemplateColumns: "90px 60px 110px 1fr" }}>
              <span className="text-gray-500 shrink-0">{log.time}</span>
              <span className={`font-bold ${cfg.text} flex items-center gap-1 shrink-0`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: cfg.dot }} />
                {log.level}
              </span>
              <span className="text-blue-400 shrink-0 truncate">{log.service}</span>
              <span className={`${log.level === "ERROR" || log.level === "FATAL" ? "text-red-300" : log.level === "WARN" ? "text-yellow-300" : "text-gray-300"} break-all`}>
                {log.message}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── AI Message Bubble ─────────────────────────────────────────
function AIMessage({ response, query }) {
  const sev = severityConfig[response.severity] || severityConfig.info;

  return (
    <div className="flex gap-3 mb-6">
      {/* Avatar */}
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 border border-cyan-500/30"
        style={{ background: "linear-gradient(135deg, #0891b2, #1e40af)" }}>
        <span className="text-xs font-bold text-white">AI</span>
      </div>

      <div className="flex-1 min-w-0">
        {/* Severity badge */}
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border mb-3 ${sev.border} ${sev.bg}`}>
          <span className="text-base leading-none">{sev.icon}</span>
          <span className={`text-xs font-bold font-mono tracking-widest ${sev.color}`}>{sev.label}</span>
          <span className="text-gray-400 text-xs">—</span>
          <span className="text-gray-300 text-xs">{response.summary}</span>
        </div>

        <QueryScopeStrip
          instanceLabel={response.instanceLabel}
          clientName={response.clientName}
          applicationNames={response.applicationNames}
          regionLabel={response.regionLabel}
        />

        {/* Chart */}
        {response.chart && <GrafanaChart chart={response.chart} />}

        {/* Logs */}
        {response.logs && <LogViewer logs={response.logs} title="Journal / Application Logs" />}

        {/* Analysis section */}
        <div className="analysis-panel mt-3 rounded-lg border border-gray-700/40 overflow-hidden">
          <div className="analysis-panel-header px-4 py-2 border-b border-gray-700/40 text-xs text-gray-500 font-mono flex items-center gap-2"
            style={{ background: "#111827" }}>
            <span className="text-cyan-500">◈</span> AI Root Cause Analysis
          </div>
          <div className="analysis-panel-body px-4 py-3 text-sm text-gray-300 leading-relaxed" style={{ background: "#0d1a2a" }}>
            {response.insight}
          </div>
        </div>

        {/* Fix */}
        <div className="fix-panel mt-2 rounded-lg border border-green-800/40 overflow-hidden">
          <div className="fix-panel-header px-4 py-2 border-b border-green-800/40 text-xs text-green-500 font-mono flex items-center gap-2"
            style={{ background: "#0a1f0a" }}>
            <span>⚡</span> Recommended Action
          </div>
          <pre className="fix-panel-body px-4 py-3 text-xs text-green-300 font-mono whitespace-pre-wrap leading-relaxed" style={{ background: "#071407" }}>
            {response.fix}
          </pre>
        </div>

        {/* Sources */}
        <div className="mt-2 flex flex-wrap gap-2">
          {response.sources.map((s, i) => (
            <span key={i} className="px-2 py-0.5 rounded text-xs font-mono text-gray-500 border border-gray-700/50"
              style={{ background: "#0f172a" }}>
              📎 {s}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Typing Indicator ──────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4">
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border border-cyan-500/30"
        style={{ background: "linear-gradient(135deg, #0891b2, #1e40af)" }}>
        <span className="text-xs font-bold text-white">AI</span>
      </div>
      <div className="flex items-center gap-3 px-4 py-3 rounded-lg border border-gray-700/40" style={{ background: "#111827" }}>
        <div className="flex gap-1.5">
          {[0, 1, 2].map(i => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-cyan-400"
              style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
          ))}
        </div>
        <span className="text-xs text-gray-400 font-mono">
          Querying Prometheus + Elasticsearch + Loki...
        </span>
      </div>
    </div>
  );
}

// ── Main App ──────────────────────────────────────────────────
export default function ObservabilityChat() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("chat");
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendQuery = async (query) => {
    if (!query.trim() || loading) return;
    const q = query.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: q }]);
    setLoading(true);

    await new Promise(r => setTimeout(r, 1400));

    const keys = Object.keys(RESPONSES);
    let key =
      keys.find((k) => k === q) ||
      keys.find((k) => k.toLowerCase() === q.toLowerCase()) ||
      keys.find((k) => q.toLowerCase().includes(k.toLowerCase().slice(0, 24)));
    if (!key) key = keys[Math.floor(Math.random() * keys.length)];

    setLoading(false);
    setMessages(prev => [...prev, { role: "ai", response: RESPONSES[key], query: q }]);
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendQuery(input); }
  };

  return (
    <div className="flex h-screen text-gray-100" style={{ background: "#060d18", fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
      <style>{`
        @keyframes bounce { 0%, 80%, 100% { transform: translateY(0); } 40% { transform: translateY(-6px); } }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: #0f172a; }
        ::-webkit-scrollbar-thumb { background: #334155; border-radius: 2px; }
        .query-btn:hover { background: #1e3a5f !important; border-color: #3b82f6 !important; color: #93c5fd !important; }
      `}</style>

      {/* Sidebar */}
      <div className="w-56 shrink-0 flex flex-col border-r border-gray-800/60" style={{ background: "#070e1c" }}>
        {/* Logo */}
        <div className="px-4 py-4 border-b border-gray-800/60">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded flex items-center justify-center text-sm"
              style={{ background: "linear-gradient(135deg, #0891b2, #1e40af)" }}>👁</div>
            <div>
              <div className="text-sm font-bold text-white tracking-tight">NexIQ AI</div>
              <div className="text-xs text-gray-500">Observability Chat</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <div className="px-2 py-3 space-y-0.5">
          {[
            { id: "chat", icon: "💬", label: "Ask AI" },
            { id: "metrics", icon: "📈", label: "Metrics" },
            { id: "logs", icon: "📋", label: "Logs" },
            { id: "alerts", icon: "🔔", label: "Alerts" },
          ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all text-left ${activeTab === item.id ? "text-white border border-cyan-500/30" : "text-gray-500 hover:text-gray-300"}`}
              style={activeTab === item.id ? { background: "#0c1f3a" } : {}}>
              <span>{item.icon}</span> {item.label}
            </button>
          ))}
        </div>

        {/* Quick queries */}
        <div className="px-3 py-2 border-t border-gray-800/60 mt-auto mb-0">
          <div className="text-xs text-gray-600 mb-2 uppercase tracking-wider">Quick Queries</div>
          <div className="space-y-1">
            {QUERIES.slice(0, 4).map((q, i) => (
              <button key={i} onClick={() => sendQuery(q)}
                className="query-btn w-full text-left px-2.5 py-1.5 rounded text-xs text-gray-500 border border-gray-800/60 transition-all leading-snug"
                style={{ background: "#0a1422" }}>
                {q}
              </button>
            ))}
          </div>
        </div>

        {/* Status */}
        <div className="px-3 py-3 border-t border-gray-800/60">
          <div className="flex items-center gap-2 text-xs">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-gray-500">All agents online</span>
          </div>
          <div className="mt-1.5 space-y-0.5">
            {["Prometheus", "Loki", "Elasticsearch"].map(s => (
              <div key={s} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">{s}</span>
                <span className="text-green-500">●</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-6 py-3 border-b border-gray-800/60 flex items-center justify-between shrink-0"
          style={{ background: "#070e1c" }}>
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-white">Infrastructure Intelligence Chat</span>
            <span className="px-2 py-0.5 rounded text-xs border border-cyan-500/30 text-cyan-400"
              style={{ background: "#0c2a35" }}>LangGraph + RAG</span>
          </div>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              NexIQ Production
            </span>
            <span className="text-gray-600">K8s: nexiq-prod-le</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-6 opacity-60">
              <div className="w-14 h-14 rounded-full flex items-center justify-center text-2xl border border-cyan-500/30"
                style={{ background: "linear-gradient(135deg, #0c2a35, #0c1f3a)" }}>👁</div>
              <div>
                <div className="text-xl font-bold text-white mb-1">Ask your infrastructure anything</div>
                <div className="text-sm text-gray-500">Real data • Zero hallucination • Grafana metrics + Datadog logs</div>
              </div>
              <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
                {QUERIES.map((q, i) => (
                  <button key={i} onClick={() => sendQuery(q)}
                    className="query-btn px-3 py-2 rounded-lg text-xs text-left text-gray-400 border border-gray-700/50 transition-all"
                    style={{ background: "#0a1422" }}>
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            msg.role === "user" ? (
              <div key={i} className="flex justify-end mb-4">
                <div className="max-w-md px-4 py-2.5 rounded-xl text-sm border border-blue-500/20"
                  style={{ background: "#0c1f3a", color: "#93c5fd" }}>
                  {msg.text}
                </div>
              </div>
            ) : (
              <AIMessage key={i} response={msg.response} query={msg.query} />
            )
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-6 py-4 border-t border-gray-800/60 shrink-0" style={{ background: "#070e1c" }}>
          <div className="flex gap-3 items-end">
            <div className="flex-1 rounded-xl border border-gray-700/60 overflow-hidden"
              style={{ background: "#0d1a2a" }}>
              <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKey}
                placeholder="Ask about pods, metrics, tenants, queues, logs, latency… (Enter to send)"
                rows={2}
                className="w-full px-4 py-3 bg-transparent text-sm text-gray-200 placeholder-gray-600 resize-none outline-none leading-relaxed" />
              <div className="flex items-center justify-between px-4 py-2 border-t border-gray-800/40">
                <div className="flex gap-2 text-xs text-gray-600">
                  <span>Prom</span><span>•</span><span>ES</span><span>•</span><span>Loki</span><span>•</span><span>K8s API</span>
                </div>
                <span className="text-xs text-gray-600">↵ Send</span>
              </div>
            </div>
            <button onClick={() => sendQuery(input)} disabled={loading || !input.trim()}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-30"
              style={{ background: loading ? "#1e3a5f" : "linear-gradient(135deg, #0891b2, #1e40af)" }}>
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
