# Zod: Best Practices

**Performance, Security, Error Handling, and Production Patterns**

---

## Performance Optimization

### v4 Performance Gains

Zod v4 delivers significant improvements over v3:
- **14.7x faster** string parsing
- **6.5x faster** object parsing
- **100x fewer** TypeScript type instantiations

### 1. Schema Reusability

```typescript
// Good: Define once, reuse
const emailSchema = z.email({ error: "Invalid email" });

const userSchema = z.object({
  email: emailSchema,
  backupEmail: emailSchema.optional(),
});

// Bad: Defined inline repeatedly
const userSchema = z.object({
  email: z.email(),
  backupEmail: z.email().optional(),
});
```

### 2. Validation Order (Cheap -> Expensive)

```typescript
// Good: Format check BEFORE database check
const userSchema = z.object({
  email: z.email({ error: "Invalid email format" })
    .refine(
      async (email) => {
        const exists = await db.users.count({ email });
        return exists === 0;
      },
      { error: "Email already registered" },
    ),
});
```

### 3. Use superRefine for Related Checks

```typescript
// Better: Single superRefine for related checks
const passwordSchema = z.string().superRefine((val, ctx) => {
  if (val.length < 8) {
    ctx.issues.push({ code: "custom", message: "At least 8 characters" });
  }
  if (!/[A-Z]/.test(val)) {
    ctx.issues.push({ code: "custom", message: "One uppercase letter" });
  }
  if (!/[0-9]/.test(val)) {
    ctx.issues.push({ code: "custom", message: "One number" });
  }
});

// Less efficient: Multiple refine calls
const passwordSchema = z.string()
  .refine((val) => val.length >= 8, { error: "At least 8 chars" })
  .refine((val) => /[A-Z]/.test(val), { error: "One uppercase" })
  .refine((val) => /[0-9]/.test(val), { error: "One number" });
```

### 4. Use Zod Mini for Bundle Size

```typescript
// For bundle-sensitive apps (~2kb vs full library)
import { z } from "zod/mini";

const schema = z.string().check(
  z.minLength(1, { error: "Required" }),
);
```

---

## Security Best Practices

### 1. Strict Input Validation

```typescript
const commentSchema = z.object({
  text: z.string()
    .min(1, { error: "Comment cannot be empty" })
    .max(5000, { error: "Comment too long" })
    .trim()
    .refine(
      (text) => !/<script|javascript:/i.test(text),
      { error: "Script tags not allowed" },
    ),
  userId: z.number().int().positive(),
});
```

### 2. Prevent Type Coercion Attacks

```typescript
// Safe: Explicit type checking
const userIdSchema = z.number()
  .int({ error: "Must be an integer" })
  .positive({ error: "Must be positive" });

// Vulnerable: Using coerce carelessly
const userIdSchema = z.coerce.number(); // "123abc" could produce unexpected results
```

### 3. Whitelist Allowed Values

```typescript
// Safe: Enum whitelist
const sortSchema = z.object({
  sort: z.enum(["name", "date", "relevance"]),
  limit: z.number().int().min(1).max(100),
});

// Vulnerable: Accept arbitrary strings
const sortSchema = z.object({
  sort: z.string(), // Could be SQL injection
  limit: z.string(), // No bounds
});
```

---

## Error Handling

### 1. v4 Error Utilities

```typescript
const result = schema.safeParse(data);
if (!result.success) {
  // Structured tree (replaces removed .format())
  const tree = z.treeifyError(result.error);

  // Human-readable (replaces removed .flatten())
  const pretty = z.prettifyError(result.error);

  // Access issues directly
  const issues = result.error.issues;
}
```

### 2. User-Friendly Error Messages

```typescript
const getUserFriendlyMessage = (issue: z.ZodIssue): string => {
  switch (issue.code) {
    case "invalid_type":
      return `Expected ${issue.expected}, got ${issue.received}`;
    case "too_small":
      return issue.type === "string"
        ? `Must be at least ${issue.minimum} characters`
        : `Must be at least ${issue.minimum}`;
    case "too_big":
      return issue.type === "string"
        ? `Cannot exceed ${issue.maximum} characters`
        : `Cannot exceed ${issue.maximum}`;
    default:
      return issue.message;
  }
};
```

