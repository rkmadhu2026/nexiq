import { useState, useRef, useEffect, useId } from "react";
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
      "NexIQ Production — workload on prod-api-02 driven mainly by tenant-batch-export and analytics-etl-scheduler.\n\nPeak CPU 94% at 14:32 during cross-tenant batch export window. Normalized after 14:38.\n\nPattern repeats daily — consider staggering tenant jobs or moving heavy tenants to a dedicated node pool.",
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
    insight:
      "Tenant acme-corp — budget_remaining 1200 vs quota_required 4200 for this automation.\n\nThird rejection for this tenant in 2 hours — all policy/quota failures.\n\nRecommendation — notify tenant admin to raise quota or split workflows.",
    fix: "Rejection is expected under policy. Notify tenant admin for acme-corp to adjust quota or reduce concurrent workflows.",
    logs: workflowSampleLogs,
    sources: ["elasticsearch:app-logs-* workflow_id=8821", "elasticsearch:app-logs-* tenant_id=acme-corp"],
  },
  "Why is checkout-api pod crashing?": {
    type: "combined",
    severity: "critical",
    summary: "checkout-api OOMKilled — Java heap exhausted. 14 restarts in 2 hours.",
    insight:
      "Runtime — container memory limit is 512Mi but heap usage peaks at ~503MB.\n\nErrors — OutOfMemoryError in CheckoutProcessor thread; memory leak suspected with objects not GC'd.\n\nTraffic — spike began 09:15 during multi-tenant checkout load.",
    fix: "Immediate: kubectl set resources deploy/checkout-api --limits=memory=1Gi\nPermanent: Profile heap with JVM flags -Xmx768m -XX:+HeapDumpOnOutOfMemoryError",
    chart: { type: "bar", data: podRestartData, title: "Pod Restarts — Production Namespace", yLabel: "Restarts", color: "#ef4444" },
    logs: podLogs,
    sources: ["prometheus:kube_pod_container_status_restarts_total", "loki:{pod='checkout-api'}", "k8s:events"],
  },
  "Show API latency for tenant acme today": {
    type: "metrics",
    severity: "warning",
    summary: "P99 latency up to 372ms for tenant acme-corp — 26% above 30-day baseline for this tenant.",
    insight:
      "Latency profile — P50 stable at 130–150ms; P95 elevated 280–335ms; P99 spikes 370–400ms aligned with batch windows at 09:30, 10:30, 12:00, 13:30.\n\nIsolation — other tenants in the same region show normal P99, pointing to tenant-specific traffic rather than regional outage.",
    fix: "Within SLA for now. If P99 stays >400ms, scale checkout-api replicas for acme shard or review noisy-neighbor limits per tenant.",
    chart: { type: "latency", data: latencyData, title: "API latency percentiles — tenant acme (today)", yLabel: "Latency µs", color: "#3b82f6" },
    sources: ["prometheus:http_request_duration_seconds{tenant='acme-corp'}", "elasticsearch:app-logs-* tenant=acme-corp"],
  },
  "Why is billing-api returning 500 errors?": {
    type: "combined",
    severity: "critical",
    summary: "billing-api 500 errors — PostgreSQL connection pool exhausted. 23 errors/min.",
    insight:
      "Database — pool saturated at max (20/20) connections from 12:28.\n\nRequests — timeouts after 5s yield HTTP 500 during invoice batch across tenants.\n\nLatency drift — response time rose from 241ms baseline to 350ms (+45%).",
    fix: "Immediate: kubectl rollout restart deploy/billing-api (releases stale connections)\nConfig: DATABASE_POOL_SIZE=50 in billing-api ConfigMap",
    chart: { type: "bar", data: podRestartData, title: "Service error rate", yLabel: "Errors/min", color: "#ef4444" },
    logs: apiLogs,
    sources: ["prometheus:http_requests_total{status=~'5..'}", "loki:{job='nginx'} |= '500'", "loki:{app='billing-api'} |= 'ERROR'"],
  },
  "Show job queue depth trend": {
    type: "metrics",
    severity: "critical",
    summary: "Async job queue RISING — avg depth 772, max 988. Threshold 1000 almost breached.",
    insight:
      "Trend — queue depth grew over 5 days (avg 232 → 772), max 988.\n\nDrivers — correlates with new tenants onboarded and higher background job volume.\n\nRisk — breach likely within ~2 days without worker scale-up.",
    fix: "Scale worker deployment (e.g. notify-worker replicas 4 → 8).\nAlert if rolling avg depth > 850.",
    chart: { type: "queue", data: queueData, title: "Job queue depth (last 5 days)", yLabel: "Queued jobs", threshold: 1000, color: "#f59e0b" },
    sources: ["prometheus:job_queue_depth{queue='default'}"],
  },
};

