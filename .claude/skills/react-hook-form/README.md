# React Hook Form 7.69.0 - Modular Knowledge Base

> Performant, flexible, and extensible forms with easy-to-use validation. LLM-optimized modular architecture for context efficiency.

**Source:** [https://react-hook-form.com](https://react-hook-form.com)

---

## Quick Overview

React Hook Form is a performant form state management library for React that:
- Minimizes re-renders by uncontrolled component approach
- Provides simple API for field registration and validation
- Supports schema-based validation (Yup, Zod, AJV, etc.)
- Works seamlessly with UI libraries via Controller component
- Handles complex scenarios: dynamic fields, multi-step forms, conditional fields
- Extremely small bundle size (~8.5kb gzipped)

**Installation:**
```bash
npm install react-hook-form
```

---

## Module Navigation Guide

This knowledge base is organized into self-contained modules optimized for LLM context windows. Each module is designed to be independently retrievable and includes cross-references for broader context.

### Core Modules

| Module | File | Purpose | Typical Use Case |
|--------|------|---------|------------------|
| **Setup & Installation** | `01-setup-installation.md` | Installation, framework setup, TypeScript configuration | Getting started across Next.js, Vite, CRA, Remix |
| **API Reference: useForm** | `02-api-useform.md` | useForm hook options, return values, configuration, mode settings | Creating and configuring forms, understanding hook API |
| **API Reference: register** | `03-api-register.md` | Field registration, built-in validation rules, value transformations | Registering fields, inline validation |
| **API Reference: Advanced Methods** | `04-api-advanced-methods.md` | watch, getValues, setValue, reset, trigger, setError, useWatch, resetField | Programmatic form control, advanced state management |
| **Validation: Rules & Patterns** | `05-validation-rules.md` | Built-in rules (required, min, max, pattern, validate), custom validators | Implementing field-level validation |
| **Validation: Schemas** | `06-validation-schemas.md` | Yup, Zod, AJV integration, schema-based validation, type inference | Using external validation libraries, schema-driven forms |
| **Custom Hooks & Context** | `07-custom-hooks-context.md` | useController, useFormContext, FormProvider, useFormState | Component composition, form context sharing |
| **Patterns & Implementation** | `08-patterns-implementation.md` | Multi-step forms, conditional fields, auto-save, dynamic arrays | Real-world form patterns and implementations |
| **Best Practices & Performance** | `09-best-practices.md` | Optimization strategies, re-render prevention, memory management | Performance tuning, scalable forms |
| **Troubleshooting & FAQ** | `10-troubleshooting-faq.md` | Common issues, debugging strategies, solutions | Solving common problems |
| **Security & Testing** | `11-security-testing.md` | Input sanitization, CSRF protection, testing patterns | Secure forms, testing with React Testing Library |

---

## How to Use This Knowledge Base

### For Implementation Tasks

1. **"I need to build a form NOW"** → Start with `01-setup-installation.md`, then `02-api-useform.md`, copy a pattern from `08-patterns-implementation.md`
2. **"How do I validate fields?"** → See `05-validation-rules.md` for inline rules or `06-validation-schemas.md` for schema-based
3. **"I need dynamic/complex forms"** → Go to `04-api-advanced-methods.md` and `08-patterns-implementation.md`
4. **"I'm using Material-UI/Chakra"** → Check `03-api-register.md` (Controller) and `07-custom-hooks-context.md`
5. **"Form not working, how do I debug?"** → See `10-troubleshooting-faq.md`

### For API Lookups

Each module contains:
- **Method/Feature Name** as heading
- **Description** of what it does
- **Parameters** table with types and descriptions
- **Return Values** specification
- **Code Example** showing real usage
- **Source URL** for official documentation verification

### For Troubleshooting

- **Values not updating?** → `02-api-useform.md` (defaultValues) + `04-api-advanced-methods.md` (setValue)
- **Validation not running?** → `05-validation-rules.md` and `06-validation-schemas.md`
- **Performance issues?** → `09-best-practices.md` (watch optimization)
- **useFieldArray problems?** → `04-api-advanced-methods.md` (useFieldArray section)
- **Controller with Material-UI?** → `03-api-register.md` (Controller component)
- **Type errors?** → `02-api-useform.md` (TypeScript section) + `06-validation-schemas.md`

---

## Core Concepts at a Glance

### Uncontrolled Components
React Hook Form embraces HTML's native uncontrolled component pattern:
- Fields are NOT fully controlled by React state
- Reduces re-renders significantly
- Accesses DOM directly for values (via refs)
- Better performance than controlled components

### Two Validation Approaches

**Inline Rules:**
```typescript
<input {...register('email', { required: 'Email required', pattern: {...} })} />
```

**Schema-Based (Recommended for complex forms):**
```typescript
const schema = yup.object({ email: yup.string().email() });
const { register } = useForm({ resolver: yupResolver(schema) });
```

### Three Key APIs

1. **register()** — Connect HTML inputs to form state
2. **handleSubmit()** — Wrapper for form submission with validation
3. **formState** — Read-only form metadata (errors, isDirty, isSubmitting, etc.)

---

## Best Practices Summary

✅ **DO:**
- Use selectors (useWatch) instead of watch() for performance
- Provide defaultValues to stabilize form behavior
- Type your forms with TypeScript interfaces
- Use schema-based validation for complex validation logic
- Debounce async validators to prevent excessive calls
- Use FormProvider + useFormContext for large forms
- Split forms into sections using FormProvider pattern
- Test forms with React Testing Library

❌ **DON'T:**
- Watch all fields unnecessarily (causes re-renders)
- Forget defaultValues (leads to uncontrolled behavior)
- Use disabled fields without understanding they're not submitted
- Mix register() and Controller carelessly
- Validate without setting correct mode (onSubmit, onChange, onBlur)
- Store entire form in state (use getValues instead)
- Forget to handle async validation errors

---

## Module Dependencies

```
01-setup-installation
├─ references: 02-api-useform (for hook options)
└─ references: 09-best-practices (TypeScript setup)

02-api-useform
├─ requires: None (foundational)
└─ referenced by: All other modules

03-api-register
├─ requires: 02-api-useform
└─ references: 05-validation-rules (for inline rules)

04-api-advanced-methods
├─ requires: 02-api-useform, 03-api-register
├─ references: 09-best-practices (watch optimization)
└─ referenced by: 08-patterns-implementation

05-validation-rules
├─ requires: 03-api-register
└─ references: 06-validation-schemas (for comparison)

06-validation-schemas
├─ requires: 02-api-useform, 05-validation-rules
└─ referenced by: 08-patterns-implementation

07-custom-hooks-context
├─ requires: 02-api-useform, 03-api-register
└─ references: 08-patterns-implementation (FormProvider pattern)

08-patterns-implementation
├─ requires: All previous modules
└─ references: Best practices from all modules

09-best-practices
├─ references: All modules
└─ critical for: Performance in all applications

10-troubleshooting-faq
├─ requires: Knowledge of all modules
└─ cross-references: Specific solutions from each module

11-security-testing
├─ requires: 02-api-useform, 03-api-register
└─ references: 06-validation-schemas (for input validation)
```

---

## Quick Reference Tables

### Validation Modes

| Mode | When Validates | Use Case |
|------|---|---|
| `onSubmit` | Form submission only | Default, simple forms |
| `onBlur` | Field loses focus | Desktop forms, reduce noise |
| `onChange` | Every keystroke | Real-time feedback, live validation |
| `onTouched` | After blur, then on change | Balanced UX, show errors progressively |
| `all` | Every change + submission | Critical validation, strict forms |

### Common Validation Rules

| Rule | Purpose | Example |
|------|---------|---------|
| `required` | Field must have value | `{ required: 'Required' }` |
| `min`/`max` | Numeric bounds | `{ min: { value: 18 } }` |
| `minLength`/`maxLength` | String length | `{ minLength: { value: 8 } }` |
| `pattern` | Regex matching | `{ pattern: { value: /^[a-z]+$/ } }` |
| `validate` | Custom function | `{ validate: (v) => v.length > 0 }` |

### Key formState Properties

| Property | Type | Purpose |
|----------|------|---------|
| `isDirty` | boolean | Detect unsaved changes |
| `isValid` | boolean | Enable/disable submit |
| `isSubmitting` | boolean | Show loading state |
| `errors` | object | Display validation errors |
| `touchedFields` | object | Track user interactions |
| `dirtyFields` | object | Track modified fields |

---

## Official Documentation

- **Main Docs:** https://react-hook-form.com
- **GitHub:** https://github.com/react-hook-form/react-hook-form
- **NPM Package:** https://www.npmjs.com/package/react-hook-form
- **Resolvers:** https://github.com/react-hook-form/resolvers

---

## Version & Compatibility

- **React Hook Form Version:** 7.69.0 (latest 7.x)
- **React Versions:** 16.8+ (hooks required)
- **TypeScript Support:** Full (3.5+)
- **Bundle Size:** ~8.5kb gzipped
- **Runtime:** Works in browser, React Native (with adapters)

---

**Last Updated:** December 2025 | **Status:** Complete with official documentation alignment | **Content:** 11 self-contained modules
