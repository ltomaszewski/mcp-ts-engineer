# Zod: Best Practices

**Performance, Security, Error Handling, and Production Patterns**

---

## Performance Optimization

### 1. Schema Reusability

```typescript
// ✓ Good: Define once, reuse
const emailSchema = z.string()
  .email()
  .min(5, "Email too short")
  .max(254, "Email too long");

const userSchema = z.object({
  email: emailSchema,
  backupEmail: emailSchema.optional(),
});

// ❌ Bad: Defined inline repeatedly
const userSchema = z.object({
  email: z.string().email().min(5).max(254),
  backupEmail: z.string().email().min(5).max(254).optional(),
});
```

### 2. Validation Order (Cheap → Expensive)

```typescript
// ✓ Good: Format check BEFORE database check
const userSchema = z.object({
  email: z.string()
    .email("Invalid email format")     // Fast
    .toLowerCase()
    .refine(
      async (email) => {
        // Only validate format-correct emails
        const exists = await db.users.count({ email });
        return exists === 0;
      },
      "Email already registered"
    ),
});

// ❌ Bad: Database check BEFORE format check
const userSchema = z.object({
  email: z.string()
    .refine(
      async (email) => {
        // Database check on every input
        const exists = await db.users.count({ email });
        return exists === 0;
      },
      "Email already registered"
    )
    .email("Invalid email format"), // Too late!
});
```

### 3. Combine Multiple String Constraints

```typescript
// ✓ Better: Single superRefine for related checks
const passwordSchema = z.string().superRefine((val, ctx) => {
  if (val.length < 8) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "At least 8 characters",
    });
  }
  if (!/[A-Z]/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "One uppercase letter",
    });
  }
  if (!/[0-9]/.test(val)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "One number",
    });
  }
});

// ❌ Inefficient: Multiple refine calls
const passwordSchema = z.string()
  .refine(val => val.length >= 8, "At least 8 chars")
  .refine(val => /[A-Z]/.test(val), "One uppercase")
  .refine(val => /[0-9]/.test(val), "One number");
```

### 4. Lazy Evaluation for Circular References

```typescript
// Recursive category structure
type Category = {
  name: string;
  children?: Category[];
};

const categorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    name: z.string(),
    children: z.array(categorySchema).optional(),
  })
);

categorySchema.parse({
  name: "Electronics",
  children: [
    {
      name: "Phones",
      children: [
        { name: "iPhone" },
        { name: "Android" },
      ],
    },
  ],
});
```

---

## Security Best Practices

### 1. Strict Input Validation

```typescript
// ✓ Safe: Strict validation with constraints
const commentSchema = z.object({
  text: z.string()
    .min(1, "Comment cannot be empty")
    .max(5000, "Comment too long")
    .trim()
    .refine(
      (text) => !/<script|javascript:/i.test(text),
      "Script tags not allowed"
    ),
  userId: z.number()
    .int()
    .positive()
    .refine(
      async (userId) => {
        const user = await db.users.findById(userId);
        return !!user;
      },
      "User not found"
    ),
});

// ❌ Dangerous: No validation
const commentSchema = z.object({
  text: z.string(),     // Can contain XSS
  userId: z.number(),   // Not validated
});
```

### 2. Prevent Type Coercion Attacks

```typescript
// ✓ Safe: Explicit type checking
const userIdSchema = z.number()
  .int("Must be an integer")
  .positive("Must be positive");

const result = z.number().safeParse("123abc");
// { success: false } - Safe failure

// ❌ Vulnerable: Using coerce carelessly
const userIdSchema = z.coerce.number(); // "123abc" → 123
userIdSchema.parse("123abc"); // Unexpected behavior
```

### 3. Whitelist Allowed Values

```typescript
// ✓ Safe: Enum whitelist
const sortSchema = z.object({
  sort: z.enum(["name", "date", "relevance"]),
  limit: z.number().int().min(1).max(100),
});

// ❌ Vulnerable: Accept arbitrary strings
const sortSchema = z.object({
  sort: z.string(), // Could be SQL injection
  limit: z.string(), // No bounds
});
```

---

## Error Handling

