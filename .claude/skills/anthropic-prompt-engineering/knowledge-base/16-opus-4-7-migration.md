# Claude Opus 4.7 Migration Guide

**Migrating from Opus 4.6 (or earlier) to Opus 4.7 — breaking changes, behavior shifts, and the checklist to work through before shipping.**

---

## At a Glance

| Axis | Opus 4.6 | Opus 4.7 |
|------|----------|----------|
| Model ID | `claude-opus-4-6` | `claude-opus-4-7` |
| Thinking modes | adaptive + manual (`budget_tokens`) | **adaptive only** |
| Thinking default | on (implicit in many clients) | **off** — explicit `type: "adaptive"` required |
| Thinking display default | `"summarized"` | **`"omitted"`** |
| Sampling params | `temperature`, `top_p`, `top_k` supported | **removed** — any non-default → 400 |
| Prefill | supported (some caveats) | **rejected** — 400 |
| Effort levels | low / medium / high / max | **low / medium / high / xhigh / max** |
| Recommended starting effort (coding) | `high` | **`xhigh`** |
| Beta headers (effort / interleaved-thinking / tool-streaming) | required | **GA — remove headers** |
| Tokenizer | v1 | **new — 1.0–1.35× more tokens for same text** |
| Context | 200k / 1M (tier-dependent) | 1M baseline |
| Max output tokens | 32k | 128k |
| Task budgets | n/a | **beta: `task-budgets-2026-03-13`** |
| Pricing (input / output per MTok) | varies | $5 / $25 |
| Cache write / read (per MTok) | varies | $6.25 / $0.50 |

---

## Breaking Changes (fix before shipping)

### 1. Thinking Configuration

```typescript
// ❌ Opus 4.7 rejects with 400
{
  model: "claude-opus-4-7",
  thinking: {
    type: "enabled",
    budget_tokens: 16000,
  },
}

// ✅ Opus 4.7 correct form
{
  model: "claude-opus-4-7",
  thinking: { type: "adaptive" },
  output_config: { effort: "xhigh" },
  max_tokens: 64000,
}
```

**Why**: Opus 4.7 decides thinking depth adaptively based on task complexity and the `effort` setting. Manual `budget_tokens` is incompatible.

### 2. Sampling Parameters Removed

```typescript
// ❌ Rejected with 400
{
  model: "claude-opus-4-7",
  temperature: 0.2,
  top_p: 0.9,
  top_k: 40,
}

// ✅ Correct — tune behavior via prompt
{
  model: "claude-opus-4-7",
  // no sampling params
}
```

**Why**: Behavior is tuned via prompting and `effort` only. For deterministic outputs, specify output format constraints in the prompt (Structured Outputs, XML tags).

### 3. Prefill Rejected

```typescript
// ❌ Rejected with 400 on Opus 4.7
{
  model: "claude-opus-4-7",
  messages: [
    { role: "user", content: "..." },
    { role: "assistant", content: "{\"result\":" },  // prefill
  ],
}

// ✅ Correct — use Structured Outputs or XML tags
{
  model: "claude-opus-4-7",
  output_config: {
    format: {
      type: "json_schema",
      schema: { /* ... */ },
    },
  },
  messages: [
    { role: "user", content: "... Respond as JSON." },
  ],
}
```

### 4. Thinking Display Default Changed

```typescript
// If your streaming UI depends on visible reasoning, OPT IN
{
  model: "claude-opus-4-7",
  thinking: {
    type: "adaptive",
    display: "summarized",  // 4.7 default is "omitted"
  },
}
```

**Why**: On 4.6 the default was `"summarized"` (reasoning visible in stream). On 4.7 it's `"omitted"` (reasoning hidden). UIs that relied on the old default now show a silent pause during reasoning.

### 5. GA'd Beta Headers — Remove

```typescript
// ❌ Don't send these on Opus 4.7 (all GA)
headers: {
  "anthropic-beta":
    "effort-2025-11-24,fine-grained-tool-streaming-2025-05-14,interleaved-thinking-2025-05-14",
}

// ✅ Either remove entirely, or keep only still-beta headers
headers: {
  "anthropic-beta": "task-budgets-2026-03-13",
}
```

### 6. Tokenizer Change — Re-budget

Opus 4.7 uses a new tokenizer that produces **1.0–1.35× more tokens** than Opus 4.6 for the same text.

```typescript
// `count_tokens` returns different numbers for identical input
const tokens46 = await client.messages.countTokens({
  model: "claude-opus-4-6",
  messages,
});

const tokens47 = await client.messages.countTokens({
  model: "claude-opus-4-7",
  messages,
});
// tokens47 may be 1.0x–1.35x larger than tokens46
```

