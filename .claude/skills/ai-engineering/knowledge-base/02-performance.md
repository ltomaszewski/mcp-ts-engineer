# Performance & Cost Optimization

Battle-tested strategies for reducing cost, latency, and token usage in Claude Agent SDK systems.

---

## Cost Model

### Claude 4.6 Series Pricing (per million tokens)

| Model | Input | Output | Cache Write | Cache Read | Batch |
|-------|-------|--------|-------------|------------|-------|
| Haiku 4.5 | $1 | $5 | $1.25 | $0.10 | 50% off |
| Sonnet 4.6 | $3 | $15 | $3.75 | $0.30 | 50% off |
| Opus 4.6 | $5 | $25 | $6.25 | $0.50 | 50% off |

**Key insight**: Cache reads are **10x cheaper** than base input. Prompt caching is the single highest-ROI optimization.

---

## Strategy 1: Model Routing

Match model capability to task complexity. Most tasks don't need Opus.

```typescript
type TaskComplexity = "trivial" | "standard" | "complex" | "critical";

function selectModel(complexity: TaskComplexity): "haiku" | "sonnet" | "opus" {
  switch (complexity) {
    case "trivial":   return "haiku";   // File listing, simple search, formatting
    case "standard":  return "sonnet";  // Code review, implementation, refactoring
    case "complex":   return "sonnet";  // Multi-file changes, debugging (sonnet handles most)
    case "critical":  return "opus";    // Security audit, architecture decisions, complex bugs
  }
}

// Apply to subagent definitions
const agents = {
  "file-finder": {
    description: "Find files by pattern",
    prompt: "Find files matching the criteria.",
    tools: ["Glob", "Grep"],
    model: "haiku"  // Trivial task
  },
  "code-reviewer": {
    description: "Review code quality",
    prompt: "Review code for issues.",
    tools: ["Read", "Grep", "Glob"],
    model: "sonnet"  // Standard task
  },
  "security-auditor": {
    description: "Deep security audit",
    prompt: "Perform thorough security analysis.",
    tools: ["Read", "Grep", "Glob"],
    model: "opus"  // Critical task
  }
};
```

### Model Selection Decision Tree

```
Is this a simple lookup/search?
  → Yes: haiku ($1/MTok input)
  → No:
    Does it require multi-step reasoning?
      → No: haiku
      → Yes:
        Does it involve security, architecture, or complex debugging?
          → No: sonnet ($3/MTok input)
          → Yes: opus ($5/MTok input)
```

---

## Strategy 2: Prompt Caching

### How It Works

The SDK automatically caches prompt prefixes. You optimize by structuring prompts for maximum cache reuse.

**Cache hierarchy**: tools → system prompt → messages

```typescript
// OPTIMAL: Static prefix, dynamic suffix
const options = {
  // 1. Tool definitions — cached across ALL calls (same tool set = cache hit)
  allowedTools: ["Read", "Write", "Edit", "Bash", "Glob", "Grep"],

  // 2. System prompt — static part cached, dynamic appended
  systemPrompt: `You are an expert code reviewer for a TypeScript monorepo.
Always check for:
- Type safety violations
- Missing error handling
- Security vulnerabilities
- Performance anti-patterns`,

  // 3. Dynamic context appended (doesn't break cache)
  appendSystemPrompt: `Current PR: #${prNumber}\nFiles changed: ${changedFiles.join(", ")}`
};
```

### Cache-Busting Anti-Patterns

```typescript
// BAD: Timestamp in system prompt — NEVER cached
systemPrompt: `You are a reviewer. Time: ${Date.now()}`

// BAD: Random ID in system prompt
systemPrompt: `Session: ${crypto.randomUUID()}. Review code.`

// BAD: Changing tool list between calls
// Call 1: allowedTools: ["Read", "Grep"]
// Call 2: allowedTools: ["Read", "Grep", "Glob"]  // Breaks cache!

