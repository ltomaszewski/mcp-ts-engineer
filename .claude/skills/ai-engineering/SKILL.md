---
name: ai-engineering
version: "SDK ~0.2.86"
description: AI engineering with Claude Agent SDK - agent architecture, orchestration, performance optimization, security hardening, production deployment. Use when building AI agents, designing multi-agent systems, optimizing cost/latency, or hardening agent security.
---

# AI Engineering with Claude Agent SDK

Production-grade AI agent systems: architecture, performance, security, reliability.

**Opus optimization notes:** This skill is structured for high-capability models. Decision frameworks replace prescriptive rules where nuance matters. Code examples are canonical patterns — synthesize variations from principles, don't look for exact-match templates. Knowledge-base files contain full implementations; this file is the decision index.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Designing multi-agent architectures or orchestration
- Optimizing agent cost, latency, or token usage
- Hardening security for production deployment
- Building evaluation/testing frameworks for agents
- Implementing observability, logging, or audit trails
- Configuring sandboxing, isolation, or credentials
- Scaling for enterprise or multi-tenant use

---

## Critical Rules

**ALWAYS:**
1. Least privilege on every agent — restrict tools, filesystem, network to minimum required
2. Set cost controls (`maxTurns`, `maxBudgetUsd`) — runaway agents burn budget fast
3. Log every tool invocation — audit trails are non-negotiable in production
4. Validate tool inputs with schemas — unvalidated inputs enable injection
5. Hooks for security enforcement — deny before allow (fail closed)
6. Isolate subagent context — specialized agents must not inherit full parent permissions
7. Cache aggressively — prompt caching gives 10x cheaper reads
8. Match model to task — Haiku for workers, Sonnet for orchestrators, Opus for critical reasoning

**NEVER:**
1. `bypassPermissions` in production — propagates to ALL subagents; requires `allowDangerouslySkipPermissions: true` since v0.2.45
2. Expose credentials to agents — use proxy pattern outside security boundary
3. Skip error handling in hooks — failed hooks crash the agent loop
4. Give subagents the `Task` tool — they cannot spawn sub-subagents
5. Process untrusted content without sandboxing — prompt injection redirects behavior
6. Ignore cost tracking — production agents generate unbounded costs without limits
7. Use `any` for message types — lose type safety, miss critical error states
8. Trust agent output without verification — always verify with rules-based checks

---

## Core Patterns

### Architecture Selection

Choose the right pattern based on task characteristics:

```
Is the task decomposable into independent subtasks?
  Yes → Fan-Out/Fan-In (parallel analysis)
  No →
    Does it have sequential dependencies?
      Yes → Pipeline (analyze → implement → verify)
      No →
        Does it require iterative refinement?
          Yes → Supervisor with Retry (max 3 attempts)
          No →
            Does it need multiple perspectives?
              Yes → Multi-Perspective Review
              No → Single Agent with Self-Verification
```

| Pattern | When | Cost Profile | Latency |
|---------|------|-------------|---------|
| Orchestrator + Workers | Default for complex tasks | Medium | Medium |
| Pipeline | Sequential dependencies | Medium | High (serial) |
| Fan-Out/Fan-In | Independent analyses | High (parallel) | Low (parallel) |
| Supervisor + Retry | Iterative refinement | Variable | Variable |
| Multi-Perspective | Critical decisions | High | Low (parallel) |
| Single + Self-Verify | Simple tasks needing validation | Low | Low |

---

## Core Pattern: Orchestrator + Workers

```typescript
import { query, type AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

const agents: Record<string, AgentDefinition> = {
  "security-scanner": {
    description: "Scans code for security vulnerabilities. Use for auth, input handling, secrets.",
    prompt: `Security specialist. Check for:
