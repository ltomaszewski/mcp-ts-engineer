# Zod: Basic Types & Primitives

**String, Number, Boolean, Date, BigInt, File, and Coercion**

---

## z.string()

**Source**: https://zod.dev/api#strings

### Common Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `.min(n)` | Minimum length | `z.string().min(3)` |
| `.max(n)` | Maximum length | `z.string().max(100)` |
| `.length(n)` | Exact length | `z.string().length(5)` |
| `.email()` | Valid email (deprecated: use `z.email()`) | `z.string().email()` |
| `.url()` | Valid URL (deprecated: use `z.url()`) | `z.string().url()` |
| `.uuid()` | Valid UUID (deprecated: use `z.uuid()`) | `z.string().uuid()` |
| `.regex(pattern)` | Regex match | `z.string().regex(/^[A-Z]/)` |
| `.trim()` | Remove whitespace (transform) | `z.string().trim()` |
| `.toLowerCase()` | Lowercase (transform) | `z.string().toLowerCase()` |
| `.toUpperCase()` | Uppercase (transform) | `z.string().toUpperCase()` |
| `.normalize()` | Unicode normalize (transform) | `z.string().normalize()` |
| `.startsWith(s)` | Starts with | `z.string().startsWith("Mr.")` |
| `.endsWith(s)` | Ends with | `z.string().endsWith(".com")` |
| `.includes(s)` | Contains substring | `z.string().includes("@")` |
| `.uppercase()` | Must be all uppercase (validator) | `z.string().uppercase()` |
| `.lowercase()` | Must be all lowercase (validator) | `z.string().lowercase()` |

### Top-Level String Validators (v4)

Prefer these over `z.string().email()` etc. -- tree-shakable and more efficient:

```typescript
z.email()          // Email address
z.uuid()           // UUID (RFC 9562/4122 strict)
z.uuidv4()         // UUID v4 specifically
z.uuidv6()         // UUID v6 specifically
z.uuidv7()         // UUID v7 specifically
z.guid()           // UUID-like (lenient)
z.url()            // Any WHATWG-compatible URL
z.httpUrl()        // HTTP/HTTPS URL only
z.hostname()       // Hostname
z.ipv4()           // IPv4 address
z.ipv6()           // IPv6 address
z.cidrv4()         // CIDR v4 notation
z.cidrv6()         // CIDR v6 notation
z.mac()            // MAC address (IEEE 802 48-bit)
z.iso.datetime()   // ISO 8601 datetime
z.iso.date()       // ISO 8601 date
z.iso.time()       // ISO 8601 time
z.iso.duration()   // ISO 8601 duration
z.base64()         // Base64 string
z.base64url()      // Base64URL string (unpadded in v4)
z.hex()            // Hexadecimal string
z.nanoid()         // NanoID string
z.cuid()           // CUID string
z.cuid2()          // CUID2 string
z.ulid()           // ULID string
z.jwt()            // JWT string
z.emoji()          // Emoji string
z.e164()           // E.164 phone number
z.semver()         // Semantic version
```

### Examples

```typescript
import { z } from "zod";

// Email validation (top-level, v4 preferred)
const emailSchema = z.email({ error: "Invalid email" });

// Or chained for combined validations
const emailWithLengthSchema = z.string()
  .email({ error: "Invalid email" })
  .min(5, { error: "Too short" })
  .max(254, { error: "Too long" })
  .toLowerCase()
  .trim();

emailWithLengthSchema.parse("  USER@EXAMPLE.COM  "); // "user@example.com"

// Password validation
const passwordSchema = z.string()
  .min(8, { error: "At least 8 characters" })
  .regex(/[A-Z]/, { error: "One uppercase letter" })
  .regex(/[0-9]/, { error: "One number" })
  .regex(/[!@#$%^&*]/, { error: "One special character" });

// Template literal validation (v4)
const userIdSchema = z.templateLiteral(["user_", z.number()]);
userIdSchema.parse("user_123"); // ok
userIdSchema.parse("user_abc"); // ZodError

// String boolean coercion (v4)
const envBool = z.stringbool(); // "true"/"yes"/"1"/"on" -> true
envBool.parse("true");  // true
envBool.parse("false"); // false

// Hash validation
const sha256Schema = z.string().hash("sha256");
```

---

## z.number()

**Source**: https://zod.dev/api#numbers

### Common Methods

| Method | Purpose | Example |
|--------|---------|---------|
| `.int()` | Must be safe integer | `z.number().int()` |
| `.positive()` | Must be > 0 | `z.number().positive()` |
| `.negative()` | Must be < 0 | `z.number().negative()` |
| `.nonnegative()` | Must be >= 0 | `z.number().nonnegative()` |
| `.nonpositive()` | Must be <= 0 | `z.number().nonpositive()` |
| `.min(n)` / `.gte(n)` | Must be >= n | `z.number().min(0)` |
| `.max(n)` / `.lte(n)` | Must be <= n | `z.number().max(100)` |
| `.gt(n)` | Must be > n | `z.number().gt(0)` |
| `.lt(n)` | Must be < n | `z.number().lt(100)` |
| `.finite()` | Not Infinity/NaN | `z.number().finite()` |
| `.multipleOf(n)` | Multiple of n | `z.number().multipleOf(5)` |

