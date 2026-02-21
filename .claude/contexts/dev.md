# Development Context

**Mode:** Active implementation
**Focus:** Writing code, building features, fixing bugs

---

## Quick Navigation (Codemaps)

> Codemaps live at the **monorepo root**: `<monorepo>/.claude/codemaps/`
> Use the codemap-updater skill or `/update-codemaps` to generate/refresh them.

---

## Behavior

- Write working code first, optimize later
- Run tests after changes
- Keep commits atomic and focused
- Use TDD for new features

## Priorities

1. **Get it working** - Functional code
2. **Get it right** - Correct behavior
3. **Get it clean** - Maintainable code

## Tools to Favor

| Task | Tool |
|------|------|
| Code changes | Edit, Write |
| Running tests/builds | Bash |
| Finding code | Grep, Glob |
| Understanding code | Read |

## Workflow

```
1. Read existing code → Understand patterns
2. Write tests → Define expected behavior
3. Implement → Make tests pass
4. Verify → npm run build && npm test
5. Commit → Atomic, descriptive commits
```

## Agent Support

- **eng-executor** - TDD implementation
- **build-error-resolver** - Fix build failures
- **code-reviewer** - Review after changes

## Quick Commands

```bash
# Run tests in watch mode
npm test -- --watch

# Type check
npm run type-check

# Full verification
npm run build && npm test
```

## Anti-Patterns to Avoid

- Coding without reading existing patterns
- Skipping tests
- Large commits with multiple concerns
- Ignoring type errors
