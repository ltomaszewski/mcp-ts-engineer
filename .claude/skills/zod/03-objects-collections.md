# Zod: Objects & Collections

**Complex Data Structures, Composition, and Unions**

---

## z.object()

**Source**: https://zod.dev/docs/api#objects

### Basic Usage

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
});

type User = z.infer<typeof userSchema>;
// { id: number; name: string; email: string }

userSchema.parse({
  id: 1,
  name: "John",
  email: "john@example.com",
}); // ✓
```

### Property Modifiers

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  nickname: z.string().optional(),           // undefined allowed
  deletedAt: z.date().nullable(),            // null allowed
  role: z.enum(["user", "admin"]).default("user"), // default value
  createdAt: z.date().default(() => new Date()),
});

type User = z.infer<typeof userSchema>;
// {
//   id: number;
//   name: string;
//   nickname?: string;
//   deletedAt: Date | null;
//   role: "user" | "admin";
//   createdAt: Date;
// }
```

### Object Composition

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
  password: z.string(),
});

// .pick() - Select properties
const publicUserSchema = userSchema.pick({
  id: true,
  name: true,
  email: true,
});

// .omit() - Exclude properties
const safeUserSchema = userSchema.omit({
  password: true,
});

// .extend() - Add properties
const extendedUserSchema = userSchema.extend({
  age: z.number().optional(),
  createdAt: z.date(),
});

// .merge() - Combine schemas
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
});

const userWithAddressSchema = userSchema.merge(addressSchema);

// .partial() - Make all optional
const partialUserSchema = userSchema.partial();

// .required() - Make all required
const strictUserSchema = userSchema.required();
```

---

## z.array()

**Source**: https://zod.dev/docs/api#arrays

```typescript
// Basic array
const stringArraySchema = z.array(z.string());

stringArraySchema.parse(["a", "b", "c"]); // ✓

// Array with constraints
const tagsSchema = z.array(z.string())
  .min(1, "At least one tag")
  .max(10, "At most 10 tags")
  .nonempty();

// Nested arrays
const matrixSchema = z.array(z.array(z.number()));

matrixSchema.parse([
  [1, 2, 3],
  [4, 5, 6],
]); // ✓

// Array of objects
const usersSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
}));
```

---

## z.tuple()

Fixed-length arrays with specific types per position:

```typescript
// [x, y] coordinate
const coordinateSchema = z.tuple([
  z.number(),
  z.number(),
]);

coordinateSchema.parse([10, 20]); // ✓
coordinateSchema.parse([10, "20"]); // ✗ ZodError

// Tuple with rest elements
const fileSchema = z.tuple([
  z.string(),           // filename
  z.number(),          // size
  z.boolean(),         // public
]).rest(z.string());   // ...tags

fileSchema.parse([
  "document.pdf",
  1024,
  true,
  "important",
  "archive",
]); // ✓

type FileMetadata = z.infer<typeof fileSchema>;
// [string, number, boolean, ...string[]]
```

---

## z.record()

Key-value validation:

```typescript
// Arbitrary string keys, string values
const configSchema = z.record(z.string());

configSchema.parse({
  apiKey: "secret",
  dbUrl: "postgres://...",
  port: "5432",
}); // ✓

// Enum keys
const colorMapSchema = z.record(
  z.enum(["red", "green", "blue"]),
  z.string()
);

colorMapSchema.parse({
  red: "#FF0000",
  green: "#00FF00",
  blue: "#0000FF",
}); // ✓

// UUID keys to user objects
const userDatabaseSchema = z.record(
  z.string().uuid(),
  z.object({
    name: z.string(),
    email: z.string().email(),
  })
);
```

---

## z.map() and z.set()

```typescript
const stringMapSchema = z.map(z.string(), z.number());

const map = new Map([
  ["a", 1],
  ["b", 2],
]);

stringMapSchema.parse(map); // ✓

const stringSetSchema = z.set(z.string())
  .min(1, "At least one item")
  .max(10, "At most 10 items");

stringSetSchema.parse(new Set(["react", "typescript"])); // ✓
```

---

## Discriminated Unions

Type-safe union validation using discriminator field:

```typescript
const circleSchema = z.object({
  type: z.literal("circle"),
  radius: z.number().positive(),
});

const squareSchema = z.object({
  type: z.literal("square"),
  sideLength: z.number().positive(),
});

const shapeSchema = z.discriminatedUnion("type", [
  circleSchema,
  squareSchema,
]);

type Shape = z.infer<typeof shapeSchema>;
// { type: "circle"; radius: number } | { type: "square"; sideLength: number }

shapeSchema.parse({ type: "circle", sideLength: 5 }); // ✗ ZodError

// API response example
const successSchema = z.object({
  status: z.literal("success"),
  data: z.any(),
});

const errorSchema = z.object({
  status: z.literal("error"),
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

const apiResponseSchema = z.discriminatedUnion("status", [
  successSchema,
  errorSchema,
]);

const response = apiResponseSchema.parse(apiData);

if (response.status === "success") {
  console.log(response.data); // ✓ Type-safe
} else {
  console.log(response.error.code); // ✓ Type-safe
}
```

---

**See Also**:
- [Core Concepts](01-core-concepts.md) — Foundations
- [Basic Types](02-basic-types.md) — Primitive validators
- [Advanced Features](04-advanced-features.md) — Custom validation and composition
- [API Parsing](05-api-parsing.md) — Error handling

**Source**: https://zod.dev/docs/api