### 1. User-Friendly Error Messages

```typescript
const getUserFriendlyMessage = (issue: z.ZodIssue): string => {
  switch (issue.code) {
    case z.ZodIssueCode.invalid_type:
      return `Expected ${issue.expected}, got ${issue.received}`;
    case z.ZodIssueCode.too_small:
      return issue.type === "string"
        ? `Must be at least ${issue.minimum} characters`
        : `Must be at least ${issue.minimum}`;
    case z.ZodIssueCode.too_big:
      return issue.type === "string"
        ? `Cannot exceed ${issue.maximum} characters`
        : `Cannot exceed ${issue.maximum}`;
    case z.ZodIssueCode.invalid_string:
      return `Invalid ${issue.validation}`;
    default:
      return issue.message;
  }
};

const formatErrors = (error: z.ZodError) => {
  return Object.entries(error.flatten().fieldErrors || {}).reduce(
    (acc, [field, errors]) => ({
      ...acc,
      [field]: errors?.map(getUserFriendlyMessage),
    }),
    {}
  );
};
```

### 2. Logging Validation Failures

```typescript
const logValidationError = (
  error: z.ZodError,
  context: { endpoint: string; userId?: number }
) => {
  logger.warn("Validation error", {
    endpoint: context.endpoint,
    userId: context.userId,
    errors: error.flatten().fieldErrors,
    timestamp: new Date(),
  });
};

app.post("/users", async (req, res) => {
  const result = await userSchema.safeParseAsync(req.body);

  if (!result.success) {
    logValidationError(result.error, {
      endpoint: "/users",
      userId: req.user?.id,
    });

    return res.status(400).json({
      error: "Validation failed",
      issues: result.error.flatten().fieldErrors,
    });
  }

  // Process valid data
});
```

---

## Common Pitfalls

| Pitfall | Problem | Solution |
|---------|---------|----------|
| **Async validation with parse()** | Crashes on async refinement | Use parseAsync() or safeParseAsync() |
| **Forgetting .strict()** | Extra properties accepted | Use .strict() or .passthrough() explicitly |
| **Deeply nested schemas** | Poor performance | Refactor into smaller reusable schemas |
| **No error logging** | Can't debug production issues | Log validation errors with context |
| **Exposing validation details** | Security vulnerability | Sanitize error messages in production |
| **Circular dependencies** | Infinite loops | Use z.lazy() for recursive types |
| **Multiple refine() calls** | Performance degradation | Use superRefine() for related checks |

---

## Production Checklist

```typescript
// ✓ All schemas defined at module level (reusable)
const emailSchema = z.string().email();

// ✓ Validation order optimized (cheap → expensive)
const userSchema = z.object({
  email: emailSchema.refine(async (e) => {
    // Database check last
  }),
});

// ✓ Input length limits enforced
const textSchema = z.string().min(1).max(5000);

// ✓ Async validation only on safeParse/parseAsync
const result = await schema.safeParseAsync(data);

// ✓ Error messages sanitized for production
const isDevelopment = process.env.NODE_ENV === "development";
if (!isDevelopment) {
  // Don't expose detailed errors
}

// ✓ Security-sensitive checks included
const usernameSchema = z.string().refine(
  async (username) => !(await db.usernameTaken(username))
);

// ✓ Test coverage for happy/sad paths
describe("userSchema", () => {
  it("accepts valid data", () => { /* ... */ });
  it("rejects invalid email", () => { /* ... */ });
});

// ✓ Rate limiting considered
const validateAndRateLimit = async (req) => {
  const result = await schema.safeParseAsync(req.body);
  if (!result.success) return { error: "validation" };

  const count = await redis.incr(`api:${req.ip}`);
  if (count > 1000) return { error: "rate_limit" };

  return { success: true, data: result.data };
};
```

---

**See Also**:
- [Core Concepts](01-core-concepts.md) — Foundations
- [Advanced Features](04-advanced-features.md) — Custom validation patterns
- [API Parsing](05-api-parsing.md) — Error handling details
- [Integration Patterns](06-integration-patterns.md) — Framework patterns

**Source**: https://zod.dev/
