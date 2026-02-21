# Research Context

**Mode:** Exploration and investigation
**Focus:** Understanding before acting

---

## Quick Navigation (Codemaps)

> Codemaps live at the **monorepo root**: `<monorepo>/.claude/codemaps/`
> Read relevant codemaps FIRST before deep exploration.

---

## Critical Rules

**ALWAYS:**
- Codemaps FIRST before deep exploration
- Cite evidence (`file:line`) for all findings

**NEVER:**
- Conclusions without file:line evidence

---

## Tool Selection

| Task | Tool |
|------|------|
| Search codebase | Grep, Glob |
| Read contents | Read |
| External docs | WebSearch |
| Specific URL | WebFetch |
| Deep exploration | Task (Explore) |

---

## Codebase Search

```
# Basic
Grep "authenticate"
Grep "class.*Service"

# Scoped to directory
Grep "JWT" --path src/
Grep "useState" --path src/components/
```

---

## External Search: WebSearch

**For docs, tutorials, solutions outside the codebase.**

```
WebSearch "NestJS GraphQL subscriptions 2026"
WebFetch https://docs.nestjs.com/graphql/subscriptions
```

---

## Research Workflow

```
1. Codemaps    → Architecture overview
2. Grep/Glob   → Patterns/usages
3. Read        → Implementation details
4. WebSearch   → External context (optional)
5. Synthesize  → Hypothesis + evidence
6. Report      → Cite file:line
```

---

## Output Format

```markdown
## Findings

### Discovered
- [Finding] — `path/file.ts:42`

### Evidence
- `src/auth.service.ts:87` — JWT logic

### Recommendations
1. [Option] — Pros/Cons

### Open Questions
- [Uncertainty]
```

---

## Agents

- **Explore** — Multi-step investigation
- **architect** — Design trade-offs
- **planner** — Research → implementation
