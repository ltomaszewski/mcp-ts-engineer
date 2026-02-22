# Zod v4 Skill -- Knowledge Base Summary

**Status**: Complete -- 9 files (1 SKILL.md + 1 index + 7 modules)

---

## File Inventory

| File | Purpose | Key Topics |
|------|---------|------------|
| SKILL.md | Entry point, quick reference | Rules, patterns, anti-patterns, migration notes |
| 00-master-index.md | Navigation hub | Use-case routing, dependency graph |
| 01-core-concepts.md | Foundations | Installation, all schema types, inference, parse/safeParse |
| 02-basic-types.md | Primitive validators | String, number, boolean, date, bigint, file, coercion, top-level validators |
| 03-objects-collections.md | Complex structures | Object composition, arrays, tuples, records, unions, enums |
| 04-advanced-features.md | Custom validation | Refine, superRefine, transform, pipe, brand, readonly, recursive, function, registry |
| 05-api-parsing.md | Error handling | Parse methods, ZodError, treeifyError, prettifyError, error migration |
| 06-integration-patterns.md | Framework integration | React Hook Form, Express, tRPC, Next.js, JSON Schema, monorepo, Zod Mini |
| 07-best-practices.md | Production patterns | Performance, security, v4 migration checklist, pitfalls |

---

## Authoritative Version

- **Zod**: 4.x (^4.3.6)
- **TypeScript**: ^5.5+
- **Source**: https://zod.dev/

---

## Key v4 Changes Documented

- `{ error }` replaces `{ message }` parameter
- `.format()`/`.flatten()` removed; use `z.treeifyError()`/`z.prettifyError()`
- `.merge()` deprecated; use `.extend()` with spread
- `.strict()`/`.passthrough()` deprecated; use `z.strictObject()`/`z.looseObject()`
- `z.nativeEnum()` deprecated; `z.enum()` handles TS enums
- `z.function()` completely redesigned
- `z.record()` requires both key and value schemas
- `ctx.addIssue()` removed; mutate `ctx.issues` array
- `.default()` applies to output type; `.prefault()` for input type
- New: `z.file()`, `z.stringbool()`, `z.templateLiteral()`, `z.xor()`, `z.partialRecord()`, `z.looseRecord()`, `z.codec()`, `z.registry()`
- New: getter syntax for recursive types, `z.toJSONSchema()`, `z.fromJSONSchema()`, `z.meta()`
- New top-level validators: `z.uuidv4()`, `z.uuidv7()`, `z.guid()`, `z.httpUrl()`, `z.hostname()`, `z.mac()`, `z.hex()`, `z.cuid()`
- 4.3.x: `.pick()`/`.omit()` on refined schemas now throws; strict object intersections relaxed

---

**Last Updated**: February 2026
