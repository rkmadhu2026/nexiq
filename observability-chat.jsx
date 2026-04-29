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

/** Warm-dark surfaces — aligned with dashboard bronze/slate; sidebar slightly recessed vs main */
const VD = {
  canvas: "#12110f",
  surface: "#181613",
  surfaceElevated: "#1f1d19",
  surfaceInset: "#141311",
  chartBg: "#1f1d19",
  chartHeader: "#25221e",
  gridStroke: "rgba(230, 218, 200, 0.07)",
  axisTick: "#9c9488",
  axisLine: "rgba(230, 218, 200, 0.12)",
  logsBg: "#161513",
  logsHeader: "#1f1c18",
  logsMeta: "#25211d",
  logsSearch: "#1c1a16",
  logsCol: "#181613",
  analysisBody: "#1e1b17",
  fixGreenBg: "#121a14",
  fixGreenHeader: "#152818",
  scrollbarTrack: "#1c1a16",
  scrollbarThumb: "rgba(200, 190, 175, 0.22)",
  navActive: "#252219",
  quickBtn: "#1c1a16",
  badgeBg: "rgba(155, 106, 52, 0.12)",
  userBubble: "#242018",
  userText: "#e8e0d4",
  borderHairline: "rgba(230, 218, 200, 0.085)",
  borderPanel: "rgba(230, 218, 200, 0.13)",
  panelShadow: "0 1px 0 rgba(255, 255, 255, 0.04), 0 14px 40px rgba(0, 0, 0, 0.38)",
  tooltipShadow: "0 12px 28px rgba(0, 0, 0, 0.55)",
  accentGrad: "linear-gradient(155deg, #ae8a58 0%, #806847 48%, #5e4a32 100%)",
};

const UI_FONT = `var(--font-body, "DM Sans", ui-sans-serif, system-ui, sans-serif)`;
const MONO_FONT = `var(--font-mono, ui-monospace, monospace)`;

/** Left rail — professional labels (no emoji); abbrev matches dense ops UIs */
const SIDEBAR_NAV = [
  { id: "chat", abbr: "AI", label: "Ask AI" },
  { id: "metrics", abbr: "Mx", label: "Metrics" },
  { id: "logs", abbr: "Lo", label: "Logs" },
  { id: "alerts", abbr: "Al", label: "Alerts" },
];

// ── Level Colors ─────────────────────────────────────────────
const levelConfig = {
  FATAL: { text: "text-red-200", dot: "#fb7185" },
  ERROR: { text: "text-red-300/95", dot: "#f87171" },
  WARN: { text: "text-amber-200/90", dot: "#e8b84d" },
  INFO: { text: "text-stone-400", dot: "#a8a095" },
  DEBUG: { text: "text-stone-500", dot: "#7d766c" },
};