- Injection (SQL, NoSQL, command)
- Auth/authz flaws
- Hardcoded secrets
- Input validation gaps
Cite specific lines.`,
    tools: ["Read", "Grep", "Glob"],
    model: "opus"
  },
  "performance-analyzer": {
    description: "Analyzes performance issues. Use for N+1 queries, memory leaks, bottlenecks.",
    prompt: "Performance expert. Identify bottlenecks, N+1 queries, memory leaks, inefficient patterns.",
    tools: ["Read", "Grep", "Glob"],
    model: "sonnet"
  },
  "test-runner": {
    description: "Runs test suites and analyzes results. Use for CI validation.",
    prompt: "Run tests, analyze failures, suggest fixes. Be concise.",
    tools: ["Bash", "Read", "Grep"],
    model: "haiku"
  }
};

for await (const message of query({
  prompt: "Review the auth module for security and performance, then run tests",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Task"],
    agents,
    maxTurns: 30,
    maxBudgetUsd: 5.0
  }
})) {
  if ("result" in message) {
    console.log(`Cost: $${message.total_cost_usd}, Turns: ${message.num_turns}`);
  }
}
```

### Key Design Principles

1. **Single Responsibility** — each agent does one thing well
2. **Minimal Context** — workers get only what they need, return only key findings
3. **Model Matching** — assign model tier to task complexity
4. **Fail Isolated** — worker failure doesn't crash the orchestrator
5. **Verify Before Trust** — orchestrator validates worker output

### Dynamic Agent Factory

Create agents with runtime-configurable behavior:

```typescript
function createReviewAgent(strictness: "standard" | "strict"): AgentDefinition {
  const isStrict = strictness === "strict";
  return {
    description: `Code reviewer (${strictness} mode)`,
    prompt: `Review code with ${isStrict ? "zero tolerance" : "balanced pragmatism"}.
${isStrict ? "Flag ALL deviations." : "Focus on high-impact issues only."}`,
    tools: ["Read", "Grep", "Glob"],
    model: isStrict ? "opus" : "sonnet"
  };
}
```

### Subagent Constraints

Key limitations to design around:

1. **No nesting** — subagents cannot spawn sub-subagents; never include `Task` in subagent tools
2. **Context isolation** — subagents have separate context windows, don't see parent conversation
3. **Permission inheritance** — `bypassPermissions` propagates unconditionally to all subagents
4. **Prompt limits** — keep subagent prompts under 8,000 chars on Windows (CLI length limits)
5. **Session persistence** — subagent transcripts persist independently and can be resumed

### Tool Selection by Agent Role

| Role | Tools | Rationale |
|------|-------|-----------|
| Reader/Analyzer | `Read`, `Grep`, `Glob` | Read-only, can't modify |
| Code Writer | `Read`, `Write`, `Edit`, `Glob`, `Grep` | Full file access, no shell |
| Test Runner | `Bash`, `Read`, `Grep` | Can execute, no write |
| Full Developer | `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep` | Everything except Task |
| Orchestrator | `Read`, `Grep`, `Glob`, `Task` | Delegates, doesn't implement |

---

## Decision Framework: Model Selection

```
Is this a simple lookup/search/formatting?
  → haiku ($1/$5 per MTok)
Does it require multi-step reasoning?
  → No: haiku
  → Yes:
    Involves security, architecture, or complex debugging?
      → No: sonnet ($3/$15 per MTok)
      → Yes: opus ($5/$25 per MTok)
```

| Task | Model | Rationale |
|------|-------|-----------|
| File search, formatting | `haiku` | Fast, cheap workers |
| Code review, implementation | `sonnet` | 90% of development work |
| Architecture, security audit | `opus` | Complex reasoning only |
| Subagent workers | `haiku`/`sonnet` | Match task complexity |
| Orchestrator | `sonnet` | Planning + delegation |

### Cost Control Templates

```typescript
const prodOptions   = { maxTurns: 30,  maxBudgetUsd: 2.0,  model: "sonnet" };
const ciOptions     = { maxTurns: 10,  maxBudgetUsd: 0.50, model: "haiku"  };
const researchOpts  = { maxTurns: 100, maxBudgetUsd: 10.0, model: "opus"   };
```

