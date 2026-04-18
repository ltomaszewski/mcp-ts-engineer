# 14: CLAUDE.md Architecture

**Source**: Claude Code source code analysis (`utils/claudemd.ts`, `utils/systemPrompt.ts`, `utils/attachments.ts`, `memdir/`)
**Principle**: CLAUDE.md is the primary prompt engineering surface in Claude Code — understanding its loading, priority, and cache position is essential for effective instructions.

---

## What is CLAUDE.md?

CLAUDE.md files are project-specific instruction files that Claude Code loads into the system prompt each turn. They override default behavior and are the main way teams customize Claude's behavior for their codebase.

---

## Opus 4.7 CLAUDE.md Considerations

Opus 4.7 follows instructions more literally than 4.6. Adjust CLAUDE.md style:

### State Scope Explicitly

```markdown
❌ "Add tests for new features."
✅ "Add tests for every new exported function in src/capabilities/, with at least one happy-path case and one edge case."
```

### Drop 4.6-Era Anti-Over-Engineering Scaffolding

Opus 4.7 self-moderates more than 4.6 — it's less prone to unsolicited refactoring and abstraction sprawl. Remove blanket rules like:

```markdown
❌ Obsolete on 4.7
"Do not refactor code that isn't in the task scope."
"Avoid premature abstraction."
"Don't add features not requested."
```

Keep only the most targeted guidance (e.g., codebase-specific invariants like "never mutate state outside Zustand stores").

### Favor Explicit Acceptance Criteria

CLAUDE.md rules that describe acceptance criteria (testable, observable) work better on 4.7 than rules that describe style preferences:

```markdown
✅ Works well on 4.7
"Every new file in src/capabilities/ must have a matching .test.ts file with >=80% branch coverage."

⚠️ Weaker on 4.7 (too subjective)
"Write clean, readable code."
```

### Tone Calibration

Opus 4.7 has a more direct, opinionated default tone. If your project wants a softer or more validation-forward style, state it explicitly:

```markdown
## Communication Style
- Acknowledge edge cases the user raises before proposing solutions
- When disagreeing, state the disagreement openly then give the user's preference weight
- Use matter-of-fact language; do not add reassurance phrases
```

---

## File Discovery Hierarchy

Claude Code walks from the current working directory to the filesystem root, collecting CLAUDE.md files at each level:

```
Priority (lowest → highest, loaded in this order):
1. Managed:  /etc/claude-code/CLAUDE.md
2. User:     ~/.claude/CLAUDE.md
3. Project:  CLAUDE.md, .claude/CLAUDE.md, .claude/rules/*.md
4. Local:    CLAUDE.local.md (gitignored)
```

**Files closer to cwd have HIGHER priority** — they load last and override earlier ones.

All CLAUDE.md content is prefixed with: *"Codebase and user instructions are shown below. Be sure to adhere to these instructions. IMPORTANT: These instructions OVERRIDE any default behavior and you MUST follow them exactly as written."*

This means CLAUDE.md rules take precedence over the base system prompt.

---

## @include Directives

CLAUDE.md supports including other files:

```markdown
@.claude/rules/coding-style.md
@.claude/rules/testing.md
@~/shared-rules/security.md
@/absolute/path/to/rules.md
```

**Rules:**
- Works in leaf text nodes only (not inside code blocks)
- Circular references are prevented
- Non-existent files are silently ignored
- Paths are relative to the file containing the @include

Use `@include` to keep CLAUDE.md concise while loading detailed rules on demand.

---

## `paths:` Conditional Loading

Rules files in `.claude/rules/` support conditional loading via frontmatter:

```yaml
---
paths: ["apps/portfolio-web/**", "*.tsx"]
---
# These rules only load when working on matching files
```

**When to use:**
- Framework-specific rules (React rules only for `.tsx` files)
- App-specific rules (only load when working in that app's directory)
- Reducing token usage by not loading irrelevant instructions

---

## Cache Boundary Position

The system prompt has a STATIC/DYNAMIC boundary (`SYSTEM_PROMPT_DYNAMIC_BOUNDARY`):

| Section | Position | Caching |
|---------|----------|---------|
| Static | Before boundary | `cache_control: { scope: 'global' }` — shared across all sessions |
| Dynamic | After boundary | Per-session, not globally cached |

**CLAUDE.md is in the DYNAMIC section.** This means:
- Adding timestamps or dynamic content to CLAUDE.md is fine — it doesn't break global cache
- The static system prompt (intro, tools, style) is globally cached regardless
- Your CLAUDE.md changes take effect immediately without cache invalidation concerns

---

## Memory System

Claude Code has a file-based memory system at `~/.claude/projects/<project>/memory/`.

### How Memory Works

1. **MEMORY.md** (index file) — Always loaded into context. Truncated at **200 lines AND 25KB** (whichever first).
2. **Memory files** — Individual `.md` files with frontmatter (`name`, `description`, `type`)
3. **Per-turn ranking** — Sonnet ranks top **5 most relevant** memory files each turn using the `description` frontmatter field

### Memory Budgets

| Limit | Value |
|-------|-------|
| Memories per turn | 5 |
| Max per memory file | 4KB / 200 lines |
| Session total | 60KB (`MAX_SESSION_BYTES`) |
| Max files scanned | 200 |
| Staleness warning | >1 day old |

### Writing Effective Memory Descriptions

The `description` field drives Sonnet's relevance ranking. Write it like a search query:

```yaml
---
name: auth-middleware-rewrite
description: "Auth middleware rewrite driven by legal/compliance — session token storage, JWT migration, Q2 2026 deadline"
type: project
---
```

**Good descriptions** contain specific keywords a future query would match against.
**Bad descriptions** are vague ("some notes about auth").

### Best Practices

- Keep MEMORY.md index concise — one line per entry, under 150 chars
- Use specific `description` fields — they drive ranking, not the file content
- Memory types: `user` (preferences), `feedback` (corrections), `project` (context), `reference` (external pointers)
- Memories >1 day old get staleness warnings — keep them updated

---

## Best Practices

### File Organization

| Pattern | When |
|---------|------|
| Root `CLAUDE.md` | Universal project rules (commit style, tooling, structure) |
| `.claude/rules/*.md` | Domain-specific rules (testing, security, React patterns) |
| `.claude/rules/*.md` + `paths:` | Conditional rules that only load for relevant files |
| `CLAUDE.local.md` | Personal preferences (gitignored, not shared) |
| `@include` directives | Modular instruction sets, shared across projects |

### Token Efficiency

- Use `paths:` to avoid loading irrelevant rules
- Use `@include` to keep root CLAUDE.md small
- Move detailed guides to `.claude/knowledge-base/` and reference from CLAUDE.md
- Don't duplicate information that's in the codebase (Claude can read files)

### Compaction Survival

CLAUDE.md reloads after context compaction. This makes it the safest place for critical instructions:
- State persisted in CLAUDE.md survives compaction
- State persisted only in conversation messages may be summarized or lost
- For long-running tasks, save critical context to files, not just conversation

---

**Next**: Return to [SKILL.md](../SKILL.md) for the skill overview