/** Light surfaces — match Admin Console / Settings & shell dashboard tokens */
const VD = {
  canvas: "#faf7f2",
  surface: "#fffbf7",
  surfaceElevated: "#ffffff",
  surfaceInset: "#f5efe8",
  chartBg: "#ffffff",
  chartHeader: "#f8f5f0",
  gridStroke: "rgba(42, 36, 28, 0.08)",
  axisTick: "#6b6258",
  axisLine: "rgba(42, 36, 28, 0.14)",
  logsBg: "#ffffff",
  logsHeader: "#f8f5f0",
  logsMeta: "#efe8dc",
  logsSearch: "#fffdf9",
  logsCol: "#f3ece4",
  analysisBody: "#fffdf9",
  fixGreenBg: "#ecfdf5",
  fixGreenHeader: "#d1fae5",
  scrollbarTrack: "#ebe4d8",
  scrollbarThumb: "rgba(122, 82, 34, 0.28)",
  navActive: "#efe8dc",
  quickBtn: "#fffbf7",
  badgeBg: "rgba(166, 115, 50, 0.14)",
  userBubble: "#efe8dc",
  userText: "#1a1611",
  borderHairline: "rgba(42, 36, 28, 0.11)",
  borderPanel: "rgba(42, 36, 28, 0.13)",
  panelShadow:
    "0 1px 0 rgba(255, 255, 255, 0.95), 0 14px 36px rgba(47, 40, 31, 0.07)",
  tooltipShadow: "0 10px 28px rgba(47, 40, 31, 0.12)",
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
  FATAL: { text: "text-red-700", dot: "#b91c1c" },
  ERROR: { text: "text-red-600", dot: "#dc2626" },
  WARN: { text: "text-amber-700", dot: "#b45309" },
  INFO: { text: "text-stone-600", dot: "#78716c" },
  DEBUG: { text: "text-stone-500", dot: "#a8a29e" },
};