**Action items:**
- Re-benchmark `max_tokens` budgets — old limits may truncate responses that fit before
- Recalculate cost estimates for high-volume workloads
- Re-validate token-based user quotas against new counts
- Cache keys may change — verify prompt cache hit rates after migration

---

## Behavior Changes (prompt adjustments required)

### 1. Literal Instruction Following

Opus 4.7 does NOT silently generalize. State scope explicitly.

| Ambiguous (4.7 may apply narrowly) | Explicit (4.7 applies as intended) |
|------------------------------------|------------------------------------|
| "Add input validation" | "Add Zod input validation to every exported function in `src/capabilities/`" |
| "Fix the bug" | "Fix the bug in `src/auth/token.ts` AND check for the same pattern in `src/auth/refresh.ts`" |
| "Update the docs" | "Update every .md file under `docs/specs/auth/` to reflect the new SessionService API" |

### 2. Fewer Tool Calls + Subagents by Default

4.7 reasons more, acts less. Opposite of 4.6's "over-action" tendency.

- To increase tool calls → raise effort (`xhigh`/`max`)
- To increase subagents → explicitly specify when fan-out is warranted

```markdown
## When to Spawn Subagents (include in system prompt)
Spawn a subagent ONLY if all three hold:
- Work is independent of current context (no back-reference needed)
- Work requires reading >10 files or making >5 tool calls
- Parallel branches cannot conflict
```

### 3. Built-In Progress Updates

Remove scaffolding that forced progress messages:

```markdown
❌ Obsolete on 4.7
"Every 5 tool calls, emit a progress summary."
"After each phase, tell me what you just did."

✅ Trust native behavior — 4.7 emits progress naturally during long traces.
```

### 4. Verbosity Calibration

4.7 adjusts length to task complexity. For strict length requirements, state them:

```markdown
## Output Constraints
- Total response: under 150 words
- Format: bulleted list, max 5 bullets
- Tone: matter-of-fact, no hedging
```

### 5. Tone Change

4.7 is more direct and opinionated than 4.6. If your product needs softer tone, specify:

```markdown
## Communication Style
- Acknowledge edge cases the user raises before proposing solutions
- Use matter-of-fact language without reassurance phrases
- When disagreeing, state the disagreement openly
```

### 6. Stricter Effort Adherence

At `low`/`medium`, 4.7 honors the effort literally — output may be shallower than 4.6's output at the same level. Fix by raising effort rather than prompting around it.

### 7. Code Review Recall

4.7 honors "only high-severity" literally, reducing recall. Flip the pattern:

```markdown
Report EVERY issue you find (critical, high, medium, low, nit).
Include a `severity` field per issue. We filter downstream.
```

### 8. Design House Style

4.7 has a persistent cream/serif default aesthetic. For variety:

```markdown
Before building, propose FOUR visual directions as a table (palette, typography, feel).
Wait for my selection.
```

### 9. Memory Tool Pairing

4.7's memory-tool writing/retrieval is noticeably better. For long-horizon agents:

```markdown
## Session Initializer
Read memory://project-state.md and resume from "Next steps".

## Session Update
Write to memory://project-state.md: current state, in-flight work, next steps.
```

### 10. High-Resolution Vision

- Up to 2576px / 3.75MP (3× prior resolution)
- **1:1 pixel-to-coordinate mapping** (no scale factor)
- Critical for computer-use, screenshot analysis, and any task where pixel-precise coordinates matter

---

## Task Budgets (New on 4.7)

Advisory cap across a full agentic loop. Beta.

```typescript
headers: {
  "anthropic-beta": "task-budgets-2026-03-13",
}

{
  model: "claude-opus-4-7",
  thinking: { type: "adaptive" },
  task_budget: {
    total: 100000,  // minimum 20000
  },
  max_tokens: 64000,
}
```

### Rules

| Rule | Why |
|------|-----|
| `total` minimum is 20000 | Below that, the loop cannot make meaningful progress |
| `max_tokens` remains the hard per-request ceiling | Task budget is advisory; per-request cap still enforced |
| **Never mutate `task_budget.remaining` manually** | **Invalidates prompt cache**. Server tracks it. |
| Read `remaining` from responses for compaction-aware loops | When below threshold, compact context |

---

## Migration Checklist

Before shipping any request to `claude-opus-4-7`:

