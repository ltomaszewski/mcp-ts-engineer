# Validation: Schema-Based Approaches

> Integration with Yup, Zod, and AJV for schema-driven validation.

**Source:** [https://github.com/react-hook-form/resolvers](https://github.com/react-hook-form/resolvers)

---

## When to Use Schema-Based Validation

**Use inline rules (see `05-validation-rules.md`) when:**
- Simple forms with few fields
- Validation logic is straightforward
- TypeScript types already defined

**Use form-level `validate` (new in 7.72.0) when:**
- Cross-field validation (e.g., date ranges, password confirmation)
- Validation depends on multiple field values together
- No external schema library needed

**Use schema-based when:**
- Complex validation logic
- Reusable validation across multiple forms
- Type inference from schema (Zod)
- Complex nested data structures

---

## Yup Integration

### Installation

```bash
npm install yup @hookform/resolvers/yup
```

---

### Basic Setup

```typescript
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Define schema
const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email required'),
  password: yup.string().min(8, 'Min 8 characters').required('Password required')
});

// Infer type from schema
type FormData = yup.InferType<typeof schema>;

// Use in form
export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: yupResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}

      <input {...register('password')} type="password" />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit">Login</button>
    </form>
  );
}
```

---

### Common Yup Rules

```typescript
const schema = yup.object({
  // String validations
  email: yup.string().email('Invalid email').required('Required'),
  username: yup.string().min(3).max(20).required(),
  password: yup.string().min(8).required(),

  // Number validations
  age: yup.number().min(18).max(120).required(),
  rating: yup.number().min(1).max(5).required(),

  // Date validations
  birthDate: yup.date().required(),
  startDate: yup.date().typeError('Must be a date').required(),

  // Conditional
  companyName: yup.string().when('userType', {
    is: 'business',
    then: yup.string().required('Company name required'),
    otherwise: yup.string()
  }),

  // Cross-field validation
  confirmPassword: yup.string().oneOf(
    [yup.ref('password')],
    'Passwords must match'
  ),

  // Array validation
  tags: yup.array().of(yup.string()).min(1).max(5),

  // Nested object
  address: yup.object({
    street: yup.string().required(),
    city: yup.string().required(),
    zipCode: yup.string().matches(/^\d{5}$/, 'Invalid ZIP')
  })
});
```

---

### Yup Example: Complete Signup Form

```typescript
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';

const schema = yup.object({
  email: yup
    .string()
    .email('Invalid email format')
    .required('Email is required'),
  password: yup
    .string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/,
      'Must include uppercase, lowercase, and number'
    )
    .required('Password is required'),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], 'Passwords must match')
    .required('Confirm password is required'),
  agreeToTerms: yup
    .boolean()
    .oneOf([true], 'You must agree to terms')
    .required()
});

type SignupData = yup.InferType<typeof schema>;

export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignupData>({
    resolver: yupResolver(schema),
    mode: 'onBlur'
  });

  const onSubmit = async (data: SignupData) => {
    await fetch('/api/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} type="email" placeholder="Email" />
      {errors.email && <p>{errors.email.message}</p>}

      <input {...register('password')} type="password" placeholder="Password" />
      {errors.password && <p>{errors.password.message}</p>}

      <input
        {...register('confirmPassword')}
        type="password"
        placeholder="Confirm Password"
      />
      {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}

      <label>
        <input {...register('agreeToTerms')} type="checkbox" />
        I agree to terms
      </label>
      {errors.agreeToTerms && <p>{errors.agreeToTerms.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        Sign Up
      </button>
    </form>
  );
}
```

---

## Zod Integration

### Installation

```bash
npm install zod @hookform/resolvers/zod
```

---

### Basic Setup

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Define schema
const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters')
});

// Infer type from schema (recommended!)
type FormData = z.infer<typeof schema>;

// Use in form
export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('email')} />
      {errors.email && <p>{errors.email.message}</p>}

      <input {...register('password')} type="password" />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit">Login</button>
    </form>
  );
}
```

---

### Common Zod Rules

```typescript
const schema = z.object({
  // String validations
  email: z.string().email('Invalid email').min(1, 'Required'),
  username: z.string().min(3).max(20),
  url: z.string().url('Invalid URL'),
  password: z.string().min(8).regex(/[A-Z]/, 'Need uppercase'),

  // Number validations
  age: z.number().int().min(18).max(120),
  rating: z.number().min(1).max(5),

  // Date validations
  birthDate: z.date(),
  futureDate: z.date().refine((date) => date > new Date(), {
    message: 'Date must be in the future'
  }),

  // Conditional
  companyName: z.string().optional(),

  // Cross-field validation (refine)
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword']
});