### Effort Level Control (v0.2.68+)

The `EffortLevel` type (`"low" | "medium" | "high" | "max"`) controls reasoning depth. Since v0.2.68, default effort for Sonnet 4.6 changed from `"high"` to `"medium"`. Override explicitly when needed:

```typescript
import type { EffortLevel } from "@anthropic-ai/claude-agent-sdk";

// High-effort for complex tasks
const complexOpts = { model: "sonnet", maxThinkingTokens: 16000 };

// Low-effort for simple workers
const workerOpts  = { model: "haiku" };
```

### Strict Tool Allowlists (v0.2.65+)

Use the `tools` option (distinct from `allowedTools`) for strict control over built-in tools:

```typescript
// Only Bash and Read — no Edit, no Write, no Glob
const readOnlyRunner = { tools: ["Bash", "Read"] };

// Disable ALL built-in tools — only MCP tools available
const mcpOnly = { tools: [] };

// All default tools explicitly
const allTools = { tools: { type: "preset", preset: "claude_code" } };
```

---

## Prompt Caching (10x Cost Reduction)

SDK auto-caches prompts. Maximize hits by:

1. **Stable system prompts** — static instructions first, dynamic content last
2. **Consistent tool list** — changing tools between calls breaks cache
3. **`appendSystemPrompt`** for dynamic content — preserves cache prefix

```typescript
// Cache-friendly
const opts = {
  systemPrompt: "You are an expert code reviewer...",      // Cached after first call
  appendSystemPrompt: `PR #${prNumber}: ${description}`    // Dynamic, doesn't break cache
};

// Cache-busting (BAD)
const opts = { systemPrompt: `Review code. Time: ${Date.now()}` }; // Never cached
```

**Economics:** Write 1.25x, Read 0.1x base cost. Break-even: 2 calls. TTL: 5min (default) or 1hr (2x cost). Min cacheable: 1,024 tokens.

---

## Parallelization

```typescript
const [security, performance, tests] = await Promise.all([
  collectResults(query({ prompt: "Audit security",    options: { model: "opus",   maxTurns: 20 } })),
  collectResults(query({ prompt: "Profile performance", options: { model: "sonnet", maxTurns: 15 } })),
  collectResults(query({ prompt: "Run test suite",     options: { model: "haiku",  maxTurns: 10 } }))
]);

async function collectResults(q: AsyncIterable<SDKMessage>): Promise<string> {
  let result = "";
  for await (const msg of q) { if ("result" in msg) result = msg.result ?? ""; }
  return result;
}
```

---

## Security: Defense in Depth

```
Layer 1: Tool Restrictions     → allowedTools whitelist
Layer 2: Permission Rules      → deny/allow/ask rules
Layer 3: PreToolUse Hooks      → runtime validation
Layer 4: Sandbox Isolation     → filesystem + network restrictions
Layer 5: Credential Proxy      → secrets outside agent boundary
Layer 6: Audit Logging         → PostToolUse hooks for compliance
```

### Production Hook Pattern

```typescript
const blockDangerousOps: HookCallback = async (input) => {
  const { tool_name, tool_input } = input as PreToolUseHookInput;

  // Block sensitive file access
  if (["Read", "Write", "Edit"].includes(tool_name)) {
    const path = (tool_input?.file_path as string) ?? "";
    if ([".env", ".ssh", ".aws", "credentials", ".secret"].some(b => path.includes(b))) {
      return { hookSpecificOutput: {
        hookEventName: input.hook_event_name,
        permissionDecision: "deny",
        permissionDecisionReason: `Sensitive path blocked: ${path}`
      }};
    }
  }

  // Block dangerous commands
  if (tool_name === "Bash") {
    const cmd = (tool_input?.command as string) ?? "";
    if (["rm -rf", "sudo", "chmod 777", "curl.*|.*sh"].some(d => new RegExp(d).test(cmd))) {
      return { hookSpecificOutput: {
        hookEventName: input.hook_event_name,
        permissionDecision: "deny",
        permissionDecisionReason: `Dangerous command blocked: ${cmd}`
      }};
    }
  }
  return {};
};
```

### Credential Proxy (Never expose secrets to agents)

```
Agent boundary: agent → localhost:8080 (no auth)
Secure boundary: proxy validates allowlist → injects credentials → forwards to real API
Agent never sees the credential.
```

### Container Isolation

```bash
docker run \
  --cap-drop ALL --security-opt no-new-privileges --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --tmpfs /workspace:rw,noexec,size=500m \
  --network none --memory 2g --cpus 2 --pids-limit 100 \
  --user 1000:1000 \
  -v /path/to/code:/workspace:ro \
  agent-image
