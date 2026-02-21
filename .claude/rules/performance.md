# Performance Optimization

Model selection, context management, and efficiency patterns.

---

## Model Selection Strategy

### Haiku (Fast, Cost-Effective)
**Use for:**
- Simple code generation with clear instructions
- Repetitive tasks (formatting, renaming)
- Worker agents in parallel operations
- Quick lookups and searches

### Sonnet (Default for Development)
**Use for:**
- Standard coding tasks (90% of work)
- Orchestrating multi-agent workflows
- Code review and analysis
- Test generation

### Opus (Deep Reasoning)
**Use for:**
- Complex architectural decisions
- Debugging intricate issues
- Security analysis
- Planning large features
- Research requiring synthesis

**Cost comparison:** Haiku < Sonnet (3x) < Opus (5x from Sonnet)

---

## Context Window Management

**200k tokens available, but:**
- MCPs consume tokens
- Tools consume tokens
- Long documents front-loaded

### When Context Approaches 70%

**High context sensitivity (avoid):**
- Large-scale refactoring
- Multi-file feature implementation
- Complex debugging

**Lower sensitivity (OK to continue):**
- Single-file edits
- Documentation updates
- Simple bug fixes
- Independent utilities

### Strategic Compaction

```bash
# Save progress before compacting
# Use /compact when context is high

# Resume with minimal context reload
```

---

## Tool Efficiency

### Prefer Specialized Tools

| Instead of | Use |
|------------|-----|
| `grep -r` | Grep tool |
| `find . -name` | Glob tool |
| `cat file` | Read tool |
| `sed -i` | Edit tool |

### Parallel Operations

**ALWAYS parallelize independent operations:**

```markdown
# GOOD: Parallel
Launch 3 agents in parallel:
- Security review of auth changes
- Type checking of new interfaces
- Test coverage analysis

# BAD: Sequential when unnecessary
First security, then types, then coverage
```

### Long-Running Processes

```bash
# Don't block session with long processes
# Use background execution for builds/tests
npm run build &
```

---

## Build Performance

### TypeScript Optimization

```json
// tsconfig.json
{
  "compilerOptions": {
    "incremental": true,
    "tsBuildInfoFile": ".tsbuildinfo",
    "skipLibCheck": true
  }
}
```

---

## MCP Tool Efficiency

### Use the Right Tool

| Task | MCP Tool |
|------|----------|
| Spec review | `mcp__ts-engineer__todo_reviewer` |
| TDD implementation | `mcp__ts-engineer__todo_code_writer` |
| Final audit + commit | `mcp__ts-engineer__finalize` |
| Fix violations | `mcp__ts-engineer__audit_fix` |
| PR review | `mcp__ts-engineer__pr_reviewer` |

### Provide Accurate Inputs

```markdown
# GOOD: Specific spec path and files
finalize({ files_changed: ["src/core/session/session.manager.ts"], spec_path: "docs/specs/..." })

# BAD: Missing context
finalize({ files_changed: [] })
```

---

## Troubleshooting

### Build Failures
1. Use `mcp__ts-engineer__audit_fix` to auto-fix violations
2. Fix incrementally
3. Verify after each fix

### Slow Tests
1. Check for missing mocks (real API calls)
2. Verify test isolation
3. Use `--maxWorkers=4`

### High Memory Usage
1. Check for memory leaks in tests
2. Reduce parallelism
3. Clear caches