const severityConfig = {
  critical: { label: "CRITICAL", dot: "#b91c1c", color: "text-red-800", border: "border-red-200", bg: "bg-red-50" },
  error: { label: "ERROR", dot: "#dc2626", color: "text-red-700", border: "border-red-200", bg: "bg-red-50" },
  warning: { label: "WARNING", dot: "#b45309", color: "text-amber-900", border: "border-amber-200", bg: "bg-amber-50" },
  info: { label: "INFO", dot: "#047857", color: "text-emerald-900", border: "border-emerald-200", bg: "bg-emerald-50" },
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
        boxShadow: "inset 0 1px 0 rgba(255,255,255,0.85)",
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
            <span className="text-stone-800">{instanceLabel}</span>
          </div>
        ) : null}
        {clientName ? (
          <div className="min-w-0">
            <span className="text-[11px] block mb-1" style={{ color: "#7d766c" }}>
              Client
            </span>
            <span className="text-stone-800">{clientName}</span>
          </div>
        ) : null}
        {applicationNames && applicationNames.length > 0 ? (
          <div className="min-w-0 flex-1 basis-[min(100%,14rem)]">
            <span className="text-[11px] block mb-1" style={{ color: "#7d766c" }}>
              Applications / jobs
            </span>
            <span className="text-stone-800 break-words">{applicationNames.join(" · ")}</span>
          </div>
        ) : null}
        {regionLabel ? (
          <div className="min-w-0">
            <span className="text-[11px] block mb-1" style={{ color: "#7d766c" }}>
              Region / cluster
            </span>
            <span className="text-stone-800">{regionLabel}</span>
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
          <span style={{ color: "#78716c" }}>{p.name}:</span>
          <span className="font-medium">
            {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
};

/** Horizontal bar chart — workload rows + numeric metric */
function BarMetricTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const row = payload[0]?.payload;
  const block = payload[0];
  if (!row || block?.value === undefined) return null;
  const pod = row.pod ?? row.service ?? "";
  const ns = row.namespace;
  const headline = ns ? `${pod} · namespace ${ns}` : pod;
  const metricName = block.name ?? "Value";
  const v = typeof block.value === "number" ? block.value : Number(block.value);

  return (
    <div
      className="rounded-md px-3 py-2.5 text-[11px] border max-w-[18rem]"
      style={{
        fontFamily: MONO_FONT,
        background: VD.chartBg,
        borderColor: VD.borderPanel,
        boxShadow: VD.tooltipShadow,
      }}
    >
      <div className="mb-2 leading-snug font-medium" style={{ color: "#1a1611" }}>
        {headline}
      </div>
      <div className="flex items-baseline justify-between gap-6 tabular-nums">
        <span style={{ color: "#78716c" }}>{metricName}</span>
        <span className="font-semibold text-red-700">{Number.isInteger(v) ? v : v.toFixed(1)}</span>
      </div>
    </div>
  );
}

/** Integer-friendly max for horizontal bar X-axis (e.g. 0 … 16 with step 4) */
function barAxisMax(rows, valueKey = "restarts") {
  const vals = rows.map((r) => Number(r[valueKey]) || 0);
  const hi = Math.max(...vals, 1);
  const padded = hi + Math.max(2, Math.ceil(hi * 0.08));
  const step = 4;
  return Math.max(8, Math.ceil(padded / step) * step);
}

// ── Chart Renderer ────────────────────────────────────────────
function GrafanaChart({ chart }) {
  const barGradId = useId().replace(/:/g, "ocbg");

  if (!chart) return null;

  const gridProps = { stroke: VD.gridStroke, strokeDasharray: "3 3" };
  const axisProps = {
    tick: { fill: VD.axisTick, fontSize: 10, fontFamily: MONO_FONT },
    axisLine: { stroke: VD.axisLine },
  };

  const isBar = chart.type === "bar";
  const barRows = Array.isArray(chart.data) ? chart.data.length : 0;
  const plotHeight = isBar ? Math.min(340, 76 + barRows * 46) : 200;
  const barMax = isBar ? barAxisMax(chart.data, "restarts") : 0;
  const barMetricName =
    typeof chart.metricLabel === "string"
      ? chart.metricLabel
      : chart.title?.toLowerCase().includes("error")
        ? "Errors/min"
        : "Restarts";

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
          className="text-[11px] text-stone-700 font-medium tabular-nums"
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
      <div className="p-3" style={{ height: plotHeight }}>
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
          ) : chart.type === "bar" ? (
            <BarChart data={chart.data} layout="vertical" margin={{ top: 4, right: 20, bottom: 14, left: 2 }}>
              <defs>
                <linearGradient id={barGradId} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#fecaca" stopOpacity={0.98} />
                  <stop offset="55%" stopColor="#ef4444" stopOpacity={1} />
                  <stop offset="100%" stopColor="#b91c1c" stopOpacity={1} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} horizontal vertical />
              <XAxis
                type="number"
                domain={[0, barMax]}
                allowDecimals={false}
                {...axisProps}
                tickMargin={6}
                label={{
                  value: chart.yLabel ?? "Restarts",
                  position: "bottom",
                  offset: 4,
                  fill: "#8a8278",
                  fontSize: 10,
                  fontFamily: MONO_FONT,
                }}
              />
              <YAxis
                type="category"
                dataKey="pod"
                {...axisProps}
                width={128}
                interval={0}
                tickMargin={6}
              />
              <Tooltip content={<BarMetricTooltip />} cursor={{ fill: "rgba(174, 138, 88, 0.07)" }} />
              {typeof chart.threshold === "number" ? (
                <ReferenceLine
                  x={chart.threshold}
                  stroke="#d97706"
                  strokeDasharray="5 5"
                  strokeOpacity={0.95}
                  label={{
                    value: `Warn ${chart.threshold}`,
                    fill: "#b45309",
                    fontSize: 9,
                    fontFamily: MONO_FONT,
                  }}
                />
              ) : null}
              <Bar
                dataKey="restarts"
                name={barMetricName}
                fill={`url(#${barGradId})`}
                stroke="#991b1b"
                strokeWidth={0.6}
                radius={[0, 5, 5, 0]}
                maxBarSize={30}
                label={{
                  position: "right",
                  fill: VD.axisTick,
                  fontSize: 10,
                  fontFamily: MONO_FONT,
                }}
              />
            </BarChart>
          ) : null}
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
        {chart.type === "bar" && (
          <>
            <span className="flex items-center gap-2">
              <span
                className="inline-block h-2.5 w-5 shrink-0 rounded-sm border border-red-800/25"
                style={{ background: "linear-gradient(90deg,#fecaca,#dc2626)" }}
                aria-hidden
              />
              <span>{barMetricName} · horizontal bars · axis 0–{barMax}</span>
            </span>
            <span style={{ opacity: 0.92 }}>Hover a row for pod + namespace.</span>
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
          <span className="text-stone-700 font-medium truncate">{title}</span>
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
                  ? "text-stone-900"
                  : "text-stone-500 hover:text-stone-800"
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
          className="w-full bg-transparent text-stone-800 placeholder-stone-400 outline-none text-[11px] py-0.5"
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
              className={`grid gap-2 px-3 py-2 border-b border-stone-200/90 hover:bg-stone-50/90 transition-colors ${i === 0 && log.level === "FATAL" ? "bg-red-50" : ""}`}
              style={{ gridTemplateColumns: "90px 60px 110px 1fr" }}
            >
              <span className="text-stone-500 shrink-0 tabular-nums">{log.time}</span>
              <span className={`${cfg.text} flex items-center gap-1.5 shrink-0 font-semibold`}>
                <span className="w-1.5 h-1.5 rounded-full shrink-0 ring-1 ring-stone-300/60" style={{ background: cfg.dot }} />
                {log.level}
              </span>
              <span className="text-stone-600 shrink-0 truncate">{log.service}</span>
              <span
                className={`${
                  log.level === "ERROR" || log.level === "FATAL"
                    ? "text-red-900"
                    : log.level === "WARN"
                      ? "text-amber-950"
                      : "text-stone-700"
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

// ── Insight narrative (paragraphs · optional bullets · leading clause emphasis) ──
function InsightLeadingClause({ children }) {
  const text = typeof children === "string" ? children : "";
  const sep = " — ";
  const idx = text.indexOf(sep);
  if (idx <= 0) return text ? <>{text}</> : null;
  const head = text.slice(0, idx).trim();
  const tail = text.slice(idx + sep.length).trim();
  return (
    <>
      <strong className="font-semibold text-stone-900">{head}</strong>
      <span className="mx-0.5 select-none font-normal text-stone-400">—</span>{" "}
      <span className="font-normal text-stone-700">{tail}</span>
    </>
  );
}

function InsightBody({ text }) {
  const raw = String(text ?? "").trim();
  if (!raw) return null;

  const blocks = raw.split(/\n\n+/).map((b) => b.trim()).filter(Boolean);

  return (
    <div className="insight-body space-y-4 text-[13px] leading-[1.72] text-stone-700">
      {blocks.map((block, i) => {
        const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
        const allBullets = lines.length >= 1 && lines.every((l) => /^[-•]\s/.test(l));

        if (allBullets && lines.length >= 1) {
          return (
            <ul key={i} className="m-0 list-none space-y-2.5 border-l-2 border-amber-600/25 pl-3">
              {lines.map((line, j) => (
                <li key={j} className="flex gap-3">
                  <span className="mt-[0.55em] h-1.5 w-1.5 shrink-0 rounded-full bg-amber-600/75" aria-hidden />
                  <span className="min-w-0 flex-1">
                    <InsightLeadingClause>{line.replace(/^[-•]\s/, "")}</InsightLeadingClause>
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        const paragraphText = lines.join(" ");
        return (
          <p key={i} className="m-0 max-w-none">
            <InsightLeadingClause>{paragraphText}</InsightLeadingClause>
          </p>
        );
      })}
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
          style={{ boxShadow: "inset 0 1px 0 rgba(255,255,255,0.9)" }}
        >
          <span className="inline-flex items-center gap-2 shrink-0">
            <span className="h-2 w-2 rounded-full ring-1 ring-stone-300/50 shrink-0" style={{ background: sev.dot }} aria-hidden />
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
          <p className="text-[13px] leading-relaxed text-stone-700 min-w-0 flex-1 m-0">{response.summary}</p>
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
          className="mt-1 overflow-hidden rounded-lg border"
          style={{
            borderColor: VD.borderPanel,
            borderLeftWidth: 3,
            borderLeftColor: "rgba(166, 115, 50, 0.65)",
            boxShadow: VD.panelShadow,
          }}
        >
          <div
            className="border-b px-4 py-3"
            style={{
              fontFamily: MONO_FONT,
              background: VD.logsHeader,
              borderColor: VD.borderHairline,
            }}
          >
            <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.08em]" style={{ color: "#7d7469" }}>
              <span className="h-3 w-px rounded-full bg-amber-600/55" aria-hidden />
              AI Root Cause Analysis
            </div>
            <p className="m-0 mt-1 max-w-[40rem] text-[11px] font-normal normal-case leading-snug tracking-normal text-stone-500" style={{ fontFamily: UI_FONT }}>
              Bold segments highlight scope; paragraphs separate beats.
            </p>
          </div>
          <div className="px-4 py-4 sm:px-5 sm:py-5" style={{ background: VD.analysisBody }}>
            <InsightBody text={response.insight} />
          </div>
        </div>

        {/* Fix */}
        <div className="mt-1 rounded-lg border border-emerald-200 overflow-hidden" style={{ boxShadow: VD.panelShadow }}>
          <div
            className="px-4 py-2.5 border-b border-emerald-200 text-[10px] font-medium uppercase flex items-center gap-2"
            style={{
              fontFamily: MONO_FONT,
              background: VD.fixGreenHeader,
              color: "#065f46",
              letterSpacing: "0.08em",
            }}
          >
            <span className="h-3 w-px rounded-full bg-emerald-600/50" aria-hidden />
            Recommended Action
          </div>
          <pre
            className="px-4 py-3 text-[11px] text-emerald-900 whitespace-pre-wrap leading-relaxed m-0 border-t border-emerald-100"
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
      className="flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-hidden md:flex-row text-stone-800"
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
          background: rgba(174, 138, 88, 0.09) !important;
          border-color: rgba(174, 138, 88, 0.38) !important;
          color: #29241d !important;
        }
        .query-btn:focus-visible {
          outline: 2px solid rgba(174, 138, 88, 0.45);
          outline-offset: 2px;
        }
        .observe-rail-section-title {
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          color: #6f665c;
        }
        .observe-rail-query {
          hyphens: auto;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
      `}</style>

      {/* Sidebar — shell-aligned hierarchy: brand card · nav chips · query deck · data plane */}
      <aside
        className="observe-rail flex max-h-[min(48vh,24rem)] w-full shrink-0 flex-col overflow-y-auto border-b md:max-h-none md:h-full md:w-[17rem] md:min-w-[16rem] md:max-w-[17rem] md:flex-none md:overflow-visible md:border-b-0 md:border-r"
        style={{ background: VD.surfaceInset, borderColor: VD.borderHairline }}
        aria-label="Observe navigation"
      >
        <div className="px-3.5 pb-3 pt-4">
          <div
            className="rounded-xl border px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_1px_3px_rgba(47,40,31,0.06)]"
            style={{ background: VD.surfaceElevated, borderColor: VD.borderPanel }}
          >
            <div className="flex items-start gap-3">
              <div
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border text-[11px] font-bold tracking-tight text-white"
                style={{
                  fontFamily: MONO_FONT,
                  background: VD.accentGrad,
                  borderColor: "rgba(174, 138, 88, 0.35)",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.14)",
                }}
                aria-hidden
              >
                NQ
              </div>
              <div className="min-w-0 pt-0.5">
                <p className="observe-rail-section-title m-0">Module</p>
                <h2
                  className="m-0 mt-1.5 text-[15px] font-semibold leading-tight tracking-tight text-stone-900"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Observe
                </h2>
                <p className="m-0 mt-1.5 text-[11px] leading-relaxed text-stone-500">
                  Tenant-aware · cited queries
                </p>
              </div>
            </div>
          </div>
        </div>

        <nav className="flex flex-1 flex-col gap-1.5 px-3 pb-2 pt-0 min-h-0" aria-label="Primary">
          <div className="observe-rail-section-title px-1 pb-1">Navigate</div>
          {SIDEBAR_NAV.map((item) => {
            const on = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(item.id)}
                className={`observe-rail-nav-btn group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-[12px] transition-[background,border-color,box-shadow,color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-500/50 ${
                  on
                    ? "border-stone-300/90 text-stone-900 shadow-[0_2px_10px_rgba(71,55,31,0.07)]"
                    : "border-transparent text-stone-600 hover:border-stone-200/90 hover:bg-white/55 hover:text-stone-900"
                }`}
                style={
                  on
                    ? { background: VD.navActive, borderColor: "rgba(174, 138, 88, 0.35)" }
                    : {}
                }
              >
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-[10px] font-bold tracking-tight transition-colors"
                  style={{
                    fontFamily: MONO_FONT,
                    borderColor: on ? "rgba(174, 138, 88, 0.45)" : VD.borderHairline,
                    background: on ? "rgba(174, 138, 88, 0.18)" : VD.surfaceElevated,
                    color: on ? "#3d3429" : "#78716c",
                    boxShadow: on ? "inset 0 1px 0 rgba(255,255,255,0.65)" : "none",
                  }}
                  aria-hidden
                >
                  {item.abbr}
                </span>
                <span className="min-w-0 font-semibold leading-snug">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="mt-auto border-t px-3.5 py-4" style={{ borderColor: VD.borderHairline }}>
          <div className="observe-rail-section-title mb-2.5 flex items-center gap-2 px-0.5">
            <span className="h-1 w-1 shrink-0 rounded-full bg-gradient-to-br from-amber-500 to-amber-700 opacity-90" aria-hidden />
            Quick queries
          </div>
          <div
            className="space-y-2 rounded-xl border px-2.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)]"
            style={{ borderColor: VD.borderHairline, background: VD.surfaceElevated }}
          >
            {QUERIES.slice(0, 4).map((q, i) => (
              <button
                key={i}
                type="button"
                onClick={() => sendQuery(q)}
                className="observe-rail-query query-btn w-full rounded-lg border px-3 py-2.5 text-left text-[11px] leading-relaxed text-stone-700 transition-colors hover:text-stone-900"
                style={{ background: VD.quickBtn, borderColor: VD.borderHairline, fontFamily: MONO_FONT }}
              >
                {q}
              </button>
            ))}
          </div>
        </div>

        <div className="border-t px-3.5 pb-4 pt-3" style={{ borderColor: VD.borderHairline }}>
          <div className="observe-rail-section-title mb-2 flex items-center gap-2 px-0.5">
            <span className="h-1 w-1 shrink-0 rounded-full bg-emerald-500/85" aria-hidden />
            Data plane
          </div>
          <div
            className="rounded-xl border px-3 py-2.5"
            style={{ background: VD.surfaceElevated, borderColor: VD.borderHairline }}
          >
            <div className="mb-2 flex items-center gap-2 text-[11px] font-medium text-stone-600">
              <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-400 shadow-[0_0_0_3px_rgba(52,211,153,0.2)] motion-safe:animate-pulse" aria-hidden />
              Agents reachable
            </div>
            <div className="space-y-2 border-t pt-2.5" style={{ borderColor: VD.borderHairline }}>
              {["Prometheus", "Loki", "Elasticsearch"].map((s) => (
                <div key={s} className="flex items-center justify-between gap-3 text-[11px]" style={{ fontFamily: MONO_FONT }}>
                  <span className="min-w-0 truncate text-stone-600">{s}</span>
                  <span className="text-[10px] tabular-nums text-emerald-600/95" aria-hidden>
                    ●
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* Main chat area */}
      <div className="observe-main flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header
          className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-5 py-3"
          style={{
            background: VD.surface,
            borderColor: VD.borderHairline,
            boxShadow: "inset 0 -1px 0 rgba(42, 36, 28, 0.06)",
          }}
        >
          <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2">
            <span
              className="shrink-0 rounded-md border px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.06em]"
              style={{
                fontFamily: MONO_FONT,
                background: VD.badgeBg,
                borderColor: "rgba(174, 138, 88, 0.28)",
                color: "#806847",
              }}
            >
              LangGraph · RAG
            </span>
            <span className="hidden h-4 w-px shrink-0 bg-stone-300 sm:block" aria-hidden />
            <p className="m-0 max-w-[28rem] text-[12px] leading-snug text-stone-500">
              Charts, logs, and scoped answers — sources attached to each reply
            </p>
          </div>
          <div
            className="flex shrink-0 flex-wrap items-center gap-x-5 gap-y-1 text-[11px]"
            style={{ fontFamily: MONO_FONT, color: "#8a8278" }}
          >
            <span className="flex items-center gap-2 text-stone-600">
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
                  background: VD.accentGrad,
                  borderColor: "rgba(174, 138, 88, 0.35)",
                  boxShadow: VD.panelShadow,
                }}
                aria-hidden
              >
                NQ
              </div>
              <div className="max-w-md">
                <h2 className="mb-2 m-0 text-[1.35rem] font-semibold tracking-tight text-stone-900" style={{ fontFamily: "var(--font-display)" }}>
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
                    className="query-btn px-3 py-2.5 rounded-lg text-[11px] text-left text-stone-600 border transition-colors leading-snug"
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
                className="w-full px-4 py-3 bg-transparent text-[13px] text-stone-800 placeholder-stone-400 resize-none outline-none leading-relaxed"
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
