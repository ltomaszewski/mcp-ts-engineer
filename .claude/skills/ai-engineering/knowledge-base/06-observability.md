# Observability & Monitoring

Complete observability stack for Claude Agent SDK systems in production.

---

## Three Pillars of Agent Observability

### 1. Logs (What Happened)

Structured audit trail of every agent action.

### 2. Metrics (How It's Performing)

Quantitative measurements of cost, latency, throughput, and errors.

### 3. Traces (How It Flows)

End-to-end request flow through orchestrator and subagents.

---

## Structured Logging

### Log Schema

```typescript
interface AgentLogEntry {
  // Identity
  timestamp: string;          // ISO 8601
  session_id: string;         // Agent session
  trace_id: string;           // Cross-agent trace
  parent_session_id?: string; // If subagent

  // Event
  event: AgentEvent;
  level: "debug" | "info" | "warn" | "error";

  // Context
  tool_name?: string;
  tool_input?: unknown;
  tool_output?: string;
  duration_ms?: number;
  cost_usd?: number;
  model?: string;
  turn?: number;

  // Error
  error_message?: string;
  error_stack?: string;
}

type AgentEvent =
  | "session_start"
  | "session_end"
  | "tool_request"
  | "tool_allowed"
  | "tool_denied"
  | "tool_completed"
  | "tool_failed"
  | "subagent_start"
  | "subagent_stop"
  | "context_compact"
  | "budget_warning"
  | "budget_exceeded"
  | "rate_limited"
  | "security_violation";
```

### Logging Hook Implementation

```typescript
import { type HookCallback, type PreToolUseHookInput, type PostToolUseHookInput } from "@anthropic-ai/claude-agent-sdk";
import { appendFileSync } from "fs";

class AgentLogger {
  private logPath: string;
  private traceId: string;
  private toolTimings = new Map<string, number>();

  constructor(logPath: string, traceId?: string) {
    this.logPath = logPath;
    this.traceId = traceId ?? crypto.randomUUID();
  }

  log(entry: Partial<AgentLogEntry>): void {
    const full: AgentLogEntry = {
      timestamp: new Date().toISOString(),
      session_id: "",
      trace_id: this.traceId,
      level: "info",
      event: "tool_request",
      ...entry
    };

    // Write to file (JSONL format)
    appendFileSync(this.logPath, JSON.stringify(full) + "\n");

    // Also log warnings and errors to stderr
    if (full.level === "warn" || full.level === "error") {
      console.error(`[${full.level.toUpperCase()}] ${full.event}: ${full.error_message ?? full.tool_name ?? ""}`);
    }
  }

  // Hook callbacks
  preToolUseHook(): HookCallback {
    return async (input, toolUseID) => {
      const preInput = input as PreToolUseHookInput;
      if (toolUseID) this.toolTimings.set(toolUseID, Date.now());

      this.log({
        session_id: input.session_id,
        event: "tool_request",
        tool_name: preInput.tool_name,
        tool_input: preInput.tool_input
      });
      return {};
    };
  }

  postToolUseHook(): HookCallback {
    return async (input, toolUseID) => {
      const postInput = input as PostToolUseHookInput;
      const startTime = toolUseID ? this.toolTimings.get(toolUseID) : undefined;
      const duration = startTime ? Date.now() - startTime : undefined;

      this.log({
        session_id: input.session_id,
        event: "tool_completed",
        tool_name: postInput.tool_name,
        tool_input: postInput.tool_input,
        duration_ms: duration
      });

      if (toolUseID) this.toolTimings.delete(toolUseID);
      return {};
    };
  }

  sessionStartHook(): HookCallback {
    return async (input) => {
      this.log({
        session_id: input.session_id,
        event: "session_start",
        level: "info"
      });
      return {};
    };
  }

  sessionEndHook(): HookCallback {
    return async (input) => {
      this.log({
        session_id: input.session_id,
        event: "session_end",
        level: "info"
      });
      return {};
    };
  }

  subagentStartHook(): HookCallback {
    return async (input) => {
      this.log({
        session_id: input.session_id,
        event: "subagent_start",
        level: "info"
      });
      return {};
    };
  }

  subagentStopHook(): HookCallback {
    return async (input) => {
      this.log({
        session_id: input.session_id,
        event: "subagent_stop",
        level: "info"
      });
      return {};
    };
  }

  // Create hooks config
  createHooksConfig() {
    return {
      PreToolUse: [{ hooks: [this.preToolUseHook()] }],
      PostToolUse: [{ hooks: [this.postToolUseHook()] }],
      SessionStart: [{ hooks: [this.sessionStartHook()] }],
      SessionEnd: [{ hooks: [this.sessionEndHook()] }],
      SubagentStart: [{ hooks: [this.subagentStartHook()] }],
      SubagentStop: [{ hooks: [this.subagentStopHook()] }]
    };
  }
}

// Usage
const logger = new AgentLogger("/var/log/agent/agent.jsonl");

for await (const msg of query({
  prompt: "Review the codebase",
  options: {
    hooks: logger.createHooksConfig()
  }
})) {
  if ("result" in msg) {
    logger.log({
      session_id: msg.session_id ?? "",
      event: "session_end",
      cost_usd: msg.total_cost_usd,
      level: msg.is_error ? "error" : "info",
      error_message: msg.is_error ? msg.result : undefined
    });
  }
}
```

