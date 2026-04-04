# React Hook Form - Master Index & Navigation Hub

**Status:** ✅ Complete modular knowledge base with 11 self-contained modules

**Version:** 7.72.1 | **Framework:** React Hook Form | **Updated:** April 2026

---

## Module Directory (Quick Links)

### Phase 1: Core Modules (Complete)

1. **01-setup-installation.md** — Installation across frameworks (Next.js, Vite, CRA, Remix) + TypeScript setup
2. **02-api-useform.md** — Complete useForm hook reference with all options and return values
3. **03-api-register.md** — Field registration API, inline validation rules, Controller component
4. **04-api-advanced-methods.md** — Advanced methods (watch, getValues, setValue, reset, trigger, useFieldArray, etc.)
5. **05-validation-rules.md** — Built-in validation rules with examples and patterns
6. **06-validation-schemas.md** — Schema-based validation (Yup, Zod, AJV) with integrations
7. **07-custom-hooks-context.md** — Custom hooks (useController, useFormContext) and FormProvider pattern
8. **08-patterns-implementation.md** — Real-world patterns (multi-step, conditional, auto-save, dynamic fields)
9. **09-best-practices.md** — Performance optimization, re-render prevention, memory management
10. **10-troubleshooting-faq.md** — Common issues and solutions with debugging strategies
11. **11-security-testing.md** — Security best practices and testing patterns

---

## Use Case Navigation

### "I'm starting from scratch"
**Path:** 01 → 02 → 03 → 05 → 08

1. Setup your project (01)
2. Learn the useForm hook (02)
3. Register your first fields (03)
4. Add validation with rules (05)
5. Build your form following a pattern (08)

**Time:** ~2-3 hours | **Outcome:** First working form

---

### "I need to build a specific form type"
**Choose your form type:**

#### Simple Login/Contact Form
**Path:** 01 → 02 → 03 → 05

#### Complex Form with UI Library
**Path:** 01 → 02 → 03 → 07 (Controller) → 09 (Performance)

#### Multi-Step/Wizard Form
**Path:** 02 → 04 → 08 (Patterns)

#### Form with Dynamic Fields
**Path:** 02 → 03 → 04 (useFieldArray) → 08 (Patterns)

#### Schema-Validated Form
**Path:** 02 → 06 (Schemas) → 08 (Patterns)

---

### "I'm getting an error or something doesn't work"
**Path:** 10 (Troubleshooting) → [Specific module based on error]

Start with troubleshooting guide, find your issue, then reference the specific module.

---

### "I want production-ready, optimized code"
**Path:** 09 (Best Practices) → Review all modules for anti-patterns

---

## Module Purposes & Content Overview

| Module | Key Concepts | Includes | Typical Length |
|--------|---|---|---|
| **01** | Installation, framework setup, TypeScript | 4 framework setups, config examples | 800-1000 tokens |
| **02** | useForm options, return values, modes | mode types, defaultValues, resolver, all options | 1000-1200 tokens |
| **03** | Field registration, inline rules | register API, validation rules, Controller | 1000-1200 tokens |
| **04** | Advanced state management | watch, getValues, setValue, reset, trigger, useFieldArray | 1200-1400 tokens |
| **05** | Field-level validation | 11 built-in rules with examples | 800-1000 tokens |
| **06** | Schema validation integration | Yup, Zod, AJV setup and patterns | 900-1100 tokens |
| **07** | Context & composition | useController, useFormContext, FormProvider | 900-1100 tokens |
| **08** | Real-world patterns | 4 patterns: multi-step, conditional, auto-save, dynamic | 1200-1400 tokens |
| **09** | Performance & best practices | Watch optimization, large forms, general do's/don'ts | 1000-1200 tokens |
| **10** | Troubleshooting & FAQ | 8-10 common issues, Q&A format | 900-1100 tokens |
| **11** | Security & testing | Sanitization, CSRF, React Testing Library | 800-1000 tokens |

