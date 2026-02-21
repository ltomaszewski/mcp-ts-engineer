# Coding Style

Production rules. Flexible guidelines with platform-specific patterns.

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

### State Management (Zustand/React)

```typescript
// ✅ Required — always return new state
set(state => ({
  items: [...state.items, item],
  count: state.count + 1
}))

// ❌ Never — mutate state directly
set(state => {
  state.items.push(item)  // WRONG
  return state
})
```

---

## File Organization

### Size Guidelines

| Type | Target | Hard Limit | When to Split |
|------|--------|------------|---------------|
| Function | <30 lines | 50 lines | Multiple responsibilities |
| File | <200 lines | 300 lines | Distinct concerns emerge |
| Component | <100 lines | 150 lines | Complex logic or many states |
| Screen (RN) | <60 lines | 80 lines | Any business logic present |
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

### Organization Pattern

```
// ✅ Feature-based (preferred)
modules/auth/
  auth.service.ts
  auth.resolver.ts
  auth.module.ts
  dto/
  services/

// ⚠️ Type-based (avoid for features)
services/
  authService.ts
  userService.ts
```

---

## Error Handling

### Patterns by Context

```typescript
// NestJS — typed exceptions with logging
async findById(id: string): Promise<User> {
  try {
    const user = await this.userModel.findById(id)
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

// React Native — user-friendly feedback
const handleSave = async () => {
  try {
    await saveData(data)
    showToast('Saved successfully')
  } catch (error) {
    console.error('Save failed:', error)
    showToast('Unable to save. Please try again.')
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

### Configuration

```json
// tsconfig.json — required settings
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,  // recommended
    "exactOptionalPropertyTypes": true  // recommended
  }
}
```

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
| `any` | ⚠️ Avoid | Add `// eslint-disable-line` comment if needed |
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

### File Naming by Platform

#### NestJS Backend

| Type | Pattern | Example |
|------|---------|---------|
| Module | `{feature}.module.ts` | `auth.module.ts` |
| Service | `{feature}.service.ts` | `user.service.ts` |
| Resolver | `{feature}.resolver.ts` | `user.resolver.ts` |
| Controller | `{feature}.controller.ts` | `health.controller.ts` |
| Guard | `{name}.guard.ts` | `jwt-auth.guard.ts` |
| Decorator | `{name}.decorator.ts` | `current-user.decorator.ts` |
| Input DTO | `{action}-{entity}.input.ts` | `create-user.input.ts` |
| Output DTO | `{entity}.output.ts` | `user.output.ts` |
| Schema | `{entity}.schema.ts` | `user.schema.ts` |
| Types | `{domain}.types.ts` | `auth.types.ts` |
| Test | `{file}.test.ts` | `auth.service.test.ts` |
| E2E Test | `{feature}.e2e.test.ts` | `auth.e2e.test.ts` |

#### React Native Mobile

| Type | Pattern | Example |
|------|---------|---------|
| Component | `PascalCase.tsx` | `Button.tsx`, `UserCard.tsx` |
| Screen | `{Name}Screen.tsx` | `LoginScreen.tsx` |
| Hook | `use{Name}.ts` | `useAuth.ts`, `useLogin.ts` |
| Screen hook | `use{Screen}Screen.ts` | `useLoginScreen.ts` |
| Store | `{name}.store.ts` | `auth.store.ts` |
| Schema | `{name}.schemas.ts` | `auth.schemas.ts` |
| Utils | `{name}.ts` | `cn.ts`, `storage.ts` |
| Types | `{name}.types.ts` | `navigation.types.ts` |
| Test | `{Name}.test.tsx` | `Button.test.tsx` |

#### MCP Server

| Type | Pattern | Example |
|------|---------|---------|
| Tool | `{name}.tool.ts` | `eng-executor.tool.ts` |
| Resource | `{name}.resource.ts` | `config.resource.ts` |
| Prompt | `{name}.prompt.ts` | `analysis.prompt.ts` |
| Types | `{domain}.types.ts` | `session.types.ts` |
| Schema | `{name}.schema.ts` | `tool-inputs.schema.ts` |
| Config | `{name}.ts` | `constants.ts` |

---

## Import Order

Consistent ordering improves readability and reduces merge conflicts.

```typescript
// 1. Node.js built-ins
import { join, resolve } from 'path'
import { readFile } from 'fs/promises'

// 2. External packages (frameworks first, then alphabetical)
import { Module, Injectable } from '@nestjs/common'
import { InjectModel } from '@nestjs/mongoose'
import { z } from 'zod'

// 3. Monorepo packages (@org/*)
import { User } from '@org/types'
import { formatDate } from '@org/utils'

// 4. Internal absolute imports (@/ alias)
import { GqlAuthGuard } from '@/common/guards'
import { Button, Input } from '@/shared/components/ui'
import { useAuthStore } from '@/stores/auth.store'

// 5. Relative imports (parent dirs first, then siblings)
import { AuthService } from '../auth.service'
import { UserService } from './user.service'
import { CreateUserInput } from './dto'
```

---

## Platform-Specific Patterns

### NestJS Backend

#### Module Architecture

**Facade pattern:** Expose one public service, hide internal implementation.

```typescript
// auth.module.ts
@Module({
  imports: [PassportModule, JwtModule, SchemasModule],
  providers: [
    // Internal services (NOT exported)
    AuthAppleService,
    AuthTokenService,
    // Public facade
    AuthService,
    // Entry point (NEVER export)
    AuthResolver,
  ],
  exports: [AuthService],  // Only facade
})
export class AuthModule {}
```