// GOOD: Stable system prompt
systemPrompt: "You are a code reviewer. Focus on security and performance."

// GOOD: Dynamic content in appendSystemPrompt
appendSystemPrompt: `PR #${prNumber}: ${description}`

// GOOD: Consistent tool list
const STANDARD_TOOLS = ["Read", "Write", "Edit", "Bash", "Glob", "Grep"];
```

### Cache Economics

```
Scenario: 50 agent runs/day, 10K token system prompt each

Without cache:
  50 × 10K × $3/MTok = $1.50/day = $45/month

With cache (first call writes, 49 reads):
  Write: 1 × 10K × $3.75/MTok = $0.04
  Reads: 49 × 10K × $0.30/MTok = $0.15
  Total: $0.19/day = $5.70/month

Savings: 87%
```

### Minimum Cacheable Size

- **1,024 tokens** minimum for Claude 4.6 models
- Shorter prompts cannot be cached even with `cache_control`
- For short prompts, combine multiple instructions to hit the threshold

---

## Strategy 3: Token Reduction

### Concise System Prompts

```typescript
// VERBOSE (wastes tokens every call):
systemPrompt: `You are an incredibly talented and experienced senior software
engineer with over 20 years of experience in TypeScript, React, and NestJS.
You always write clean, well-tested, and well-documented code following all
best practices and industry standards...` // 500+ tokens

// CONCISE (same behavior, fewer tokens):
systemPrompt: `Expert TypeScript/React/NestJS reviewer.
Focus: type safety, error handling, security, performance.
Be concise. Cite file:line.` // ~30 tokens
```

### Structured Output for Reduced Response Tokens

```typescript
// Force structured output — prevents verbose explanations
for await (const message of query({
  prompt: "List all security issues in src/auth/",
  options: {
    outputSchema: {
      type: "object",
      properties: {
        issues: {
          type: "array",
          items: {
            type: "object",
            properties: {
              severity: { type: "string", enum: ["critical", "high", "medium", "low"] },
              file: { type: "string" },
              line: { type: "number" },
              description: { type: "string" }  // Short description, not essay
            }
          }
        },
        summary: { type: "string" }
      }
    }
  }
})) {
  if ("result" in message && message.structured_output) {
    const report = message.structured_output;
    // Process structured data directly
  }
}
```

### Subagent Context Isolation

Subagents have separate context windows. Use this to prevent context bloat.

```typescript
// BAD: Main agent reads 50 files, context fills up
prompt: "Read all files in src/ and find security issues"

// GOOD: Subagent reads files, returns only findings
agents: {
  "scanner": {
    description: "Scans files and returns only findings",
    prompt: "Scan files for issues. Return ONLY a list of findings with file:line references. Do NOT include file contents in your response.",
    tools: ["Read", "Grep", "Glob"],
    model: "haiku"  // Cheap scanner
  }
}
```

---

## Strategy 4: Execution Efficiency

### Reduce Turn Count

Each turn = API call = cost + latency. Minimize turns.

```typescript
// BAD: One tool per turn (agent asks permission for each)
// Turn 1: Read file A
// Turn 2: Read file B
// Turn 3: Read file C
// = 3 API calls

// GOOD: Agent reads multiple files in one turn
prompt: "Read all test files in src/__tests__/ and summarize the test coverage"
// Agent uses Glob first, then reads files in batch

// GOOD: Set permissionMode to avoid permission round-trips
options: {
  permissionMode: "acceptEdits",  // No permission prompts for edits
  // or use hooks to auto-approve specific patterns
}
```

### Batch Processing

```typescript
// Process multiple items with one agent call instead of N calls
// BAD: One agent per file
for (const file of files) {
  await runAgent(`Review ${file}`);  // N API sessions
}

