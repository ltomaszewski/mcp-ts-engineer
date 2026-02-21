# Documentation-Driven Development (DDD)

**CRITICAL: This workflow is MANDATORY for all feature development.**

## Philosophy

All features must follow a strict **Spec → Test → Implement** workflow:
1. **Specification First**: Define behavior in documentation before any code
2. **Tests from Specs**: Write tests that validate the spec requirements
3. **Implementation Last**: Only implement after tests are in place and failing

**Result**: 40-60% faster development, better code quality, fewer bugs.

---

## Documentation Structure

```
docs/
├── specs/                    # Feature specifications (PRDs)
│   ├── server/              # Backend feature specs
│   │   ├── auth/
│   │   │   └── apple-sign-in.spec.md
│   │   ├── schedule/
│   │   │   └── sleep-schedule-generation.spec.md
│   │   └── notifications/
│   │       └── push-notifications.spec.md
│   └── client/              # Frontend feature specs
│       ├── screens/
│       │   └── today-screen.spec.md
│       └── components/
│           └── sleep-session-card.spec.md
├── architecture/            # System design documents
│   ├── data-flow.md
│   └── state-management.md
└── api/                     # API contracts
    └── graphql-schema.md
```

---

# PRD Writing Guide

## What is a PRD?

**PRD** = Product Requirement Document

A PRD is a specification that describes:
- What you're building
- Why you're building it
- How it should work
- What success looks like

**Purpose**: Bridge communication between Product, Engineering, and Design.

**Length**: 2-10 pages (focused, not a novel)

---

## PRD Template

```markdown
# [Feature Name] - Product Requirement Document

**Author**: [Name]
**Date**: [YYYY-MM-DD]
**Status**: Draft | Review | Approved

## Problem Statement

### Current Situation
- What's the current pain point?
- How frequently does it occur?
- User impact?

### Desired Outcome
- What should change?
- How will users benefit?
- Business impact?

## Goals
- [ ] Specific goal 1
- [ ] Specific goal 2
- [ ] Specific goal 3

## Non-Goals
- Out of scope item 1
- Out of scope item 2

## Success Metrics

| Metric | Target | Current |
|--------|--------|---------|
| [Metric 1] | [Target] | [Current] |

## Feature Specification

### Feature 1: [Name]
- Location: [Where in UI]
- Behavior: [What it does]
- Edge cases: [Special scenarios]

## Requirements

### Functional Requirements
- FR-1: [Requirement description]
- FR-2: [Requirement description]

### Non-Functional Requirements
| Requirement | Target |
|-------------|--------|
| Response time | < 100ms |
| Uptime | 99.9% |
| Accessibility | WCAG 2.1 AA |

## Acceptance Criteria

```
Given: [Precondition]
When: [Action]
Then: [Expected result]
```

## Edge Cases
- EC-1: [Edge case description and expected behavior]

## Error Handling
| Error Condition | Expected Behavior | Error Message |
|-----------------|-------------------|---------------|
| [Condition] | [Behavior] | [Message] |

## Dependencies
- [ ] Dependency 1
- [ ] Dependency 2

## Test Coverage Requirements
- [ ] Unit tests for [component]
- [ ] Integration tests for [flow]
- [ ] E2E tests for [user journey]
```

---

## AI-Optimized PRD Principles

When writing PRDs that AI tools (Claude, etc.) will use to generate code:

### Principle 1: Hierarchical Specificity

Use headers to create clear hierarchy:

```markdown
# Feature: Payment Processing

## Payment Flow
- User clicks checkout
- System displays form

### Credit Card Payment
- Fields: Number, expiry, CVV
- Validation: Luhn algorithm

### PayPal Payment
- Redirect to PayPal
- Handle callback
```

### Principle 2: Code Specifications

Include exact types/interfaces you want:

```markdown
## Data Types

```typescript
interface Payment {
  id: string;
  amount: number;
  currency: 'USD' | 'EUR' | 'GBP';
  status: 'pending' | 'completed' | 'failed';
  createdAt: Date;
}
```
```

### Principle 3: Error Handling Matrix

Specify all error scenarios:

```markdown
## Error Scenarios

| Scenario | Input | Expected Behavior | Error Message |
|----------|-------|-------------------|---------------|
| Invalid amount | amount: -10 | Reject | "Amount must be positive" |
| Expired card | expiry: "01/20" | Reject | "Card expired" |
| Network timeout | timeout 5s | Retry 3x | "Processing timeout" |
```

