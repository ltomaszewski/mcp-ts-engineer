---
name: session-manager
description: Session state persistence and context management for long coding sessions. Use when approaching context limits, before breaks, or at session end.
---

# Session Manager

Persist session state and learnings across Claude Code sessions for continuity.

---

## When to Use

- Context approaching 70%
- Before taking a break
- At session end
- After completing a major milestone
- Before compacting context

---

## Session File Format

Create files in `.claude/sessions/`:
```
.claude/sessions/
  YYYY-MM-DD-topic.md
```

### Template

```markdown
# Session: [Topic]

**Date:** YYYY-MM-DD
**Started:** HH:MM
**Context at save:** XX%

## Progress Summary

### Completed
- [x] [Task 1] - [Brief outcome]
- [x] [Task 2] - [Brief outcome]

### In Progress
- [ ] [Task] - [Current state]

### Not Started
- [ ] [Task] - [Notes]

## Key Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| [Choice made] | [Why] | [What it affects] |

## What Worked

- [Approach that succeeded]
- [Pattern that was effective]

## What Didn't Work

- [Approach that failed] - [Why it failed]
- [Dead end] - [What was learned]

## Technical Notes

### Files Modified
- `path/to/file.ts` - [What changed]

### Key Code Patterns
```typescript
// Useful snippet or pattern discovered
```

### CosmosDB/API Notes
- [Any compatibility issues discovered]
- [Performance observations]

## Next Session

### Start Here
[Exact next step to take]

### Context to Load
- @file/path/to/important/file.ts
- @docs/relevant-spec.md

### Remaining Work
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]
```

---

## Commands

### Save Session

```bash
/session save [topic]
```

Creates session file with current state.

### Load Session

```bash
/session load [date-topic]
```

Loads previous session file and summarizes for continuity.

### List Sessions

```bash
/session list
```

Shows recent session files.

---

## Automatic Triggers

Consider saving session when:
- Context > 70%
- Completing a major feature
- Before refactoring
- After debugging breakthrough
- Before any destructive operation

---

## Integration with Context Management

### Pre-Compact Save

Before `/compact`:
1. Save session state
2. Note current progress
3. Record what context to reload

### Post-Compact Load

After compact:
1. Reload minimal context
2. Reference session file for state
3. Resume from documented point

---

## Best Practices

**DO:**
- Save frequently (every major milestone)
- Include specific file paths
- Document dead ends (avoid repeating)
- Note exact next steps

**DON'T:**
- Save raw conversation dumps
- Include redundant context
- Skip the "What Didn't Work" section
- Leave next steps vague

---

## Example Session

```markdown
# Session: Analytics Feature

**Date:** 2024-01-15
**Started:** 14:00
**Context at save:** 72%

## Progress Summary

### Completed
- [x] Created analytics module - apps/bastion-server/src/modules/analytics/
- [x] Added getStats resolver
- [x] Unit tests passing (12/12)

### In Progress
- [ ] Integration tests - Blocked on mock setup

## Key Decisions

| Decision | Rationale | Impact |
|----------|-----------|--------|
| Separate analytics module | Avoid bloating core module | New module to maintain |
| Weekly aggregation | User feedback | Adds complexity to queries |

## What Worked

- Using read-then-aggregate pattern for database
- Mocking UserService for isolated tests

## What Didn't Work

- First attempt at date math used UTC, needed user timezone

## Next Session

### Start Here
Fix integration test mocks - see failing test at analytics.resolver.spec.ts:45

### Context to Load
- @apps/bastion-server/src/modules/analytics/
- @apps/bastion-server/src/modules/core/core.service.ts

### Remaining Work
1. Fix integration tests
2. Add E2E test
3. Update docs
```