#### Barrel Files

```typescript
// index.ts — explicit public API
export { AuthService } from './auth.service'
export { LoginInput, AuthResponse } from './dto'

// ❌ Never export:
// - Resolvers/Controllers (entry points)
// - Internal services
// - Module class itself
```

#### Service Patterns

```typescript
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private readonly logger: Logger,
  ) {}

  // Public method with explicit return type
  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec()
  }

  // Throw typed exceptions
  async findByIdOrThrow(id: string): Promise<UserDocument> {
    const user = await this.findById(id)
    if (!user) {
      throw new NotFoundException(`User ${id} not found`)
    }
    return user
  }
}
```

### React Native Mobile

#### One Hook Per Screen

**Required pattern for testability and separation of concerns.**

```typescript
// hooks/useLoginScreen.ts — ALL logic here
export function useLoginScreen() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { mutateAsync: login, isPending } = useLogin()

  const handleSubmit = async () => {
    setError(null)

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    try {
      await login({ email: email.trim(), password })
      router.replace('/(main)/home')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isLoading: isPending,
    handleSubmit,
  }
}

// screens/LoginScreen.tsx — pure JSX (40-60 lines)
export function LoginScreen() {
  const {
    email, setEmail,
    password, setPassword,
    error, isLoading,
    handleSubmit,
  } = useLoginScreen()

  return (
    <KeyboardAwareScrollView>
      <View className="flex-1 px-6 py-12">
        {error && <ErrorBanner message={error} />}
        <Input value={email} onChangeText={setEmail} placeholder="Email" />
        <Input value={password} onChangeText={setPassword} secureTextEntry />
        <Button onPress={handleSubmit} disabled={isLoading}>
          {isLoading ? 'Signing in...' : 'Sign In'}
        </Button>
      </View>
    </KeyboardAwareScrollView>
  )
}
```

#### Component Requirements

| Requirement | Correct | Incorrect |
|-------------|---------|-----------|
| Touch handling | `Pressable` | `TouchableWithoutFeedback` |
| Safe area | `SafeAreaView` from `react-native-safe-area-context` | `SafeAreaView` from `react-native` |
| Styling | NativeWind (`className`) | `StyleSheet.create` |
| Lists | `FlashList` | `FlatList` for large lists |

#### Component Variants

**Extend existing components with variants instead of creating duplicates.**

```typescript
// ✅ Single component with variants
<Button variant="primary" size="lg" />
<Button variant="ghost" size="sm" />

// ❌ Don't create separate components
<PrimaryButton />
<GhostButton />
```

### MCP Server

#### Self-Registering Tools

```typescript
// tools/eng-executor.tool.ts
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { EngExecutorInput } from '../schemas/tool-inputs.schema.js'

export function registerEngExecutor(server: McpServer): void {
  server.registerTool(
    'eng_executor',
    {
      title: 'Engineering Executor',
      description: 'Run TDD implementation with iterations',
      inputSchema: EngExecutorInput,
    },
    async ({ target, task, max_iterations }, extra) => {
      // Implementation
    }
  )
}

// tools/index.ts — registration hub
export function registerAllTools(server: McpServer): void {
  registerEngExecutor(server)
  registerAuditExecutor(server)
  registerMaestroExecutor(server)
}

// index.ts — minimal entry (~30-50 lines)
async function main(): Promise<void> {
  setupProcessHandlers()

  const server = createServer()
  registerAllTools(server)

  const transport = createStdioTransport()
  await server.connect(transport)

  log('INFO', 'MCP Server running')
}

main().catch(err => {
  log('ERROR', `Fatal: ${err}`)
  process.exit(1)
})
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
| `items.push()` on state | Breaks React/Zustand | `[...items, item]` |
| Logic in screen components | Untestable | Extract to `use*Screen` hook |
| Exporting resolvers | Leaks implementation | Keep resolvers internal |
| Global mutable state (MCP) | Hard to test | Use AsyncLocalStorage context |
| Duplicate components | Maintenance burden | Add variants to existing |
| `TouchableWithoutFeedback` | Legacy API | Use `Pressable` |

---

## Quality Checklist

### Before Completing Work

**Universal:**
- [ ] Functions under 50 lines (soft limit)
- [ ] Files under 300 lines (soft limit)
- [ ] No nesting deeper than 3 levels
- [ ] Errors logged with identifying context
- [ ] No `console.log` in production code
- [ ] No hardcoded magic values
- [ ] Immutable patterns for shared state
- [ ] Explicit types on exported functions
- [ ] Import order follows convention

**NestJS:**
- [ ] Only facade service exported from module
- [ ] Resolvers/controllers not exported
- [ ] DTOs have validation decorators
- [ ] Services have proper error handling

**React Native:**
- [ ] Screen logic extracted to hook
- [ ] Using `Pressable` for interactions
- [ ] Using `SafeAreaView` from correct package
- [ ] Checked for existing components before creating

**MCP Server:**
- [ ] Tools are self-registering
- [ ] Entry point is minimal (<50 lines)
- [ ] Schemas centralized in `schemas/`
- [ ] Proper process cleanup handlers

---

## Flexibility Notes

These rules are guidelines, not laws. Use judgment:

- **Size limits are soft** — A 55-line function is fine if cohesive
- **Patterns can flex** — Context matters more than rigid rules
- **Consistency wins** — Match existing code style in a file
- **Readability first** — If breaking a rule improves clarity, consider it
- **Document exceptions** — Comment when deliberately deviating