### Request-level
- [ ] Model ID is `claude-opus-4-7`
- [ ] `thinking.type === "adaptive"` if thinking is used (never `"enabled"`)
- [ ] No `budget_tokens` field anywhere
- [ ] No `temperature`, `top_p`, or `top_k`
- [ ] No prefill (no assistant message before the final user turn with partial content)
- [ ] `max_tokens >= 64000` if effort is `xhigh` or `max`
- [ ] `display: "summarized"` set if UI depends on visible reasoning
- [ ] Removed beta headers: `effort-2025-11-24`, `fine-grained-tool-streaming-2025-05-14`, `interleaved-thinking-2025-05-14`
- [ ] `task_budget.remaining` is never set manually

### Cost + tokenization
- [ ] Re-ran `count_tokens` on representative inputs (expect 1.0–1.35× increase)
- [ ] Re-budgeted `max_tokens` to account for longer token sequences
- [ ] Re-estimated per-request cost using new pricing ($5 in / $25 out / $6.25 cache write / $0.50 cache read per MTok)
- [ ] Updated per-user quotas if they are token-based

### Prompt-level
- [ ] Scope stated explicitly (no "fix the bug" — name files/functions)
- [ ] Subagent fan-out criteria explicit in system prompt (if using subagents)
- [ ] Removed "emit progress every N steps" scaffolding
- [ ] Length/verbosity stated explicitly if product depends on it
- [ ] Tone stated explicitly if product needs softer style
- [ ] Code review prompts use "report all, filter downstream" pattern
- [ ] Design tasks use "propose options before building" if variety matters

### Operational
- [ ] Streaming UIs tested with `display: "omitted"` default (or opted into `"summarized"`)
- [ ] Memory tool paired in any multi-session agents
- [ ] Monitoring/telemetry updated for new token counts
- [ ] Prompt cache hit rates verified after migration

---

## Full Example: 4.6 → 4.7 Coding Agent

```typescript
// BEFORE — Opus 4.6
const request46 = {
  model: "claude-opus-4-6",
  thinking: {
    type: "enabled",
    budget_tokens: 16000,
  },
  temperature: 0.2,
  max_tokens: 32000,
  system: CODING_SYSTEM_PROMPT,
  tools: [/* ... */],
  messages,
};

const headers46 = {
  "anthropic-beta": "effort-2025-11-24,interleaved-thinking-2025-05-14",
};
```

```typescript
// AFTER — Opus 4.7
const request47 = {
  model: "claude-opus-4-7",
  thinking: {
    type: "adaptive",
    display: "summarized",  // restore visible reasoning
  },
  output_config: {
    effort: "xhigh",  // recommended start for coding
  },
  // no temperature / top_p / top_k
  max_tokens: 64000,  // minimum at xhigh
  system: CODING_SYSTEM_PROMPT_47,  // revised for literal instruction following
  tools: [/* ... */],
  messages,
};

const headers47 = {
  "anthropic-beta": "task-budgets-2026-03-13",  // only if using task budgets
};

// And update the system prompt for 4.7 behavior:
const CODING_SYSTEM_PROMPT_47 = `
You are a coding agent.

## Scope (explicit)
You may edit files under src/. You may NOT edit: migration files, package.json, tsconfig.json without explicit user approval.

## Subagent Policy
Spawn a subagent ONLY if: work is independent of current context, requires >10 file reads, and branches cannot conflict.

## Output
Report every finding (bug, style, perf). Tag severity. Do not filter.
`;
```

---

## Rollback Plan

If migration reveals issues you cannot immediately fix:

1. Switch model ID back to `claude-opus-4-6`
2. Restore sampling params (`temperature`, etc.) if you were using them
3. Restore `budget_tokens` for manual thinking control
4. Restore removed beta headers (4.6 may still require them)
5. Remove task budgets (not supported on 4.6)
6. Restore `max_tokens` to 4.6 budget (up to 32k)

Keep both configs behind a feature flag until 4.7 performance is validated on your workload.

---

**See Also**: [05-extended-thinking.md](05-extended-thinking.md), [06-tool-use.md](06-tool-use.md), [07-agentic-prompts.md](07-agentic-prompts.md), [09-optimization.md](09-optimization.md)

**Sources**:
- https://platform.claude.com/docs/en/about-claude/models/migration-guide
- https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7
- https://platform.claude.com/docs/en/about-claude/models/overview
- https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
- https://platform.claude.com/docs/en/build-with-claude/effort
- https://platform.claude.com/docs/en/build-with-claude/task-budgets
- https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices
- https://claude.com/blog/best-practices-for-using-claude-opus-4-7-with-claude-code

**Version**: Claude 4.7 (Opus 4.7)
