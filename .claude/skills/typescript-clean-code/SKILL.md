---
name: typescript-clean-code
version: "5.9"
description: TypeScript clean code patterns - SOLID principles, file/function size limits, TSDoc, error handling, debugging, type safety. Use when writing TypeScript code, refactoring, or reviewing code quality.
globs: ["**/*.ts", "**/*.tsx"]
---

# TypeScript Clean Code (TS 5.9)

> Framework-agnostic guidelines for writing clean, maintainable, and debuggable TypeScript targeting ES2022+ and TypeScript 5.9.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Writing new TypeScript code (any framework)
- Refactoring for maintainability
- Reviewing code quality
- Designing functions, classes, or modules
- Setting up TypeScript strict mode configuration
- Debugging type errors or runtime issues

---

## Critical Rules

**ALWAYS:**
1. Keep files under 300 lines -- split by responsibility when larger
2. Keep functions under 50 lines, prefer 20-30 -- extract helpers for complex logic
3. Use explicit return types on all exported functions -- prevents accidental API changes
4. Document public APIs with TSDoc -- enables IDE hints and documentation generation
5. Preserve stack traces with `{ cause }` -- chain errors for full debugging context

**NEVER:**
1. Use `any` type -- use `unknown` with type guards or proper interfaces
2. Leave `unknown` unnarrowed -- always validate and narrow before use
3. Nest more than 3 levels deep -- extract to functions or use early returns
4. Use magic numbers -- extract to named constants
5. Ignore errors silently -- always handle or rethrow with context

---

## Core Patterns

### Size Limits

```typescript
// Enforced limits
const MAX_FILE_LINES = 300;
const MAX_FUNCTION_LINES = 50;
const MAX_PARAMETERS = 4;
const MAX_NESTING = 3;
const MAX_COMPLEXITY = 10;
```

### Explicit Return Types

```typescript
// BAD - inferred return type
function process(data: Item[]) {
  return data.map((x) => x.value);
}

// GOOD - explicit return type
function processItems(items: Item[]): number[] {
  return items.map((item) => item.value);
}
```

### Error Handling with Cause Chain

```typescript
async function fetchUser(id: string): Promise<User> {
  try {
    return await db.users.findById(id);
  } catch (error) {
    throw new DatabaseError(
      `Failed to fetch user ${id}`,
      { cause: error },
    );
  }
}
```

### Early Returns

```typescript
function processOrder(order: Order | null): Result {
  if (!order) return { error: 'No order' };
  if (order.items.length === 0) return { error: 'No items' };
  if (order.status !== 'pending') return { error: 'Not pending' };

  return processValidOrder(order);
}
```

### Type Guards for Unknown

```typescript
function isApiResponse(value: unknown): value is ApiResponse {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof (value as ApiResponse).message === 'string'
  );
}
```

### Options Object Pattern

```typescript
interface CreateUserOptions {
  name: string;
  email: string;
  role?: 'admin' | 'user';
  isActive?: boolean;
}

function createUser(options: CreateUserOptions): User {
  const { name, email, role = 'user', isActive = true } = options;
  // ...
}
```

---

## Anti-Patterns

**BAD** -- Using `any`:
```typescript
function parse(input: any) {
  return input.data.value;
}
```

**GOOD** -- Define interface or use unknown with guard:
```typescript
function parse(input: unknown): string {
  if (!isValidInput(input)) {
    throw new Error('Invalid input');
  }
  return input.data.value;
}
```

**BAD** -- Swallowing errors:
```typescript
try { await riskyOperation(); } catch (e) { }
```

**GOOD** -- Handle or rethrow with context:
```typescript
try {
  await riskyOperation();
} catch (error) {
  throw new OperationError('Failed', { cause: error });
}
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
| Many params | Use options object interface |
| Deep nesting | Early returns |
| Deferred import | `import defer * as mod from './mod'` |

---

## Deep Dive References

| File | Topic |
|------|-------|
| [01-file-organization.md](./01-file-organization.md) | Directory structure, file naming, barrel files, when to split |
| [02-function-design.md](./02-function-design.md) | SRP, pure functions, early returns, parameters, abstraction levels |
| [03-solid-principles.md](./03-solid-principles.md) | SRP, OCP, LSP, ISP, DIP with TypeScript examples |
| [04-naming-conventions.md](./04-naming-conventions.md) | Variables, functions, classes, interfaces, files, generics |
| [05-tsdoc-documentation.md](./05-tsdoc-documentation.md) | TSDoc tags, class/function/interface docs, when to document |
| [06-error-handling.md](./06-error-handling.md) | Custom errors, cause chains, Result type, error narrowing |
| [07-debugging.md](./07-debugging.md) | Source maps, breakpoints, stack traces, async debugging |
| [08-logging.md](./08-logging.md) | Structured logging, log levels, correlation IDs, what to log |
| [09-type-safety.md](./09-type-safety.md) | Strict config, type guards, satisfies, discriminated unions, TS 5.9 |
| [10-code-review-checklist.md](./10-code-review-checklist.md) | Pre-commit checklist, review criteria, templates |

---

**Source:** https://www.typescriptlang.org/docs/handbook/ | https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html
**TypeScript:** 5.9 | **Target:** ES2022+
**Last Updated:** February 2026
