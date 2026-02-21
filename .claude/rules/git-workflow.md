# Git Workflow

Commit conventions, PR process, and version control practices.

---

## Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When |
|------|------|
| `feat` | New feature |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `docs` | Documentation only |
| `test` | Adding/updating tests |
| `chore` | Build, deps, config |
| `perf` | Performance improvement |
| `ci` | CI/CD changes |

### Examples

```bash
feat(core): add session cost tracking
fix(provider): resolve timeout in claude provider
refactor(registry): consolidate capability binding
docs: update capability creation guide
test(echo-agent): add integration tests
chore: upgrade dependencies
```

---

## Branch Naming

```
<type>/<ticket>-<description>
```

Examples:
```
feat/123-session-analytics
fix/456-cost-tracking
refactor/789-prompt-versioning
```

For quick fixes without ticket:
```
fix/typo-in-readme
chore/update-deps
```

---

## Feature Implementation Workflow

### 1. Plan First

```bash
# Use planner agent for complex features
# Creates implementation plan before coding
```

### 2. Branch From Main

```bash
git checkout main
git pull origin main
git checkout -b feat/123-new-feature
```

### 3. TDD Approach

```bash
# Write tests first (RED)
npm test -- --watch

# Implement to pass (GREEN)
# Refactor while green
```

### 4. Commit Atomically

```bash
# Small, focused commits
git add src/core/session/
git commit -m "feat(session): add cost aggregation"

git add src/core/session/__tests__/
git commit -m "test(session): add cost aggregation tests"
```

### 5. Code Review

```bash
# Use code-reviewer agent before PR
# Address Critical/High issues
```

### 6. Create PR

```bash
gh pr create --title "feat(core): add session analytics" --body "..."
```

---

## Pull Request Process

### Before Creating PR

- [ ] All tests pass (`npm test`)
- [ ] Types check (`npm run build`)
- [ ] Code reviewed (via agent)
- [ ] No console.logs in production code

### PR Template

```markdown
## Summary
[2-3 bullet points describing the change]

## Changes
- `path/to/file.ts`: [what changed]

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated

## Test Plan
1. [Step to verify]
2. [Step to verify]
```

---

## Git Best Practices

### DO

- Commit early and often
- Write descriptive commit messages
- Keep commits focused (one concern per commit)
- Rebase feature branches on main before PR
- Squash fixup commits before merge

### DON'T

- Commit .env files or secrets
- Force push to shared branches
- Commit console.log statements
- Leave TODO comments without ticket reference
- Commit large binary files

---

## Useful Commands

```bash
# See what changed
git status
git diff

# Stage specific files
git add path/to/file.ts

# Amend last commit (before push)
git commit --amend

# Rebase on main
git fetch origin
git rebase origin/main

# Undo last commit (keep changes)
git reset --soft HEAD~1

# See commit history
git log --oneline -20
```

---

## Worktrees

For parallel work without branch switching:

```bash
# Create worktree
git worktree add .worktrees/feature-name -b feat/feature-name

# Work in worktree
cd .worktrees/feature-name
npm install

# Remove when done
git worktree remove .worktrees/feature-name
```

---

## Emergency Fixes

### Hotfix Process

```bash
# Branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug

# Fix, test, commit
git commit -m "fix(core): resolve critical session bug"

# Create PR with expedited review
gh pr create --label "hotfix" --title "fix(core): critical session bug"
```

### Reverting Changes

```bash
# Revert specific commit
git revert <commit-sha>

# Revert merge commit
git revert -m 1 <merge-commit-sha>
```
