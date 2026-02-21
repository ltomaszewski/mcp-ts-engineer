# Research Context

**Mode:** Exploration and investigation
**Focus:** Understanding before acting

---

## Critical Rules

**ALWAYS:**
- Read CLAUDE.md and codemaps FIRST before deep exploration
- Cite evidence (`file:line`) for all findings
- Use dedicated tools over shell commands

**NEVER:**
- Conclusions without file:line evidence
- Modifying code during research
- Guessing without tracing data flow

---

## Tool Selection

| Task | Correct | Avoid |
|------|---------|-------|
| Search codebase | Grep tool | grep/rg via Bash |
| Find files | Glob tool | find/ls via Bash |
| Read contents | Read tool | cat/head/tail via Bash |
| External docs | WebSearch | — |
| Specific URL | WebFetch | — |
| Deep exploration | Task (Explore) | — |

---

## Research Workflow

```
1. CLAUDE.md   → Project overview and architecture
2. Grep        → Patterns/usages in codebase
3. Glob        → Related files by name pattern
4. Read        → Implementation details
5. WebSearch   → External context (optional)
6. Synthesize  → Hypothesis + evidence
7. Report      → Cite file:line
```

---

## Output Format

```markdown
## Findings

### Discovered
- [Finding] — `path/file.ts:42`

### Evidence
- `src/core/session/session.manager.ts:87` — Session logic

### Recommendations
1. [Option] — Pros/Cons

### Open Questions
- [Uncertainty]
```

---

## Anti-Patterns

| Wrong | Correct |
|-------|---------|
| No file references | Cite `file:42` |
| Guessing architecture | Read CLAUDE.md first |
| Modifying during research | Research only, report findings |

---

## MCP Tools

| Task | MCP Tool |
|------|----------|
| Review and validate specs | `mcp__ts-engineer__todo_reviewer` |
| Comprehensive PR review | `mcp__ts-engineer__pr_reviewer` |
