# React Native Testing Library (v13.3.3) — Modular Knowledge Base

> Testing framework for React Native components. User-centric, accessible, production-grade reference with modular, LLM-optimized architecture.

**Source:** [https://oss.callstack.com/react-native-testing-library](https://oss.callstack.com/react-native-testing-library)
**Version:** 13.3.3
**Last Updated:** February 2026

---

## Quick Overview

React Native Testing Library (RNTL) is a lightweight, modern testing solution emphasizing behavior over implementation:
- Uses React Test Renderer under the hood
- Semantic queries (role-based, text-based, accessibility-first)
- Async/await patterns with `findBy*` and `waitFor()`
- Jest integration with TypeScript support
- **Philosophy:** "The more your tests resemble how your software is used, the more confidence they can give you."

---

## Module Navigation Guide

This knowledge base is organized into self-contained modules optimized for LLM context windows. Each module is designed to be independently retrievable.

### 📋 **Setup & Installation**
**Module:** `01-setup.md`
**Summary:** Node/React prerequisites, npm installation, Jest configuration, Expo project setup, TypeScript setup, verification steps.
**Best for:** New projects, environment setup, troubleshooting installation issues.

---

### 🔧 **Core API Reference**
**Module:** `02-core-api.md`
**Summary:** `render()`, `renderAsync()`, `screen` object, cleanup utilities, `act()` function, debug utilities.
**Best for:** Understanding rendering and component testing foundations.

---

### 🔍 **Query Methods**
**Module:** `03-query-methods.md`
**Summary:** Complete guide to `getBy*`, `getAllBy*`, `queryBy*`, `queryAllBy*`, `findBy*`, `findAllBy*` with role-based, text-based, and attribute-based selectors. Decision tree included.
**Best for:** Selecting elements in tests, understanding query variants and when to use each.

---

### 👆 **User Interactions**
**Module:** `04-user-interactions.md`
**Summary:** `userEvent` API (press, type, selectValue), legacy `fireEvent` support, form submission patterns, best practices.
**Best for:** Simulating user actions, testing forms and interactions.

---

### ⏳ **Async Testing & Waiting**
**Module:** `05-async-testing.md`
**Summary:** `waitFor()`, `waitForElementToBeRemoved()`, promise-based queries, timeout management, async patterns.
**Best for:** Testing side effects, handling asynchronous component behavior.

---

### 🪝 **Hook Testing**
**Module:** `06-hook-testing.md`
**Summary:** `renderHook()`, managing hook state, testing custom hooks, hook result properties, provider wrapping.
**Best for:** Testing React Hooks in isolation, custom hook validation.

---

### ♿ **Accessibility & Configuration**
**Module:** `07-accessibility.md`
**Summary:** `isHiddenFromAccessibility()`, `within()` scoping, `configure()` global settings, semantic queries, accessibility best practices.
**Best for:** Accessibility testing, leveraging semantic attributes for maintainable tests.

---

### 🚀 **Advanced Patterns & Best Practices**
**Module:** `08-advanced-patterns.md`
**Summary:** Custom render functions with providers, snapshot testing, async components, form testing patterns, 2024 recommended practices.
**Best for:** Complex testing scenarios, establishing patterns for large applications.

---

### 📘 **TypeScript Integration**
**Module:** `09-typescript.md`
**Summary:** Type definitions, component typing, generic render functions, typed queries, TypeScript best practices.
**Best for:** Type-safe testing, TypeScript project setup and patterns.

---

### 🆘 **Troubleshooting & FAQ**
**Module:** `10-troubleshooting.md`
**Summary:** 27+ common issues with solutions, debug techniques, performance optimization, FAQ with resolutions.
**Best for:** Solving problems, error diagnostics, getting unstuck.

---

## Quick Navigation by Task

| **Task** | **Module** | **Key Sections** |
|----------|-----------|-----------------|
| Set up RNTL in new project | `01-setup.md` | Installation, Jest config, verification |
| Render and test components | `02-core-api.md` | `render()`, `screen`, cleanup |
| Find elements in tests | `03-query-methods.md` | Query variants, decision tree |
| Simulate user actions | `04-user-interactions.md` | `userEvent`, form interactions |
| Handle async operations | `05-async-testing.md` | `waitFor()`, promise queries |
| Test custom hooks | `06-hook-testing.md` | `renderHook()`, providers |
| Improve test accessibility | `07-accessibility.md` | Semantic queries, `within()` |
| Complex testing patterns | `08-advanced-patterns.md` | Custom render, providers, forms |
| TypeScript integration | `09-typescript.md` | Types, generics, configuration |
| Solve problems | `10-troubleshooting.md` | Common issues, debug techniques |
| Jest matchers reference | `11-jest-matchers.md` | toBeOnTheScreen, toBeVisible, etc. |

---

## How to Use This Knowledge Base

### **For Implementations:**
1. **Start with README.md** (this file) — Understand architecture and find your module
2. **Jump to relevant module** — Each is 8-15K tokens, fits one context window
3. **Follow code examples** — Copy-paste ready, production patterns
4. **Cross-reference as needed** — Jump to related modules for deeper context

### **For Context Window Efficiency:**
- Each module is designed to fit within a single LLM context (~8-15K tokens)
- Summary paragraphs at module starts enable quick relevance checking
- Code examples use real-world patterns, not pseudo-code
- Direct source URLs enable fact-checking and verification

### **Recommended Reading Order:**
1. **Getting Started:** `01-setup.md` → `02-core-api.md`
2. **Implementation:** `03-query-methods.md` → `04-user-interactions.md`
3. **Advanced:** `05-async-testing.md` → `08-advanced-patterns.md`
4. **Specialized:** `06-hook-testing.md`, `07-accessibility.md`, `09-typescript.md`
5. **Reference:** `10-troubleshooting.md`

---

## Core Concepts at a Glance

### User-Centric Philosophy
Test what users see and interact with, not implementation details:

```typescript
// ❌ Implementation detail testing
expect(component.state.isLoading).toBe(false);

// ✅ User-centric testing
expect(screen.getByText('Loading...')).not.toBeInTheDocument();
```

### Query Hierarchy (in preferred order)
1. **Role-based:** `getByRole()` — Most semantic
2. **Text-based:** `getByText()` — For accessibility labels
3. **Attribute-based:** `getByTestId()` — Last resort for testing purposes

### Async Patterns
```typescript
// ✅ Modern approach: waitFor with findBy
const element = await screen.findByText('Success');

// ✅ Or explicit waitFor
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument();
});
```

### User Interactions
```typescript
// ✅ Modern: userEvent (more realistic)
const user = userEvent.setup();
await user.press(screen.getByRole('button'));

// ⚠️ Legacy: fireEvent (direct event firing)
fireEvent.press(screen.getByRole('button'));
```

---

## Module Dependency Graph

```
01-setup.md (Foundation)
├→ 02-core-api.md (Core Rendering)
│   ├→ 03-query-methods.md (Finding Elements)
│   │   └→ 04-user-interactions.md (User Actions)
│   │       └→ 05-async-testing.md (Async Patterns)
│   ├→ 06-hook-testing.md (Hook Testing)
│   └→ 07-accessibility.md (Accessibility)
└→ 08-advanced-patterns.md (Advanced)
    └→ 09-typescript.md (Type Safety)

10-troubleshooting.md (Reference - no dependencies)
11-jest-matchers.md (Reference - no dependencies)
```

**Independent paths:**
- Just need setup? → `01-setup.md` + `02-core-api.md`
- Just need queries? → `03-query-methods.md`
- TypeScript only? → `09-typescript.md`
- Stuck? → `10-troubleshooting.md`

---

## Conventions Used in Modules

```markdown
# Heading 1 (Module Title)
## Heading 2 (Major Sections)
### Heading 3 (Subsections)

**Signature:**        # Function/API type definition
**Parameters:**       # Table of inputs
**Return Type:**      # What it returns
**Example:**          # Code usage
**Official Source:**  # Direct docs URL
**Best for:**         # When to use
```

### Code Style
- TypeScript with full type annotations
- Real-world production patterns
- Runnable without modifications
- Consistent import statements

---

## Best Practices Summary

### ✅ DO:
- Use `userEvent` over `fireEvent` — More realistic interactions
- Query semantically — `getByRole()`, `getByLabelText()` first
- Use `screen` object — Modern, recommended access method
- Test behavior, not implementation — Focus on user perspective
- Keep tests isolated — Use custom render with providers
- Use `within()` for scoping — More specific queries
- Update to v13.3.3 — Latest version with full support

### ❌ DON'T:
- Test internal state — User can't access it
- Use `getAllByTestId()` without reason — Not semantic
- Forget to await async queries — `findBy*` returns promises
- Skip accessibility considerations — Improves tests and app quality
- Mutate test snapshots without review — Defeats their purpose
- Ignore error messages — They guide you to the problem
- Test implementation details — Focus on user-facing behavior

---

## Testing Pyramid

```
          ┌─────────────────┐
          │   E2E Tests     │  (Real devices/emulators)
          │  (Appium, etc)  │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │  Integration    │  (Multiple components)
          │  Tests (RNTL)   │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │  Unit Tests     │  (Single components)
          │  (RNTL, Jest)   │
          └────────┬────────┘
                   │
          ┌────────▼────────┐
          │ Static Analysis │  (Linting, TypeScript)
          └─────────────────┘
```

---

## Official Resources

| Resource | URL |
|----------|-----|
| **Official Docs** | https://oss.callstack.com/react-native-testing-library |
| **GitHub Repo** | https://github.com/callstack/react-native-testing-library |
| **npm Package** | https://www.npmjs.com/package/@testing-library/react-native |
| **API Reference** | https://oss.callstack.com/react-native-testing-library/docs/api |
| **Query Guide** | https://oss.callstack.com/react-native-testing-library/docs/api/queries |
| **Discussions** | https://github.com/callstack/react-native-testing-library/discussions |
| **Issues** | https://github.com/callstack/react-native-testing-library/issues |

---

## Module Statistics

| Module | Status | Topics | Size |
|--------|--------|--------|------|
| `01-setup.md` | ✅ Complete | Installation, Jest, TypeScript, verification | ~395 lines |
| `02-core-api.md` | ✅ Complete | render(), screen, cleanup, act() | ~625 lines |
| `03-query-methods.md` | ✅ Complete | getBy*, findBy*, decision tree | ~806 lines |
| `04-user-interactions.md` | ✅ Complete | userEvent, fireEvent, forms | ~697 lines |
| `05-async-testing.md` | ✅ Complete | waitFor(), async patterns | ~785 lines |
| `06-hook-testing.md` | ✅ Complete | renderHook(), custom hooks | ~691 lines |
| `07-accessibility.md` | ✅ Complete | Semantic queries, within(), configure() | ~701 lines |
| `08-advanced-patterns.md` | ✅ Complete | Providers, custom render, patterns | ~711 lines |
| `09-typescript.md` | ✅ Complete | Types, generics, integration | ~674 lines |
| `10-troubleshooting.md` | ✅ Complete | 27+ issues, FAQ, debug techniques | ~837 lines |
| `11-jest-matchers.md` | ✅ Complete | 18 built-in matchers, accessibility state | ~350 lines |

**Total Knowledge Base:** ~7,272 lines, ~58K tokens (all modules)

---

## Version & Maintenance

- **Knowledge Base Version:** 1.0 (Modular)
- **Target Library Version:** React Native Testing Library 13.3.3
- **Last Updated:** February 2026
- **Next Review:** When RNTL 14.0 releases

---

## Quick Start Example

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';
import { QuestionsBoard } from '../QuestionsBoard';

test('form submits two answers [integration]', async () => {
  const questions = ['q1', 'q2'];
  const onSubmit = jest.fn();
  const user = userEvent.setup();

  render(<QuestionsBoard questions={questions} onSubmit={onSubmit} />);

  const answerInputs = screen.getAllByLabelText('answer input');
  await user.type(answerInputs[0], 'a1');
  await user.type(answerInputs[1], 'a2');
  await user.press(screen.getByRole('button', { name: 'Submit' }));

  expect(onSubmit).toHaveBeenCalledWith({
    1: { q: 'q1', a: 'a1' },
    2: { q: 'q2', a: 'a2' },
  });
});
```

---

**Start with a module based on your task above, or read sequentially for comprehensive mastery.**

---

*Knowledge Base Version 1.0 (Modular)*
*Framework: React Native Testing Library 13.3.3*
*Status: Production-Ready*
