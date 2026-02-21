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
/checkpoint create "before-compact"

# Compact context
/compact

# Resume with minimal context reload
```

---

## Monorepo-Specific Optimization

### Turborepo Caching

```bash
# Leverage remote cache
turbo run build --cache

# Check cache effectiveness
turbo run build --dry=json | jq '.tasks[].cache'
```

### Targeted Operations

```bash
# Build only affected packages
turbo run build --filter=@org/server

# Run tests for changed packages
turbo run test --filter=...[origin/main]

# Type-check specific workspace
npm run type-check -w apps/server
```

### Avoid Full Rebuilds

```bash
# SLOW: Rebuilds everything
turbo run build --no-cache

# FAST: Uses cache
turbo run build

# FASTEST: Only changed
turbo run build --filter=...[HEAD~1]
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
# Use background execution

# For server
npm run dev &

# For builds
turbo run build &
```

---

## Database Performance

### Query Optimization

```typescript
// GOOD: Use indexes, project fields
const users = await this.userModel
  .find({ status: 'active' })
  .select('name email')
  .lean()

// BAD: Full document scan
const users = await this.userModel.find()
```

### Avoid N+1

```typescript
// BAD: N+1 queries
for (const user of users) {
  const kids = await this.kidModel.find({ userId: user._id })
}

// GOOD: Single query with lookup
const usersWithKids = await this.userModel.aggregate([
  { $match: { status: 'active' } },
  { $lookup: { from: 'kids', localField: '_id', foreignField: 'userId', as: 'kids' } }
])
```

---

## Mobile Performance (React Native)

### Prevent Unnecessary Re-renders

```typescript
// Use memoization
const MemoizedComponent = React.memo(ExpensiveComponent)

// Stable callbacks
const handlePress = useCallback(() => {
  // handler logic
}, [dependencies])

// Stable values
const config = useMemo(() => computeConfig(data), [data])
```

### List Optimization

```typescript
// Use FlashList for large lists
import { FlashList } from '@shopify/flash-list'

<FlashList
  data={items}
  renderItem={renderItem}
  estimatedItemSize={50}
  keyExtractor={(item) => item.id}
/>
```

---

## Build Performance

### Package Dependencies

```bash
# Check bundle size impact
npm install --dry-run package-name

# Analyze bundle
npx source-map-explorer dist/main.js
```

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

## Agent Efficiency

### Delegate Appropriately

| Task | Agent | Model |
|------|-------|-------|
| Planning | planner | Opus |
| Implementation | eng-executor | Sonnet |
| Review | code-reviewer | Sonnet |
| Security | security-reviewer | Opus |
| Build fixes | build-error-resolver | Haiku |
| Cleanup | refactor-cleaner | Sonnet |

### Reduce Context Transfer

```markdown
# GOOD: Specific task with context
"Review auth.service.ts for security issues, focusing on JWT handling"

# BAD: Vague delegation
"Check the auth code"
```

---

## Troubleshooting

### Build Failures
1. Use `build-error-resolver` agent
2. Fix incrementally
3. Verify after each fix

### Slow Tests
1. Check for missing mocks (real DB calls)
2. Verify test isolation
3. Use `--maxWorkers=4`

### High Memory Usage
1. Check for memory leaks in tests
2. Reduce parallelism
3. Clear caches: `turbo clean`