### Principle 4: Constraint Directives

Use explicit directives:

```markdown
## Security Constraints

🔒 MUST: All data encrypted at rest
🔒 MUST: Never log sensitive data
⚠️ SHOULD: Implement rate limiting
ℹ️ COULD: Add fraud detection (future)

## Performance Constraints

⚡ MUST: Process within 3 seconds
⚡ MUST: Database query < 100ms
⚡ SHOULD: Cache results (30 min TTL)
```

---

# TDD Methodology

## What is Test-Driven Development?

**TDD** = Write tests FIRST, then write code.

**Traditional**: Write Code → Test Code → Debug → Repeat
**TDD**: Write Tests → Write Code → Refactor → Repeat

**Benefits**:
- ✅ Fewer bugs (better coverage)
- ✅ Cleaner code (designing for testability)
- ✅ Confidence in changes (tests catch regressions)
- ✅ Better documentation (tests show usage)

---

## The Red-Green-Refactor Cycle

### Step 1: RED (Write Test)

Write a test for functionality that doesn't exist:

```typescript
describe('UserService', () => {
  it('should create user with valid email', () => {
    const user = userService.createUser({
      email: 'john@example.com',
      name: 'John Doe'
    });

    expect(user.email).toBe('john@example.com');
    expect(user.id).toBeDefined();
  });
});
```

**State**: Test FAILS (red) - function doesn't exist.

### Step 2: GREEN (Write Code)

Write MINIMUM code to make test pass:

```typescript
export class UserService {
  createUser(input: { email: string; name: string }) {
    return {
      id: 'abc123',
      email: input.email,
      name: input.name
    };
  }
}
```

**State**: Test PASSES (green) - even if hacky.

### Step 3: REFACTOR (Improve Code)

Clean up while keeping tests passing:

```typescript
export interface CreateUserInput {
  email: string;
  name: string;
}

export interface User extends CreateUserInput {
  id: string;
  createdAt: Date;
}

export class UserService {
  private idGenerator = new IdGenerator();

  createUser(input: CreateUserInput): User {
    this.validateEmail(input.email);
    return {
      id: this.idGenerator.generate(),
      ...input,
      createdAt: new Date()
    };
  }

  private validateEmail(email: string): void {
    if (!email.includes('@')) {
      throw new Error('Invalid email format');
    }
  }
}
```

**State**: Test still PASSES, code is cleaner.

### Repeat: Add Next Test

```typescript
it('should reject invalid email', () => {
  expect(() => {
    userService.createUser({
      email: 'invalid-email',
      name: 'John'
    });
  }).toThrow('Invalid email format');
});
```

Back to RED → GREEN → REFACTOR → Next test

---

## Jest Fundamentals

### Test Structure: Arrange-Act-Assert

```typescript
describe('Calculator', () => {
  const calculator = new Calculator();

  it('should add two numbers', () => {
    // Arrange
    const a = 2;
    const b = 3;

    // Act
    const result = calculator.add(a, b);

    // Assert
    expect(result).toBe(5);
  });
});
```

### Common Jest Matchers

| Matcher | Use Case | Example |
|---------|----------|---------|
| `.toBe()` | Exact equality (===) | `expect(2 + 2).toBe(4)` |
| `.toEqual()` | Deep equality | `expect({a:1}).toEqual({a:1})` |
| `.toBeTruthy()` | Truthy value | `expect(true).toBeTruthy()` |
| `.toBeFalsy()` | Falsy value | `expect(false).toBeFalsy()` |
| `.toBeNull()` | Null value | `expect(null).toBeNull()` |
| `.toBeUndefined()` | Undefined | `expect(undefined).toBeUndefined()` |
| `.toBeDefined()` | Not undefined | `expect(value).toBeDefined()` |
| `.toThrow()` | Throws error | `expect(fn).toThrow()` |
| `.toContain()` | Array contains | `expect([1,2,3]).toContain(2)` |
| `.toMatch()` | String regex | `expect('test').toMatch(/es/)` |
| `.toHaveBeenCalled()` | Mock called | `expect(mock).toHaveBeenCalled()` |
| `.toHaveLength()` | Length | `expect('hello').toHaveLength(5)` |

### Testing Async Code

```typescript
describe('fetchUser', () => {
  it('should fetch user data', async () => {
    const user = await fetchUser(1);
    expect(user.id).toBe(1);
    expect(user.name).toBeDefined();
  });

  it('should handle error', async () => {
    await expect(fetchUser(999)).rejects.toThrow();
  });
});
```

