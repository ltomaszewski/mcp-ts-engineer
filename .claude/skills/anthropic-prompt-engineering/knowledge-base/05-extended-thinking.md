# Extended Thinking (Opus 4.7: Adaptive Mode Only)

**Claude Opus 4.7 uses adaptive thinking exclusively** — the model decides how much to think per task. Manual `budget_tokens` is rejected with 400. Thinking is OFF by default; must be explicitly enabled.

---

## Enabling Thinking on Opus 4.7

### Minimal: enable adaptive thinking

```typescript
{
  model: "claude-opus-4-7",
  thinking: { type: "adaptive" },
  max_tokens: 8192,
}
```

### Full: adaptive thinking + visible reasoning + xhigh effort for coding

```typescript
{
  model: "claude-opus-4-7",
  thinking: {
    type: "adaptive",
    display: "summarized",  // default is "omitted" on 4.7
  },
  output_config: {
    effort: "xhigh",  // recommended for coding/agentic on 4.7
  },
  max_tokens: 64000,  // minimum at xhigh/max effort
}
```

### Key behavioral defaults on Opus 4.7

| Field | Default on 4.7 | How to opt in | Why it matters |
|-------|----------------|---------------|----------------|
| `thinking` | undefined (off) | `{ type: "adaptive" }` | Thinking is opt-in on 4.7 |
| `thinking.display` | `"omitted"` | `"summarized"` | Streaming UIs that show reasoning need this |
| `output_config.effort` | `"high"` | `"xhigh"`, `"max"` | Harder tasks |
| Interleaved thinking | Always inside thinking blocks when adaptive is on | (automatic) | Inter-tool reasoning |

---

## Effort Levels (Opus 4.7)

Opus 4.7 is stricter about effort adherence than 4.6. Raise effort rather than prompt around shallow reasoning.

| Effort | When to use | `max_tokens` minimum | Notes |
|--------|-------------|----------------------|-------|
| `low` | Short scoped tasks, classification, extraction | 4096 | May produce shallow output even with detailed prompts |
| `medium` | Cost-sensitive with intelligence tradeoff | 8192 | Good for straightforward transformations |
| `high` | Default for most intelligence-sensitive work | 16000 | API default |
| `xhigh` | Coding, agentic loops, multi-step reasoning | 64000 | **Recommended starting point for coding/agentic on Opus 4.7** |
| `max` | Hardest problems; diminishing returns risk | 64000+ | Can over-think; pick `xhigh` unless measurable wins |

---

## Migrating from Opus 4.6 / earlier

### Breaking changes on Opus 4.7

```typescript
// ❌ REJECTED on Opus 4.7 (400 error)
{
  model: "claude-opus-4-7",
  thinking: {
    type: "enabled",
    budget_tokens: 16000,
  },
}

// ✅ CORRECT on Opus 4.7
{
  model: "claude-opus-4-7",
  thinking: { type: "adaptive" },
  output_config: { effort: "xhigh" },
}
```

```typescript
// ❌ REJECTED on Opus 4.7 (400 error)
{
  model: "claude-opus-4-7",
  temperature: 0.2,     // sampling params removed
  top_p: 0.9,
  top_k: 40,
}

// ✅ CORRECT — prompting is the only behavior lever
// Tune via explicit instructions in the system/user prompt
```

### Deprecated / removed beta headers

Remove these headers when migrating — now GA:
- `effort-2025-11-24` (effort parameter is GA)
- `fine-grained-tool-streaming-2025-05-14`
- `interleaved-thinking-2025-05-14`

### Task budgets (new beta on 4.7)

Task budgets provide an ADVISORY cap across the full agentic loop; `max_tokens` remains the hard per-request ceiling.

```typescript
// Enable via beta header
headers: {
  "anthropic-beta": "task-budgets-2026-03-13",
}

// In request
{
  model: "claude-opus-4-7",
  thinking: { type: "adaptive" },
  task_budget: {
    total: 100000,  // minimum 20000
    // Do NOT set `remaining` manually — server tracks it.
    // Mutating `remaining` invalidates prompt cache.
  },
  max_tokens: 64000,
}
```

