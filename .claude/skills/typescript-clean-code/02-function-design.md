# Function Design

## Size Limits

```
Preferred lines: 20-30
Max lines: 50
Max statements: 15
Max parameters: 4
Max nesting depth: 3
Cyclomatic complexity: 10
```

**Note:** Aim for 20-30 lines per function. Functions over 30 lines
should be reviewed for potential splitting. 50 lines is the hard maximum.

## Functions Do One Thing

```typescript
// BAD: Multiple responsibilities
function processOrder(order: Order): void {
  // Validate (10 lines)
  // Calculate totals (15 lines)
  // Apply discounts (20 lines)
  // Update inventory (10 lines)
  // Send notifications (15 lines)
}

// GOOD: Single responsibility
function processOrder(order: Order): void {
  validateOrder(order);
  const total = calculateTotal(order);
  const finalTotal = applyDiscounts(order, total);
  updateInventory(order);
  sendOrderNotifications(order);
}
```

## Object Parameters for Many Args

```typescript
// BAD: Too many parameters
function createUser(
  name: string,
  email: string,
  age: number,
  address: string,
  phone: string
): User { /* ... */ }

// GOOD: Object parameter
interface CreateUserParams {
  name: string;
  email: string;
  age: number;
  address?: string;
  phone?: string;
}

function createUser(params: CreateUserParams): User { /* ... */ }
```

## Single Level of Abstraction

```typescript
// BAD: Mixed abstraction levels
function getPageHtml(url: string): string {
  const socket = new Socket();
  socket.connect(url, 80);
  const response = socket.read();
  const html = parseHtml(response);
  return html;
}

// GOOD: Consistent abstraction
function getPageHtml(url: string): string {
  const response = fetchUrl(url);
  return parseHtml(response);
}
```

## Pure Functions When Possible

```typescript
// BAD: Side effects
let total = 0;
function addToTotal(value: number): number {
  total += value;
  return total;
}

// GOOD: Pure function
function add(a: number, b: number): number {
  return a + b;
}
```

## Early Returns

```typescript
// BAD: Deep nesting
function processUser(user: User): Result {
  if (user) {
    if (user.isActive) {
      if (user.hasPermission) {
        return doProcess(user);
      }
    }
  }
  return null;
}

// GOOD: Early returns
function processUser(user: User): Result {
  if (!user) return null;
  if (!user.isActive) return null;
  if (!user.hasPermission) return null;

  return doProcess(user);
}
```

## Explicit Return Types

```typescript
// Always declare return types
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}

async function fetchUser(id: string): Promise<User | null> {
  return repository.findById(id);
}
```

## Avoid Boolean Parameters

```typescript
// BAD: Boolean flag
function createUser(name: string, isAdmin: boolean): User { /* ... */ }

// GOOD: Separate functions or options object
function createUser(name: string): User { /* ... */ }
function createAdminUser(name: string): User { /* ... */ }

// Or with options
interface CreateUserOptions {
  name: string;
  role: 'user' | 'admin';
}
function createUser(options: CreateUserOptions): User { /* ... */ }
```
