# 02 - Function Design

**Source:** https://www.typescriptlang.org/docs/handbook/2/functions.html
**TypeScript:** 5.9 | **Status:** Complete reference

---

## Table of Contents

1. [Size Limits](#size-limits)
2. [Single Responsibility](#single-responsibility)
3. [Pure Functions](#pure-functions)
4. [Early Returns](#early-returns)
5. [Explicit Return Types](#explicit-return-types)
6. [Parameter Design](#parameter-design)
7. [Abstraction Levels](#abstraction-levels)
8. [Async Function Patterns](#async-function-patterns)

---

## Size Limits

```
Preferred lines:        20-30
Max lines:              50
Max statements:         15
Max parameters:         4
Max nesting depth:      3
Cyclomatic complexity:  10
```

Functions over 30 lines should be reviewed for potential splitting. 50 lines is the hard maximum.

---

## Single Responsibility

A function should do one thing and do it well.

```typescript
// BAD: Multiple responsibilities in one function
function processOrder(order: Order): void {
  // Validate (10 lines)
  // Calculate totals (15 lines)
  // Apply discounts (20 lines)
  // Update inventory (10 lines)
  // Send notifications (15 lines)
}

// GOOD: Single responsibility per function
function processOrder(order: Order): ProcessedOrder {
  validateOrder(order);
  const total = calculateTotal(order);
  const finalTotal = applyDiscounts(order, total);
  updateInventory(order);
  sendOrderNotifications(order);
  return { ...order, total: finalTotal };
}
```

---

## Pure Functions

Prefer pure functions -- same inputs always produce same outputs, no side effects.

```typescript
// BAD: Side effect via mutable external state
let total = 0;
function addToTotal(value: number): number {
  total += value; // Mutates external state
  return total;
}

// GOOD: Pure function
function add(a: number, b: number): number {
  return a + b;
}

// GOOD: Pure transformation
function applyDiscount(price: number, rate: number): number {
  return price * (1 - rate);
}

// GOOD: Pure array transformation
function getActiveUserEmails(users: readonly User[]): string[] {
  return users
    .filter((user) => user.isActive)
    .map((user) => user.email);
}
```

---

## Early Returns

Flatten nested conditionals with guard clauses.

```typescript
// BAD: Deep nesting
function processUser(user: User | null): Result {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        return doProcess(user);
      }
    }
  }
  return null;
}

// GOOD: Guard clauses with early returns
function processUser(user: User | null): Result {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission) return null;

  return doProcess(user);
}

// GOOD: Early return with error context
async function findUser(id: string): Promise<User> {
  if (!id) {
    throw new ValidationError('User ID is required');
  }

  const user = await repository.findById(id);
  if (!user) {
    throw new NotFoundError('User', id);
  }

  return user;
}
```

---

## Explicit Return Types

Always declare return types on exported functions. This prevents accidental API changes and improves IDE support.

```typescript
// BAD: Inferred return type (can change accidentally)
export function calculateTotal(items: Item[]) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// GOOD: Explicit return type
export function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// GOOD: Async with explicit Promise type
export async function fetchUser(id: string): Promise<User | null> {
  return repository.findById(id);
}

// GOOD: Generic with constrained return
export function firstOrThrow<T>(items: readonly T[]): T {
  if (items.length === 0) {
    throw new Error('Array is empty');
  }
  return items[0];
}
```

---

## Parameter Design

### Max 4 Parameters

```typescript
// BAD: Too many positional parameters
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string,
): User { /* ... */ }

// GOOD: Options object for 3+ parameters
interface CreateUserOptions {
  name: string;
  email: string;
  age?: number;
  address?: string;
  phone?: string;
}

function createUser(options: CreateUserOptions): User {
  const { name, email, age, address, phone } = options;
  // ...
}

// Clear at call site
createUser({ name: 'John', email: 'john@example.com', age: 30 });
```

### Avoid Boolean Parameters

```typescript
// BAD: Boolean flag -- unclear at call site
createUser('John', true); // What does true mean?

// GOOD: Separate functions or discriminated options
function createUser(name: string): User { /* ... */ }
function createAdminUser(name: string): User { /* ... */ }

// Or with typed options
interface CreateUserOptions {
  name: string;
  role: 'user' | 'admin';
}
function createUser(options: CreateUserOptions): User { /* ... */ }
```

### Readonly Parameters

```typescript
// GOOD: Prevent accidental mutation of input arrays/objects
function processItems(items: readonly Item[]): number {
  // items.push() would be a compile error
  return items.reduce((sum, item) => sum + item.price, 0);
}

function updateUser(user: Readonly<User>, changes: Partial<User>): User {
  return { ...user, ...changes };
}
```

---

## Abstraction Levels

Keep functions at a single level of abstraction.

```typescript
// BAD: Mixed abstraction levels
function getPageHtml(url: string): string {
  const socket = new Socket();      // Low-level
  socket.connect(url, 80);          // Low-level
  const response = socket.read();   // Low-level
  const html = parseHtml(response); // High-level
  return html;
}

// GOOD: Consistent abstraction
function getPageHtml(url: string): string {
  const response = fetchUrl(url);
  return parseHtml(response);
}
```

---

## Async Function Patterns

### Use async/await Over Promise Chains

```typescript
// BAD: Promise chains obscure stack traces
function fetchData(): Promise<Data> {
  return fetch(url)
    .then((res) => res.json())
    .then((data) => processData(data))
    .catch((err) => handleError(err));
}

// GOOD: async/await preserves stack traces
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch(url);
    const data = await response.json();
    return processData(data);
  } catch (error) {
    throw new FetchError('Failed to fetch data', { cause: error });
  }
}
```

### Named Functions for Stack Traces

```typescript
// BAD: Anonymous arrow -- poor stack trace
const processUser = (user: User) => { /* ... */ };

// GOOD: Named function expression
const processUser = function processUser(user: User): Result {
  // Stack trace shows "processUser"
  return doProcess(user);
};
```

---

## Cross-References

- **Size limits enforcement:** [09-type-safety.md](./09-type-safety.md)
- **Naming functions:** [04-naming-conventions.md](./04-naming-conventions.md)
- **Error handling in functions:** [06-error-handling.md](./06-error-handling.md)

---

**Source:** https://www.typescriptlang.org/docs/handbook/2/functions.html
**TypeScript:** 5.9
**Last Updated:** February 2026
