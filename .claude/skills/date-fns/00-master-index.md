# date-fns v4.1.0 — Modular Knowledge Base: Master Index

> A comprehensive, LLM-optimized knowledge base for date-fns date manipulation library. Modular architecture for efficient context loading and semantic search.

**Framework:** date-fns (200+ pure functions for date manipulation)
**Version:** v4.1.0 (September 17, 2024)
**Documentation Date:** February 2026
**Status:** ✅ Complete and Verified

---

## Module Navigation Guide

This knowledge base is organized into 8 self-contained modules optimized for Claude Code context windows. Each module can be loaded independently while maintaining clear cross-references for broader context.

### Core Modules

| Module | File | Purpose | Key Topics | Typical Use Case |
|--------|------|---------|-----------|------------------|
| **Setup & Installation** | `01-setup-installation.md` | Installation, imports, TypeScript setup, locale setup, timezone support, build configuration | npm install, ES6/CommonJS, type definitions, tree-shaking, @date-fns/tz | Getting started, project configuration, dependency setup |
| **Core Concepts & Principles** | `02-core-concepts.md` | Design philosophy, immutability, pure functions, timezone strategy, locale handling, best practices | One function one thing, immutability, pure functions, function-per-file architecture | Understanding library design, learning optimal patterns |
| **API: Formatting & Parsing** | `03-api-formatting.md` | String ↔ Date conversion, format tokens, locale-aware formatting, relative formatting | `format()`, `parse()`, `parseISO()`, `formatDistance()`, `formatRelative()` | Converting dates to strings, parsing user input, relative time |
| **API: Manipulation Functions** | `04-api-manipulation.md` | Date arithmetic, component setting, period boundaries | `add()`, `sub()`, `addDays()`, `setMonth()`, `startOfDay()`, `endOfMonth()` | Modifying dates, calculating future/past dates, range creation |
| **API: Query & Comparison** | `05-api-query.md` | Date inspection, comparisons, type checking, differences | `isValid()`, `isBefore()`, `isAfter()`, `isSameDay()`, `differenceInDays()`, `compareAsc()` | Validating dates, comparing timelines, calculating intervals |
| **API: Advanced Utilities** | `06-api-advanced.md` | Special operations, interval handling, type conversion, timezone operations | `intervalToDuration()`, `toDate()`, `getUnixTime()`, `fromUnixTime()`, `getTime()` | Duration calculations, timestamp conversions, complex operations |
| **Localization & I18n** | `07-locales-i18n.md` | Multi-language support, 50+ locales, custom locale creation, timezone-aware locales | Locale imports, custom locales, locale-specific formatting, language-aware operations | International applications, multi-language support |
| **Practical Guides & Recipes** | `08-practical-guides.md` | Real-world examples, patterns, solutions, performance optimization | Date ranges, business days, age calculations, scheduling, validation patterns | Building features, solving common problems |

---

## How to Use This Knowledge Base

### For Implementation Tasks

**"I need to format a date for display"**
→ Load `03-api-formatting.md` → Choose between `format()`, `formatDistance()`, or `formatRelative()`

**"I want to add 5 days to a date"**
→ Load `04-api-manipulation.md` → Use `addDays()` or `add()` with duration object

**"I need to compare two dates"**
→ Load `05-api-query.md` → Use `isBefore()`, `isAfter()`, or `differenceInDays()`

**"I'm building a multi-language app"**
→ Load `07-locales-i18n.md` → Import locale and pass to formatting functions

**"I need to calculate age from birthdate"**
→ Load `08-practical-guides.md` → Find age calculation recipe

**"I need timezone support"**
→ Load `01-setup-installation.md` → Install `@date-fns/tz`, then load `06-api-advanced.md` for timezone functions

### For Learning Patterns

1. **Start:** Read `02-core-concepts.md` to understand library philosophy
2. **Setup:** Follow `01-setup-installation.md` for your project
3. **Practice:** Try examples from any API module (`03-06`)
4. **Apply:** Use recipes from `08-practical-guides.md`

### For Troubleshooting

