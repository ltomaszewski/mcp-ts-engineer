# Agent Architecture Patterns

Production-grade architecture patterns for multi-agent systems with the Claude Agent SDK.

---

## Core Architecture: Orchestrator + Workers

The most stable production pattern: one orchestrator plans and delegates, specialized workers execute.

```
┌─────────────────────────────────┐
│         ORCHESTRATOR            │
│  (Sonnet - plans, delegates)    │
├─────────────────────────────────┤
│  1. Parse task requirements     │
│  2. Select appropriate workers  │
│  3. Delegate subtasks           │
│  4. Synthesize results          │
│  5. Verify quality              │
└────┬──────────┬──────────┬──────┘
     │          │          │
┌────▼────┐ ┌──▼────┐ ┌──▼──────┐
│ Worker1 │ │Worker2│ │ Worker3 │
│ (Haiku) │ │(Sonnet│ │ (Opus)  │
│ Search  │ │ Code) │ │Security │
└─────────┘ └───────┘ └─────────┘
```

### Key Design Principles

1. **Single Responsibility** — Each agent does one thing well
2. **Minimal Context** — Workers get only what they need, return only key findings
3. **Model Matching** — Assign model tier to task complexity
4. **Fail Isolated** — Worker failure doesn't crash the orchestrator
5. **Verify Before Trust** — Orchestrator validates worker output

---

## Pattern 1: Pipeline Architecture

Sequential processing where each stage transforms input for the next.

```typescript
import { query, type AgentDefinition } from "@anthropic-ai/claude-agent-sdk";

// Stage-based pipeline: analyze → implement → verify → fix
const pipelineAgents: Record<string, AgentDefinition> = {
  "analyzer": {
    description: "Analyzes codebase and identifies what needs to change. Use FIRST before any implementation.",
    prompt: `Analyze the codebase and produce a structured plan:
1. List all files that need changes
2. For each file, describe the specific change
3. Identify dependencies between changes
4. Flag any risks or edge cases
Return a JSON plan with {files: [{path, change, risk}], order: string[]}.`,
    tools: ["Read", "Grep", "Glob"],
    model: "sonnet"
  },
  "implementer": {
    description: "Implements code changes following an analysis plan. Use AFTER analyzer.",
    prompt: `You receive an implementation plan. For each change:
1. Read the target file
2. Make the precise edit described
3. Verify the edit doesn't break imports/types
Keep changes minimal and focused.`,
    tools: ["Read", "Edit", "Write", "Grep", "Glob"],
    model: "sonnet"
  },
  "verifier": {
    description: "Runs tests and type checks to verify changes. Use AFTER implementer.",
    prompt: `Verify all changes are correct:
1. Run the type checker
2. Run the linter
3. Run affected tests
4. Report pass/fail with specific errors for failures.`,
    tools: ["Bash", "Read", "Grep"],
    model: "haiku"
  }
};

for await (const message of query({
  prompt: `Execute this pipeline for adding input validation to the auth module:
1. Use the analyzer to plan changes
2. Use the implementer to make changes
3. Use the verifier to validate
If verification fails, use implementer to fix, then verify again.`,
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Task"],
    agents: pipelineAgents,
    maxTurns: 60,
    maxBudgetUsd: 5.0
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

---

## Pattern 2: Fan-Out / Fan-In

Parallel execution with result aggregation. Best for independent analyses.

```typescript
const analysisAgents: Record<string, AgentDefinition> = {
  "security-audit": {
    description: "Security vulnerability scanner.",
    prompt: `Scan for OWASP Top 10 vulnerabilities:
- Injection (SQL, NoSQL, command)
- Broken authentication
- Sensitive data exposure
- Security misconfiguration
Rate each finding: Critical/High/Medium/Low.`,
    tools: ["Read", "Grep", "Glob"],
    model: "opus"
  },
  "performance-audit": {
    description: "Performance bottleneck analyzer.",
    prompt: `Identify performance issues:
- N+1 database queries
- Missing indexes
- Memory leaks
- Unnecessary re-renders (React)
- Synchronous I/O blocking
Estimate impact: High/Medium/Low.`,
    tools: ["Read", "Grep", "Glob"],
    model: "sonnet"
  },
  "code-quality": {
    description: "Code quality and maintainability reviewer.",
    prompt: `Review for maintainability:
- Functions >50 lines
- Files >300 lines
- Nesting >3 levels
- Missing error handling
- Dead code
Report with file:line references.`,
    tools: ["Read", "Grep", "Glob"],
    model: "sonnet"
  }
};

