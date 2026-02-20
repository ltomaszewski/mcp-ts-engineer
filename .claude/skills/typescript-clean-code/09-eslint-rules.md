# ESLint Complexity Rules

## Recommended Configuration

```javascript
// .eslintrc.js
module.exports = {
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    // Complexity
    'complexity': ['error', { max: 10 }],
    'max-depth': ['error', { max: 3 }],
    'max-nested-callbacks': ['error', { max: 3 }],

    // Size limits
    'max-lines': ['error', {
      max: 300,
      skipBlankLines: true,
      skipComments: true,
    }],
    'max-lines-per-function': ['error', {
      max: 50,
      skipBlankLines: true,
      skipComments: true,
    }],
    'max-statements': ['error', { max: 15 }],
    'max-params': ['error', { max: 4 }],

    // TypeScript specific - STRICT TYPE SAFETY
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/explicit-module-boundary-types': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unsafe-argument': 'error',
    '@typescript-eslint/no-unsafe-assignment': 'error',
    '@typescript-eslint/no-unsafe-call': 'error',
    '@typescript-eslint/no-unsafe-member-access': 'error',
    '@typescript-eslint/no-unsafe-return': 'error',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-floating-promises': 'error',
    '@typescript-eslint/await-thenable': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'warn',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',

    // Code quality
    'no-console': 'warn',
    'no-debugger': 'error',
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'no-var': 'error',
    'prefer-const': 'error',
  },
};
```

## Rule Explanations

### complexity (max: 10)

Cyclomatic complexity counts independent paths through code.

```typescript
// Complexity: 4 (if + if + if + default path)
function process(value: number): string {
  if (value < 0) return 'negative';
  if (value === 0) return 'zero';
  if (value > 100) return 'large';
  return 'normal';
}
```

### max-depth (max: 3)

Maximum nesting depth of blocks.

```typescript
// BAD: Depth 4
if (a) {
  if (b) {
    if (c) {
      if (d) { /* depth 4 */ }
    }
  }
}

// GOOD: Use early returns
if (!a) return;
if (!b) return;
if (!c) return;
if (d) { /* depth 1 */ }
```

### max-lines-per-function (max: 50)

```typescript
// Function should be under 50 lines
// Split into smaller functions if larger
function processOrder(order: Order): void {
  validateOrder(order);
  calculateTotals(order);
  applyDiscounts(order);
  updateInventory(order);
  sendNotifications(order);
}
```

### max-params (max: 4)

```typescript
// BAD: 6 parameters
function create(a, b, c, d, e, f) {}

// GOOD: Use object parameter
interface CreateOptions {
  a: string;
  b: number;
  c: boolean;
  d: string;
  e: number;
  f: boolean;
}
function create(options: CreateOptions) {}
```

## TypeScript-Specific Rules

### explicit-function-return-type

```typescript
// BAD: No return type
function add(a: number, b: number) {
  return a + b;
}

// GOOD: Explicit return type
function add(a: number, b: number): number {
  return a + b;
}
```

### no-explicit-any

```typescript
// BAD: Using any
function process(data: any): any {
  return data.value;
}

// GOOD: Proper types
function process(data: UserData): string {
  return data.value;
}
```

### Handling unknown Types (STRICT RULES)

**RULE: Never leave `unknown` untyped. Always narrow or define interfaces.**

```typescript
// BAD: Untyped unknown - defeats the purpose
function transform(data: unknown): unknown {
  return data; // Still untyped
}

// BAD: Using Record<string, unknown> as a catch-all
interface BadOutput {
  metadata: Record<string, unknown>; // What's actually in here?
}

// BAD: Type assertion without validation
function process(data: unknown): UserData {
  return data as UserData; // Dangerous - no runtime check
}

// GOOD: Define explicit interface for known shapes
interface UserMetadata {
  lastLogin: Date;
  preferences: UserPreferences;
  deviceInfo: DeviceInfo;
}

interface GoodOutput {
  metadata: UserMetadata; // Fully typed
}

// GOOD: Type guard for truly unknown external data
function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as UserData).id === 'string'
  );
}

function processExternal(data: unknown): UserData {
  if (!isUserData(data)) {
    throw new Error('Invalid user data format');
  }
  return data; // Now properly typed
}

// GOOD: Generic with constraints instead of unknown
function transform<T extends BaseEntity>(entity: T): TransformedEntity<T> {
  return { ...entity, transformed: true };
}
```

### Data Transformation Pattern

```typescript
// BAD: Mongoose document to output with unknown
function toOutput(doc: Document): { data: unknown } {
  return { data: doc.toObject() };
}

// GOOD: Typed transformation
interface KidDocument {
  _id: Types.ObjectId;
  name: string;
  birthdate: Date;
}

interface KidOutput {
  id: string;
  name: string;
  birthdate: string;
}

function toKidOutput(doc: KidDocument): KidOutput {
  return {
    id: doc._id.toString(),
    name: doc.name,
    birthdate: doc.birthdate.toISOString(),
  };
}
```

### no-floating-promises

```typescript
// BAD: Unhandled promise
async function fetchData() {
  fetch('/api/data'); // Floating promise
}

// GOOD: Handle the promise
async function fetchData() {
  await fetch('/api/data');
  // or
  void fetch('/api/data'); // Explicitly ignore
}
```

## Disabling Rules (When Necessary)

```typescript
// Disable for single line
// eslint-disable-next-line max-lines-per-function
function necessarilyLongFunction() { /* ... */ }

// Disable for block
/* eslint-disable complexity */
function legacyComplexFunction() { /* ... */ }
/* eslint-enable complexity */

// Disable with explanation
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- Third-party type issue
function handleExternalData(data: any) { /* ... */ }
```
