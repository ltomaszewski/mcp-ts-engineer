# 09 - Type Safety & TypeScript 5.9

**Source:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html
**TypeScript:** 5.9 | **Status:** Complete reference

---

## Table of Contents

1. [Strict Configuration](#strict-configuration)
2. [Type Guards](#type-guards)
3. [Discriminated Unions](#discriminated-unions)
4. [The satisfies Operator](#the-satisfies-operator)
5. [Explicit Resource Management](#explicit-resource-management)
6. [Import Defer (TS 5.9)](#import-defer-ts-59)
7. [Forbidden Patterns](#forbidden-patterns)
8. [Required Patterns](#required-patterns)
9. [Data Transformation Rules](#data-transformation-rules)

---

## Strict Configuration

Recommended `tsconfig.json` for strict type safety:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitOverride": true,
    "noPropertyAccessFromIndexSignature": true,
    "forceConsistentCasingInFileNames": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "nodenext",
    "moduleResolution": "nodenext",
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "skipLibCheck": true
  }
}
```

| Option | Purpose |
|--------|---------|
| `strict` | Enables all strict mode checks |
| `noUncheckedIndexedAccess` | Adds `undefined` to indexed access types |
| `exactOptionalPropertyTypes` | Distinguishes `undefined` from missing |
| `noImplicitOverride` | Requires `override` keyword on overridden methods |
| `noPropertyAccessFromIndexSignature` | Forces bracket notation for index signatures |

---

## Type Guards

### Custom Type Guards

```typescript
import type { ApiResponse, UserData } from './types';

function isApiResponse(value: unknown): value is ApiResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'status' in value &&
    'data' in value &&
    typeof (value as ApiResponse).status === 'number'
  );
}

function isUserData(data: unknown): data is UserData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'id' in data &&
    'name' in data &&
    typeof (data as UserData).id === 'string' &&
    typeof (data as UserData).name === 'string'
  );
}

// Usage with unknown
function processExternal(data: unknown): UserData {
  if (!isUserData(data)) {
    throw new Error('Invalid user data format');
  }
  return data; // Now properly typed as UserData
}
```

### Assertion Functions (TS 3.7+)

```typescript
function assertIsString(value: unknown): asserts value is string {
  if (typeof value !== 'string') {
    throw new TypeError(`Expected string, got ${typeof value}`);
  }
}

function assertDefined<T>(
  value: T | null | undefined,
  name: string,
): asserts value is T {
  if (value === null || value === undefined) {
    throw new Error(`${name} must be defined`);
  }
}

// Usage
function processInput(input: unknown): string {
  assertIsString(input);
  return input.toUpperCase(); // TypeScript knows it's string
}
```

---

## Discriminated Unions

Use a literal type discriminant for exhaustive type narrowing:

```typescript
type AsyncState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };

function renderState<T>(state: AsyncState<T>): string {
  switch (state.status) {
    case 'idle':
      return 'Ready';
    case 'loading':
      return 'Loading...';
    case 'success':
      return `Data: ${JSON.stringify(state.data)}`;
    case 'error':
      return `Error: ${state.error.message}`;
  }
}

// Exhaustive check helper
function assertNever(value: never): never {
  throw new Error(`Unexpected value: ${JSON.stringify(value)}`);
}

type Shape =
  | { kind: 'circle'; radius: number }
  | { kind: 'rectangle'; width: number; height: number };

function area(shape: Shape): number {
  switch (shape.kind) {
    case 'circle':
      return Math.PI * shape.radius ** 2;
    case 'rectangle':
      return shape.width * shape.height;
    default:
      return assertNever(shape); // Compile error if case missed
  }
}
```

---

## The satisfies Operator

Introduced in TS 4.9. Validates that a value matches a type while preserving the specific inferred type.

```typescript
// Without satisfies - type is widened
const config: Record<string, string | number> = {
  port: 3000,
  host: 'localhost',
};
config.port; // string | number (too wide)

// With satisfies - type is preserved
const config2 = {
  port: 3000,
  host: 'localhost',
} satisfies Record<string, string | number>;
config2.port; // number (precise)
config2.host; // string (precise)

// Validates against a type without losing specificity
type ColorConfig = Record<string, [number, number, number] | string>;

const palette = {
  primary: [0, 122, 255],
  secondary: '#6c757d',
  danger: [220, 53, 69],
} satisfies ColorConfig;

palette.primary; // [number, number, number] (not string | [...])
palette.secondary; // string (not [number, number, number] | string)
```

### satisfies vs as vs Type Annotation

| Feature | `satisfies` | `as` | `: Type` |
|---------|-------------|------|----------|
| Validates shape | Yes | No | Yes |
| Preserves literals | Yes | No | No |
| Runtime check | No | No | No |
| Can lie about types | No | Yes | No |
| Use case | Config objects | Last resort | Parameters/returns |

---

## Explicit Resource Management

The `using` keyword (TS 5.2+) for deterministic resource cleanup:

```typescript
// Disposable interface (Symbol.dispose)
class DatabaseConnection implements Disposable {
  constructor(private readonly uri: string) {
    console.log(`Connected to ${uri}`);
  }

  query(sql: string): unknown[] {
    return [];
  }

  [Symbol.dispose](): void {
    console.log(`Disconnected from ${this.uri}`);
  }
}

// using keyword -- automatically calls Symbol.dispose at block end
function runQuery(): void {
  using connection = new DatabaseConnection('mongodb://localhost');
  const results = connection.query('SELECT * FROM users');
  // connection[Symbol.dispose]() called automatically here
}

// AsyncDisposable for async cleanup
class FileHandle implements AsyncDisposable {
  async [Symbol.asyncDispose](): Promise<void> {
    await this.close();
  }

  private async close(): Promise<void> {
    // Async cleanup
  }
}

async function processFile(): Promise<void> {
  await using handle = new FileHandle();
  // handle[Symbol.asyncDispose]() called automatically
}
```

---

## Import Defer (TS 5.9)

Defer module execution until first property access:

```typescript
// Standard import -- module executes immediately on import
import * as heavyLib from './heavy-library';

// Deferred import -- module executes only when accessed
import defer * as heavyLib from './heavy-library';

function onUserAction(): void {
  // Module executes HERE on first property access
  heavyLib.doExpensiveWork();
}
```

| Feature | Standard Import | Deferred Import |
|---------|----------------|-----------------|
| Module execution | At import time | On first access |
| Startup cost | Higher | Lower |
| Syntax | `import * as x from` | `import defer * as x from` |
| Use case | Always needed | Conditionally needed |

---

## Forbidden Patterns

| Pattern | Why Forbidden | Fix |
|---------|---------------|-----|
| `any` type | No type safety | Use `unknown` + type guard |
| Untyped `unknown` | Defeats purpose | Always narrow before use |
| `Record<string, unknown>` catch-all | Unknown shape | Define explicit interface |
| `as` assertion without guard | Can lie | Use type guard instead |
| `@ts-ignore` | Hides issues | Fix the type error |
| `{ [key: string]: any }` | No safety | Define actual shape |

```typescript
// BAD: All forbidden patterns
function process(data: any): any { return data; }
const meta: Record<string, unknown> = {};
const user = data as User; // No validation

// GOOD: Proper type safety
function process(data: unknown): UserData {
  if (!isUserData(data)) throw new Error('Invalid');
  return data;
}

interface UserMeta {
  lastLogin: Date;
  preferences: UserPreferences;
}
const meta: UserMeta = { lastLogin: new Date(), preferences: defaults };
```

---

## Required Patterns

- Explicit return types on ALL exported functions
- Explicit parameter types (no implicit `any`)
- `readonly` arrays for function parameters that should not be mutated
- Discriminated unions for state variants
- Type guards for runtime type narrowing
- Generic constraints (`<T extends Base>`) when using generics
- `as const` for literal types and fixed arrays
- `satisfies` for config objects that need both validation and type preservation

```typescript
// as const for literal arrays
const ROLES = ['admin', 'user', 'guest'] as const;
type Role = (typeof ROLES)[number]; // 'admin' | 'user' | 'guest'

// Generic with constraint
function getProperty<T, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
```

---

## Data Transformation Rules

Always use typed interfaces for input/output mapping:

```typescript
// BAD: Unknown for known shapes
function toOutput(doc: Document): { data: unknown } {
  return { data: doc.toObject() };
}

// GOOD: Typed transformation
interface UserDocument {
  _id: string;
  name: string;
  email: string;
  createdAt: Date;
}

interface UserOutput {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

function toUserOutput(doc: UserDocument): UserOutput {
  return {
    id: doc._id,
    name: doc.name,
    email: doc.email,
    createdAt: doc.createdAt.toISOString(),
  };
}
```

---

**Source:** https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html | https://www.typescriptlang.org/docs/handbook/2/narrowing.html
**TypeScript:** 5.9
**Last Updated:** February 2026