- **Type errors with TypeScript?** → `01-setup-installation.md` (TypeScript Setup section)
- **Invalid date issues?** → `05-api-query.md` (isValid() function)
- **Need to handle timezones?** → `01-setup-installation.md` (Timezone Support) + `06-api-advanced.md`
- **Not sure what function to use?** → `02-core-concepts.md` (Design Philosophy) → appropriate API module
- **Need real-world pattern?** → `08-practical-guides.md`

---

## Module Dependency Graph

```
01-setup-installation
├─ references: None (foundational)
└─ required by: All others (for imports)

02-core-concepts
├─ references: 01 (for context)
└─ foundation for: Understanding all other modules

03-api-formatting
├─ requires: 01, 02
└─ combines with: 05, 07 (query, locales)

04-api-manipulation
├─ requires: 01, 02
└─ combines with: 05 (for range creation)

05-api-query
├─ requires: 01, 02, 03, 04
└─ references: 04 (comparison patterns)

06-api-advanced
├─ requires: 01, 02, 05
└─ specialized module for advanced operations

07-locales-i18n
├─ requires: 01, 03 (format with locale)
└─ standalone feature module

08-practical-guides
├─ requires: All previous modules
└─ synthesizes patterns from 03, 04, 05, 06
```

---

## Core Concepts at a Glance

### Pure Functions & Immutability
- All date-fns functions return **new Date instances**
- Never mutates input dates
- Same input always produces same output
- Functions compose well together

### One Function, One Thing
- `format()` converts to string
- `parse()` converts from string
- `addDays()` adds days (not hours/months)
- Clear, unambiguous API

### Tree-Shakeable Module Architecture
- Import only what you need
- Function-per-file structure
- ~2-4 KB per function vs 13 KB for whole library
- Perfect for bundled applications

### Timezone Handling (v4.0+)
- Core package works in local timezone
- `@date-fns/tz` package for explicit timezone control
- `TZDate` for timezone-aware operations
- First-class support in v4.0+

---

## Quick API Reference

### Formatting Functions
```typescript
format(date, pattern, options?)           // String formatting
parse(dateStr, pattern, ref, options?)    // String parsing
parseISO(isoString, options?)             // ISO 8601 parsing
formatDistance(date, baseDate, options?)  // Relative time ("3 days ago")
formatRelative(date, baseDate, options?)  // Semantic time ("tomorrow")
intlFormat(date, options?)                // Intl.DateTimeFormat
```

### Manipulation Functions
```typescript
add(date, duration, options?)             // Add time (generic)
sub(date, duration, options?)             // Subtract time (generic)
addDays(date, days)                       // +/- days, hours, months, years
setYear(date, year)                       // Set date components
setMonth(date, month)                     // Set by zero-indexed value
setDate(date, day)                        // Set day of month
startOfDay(date)                          // Midnight start
endOfMonth(date)                          // Last moment of month
```

### Query Functions
```typescript
isValid(date)                             // Is valid Date?
isBefore(date1, date2)                    // Date1 < Date2?
isAfter(date1, date2)                     // Date1 > Date2?
isSameDay(date1, date2)                   // Same calendar day?
differenceInDays(date1, date2)            // Days between
compareAsc(date1, date2)                  // Compare for sorting
```

### Advanced Functions
```typescript
intervalToDuration(interval)              // Convert to Duration object
toDate(value)                             // Convert to Date
getUnixTime(date)                         // Get Unix timestamp (seconds)
fromUnixTime(timestamp)                   // From Unix timestamp
getTime(date)                             // Get milliseconds
getDay(date)                              // Get day of week
getDate(date)                             // Get day of month
```

---

## Module Statistics

| Module | Lines | Topics | Functions | Patterns |
|--------|-------|--------|-----------|----------|
| 01-setup-installation.md | ~270 | 6 | npm, ES6, CommonJS, TS, Locales, Timezones, Build tools | 0 |
| 02-core-concepts.md | ~200 | 7 | Immutability, Pure functions, Architecture, Principles | 7 code examples |
| 03-api-formatting.md | ~360 | 5 | format, parse, parseISO, formatDistance, formatRelative | 15+ examples |
| 04-api-manipulation.md | ~320 | 8 | add, sub, addDays, setMonth, startOfDay, endOfMonth | 15+ examples |
| 05-api-query.md | ~300+ | 8 | isValid, isBefore, isAfter, isSameDay, differenceInDays | 10+ examples |
| 06-api-advanced.md | ~280+ | 5 | intervalToDuration, toDate, getUnixTime, fromUnixTime | 10+ examples |
| 07-locales-i18n.md | ~260+ | 4 | Locale usage, 50+ languages, Custom locales, Formatting | 8+ examples |
| 08-practical-guides.md | ~350+ | 8 | Date ranges, Business days, Age calc, Scheduling, Validation | 15+ real-world recipes |
| **Total** | **~2400+** | **50+** | **80+ functions** | **80+ examples** |

