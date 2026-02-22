# Zod v4: Modular Knowledge Base

**Master Index & Navigation Hub**

---

## Quick Navigation

### Core Framework
- **[01-core-concepts.md](01-core-concepts.md)** -- What Zod is, problems it solves, installation, all schema types, type inference, parse vs safeParse
- **[02-basic-types.md](02-basic-types.md)** -- Primitives: z.string(), z.number(), z.boolean(), z.date(), z.bigint(), z.file(), coercion, top-level validators, validation stacks

### API & Type Reference
- **[03-objects-collections.md](03-objects-collections.md)** -- z.object() with composition (pick/omit/extend/partial/required/keyof), z.strictObject(), z.looseObject(), z.array(), z.tuple(), z.record(), z.partialRecord(), z.map(), z.set(), z.discriminatedUnion(), z.xor(), z.enum()
- **[04-advanced-features.md](04-advanced-features.md)** -- .refine(), .superRefine(), .transform(), .pipe(), .preprocess(), codecs, .brand(), .readonly(), z.function(), z.lazy(), recursive types (getter syntax), z.templateLiteral(), z.registry(), z.custom(), z.instanceof()
- **[05-api-parsing.md](05-api-parsing.md)** -- .parse(), .safeParse(), .parseAsync(), .safeParseAsync(), ZodError structure, z.treeifyError(), z.prettifyError(), z.locales, error migration cheat sheet

### Integration & Patterns
- **[06-integration-patterns.md](06-integration-patterns.md)** -- React Hook Form, Express middleware, tRPC, Next.js Server Actions, JSON Schema conversion, monorepo schema sharing, Zod Mini
- **[07-best-practices.md](07-best-practices.md)** -- Performance optimization, security guidelines, error handling, v4 migration checklist, common pitfalls, production checklist

---

## Quick Reference by Use Case

### "I need to validate form data"
1. [02-basic-types.md](02-basic-types.md) (primitives, validation stacks)
2. [03-objects-collections.md](03-objects-collections.md) (object schemas)
3. [06-integration-patterns.md](06-integration-patterns.md) (React Hook Form)

### "I need to validate API input/output"
1. [05-api-parsing.md](05-api-parsing.md) (parsing methods)
2. [03-objects-collections.md](03-objects-collections.md) (structure validation)
3. [07-best-practices.md](07-best-practices.md) (security)

### "I need custom validation logic"
1. [04-advanced-features.md](04-advanced-features.md) (refine, superRefine, transform)

### "I need to handle validation errors"
1. [05-api-parsing.md](05-api-parsing.md) (ZodError, treeifyError, prettifyError)

### "I'm migrating from v3 to v4"
1. [07-best-practices.md](07-best-practices.md) (full migration checklist)

---

## Module Dependency Graph

```
01-core-concepts (Foundation)
  +-- 02-basic-types (Primitives)
  |     +-- 03-objects-collections (Complex Structures)
  |     |     +-- 04-advanced-features (Custom Validation)
  |     |     +-- 05-api-parsing (Error Handling)
  |     |     +-- 06-integration-patterns (Frameworks)
  |     +-- 07-best-practices (Production Patterns)
```

---

**Version**: Zod 4.x (^4.3.6) | **Source**: https://zod.dev/
