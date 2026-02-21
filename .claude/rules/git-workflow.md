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

### Scopes

| Scope | Package |
|-------|---------|
| `core` | Core application code |
| `types` | packages/types |
| `utils` | packages/utils |
| `config` | packages/config |
| `mono` | Root/monorepo config |

> Adapt scopes to match your project's package structure.

### Examples

```bash
feat(core): add user analytics endpoint
fix(core): resolve input validation on login
refactor(types): consolidate user interfaces
docs(core): update API schema documentation
test(core): add E2E tests for user flow
chore(mono): upgrade dependencies
```

---

## Branch Naming

```
<type>/<ticket>-<description>
```

Examples:
```
feat/PROJ-123-user-analytics
fix/PROJ-456-input-validation
refactor/PROJ-789-user-types
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
git checkout -b feat/PROJ-123-new-feature
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
git add src/modules/feature/
git commit -m "feat(core): add feature service"

git add src/modules/feature/__tests__/
git commit -m "test(core): add feature service tests"
```

### 5. Code Review

```bash
# Use code-reviewer agent before PR
# Address Critical/High issues
```

### 6. Create PR

```bash
gh pr create --title "feat(core): add user analytics" --body "..."
```

---

## Pull Request Process

### Before Creating PR

- [ ] All tests pass (`turbo run test`)
- [ ] Lint clean (`turbo run lint`)
- [ ] Types check (`turbo run type-check`)
- [ ] Build succeeds (`turbo run build`)
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
- [ ] E2E tests added/updated (if applicable)

## Test Plan
1. [Step to verify]
2. [Step to verify]
```

### PR Review Checklist

- [ ] Changes match PR description
- [ ] Tests cover new functionality
- [ ] No security issues (use security-reviewer)
- [ ] Database compatibility (for data layer changes)
- [ ] Breaking changes documented

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

# Interactive staging
git add -p

# Amend last commit (before push)
git commit --amend

# Rebase on main
git fetch origin
git rebase origin/main

# Squash last N commits
git rebase -i HEAD~N

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
turbo run build

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
git commit -m "fix(core): resolve critical auth bug"

# Create PR with expedited review
gh pr create --label "hotfix" --title "fix(core): critical auth bug"
```

### Reverting Changes

```bash
# Revert specific commit
git revert <commit-sha>

# Revert merge commit
git revert -m 1 <merge-commit-sha>
```
