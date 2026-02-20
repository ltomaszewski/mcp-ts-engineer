---
name: zod
description: Zod schema validation - types, parsing, transforms, error handling. Use when validating data, defining schemas, or type-safe API responses.
---

# Zod

> TypeScript-first schema validation with static type inference. Define once, validate and type everywhere.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Defining data schemas for validation
- Validating API responses or form inputs
- Inferring TypeScript types from schemas
- Transforming data during parsing
- Creating shared type definitions

---

## Critical Rules

**ALWAYS:**
1. Use `safeParse()` over `parse()` — returns result object instead of throwing
2. Use `z.infer<typeof Schema>` — extracts TypeScript type from schema
3. Add custom error messages — improves UX: `z.string().email('Invalid email')`
4. Compose schemas from smaller parts — reuse and maintainability

**NEVER:**
1. Use `parse()` without try/catch — throws on invalid data
2. Duplicate type definitions — use `z.infer` instead of manual interface
3. Skip optional handling — use `.optional()` or `.nullable()` explicitly

---

## Core Patterns

### Basic Schema with Type Inference

```typescript
import { z } from 'zod';

const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email('Invalid email format'),
  name: z.string().min(2, 'Name too short'),
  age: z.number().int().positive().optional(),
  role: z.enum(['admin', 'user', 'guest']),
});

// Infer TypeScript type - no manual interface needed
type User = z.infer<typeof UserSchema>;
```

### Safe Parsing with Error Handling

```typescript
const result = UserSchema.safeParse(data);

if (!result.success) {
  // Access structured errors
  console.error(result.error.issues);
  // [{ path: ['email'], message: 'Invalid email format' }]
  return;
}

// result.data is typed as User
const user: User = result.data;
```

### Transform API Responses

```typescript
const ApiUserSchema = z.object({
  user_name: z.string(),
  created_at: z.string(),
}).transform((data) => ({
  userName: data.user_name,
  createdAt: new Date(data.created_at),
}));

type TransformedUser = z.infer<typeof ApiUserSchema>;
// { userName: string; createdAt: Date }
```

### Schema Composition

```typescript
// Base schema
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string().regex(/^\d{5}$/),
});

// Extend and combine
const UserWithAddressSchema = UserSchema.extend({
  address: AddressSchema.optional(),
});

// Partial for updates
const UpdateUserSchema = UserSchema.partial().omit({ id: true });
```

---

## Anti-Patterns

**BAD** — Using parse without error handling:
```typescript
const user = UserSchema.parse(data); // Throws if invalid!
```

**GOOD** — Using safeParse for graceful handling:
```typescript
const result = UserSchema.safeParse(data);
if (!result.success) {
  handleErrors(result.error.issues);
  return;
}
const user = result.data;
```

**BAD** — Duplicating types:
```typescript
interface User { id: string; email: string; }
const UserSchema = z.object({ id: z.string(), email: z.string() });
```

**GOOD** — Single source of truth:
```typescript
const UserSchema = z.object({ id: z.string(), email: z.string() });
type User = z.infer<typeof UserSchema>;
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Infer type | `z.infer<typeof S>` | `type User = z.infer<typeof UserSchema>` |
| Safe parse | `schema.safeParse()` | `{ success, data, error }` |
| Optional | `.optional()` | `z.string().optional()` |
| Nullable | `.nullable()` | `z.string().nullable()` |
| Default | `.default(val)` | `z.string().default('')` |
| Transform | `.transform(fn)` | `.transform((s) => s.toUpperCase())` |
| Refine | `.refine(fn, msg)` | `.refine((n) => n > 0, 'Must be positive')` |
| Extend | `schema.extend({})` | `BaseSchema.extend({ newField: z.string() })` |
| Partial | `schema.partial()` | All fields optional |
| Pick/Omit | `.pick()/.omit()` | `Schema.omit({ password: true })` |
| Array | `z.array(schema)` | `z.array(UserSchema)` |
| Union | `z.union([a, b])` | `z.union([z.string(), z.number()])` |
| Enum | `z.enum([...])` | `z.enum(['admin', 'user'])` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Core concepts and philosophy | [01-core-concepts.md](01-core-concepts.md) |
| String, number, boolean, date types | [02-basic-types.md](02-basic-types.md) |
| Object, array, record, tuple | [03-objects-collections.md](03-objects-collections.md) |
| Union, discriminated union, recursive | [04-advanced-features.md](04-advanced-features.md) |
| Parse, safeParse, async validation | [05-api-parsing.md](05-api-parsing.md) |
| React Hook Form, API integration | [06-integration-patterns.md](06-integration-patterns.md) |
| Reusability, composition, errors | [07-best-practices.md](07-best-practices.md) |

---

**Version:** 3.x | **Source:** https://zod.dev/