---

## Thinking Display on Opus 4.7

The `display` field controls what reasoning content is returned to the client.

| Value | Behavior on 4.7 | Use when |
|-------|-----------------|----------|
| `"omitted"` | **Default.** No thinking content in the response stream | Production APIs where reasoning is not shown to end user |
| `"summarized"` | Summarized thinking content appears in `thinking` blocks | Streaming UIs that show reasoning; debugging |

**Streaming caveat**: with `"omitted"`, long-running reasoning appears as a silent pause before the text stream starts. If your UI expects progressive output during reasoning, opt into `"summarized"`.

---

## Sampling Parameters Removed on Opus 4.7

`temperature`, `top_p`, and `top_k` are not accepted. Any non-default value returns 400.

**Implications:**
- Prompting is the only behavior lever — if you need deterministic output, specify exact output format in the prompt (Structured Outputs, XML tags, JSON Schema)
- Test harnesses that swept `temperature` for exploration need to be redesigned
- Code that programmatically tuned `temperature` for "creative" vs "precise" modes must move that distinction into the prompt itself

---

## Interleaved Thinking on Opus 4.7

When adaptive thinking is enabled and the model uses tools, reasoning between tool calls is AUTOMATICALLY placed inside `thinking` blocks. No separate beta header needed (it was `interleaved-thinking-2025-05-14` before GA).

```typescript
// Opus 4.7 automatically interleaves thinking with tool use
{
  model: "claude-opus-4-7",
  thinking: { type: "adaptive", display: "summarized" },
  tools: [/* ... */],
  max_tokens: 64000,
}
// Response stream contains: thinking → tool_use → thinking → tool_use → ... → text
```

---

## Chain-of-Thought vs Adaptive Thinking

Adaptive thinking replaces most manual chain-of-thought prompting on Opus 4.7. You do NOT need to say "think step by step" when adaptive is enabled — the model handles reasoning depth automatically.

**Still useful when:**
- You want the final response to *include* reasoning inline (not hidden in thinking blocks) — e.g., pedagogical content, explained answers
- You are targeting multiple Claude model tiers and need portable prompting

**Redundant when:**
- Adaptive is on and `display: "summarized"` is set — you see the reasoning already
- The task is a single-step transformation — adaptive handles it

---

## Validation Checklist (Opus 4.7)

Before shipping any request to `claude-opus-4-7`:

- [ ] `thinking.type === "adaptive"` (never `"enabled"`)
- [ ] No `budget_tokens` field
- [ ] No `temperature`, `top_p`, or `top_k`
- [ ] `max_tokens >= 64000` if effort is `xhigh` or `max`
- [ ] `display: "summarized"` if UI depends on visible reasoning (default is `"omitted"`)
- [ ] No removed beta headers (`effort-2025-11-24`, `fine-grained-tool-streaming-2025-05-14`, `interleaved-thinking-2025-05-14`)
- [ ] No prefill (pre-filling assistant response is rejected on 4.7)
- [ ] Re-benchmark token counts — new tokenizer produces 1.0–1.35× more tokens than 4.6
- [ ] `task_budget.remaining` is not set manually (invalidates cache)

---

**See Also**: [06-tool-use.md](06-tool-use.md), [09-optimization.md](09-optimization.md), [16-opus-4-7-migration.md](16-opus-4-7-migration.md)

**Sources**:
- https://platform.claude.com/docs/en/build-with-claude/adaptive-thinking
- https://platform.claude.com/docs/en/build-with-claude/effort
- https://platform.claude.com/docs/en/about-claude/models/whats-new-claude-4-7
- https://platform.claude.com/docs/en/about-claude/models/migration-guide

**Version**: Claude 4.7 (Opus 4.7)
