---
globs: docs/specs/**, src/core/utils/spec-status*
---

# Todo Spec File Lifecycle

Spec files in `docs/specs/*/todo/*.md` follow a 4-state lifecycle managed by MCP capabilities.

## State Machine

```
DRAFT  ──→  IN_REVIEW  ──→  READY  ──→  IMPLEMENTED
       │                │           │
  todo_reviewer    todo_code_writer  finalize
```

## States

| Status | Meaning | Set By | Next Step |
|--------|---------|--------|-----------|
| `DRAFT` | Created, not reviewed | User | Run `todo_reviewer` |
| `IN_REVIEW` | Validated, ready for implementation | `todo_reviewer` | Run `todo_code_writer` |
| `READY` | Code implemented and committed | `todo_code_writer` | Run `finalize` |
| `IMPLEMENTED` | Complete: code + audit + tests + codemaps | `finalize` | Done |

## Rules

- Each capability only advances to the next state (never skips)
- Status update is atomic: committed in same git commit
- Status update is non-fatal: logs warning on failure
- `todo_code_writer` only updates on successful (non-halted) execution
- `finalize` only updates when audit passes AND tests pass
- `finalize` requires `spec_path` input to update status

## Status Format in Spec

```markdown
**App**: mcp-ts-engineer
**Status**: IN_REVIEW
**Created**: 2026-02-02
```

The `updateSpecStatus` helper in `src/core/utils/spec-status.ts` handles regex replacement for both `**Status**: X` and `Status: X` formats.
