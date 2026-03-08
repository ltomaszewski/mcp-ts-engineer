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

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build failures | Use `audit_fix` MCP tool, fix incrementally |
| Slow tests | Check for missing mocks, verify isolation |
| High memory | Check leaks in tests, reduce parallelism |

See `agents.md` for MCP tool reference and parameters.
