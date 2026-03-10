# [mcp-ts-engineer] feat: /health-check slash command with worktree + audit + PR review

**Source**: https://github.com/ltomaszewski/mcp-ts-engineer/issues/19
**Issue**: #19
**Project**: mcp-ts-engineer
**Status**: TODO

---

## Description

Create `.claude/commands/health-check.md` slash command that orchestrates:
1. Create worktree on isolated branch
2. Run audit_fix with cwd + auto-excluded submodules
3. Push and create PR if changes found
4. Run pr_reviewer with cwd for worktree reuse
5. Report results

Single file creation (~150 lines). No TypeScript changes needed.

---

## Metadata

| Field | Value |
|-------|-------|
| Imported | 2026-03-10 |
| State | OPEN |
| Labels | project:mcp-ts-engineer, type:feature, shaped, status:blocked, execution-order:2 |
| Project | mcp-ts-engineer |
