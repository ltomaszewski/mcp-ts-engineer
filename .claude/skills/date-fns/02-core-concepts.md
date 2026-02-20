# Core Concepts & Principles — date-fns v4.1.0

## Design Philosophy

date-fns follows these core principles:

1. **One function, one thing** — Each function has a single, well-defined purpose
2. **Unambiguous API** — One clear approach to every problem
3. **No overloading** — Functions don't extend built-in Date objects
4. **Pure functions** — Deterministic, no side effects
5. **Immutability** — Always returns new instances
6. **Modular structure** — Import what you need, nothing extra

---

## Immutability Principle

### Why Immutability Matters

JavaScript's native `Date` object is mutable, which can cause bugs:

```javascript
// ❌ Native Date - Mutation Problem
const date1 = new Date(2024, 11, 27);
const date2 = date1;
date2.setDate(28);
console.log(date1); // Changed to Dec 28! (unexpected mutation)
```

### date-fns Solution

All date-fns functions return **new Date instances**, never modifying the input:

```javascript
// ✅ date-fns - Immutable
import { addDays } from 'date-fns';

const date1 = new Date(2024, 11, 27);
const date2 = addDays(date1, 1);

console.log(date1); // Still Dec 27 (unchanged)
console.log(date2); // Dec 28 (new instance)
console.log(date1 === date2); // false (different objects)
```

### Practical Implication

```javascript
import { addMonths, format } from 'date-fns';

const startDate = new Date(2024, 0, 15); // Jan 15, 2024

// Safe to reuse original
const month2 = addMonths(startDate, 1); // Feb 15, 2024
const month3 = addMonths(startDate, 2); // Mar 15, 2024
const month4 = addMonths(startDate, 3); // Apr 15, 2024

console.log(format(startDate, 'MMMM yyyy')); // January 2024 (unchanged)
console.log(format(month2, 'MMMM yyyy'));   // February 2024
console.log(format(month3, 'MMMM yyyy'));   // March 2024
```

---

## Pure Functions Concept

### Definition

A pure function:
- Returns the same output for the same input
- Has no side effects (doesn't modify external state)
- Doesn't depend on mutable state

### date-fns Pure Functions

```javascript
import { differenceInDays, format } from 'date-fns';

// Pure function: always same result for same input
const date1 = new Date(2024, 11, 25);
const date2 = new Date(2024, 11, 27);

console.log(differenceInDays(date2, date1)); // 2
console.log(differenceInDays(date2, date1)); // 2 (identical input = identical output)

// No side effects
const log: string[] = [];
const result = format(date1, 'yyyy-MM-dd'); // Returns string, no mutations
// log array unchanged
```

### Composability Advantage

Pure functions are easy to compose:

```javascript
import { addDays, format, startOfMonth } from 'date-fns';

// Compose functions safely
const date = new Date();
const result = format(
  addDays(startOfMonth(date), 14),
  'PPPP'
);
// Order is clear: start month → add 14 days → format
```

---

## Function-Per-File Architecture

### Why This Matters

date-fns uses **function-per-file** structure, enabling tree-shaking:

```javascript
// ❌ Importing entire library (larger bundle)
import dateFns from 'date-fns';
dateFns.format(new Date(), 'yyyy-MM-dd'); // 13KB loaded

// ✅ Importing only needed functions (smaller bundle)
import { format } from 'date-fns';
format(new Date(), 'yyyy-MM-dd'); // Only ~2KB loaded
```

### Bundle Impact

| Approach | Bundle Size |
|----------|-------------|
| Entire library | ~13KB (min+gzip) |
| Format + Parse | ~4KB (min+gzip) |
| Single function | ~2KB (min+gzip) |

---

## Timezone Handling Strategy

### Pre-v4.0: Local Timezone Only

Before v4.0, date-fns always worked in the local browser timezone:

```javascript
// v3.x behavior
const date = new Date('2024-12-25T00:00:00Z');
console.log(date); // 2024-12-24T19:00:00 (if in EST)
```

### v4.0+: First-Class Timezone Support

v4.0 introduced `@date-fns/tz` package for explicit timezone handling:

```javascript
// v4.0+ behavior
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

// Create dates in specific timezones
const sgDate = new TZDate(2025, 0, 1, 'Asia/Singapore');
const nyDate = new TZDate(2025, 0, 1, 'America/New_York');

console.log(format(sgDate, 'yyyy-MM-dd HH:mm:ss'));
// 2025-01-01 00:00:00 (in Singapore)

console.log(format(nyDate, 'yyyy-MM-dd HH:mm:ss'));
// 2025-01-01 00:00:00 (in New York)
```

---

## Locale Handling Approach

### Locale as Option Parameter

date-fns passes locales as options, not modifying global state:

```javascript
import { format } from 'date-fns';
import { fr, de } from 'date-fns/locale';

const date = new Date(2024, 11, 27);

// Locales don't change global behavior
format(date, 'PPPP', { locale: fr }); // French
format(date, 'PPPP', { locale: de }); // German
format(date, 'PPPP');                 // English (default)
```

---

## Best Practices Summary

1. **Always import specific functions** — Enables tree-shaking
2. **Validate user input** — Use `isValid()` on parsed dates
3. **Reuse date instances** — Functions return new instances by design
4. **Specify locales explicitly** — Don't rely on globals
5. **Use timezone functions for tz-aware apps** — Use `TZDate` in v4.0+
6. **Compose functions** — Pure functions compose well
7. **Avoid date mutation** — Let date-fns handle it immutably

---

## Module Navigation

- **Previous:** `01-setup-installation.md` (Installation & environment)
- 📍 **You are here:** Core Concepts & Principles (02-core-concepts.md)
- **Next:** Choose an API module: `03-api-formatting.md`, `04-api-manipulation.md`, `05-api-query.md`, or `06-api-advanced.md`
- **Complete index:** See `00-master-index.md` for full module guide

---

**Document Status:** Complete | **Last Updated:** December 27, 2024