// GOOD: One agent for all files
await runAgent(`Review these files: ${files.join(", ")}`);  // 1 API session
```

### Early Termination

```typescript
// Check result early and stop if already good
for await (const message of query({
  prompt: "Find the root cause of the auth bug",
  options: { maxTurns: 30 }
})) {
  if ("result" in message) {
    if (message.is_error) {
      console.error("Agent failed:", message.result);
      // Don't retry — investigate the error
    }
    if (message.subtype === "end_turn") {
      // Agent finished successfully
      break;
    }
  }
}
```

---

## Strategy 5: Parallelization

### Independent Tasks in Parallel

```typescript
// Sequential: ~60s total (20s each)
const s1 = await runAgent("Security audit");
const s2 = await runAgent("Performance audit");
const s3 = await runAgent("Test coverage");

// Parallel: ~20s total (all at once)
const [p1, p2, p3] = await Promise.all([
  runAgent("Security audit"),
  runAgent("Performance audit"),
  runAgent("Test coverage"),
]);
```

### Parallel with Aggregation

```typescript
async function parallelAudit(files: string[]): Promise<AuditReport> {
  // Fan out: one agent per file group
  const chunkSize = 10;
  const chunks = chunkArray(files, chunkSize);

  const results = await Promise.all(
    chunks.map((chunk, i) =>
      collectResults(query({
        prompt: `Review these files for issues: ${chunk.join(", ")}`,
        options: {
          model: "haiku",
          allowedTools: ["Read", "Grep"],
          maxTurns: 15,
          maxBudgetUsd: 0.50
        }
      }))
    )
  );

  // Fan in: aggregate results
  return mergeAuditResults(results);
}
```

---

## Strategy 6: Budget Management

### Progressive Budget Allocation

```typescript
// Start with a small budget, increase if needed
async function progressiveBudget(prompt: string): Promise<string> {
  const budgets = [0.50, 2.00, 5.00];  // Escalating budgets

  for (const budget of budgets) {
    let result = "";
    let hitBudget = false;

    for await (const msg of query({
      prompt,
      options: { maxBudgetUsd: budget, model: "sonnet" }
    })) {
      if ("result" in msg) {
        result = msg.result ?? "";
        if (msg.subtype === "budget_exceeded") hitBudget = true;
      }
    }

    if (!hitBudget) return result;
    console.log(`Budget $${budget} exceeded, escalating...`);
  }

  throw new Error("Task exceeded maximum budget");
}
```

### Cost Tracking per Agent

```typescript
const costTracker = new Map<string, number>();

const trackCost: HookCallback = async (input) => {
  // PostToolUse doesn't directly give cost, but we can estimate
  // Or track at the result message level
  return {};
};

// Track at result level
for await (const msg of query({ prompt, options })) {
  if ("result" in msg && msg.total_cost_usd) {
    costTracker.set("current-session", msg.total_cost_usd);
    console.log(`Session cost: $${msg.total_cost_usd.toFixed(4)}`);
  }
}
```

---

## Performance Benchmarks

### Typical Latency by Model

| Operation | Haiku | Sonnet | Opus |
|-----------|-------|--------|------|
| Simple tool call | ~1s | ~2s | ~3-5s |
| Multi-step analysis | ~5s | ~10s | ~15-20s |
| Complex reasoning | ~3s | ~8s | ~10-15s |
| 10-turn session | ~10s | ~20s | ~30-50s |

### Optimization Checklist

- [ ] Using haiku for simple/worker tasks
- [ ] System prompt is static (cache-friendly)
- [ ] `appendSystemPrompt` for dynamic content
- [ ] Tool list is consistent across calls
- [ ] `maxTurns` set for all production queries
- [ ] `maxBudgetUsd` set for all production queries
- [ ] Independent tasks parallelized with `Promise.all`
- [ ] Subagents return summaries, not raw data
- [ ] `permissionMode: "acceptEdits"` to reduce permission round-trips
- [ ] Structured output for predictable response format
- [ ] Batch processing instead of per-item agents

---

**Version:** SDK ~0.2.86 | **Source:** https://platform.claude.com/docs/en/agent-sdk/overview
