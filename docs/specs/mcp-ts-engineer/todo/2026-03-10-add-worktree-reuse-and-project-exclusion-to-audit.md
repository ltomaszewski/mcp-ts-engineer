# [mcp-ts-engineer] feat: add worktree reuse and project exclusion to audit/review capabilities

**Source**: https://github.com/ltomaszewski/mcp-ts-engineer/issues/18
**Issue**: #18
**Project**: mcp-ts-engineer
**Status**: TODO

---

## Description

---
project: mcp-ts-engineer
path: packages/mcp-ts-engineer
type: feat
status: draft
created: 2026-03-10
appetite: 1 day
shaped: true
session: "Add exclude param to audit_fix, wire cwd for pr_reviewer and pr_fixer worktree reuse"
---

## Dependencies

| Issue | Relation | Reason |
|-------|----------|--------|
| #20 | parent | Epic: /health-check — monorepo code audit with PR review |
| #19 | blocks | Slash command depends on exclude + cwd capabilities from this issue |

> **Execution order**: This is sub-task **1 of 2**. No blockers — implement first.

# Add worktree reuse and project exclusion to audit/review capabilities

## Context

The `/health-check` command (see dependent issue) needs three capability gaps filled:
1. `audit_fix` has no way to exclude projects (e.g., the mcp-ts-engineer submodule itself)
2. `pr_reviewer` always creates its own worktree — no way to reuse an existing one
3. `pr_fixer` accepts `cwd` in its schema but completely ignores it (dead code)

These changes are prerequisites for the `/health-check` slash command and are independently useful for any workflow that manages its own worktree.

## Appetite

**1 day** — Three focused schema/orchestration changes with backward-compatible defaults.

---

## Requirements

- [ ] FR-1: `audit_fix` accepts `exclude: string[]` (optional) to skip specific project paths
- [ ] FR-2: `audit_fix` auto-detects git submodules via `git submodule status` and excludes them (merged with explicit `exclude`)
- [ ] FR-3: Exclusion works in both AI planner prompt AND `discoverProjects` fallback AND post-planner filter
- [ ] FR-4: `pr_reviewer` accepts `cwd: string` (optional) to reuse an existing worktree
- [ ] FR-5: When `pr_reviewer` receives `cwd`, it skips `pr_context_step` worktree creation, sets `worktreeOwnedByReviewer=false`, and fetches diff via `gh pr diff`
- [ ] FR-6: `pr_fixer` wires up its existing `cwd` schema field — skips `pr_context_step` when `state.worktreePath` is pre-populated
- [ ] FR-7: All three capabilities remain 100% backward-compatible when `exclude`/`cwd` are not provided

## Non-Goals

- NG-1: The `/health-check` slash command itself (separate issue)
- NG-2: Modifying pr_reviewer's cleanup logic (already handles `worktreeOwnedByReviewer=false`)
- NG-3: Adding `exclude` to pr_reviewer or pr_fixer (not needed — they filter files, not projects)

---

## User Scenarios

### P1: audit_fix excludes submodules automatically
**As a** developer using mcp-ts-engineer as a submodule, **I want to** run `audit_fix` without it auditing the submodule itself, **So that** only my application code is checked.

**Acceptance Criteria:**
- Given a monorepo with mcp-ts-engineer at `packages/mcp-ts-engineer`, When `audit_fix` runs with `cwd` pointing to the monorepo root, Then `packages/mcp-ts-engineer` is excluded from the audit plan
- Given `exclude: ["packages/legacy"]` is provided, When `audit_fix` runs, Then both the submodule and `packages/legacy` are excluded
- Given no `exclude` and no submodules, When `audit_fix` runs, Then all projects are audited (backward-compatible)

### P2: pr_reviewer reuses an existing worktree
**As a** tool orchestrator (e.g., `/health-check`), **I want to** pass `cwd` to `pr_reviewer` to reuse a worktree I already set up, **So that** I avoid redundant git checkout + npm install.

**Acceptance Criteria:**
- Given `cwd="/path/to/worktree"` is provided, When `pr_reviewer` runs, Then it uses that path and does NOT invoke `pr_context_step`
- Given `cwd` is NOT provided, When `pr_reviewer` runs, Then it creates its own worktree as before (backward-compatible)
- Given an external worktree was used, When pr_reviewer completes, Then the worktree is NOT cleaned up (`worktreeOwnedByReviewer=false`)

### P3: pr_fixer reuses an existing worktree
**As a** tool orchestrator, **I want to** pass `cwd` to `pr_fixer`, **So that** it fixes issues in my existing worktree instead of creating a new one.

**Acceptance Criteria:**
- Given `cwd="/path/to/worktree"` is provided, When `pr_fixer` runs, Then `executeParseState` skips `pr_context_step` and uses the provided path
- Given `cwd` is NOT provided, When `pr_fixer` runs, Then it creates its own worktree as before

---

## Architecture

### audit_fix exclusion: Dual-layer filtering

