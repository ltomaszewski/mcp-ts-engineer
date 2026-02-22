---
name: zod
description: Zod v4 schema validation - types, parsing, transforms, error handling, JSON Schema. Use when validating data, defining schemas, type-safe API responses, or form validation.
---

# Zod v4

TypeScript-first schema validation with static type inference. Define once, validate and type everywhere.

---

## When to Use

LOAD THIS SKILL when user is:
- Defining data schemas for validation
- Validating API responses or form inputs
- Inferring TypeScript types from schemas
- Transforming data during parsing
- Creating shared type definitions across frontend/backend

---

## Critical Rules

**ALWAYS:**
1. Use `safeParse()` over `parse()` -- returns result object instead of throwing
2. Use `z.infer<typeof Schema>` -- extract TypeScript type from schema
3. Use `error` param for custom messages -- `z.string({ error: "Must be string" })`
4. Use top-level string validators -- `z.email()`, `z.uuid()`, `z.url()` (tree-shakable)
5. Compose schemas from smaller parts -- reuse and maintainability
6. Use `z.treeifyError()` for structured errors -- replaces removed `.format()`/`.flatten()`

**NEVER:**
1. Use `parse()` without try/catch -- throws on invalid data
2. Duplicate type definitions -- use `z.infer` instead of manual interface
3. Use `{ message: "..." }` -- deprecated in v4, use `{ error: "..." }`
4. Use `.format()` or `.flatten()` on ZodError -- removed in v4
5. Use `z.nativeEnum()` -- deprecated, use `z.enum()` directly
6. Use `.merge()` -- deprecated, use `.extend()` with spread
7. Use `.strict()`/`.passthrough()`/`.strip()` -- deprecated, use `z.strictObject()` / `z.looseObject()`
8. Access `._def` -- moved to `._zod.def` in v4
9. Use `z.record(valueOnly)` -- v4 requires both key and value schemas

---

## v4 Migration Notes

Key breaking changes from v3:
- **Error param**: `{ message: "..." }` replaced by `{ error: "..." }` (or error function)
- **String validators**: `z.string().email()` deprecated; prefer `z.email()` (top-level)
- **`.format()`/`.flatten()`**: Removed -- use `z.treeifyError()` or `z.prettifyError()`
- **`.default()` behavior**: Now short-circuits; applies to output type. Use `.prefault()` for input-type defaults
- **`z.nativeEnum()`**: Deprecated -- `z.enum()` handles TS enums directly
- **`z.function()`**: Completely redesigned -- `z.function({ input: [...], output: ... })`
- **`z.record()`**: Requires both key and value schemas; enum keys are exhaustive. Use `z.partialRecord()` for optional keys
- **Number**: `Infinity`/`-Infinity` rejected; `.int()` rejects unsafe integers; `.safe()` removed
- **Objects**: `.merge()` deprecated (use `.extend()`); `.strict()`/`.passthrough()`/`.strip()` deprecated (use `z.strictObject()`/`z.looseObject()`); `.deepPartial()` removed
- **Refinements**: `ctx.addIssue()` removed (mutate `ctx.issues` array); `ctx.path` removed; type predicates no longer narrow in `.refine()`
- **Removed**: `z.promise()`, `.safe()`, `.ostring()`/`.onumber()`/`.oboolean()`, `.Enum`/`.Values` (use `.enum`), `z.literal()` symbol support
- **Import**: `import { z } from "zod"` (v4 default); `import { z } from "zod/mini"` for tree-shakable 2kb variant

---

## Core Patterns

### Basic Schema with Type Inference

```typescript
import { z } from "zod";

const UserSchema = z.object({
  id: z.uuid(),
  email: z.email({ error: "Invalid email format" }),
  name: z.string().min(2, { error: "Name too short" }),
  age: z.number().int().positive().optional(),
  role: z.enum(["admin", "user", "guest"]),
});

type User = z.infer<typeof UserSchema>;
```

### Safe Parsing with Error Handling

```typescript
const result = UserSchema.safeParse(data);

if (!result.success) {
  const tree = z.treeifyError(result.error);
  console.error(z.prettifyError(result.error));
  return;
}

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
```

### Schema Composition

```typescript
const AddressSchema = z.object({
  street: z.string(),
  city: z.string(),
  zip: z.string().regex(/^\d{5}$/),
});

const UserWithAddressSchema = UserSchema.extend({
  address: AddressSchema.optional(),
});

const UpdateUserSchema = UserSchema.partial().omit({ id: true });
```

### New v4 Features

