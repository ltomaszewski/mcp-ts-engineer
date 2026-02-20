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
  email: z.string().email("Invalid email address"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Must contain uppercase letter")
    .regex(/[0-9]/, "Must contain number"),
  confirmPassword: z.string(),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  }
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
      {errors.email && <span className="error">{errors.email.message}</span>}

      <input
        {...register("password")}
        type="password"
        placeholder="Password"
      />
      {errors.password && <span className="error">{errors.password.message}</span>}

      <input
        {...register("confirmPassword")}
        type="password"
        placeholder="Confirm Password"
      />
      {errors.confirmPassword && (
        <span className="error">{errors.confirmPassword.message}</span>
      )}

      <button type="submit" disabled={isSubmitting}>
        Register
      </button>
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

// Validation middleware factory
const validateBody = (schema: z.ZodSchema) => {
  return async (req, res, next) => {
    try {
      const validated = await schema.parseAsync(req.body);
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.flatten().fieldErrors,
        });
      } else {
        next(error);
      }
    }
  };
};

// Define schemas
const createPostSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
  tags: z.array(z.string()).optional(),
});

const getPaginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

// Routes
app.post(
  "/posts",
  validateBody(createPostSchema),
  async (req, res) => {
    // req.body is typed and validated
    const post = await db.posts.create(req.body);
    res.json(post);
  }
);

app.get(
  "/posts",
  (req, res, next) => {
    const result = getPaginationSchema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({ error: result.error.flatten().fieldErrors });
    }
    req.query = result.data;
    next();
  },
  async (req, res) => {
    const posts = await db.posts.find({
      limit: req.query.limit,
      offset: (req.query.page - 1) * req.query.limit,
    });
    res.json(posts);
  }
);
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
      .input(
        z.object({
          email: z.string().email(),
          name: z.string(),
          age: z.number().int().positive(),
        })
      )
      .output(
        z.object({
          id: z.number(),
          email: z.string(),
          name: z.string(),
          createdAt: z.date(),
        })
      )
      .mutation(async ({ input }) => {
        const user = await db.users.create(input);
        return user;
      }),

    get: t.procedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.users.findById(input.id);
      }),

    list: t.procedure
      .input(
        z.object({
          limit: z.number().default(10),
          offset: z.number().default(0),
        })
      )
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
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  const post = await db.posts.create(result.data);
  return {
    success: true,
    post,
  };
}

// In component
"use client";

import { createPost } from "@/app/actions";
import { useFormState } from "react-dom";

export default function CreatePostPage() {
  const [state, formAction] = useFormState(createPost, null);

  return (
    <form action={formAction}>
      <input name="title" placeholder="Title" required />
      {state?.errors?.title && <span>{state.errors.title[0]}</span>}

      <textarea name="content" placeholder="Content" required />
      {state?.errors?.content && <span>{state.errors.content[0]}</span>}

      <label>
        <input name="published" type="checkbox" />
        Publish immediately
      </label>

      <button type="submit">Create</button>
    </form>
  );
}
```

---

## Shared Schemas (Monorepo)

```typescript
// packages/schemas/src/user.ts
import { z } from "zod";

export const userBaseSchema = z.object({
  id: z.number(),
  email: z.string().email(),
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

// packages/api/src/routes/users.ts
import { createUserSchema, updateUserSchema } from "@schemas/user";

app.post("/users", validateBody(createUserSchema), async (req, res) => {
  // ...
});

// packages/web/src/hooks/useCreateUser.ts
import { createUserSchema } from "@schemas/user";
import { zodResolver } from "@hookform/resolvers/zod";

const { register, handleSubmit } = useForm({
  resolver: zodResolver(createUserSchema),
});
```

---

**See Also**:
- [Objects & Collections](03-objects-collections.md) — Schema design
- [API Parsing](05-api-parsing.md) — Error handling details
- [Best Practices](07-best-practices.md) — Production patterns

**Source**: https://zod.dev/docs/integrations
