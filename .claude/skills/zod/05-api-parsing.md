# Zod: API Parsing & Error Handling

**Parsing Methods, ZodError Structure, and Error Patterns**

---

## Parsing Methods

**Source**: https://zod.dev/api#parse

### .parse() - Eager Parsing (Throws)

```typescript
import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
});

// Success - returns typed data
const user = userSchema.parse({
  id: 1,
  name: "John",
  email: "john@example.com",
});

// Failure - throws ZodError
try {
  userSchema.parse({ id: "not-a-number", name: 123, email: "bad" });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation failed:", error.issues);
  }
}
```

### .safeParse() - Safe Parsing (No Throw) -- PREFERRED

```typescript
const result = userSchema.safeParse({
  id: 1,
  name: "John",
  email: "john@example.com",
});

if (result.success) {
  console.log("Valid:", result.data.id);
} else {
  console.log("Errors:", result.error.issues);

  // v4 error utilities
  const tree = z.treeifyError(result.error);
  const pretty = z.prettifyError(result.error);
}
```

### .parseAsync() - Async Eager Parsing

Required when schema contains async refinements or transforms:

```typescript
const usernameSchema = z.string()
  .min(3)
  .refine(
    async (username) => {
      const existing = await db.users.findOne({ username });
      return !existing;
    },
    { error: "Username already taken" },
  );

try {
  const validUsername = await usernameSchema.parseAsync("john_doe");
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Username error:", error.issues[0].message);
  }
}
```

### .safeParseAsync() - Async Safe Parsing

```typescript
async function registerUser(data: unknown) {
  const result = await userSchema.safeParseAsync(data);

  if (!result.success) {
    const tree = z.treeifyError(result.error);
    return { success: false, errors: tree };
  }

  const user = await db.users.create(result.data);
  return { success: true, user };
}
```

---

## ZodError Structure

```typescript
const schema = z.object({
  name: z.string(),
  age: z.number().positive(),
  email: z.email(),
});

const result = schema.safeParse({
  name: 123,
  age: -5,
  email: "not-an-email",
});

if (!result.success) {
  console.log(result.error.issues);
  // Array of issue objects, each with:
  // - code: string (issue type identifier)
  // - message: string (human-readable)
  // - path: (string | number)[] (field path)
  // - plus type-specific fields
}
```

### v4 Issue Type Changes

| v3 Type | v4 Type |
|---------|---------|
| `ZodInvalidTypeIssue` | `$ZodIssueInvalidType` |
| `ZodTooSmallIssue` | `$ZodIssueTooSmall` |
| `ZodTooBigIssue` | `$ZodIssueTooBig` |
| `ZodInvalidStringIssue` | `$ZodIssueInvalidString` |

---

## v4 Error Utilities

**`.format()` and `.flatten()` are REMOVED in v4.** Use these replacements:

### z.treeifyError()

Returns a structured tree matching your schema shape:

```typescript
const result = schema.safeParse(badData);
if (!result.success) {
  const tree = z.treeifyError(result.error);
  // {
  //   _errors: [],
  //   name: { _errors: ["Expected string, received number"] },
  //   age: { _errors: ["Number must be greater than 0"] },
  //   email: { _errors: ["Invalid email"] },
  // }

  // Access field errors
  if (tree.name?._errors.length) {
    console.log("Name errors:", tree.name._errors);
  }
}
```

### z.prettifyError()

Returns a human-readable multi-line string:

```typescript
const result = schema.safeParse(badData);
if (!result.success) {
  console.error(z.prettifyError(result.error));
  // ZodError:
  //   - name: Expected string, received number
  //   - age: Number must be greater than 0
  //   - email: Invalid email
}
```

### Custom Error Messages (v4 error param)

```typescript
// Unified error param (replaces message, invalid_type_error, required_error)
z.string({ error: "Must be a string" });

// Dynamic error messages via function
z.string({ error: (issue) => `Expected string, got ${typeof issue.input}` });

// Per-method error messages
z.string()
  .min(3, { error: "Too short" })
  .max(100, { error: "Too long" });
```

### Custom Error Maps (v4 z.locales)

```typescript
// Override default error messages globally
z.locales.en.invalid_type = (issue) =>
  `Expected ${issue.expected} but got ${typeof issue.input}`;
```

---

## Error Handling Patterns

### Express Middleware

```typescript
import express from "express";
import { z } from "zod";

const validateBody = (schema: z.ZodType) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          issues: z.treeifyError(error),
        });
      } else {
        next(error);
      }
    }
  };
};

const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

app.post("/users", validateBody(createUserSchema), async (req, res) => {
  const user = await db.users.create(req.body);
  res.json(user);
});
```

### Type Guards

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
});

type User = z.infer<typeof userSchema>;

function isUser(data: unknown): data is User {
  return userSchema.safeParse(data).success;
}

const data: unknown = await fetch("/api/user").then((r) => r.json());

if (isUser(data)) {
  console.log(data.email); // data is typed as User
}
```

### Extract Field Errors Helper

```typescript
const extractFieldErrors = (error: z.ZodError): Record<string, string[]> => {
  const tree = z.treeifyError(error);
  const fields: Record<string, string[]> = {};
  for (const [key, value] of Object.entries(tree)) {
    if (key !== "_errors" && value?._errors?.length) {
      fields[key] = value._errors;
    }
  }
  return fields;
};
```

---

## v4 Error Migration Cheat Sheet

| v3 Pattern | v4 Replacement |
|------------|----------------|
| `{ message: "..." }` | `{ error: "..." }` |
| `{ invalid_type_error: "..." }` | `{ error: (issue) => "..." }` |
| `{ required_error: "..." }` | `{ error: "..." }` |
| `error.format()` | `z.treeifyError(error)` |
| `error.flatten()` | `z.treeifyError(error)` |
| `error.formErrors` | `z.treeifyError(error)._errors` |
| `ctx.addIssue({...})` | `ctx.issues.push({...})` |
| Custom `errorMap` param | `error` param (returns string) |

---

**See Also**:
- [Core Concepts](01-core-concepts.md)
- [Advanced Features](04-advanced-features.md)
- [Integration Patterns](06-integration-patterns.md)
- [Best Practices](07-best-practices.md)

**Version**: 4.x (^4.3.0) | **Source**: https://zod.dev/api
