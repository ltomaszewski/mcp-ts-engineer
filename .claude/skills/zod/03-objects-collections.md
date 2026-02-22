# Zod: Objects & Collections

**Complex Data Structures, Composition, and Unions**

---

## z.object()

**Source**: https://zod.dev/api#objects

### Basic Usage

```typescript
import { z } from "zod";

const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
});

type User = z.infer<typeof userSchema>;
// { id: number; name: string; email: string }
```

### Property Modifiers

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
  nickname: z.string().optional(),           // undefined allowed
  deletedAt: z.date().nullable(),            // null allowed
  bio: z.string().nullish(),                 // null | undefined allowed
  role: z.enum(["user", "admin"]).default("user"), // default value (output type)
  createdAt: z.date().default(() => new Date()),
});

type User = z.infer<typeof userSchema>;
```

**v4 `.default()` behavior**: Default value now short-circuits and applies to the **output** type. Use `.prefault()` for input-type defaults.

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
const safeUserSchema = userSchema.omit({ password: true });

// .extend() - Add properties (PREFERRED, replaces removed .merge())
const extendedUserSchema = userSchema.extend({
  age: z.number().optional(),
  createdAt: z.date(),
});

// .safeExtend() - Extend without overriding existing keys (v4)
const saferSchema = userSchema.safeExtend({
  age: z.number().optional(),
});

// v4.3+: .pick()/.omit() on schemas with refinements throws Error
// (previously silently dropped the refinements)
// const refined = userSchema.refine(...)
// refined.pick({...}) // Error! Use .extend() or restructure

// .partial() - Make all optional
const partialUserSchema = userSchema.partial();

// .required() - Make all required
const strictUserSchema = userSchema.required();

// .keyof() - Get union of keys
const userKeys = userSchema.keyof();
// z.enum(["id", "name", "email", "password"])

// .shape - Access raw shape
const { email: emailSchema } = userSchema.shape;
```

### v4 Object Variants

```typescript
// z.strictObject() - Rejects unknown keys (replaces .strict())
const strictUser = z.strictObject({
  id: z.number(),
  name: z.string(),
});
strictUser.parse({ id: 1, name: "John", extra: true }); // ZodError

// z.looseObject() - Passes through unknown keys (replaces .passthrough())
const looseUser = z.looseObject({
  id: z.number(),
  name: z.string(),
});
looseUser.parse({ id: 1, name: "John", extra: true });
// { id: 1, name: "John", extra: true }

// .catchall() - Validate unknown keys against a schema
const withCatchall = z.object({
  id: z.number(),
}).catchall(z.string());
```

### Combining Objects (v4)

```typescript
// .merge() is DEPRECATED in v4. Use .extend() with spread:
const addressSchema = z.object({
  street: z.string(),
  city: z.string(),
});

const userWithAddressSchema = userSchema.extend({
  ...addressSchema.shape,
});

// Or use spread in z.object():
const combined = z.object({
  ...userSchema.shape,
  ...addressSchema.shape,
});
```

### Schema Metadata (v4)

```typescript
const userSchema = z.object({
  id: z.number(),
  name: z.string(),
}).meta({ title: "User", description: "A user object" });

// Convert to JSON Schema
const jsonSchema = z.toJSONSchema(userSchema);
```

---

## z.array()

**Source**: https://zod.dev/api#arrays

```typescript
const stringArraySchema = z.array(z.string());
stringArraySchema.parse(["a", "b", "c"]); // ok

// Array with constraints
const tagsSchema = z.array(z.string())
  .min(1, { error: "At least one tag" })
  .max(10, { error: "At most 10 tags" });

// Nested arrays
const matrixSchema = z.array(z.array(z.number()));

// Array of objects
const usersSchema = z.array(z.object({
  id: z.number(),
  name: z.string(),
  email: z.email(),
}));

// .unwrap() - Get element schema
const elementSchema = stringArraySchema.unwrap(); // z.string()
```

---

## z.tuple()

Fixed-length arrays with specific types per position:

```typescript
const coordinateSchema = z.tuple([z.number(), z.number()]);
coordinateSchema.parse([10, 20]); // ok

// Tuple with rest elements
const fileSchema = z.tuple([
  z.string(),           // filename
  z.number(),           // size
  z.boolean(),          // public
]).rest(z.string());    // ...tags

type FileMetadata = z.infer<typeof fileSchema>;
// [string, number, boolean, ...string[]]
```

---

## z.record()

Key-value validation. **v4 requires both key and value schemas**.

```typescript
// v4: Both key and value schemas required
const configSchema = z.record(z.string(), z.string());

// Enum keys (v4: exhaustive -- must have all keys)
const colorMapSchema = z.record(
  z.enum(["red", "green", "blue"]),
  z.string(),
);
// Must include ALL enum values

// z.partialRecord() - Enum keys are optional (v4)
const optionalColorMap = z.partialRecord(
  z.enum(["red", "green", "blue"]),
  z.string(),
);
// Keys are optional

// z.looseRecord() - Passes through non-matching keys (v4)
const looseConfig = z.looseRecord(z.string(), z.number());
```

---

## z.map() and z.set()

```typescript
const stringMapSchema = z.map(z.string(), z.number());
const map = new Map([["a", 1], ["b", 2]]);
stringMapSchema.parse(map); // ok

const stringSetSchema = z.set(z.string())
  .min(1, { error: "At least one item" })
  .max(10, { error: "At most 10 items" });

stringSetSchema.parse(new Set(["react", "typescript"])); // ok
```

---

## z.union() and z.xor()

```typescript
// z.union() - At least one must match
const stringOrNumber = z.union([z.string(), z.number()]);

// z.xor() - Exactly one must match (v4)
const exclusiveUnion = z.xor([z.string(), z.number()]);
```

---

## z.discriminatedUnion()

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

// API response pattern
const apiResponseSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("success"), data: z.any() }),
  z.object({
    status: z.literal("error"),
    error: z.object({ code: z.string(), message: z.string() }),
  }),
]);
```

---

## z.intersection()

```typescript
const nameSchema = z.object({ name: z.string() });
const ageSchema = z.object({ age: z.number() });

const personSchema = z.intersection(nameSchema, ageSchema);
type Person = z.infer<typeof personSchema>;
// { name: string; age: number }

// v4 change: merge conflicts throw Error (not ZodError)
// v4.3.2+: strict object intersections only reject keys
// unrecognized by BOTH sides (not either side)
```

---

## z.enum() with TypeScript Enums (v4)

In v4, `z.nativeEnum()` is deprecated. Use `z.enum()` directly:

```typescript
// TypeScript enum
enum Role {
  Admin = "admin",
  User = "user",
  Guest = "guest",
}

// v4: z.enum() handles TS enums directly
const roleSchema = z.enum(Role);
roleSchema.parse(Role.Admin); // ok
roleSchema.parse("admin");    // ok

// String enum (unchanged)
const statusSchema = z.enum(["active", "inactive", "pending"]);

// Access enum values (v4: .enum property only, .Enum/.Values removed)
statusSchema.enum.active; // "active"
```

---

**See Also**:
- [Basic Types](02-basic-types.md)
- [Advanced Features](04-advanced-features.md)
- [API Parsing](05-api-parsing.md)

**Version**: 4.x (^4.3.6) | **Source**: https://zod.dev/api
