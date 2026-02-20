# Zod: Core Concepts

**Foundations, Principles, and Mental Models**

---

## What is Zod?

Zod is a **TypeScript-first schema validation library** that bridges compile-time type safety with runtime data validation.

### The Problem Zod Solves

```typescript
// ❌ WITHOUT ZOD - TypeScript limitation
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
// ✅ WITH ZOD - Runtime + Type safety
import { z } from "zod";

const UserSchema = z.object({
  name: z.string(),
  age: z.number(),
  email: z.string().email(),
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
| **Zero Dependencies** | 2KB gzipped |
| **Automatic Type Inference** | Define validation once, auto-generate TS types |
| **Security** | Prevent injection attacks via strict validation |
| **Developer Experience** | Clear error messages explaining exactly what's wrong |
| **Framework Integration** | Works with React, Express, tRPC, Next.js, etc. |

## Installation & Setup

```bash
npm install zod
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

---

## Core Patterns

### 1. Schemas Are Immutable

```typescript
const baseSchema = z.string();
const emailSchema = baseSchema.email();      // NEW instance
const trimmedSchema = emailSchema.trim();    // NEW instance

// baseSchema unchanged - still just z.string()
baseSchema.parse("  test@example.com  ");    // "  test@example.com  " (untrimmed)
trimmedSchema.parse("  test@example.com  "); // "test@example.com" (trimmed)
```

### 2. Type Inference

```typescript
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
});

type User = z.infer<typeof UserSchema>;
// type User = {
//   id: number;
//   name: string;
//   email: string;
//   age?: number;
// }
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

// safeParse() - Returns result object
const result = schema.safeParse("not a number");
if (!result.success) {
  console.error(result.error.issues);
} else {
  console.log("Valid:", result.data);
}
```

---

## Validation Workflow Example

```typescript
// Define schema
const RegistrationSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8),
  email: z.string().email(),
  acceptTerms: z.boolean().refine(v => v === true),
});

// Infer type
type RegistrationData = z.infer<typeof RegistrationSchema>;

// Validate data
async function handleRegistration(formData: unknown) {
  const result = RegistrationSchema.safeParse(formData);

  if (!result.success) {
    return {
      success: false,
      errors: result.error.flatten().fieldErrors,
    };
  }

  const user = await db.users.create(result.data);
  return { success: true, userId: user.id };
}
```

---

## Quick Start Guide

### For Different Use Cases

#### 👤 First-Time User
```
1. Read: Core Concepts (this module)
2. Read: Basic Types (module 02)
3. Pick your use case below
```

#### 📝 Form Developer
→ Basic Types → Objects & Collections → Integration: React Hook Form

#### 🔌 API Developer
→ Basic Types → Objects & Collections → Parsing → Integration: Express/tRPC

#### 🚀 Full-Stack Developer
→ Read all modules in order

#### 🔧 Troubleshooting
→ Jump to Best Practices "Common Pitfalls" section

---

## Module Overview

| Module | Purpose | Size | Audience |
|--------|---------|------|----------|
| **Core Concepts** | Foundations & philosophy | 3.2k tokens | All (start here) |
| **Basic Types** | Primitive validators | 4.8k tokens | All developers |
| **Objects & Collections** | Complex structures | 4.2k tokens | Intermediate+ |
| **Advanced Features** | Custom validation | 4.5k tokens | Advanced |
| **Parsing & Errors** | Error handling | 3.8k tokens | All developers |
| **Integration** | Framework examples | 3.5k tokens | Full-stack |
| **Best Practices** | Production patterns | 4.1k tokens | Teams |

---

**See Also**:
- [Basic Types & Primitives](02-basic-types.md) — Primitive validators
- [Objects & Collections](03-objects-collections.md) — Complex structures
- [API Parsing & Error Handling](05-api-parsing.md) — Error handling
- [Best Practices](07-best-practices.md) — Production patterns

**Source**: https://zod.dev/
