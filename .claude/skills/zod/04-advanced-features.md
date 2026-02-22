# Zod: Advanced Features

**Custom Validation, Transformations, Recursive Types, and Branding**

---

## .refine() - Custom Validation

**Source**: https://zod.dev/api#refine

```typescript
import { z } from "zod";

// Simple refinement (v4: use `error` param)
const passwordSchema = z.string()
  .min(8)
  .refine(
    (password) => /[A-Z]/.test(password),
    { error: "Password must contain uppercase letter" },
  );

// Multiple field validation
const userSchema = z.object({
  email: z.email(),
  confirmEmail: z.string(),
}).refine(
  (data) => data.email === data.confirmEmail,
  { error: "Emails don't match", path: ["confirmEmail"] },
);

// Async refinement (database uniqueness)
const usernameSchema = z.string()
  .min(3)
  .refine(
    async (username) => {
      const existing = await db.users.findOne({ username });
      return !existing;
    },
    { error: "Username already taken" },
  );

// Must use async parsing for async refinements
const result = await usernameSchema.safeParseAsync("john_doe");
```

**v4 change**: Type predicates in `.refine()` no longer narrow types. The function-as-second-argument overload is removed.

---

## .superRefine() - Fine-Grained Errors

**v4 change**: `.addIssue()` and `.addIssues()` are removed. Mutate `ctx.issues` array directly. `ctx.path` is also removed.

```typescript
const formSchema = z.object({
  accountType: z.enum(["personal", "business"]),
  businessName: z.string().optional(),
  businessTaxId: z.string().optional(),
  personalPhone: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.accountType === "business") {
    if (!data.businessName) {
      ctx.issues.push({
        code: "custom",
        path: ["businessName"],
        message: "Business name required",
      });
    }
    if (!data.businessTaxId) {
      ctx.issues.push({
        code: "custom",
        path: ["businessTaxId"],
        message: "Tax ID required",
      });
    }
  }

  if (data.accountType === "personal" && !data.personalPhone) {
    ctx.issues.push({
      code: "custom",
      path: ["personalPhone"],
      message: "Phone required",
    });
  }
});
```

---

## .check() - Zod Mini Validation

In `zod/mini`, use `.check()` instead of method chaining:

```typescript
import { z } from "zod/mini";

const schema = z.string().check(
  z.minLength(1, { error: "Required" }),
  z.maxLength(100, { error: "Too long" }),
);
```

---

## .transform() - Type Transformation

**Source**: https://zod.dev/api#transform

```typescript
// String to number
const numberSchema = z.string().transform((val) => Number(val));
numberSchema.parse("42"); // 42 (number)

type Input = z.input<typeof numberSchema>;   // string
type Output = z.output<typeof numberSchema>; // number

// Object transformation
const userSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
}).transform((data) => ({
  ...data,
  fullName: `${data.firstName} ${data.lastName}`,
}));

// Chained transformations
const processedSchema = z.string()
  .trim()
  .toLowerCase()
  .transform((val) => val.split(" "))
  .transform((words) => words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)))
  .transform((words) => words.join(" "));

processedSchema.parse("  hello   world  "); // "Hello World"
```

### Standalone Transforms (v4)

```typescript
// z.transform() as a standalone schema
const toNumber = z.transform((input) => String(input));
```

---

## .pipe() - Schema Chaining

Chain schemas together where the output of one feeds into the next:

```typescript
// Coerce string to number, then validate
const schema = z.string().pipe(z.coerce.number().positive());
schema.parse("42"); // 42
schema.parse("-1"); // ZodError (not positive)
```

---

## .preprocess() - Transform Before Validation

```typescript
// Coerce string to number, then validate
const numberSchema = z.preprocess(
  (val) => Number(val),
  z.number().positive(),
);

numberSchema.parse("42"); // ok: 42
numberSchema.parse("0");  // ZodError

// v4 note: z.preprocess() now returns a ZodPipe internally
```

---

## Codecs - Bidirectional Transforms (v4)

```typescript
const dateCodec = z.codec(
  z.iso.datetime(),              // input schema
  (input) => new Date(input),    // decode (parse direction)
  (output) => output.toISOString(), // encode (reverse direction)
);

const decoded = dateCodec.parse("2024-12-25T00:00:00Z"); // Date object
```

---

## Schema Composition

