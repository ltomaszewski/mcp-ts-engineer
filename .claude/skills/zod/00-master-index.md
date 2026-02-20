# Zod: Modular Knowledge Base

**Master Index & Navigation Hub**

This modular knowledge base is designed for LLM context window efficiency. Use this index to navigate to specific modules relevant to your task.

---

## 📋 Quick Navigation

### Core Framework & Setup (Start Here)
- **[01-core-concepts.md](01-core-concepts.md)** — What Zod is, the problems it solves, key benefits, core patterns (immutability, type inference, parse vs safeParse), and validation workflows.

- **[02-basic-types.md](02-basic-types.md)** — Primitive validators: z.string(), z.number(), z.boolean(), z.date(), z.bigint(), coercion, and common validation stacks for email/password/username.

### API & Type Reference
- **[03-objects-collections.md](03-objects-collections.md)** — Complex data structures: z.object(), property modifiers, composition, z.array(), z.tuple(), z.record(), z.map(), z.set(), and discriminated unions.

- **[04-advanced-features.md](04-advanced-features.md)** — Custom validation: .refine(), .superRefine(), .transform(), .preprocess(), schema composition, branding, and lazy evaluation for recursive types.

- **[05-api-parsing.md](05-api-parsing.md)** — Parsing methods (.parse(), .safeParse(), .parseAsync(), .safeParseAsync()), ZodError structure, error handling patterns, and type guards.

### Integration & Patterns
- **[06-integration-patterns.md](06-integration-patterns.md)** — Framework integration: React Hook Form, Express middleware, tRPC procedures, Next.js Server Actions, and monorepo schema sharing patterns.

### Best Practices & Production
- **[07-best-practices.md](07-best-practices.md)** — Performance optimization, security guidelines, error handling patterns, common pitfalls, and production checklist.

---

## 🎯 Quick Reference by Use Case

### "I'm new to Zod"
1. Start with **01-core-concepts.md**
2. Follow **02-basic-types.md**
3. Explore **03-objects-collections.md**

### "I need to validate form data"
→ **02-basic-types.md** (primitives)
→ **03-objects-collections.md** (objects)
→ **06-integration-patterns.md** (React Hook Form)

### "I need to validate API input/output"
→ **05-api-parsing.md** (parsing methods)
→ **03-objects-collections.md** (structure validation)
→ **07-best-practices.md** (security)

### "I need custom validation logic"
→ **04-advanced-features.md** (refine, superRefine)
→ **07-best-practices.md** (error handling)

### "I need to handle validation errors"
→ **05-api-parsing.md** (ZodError structure)
→ **07-best-practices.md** (error patterns)

### "I'm building a full-stack app"
→ **01-core-concepts.md** (foundations)
→ **03-objects-collections.md** (schemas)
→ **06-integration-patterns.md** (all frameworks)
→ **07-best-practices.md** (production)

---

## 📊 Module Dependency Graph

```
01-core-concepts (Foundation)
  ├→ 02-basic-types (Primitives)
  │   ├→ 03-objects-collections (Complex Structures)
  │   │   ├→ 04-advanced-features (Custom Validation)
  │   │   ├→ 05-api-parsing (Error Handling)
  │   │   └→ 06-integration-patterns (Framework Integration)
  │   │
  │   └→ 07-best-practices (Production Patterns)
  │       ├→ Performance Optimization
  │       ├→ Security Guidelines
  │       └→ Common Pitfalls
```

---

## 📝 Content Schema Explanation

Each module follows a consistent structure:

### Core Concept Modules (01)
- **What is Zod?** — Problem statement and benefits
- **Installation & Setup** — Getting started
- **Core Patterns** — Immutability, type inference, parse methods
- **Validation Workflow** — End-to-end example

### API Reference Modules (02, 03, 04, 05)
- **Overview** — What problem does this API solve?
- **Installation** — Required packages
- **Core Methods** — Each includes:
  - Description
  - Typed Parameters (table format)
  - Return Values & Types
  - Working Code Examples
  - Source URL (for official docs)
- **Common Patterns** — Real-world scenarios
- **Best Practices** — Performance and security guidance

### Integration Modules (06)
- **Framework Introduction** — What it is and why to use it
- **Setup & Installation** — Step-by-step guide
- **Complete Examples** — Production-ready patterns
- **Best Practices** — Do's & Don'ts

### Best Practices Module (07)
- **Principle** — Core concept
- **Do's & Don'ts** — Clear guidance
- **Code Examples** — Good vs. bad patterns
- **Performance Impact** — When and why it matters

---

## 🔗 Cross-References

Throughout each module, you'll find references like:
- **See: [Module Name](path)** — Links to related content
- **Cross-ref: [Concept](path#heading)** — Specific section reference
- **Prerequisite: [Module Name](path)** — Required reading before this module

---

## 📚 Source Attribution

All information is sourced directly from:
- **Official Docs**: https://zod.dev/
- **Latest Version**: Zod 4.x (Stable)
- **Date**: December 2025

Every API method includes a direct link to its official documentation for verification.

---

## 🚀 How to Use This Knowledge Base

### For Development Teams
1. **Onboarding**: Direct new developers to 01 → 02 → 03
2. **Reference**: Use specific modules (e.g., 05, 06) as needed
3. **Best Practices**: Review 07 for production patterns

### For LLM/RAG Integration
1. **Load modules selectively** based on query intent
2. **Each module is self-contained** with minimal external dependencies
3. **Use cross-references** to pull related context as needed
4. **Modules are chunked for token efficiency** (target: 2000-3500 tokens each)

### For Documentation Searches
- Use the quick reference section to find your use case
- Each module title clearly states its scope
- Within modules, use ## and ### headings for section navigation

---

**Last Updated**: December 2025
**Zod Version**: 4.x (Stable)
**Maintainer**: RAG Knowledge Base
**License**: Based on Official Zod Documentation (https://zod.dev/)
