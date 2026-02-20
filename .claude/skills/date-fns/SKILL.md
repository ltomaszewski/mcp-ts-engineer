---
name: date-fns
description: date-fns date utilities - formatting, parsing, manipulation, comparison. Use when working with dates, formatting timestamps, or calculating date differences.
---

# date-fns

> Modern JavaScript date utility library with modular, tree-shakeable functions.

**Package:** `date-fns`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Formatting dates for display
- Parsing date strings from APIs
- Calculating date differences
- Manipulating dates (add, subtract, startOf, endOf)
- Comparing dates or checking ranges

---

## Critical Rules

**ALWAYS:**
1. Use `parseISO()` for ISO strings from APIs — handles ISO 8601 format correctly
2. Import only needed functions — keeps bundle size small with tree-shaking
3. Check validity with `isValid()` before operations — prevents NaN results
4. Use `date-fns-tz` for timezone operations — date-fns alone is timezone-naive

**NEVER:**
1. Parse dates with `new Date(string)` — inconsistent across browsers
2. Mutate Date objects — date-fns returns new Date instances
3. Assume local timezone — be explicit about timezone handling
4. Use deprecated format tokens — use Unicode tokens (yyyy not YYYY)

---

## Core Patterns

### Formatting Dates

```typescript
import { format, formatDistance, formatRelative } from 'date-fns';

// Common formats
format(new Date(), 'PPP');           // "January 25, 2026"
format(new Date(), 'PP');            // "Jan 25, 2026"
format(new Date(), 'p');             // "2:30 PM"
format(new Date(), 'PPp');           // "Jan 25, 2026, 2:30 PM"
format(new Date(), 'yyyy-MM-dd');    // "2026-01-25"
format(new Date(), 'HH:mm:ss');      // "14:30:00"

// Relative time
formatDistance(new Date(2026, 0, 20), new Date(), { addSuffix: true });
// "5 days ago"

formatRelative(new Date(2026, 0, 20), new Date());
// "last Tuesday at 12:00 AM"
```

### Parsing Dates

```typescript
import { parseISO, parse, isValid } from 'date-fns';

// Parse ISO string from API (recommended)
const date = parseISO('2026-01-25T14:30:00Z');

// Parse custom format
const customDate = parse('25/01/2026', 'dd/MM/yyyy', new Date());

// Always validate
if (isValid(date)) {
  console.log(format(date, 'PPP'));
} else {
  console.error('Invalid date');
}
```

### Manipulation

```typescript
import { addDays, subHours, startOfDay, endOfMonth, addMonths } from 'date-fns';

const now = new Date();

const tomorrow = addDays(now, 1);
const yesterday = addDays(now, -1);
const twoHoursAgo = subHours(now, 2);
const dayStart = startOfDay(now);
const monthEnd = endOfMonth(now);
const nextMonth = addMonths(now, 1);
```

### Comparison and Queries

```typescript
import {
  isBefore,
  isAfter,
  isEqual,
  isWithinInterval,
  differenceInDays,
  differenceInHours,
} from 'date-fns';

const date1 = new Date(2026, 0, 20);
const date2 = new Date(2026, 0, 25);

isBefore(date1, date2);  // true
isAfter(date1, date2);   // false
isEqual(date1, date1);   // true

// Check if date is in range
isWithinInterval(new Date(), {
  start: date1,
  end: date2,
}); // true if today is between Jan 20-25

// Calculate differences
differenceInDays(date2, date1);   // 5
differenceInHours(date2, date1);  // 120
```

### Helper for API Responses

```typescript
import { parseISO, format, isValid } from 'date-fns';

function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';

  const date = parseISO(isoString);
  if (!isValid(date)) return 'Invalid date';

  return format(date, 'MMM d, yyyy h:mm a');
  // "Jan 25, 2026 2:30 PM"
}

function formatDateOnly(isoString: string): string {
  return format(parseISO(isoString), 'PP');
  // "Jan 25, 2026"
}
```

---

## Anti-Patterns

**BAD** — Parsing with Date constructor:
```typescript
const date = new Date('2026-01-25'); // Timezone issues!
```

**GOOD** — Use parseISO:
```typescript
const date = parseISO('2026-01-25T00:00:00Z');
```

**BAD** — Using deprecated tokens:
```typescript
format(date, 'YYYY-MM-DD'); // YYYY is week-year, not calendar year!
```

**GOOD** — Use correct Unicode tokens:
```typescript
format(date, 'yyyy-MM-dd'); // yyyy is calendar year
```

**BAD** — Not validating parsed dates:
```typescript
const date = parseISO(userInput);
return format(date, 'PPP'); // May return "Invalid Date"
```

**GOOD** — Always validate:
```typescript
const date = parseISO(userInput);
if (!isValid(date)) return 'Invalid date';
return format(date, 'PPP');
```

---

## Quick Reference

| Task | Function | Example |
|------|----------|---------|
| Format date | `format()` | `format(date, 'PPP')` |
| Parse ISO | `parseISO()` | `parseISO('2026-01-25T14:30:00Z')` |
| Parse custom | `parse()` | `parse('25/01/2026', 'dd/MM/yyyy', new Date())` |
| Add days | `addDays()` | `addDays(date, 5)` |
| Subtract | `subDays()` | `subDays(date, 3)` |
| Start of day | `startOfDay()` | `startOfDay(date)` |
| Difference | `differenceInDays()` | `differenceInDays(date2, date1)` |
| Compare | `isBefore()` | `isBefore(date1, date2)` |
| Validate | `isValid()` | `isValid(date)` |
| Relative | `formatDistance()` | `formatDistance(date, new Date())` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and imports | [01-setup-installation.md](01-setup-installation.md) |
| Parsing concepts | [02-core-concepts.md](02-core-concepts.md) |
| Format patterns reference | [03-api-formatting.md](03-api-formatting.md) |
| Add, sub, startOf, endOf | [04-api-manipulation.md](04-api-manipulation.md) |
| Comparison functions | [05-api-query.md](05-api-query.md) |
| Intervals and durations | [06-api-advanced.md](06-api-advanced.md) |
| Localization | [07-locales-i18n.md](07-locales-i18n.md) |
| Common recipes | [08-practical-guides.md](08-practical-guides.md) |

---

**Version:** 3.x | **Source:** https://date-fns.org/