**Total Content:** ~11,000 words across 11 modules

---

## Cross-Module Reference Map

### When learning about... look also at:

**Form Setup** → 01, 02
- Understand configuration (02) before choosing validation approach
- Framework-specific concerns in (01)

**Validation** → 05, 06, 03
- Inline rules in 05 and 03
- Schema-based in 06
- Choose approach based on complexity

**Advanced State** → 04, 09
- Advanced methods in 04
- Performance implications in 09

**UI Library Integration** → 03 (Controller), 07
- Controller API in 03
- Context patterns in 07

**Real Forms** → 08, 09
- Patterns in 08
- Optimize using 09

**Debugging** → 10, then other modules
- Troubleshooting guide entry point
- Cross-references to specific solutions

---

## Concept Hierarchy

```
React Hook Form Knowledge Base
│
├─ Foundations (must read first)
│  ├─ 01: Installation & Setup
│  └─ 02: useForm Hook
│
├─ Field Management
│  ├─ 03: register() API
│  ├─ 04: Advanced Methods
│  └─ 07: useController & Context
│
├─ Validation (choose ONE primary path)
│  ├─ Path A: Inline
│  │  └─ 05: Validation Rules
│  └─ Path B: Schema-Based
│     └─ 06: Validation Schemas
│
├─ Practical Implementation
│  ├─ 08: Patterns & Real-World Examples
│  └─ 09: Best Practices & Performance
│
└─ Quality & Reliability
   ├─ 10: Troubleshooting
   └─ 11: Security & Testing
```

---

## Learning Paths by Experience Level

### 👶 Beginner (New to React Hook Form)
**Duration:** 4-6 hours | **Modules:** 01, 02, 03, 05, 08 (simple pattern)

1. Install and setup (01)
2. Understand useForm (02)
3. Learn register and basic validation (03, 05)
4. Build first form from pattern (08)
5. Reference as needed

### 👨‍💻 Intermediate (Some experience, want to ship)
**Duration:** 2-3 hours | **Modules:** 02, 03, 05, 08

1. Quick setup (01 reference)
2. Review useForm options (02)
3. Understand register API (03)
4. Pick validation approach (05 or 06)
5. Find matching pattern (08)

### 🎯 Advanced (Complex forms, need performance)
**Duration:** 6-8 hours | **All modules**

1. Master all core APIs (02-04)
2. Understand both validation approaches (05-06)
3. Learn composition patterns (07-08)
4. Optimize forms (09)
5. Understand security implications (11)

### 🔐 Expert (Production systems, large codebases)
**Duration:** 8+ hours | **All modules + external resources**

Read all modules, study all examples, practice patterns from 08, optimize using 09, secure using 11, test using 11.

---

## Topic Index (By Keywords)

### Fields & Registration
- **register()** → 03
- **Controller** → 03, 07
- **useController** → 07
- **Field arrays** → 04
- **Dynamic fields** → 08

### Validation
- **Built-in rules** → 05
- **Custom validators** → 05
- **Schema-based** → 06
- **Yup** → 06
- **Zod** → 06
- **AJV** → 06

### State Management
- **watch()** → 04
- **useWatch()** → 04
- **getValues()** → 04
- **setValue()** → 04
- **reset()** → 04
- **trigger()** → 04

### Forms
- **Multi-step** → 08
- **Conditional fields** → 08
- **Auto-save** → 08
- **Dynamic arrays** → 08
- **Large forms** → 09

### Best Practices
- **Performance** → 09
- **Re-render prevention** → 09
- **Memory** → 09
- **TypeScript** → 01, 02
- **Testing** → 11
- **Security** → 11

### Troubleshooting
- **Values not updating** → 10, 04
- **Validation not running** → 10, 05, 06
- **useFieldArray issues** → 10, 04
- **Controller problems** → 10, 03, 07
- **Type errors** → 10, 01, 02, 06

---

## Dependency Graph

