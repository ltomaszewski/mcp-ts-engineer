# Zod: Core Concepts

**Foundations, Principles, and Mental Models**

---

## What is Zod?

Zod is a **TypeScript-first schema validation library** that bridges compile-time type safety with runtime data validation.

**Requirements**: TypeScript 5.5+ | `"strict": true` in tsconfig | `import { z } from "zod"`

### The Problem Zod Solves

```typescript
// WITHOUT ZOD - TypeScript limitation
interface User {
  name: string;
  age: number;
  email: string;
}

const apiData: User = fetchUserFromAPI();
// Type-safe at compile-time, but crashes at runtime!
// No guarantee API returns correct types
```

```typescript
// WITH ZOD - Runtime + Type safety
import { z } from "zod";

const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.email(),
});

type User = z.infer<typeof UserSchema>;

const apiData = UserSchema.parse(await fetchUserFromAPI());
// If data doesn't match, throws ZodError with details
// If successful, TypeScript guarantees type User
```

### Key Benefits

| Benefit | Impact |
|---------|--------|
| **Runtime Type Assurance** | Catch data mismatches before crashes |
| **Zero Dependencies** | Lightweight core, tree-shakable |
| **Automatic Type Inference** | Define validation once, auto-generate TS types |
| **Security** | Prevent injection attacks via strict validation |
| **Developer Experience** | Clear error messages explaining exactly what's wrong |
| **Framework Integration** | Works with React, Express, tRPC, Next.js, etc. |
| **Performance (v4)** | 14.7x faster string parsing, 6.5x faster object parsing vs v3 |

## Installation & Setup

```bash
npm install zod    # v4 is the default
```

Enable TypeScript strict mode in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2020",
    "module": "ES2020"
  }
}
```

### Import Options

```typescript
// Standard import (full library)
import { z } from "zod";

// Zod Mini -- tree-shakable ~2kb variant (no built-in error messages)
import { z } from "zod/mini";

// Zod Core -- minimal shared utilities
import * as z from "zod/v4/core";
```

---

## Core Patterns

### 1. Schemas Are Immutable

```typescript
const baseSchema = z.string();
const emailSchema = z.email();               // Top-level validator (v4)
const trimmedSchema = z.string().trim();     // NEW instance

// baseSchema unchanged - still just z.string()
baseSchema.parse("  test@example.com  ");    // "  test@example.com  " (untrimmed)
trimmedSchema.parse("  test@example.com  "); // "test@example.com" (trimmed)
```

### 2. Type Inference

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
  age: z.number().optional(),
});

// Output type (after transforms/defaults)
type User = z.infer<typeof UserSchema>;

// Input type (before transforms/defaults)
type UserInput = z.input<typeof UserSchema>;

// Output type (explicit)
type UserOutput = z.output<typeof UserSchema>;
```

### 3. Parse vs SafeParse

```typescript
// parse() - Throws on error
try {
  const result = schema.parse("not a number");
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error(error.issues);
  }
}

// safeParse() - Returns result object (PREFERRED)
const result = schema.safeParse("not a number");
if (!result.success) {
  const tree = z.treeifyError(result.error);
  console.error(z.prettifyError(result.error));
} else {
  console.log("Valid:", result.data);
}
```

---

## Validation Workflow Example

```typescript
// Define schema with v4 error param
const RegistrationSchema = z.object({
  username: z.string().min(3, { error: "At least 3 characters" }).max(20),
  password: z.string().min(8, { error: "At least 8 characters" }),
  email: z.email({ error: "Invalid email address" }),
  acceptTerms: z.boolean().refine((v) => v === true, {
    error: "Must accept terms",
  }),
});

type RegistrationData = z.infer<typeof RegistrationSchema>;

async function handleRegistration(formData: unknown) {
  const result = RegistrationSchema.safeParse(formData);

  if (!result.success) {
    const tree = z.treeifyError(result.error);
    return { success: false, errors: tree };
  }

  const user = await db.users.create(result.data);
  return { success: true, userId: user.id };
}
```

---

## v4 Error Handling

```typescript
// .format() and .flatten() are REMOVED in v4
// Use these instead:

const result = schema.safeParse(data);
if (!result.success) {
  // Structured error tree
  const tree = z.treeifyError(result.error);
  // tree.email._errors => ["Invalid email"]

  // Human-readable output
  const pretty = z.prettifyError(result.error);
  // Formatted multi-line string
}
```

---

## All Schema Types

| Category | Types |
|----------|-------|
| **Primitives** | `z.string()`, `z.number()`, `z.bigint()`, `z.boolean()`, `z.symbol()`, `z.undefined()`, `z.null()` |
| **Special** | `z.any()`, `z.unknown()`, `z.never()`, `z.nan()`, `z.void()` |
| **Literals** | `z.literal()`, `z.enum()` |
| **Collections** | `z.array()`, `z.tuple()`, `z.object()`, `z.record()`, `z.map()`, `z.set()` |
| **Unions** | `z.union()`, `z.discriminatedUnion()`, `z.intersection()`, `z.xor()` |
| **Advanced** | `z.function()`, `z.instanceof()`, `z.lazy()`, `z.custom()` |
| **Special v4** | `z.file()`, `z.json()`, `z.stringbool()`, `z.templateLiteral()` |
| **Top-level** | `z.email()`, `z.uuid()`, `z.url()`, `z.ipv4()`, `z.ipv6()`, `z.jwt()`, `z.base64()`, `z.nanoid()`, `z.cuid2()`, `z.ulid()`, `z.semver()`, `z.e164()`, `z.cidrv4()`, `z.cidrv6()` |
| **Integers** | `z.int()`, `z.int32()` |
| **Coercion** | `z.coerce.string()`, `z.coerce.number()`, `z.coerce.boolean()`, `z.coerce.date()`, `z.coerce.bigint()` |

---

**See Also**:
- [Basic Types & Primitives](02-basic-types.md)
- [Objects & Collections](03-objects-collections.md)
- [API Parsing & Error Handling](05-api-parsing.md)

**Version**: 4.x (^4.3.0) | **Source**: https://zod.dev/
