# Testing Requirements

Test-driven development and verification standards.

---

## Coverage Target: 80%

Across all test types:
1. **Unit Tests** - Functions, services, hooks, utilities
2. **Integration Tests** - API resolvers, database operations
3. **E2E Tests** - Critical user flows (Maestro for mobile)

---

## TDD Workflow

**MANDATORY for new features:**

```
1. RED    - Write failing test first
2. GREEN  - Write minimal code to pass
3. REFACTOR - Improve while tests stay green
4. VERIFY - Check coverage >= 80%
```

**Workflow:**
```bash
# 1. Write test
npm test -- --watch path/to/test

# 2. See it fail (RED)
# 3. Implement feature
# 4. See it pass (GREEN)

# 5. Verify coverage
npm test -- --coverage
```

---

## Test Structure by App

### Server (NestJS)

```
src/modules/user/
  __tests__/
    user.service.spec.ts    # Unit: service methods
    user.resolver.spec.ts   # Integration: GraphQL resolver
```

**Unit test pattern:**
```typescript
describe('UserService', () => {
  let service: UserService
  let mockModel: MockModel<User>

  beforeEach(() => {
    mockModel = createMockModel()
    service = new UserService(mockModel)
  })

  describe('findById', () => {
    it('returns user when found', async () => {
      mockModel.findById.mockResolvedValue(mockUser)
      const result = await service.findById('123')
      expect(result).toEqual(mockUser)
    })

    it('returns null when not found', async () => {
      mockModel.findById.mockResolvedValue(null)
      const result = await service.findById('invalid')
      expect(result).toBeNull()
    })
  })
})
```

### Mobile (React Native)

```
src/features/example/
  __tests__/
    useExampleTimer.test.ts     # Hook tests
    ActionButton.test.tsx       # Component tests
```

**Component test pattern:**
```typescript
import { render, screen, userEvent } from '@testing-library/react-native'

describe('ActionButton', () => {
  it('triggers action on press', async () => {
    const onStart = jest.fn()
    render(<ActionButton onStart={onStart} />)

    await userEvent.press(screen.getByText('Start'))

    expect(onStart).toHaveBeenCalled()
  })

  it('shows active state', () => {
    render(<ActionButton isActive />)
    expect(screen.getByText('Stop')).toBeVisible()
  })
})
```

### E2E Tests (Maestro)

```
.maestro/
  flows/
    sleep/
      start-session.yaml
      end-session.yaml
```

**Flow pattern:**
```yaml
appId: com.example.app
---
- launchApp
- tapOn: "Start"
- assertVisible: "Session started"
- waitForAnimationToEnd
- tapOn: "Stop"
- assertVisible: "Session saved"
```

---

## Test Isolation

**ALWAYS:**
- Each test sets up own data
- Clean up after tests
- No shared mutable state
- Mock external services

```typescript
// GOOD - isolated
describe('UserService', () => {
  beforeEach(() => {
    // Fresh setup each test
  })

  afterEach(() => {
    // Clean up
    jest.clearAllMocks()
  })
})

// BAD - shared state
let sharedUser: User // Different tests modify this
```

---

## Mocking Patterns

### MongoDB/Mongoose

```typescript
const mockModel = {
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  updateOne: jest.fn(),
}

jest.mock('@nestjs/mongoose', () => ({
  InjectModel: () => () => mockModel,
}))
```

### External APIs

```typescript
jest.mock('@/services/appleAuth', () => ({
  verifyIdentityToken: jest.fn().mockResolvedValue({
    sub: 'apple-user-id',
    email: 'test@example.com',
  }),
}))
```

### Time-dependent tests

```typescript
beforeEach(() => {
  jest.useFakeTimers()
  jest.setSystemTime(new Date('2024-01-15T22:00:00Z'))
})

afterEach(() => {
  jest.useRealTimers()
})
```

---

## What to Test

### ALWAYS test:
- Happy path (normal operation)
- Edge cases (empty, null, boundary values)
- Error scenarios (invalid input, failures)
- Async behavior (loading, success, error states)

### DON'T test:
- Implementation details (internal state)
- Third-party library internals
- Simple getters/setters without logic

---

## Test Commands

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Single file
npm test -- path/to/test.ts

# E2E (if applicable)
npm run test:e2e
```

---

## Agent Support

- **tdd-guide** - Use proactively for new features
- **maestro-executor** - E2E test creation
- **code-reviewer** - Catches missing tests

---

## Quality Gates

Before PR:
- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] No skipped tests without justification
- [ ] E2E covers critical paths