### 3. Logging Validation Failures

```typescript
const logValidationError = (
  error: z.ZodError,
  context: { endpoint: string; userId?: number },
) => {
  logger.warn("Validation error", {
    endpoint: context.endpoint,
    userId: context.userId,
    errors: z.treeifyError(error),
    timestamp: new Date(),
  });
};
```

---

## v4 Migration Checklist

| v3 Pattern | v4 Replacement |
|------------|----------------|
| `{ message: "..." }` | `{ error: "..." }` |
| `{ invalid_type_error }` | `{ error: (issue) => "..." }` |
| `.format()` | `z.treeifyError(error)` |
| `.flatten()` | `z.treeifyError(error)` |
| `.formErrors` | `z.treeifyError(error)._errors` |
| `.merge()` | `.extend({ ...other.shape })` |
| `.deepPartial()` | Removed -- use manual partial nesting |
| `.strict()` | `z.strictObject({...})` |
| `.passthrough()` | `z.looseObject({...})` |
| `.strip()` | Removed (was default behavior) |
| `z.nativeEnum(MyEnum)` | `z.enum(MyEnum)` |
| `.Enum` / `.Values` | `.enum` property |
| `z.promise(schema)` | Deprecated (await before parsing) |
| `.safe()` | Removed (use `.int()`) |
| `.ostring()/.onumber()/.oboolean()` | `z.string().optional()` etc. |
| `ctx.addIssue()` in superRefine | `ctx.issues.push({...})` |
| `ctx.path` in refinements | Removed |
| `z.string().email()` | `z.email()` (preferred top-level) |
| `z.string().uuid()` | `z.uuid()` (preferred top-level) |
| `z.string().ip()` | `z.ipv4()` / `z.ipv6()` |
| `z.record(valueOnly)` | `z.record(keySchema, valueSchema)` |
| `._def` | `._zod.def` |
| `.default(val)` on input type | `.prefault(val)` for input-type defaults |

---

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Async validation with parse()** | Crashes on async refinement | Use `parseAsync()` or `safeParseAsync()` |
| **Deeply nested schemas** | Poor performance | Refactor into smaller reusable schemas |
| **No error logging** | Can't debug production issues | Log validation errors with context |
| **Exposing validation details** | Security vulnerability | Sanitize error messages in production |
| **Circular dependencies** | Infinite loops | Use getter syntax or `z.lazy()` |
| **Multiple refine() calls** | Performance degradation | Use `superRefine()` for related checks |
| **Using .flatten()/.format()** | Runtime crash in v4 | Use `z.treeifyError()` / `z.prettifyError()` |
| **Using { message: "..." }** | Deprecated in v4 | Use `{ error: "..." }` |
| **z.record(valueOnly)** | Error in v4 | `z.record(keySchema, valueSchema)` |
| **Exhaustive enum records** | Missing keys errors | Use `z.partialRecord()` for optional keys |

---

## Production Checklist

- [ ] All schemas defined at module level (reusable)
- [ ] `safeParse()`/`safeParseAsync()` used (not throwing `parse()`)
- [ ] Validation order optimized (cheap checks first)
- [ ] Input length limits enforced (`.min()`, `.max()`)
- [ ] Error messages use v4 `error` param (not `message`)
- [ ] v4 error utilities used (`z.treeifyError()`, not `.flatten()`)
- [ ] Error messages sanitized for production (don't expose internals)
- [ ] Async validation uses `safeParseAsync()` (not `safeParse()`)
- [ ] Types inferred with `z.infer` (no manual interface duplication)
- [ ] Security-sensitive checks included (whitelist values, validate bounds)
- [ ] Test coverage for happy/sad paths

---

**See Also**:
- [Core Concepts](01-core-concepts.md)
- [Advanced Features](04-advanced-features.md)
- [API Parsing](05-api-parsing.md)
- [Integration Patterns](06-integration-patterns.md)

**Version**: 4.x (^4.3.0) | **Source**: https://zod.dev/
