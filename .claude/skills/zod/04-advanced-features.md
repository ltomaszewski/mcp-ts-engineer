# Zod: Advanced Features

**Custom Validation, Transformations, and Recursive Types**

---

## .refine() - Custom Validation

**Source**: https://zod.dev/docs/api#refine

```typescript
// Simple refinement
const passwordSchema = z.string()
  .min(8)
  .refine(
    (password) => /[A-Z]/.test(password),
    { message: "Password must contain uppercase letter" }
  );

// Multiple field validation
const userSchema = z.object({
  email: z.string().email(),
  confirmEmail: z.string(),
}).refine(
  (data) => data.email === data.confirmEmail,
  {
    message: "Emails don't match",
    path: ["confirmEmail"],
  }
);

userSchema.parse({
  email: "user@example.com",
  confirmEmail: "different@example.com",
}); // ✗ ZodError at confirmEmail field

// Async refinement (database uniqueness)
const usernameSchema = z.string()
  .min(3)
  .refine(
    async (username) => {
      const existing = await db.users.findOne({ username });
      return !existing;
    },
    { message: "Username already taken" }
  );

// Must use async parsing for async refinements
const result = await usernameSchema.safeParseAsync("john_doe");
```

---

## .superRefine() - Fine-Grained Errors

```typescript
const formSchema = z.object({
  accountType: z.enum(["personal", "business"]),
  businessName: z.string().optional(),
  businessTaxId: z.string().optional(),
  personalPhone: z.string().optional(),
}).superRefine((data, ctx) => {
  if (data.accountType === "business") {
    if (!data.businessName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessName"],
        message: "Business name required",
      });
    }
    if (!data.businessTaxId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["businessTaxId"],
        message: "Tax ID required",
      });
    }
  }

  if (data.accountType === "personal") {
    if (!data.personalPhone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["personalPhone"],
        message: "Phone required",
      });
    }
  }
});

// Returns all validation errors at once
const result = formSchema.safeParse({
  accountType: "business",
  // Missing businessName and businessTaxId
});
```

---

## .transform() - Type Transformation

**Source**: https://zod.dev/docs/api#transform

```typescript
// String to number
const numberSchema = z.string()
  .transform((val) => Number(val));

numberSchema.parse("42"); // 42 (number)

type Input = z.input<typeof numberSchema>;   // string
type Output = z.output<typeof numberSchema>; // number

// Date parsing
const dateSchema = z.string()
  .transform((val) => new Date(val));

dateSchema.parse("2024-12-25"); // Date object

// Object transformation
const userSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
}).transform((data) => ({
  ...data,
  fullName: `${data.firstName} ${data.lastName}`,
}));

userSchema.parse({
  firstName: "John",
  lastName: "Doe",
}); // { firstName: "John", lastName: "Doe", fullName: "John Doe" }

// Chained transformations
const processedSchema = z.string()
  .trim()
  .toLowerCase()
  .transform((val) => val.split(" "))
  .transform((words) => words.map(w => w.charAt(0).toUpperCase() + w.slice(1)))
  .transform((words) => words.join(" "));

processedSchema.parse("  hello   world  "); // "Hello World"
```

---

## .preprocess() - Transform Before Validation

Transform input BEFORE validation:

```typescript
// Coerce string to number, then validate
const numberSchema = z.preprocess(
  (val) => Number(val),
  z.number().positive()
);

numberSchema.parse("42"); // ✓ 42
numberSchema.parse("0");  // ✗ ZodError

// Form input handling (all strings)
const formSchema = z.object({
  age: z.preprocess(Number, z.number().int().positive()),
  acceptTerms: z.preprocess(
    (val) => val === "on" || val === "true",
    z.boolean()
  ),
  tags: z.preprocess(
    (val) => typeof val === "string" ? val.split(",") : val,
    z.array(z.string())
  ),
});

formSchema.parse({
  age: "25",
  acceptTerms: "on",
  tags: "react,typescript,zod",
});
```

---

## Schema Composition

```typescript
// .and() - Both must pass
const stringOrNumberSchema = z.string().or(z.number());

// .merge() - Combine schemas
const authSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const profileSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

const userSchema = authSchema.merge(profileSchema);

// Default values
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  role: z.enum(["user", "admin"]).default("user"),
  createdAt: z.date().default(() => new Date()),
});
```

---

## Branding - Opaque Types

```typescript
const emailSchema = z.string().email().brand<"Email">();

type Email = z.infer<typeof emailSchema>;

const userEmail: Email = emailSchema.parse("user@example.com");
const regularString: string = "user@example.com";

function sendEmail(to: Email) {
  // ...
}

sendEmail(userEmail);       // ✓
sendEmail(regularString);   // ✗ TypeScript error
```

---

## Lazy Evaluation for Recursive Types

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

**See Also**:
- [Basic Types](02-basic-types.md) — Primitive validators
- [Objects & Collections](03-objects-collections.md) — Complex structures
- [API Parsing](05-api-parsing.md) — Error handling with advanced features
- [Best Practices](07-best-practices.md) — Performance optimization

**Source**: https://zod.dev/docs/api