```typescript
// File validation
const FileSchema = z.file().min(1024).max(5_000_000).type("image/png");

// Template literal validation
const UserIdSchema = z.templateLiteral(["user_", z.number()]);

// String boolean coercion
const EnvBool = z.stringbool(); // "true"/"yes"/"1" -> true

// Multiple literals
const StatusCode = z.literal([200, 201, 204]);

// Recursive schemas (getter syntax for proper inference)
const Category = z.object({
  name: z.string(),
  get subcategories() { return z.array(Category); },
});

// JSON Schema conversion (Zod -> JSON Schema)
const jsonSchema = z.toJSONSchema(UserSchema);

// JSON Schema -> Zod conversion (v4.3.4+)
const zodSchema = z.fromJSONSchema(jsonSchemaObject);

// Schema metadata
UserSchema.meta({ title: "User", description: "A user object" });
```

---

## Anti-Patterns

**BAD** -- Using parse without error handling:
```typescript
const user = UserSchema.parse(data); // Throws if invalid!
```

**GOOD** -- Using safeParse for graceful handling:
```typescript
const result = UserSchema.safeParse(data);
if (!result.success) {
  console.error(z.prettifyError(result.error));
  return;
}
const user = result.data;
```

**BAD** -- Using deprecated error format:
```typescript
z.string({ invalid_type_error: "Not a string", required_error: "Required" });
```

**GOOD** -- Using v4 unified error param:
```typescript
z.string({ error: "Must be a string" });
z.string({ error: (issue) => `Expected string, got ${typeof issue.input}` });
```

**BAD** -- Duplicating types:
```typescript
interface User { id: string; email: string; }
const UserSchema = z.object({ id: z.string(), email: z.string() });
```

**GOOD** -- Single source of truth:
```typescript
const UserSchema = z.object({ id: z.string(), email: z.string() });
type User = z.infer<typeof UserSchema>;
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Infer type | `z.infer<typeof S>` | `type User = z.infer<typeof UserSchema>` |
| Input type | `z.input<typeof S>` | `type UserInput = z.input<typeof UserSchema>` |
| Output type | `z.output<typeof S>` | `type UserOutput = z.output<typeof UserSchema>` |
| Safe parse | `schema.safeParse()` | `{ success, data, error }` |
| Email | `z.email()` | `z.email({ error: "Invalid" })` |
| UUID | `z.uuid()` | `z.uuid()` |
| URL | `z.url()` | `z.url()` |
| Optional | `.optional()` | `z.string().optional()` |
| Nullable | `.nullable()` | `z.string().nullable()` |
| Nullish | `.nullish()` | `z.string().nullish()` |
| Default | `.default(val)` | `z.string().default("")` (output type) |
| Prefault | `.prefault(val)` | `z.string().prefault("")` (input type) |
| Transform | `.transform(fn)` | `.transform((s) => s.toUpperCase())` |
| Pipe | `.pipe(schema)` | `z.string().pipe(z.coerce.number())` |
| Refine | `.refine(fn, msg)` | `.refine((n) => n > 0, { error: "Positive" })` |
| Extend | `schema.extend({})` | `BaseSchema.extend({ field: z.string() })` |
| Partial | `schema.partial()` | All fields optional |
| Pick/Omit | `.pick()/.omit()` | `Schema.omit({ password: true })` |
| Array | `z.array(schema)` | `z.array(UserSchema)` |
| Union | `z.union([a, b])` | `z.union([z.string(), z.number()])` |
| Enum | `z.enum([...])` | `z.enum(["admin", "user"])` |
| File | `z.file()` | `z.file().type("image/*").max(5_000_000)` |
| Brand | `.brand<"T">()` | `z.email().brand<"Email">()` |
| Readonly | `.readonly()` | `z.array(z.string()).readonly()` |
| Error tree | `z.treeifyError()` | `z.treeifyError(result.error)` |
| Pretty error | `z.prettifyError()` | `z.prettifyError(result.error)` |
| JSON Schema (export) | `z.toJSONSchema()` | `z.toJSONSchema(UserSchema)` |
| JSON Schema (import) | `z.fromJSONSchema()` | `z.fromJSONSchema(jsonSchemaObj)` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Core concepts and philosophy | [01-core-concepts.md](01-core-concepts.md) |
| String, number, boolean, date types | [02-basic-types.md](02-basic-types.md) |
| Object, array, record, tuple, union | [03-objects-collections.md](03-objects-collections.md) |
| Refine, transform, recursive, branding | [04-advanced-features.md](04-advanced-features.md) |
| Parse, safeParse, ZodError, async | [05-api-parsing.md](05-api-parsing.md) |
| React Hook Form, Express, tRPC, monorepo | [06-integration-patterns.md](06-integration-patterns.md) |
| Performance, security, migration checklist | [07-best-practices.md](07-best-practices.md) |

---

**Version:** 4.x (^4.3.6) | **Source:** https://zod.dev/