### Mocking with TypeScript

```typescript
interface PaymentGateway {
  charge(amount: number): Promise<string>;
}

describe('PaymentService', () => {
  let mockGateway: jest.Mocked<PaymentGateway>;
  let service: PaymentService;

  beforeEach(() => {
    mockGateway = { charge: jest.fn() };
    service = new PaymentService(mockGateway);
  });

  it('should call gateway with correct amount', async () => {
    mockGateway.charge.mockResolvedValue('txn_123');

    const result = await service.processPayment(100);

    expect(mockGateway.charge).toHaveBeenCalledWith(100);
    expect(result).toBe('txn_123');
  });
});
```

---

# DDD Workflow

## PHASE 1: Specification (BLOCKING)

1. Create spec in `docs/specs/`
2. Spec must include all template sections
3. Include FR-X, EC-X identifiers
4. Commit: `docs: add spec for [feature]`

**Claude Code MUST refuse to write implementation if no spec exists.**

## PHASE 2: Test Creation (BLOCKING)

1. Create test files based on spec requirements
2. Tests MUST reference spec (`FR-X`, `EC-X` in test names)
3. All tests MUST initially FAIL

**Claude Code MUST refuse to write implementation if tests don't exist.**

## PHASE 3: Implementation

1. Implement minimum code to make tests pass
2. Refactor while keeping tests green
3. Run lint/types/build before commit

---

## Test Naming Convention

```typescript
describe('SleepScheduleService', () => {
  describe('generateSchedule [FR-1]', () => {
    it('should generate schedule based on kid age [FR-1.1]', () => {});
  });

  describe('edge cases', () => {
    it('should handle missing kid data [EC-1]', () => {});
  });
});
```

---

## Exceptions

The following do NOT require full DDD:
- Bug fixes (but MUST add regression test)
- Documentation updates
- Dependency updates
- Config changes
- Refactoring (tests must continue passing)

---

## Quick Reference

| Phase | Blocker | Artifact |
|-------|---------|----------|
| 1. Spec | Cannot write tests | `docs/specs/**/*.spec.md` |
| 2. Test | Cannot write impl | `**/*.test.ts` with FR-X/EC-X |
| 3. Implement | Tests must pass | Source code |

---

## Anti-Patterns

- Writing implementation before spec
- Writing implementation before tests
- Skipping spec for "small" features
- Tests that don't reference spec requirements
- Specs without clear acceptance criteria
- Guessing fixes without understanding root cause
- More than 2 fix attempts without stepping back

---

## Complete Workflow Example

### 1. PRD Section
```markdown
# PRD: Checkout Flow

## Problem
Users cannot securely purchase items.

## Goals
- Process payments (credit card + PayPal)
- Generate order confirmation
- < 3 second processing

## Acceptance Criteria
Given: User has items in cart
When: User clicks checkout
Then: Checkout form displays

Given: User enters valid card
When: User clicks "Pay"
Then: Payment processes
And: Order created
And: Confirmation email sent
```

### 2. Test (RED)
```typescript
describe('CheckoutService', () => {
  it('should process payment and create order [FR-1]', async () => {
    const checkout = {
      items: [{ productId: '1', quantity: 2, price: 50 }],
      email: 'user@example.com',
      cardToken: 'tok_123'
    };

    const result = await checkoutService.process(checkout);

    expect(result.orderId).toBeDefined();
    expect(result.status).toBe('completed');
  });

  it('should reject invalid card [EC-1]', async () => {
    await expect(
      checkoutService.process({ ...checkout, cardToken: 'invalid' })
    ).rejects.toThrow('Card declined');
  });
});
```

### 3. Implementation (GREEN)
```typescript
export class CheckoutService {
  async process(input: CheckoutInput): Promise<Order> {
    this.validateInput(input);

    const total = input.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );

    const paymentResult = await this.paymentService.charge({
      amount: total,
      token: input.cardToken
    });

    const order = await this.orderService.create({
      items: input.items,
      total,
      status: 'completed',
      transactionId: paymentResult.transactionId
    });

    await this.emailService.sendConfirmation({
      to: input.email,
      order
    });

    return order;
  }
}
```

---

## Summary

**DDD = Spec → Test → Implement**

1. Write PRD with FR-X, EC-X identifiers
2. Write failing tests referencing those identifiers
3. Implement minimum code to pass tests
4. Refactor while green
5. Run lint/types/tests/build
6. Commit