---

## Metrics Collection

### Core Metrics

```typescript
class AgentMetricsCollector {
  // Counters
  private sessionCount = 0;
  private toolCallCount = 0;
  private errorCount = 0;
  private blockedCount = 0;

  // Gauges
  private activeSessions = 0;

  // Histograms (store recent values for percentile calculation)
  private sessionCosts: number[] = [];
  private sessionTurns: number[] = [];
  private sessionDurations: number[] = [];
  private toolDurations: number[] = [];

  // By-dimension tracking
  private costByModel = new Map<string, number>();
  private callsByTool = new Map<string, number>();
  private errorsByType = new Map<string, number>();

  recordSessionStart(): void {
    this.sessionCount++;
    this.activeSessions++;
  }

  recordSessionEnd(cost: number, turns: number, duration: number, model: string): void {
    this.activeSessions--;
    this.sessionCosts.push(cost);
    this.sessionTurns.push(turns);
    this.sessionDurations.push(duration);
    this.costByModel.set(model, (this.costByModel.get(model) ?? 0) + cost);
  }

  recordToolCall(toolName: string, durationMs: number): void {
    this.toolCallCount++;
    this.toolDurations.push(durationMs);
    this.callsByTool.set(toolName, (this.callsByTool.get(toolName) ?? 0) + 1);
  }

  recordBlocked(toolName: string): void {
    this.blockedCount++;
  }

  recordError(errorType: string): void {
    this.errorCount++;
    this.errorsByType.set(errorType, (this.errorsByType.get(errorType) ?? 0) + 1);
  }

  // Export metrics (e.g., for Prometheus, Datadog)
  export(): Record<string, number | Record<string, number>> {
    return {
      // Counters
      agent_sessions_total: this.sessionCount,
      agent_tool_calls_total: this.toolCallCount,
      agent_errors_total: this.errorCount,
      agent_blocked_total: this.blockedCount,

      // Gauges
      agent_active_sessions: this.activeSessions,

      // Aggregates
      agent_cost_total_usd: this.sessionCosts.reduce((s, v) => s + v, 0),
      agent_cost_avg_usd: this.avg(this.sessionCosts),
      agent_turns_avg: this.avg(this.sessionTurns),
      agent_duration_avg_ms: this.avg(this.sessionDurations),
      agent_duration_p95_ms: this.percentile(this.sessionDurations, 95),
      agent_tool_duration_avg_ms: this.avg(this.toolDurations),

      // By dimension
      agent_cost_by_model: Object.fromEntries(this.costByModel),
      agent_calls_by_tool: Object.fromEntries(this.callsByTool),
      agent_errors_by_type: Object.fromEntries(this.errorsByType)
    };
  }

  private avg(values: number[]): number {
    return values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
  }

  private percentile(values: number[], p: number): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil(sorted.length * (p / 100)) - 1;
    return sorted[index] ?? 0;
  }
}
```

