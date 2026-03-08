# Coding Style

Production coding rules. Flexible guidelines with platform-specific patterns.

---

## Core Principles

| Principle | Guideline | Flexibility |
|-----------|-----------|-------------|
| Immutability | Prefer new objects over mutation | Required for state, flexible for local vars |
| Explicit types | Return types on exports | Required for public APIs |
| Error context | Include identifiers in logs | Always for async/network ops |
| Small units | Functions <50, files <300 lines | Soft limits, use judgment |
| Feature organization | Co-locate by domain | Preferred, not absolute |

---

## Immutability

**Prefer immutable patterns, especially for state and shared data.**

### Objects

```typescript
// ✅ Preferred — spread for updates
const updated = { ...user, name: newName }

// ⚠️ Avoid — direct mutation (especially for state)
user.name = newName

// ✅ OK — local variable mutation when isolated
let count = 0
for (const item of items) {
  if (item.active) count++
}
```

### Arrays

```typescript
// ✅ Preferred — immutable methods
const added = [...items, newItem]
const filtered = items.filter(x => x.active)
const mapped = items.map(x => ({ ...x, processed: true }))

// ⚠️ Avoid — mutating methods on shared arrays
items.push(newItem)      // mutates
items.splice(0, 1)       // mutates

// ✅ OK — mutation in isolated scope
const result: Item[] = []
for (const item of source) {
  if (predicate(item)) result.push(transform(item))
}
```

---

## File Organization

### Size Guidelines

| Type | Target | Hard Limit | When to Split |
|------|--------|------------|---------------|
| Function | <30 lines | 50 lines | Multiple responsibilities |
| File | <200 lines | 300 lines | Distinct concerns emerge |
| Component | <100 lines | 150 lines | Complex logic or many states |
| Entry point | <30 lines | 50 lines | More than bootstrapping |

### When to Extract

**Extract when:**
- Function exceeds target size
- Logic appears in 2+ places
- Unit has multiple responsibilities
- Testing requires isolation
- Cognitive load is high

**Keep together when:**
- Code is cohesive and single-purpose
- Extraction would create artificial boundaries
- Related code would become harder to understand

---

## Error Handling

### Patterns by Context

```typescript
// Service layer — typed exceptions with logging
async findById(id: string): Promise<User> {
  try {
    const user = await this.model.findById(id)
    if (!user) {
      throw new NotFoundException(`User ${id} not found`)
    }
    return user
  } catch (error) {
    if (error instanceof NotFoundException) throw error
    this.logger.error(`Failed to find user ${id}`, { error, id })
    throw new InternalServerErrorException('Database error')
  }
}

// MCP Server — structured logging
async function executeTask(input: TaskInput): Promise<TaskOutput> {
  try {
    return await runSubagent(input)
  } catch (error) {
    log("ERROR", `Task failed: ${error.message}`, { input })
    throw error  // Let caller handle
  }
}
```

### Error Handling Rules

| Pattern | Status | When |
|---------|--------|------|
| Log then throw typed | ✅ Required | Service layer errors |
| Empty catch `{}` | ❌ Forbidden | Never acceptable |
| Catch and return null | ⚠️ Caution | Only for expected "not found" |
| Catch and rethrow | ⚠️ Caution | Add context if rethrowing |
| Global error boundary | ✅ Recommended | Top-level error handling |

---

## TypeScript

### Type Patterns

```typescript
// ✅ Type guard for unknown
function isUser(value: unknown): value is User {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'email' in value
  )
}

// ✅ Explicit return types on exports
export function parseConfig(input: unknown): Config {
  const result = configSchema.safeParse(input)
  if (!result.success) {
    throw new ValidationError('Invalid config', result.error)
  }
  return result.data
}

// ✅ Discriminated unions for states
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error }

// ✅ Const assertions for literals
const ROLES = ['admin', 'user', 'guest'] as const
type Role = typeof ROLES[number]
```

### Type Usage Guidelines

| Pattern | Status | Notes |
|---------|--------|-------|
| `any` | ⚠️ Avoid | Add comment if needed |
| `unknown` | ✅ Preferred | Use with type guards |
| `as` assertion | ⚠️ Caution | Prefer type guards |
| `!` non-null | ⚠️ Caution | Only when certain, add comment |
| `@ts-ignore` | ❌ Avoid | Fix the type issue instead |
| `@ts-expect-error` | ⚠️ OK | For intentional type errors in tests |

---

## Naming Conventions

### Universal Rules

| Type | Convention | Examples |
|------|------------|----------|
| Functions | camelCase + verb | `getUser`, `validateEmail`, `handleSubmit` |
| Classes | PascalCase | `UserService`, `AuthGuard`, `ApiClient` |
| Interfaces/Types | PascalCase | `User`, `AuthPayload`, `Config` |
| Type parameters | Single uppercase or descriptive | `T`, `TData`, `TError` |
| Constants | SCREAMING_SNAKE | `MAX_RETRIES`, `API_TIMEOUT` |
| Enums | PascalCase + PascalCase members | `UserRole.Admin` |
| Booleans | is/has/should prefix | `isLoading`, `hasError`, `shouldRetry` |

### File Naming

| Type | Pattern | Example |
|------|---------|---------|
| Module | `{feature}.module.ts` | `auth.module.ts` |
| Service | `{feature}.service.ts` | `user.service.ts` |
| Types | `{domain}.types.ts` | `auth.types.ts` |
| Schema | `{name}.schema.ts` | `tool-inputs.schema.ts` |
| Config | `{name}.ts` | `constants.ts` |
| Test | same name + `.test` | `auth.service.test.ts` |
| Capability | `{name}.capability.ts` | `echo-agent.capability.ts` |

---

## Import Order

Consistent ordering improves readability and reduces merge conflicts.

```typescript
// 1. Node.js built-ins
import { join, resolve } from 'path'
import { readFile } from 'fs/promises'

// 2. External packages (frameworks first, then alphabetical)
import { z } from 'zod'

// 3. Monorepo packages
import { User } from '@myorg/types'

// 4. Internal absolute imports
import { Logger } from '@/core/logger'
import { CostTracker } from '@/core/cost'

// 5. Relative imports (parent dirs first, then siblings)
import { AuthService } from '../auth.service'
import { CreateUserInput } from './dto'
```

---

## Anti-Patterns & Fixes

| Anti-Pattern | Why Problematic | Fix |
|--------------|-----------------|-----|
| `catch {}` | Silent failures hide bugs | Log error with context, then handle/rethrow |
| `any` everywhere | No type safety | Use `unknown` + type guards |
| Nesting >3 levels | Hard to follow | Early returns, extract helpers |
| Files >300 lines | Hard to navigate | Split by responsibility |
| Hardcoded strings | Inflexible, error-prone | Constants or config |
| Global mutable state | Hard to test | Use dependency injection |

---

## Quality Checklist

### Before Completing Work

- [ ] Functions under 50 lines (soft limit)
- [ ] Files under 300 lines (soft limit)
- [ ] No nesting deeper than 3 levels
- [ ] Errors logged with identifying context
- [ ] No `console.log` in production code
- [ ] No hardcoded magic values
- [ ] Immutable patterns for shared state
- [ ] Explicit types on exported functions
- [ ] Import order follows convention