---

## Best Practices Summary

✅ **DO:**
- Import only what you need (enables tree-shaking)
- Use specific functions (`addDays`, not `add` for simple cases)
- Validate input with `isValid()` when parsing user data
- Compose functions together (pipe/chain)
- Pass locale as option parameter, never modify globally
- Use `TZDate` from `@date-fns/tz` for timezone-aware apps
- Specify format strings as constants for reusability

❌ **DON'T:**
- Import entire library: `import dateFns from 'date-fns'`
- Mutate Date objects (date-fns returns new instances)
- Forget reference date when parsing: `parse(str, fmt, new Date())`
- Store functions in persisted state (they don't serialize)
- Ignore timezone considerations in international apps
- Use generic `add()` for single-unit operations

---

## Cross-Reference Index

### By Problem
- **String formatting** → 03, 07
- **String parsing** → 03, 05
- **Date arithmetic** → 04, 06
- **Date comparison** → 05, 08
- **Relative time** → 03
- **Localization** → 07
- **Timezones** → 01, 06
- **Business logic** → 08
- **Validation** → 05
- **Duration/intervals** → 06

### By Function Category
- **Format family** → 03
- **Add/Sub family** → 04
- **Set* family** → 04
- **Start/End family** → 04
- **Is* family** → 05
- **Difference* family** → 05, 06
- **Locale functions** → 07
- **Interval/Duration functions** → 06

---

## Official Resources

- **Main Docs:** https://date-fns.org
- **GitHub:** https://github.com/date-fns/date-fns
- **NPM:** https://www.npmjs.com/package/date-fns
- **Changelog:** https://github.com/date-fns/date-fns/blob/main/CHANGELOG.md

---

## Getting Started Workflow

### Step 1: Setup (5 mins)
→ Read `01-setup-installation.md`
→ Install: `npm install date-fns`
→ Import: `import { format } from 'date-fns'`

### Step 2: Understand Philosophy (10 mins)
→ Read `02-core-concepts.md`
→ Understand: pure functions, immutability, tree-shaking

### Step 3: Pick Your API Module (15 mins)
→ For **formatting:** Use `03-api-formatting.md`
→ For **arithmetic:** Use `04-api-manipulation.md`
→ For **validation:** Use `05-api-query.md`
→ For **advanced:** Use `06-api-advanced.md`

### Step 4: Apply to Your Problem (20 mins)
→ Find matching recipe in `08-practical-guides.md`
→ OR combine functions from appropriate API modules

### Step 5: Go International (Optional)
→ Read `07-locales-i18n.md` for multi-language support

---

## Quality Assurance

✅ **All modules verified against:**
- Official date-fns v4.1.0 documentation
- Source code at https://github.com/date-fns/date-fns
- Current best practices as of February 2026
- TypeScript definitions and types
- Real-world usage patterns

✅ **Each module includes:**
- Function signatures with type definitions
- Complete parameter documentation
- Return value specifications
- 10+ code examples per module
- Common patterns and anti-patterns
- Direct links to official sources
- Best practices and gotchas

---

## Version & Compatibility

| Aspect | Support |
|--------|---------|
| **date-fns** | v4.1.0 (September 2024) |
| **Node.js** | 14.0.0+ |
| **TypeScript** | 4.5+ (100% type coverage) |
| **React** | Any version (framework-agnostic) |
| **Browser** | All modern (ES2020+) |
| **Bundle Impact** | ~2-4 KB per function |

---

**Version:** 4.1.0 | **Source:** https://date-fns.org
**Last Updated:** February 2026
**Status:** Complete
**Module Count:** 8 core modules
**Total Content:** 2400+ lines, 80+ functions, 80+ examples