// Orchestrator runs all three in parallel and synthesizes
for await (const message of query({
  prompt: `Run ALL three audits in PARALLEL on the src/ directory:
1. security-audit
2. performance-audit
3. code-quality
After all complete, synthesize a unified report with prioritized action items.`,
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Task"],
    agents: analysisAgents,
    maxTurns: 40,
    maxBudgetUsd: 8.0
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

---

## Pattern 3: Supervisor with Retry

A supervisor agent monitors worker output and retries on failure.

```typescript
const supervisedAgents: Record<string, AgentDefinition> = {
  "code-writer": {
    description: "Writes code. May need multiple attempts to get it right.",
    prompt: `Write clean, tested code. After writing:
1. Verify it compiles
2. Run tests if they exist
3. Report success or specific failure`,
    tools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],
    model: "sonnet"
  }
};

// Supervisor prompt with retry logic
for await (const message of query({
  prompt: `You are a supervisor. Delegate the implementation to code-writer.
If the worker reports failure:
1. Analyze what went wrong
2. Provide specific corrective instructions
3. Delegate again with those instructions
Maximum 3 retry attempts. If still failing after 3 tries, report the issue.

Task: Add rate limiting to the /api/login endpoint`,
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Task"],
    agents: supervisedAgents,
    maxTurns: 50,
    maxBudgetUsd: 5.0
  }
})) {
  if ("result" in message) console.log(message.result);
}
```

---

## Pattern 4: Multi-Perspective Review

Multiple agents review the same artifact from different angles.

```typescript
const reviewerAgents: Record<string, AgentDefinition> = {
  "correctness-reviewer": {
    description: "Reviews code for logical correctness and edge cases.",
    prompt: "Focus on: logic errors, off-by-one bugs, null handling, race conditions, edge cases.",
    tools: ["Read", "Grep", "Glob"],
    model: "sonnet"
  },
  "security-reviewer": {
    description: "Reviews code for security vulnerabilities.",
    prompt: "Focus on: injection, auth bypass, data exposure, IDOR, SSRF, secrets in code.",
    tools: ["Read", "Grep", "Glob"],
    model: "opus"
  },
  "api-reviewer": {
    description: "Reviews API design for consistency and best practices.",
    prompt: "Focus on: REST conventions, error responses, pagination, versioning, documentation.",
    tools: ["Read", "Grep", "Glob"],
    model: "sonnet"
  }
};
```

---

## Pattern 5: Event-Driven Agent

Use hooks to trigger agent behavior based on tool events.

```typescript
import { query, type HookCallback } from "@anthropic-ai/claude-agent-sdk";

// Track file modifications and auto-format
const autoFormatter: HookCallback = async (input, toolUseID, { signal }) => {
  const postInput = input as PostToolUseHookInput;
  if (postInput.tool_name === "Edit" || postInput.tool_name === "Write") {
    const filePath = postInput.tool_input?.file_path as string;
    if (filePath?.endsWith(".ts") || filePath?.endsWith(".tsx")) {
      // Auto-format after edit
      return {
        additionalContext: `File ${filePath} was modified. Run prettier on it.`
      };
    }
  }
  return {};
};

// Auto-run tests when implementation files change
const autoTest: HookCallback = async (input) => {
  const postInput = input as PostToolUseHookInput;
  if (postInput.tool_name === "Edit") {
    const path = postInput.tool_input?.file_path as string;
    if (path?.includes("/src/") && !path?.includes("__tests__")) {
      return {
        additionalContext: `Source file ${path} changed. Run related tests to verify.`
      };
    }
  }
  return {};
};

const options = {
  hooks: {
    PostToolUse: [
      { matcher: "Edit|Write", hooks: [autoFormatter] },
      { matcher: "Edit", hooks: [autoTest] }
    ]
  }
};
```

---

## Agent Definition Best Practices

### Description Writing

The `description` field is how Claude decides when to use a subagent. Write it like a function docstring.

```typescript
// GOOD — clear trigger conditions
{
  description: "Security code review specialist. Use when reviewing auth, input handling, encryption, or any code touching user data."
}

// BAD — vague, Claude won't know when to delegate
{
  description: "Reviews code."
}
```

### Prompt Engineering for Agents

```typescript
{
  prompt: `You are a [ROLE] specialist.

## Task
[What this agent does]

## Methodology
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Output Format
- [Format specification]
- [Required fields]

## Constraints
- [Limitation 1]
- [Limitation 2]

## Examples
[Input] → [Expected output]`
}
```

### Tool Selection by Agent Type

| Agent Role | Tools | Rationale |
|------------|-------|-----------|
| Reader/Analyzer | `Read`, `Grep`, `Glob` | Read-only, can't modify |
| Code Writer | `Read`, `Write`, `Edit`, `Glob`, `Grep` | Full file access, no shell |
| Test Runner | `Bash`, `Read`, `Grep` | Can execute, can read, no write |
| Full Developer | `Read`, `Write`, `Edit`, `Bash`, `Glob`, `Grep` | Everything except Task |
| Orchestrator | `Read`, `Grep`, `Glob`, `Task` | Delegates, doesn't implement |

---

## Subagent Limitations

Key constraints to design around:

1. **No nesting** — Subagents cannot spawn their own subagents. Don't include `Task` in subagent tools.
2. **Context isolation** — Subagents have separate context windows. They don't see the parent's conversation.
3. **Permission inheritance** — `bypassPermissions` propagates to ALL subagents unconditionally.
4. **Windows prompt limits** — Keep subagent prompts under 8000 chars on Windows due to CLI length limits.
5. **Session persistence** — Subagent transcripts persist independently and can be resumed.

---

## Scaling Considerations

### Multi-Tenant Environments

```typescript
// Per-tenant isolation
function createTenantAgent(tenantId: string, tenantConfig: TenantConfig) {
  return query({
    prompt: tenantConfig.task,
    options: {
      cwd: `/tenants/${tenantId}/workspace`,  // Isolated workspace
      allowedTools: tenantConfig.allowedTools,
      maxBudgetUsd: tenantConfig.budgetLimit,
      maxTurns: tenantConfig.turnLimit,
      hooks: {
        PreToolUse: [{
          hooks: [createTenantGuard(tenantId)]  // Tenant-specific restrictions
        }]
      }
    }
  });
}
```

### Rate Limiting

```typescript
const rateLimiter: HookCallback = async (input) => {
  const key = `${input.session_id}:${(input as PreToolUseHookInput).tool_name}`;
  const count = incrementCounter(key, 60_000); // 1-minute window

  if (count > 100) {  // Max 100 tool calls per minute
    return {
      hookSpecificOutput: {
        hookEventName: input.hook_event_name,
        permissionDecision: "deny",
        permissionDecisionReason: "Rate limit exceeded"
      }
    };
  }
  return {};
};
```

---

**Version:** SDK ~0.2.86 | **Source:** https://platform.claude.com/docs/en/agent-sdk/overview
