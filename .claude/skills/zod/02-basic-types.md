# Zod: Basic Types & Primitives

**String, Number, Boolean, Date, BigInt, and Coercion**

---

## z.string()

**Source**: https://zod.dev/docs/api#strings

### Common Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `.min(n)` | Minimum length | `z.string().min(3)` |
| `.max(n)` | Maximum length | `z.string().max(100)` |
| `.length(n)` | Exact length | `z.string().length(5)` |
| `.email()` | Valid email | `z.string().email()` |
| `.url()` | Valid URL | `z.string().url()` |
| `.uuid()` | Valid UUID | `z.string().uuid()` |
| `.regex(pattern)` | Regex match | `z.string().regex(/^[A-Z]/)` |
| `.trim()` | Remove whitespace | `z.string().trim()` |
| `.toLowerCase()` | Lowercase | `z.string().toLowerCase()` |
| `.toUpperCase()` | Uppercase | `z.string().toUpperCase()` |
| `.startsWith(s)` | Starts with | `z.string().startsWith("Mr.")` |
| `.endsWith(s)` | Ends with | `z.string().endsWith(".com")` |

### Examples

```typescript
// Email validation
const emailSchema = z.string()
  .email("Invalid email")
  .min(5, "Too short")
  .max(254, "Too long")
  .toLowerCase()
  .trim();

emailSchema.parse("  USER@EXAMPLE.COM  "); // "user@example.com"

// URL validation
const urlSchema = z.string().url();
urlSchema.parse("https://example.com"); // ✓

// Slug validation
const slugSchema = z.string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Invalid slug format")
  .min(1)
  .max(100);

slugSchema.parse("my-awesome-post"); // ✓

// Password validation
const passwordSchema = z.string()
  .min(8, "At least 8 characters")
  .regex(/[A-Z]/, "One uppercase letter")
  .regex(/[0-9]/, "One number")
  .regex(/[!@#$%^&*]/, "One special character");
```

---

## z.number()

**Source**: https://zod.dev/docs/api#numbers

### Common Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `.int()` | Must be integer | `z.number().int()` |
| `.positive()` | Must be > 0 | `z.number().positive()` |
| `.negative()` | Must be < 0 | `z.number().negative()` |
| `.nonnegative()` | Must be >= 0 | `z.number().nonnegative()` |
| `.min(n)` | Must be >= n | `z.number().min(0)` |
| `.max(n)` | Must be <= n | `z.number().max(100)` |
| `.finite()` | Not Infinity/NaN | `z.number().finite()` |
| `.multipleOf(n)` | Multiple of n | `z.number().multipleOf(5)` |

### Examples

```typescript
// Age validation
const ageSchema = z.number()
  .int("Must be whole number")
  .min(0, "Cannot be negative")
  .max(150, "Invalid age");

ageSchema.parse(25); // ✓
ageSchema.parse(25.5); // ✗ ZodError

// Price validation
const priceSchema = z.number()
  .positive("Price must be positive")
  .multipleOf(0.01, "At most 2 decimals")
  .min(0.01, "At least $0.01");

priceSchema.parse(19.99); // ✓

// Percentage validation
const percentageSchema = z.number()
  .int()
  .min(0)
  .max(100);
```

---

## z.boolean()

```typescript
const schema = z.boolean();

schema.parse(true);  // true
schema.parse(false); // false
schema.parse(1);     // ✗ ZodError

// Terms acceptance
const termsSchema = z.boolean()
  .refine(v => v === true, "Must accept terms");

termsSchema.parse(true); // ✓
```

---

## z.date()

**Source**: https://zod.dev/docs/api#dates

```typescript
const dateSchema = z.date();

dateSchema.parse(new Date()); // ✓

// With constraints
const birthDateSchema = z.date()
  .min(new Date("1900-01-01"), "Too far in past")
  .max(new Date(), "Cannot be in future");

birthDateSchema.parse(new Date("1990-05-15")); // ✓

// Expiration date (must be in future)
const expirationSchema = z.date()
  .min(new Date(), "Must be in future");
```

---

## z.bigint()

```typescript
const idSchema = z.bigint().positive();

idSchema.parse(123456789012345n); // ✓

// Ethereum wei (smallest unit)
const weiSchema = z.bigint()
  .nonnegative()
  .max(BigInt("999999999999999999999"));
```

---

## Coercion

```typescript
// String to number (common in forms)
const ageSchema = z.coerce.number()
  .int()
  .positive();

ageSchema.parse("25"); // 25 (number)

// String to boolean
const checkboxSchema = z.coerce.boolean();
checkboxSchema.parse("on");  // true
checkboxSchema.parse("true"); // true

// Form data coercion
const formSchema = z.object({
  age: z.coerce.number().int().positive(),
  quantity: z.coerce.number().positive(),
  acceptTerms: z.coerce.boolean(),
});
```

---

## Common Validation Stacks

### Email Stack
```typescript
const emailSchema = z.string()
  .trim()
  .toLowerCase()
  .email("Invalid email")
  .min(5, "Email too short")
  .max(254, "Email too long");
```

### Password Stack
```typescript
const passwordSchema = z.string()
  .min(8, "At least 8 characters")
  .max(128, "Max 128 characters")
  .regex(/[A-Z]/, "One uppercase")
  .regex(/[a-z]/, "One lowercase")
  .regex(/[0-9]/, "One number")
  .regex(/[!@#$%^&*]/, "One special character");
```

### Username Stack
```typescript
const usernameSchema = z.string()
  .min(3, "At least 3 characters")
  .max(20, "Max 20 characters")
  .regex(/^[a-zA-Z0-9_-]+$/, "Letters, numbers, underscore, hyphen only");
```

---

**See Also**:
- [Core Concepts](01-core-concepts.md) — Foundations
- [Objects & Collections](03-objects-collections.md) — Complex structures
- [Advanced Features](04-advanced-features.md) — Custom validation

**Source**: https://zod.dev/docs/api
