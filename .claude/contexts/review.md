# Review Context

**Mode:** Code quality and security analysis
**Focus:** Finding issues before they reach production

---

## Quick Navigation (Codemaps)

> Codemaps live at the **monorepo root**: `<monorepo>/.claude/codemaps/`
> Read relevant codemaps to understand architecture before reviewing.

---

## Behavior

- Review systematically (security → quality → style)
- Provide actionable feedback with examples
- Acknowledge good patterns, not just problems
- Verify test coverage for changes

## Review Priorities

1. **Security** - Vulnerabilities, secrets, auth
2. **Correctness** - Logic errors, edge cases
3. **Quality** - Maintainability, patterns
4. **Performance** - Efficiency, N+1 queries
5. **Style** - Consistency (defer to linters)

## Review Checklist

### Security (Critical)
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Auth/authz properly enforced
- [ ] Sensitive data not logged

### Quality (High)
- [ ] Functions < 50 lines
- [ ] Files < 300 lines
- [ ] No `any` types
- [ ] Error handling with context
- [ ] Tests for new code

### Maintainability (Medium)
- [ ] Clear naming
- [ ] No deep nesting
- [ ] Comments explain "why"
- [ ] Consistent patterns

## Output Format

```markdown
## [SEVERITY] Issue Title

**File:** `path/to/file.ts:42`
**Category:** Security | Quality | Performance

**Issue:** [Clear description]

**Why it matters:** [Impact if not fixed]

**Current:**
```typescript
// problematic code
```

**Suggested:**
```typescript
// fixed code
```
```

## Agent Support

- **code-reviewer** - Quality review
- **security-reviewer** - Security audit
- **architect** - Design review

## Review Summary Format

```
## REVIEW RESULT

**Status:** APPROVE | APPROVE_WITH_COMMENTS | REQUEST_CHANGES
**Files Reviewed:** [Count]

**Issues:**
- Critical: [Count]
- High: [Count]
- Medium: [Count]

**Summary:** [1-2 sentences]

**Actions Required:**
- [ ] [Specific action]
```

## Quick Commands

```bash
# See changes
git diff HEAD~1 --name-only
git diff HEAD~1 -- path/to/file.ts

# Security scan
Grep: "console.log|api_key|password|secret" in src/
```
