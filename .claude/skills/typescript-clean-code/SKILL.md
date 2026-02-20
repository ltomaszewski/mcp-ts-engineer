---
name: typescript-clean-code
description: TypeScript clean code patterns - SOLID principles, file/function size limits, TSDoc, error handling, debugging. Use when writing TypeScript code, refactoring, or reviewing code quality.
---

# TypeScript Clean Code

> Framework-agnostic guidelines for writing clean, maintainable, and debuggable TypeScript.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Writing new TypeScript code (any framework)
- Refactoring for maintainability
- Reviewing code quality
- Designing functions, classes, or modules
- Setting up code standards

---

## Critical Rules

**ALWAYS:**
1. Keep files under 300 lines — split by responsibility when larger
2. Keep functions under 50 lines, prefer 20-30 — extract helpers for complex logic
3. Use explicit return types on all functions — prevents accidental API changes
4. Document public APIs with TSDoc — enables IDE hints and documentation generation
5. Preserve stack traces with `{ cause }` — chain errors for debugging

**NEVER:**
1. Use `any` type — use `unknown` with type guards or proper interfaces
2. Leave `unknown` unnarrowed — always validate and narrow before use
3. Nest more than 3 levels deep — extract to functions or early return
4. Use magic numbers — extract to named constants
5. Ignore errors silently — always handle or rethrow with context

---

## Core Patterns

### Size Limits Reference

```
Max lines per file:       300 (500-600 permissive)
Preferred function lines: 20-30
Max function lines:       50
Max parameters:           4 (use options object for more)
Max nesting depth:        3
Max cyclomatic complexity: 10
```

### Explicit Types and Return Types

```typescript
// BAD - inferred return, any param
function process(data) {
  return data.map(x => x.value);
}

// GOOD - explicit types
interface Item {
  id: string;
  value: number;
}

function processItems(items: Item[]): number[] {
  return items.map((item) => item.value);
}
```

### TSDoc for Public APIs

```typescript
/**
 * Calculates the total price including tax.
 *
 * @param items - Array of items with prices
 * @param taxRate - Tax rate as decimal (e.g., 0.1 for 10%)
 * @returns Total price with tax applied
 * @throws {@link InvalidTaxRateError} When taxRate is negative
 *
 * @example
 * ```ts
 * const total = calculateTotal([{ price: 100 }], 0.1);
 * // Returns 110
 * ```
 */
function calculateTotal(items: CartItem[], taxRate: number): number {
  if (taxRate < 0) {
    throw new InvalidTaxRateError('Tax rate cannot be negative');
  }
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 + taxRate);
}
```

### Error Handling with Cause Chain

```typescript
// Preserve original error for debugging
class DatabaseError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'DatabaseError';
  }
}

async function fetchUser(id: string): Promise<User> {
  try {
    return await db.users.findById(id);
  } catch (error) {
    throw new DatabaseError(`Failed to fetch user ${id}`, { cause: error });
  }
}

// Error chain preserved in stack trace:
// DatabaseError: Failed to fetch user 123
//   at fetchUser (...)
// Caused by: MongoError: Connection refused
//   at ...
```

### Reducing Nesting with Early Returns

```typescript
// BAD - deeply nested
function processOrder(order: Order | null): Result {
  if (order) {
    if (order.items.length > 0) {
      if (order.status === 'pending') {
        return processValidOrder(order);
      } else {
        return { error: 'Order not pending' };
      }
    } else {
      return { error: 'No items' };
    }
  } else {
    return { error: 'No order' };
  }
}

// GOOD - early returns, flat
function processOrder(order: Order | null): Result {
  if (!order) {
    return { error: 'No order' };
  }

  if (order.items.length === 0) {
    return { error: 'No items' };
  }

  if (order.status !== 'pending') {
    return { error: 'Order not pending' };
  }

  return processValidOrder(order);
}
```

### Type Guards for Unknown

```typescript
// BAD - unnarrowed unknown
function handleResponse(data: unknown) {
  console.log(data.message); // Error: unknown has no properties
}

// GOOD - type guard to narrow
interface ApiResponse {
  message: string;
  status: number;
}

function isApiResponse(value: unknown): value is ApiResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as ApiResponse).message === 'string'
  );
}

function handleResponse(data: unknown): void {
  if (!isApiResponse(data)) {
    throw new Error('Invalid response format');
  }
  console.log(data.message); // TypeScript knows it's string
}
```

### Options Object for Many Parameters

```typescript
// BAD - too many positional params
function createUser(
  name: string,
  email: string,
  age: number,
  role: string,
  department: string,
  isActive: boolean
) { ... }

// GOOD - options object
interface CreateUserOptions {
  name: string;
  email: string;
  age?: number;
  role?: 'admin' | 'user';
  department?: string;
  isActive?: boolean;
}

function createUser(options: CreateUserOptions): User {
  const { name, email, age, role = 'user', department, isActive = true } = options;
  // ...
}

// Clear at call site
createUser({ name: 'John', email: 'john@example.com', role: 'admin' });
```

---

## Anti-Patterns

**BAD** — Using `any`:
```typescript
function parse(input: any) {
  return input.data.value; // No type safety!
}
```

**GOOD** — Define interface or use unknown with guard:
```typescript
interface ParsedInput {
  data: { value: string };
}

function parse(input: unknown): string {
  if (!isValidInput(input)) {
    throw new Error('Invalid input');
  }
  return input.data.value;
}
```

**BAD** — Swallowing errors:
```typescript
try {
  await riskyOperation();
} catch (e) {
  // Silently ignored
}
```

**GOOD** — Handle or rethrow with context:
```typescript
try {
  await riskyOperation();
} catch (error) {
  logger.error('Operation failed', { error });
  throw new OperationError('Risky operation failed', { cause: error });
}
```

**BAD** — Magic numbers:
```typescript
if (password.length < 8) { ... }
setTimeout(callback, 86400000);
```

**GOOD** — Named constants:
```typescript
const MIN_PASSWORD_LENGTH = 8;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

if (password.length < MIN_PASSWORD_LENGTH) { ... }
setTimeout(callback, ONE_DAY_MS);
```

---

## Quick Reference

| Metric | Limit |
|--------|-------|
| File lines | 300 max |
| Function lines | 50 max (20-30 preferred) |
| Parameters | 4 max |
| Nesting depth | 3 max |
| Cyclomatic complexity | 10 max |

| Task | Pattern |
|------|---------|
| Document function | `/** @param x - desc @returns desc */` |
| Chain errors | `throw new Error('msg', { cause: err })` |
| Narrow unknown | `if (isType(x)) { x.prop }` |
| Many params | Use options object |
| Deep nesting | Early returns |

---

## Code Quality Checklist

- [ ] Functions under 50 lines
- [ ] Files under 300 lines
- [ ] All public methods have TSDoc
- [ ] No `any` types
- [ ] No unnarrowed `unknown`
- [ ] Explicit return types
- [ ] Errors preserve stack traces
- [ ] Descriptive variable names
- [ ] No magic numbers
- [ ] Max 3 nesting levels

---

**Source:** Internal standards based on Clean Code principles
