---
name: codemap-updater
description: Generate and update token-lean codemaps for quick codebase navigation.
---

# Codemap Updater Skill

Generate token-lean architecture documentation for quick codebase navigation without burning context on exploration.

## When to Use

**LOAD THIS SKILL** when:
- Running `/update-codemaps` command
- `/checkpoint` triggers codemap refresh
- Codemaps are stale (> 7 days old)
- After major feature or refactoring work

## Core Behaviors

### ALWAYS
- Scan from project root, exclude node_modules/dist/.git
- Keep each codemap under 200 lines
- Use relative paths from project root
- Add timestamp to each codemap
- Calculate diff percentage from previous version
- Request user approval if changes > 30%

### NEVER
- Include implementation details (function bodies, logic)
- Include test files (`**/*.spec.ts`, `**/*.test.ts`)
- Include build artifacts (dist/, build/, .next/)
- Include absolute paths
- Overwrite without showing diff when changes > 30%

## Output Structure

Generate codemaps in `.claude/codemaps/`:

| File | Content | Scan Target |
|------|---------|-------------|
| `architecture.md` | Monorepo structure, turbo pipeline | Root config files |
| `<app-name>.md` | App modules, resolvers, models | `apps/<app-name>/src/**/*.ts` |
| `packages.md` | Shared packages overview | `packages/*/src/**/*.ts` |
| `data-models.md` | Data model schemas | `**/models/**/*.ts` |

## Codemap Format

```markdown
# [Area] Codemap

**Updated:** YYYY-MM-DD HH:MM
**Files:** [count]

## Structure

[directory tree - max 3 levels deep]

## Key Files

| File | Purpose |
|------|---------|
| path/to/file.ts | Brief description |

## Dependencies

[internal workspace deps + key external deps]

## Entry Points

[main entry files for this area]
```

## Patterns

### Pattern 1: Server Codemap

```markdown
# my-server Codemap

**Updated:** 2026-02-20 12:00
**Files:** 10

## Structure

apps/my-server/src/
├── modules/
│   ├── auth/
│   └── user/
├── models/
└── common/

## Key Files

| File | Purpose |
|------|---------|
| modules/auth/auth.service.ts | JWT authentication |
| modules/user/user.resolver.ts | User GraphQL resolver |
| models/user.model.ts | User Mongoose schema |
```

### Pattern 2: Incremental Update

```markdown
# Previous version exists - calculate diff

Previous: 45 files, 180 lines
Current: 47 files, 185 lines
Diff: +2 files, +5 lines (2.7%)

Changes < 30% → Update silently
```

## Anti-Patterns

### DON'T: Include implementation details

```markdown
# BAD - Too detailed
| File | Purpose |
|------|---------|
| auth.service.ts | Uses bcrypt to hash passwords with 10 rounds, validates JWT with RS256 algorithm |

# GOOD - Structure only
| File | Purpose |
|------|---------|
| auth.service.ts | JWT authentication and token management |
```

### DON'T: Include test files

```markdown
# BAD
├── user.service.ts
├── user.service.spec.ts  # Don't include
├── __tests__/            # Don't include

# GOOD
├── user.service.ts
├── user.resolver.ts
```

## Decision Points

**If codemap exists:**
1. Load previous version
2. Calculate diff percentage
3. If < 30%: Update silently
4. If >= 30%: Show diff, ask approval

**If no previous codemap:**
1. Generate fresh
2. Save without approval needed

## Error Handling

**If scan fails:**
- Report which directory failed
- Continue with remaining areas
- Note incomplete areas in output

**If diff calculation fails:**
- Treat as new codemap
- Proceed without approval requirement

## Quick Reference

| Trigger | Action | Output |
|---------|--------|--------|
| `/update-codemaps` | Full scan all areas | Updated codemaps |
| `/checkpoint` | Conditional update | Codemaps if stale |
| Manual request | Specific area | Single codemap |

## Related

- `/update-codemaps` command — Triggers this skill
- `/checkpoint` — Often triggers codemap update
- `.claude/codemaps/` — Output location