// Array validation
const schema = z.object({
  tags: z.array(z.string()).min(1).max(5),
  items: z.array(z.object({
    name: z.string(),
    quantity: z.number().int().positive()
  }))
});

// Nested object
const schema = z.object({
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string().regex(/^\d{5}$/, 'Invalid ZIP')
  })
});
```

---

### Zod Example: Complete Form

```typescript
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

const schema = z
  .object({
    email: z
      .string()
      .min(1, 'Email required')
      .email('Invalid email format'),
    password: z
      .string()
      .min(8, 'Password must be 8+ characters')
      .regex(/[A-Z]/, 'Need uppercase letter')
      .regex(/[0-9]/, 'Need number'),
    confirmPassword: z.string(),
    agreeToTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to terms'
    })
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type SignupData = z.infer<typeof schema>;

export function SignupForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<SignupData>({
    resolver: zodResolver(schema),
    mode: 'onBlur'
  });

  const onSubmit = async (data: SignupData) => {
    await fetch('/api/signup', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email')} type="email" placeholder="Email" />
      {errors.email && <p>{errors.email.message}</p>}

      <input {...register('password')} type="password" placeholder="Password" />
      {errors.password && <p>{errors.password.message}</p>}

      <input
        {...register('confirmPassword')}
        type="password"
        placeholder="Confirm Password"
      />
      {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}

      <label>
        <input {...register('agreeToTerms')} type="checkbox" />
        I agree to terms
      </label>
      {errors.agreeToTerms && <p>{errors.agreeToTerms.message}</p>}

      <button type="submit" disabled={isSubmitting}>
        Sign Up
      </button>
    </form>
  );
}
```

---

## Yup vs Zod Comparison

| Aspect | Yup | Zod |
|--------|-----|-----|
| **Type Inference** | `yup.InferType<typeof schema>` | `z.infer<typeof schema>` (recommended) |
| **Cross-field Validation** | `.when()` method | `.refine()` method |
| **Array Validation** | `.array().of()` | `.array().of()` |
| **Bundle Size** | ~14kb | ~8kb |
| **Async Validation** | `.test()` | `.refine()` |
| **Popularity** | Very popular | Growing |
| **TypeScript** | Good | Excellent |
| **Learning Curve** | Moderate | Gentle |

**Recommendation:** Use **Zod** for new projects (better TypeScript support), **Yup** for existing projects.

---

## AJV Integration

### Installation

```bash
npm install ajv @hookform/resolvers/ajv
```

---

### Basic Setup

```typescript
import { useForm } from 'react-hook-form';
import { ajvResolver } from '@hookform/resolvers/ajv';

// Define JSON Schema
const schema = {
  type: 'object',
  properties: {
    email: { type: 'string', format: 'email' },
    password: { type: 'string', minLength: 8 }
  },
  required: ['email', 'password']
};

export function LoginForm() {
  const { register, handleSubmit } = useForm({
    resolver: ajvResolver(schema)
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('email')} />
      <input {...register('password')} type="password" />
      <button type="submit">Login</button>
    </form>
  );
}
```

**Note:** AJV uses JSON Schema format, not JavaScript objects. Less commonly used than Yup/Zod.

---

## Dynamic Schema Validation

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

// Schema changes based on form state
const getSchema = (userType: string) => {
  const baseSchema = z.object({
    email: z.string().email(),
    userType: z.enum(['individual', 'business'])
  });

  if (userType === 'business') {
    return baseSchema.extend({
      companyName: z.string().min(1, 'Company name required'),
      taxId: z.string().min(1, 'Tax ID required')
    });
  }

  return baseSchema;
};

export function DynamicForm() {
  const { watch, formState: { errors } } = useForm({
    resolver: zodResolver(getSchema(watch('userType')))
  });

  // Form content
}
```

---

## Server-Side Schema Reuse

```typescript
// shared/schemas.ts (shared between client and server)
import { z } from 'zod';

export const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export type SignupData = z.infer<typeof signupSchema>;

// Client form
import { signupSchema } from '@/shared/schemas';
import { zodResolver } from '@hookform/resolvers/zod';

const { register } = useForm({
  resolver: zodResolver(signupSchema)
});

// Server action (Next.js)
import { signupSchema, SignupData } from '@/shared/schemas';

export async function handleSignup(data: SignupData) {
  const validated = signupSchema.parse(data);
  // Process...
}
```

---

## Cross-References

- **Inline validation:** See `05-validation-rules.md`
- **Form patterns:** See `08-patterns-implementation.md`
- **Best practices:** See `09-best-practices.md`

---

**Version:** 7.72.1 | **Source:** https://github.com/react-hook-form/resolvers