1. **Prompt layer**: Inject exclusion list into planner prompt → AI avoids discovering excluded projects
2. **Code layer**: Post-planner filter in `processResult` → safety net if AI ignores instructions
3. **Fallback layer**: `discoverProjects(cwd, exclude)` → filters during filesystem discovery

Auto-detection via `git submodule status` is merged with explicit `exclude` into a single `Set`.

### pr_reviewer/pr_fixer cwd: Early-return pattern

Both use the same pattern: check `cwd`/`worktreePath` before invoking `pr_context_step`. If already set, skip creation, fetch diff via `gh pr diff`, and proceed.

### Alternatives Considered

| Approach | Pros | Cons | Decision |
|----------|------|------|----------|
| Hardcode `mcp-ts-engineer` in exclusion | Simple | Brittle, won't work for other submodules | ❌ Rejected |
| Auto-detect submodules only | Handles all submodules | Can't exclude non-submodule packages | ❌ Rejected |
| Auto-detect + explicit `exclude` | Flexible, handles all cases | Slightly more code | ✅ Chosen |
| Pass worktree_path through pr_context_step | Reuses existing step | Requires changing step's AI prompt behavior | ❌ Rejected |
| Skip pr_context_step entirely when cwd set | Clean, no prompt changes | Must fetch diff separately | ✅ Chosen |

---

## Affected Files

| File | Action | Purpose |
|------|--------|---------|
| `src/capabilities/audit-fix/audit-fix.schema.ts` | MODIFY | Add `exclude` field (~3 lines) |
| `src/capabilities/audit-fix/audit-fix.helpers.ts` | MODIFY | Add `detectSubmodules()`, update `discoverProjects()` (~25 lines) |
| `src/capabilities/audit-fix/prompts/planner.v1.ts` | MODIFY | Add `excludeList` to prompt input + injection (~10 lines) |
| `src/capabilities/audit-fix/audit-fix.capability.ts` | MODIFY | Wire exclusion in `preparePromptInput` + post-planner filter (~15 lines) |
| `src/capabilities/pr-reviewer/pr-reviewer.schema.ts` | MODIFY | Add `cwd` field (~3 lines) |
| `src/capabilities/pr-reviewer/pr-reviewer.orchestration.ts` | MODIFY | Add cwd shortcut in `executeContext` (~30 lines) |
| `src/capabilities/pr-fixer/pr-fixer.orchestration.ts` | MODIFY | Pre-populate `worktreePath`, skip `pr_context_step` (~8 lines) |

---

## Implementation Phases

- Phase 1: audit_fix — schema + helpers (`detectSubmodules`, `discoverProjects` exclude) + planner prompt + capability wiring
- Phase 2: pr_reviewer — schema + orchestration `executeContext` cwd shortcut
- Phase 3: pr_fixer — orchestration `runFixerOrchestration` + `executeParseState` cwd shortcut
- Phase 4: Tests for all three

Phases 1-3 are independent and can be implemented in parallel.

---

## Testing Strategy

- **Unit**: `detectSubmodules` (returns paths, handles errors), `discoverProjects` with exclude (filters correctly, backward-compatible)
- **Unit**: Schema validation for new fields (accepts optional, backward-compatible)
- **Unit**: `executeContext` with cwd (skips `pr_context_step`, sets `worktreeOwnedByReviewer=false`)
- **Unit**: `executeParseState` with pre-populated `worktreePath` (skips `pr_context_step`)

---

## Cross-Cutting Concerns

- **Security**: `detectSubmodules` uses `execFileSync` (not `exec`), no shell injection. `cwd` paths are validated by existing `safePathSchema`.
- **Performance**: `detectSubmodules` has 10s timeout, runs once per invocation. Worktree reuse saves ~30s+ of setup time.

---

## Dependencies

| Issue | Relation | Reason |
|-------|----------|--------|
| #19 | blocks | Slash command depends on these capability changes |

## For Implementation

| Field | Value |
|-------|-------|
| **Project** | `packages/mcp-ts-engineer` |
| **Workspace** | `-w packages/mcp-ts-engineer` |
| **Test** | `npm test -w packages/mcp-ts-engineer` |
| **Build** | `npm run build -w packages/mcp-ts-engineer` |

**To implement:**
```
/issue-implement {number}
```

---

## Metadata

| Field | Value |
|-------|-------|
| Imported | 2026-03-10 |
| State | OPEN |
| Labels | project:mcp-ts-engineer, type:feature, status:draft, shaped, execution-order:1 |
| Project | mcp-ts-engineer |

---

## Next Steps

```bash
# Review and refine spec
/todo-review docs/specs/mcp-ts-engineer/todo/2026-03-10-add-worktree-reuse-and-project-exclusion-to-audit.md

# Implement with code writer
mcp__ts-engineer__todo_code_writer spec_path="docs/specs/mcp-ts-engineer/todo/2026-03-10-add-worktree-reuse-and-project-exclusion-to-audit.md"
```