```

Alternative: `@anthropic-ai/sandbox-runtime` for dev/CI without Docker.

---

## Agent Prompt Engineering

### Description Writing

The `description` field determines when Claude delegates to a subagent. Write it like a function docstring with clear trigger conditions:

```typescript
// GOOD — clear trigger conditions
{ description: "Security code review specialist. Use when reviewing auth, input handling, encryption, or code touching user data." }

// BAD — vague, Claude won't know when to delegate
{ description: "Reviews code." }
```

### Structured Subagent Prompts

```typescript
{
  prompt: `You are a [ROLE] specialist.

## Task
[What this agent does]

## Methodology
1. [Step 1]
2. [Step 2]

## Output Format
- [Required fields and structure]

## Constraints
- [Limitation 1]
- [Limitation 2]`
}
```

### Concise System Prompts (Token Efficiency)

```typescript
// VERBOSE (wastes tokens every call — 500+ tokens):
"You are an incredibly talented senior software engineer with over 20 years of experience..."

// CONCISE (same behavior — ~30 tokens):
"Expert TypeScript/React/NestJS reviewer. Focus: type safety, error handling, security, performance. Be concise. Cite file:line."
```

---

## Self-Verification Loop

```typescript
for await (const message of query({
  prompt: `Implement the feature, then verify:
1. Write the code
2. Run linter (must pass)
3. Run type checker (must pass)
4. Run tests (must pass)
5. If any check fails, fix and re-verify`,
  options: {
    allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    permissionMode: "acceptEdits",
    maxTurns: 50
  }
})) {
  // Agent self-corrects until all checks pass
}
```

---

## Graceful Degradation

```typescript
async function runAgentWithFallback(prompt: string): Promise<string> {
  try {
    return await runWithModel(prompt, "sonnet", 30, 3.0);
  } catch {
    console.warn("Sonnet failed, falling back to haiku");
    return await runWithModel(prompt, "haiku", 15, 1.0);
  }
}
```

For progressive budgeting, start with small budget and escalate: `$0.50 → $2.00 → $5.00`. See `knowledge-base/05-deployment.md` for retry-with-backoff and full error handling patterns.

---

## Evaluation Framework

```typescript
interface EvalCase {
  name: string;
  prompt: string;
  expectedTools: string[];
  forbiddenTools: string[];
  resultContains: string[];
  maxTurns: number;
  maxCostUsd: number;
}

const evalSuite: EvalCase[] = [
  {
    name: "read-only-analysis",
    prompt: "Analyze auth module for security issues",
    expectedTools: ["Read", "Grep", "Glob"],
    forbiddenTools: ["Write", "Edit", "Bash"],
    resultContains: ["security", "vulnerability"],
    maxTurns: 15, maxCostUsd: 1.0
  }
];

// Track tools via PostToolUse hook, validate assertions after run
// See knowledge-base/04-evaluation.md for full runner implementation
```

---

## Observability

```typescript
interface AgentLog {
  timestamp: string;
  session_id: string;
  event: string;
  tool?: string;
  input?: unknown;
  duration_ms?: number;
  cost_usd?: number;
}