**v4 changes**:
- `Infinity`/`-Infinity` are rejected by default
- `.int()` rejects unsafe integers (outside `Number.MIN_SAFE_INTEGER` to `Number.MAX_SAFE_INTEGER`)
- `.safe()` is removed (use `.int()` instead)

### Integer Types (v4)

```typescript
z.int()     // Safe integer (Number.MIN_SAFE_INTEGER to Number.MAX_SAFE_INTEGER)
z.int32()   // 32-bit integer (-2147483648 to 2147483647)
```

### Examples

```typescript
// Age validation
const ageSchema = z.number()
  .int({ error: "Must be whole number" })
  .min(0, { error: "Cannot be negative" })
  .max(150, { error: "Invalid age" });

// Price validation
const priceSchema = z.number()
  .positive({ error: "Price must be positive" })
  .multipleOf(0.01, { error: "At most 2 decimals" });

// Percentage validation
const percentageSchema = z.int().min(0).max(100);
```

---

## z.boolean()

```typescript
const schema = z.boolean();
schema.parse(true);  // true
schema.parse(false); // false
schema.parse(1);     // ZodError

// Terms acceptance
const termsSchema = z.boolean()
  .refine((v) => v === true, { error: "Must accept terms" });
```

---

## z.date()

**Source**: https://zod.dev/api#dates

```typescript
const dateSchema = z.date();
dateSchema.parse(new Date()); // ok

// With constraints
const birthDateSchema = z.date()
  .min(new Date("1900-01-01"), { error: "Too far in past" })
  .max(new Date(), { error: "Cannot be in future" });

// Expiration date (must be in future)
const expirationSchema = z.date()
  .min(new Date(), { error: "Must be in future" });
```

---

## z.bigint()

```typescript
const idSchema = z.bigint().positive();
idSchema.parse(123456789012345n); // ok

// With constraints
const weiSchema = z.bigint()
  .nonnegative()
  .max(BigInt("999999999999999999999"));
```

---

## z.file() (v4)

File/Blob validation for upload handling:

```typescript
const imageSchema = z.file()
  .type("image/png")
  .min(1024, { error: "File too small" })        // min bytes
  .max(5_000_000, { error: "Max 5MB" });          // max bytes

const documentSchema = z.file()
  .type("application/pdf")
  .max(10_000_000);

// Multiple allowed types
const mediaSchema = z.file()
  .type("image/*");
```

---

## z.literal() (v4 extended)

```typescript
// Single literal
const adminLiteral = z.literal("admin");

// Multiple literals (v4)
const statusCode = z.literal([200, 201, 204]);
statusCode.parse(200); // ok
statusCode.parse(404); // ZodError

// NOTE: Symbol support removed in v4
```

---

## z.nan()

```typescript
const nanSchema = z.nan();
nanSchema.parse(NaN); // ok
nanSchema.parse(42);  // ZodError
```

---

## Coercion

```typescript
// String to number (common in forms)
const ageSchema = z.coerce.number().int().positive();
ageSchema.parse("25"); // 25 (number)

// String to boolean
const checkboxSchema = z.coerce.boolean();
checkboxSchema.parse("on");   // true

// v4 change: all coerce schemas accept `unknown` input
// String boolean with explicit mapping (v4)
const envFlag = z.stringbool(); // "true"/"yes"/"1"/"on" -> true

// String to date
const dateSchema = z.coerce.date();
dateSchema.parse("2024-12-25"); // Date object

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
const emailSchema = z.email({ error: "Invalid email" });
// Or with length constraints:
const emailWithLengthSchema = z.string()
  .trim()
  .toLowerCase()
  .email({ error: "Invalid email" })
  .min(5, { error: "Email too short" })
  .max(254, { error: "Email too long" });
```

### Password Stack
```typescript
const passwordSchema = z.string()
  .min(8, { error: "At least 8 characters" })
  .max(128, { error: "Max 128 characters" })
  .regex(/[A-Z]/, { error: "One uppercase" })
  .regex(/[a-z]/, { error: "One lowercase" })
  .regex(/[0-9]/, { error: "One number" })
  .regex(/[!@#$%^&*]/, { error: "One special character" });
```

### Username Stack
```typescript
const usernameSchema = z.string()
  .min(3, { error: "At least 3 characters" })
  .max(20, { error: "Max 20 characters" })
  .regex(/^[a-zA-Z0-9_-]+$/, { error: "Letters, numbers, underscore, hyphen only" });
```

---

**See Also**:
- [Core Concepts](01-core-concepts.md)
- [Objects & Collections](03-objects-collections.md)
- [Advanced Features](04-advanced-features.md)

**Version**: 4.x (^4.3.6) | **Source**: https://zod.dev/api
