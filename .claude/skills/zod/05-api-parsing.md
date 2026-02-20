# Zod: API Parsing & Error Handling

**Parsing Methods, ZodError Structure, and Error Patterns**

---

## Parsing Methods

**Source**: https://zod.dev/docs/api#parse

### .parse() - Eager Parsing (Throws)

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

// Success
const user = userSchema.parse({
  id: 1,
  name: "John",
  email: "john@example.com",
});
// user is fully typed as { id: number; name: string; email: string }

// Failure - throws ZodError
try {
  userSchema.parse({
    id: "not-a-number",
    name: 123,
    email: "invalid-email",
  });
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Validation failed:", error.issues);
  }
}
```

### .safeParse() - Safe Parsing (No Throw)

```typescript
const result = userSchema.safeParse({
  id: 1,
  name: "John",
  email: "john@example.com",
});

if (result.success) {
  // result.data is available and typed
  console.log("Valid:", result.data.id);
} else {
  // result.error is available
  console.log("Errors:", result.error.issues);
}

// Alternative: if-else with falsy check
if (!result.success) {
  return { errors: result.error.flatten().fieldErrors };
}

const user = result.data; // Fully typed
```

### .parseAsync() - Async Eager Parsing

```typescript
const usernameSchema = z.string()
  .min(3)
  .refine(
    async (username) => {
      const existing = await db.users.findOne({ username });
      return !existing;
    },
    { message: "Username already taken" }
  );

try {
  const validUsername = await usernameSchema.parseAsync("john_doe");
  console.log("Valid:", validUsername);
} catch (error) {
  if (error instanceof z.ZodError) {
    console.error("Username error:", error.issues[0].message);
  }
}
```

### .safeParseAsync() - Async Safe Parsing

```typescript
const userSchema = z.object({
  username: z.string().min(3).refine(
    async (username) => {
      const existing = await db.users.findOne({ username });
      return !existing;
    },
    { message: "Username already taken" }
  ),
  email: z.string().email(),
});

async function registerUser(data: unknown) {
  const result = await userSchema.safeParseAsync(data);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
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
  email: z.string().email(),
});

const result = schema.safeParse({
  name: 123,           // wrong type
  age: -5,             // invalid value
  email: "not-an-email", // invalid format
  extra: "field",      // unexpected property
});

if (!result.success) {
  // Access all issues
  console.log(result.error.issues);
  // [
  //   { code: 'invalid_type', expected: 'string', received: 'number', path: ['name'] },
  //   { code: 'too_small', minimum: 0, type: 'number', path: ['age'] },
  //   { code: 'invalid_string', validation: 'email', path: ['email'] },
  //   { code: 'unrecognized_keys', keys: ['extra'] }
  // ]

  // Flatten for forms
  const fieldErrors = result.error.flatten().fieldErrors;
  // {
  //   name: ['Expected string, received number'],
  //   age: ['Number must be greater than 0'],
  //   email: ['Invalid email'],
  // }
}
```

---

## Error Handling in React

```typescript
import React, { useState } from "react";
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
);

type UserInput = z.infer<typeof userSchema>;

export function RegistrationForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = userSchema.safeParse(formData);
    if (!result.success) {
      setErrors(result.error.flatten().fieldErrors);
      return;
    }

    await api.register(result.data);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="email"
        name="email"
        value={formData.email}
        onChange={handleChange}
      />
      {errors.email && <span className="error">{errors.email[0]}</span>}

      <input
        type="password"
        name="password"
        value={formData.password}
        onChange={handleChange}
      />
      {errors.password && <span className="error">{errors.password[0]}</span>}

      <input
        type="password"
        name="confirmPassword"
        value={formData.confirmPassword}
        onChange={handleChange}
      />
      {errors.confirmPassword && (
        <span className="error">{errors.confirmPassword[0]}</span>
      )}

      <button type="submit">Register</button>
    </form>
  );
}
```

---

## Error Handling in Express

```typescript
import express, { Request, Response, NextFunction } from "express";
import { z } from "zod";

const validateBody = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          issues: error.flatten().fieldErrors,
        });
      } else {
        next(error);
      }
    }
  };
};

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

app.post(
  "/users",
  validateBody(createUserSchema),
  async (req: Request, res: Response) => {
    // req.body is validated and typed
    const user = await db.users.create(req.body);
    res.json(user);
  }
);
```

---

## Type Guards

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof userSchema>;

// Type guard function
function isUser(data: unknown): data is User {
  return userSchema.safeParse(data).success;
}

const data: unknown = await fetch("/api/user").then(r => r.json());

if (isUser(data)) {
  // data is User type here
  console.log(data.email);
} else {
  console.error("Invalid user data");
}
```

---

**See Also**:
- [Core Concepts](01-core-concepts.md) — Parse vs SafeParse overview
- [Objects & Collections](03-objects-collections.md) — Schema design
- [Advanced Features](04-advanced-features.md) — Custom validation patterns
- [Integration Patterns](06-integration-patterns.md) — Framework-specific error handling
- [Best Practices](07-best-practices.md) — Error handling patterns

**Source**: https://zod.dev/docs/api#parse