```typescript
// .and() / .or() - Logical composition
const stringOrNumber = z.string().or(z.number());

// .extend() with spread - Combine objects (replaces .merge())
const authSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const profileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

const userSchema = z.object({
  ...authSchema.shape,
  ...profileSchema.shape,
});

// Default values
const userWithDefaults = z.object({
  id: z.number(),
  name: z.string(),
  role: z.enum(["user", "admin"]).default("user"),
  createdAt: z.date().default(() => new Date()),
});
```

---

## .brand() - Opaque Types

```typescript
const emailSchema = z.email().brand<"Email">();

type Email = z.infer<typeof emailSchema>;

const userEmail: Email = emailSchema.parse("user@example.com");
const regularString: string = "user@example.com";

function sendEmail(to: Email) {
  // ...
}

sendEmail(userEmail);       // ok
sendEmail(regularString);   // TypeScript error
```

**v4 change**: `ZodBranded` class is removed; branding is now via type modification.

---

## .readonly()

```typescript
const readonlyArray = z.array(z.string()).readonly();
type T = z.infer<typeof readonlyArray>; // readonly string[]

const readonlyObject = z.object({ name: z.string() }).readonly();
type O = z.infer<typeof readonlyObject>; // { readonly name: string }
```

---

## Recursive Types (v4 getter syntax)

v4 supports proper recursive type inference with getter syntax:

```typescript
// v4 preferred: getter syntax for recursive schemas
const Category = z.object({
  name: z.string(),
  get subcategories() { return z.array(Category).optional(); },
});

type Category = z.infer<typeof Category>;
// { name: string; subcategories?: Category[] }

Category.parse({
  name: "Electronics",
  subcategories: [
    { name: "Phones", subcategories: [{ name: "iPhone" }] },
  ],
});

// z.lazy() still works for backward compatibility
type CategoryLazy = { name: string; children?: CategoryLazy[] };

const categorySchemaLazy: z.ZodType<CategoryLazy> = z.lazy(() =>
  z.object({
    name: z.string(),
    children: z.array(categorySchemaLazy).optional(),
  }),
);
```

---

## z.function() (v4 redesigned)

v4 completely redesigns `z.function()`. It is no longer a Zod schema.

```typescript
// v4 syntax for function schemas
const myFunc = z.function({
  input: [z.string(), z.number()],
  output: z.boolean(),
});

type MyFunc = z.infer<typeof myFunc>;
// (arg0: string, arg1: number) => boolean

// .implement() wraps a function with runtime validation
const safeAdd = z.function({
  input: [z.number(), z.number()],
  output: z.number(),
}).implement((a, b) => a + b);

safeAdd(1, 2); // 3
safeAdd("1" as any, 2); // throws ZodError

// .implementAsync() for async functions (v4)
const asyncFn = z.function({
  input: [z.string()],
  output: z.promise(z.string()),
}).implementAsync(async (name) => `Hello ${name}`);
```

---

## Template Literal Types (v4)

```typescript
const userIdSchema = z.templateLiteral(["user_", z.number()]);
userIdSchema.parse("user_123");  // ok
userIdSchema.parse("user_abc");  // ZodError

const routeSchema = z.templateLiteral(["/api/v", z.number(), "/users"]);
routeSchema.parse("/api/v1/users"); // ok
```

---

## z.registry() and z.globalRegistry (v4)

Registries associate metadata with schemas:

```typescript
const formRegistry = z.registry<z.ZodType, { label: string; placeholder: string }>();

const nameSchema = z.string().min(1);
const emailSchema = z.email();

formRegistry.add(nameSchema, { label: "Full Name", placeholder: "Enter your name" });
formRegistry.add(emailSchema, { label: "Email", placeholder: "you@example.com" });

const nameMeta = formRegistry.get(nameSchema);
// { label: "Full Name", placeholder: "Enter your name" }

// Global registry for JSON Schema generation
z.globalRegistry.add(nameSchema, { id: "name", title: "Name" });
```

---

## z.instanceof()

```typescript
class AppError extends Error {
  constructor(public code: string, message: string) {
    super(message);
  }
}

const errorSchema = z.instanceof(AppError);
errorSchema.parse(new AppError("NOT_FOUND", "Not found")); // ok
errorSchema.parse(new Error("generic")); // ZodError
```

---

## z.custom()

```typescript
const positiveNumber = z.custom<number>((val) => {
  return typeof val === "number" && val > 0;
}, { error: "Must be a positive number" });
```

---

**See Also**:
- [Basic Types](02-basic-types.md)
- [Objects & Collections](03-objects-collections.md)
- [API Parsing](05-api-parsing.md)
- [Best Practices](07-best-practices.md)

**Version**: 4.x (^4.3.6) | **Source**: https://zod.dev/api
