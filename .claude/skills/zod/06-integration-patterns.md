# Zod: Integration Patterns

**Framework Integration and Real-World Usage**

---

## React Hook Form

**Setup**:
```bash
npm install react-hook-form @hookform/resolvers zod
```

**Example**:
```typescript
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const registrationSchema = z.object({
  email: z.email({ error: "Invalid email address" }),
  password: z.string()
    .min(8, { error: "Password must be at least 8 characters" })
    .regex(/[A-Z]/, { error: "Must contain uppercase letter" })
    .regex(/[0-9]/, { error: "Must contain number" }),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  { error: "Passwords don't match", path: ["confirmPassword"] },
);

type RegistrationFormData = z.infer<typeof registrationSchema>;

export function RegistrationForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
  });

  const onSubmit = async (data: RegistrationFormData) => {
    await api.register(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("email")} placeholder="Email" />
      {errors.email && <span>{errors.email.message}</span>}

      <input {...register("password")} type="password" placeholder="Password" />
      {errors.password && <span>{errors.password.message}</span>}

      <input {...register("confirmPassword")} type="password" placeholder="Confirm" />
      {errors.confirmPassword && <span>{errors.confirmPassword.message}</span>}

      <button type="submit" disabled={isSubmitting}>Register</button>
    </form>
  );
}
```

---

## Express Middleware

```typescript
import express from "express";
import { z } from "zod";

const app = express();

const validateBody = (schema: z.ZodType) => {
  return async (req: express.Request, res: express.Response, next: express.NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: z.treeifyError(error),
        });
      } else {
        next(error);
      }
    }
  };
};

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).optional(),
});

app.post("/posts", validateBody(createPostSchema), async (req, res) => {
  const post = await db.posts.create(req.body);
  res.json(post);
});
```

---

## tRPC

```typescript
import { z } from "zod";
import { initTRPC } from "@trpc/server";

const t = initTRPC.create();

export const appRouter = t.router({
  user: t.router({
    create: t.procedure
      .input(z.object({
        email: z.email(),
        name: z.string(),
        age: z.number().int().positive(),
      }))
      .output(z.object({
        id: z.number(),
        email: z.string(),
        name: z.string(),
        createdAt: z.date(),
      }))
      .mutation(async ({ input }) => {
        return db.users.create(input);
      }),

    list: t.procedure
      .input(z.object({
        limit: z.number().default(10),
        offset: z.number().default(0),
      }))
      .query(async ({ input }) => {
        return db.users.find(input);
      }),
  }),
});

export type AppRouter = typeof appRouter;
```

---

## Next.js Server Actions

```typescript
"use server";

import { z } from "zod";

const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  published: z.boolean().default(false),
});

export async function createPost(formData: FormData) {
  const input = {
    title: formData.get("title"),
    content: formData.get("content"),
    published: formData.get("published") === "on",
  };

  const result = await createPostSchema.safeParseAsync(input);

  if (!result.success) {
    return { success: false, errors: z.treeifyError(result.error) };
  }

  const post = await db.posts.create(result.data);
  return { success: true, post };
}
```

---

## JSON Schema Conversion (v4)

```typescript
import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
  email: z.email(),
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "user"]),
}).meta({ title: "User", description: "A user object" });

// Convert Zod schema to JSON Schema
const jsonSchema = z.toJSONSchema(userSchema);
// {
//   type: "object",
//   title: "User",
//   description: "A user object",
//   properties: { ... },
//   required: ["id", "email", "name", "role"]
// }
```

---

## Shared Schemas (Monorepo)

```typescript
// packages/schemas/src/user.ts
import { z } from "zod";

export const userBaseSchema = z.object({
  id: z.number(),
  email: z.email(),
  name: z.string(),
  createdAt: z.date(),
});

export const createUserSchema = userBaseSchema.omit({
  id: true,
  createdAt: true,
});

export const updateUserSchema = userBaseSchema.partial().omit({
  id: true,
  createdAt: true,
});

export type User = z.infer<typeof userBaseSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
```

---

## Zod Mini (v4)

For bundle-sensitive applications, use the tree-shakable mini variant (~2kb):

```typescript
import { z } from "zod/mini";

// Same API, but no built-in error messages
// You must provide error messages explicitly via .check()
const schema = z.object({
  name: z.string().check(
    z.minLength(1, { error: "Name required" }),
  ),
  email: z.email({ error: "Invalid email" }),
});
```

---

**See Also**:
- [Objects & Collections](03-objects-collections.md)
- [API Parsing](05-api-parsing.md)
- [Best Practices](07-best-practices.md)

**Version**: 4.x (^4.3.0) | **Source**: https://zod.dev/