---

## Alerting Rules

### Critical Alerts (Immediate Response)

| Alert | Condition | Action |
|-------|-----------|--------|
| Security violation | `agent_blocked_total` spike | Investigate blocked operations |
| Budget exceeded | Session cost > threshold | Kill session, investigate prompt |
| Error rate spike | `error_rate > 10%` over 5min | Check agent logs, reduce load |
| Credential exposure | Audit log shows sensitive path access | Rotate credentials immediately |

### Warning Alerts (Investigate)

| Alert | Condition | Action |
|-------|-----------|--------|
| Cost anomaly | Daily cost > 2x baseline | Check for runaway agents |
| Turn count high | `avg_turns > 40` | Optimize prompts |
| Slow responses | `p95_duration > 60s` | Check model selection |
| Tool failures | `tool_error_rate > 5%` | Check tool configurations |

### Alerting Example

```typescript
function checkAlerts(metrics: AgentMetricsCollector): void {
  const data = metrics.export();

  // Budget alert
  if ((data.agent_cost_total_usd as number) > 100) {
    sendAlert("CRITICAL", "Agent spending exceeded $100");
  }

  // Error rate alert
  const errorRate = (data.agent_errors_total as number) / (data.agent_sessions_total as number);
  if (errorRate > 0.1) {
    sendAlert("WARNING", `Error rate at ${(errorRate * 100).toFixed(1)}%`);
  }

  // Blocked operations alert
  if ((data.agent_blocked_total as number) > 50) {
    sendAlert("WARNING", "High number of blocked operations");
  }
}
```

---

## Tracing

### Distributed Trace Context

```typescript
// Pass trace ID through orchestrator to subagents
function createTracedOptions(traceId: string): QueryOptions {
  return {
    appendSystemPrompt: `Trace-ID: ${traceId}`,
    hooks: {
      PreToolUse: [{
        hooks: [async (input) => {
          // Propagate trace ID to subagent contexts
          return {
            additionalContext: `Trace: ${traceId}`
          };
        }]
      }]
    }
  };
}

// Correlate logs across agents
// Agent 1 (orchestrator): trace-id=abc123
// Agent 2 (subagent-1):   trace-id=abc123, parent=agent-1
// Agent 3 (subagent-2):   trace-id=abc123, parent=agent-1
```

---

## Dashboard Recommendations

### Key Panels

1. **Active Sessions** — Real-time count of running agent sessions
2. **Cost Rate** — $/hour over time (detect runaway spend)
3. **Error Rate** — Errors per session over time
4. **Tool Usage Distribution** — Pie chart of tool calls
5. **Security Events** — Blocked operations timeline
6. **Session Duration** — Histogram of completion times
7. **Model Distribution** — Haiku vs Sonnet vs Opus usage
8. **Top Errors** — Table of most common error types

### Log Analysis Queries

```bash
# Most used tools
jq -r 'select(.event == "tool_completed") | .tool_name' agent.jsonl | sort | uniq -c | sort -rn

# Slowest tool calls
jq -r 'select(.event == "tool_completed" and .duration_ms > 5000) | "\(.duration_ms)ms \(.tool_name)"' agent.jsonl

# Security violations
jq 'select(.event == "tool_denied")' agent.jsonl

# Cost by session
jq -r 'select(.event == "session_end") | "\(.session_id)\t$\(.cost_usd)"' agent.jsonl

# Error summary
jq -r 'select(.level == "error") | .error_message' agent.jsonl | sort | uniq -c | sort -rn
```