```
01: Setup
    ↓
02: useForm (foundational)
    ├─ 03: register (depends on 02)
    │   ├─ 05: Inline validation (depends on 03)
    │   └─ 07: Controller (depends on 02, 03)
    │
    ├─ 04: Advanced methods (depends on 02, 03)
    │   └─ 08: Patterns (depends on all core)
    │
    └─ 06: Schema validation (depends on 02)
        └─ 08: Patterns (depends on all core)

09: Best practices (overlays on 02-04)
10: Troubleshooting (references all)
11: Security & testing (references core modules)
```

---

## Module Content Schema

Each module follows this structure for consistency:

```
# Module Title

> One-line description

**Source:** [Official docs URL]

---

## Overview
Brief explanation of what this module covers

## Core Concepts / API Methods (whichever applies)

### Feature/Method Name
- **Description:** What it does
- **Parameters/Options:** Table of inputs
- **Return Value:** What it returns
- **Example Code:** Real usage
- **Source URL:** Official docs link

## Patterns / Best Practices / Common Issues
Practical guidance based on module content

## Cross-References
Links to related modules
```

---

## Quick Copy-Paste References

### Basic Form
```typescript
import { useForm } from 'react-hook-form';

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <input {...register('email', { required: 'Required' })} />
      {errors.email && <p>{errors.email.message}</p>}
      <button>Submit</button>
    </form>
  );
}
```
→ See: **03-api-register.md**, **02-api-useform.md**

### Schema-Validated Form
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({ email: z.string().email() });
type FormData = z.infer<typeof schema>;

export function MyForm() {
  const { register, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema)
  });

  return <form onSubmit={handleSubmit(data => console.log(data))}>{/* ... */}</form>;
}
```
→ See: **06-validation-schemas.md**

### Dynamic Fields
```typescript
import { useForm, useFieldArray } from 'react-hook-form';

export function MyForm() {
  const { control, register, handleSubmit } = useForm();
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      {fields.map((field, idx) => (
        <input key={field.id} {...register(`items.${idx}.name`)} />
      ))}
      <button type="button" onClick={() => append({ name: '' })}>Add</button>
    </form>
  );
}
```
→ See: **04-api-advanced-methods.md**, **08-patterns-implementation.md**

---

## Integration Points

### With Claude Code / LLM Context
- Load README.md for overview
- Load master index (this file) for navigation
- Load 1-3 specific modules based on query
- Use cross-references for deeper context

### With Vector Databases
- Each module is self-contained and searchable
- Module titles are clear and descriptive
- Consistent structure enables semantic chunking
- Cross-references enable RAG-style retrieval

### With Documentation Sites
- All modules are GitHub Flavored Markdown
- Compatible with standard markdown processors
- Each module stands alone but links to others
- Code examples have language-specific syntax highlighting

---

## Version & Support

| Aspect | Details |
|--------|---------|
| **Framework Version** | React Hook Form 7.72.1 |
| **React Version** | 16.8+ (hooks required) |
| **TypeScript** | 3.5+ (full support) |
| **Bundle Size** | ~8.5kb gzipped |
| **Last Updated** | April 2026 |
| **Status** | Production-ready ✅ |

---

## Navigation Quick Start

**Lost?** Follow this decision tree:

1. **Do you know React Hook Form?**
   - No → Start with module 01
   - Yes → Skip to step 2

2. **Do you need validation?**
   - Inline → Go to 05
   - Schema-based → Go to 06
   - Not sure → Read both (05, 06)

3. **Are you having a problem?**
   - Yes → Go to 10 (Troubleshooting)
   - No → Go to step 4

4. **What's your goal?**
   - Learn the API → Read modules 02-04
   - Build a form → Find pattern in 08
   - Optimize code → Go to 09
   - Secure + test → Go to 11

---

**Total Modules:** 11 | **Total Content:** ~12,000 words | **Token Count:** ~6,000 | **Generated:** April 2026