const severityConfig = {
  critical: { label: "CRITICAL", dot: "#ef5f52", color: "text-red-200/95", border: "border-red-500/30", bg: "bg-red-950/30" },
  error: { label: "ERROR", dot: "#f87171", color: "text-red-200/90", border: "border-red-500/25", bg: "bg-red-950/25" },
  warning: { label: "WARNING", dot: "#d4a934", color: "text-amber-100/90", border: "border-amber-500/22", bg: "bg-amber-950/18" },
  info: { label: "INFO", dot: "#6ee7b7", color: "text-emerald-200/85", border: "border-emerald-500/22", bg: "bg-emerald-950/18" },
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
      className="rounded-lg px-3 py-3 mb-3 text-xs border"
      style={{
        fontFamily: MONO_FONT,
        background: "rgba(174, 138, 88, 0.06)",
        borderColor: VD.borderPanel,
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      <div
        className="text-[10px] uppercase mb-2 font-medium"
        style={{ letterSpacing: "0.1em", color: "#8a8278" }}
      >
        Query scope · client & applications
      </div>
      <div className="flex flex-wrap gap-x-10 gap-y-3 text-[12px] leading-snug">
        {instanceLabel ? (
          <div className="min-w-0">
            <span className="text-[11px] block mb-1" style={{ color: "#7d766c" }}>
              Instance
            </span>
            <span className="text-stone-200">{instanceLabel}</span>
          </div>
        ) : null}
        {clientName ? (
          <div className="min-w-0">
            <span className="text-[11px] block mb-1" style={{ color: "#7d766c" }}>
              Client
            </span>
            <span className="text-stone-200">{clientName}</span>
          </div>
        ) : null}
        {applicationNames && applicationNames.length > 0 ? (
          <div className="min-w-0 flex-1 basis-[min(100%,14rem)]">
            <span className="text-[11px] block mb-1" style={{ color: "#7d766c" }}>
              Applications / jobs
            </span>
            <span className="text-stone-200 break-words">{applicationNames.join(" · ")}</span>
          </div>
        ) : null}
        {regionLabel ? (
          <div className="min-w-0">
            <span className="text-[11px] block mb-1" style={{ color: "#7d766c" }}>
              Region / cluster
            </span>
            <span className="text-stone-200">{regionLabel}</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

const GrafanaTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="rounded-md px-3 py-2 text-[11px] border"
      style={{
        fontFamily: MONO_FONT,
        background: VD.chartBg,
        borderColor: VD.borderPanel,
        boxShadow: VD.tooltipShadow,
      }}
    >
      <div className="mb-1.5" style={{ color: "#8a8278" }}>
        {label}
      </div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }} className="flex gap-2 tabular-nums">
          <span style={{ color: "#9c9488" }}>{p.name}:</span>
          <span className="font-medium">
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// ── Chart Renderer ────────────────────────────────────────────
function GrafanaChart({ chart }) {
  if (!chart) return null;

  const gridProps = { stroke: VD.gridStroke, strokeDasharray: "3 3" };
  const axisProps = {
    tick: { fill: VD.axisTick, fontSize: 10, fontFamily: MONO_FONT },
    axisLine: { stroke: VD.axisLine },
  };

  return (
    <div
      className="mt-4 rounded-lg overflow-hidden border"
      style={{ background: VD.chartBg, borderColor: VD.borderPanel, boxShadow: VD.panelShadow }}
    >
      <div
        className="flex items-center justify-between px-4 py-2.5 border-b"
        style={{ background: VD.chartHeader, borderColor: VD.borderHairline }}
      >
        <span
          className="text-[11px] text-stone-300 font-medium tabular-nums"
          style={{ fontFamily: MONO_FONT, letterSpacing: "0.02em" }}
        >
          {chart.title}
        </span>
        <div
          className="flex gap-3 text-[10px] tabular-nums"
          style={{ fontFamily: MONO_FONT, color: "#7d766c" }}
        >
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400/80 motion-safe:animate-pulse" />
            Live
          </span>
          <span style={{ color: "rgba(125,118,108,0.45)" }} aria-hidden>
            |
          </span>
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
              <ReferenceLine y={80} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Threshold 80%", fill: "#c87a74", fontSize: 9, fontFamily: MONO_FONT }} />
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
              <ReferenceLine y={1000} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "Threshold 1000", fill: "#c87a74", fontSize: 9, fontFamily: MONO_FONT }} />
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
                label={{ position: "right", fill: VD.axisTick, fontSize: 10, fontFamily: MONO_FONT }} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <div
        className="flex flex-wrap gap-x-6 gap-y-2 px-4 pb-3 pt-1 text-[10px] tabular-nums"
        style={{ fontFamily: MONO_FONT, color: "#7d766c" }}
      >
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
    <div
      className="mt-4 rounded-lg overflow-hidden border text-[11px] leading-snug"
      style={{ fontFamily: MONO_FONT, background: VD.logsBg, borderColor: VD.borderPanel, boxShadow: VD.panelShadow }}
    >
      {/* Header */}
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 border-b"
        style={{ background: VD.logsHeader, borderColor: VD.borderHairline }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-stone-400 font-medium truncate">{title}</span>
          <span
            className="px-2 py-0.5 rounded border shrink-0 tabular-nums"
            style={{ color: "#8a8278", borderColor: VD.borderHairline, background: VD.logsMeta }}
          >
            {filtered.length} events
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {levels.map((l) => (
            <button
              key={l}
              type="button"
              onClick={() => setLevelFilter(l)}
              className={`px-2 py-1 rounded border text-[10px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/50 ${
                levelFilter === l
                  ? "text-stone-100"
                  : "text-stone-500 hover:text-stone-300"
              }`}
              style={{
                borderColor: levelFilter === l ? "rgba(174, 138, 88, 0.45)" : VD.borderHairline,
                background: levelFilter === l ? "rgba(174, 138, 88, 0.12)" : "transparent",
              }}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
      {/* Search */}
      <div className="px-3 py-2 border-b" style={{ background: VD.logsSearch, borderColor: VD.borderHairline }}>
        <input
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter logs..."
          aria-label="Filter log events"
          className="w-full bg-transparent text-stone-300 placeholder-stone-600 outline-none text-[11px] py-0.5"
          style={{ fontFamily: MONO_FONT }}
        />
      </div>
      {/* Column headers */}
      <div
        className="grid gap-2 px-3 py-2 border-b text-[10px] font-medium uppercase"
        style={{
          gridTemplateColumns: "90px 60px 110px 1fr",
          background: VD.logsCol,
          borderColor: VD.borderHairline,
          color: "#6f665c",
          letterSpacing: "0.06em",
        }}
      >
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
            <div
              key={i}
              className={`grid gap-2 px-3 py-2 border-b border-stone-800/30 hover:bg-white/[0.02] transition-colors ${i === 0 && log.level === "FATAL" ? "bg-red-950/15" : ""}`}
              style={{ gridTemplateColumns: "90px 60px 110px 1fr" }}
            >
              <span className="text-stone-500 shrink-0 tabular-nums">{log.time}</span>
              <span className={`${cfg.text} flex items-center gap-1.5 shrink-0 font-semibold`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-white/10" style={{ background: cfg.dot }} />
                {log.level}
              </span>
              <span className="text-amber-100/75 shrink-0 truncate">{log.service}</span>
              <span
                className={`${
                  log.level === "ERROR" || log.level === "FATAL"
                    ? "text-red-200/95"
                    : log.level === "WARN"
                      ? "text-amber-100/90"
                      : "text-stone-300"
                } break-all`}
              >
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
function AIMessage({ response }) {
  const sev = severityConfig[response.severity] || severityConfig.info;

  return (
    <div className="flex gap-4 mb-8">
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border"
        style={{ background: VD.accentGrad, borderColor: "rgba(174, 138, 88, 0.35)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)" }}
      >
        <span className="text-[10px] font-bold text-white tracking-wide" style={{ fontFamily: MONO_FONT }}>
          AI
        </span>
      </div>

      <div className="flex-1 min-w-0 space-y-3">
        {/* Severity + summary */}
        <div
          role="status"
          className={`flex flex-wrap items-start gap-x-3 gap-y-2 px-3 py-2.5 rounded-lg border ${sev.border} ${sev.bg}`}
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.03)" }}
        >
          <span className="inline-flex items-center gap-2 shrink-0">
            <span className="h-2 w-2 rounded-full ring-1 ring-white/15 shrink-0" style={{ background: sev.dot }} aria-hidden />
            <span
              className={`text-[10px] font-semibold tracking-[0.1em] uppercase ${sev.color}`}
              style={{ fontFamily: MONO_FONT }}
            >
              {sev.label}
            </span>
          </span>
          <span className="text-stone-500 hidden sm:inline" aria-hidden>
            —
          </span>
          <p className="text-[13px] leading-relaxed text-stone-300 min-w-0 flex-1 basis-[12rem] m-0">{response.summary}</p>
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

        {/* Analysis */}
        <div
          className="mt-1 rounded-lg border overflow-hidden"
          style={{ borderColor: VD.borderPanel, boxShadow: VD.panelShadow }}
        >
          <div
            className="px-4 py-2.5 border-b flex items-center gap-2 text-[10px] font-medium uppercase"
            style={{
              fontFamily: MONO_FONT,
              background: VD.logsHeader,
              borderColor: VD.borderHairline,
              color: "#8a8278",
              letterSpacing: "0.08em",
            }}
          >
            <span className="h-3 w-px rounded-full bg-amber-600/50" aria-hidden />
            AI Root Cause Analysis
          </div>
          <div className="px-4 py-3 text-[13px] text-stone-300 leading-relaxed" style={{ background: VD.analysisBody }}>
            {response.insight}
          </div>
        </div>

        {/* Fix */}
        <div className="mt-1 rounded-lg border border-emerald-800/25 overflow-hidden" style={{ boxShadow: VD.panelShadow }}>
          <div
            className="px-4 py-2.5 border-b border-emerald-800/25 text-[10px] font-medium uppercase flex items-center gap-2"
            style={{
              fontFamily: MONO_FONT,
              background: VD.fixGreenHeader,
              color: "#6ee7a0",
              letterSpacing: "0.08em",
            }}
          >
            <span className="h-3 w-px rounded-full bg-emerald-400/60" aria-hidden />
            Recommended Action
          </div>
          <pre
            className="px-4 py-3 text-[11px] text-emerald-100/95 whitespace-pre-wrap leading-relaxed m-0 border-t border-emerald-900/20"
            style={{ fontFamily: MONO_FONT, background: VD.fixGreenBg }}
          >
            {response.fix}
          </pre>
        </div>

        {/* Sources */}
        <div className="mt-2 flex flex-wrap gap-2">
          {response.sources.map((s, i) => (
            <span
              key={i}
              className="px-2 py-1 rounded border text-[10px] text-stone-500"
              style={{ fontFamily: MONO_FONT, background: VD.chartBg, borderColor: VD.borderHairline }}
            >
              <span className="text-stone-600" aria-hidden>
                #
              </span>{" "}
              {s}
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
    <div className="flex gap-4 mb-4" role="status" aria-live="polite" aria-busy="true">
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
        style={{ background: VD.accentGrad, borderColor: "rgba(174, 138, 88, 0.35)" }}
      >
        <span className="text-[10px] font-bold text-white tracking-wide" style={{ fontFamily: MONO_FONT }}>
          AI
        </span>
      </div>
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-lg border"
        style={{ background: VD.logsHeader, borderColor: VD.borderPanel }}
      >
        <div className="flex gap-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="oc-typing-dot w-1.5 h-1.5 rounded-full bg-amber-500/85"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
        <span className="text-[11px] text-stone-500" style={{ fontFamily: MONO_FONT }}>
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
    const el = bottomRef.current;
    if (!el) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "end" });
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
    <div
      className="flex min-h-0 w-full flex-1 flex-row text-stone-200"
      style={{ background: VD.canvas, fontFamily: UI_FONT }}
    >
      <style>{`
        @keyframes oc-bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
        @media (prefers-reduced-motion: no-preference) {
          .oc-typing-dot {
            animation: oc-bounce 1.1s ease-in-out infinite;
          }
        }
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: ${VD.scrollbarTrack}; }
        ::-webkit-scrollbar-thumb { background: ${VD.scrollbarThumb}; border-radius: 3px; }
        .query-btn:hover {
          background: rgba(42, 38, 32, 0.95) !important;
          border-color: rgba(174, 138, 88, 0.45) !important;
          color: #e8e0d4 !important;
        }
        .query-btn:focus-visible {
          outline: 2px solid rgba(174, 138, 88, 0.45);
          outline-offset: 2px;
        }
      `}</style>

      {/* Sidebar — recessed chrome; avoids repeating outer “Observability Chat” title */}
      <aside
        className="flex w-[17rem] shrink-0 flex-col border-r"
        style={{ background: VD.surfaceInset, borderColor: VD.borderHairline }}
        aria-label="Observe navigation"
      >
        <div className="border-b px-3 pb-4 pt-4" style={{ borderColor: VD.borderHairline }}>
          <div className="flex items-start gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[11px] font-bold tracking-tight text-white"
              style={{
                fontFamily: MONO_FONT,
                background: VD.accentGrad,
                borderColor: "rgba(174, 138, 88, 0.35)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
              aria-hidden
            >
              NQ
            </div>
            <div className="min-w-0 pt-0.5">
              <p
                className="m-0 text-[10px] font-semibold uppercase tracking-[0.12em]"
                style={{ color: "#7d7469" }}
              >
                Module
              </p>
              <h2
                className="m-0 mt-1 text-[15px] font-semibold leading-tight tracking-tight text-stone-100"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Observe
              </h2>
              <p className="m-0 mt-1 text-[11px] leading-snug text-stone-500">
                Tenant-aware · cited queries
              </p>
            </div>
          </div>
        </div>

        <nav className="space-y-1 px-2 py-3" aria-label="Primary">
          {SIDEBAR_NAV.map((item) => {
            const on = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-[12px] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/50 ${
                  on ? "border text-stone-100" : "border-transparent text-stone-500 hover:border-transparent hover:text-stone-300"
                }`}
                style={
                  on
                    ? { background: VD.navActive, borderColor: "rgba(174, 138, 88, 0.28)" }
                    : {}
                }
              >
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border text-[10px] font-bold tracking-tight"
                  style={{
                    fontFamily: MONO_FONT,
                    borderColor: on ? "rgba(174, 138, 88, 0.42)" : VD.borderHairline,
                    background: on ? "rgba(174, 138, 88, 0.14)" : VD.canvas,
                    color: on ? "#f4ebe3" : "#92897e",
                  }}
                  aria-hidden
                >
                  {item.abbr}
                </span>
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t px-3 py-3" style={{ borderColor: VD.borderHairline }}>
          <div
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#6f665c" }}
          >
            Quick queries
          </div>
          <div className="space-y-1.5 rounded-lg border px-2 py-2.5" style={{ borderColor: VD.borderHairline, background: VD.canvas }}>
            {QUERIES.slice(0, 4).map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendQuery(q)}
                className="query-btn w-full rounded-md border px-2.5 py-2 text-left text-[11px] leading-snug text-stone-500 transition-colors"
                style={{ background: VD.quickBtn, borderColor: VD.borderHairline, fontFamily: MONO_FONT }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t px-3 py-3" style={{ borderColor: VD.borderHairline }}>
          <div
            className="mb-2 text-[10px] font-semibold uppercase tracking-[0.12em]"
            style={{ color: "#6f665c" }}
          >
            Data plane
          </div>
          <div className="mb-2 flex items-center gap-2 text-[11px] text-stone-500">
            <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 motion-safe:animate-pulse" aria-hidden />
            Agents reachable
          </div>
          <div className="space-y-1.5">
            {["Prometheus", "Loki", "Elasticsearch"].map((s) => (
              <div key={s} className="flex items-center justify-between text-[11px]" style={{ fontFamily: MONO_FONT }}>
                <span className="text-stone-500">{s}</span>
                <span className="text-[10px] text-emerald-400/90" aria-hidden>
                  ●
                </span>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0">
        {/* Header */}
        <header
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
          style={{
            background: VD.surface,
            borderColor: VD.borderHairline,
            boxShadow: "inset 0 -1px 0 rgba(255,255,255,0.03)",
          }}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className="shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{
                fontFamily: MONO_FONT,
                background: VD.badgeBg,
                borderColor: "rgba(174, 138, 88, 0.28)",
                color: "#d4c4a8",
              }}
            >
              LangGraph · RAG
            </span>
            <span className="hidden h-4 w-px shrink-0 bg-stone-700 sm:block" aria-hidden />
            <p className="m-0 max-w-[28rem] text-[12px] leading-snug text-stone-500">
              Charts, logs, and scoped answers — sources attached to each reply
            </p>
          </div>
          <div
            className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 text-[11px]"
            style={{ fontFamily: MONO_FONT, color: "#8a8278" }}
          >
            <span className="flex items-center gap-2 text-stone-400">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500/90" aria-hidden />
              NexIQ Production
            </span>
            <span className="text-stone-500">nexiq-prod-le</span>
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-6" role="log" aria-live="polite" aria-relevant="additions">
          {messages.length === 0 && (
            <div className="flex min-h-[18rem] flex-col items-center justify-center gap-8 px-4 py-10 text-center">
              <div
                className="flex h-16 w-16 items-center justify-center rounded-2xl border text-[13px] font-bold tracking-tight text-white"
                style={{
                  fontFamily: MONO_FONT,
                  background: "linear-gradient(155deg, #2a2720, #1c1a16)",
                  borderColor: "rgba(174, 138, 88, 0.28)",
                  boxShadow: VD.panelShadow,
                }}
                aria-hidden
              >
                NQ
              </div>
              <div className="max-w-md">
                <h2 className="mb-2 m-0 text-[1.35rem] font-semibold tracking-tight text-stone-100" style={{ fontFamily: "var(--font-display)" }}>
                  Ask your infrastructure anything
                </h2>
                <p className="m-0 text-[13px] leading-relaxed text-stone-500">
                  Metrics, logs, and charts grounded in Prometheus / Loki / Elasticsearch for your tenant scope.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2.5 max-w-lg w-full">
                {QUERIES.map((q, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => sendQuery(q)}
                    className="query-btn px-3 py-2.5 rounded-lg text-[11px] text-left text-stone-400 border transition-colors leading-snug"
                    style={{ background: VD.quickBtn, borderColor: VD.borderHairline, fontFamily: MONO_FONT }}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            msg.role === "user" ? (
              <div key={i} className="flex justify-end mb-5">
                <div
                  className="max-w-md px-4 py-3 rounded-xl text-[13px] leading-relaxed border"
                  style={{
                    background: VD.userBubble,
                    color: VD.userText,
                    borderColor: "rgba(174, 138, 88, 0.2)",
                    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
                  }}
                >
                  {msg.text}
                </div>
              </div>
            ) : (
              <AIMessage key={i} response={msg.response} />
            )
          ))}

          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div
          className="px-6 py-4 border-t shrink-0"
          style={{ background: VD.surfaceElevated, borderColor: VD.borderHairline }}
        >
          <div className="flex gap-3 items-end">
            <div
              className="flex-1 rounded-xl border overflow-hidden"
              style={{ background: VD.analysisBody, borderColor: VD.borderPanel, boxShadow: VD.panelShadow }}
            >
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Ask about pods, metrics, tenants, queues, logs, latency… (Enter to send)"
                rows={2}
                aria-label="Chat message"
                className="w-full px-4 py-3 bg-transparent text-[13px] text-stone-200 placeholder-stone-600 resize-none outline-none leading-relaxed"
              />
              <div
                className="flex items-center justify-between px-4 py-2 border-t"
                style={{ borderColor: VD.borderHairline, fontFamily: MONO_FONT }}
              >
                <div className="flex gap-2 text-[10px] text-stone-500">
                  <span>Prom</span>
                  <span aria-hidden>•</span>
                  <span>ES</span>
                  <span aria-hidden>•</span>
                  <span>Loki</span>
                  <span aria-hidden>•</span>
                  <span>K8s API</span>
                </div>
                <span className="text-[10px] text-stone-600">↵ Send</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => sendQuery(input)}
              disabled={loading || !input.trim()}
              aria-busy={loading}
              aria-label="Send message"
              className="w-11 h-11 rounded-xl flex items-center justify-center text-white transition-opacity disabled:opacity-30 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/50 shrink-0"
              style={{
                background: loading ? "rgba(90, 74, 56, 0.85)" : VD.accentGrad,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.12)",
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