// PreToolUse: record start time in Map<toolUseID, timestamp>
// PostToolUse: calculate duration, emit structured log
// SessionStart/Stop: lifecycle tracking
// SubagentStart/Stop: subagent lifecycle
// See knowledge-base/06-observability.md for full implementation
```

---

## Context Management

Long-running agents degrade without context management:

1. **Subagent isolation** — each gets clean context; return summaries, not raw data
2. **Session resume** — `options: { resume: sessionId }` continues with full history
3. **Auto-compaction** — SDK handles overflow; use PreCompact hook to archive state

---

## Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| `bypassPermissions` in prod | `acceptEdits` + hooks |
| Single monolithic agent | Orchestrator + specialized workers |
| No cost limits | Always set `maxTurns` + `maxBudgetUsd` |
| Credentials in agent env | Proxy pattern outside boundary |
| Opus for everything | Haiku workers, Sonnet default, Opus critical paths |
| No audit logging | PostToolUse hooks for every tool call |
| Untrusted input without sandbox | Container/sandbox isolation |
| Ignoring `result.is_error` | Always check and handle error states |
| Timestamps in system prompt | Static prefix + `appendSystemPrompt` for dynamic |
| Subagents with Task tool | Remove Task from subagent tools |

---

## Quick Reference

| Task | Pattern | Key Options |
|------|---------|-------------|
| Multi-agent system | Orchestrator + subagents | `agents`, `allowedTools: [..., "Task"]` |
| Security hardening | Hooks + sandbox + proxy | `hooks.PreToolUse`, `permissionMode` |
| Cost optimization | Model routing + caching | `model`, `maxBudgetUsd`, stable prompts |
| Parallel execution | `Promise.all` on queries | Independent `query()` calls |
| Audit trail | PostToolUse logging | `hooks.PostToolUse` with structured logs |
| Self-verification | Verify-fix loop | Linter/tester in prompt, `maxTurns` budget |
| Session continuity | Resume sessions | `resume: sessionId` |
| CI/CD integration | Tight limits | `maxTurns: 10`, `model: "haiku"` |

---

## Deep Dive References

| Need | Load |
|------|------|
| Architecture patterns (pipeline, fan-out, supervisor, multi-perspective) | `knowledge-base/01-architecture.md` |
| Performance & cost optimization (caching, parallelization, budgeting) | `knowledge-base/02-performance.md` |
| Security hardening (threat model, hooks, container, proxy) | `knowledge-base/03-security.md` |
| Evaluation & testing (eval runner, CI integration, A/B testing) | `knowledge-base/04-evaluation.md` |
| Production deployment (Docker, K8s, health checks, config) | `knowledge-base/05-deployment.md` |
| Observability & monitoring (logging, metrics, tracing, alerting) | `knowledge-base/06-observability.md` |

---

## Resources

- [Agent SDK Overview](https://platform.claude.com/docs/en/agent-sdk/overview)
- [Secure Deployment Guide](https://platform.claude.com/docs/en/agent-sdk/secure-deployment)
- [Subagents Documentation](https://platform.claude.com/docs/en/agent-sdk/subagents)
- [Hooks Reference](https://platform.claude.com/docs/en/agent-sdk/hooks)
- [Permissions Guide](https://platform.claude.com/docs/en/agent-sdk/permissions)
- [TypeScript SDK Reference](https://platform.claude.com/docs/en/agent-sdk/typescript)
- [Prompt Caching Guide](https://platform.claude.com/docs/en/build-with-claude/prompt-caching)
- [Example Agents Repository](https://github.com/anthropics/claude-agent-sdk-demos)

---

**Version:** SDK ~0.2.86 | **Source:** https://github.com/anthropics/claude-agent-sdk-typescript
