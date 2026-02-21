# Testing Requirements

Test-driven development and verification standards.

---

## Coverage Target: 80%

Across all test types:
1. **Unit Tests** - Functions, services, utilities
2. **Integration Tests** - API operations, framework integration
3. **E2E Tests** - Critical user/client flows

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
npm test -- --watch

# 2. See it fail (RED)
# 3. Implement feature
# 4. See it pass (GREEN)

# 5. Verify coverage
npm run test:coverage
```

---

## Test Structure

```
src/module/
  __tests__/
    module.test.ts          # Unit: service methods
    module.integration.test.ts  # Integration tests
```

**Unit test pattern:**
```typescript
describe('SessionManager', () => {
  let manager: SessionManager

  beforeEach(() => {
    manager = new SessionManager()
  })

  describe('createSession', () => {
    it('returns session with valid ID', () => {
      const session = manager.createSession('echo_agent')
      expect(session.id).toBeDefined()
      expect(session.capability).toBe('echo_agent')
    })

    it('throws when max depth exceeded', () => {
      expect(() => manager.createSession('test', { depth: 100 }))
        .toThrow()
    })
  })
})
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
describe('CostTracker', () => {
  beforeEach(() => {
    // Fresh setup each test
  })

  afterEach(() => {
    // Clean up
    vi.clearAllMocks()
  })
})

// BAD - shared state
let sharedTracker: CostTracker // Different tests modify this
```

---

## Mocking Patterns

### External Services

```typescript
vi.mock('@anthropic-ai/claude-agent-sdk', () => ({
  default: vi.fn().mockImplementation(() => ({
    messages: { create: vi.fn() },
  })),
}))
```

### Time-dependent tests

```typescript
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-01-15T22:00:00Z'))
})

afterEach(() => {
  vi.useRealTimers()
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
npm run test:watch

# Coverage report
npm run test:coverage

# Single file
npm test -- path/to/test.ts
```

---

## MCP Tools

| Task | MCP Tool |
|------|----------|
| TDD implementation from spec | `mcp__ts-engineer__todo_code_writer` |
| Fix lint/type/test violations | `mcp__ts-engineer__audit_fix` |
| Final audit + commit | `mcp__ts-engineer__finalize` |

---

## Quality Gates

Before PR:
- [ ] All tests pass
- [ ] Coverage >= 80%
- [ ] No skipped tests without justification
