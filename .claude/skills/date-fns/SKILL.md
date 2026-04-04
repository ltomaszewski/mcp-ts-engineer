---
name: date-fns
description: "date-fns date utilities - formatting, parsing, manipulation, comparison"
when_to_use: "working with dates, formatting timestamps, or calculating date differences"
---

# date-fns

> Modern JavaScript date utility library with modular, tree-shakeable pure functions.

**Package:** `date-fns` v4.1.0 | **TypeScript:** ^5.9.3

---

## When to Use

**LOAD THIS SKILL** when user is:
- Formatting dates for display
- Parsing date strings from APIs
- Calculating date differences
- Manipulating dates (add, subtract, startOf, endOf)
- Comparing dates or checking intervals
- Working with timezones (`@date-fns/tz`)

---

## Critical Rules

**ALWAYS:**
1. Use `parseISO()` for ISO strings from APIs -- handles ISO 8601 correctly
2. Import only needed functions -- enables tree-shaking (~2-4 KB per function)
3. Validate with `isValid()` before operations -- prevents NaN results
4. Use `@date-fns/tz` with `TZDate` for timezone operations
5. Use lowercase `yyyy` for calendar year, `dd` for day of month

**NEVER:**
1. Parse dates with `new Date(string)` -- inconsistent across browsers
2. Mutate Date objects -- date-fns always returns new Date instances
3. Use `YYYY` or `DD` tokens -- `YYYY` is ISO week year, `DD` is day of year
4. Import the entire library -- `import dateFns from 'date-fns'` defeats tree-shaking

---

## Core Patterns

### Formatting Dates

```typescript
import { format, formatDistance, formatRelative, formatDistanceToNow } from 'date-fns';

const date = new Date(2026, 0, 25, 14, 30);

format(date, 'yyyy-MM-dd');           // "2026-01-25"
format(date, 'PPP');                  // "January 25, 2026"
format(date, 'PPp');                  // "Jan 25, 2026, 2:30 PM"
format(date, 'EEEE, MMMM do yyyy');  // "Sunday, January 25th 2026"
format(date, 'HH:mm:ss');            // "14:30:00"

formatDistance(date, new Date(), { addSuffix: true });
// "X days ago" or "in X days"

formatDistanceToNow(date, { addSuffix: true });
// "in 3 days" (shorthand for formatDistance to now)

formatRelative(date, new Date());
// "last Sunday at 2:30 PM" or "tomorrow at 2:30 PM"
```

### Parsing Dates

```typescript
import { parseISO, parse, isValid } from 'date-fns';

const date = parseISO('2026-01-25T14:30:00Z');
const custom = parse('25/01/2026', 'dd/MM/yyyy', new Date());

if (isValid(date)) {
  console.log(format(date, 'PPP'));
}
```

### Manipulation

```typescript
import { addDays, subHours, addMonths, startOfDay, endOfMonth, addWeeks } from 'date-fns';

const now = new Date();
const tomorrow = addDays(now, 1);
const twoHoursAgo = subHours(now, 2);
const nextMonth = addMonths(now, 1);
const nextWeek = addWeeks(now, 1);
const dayStart = startOfDay(now);
const monthEnd = endOfMonth(now);
```

### Comparison and Queries

```typescript
import {
  isBefore, isAfter, isEqual, isSameDay,
  isWithinInterval, differenceInDays, differenceInHours,
} from 'date-fns';

const d1 = new Date(2026, 0, 20);
const d2 = new Date(2026, 0, 25);

isBefore(d1, d2);                    // true
isAfter(d1, d2);                     // false
isEqual(d1, d1);                     // true
isSameDay(d1, d2);                   // false
differenceInDays(d2, d1);            // 5
differenceInHours(d2, d1);           // 120
isWithinInterval(new Date(), { start: d1, end: d2 });
```

### Safe API Date Helper

```typescript
import { parseISO, format, isValid } from 'date-fns';

function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return 'N/A';
  const date = parseISO(isoString);
  if (!isValid(date)) return 'Invalid date';
  return format(date, 'MMM d, yyyy h:mm a');
}
```

---

## Anti-Patterns

**BAD** -- Parsing with Date constructor:
```typescript
const date = new Date('2026-01-25'); // Timezone issues!
```

**GOOD** -- Use parseISO:
```typescript
const date = parseISO('2026-01-25T00:00:00Z');
```

**BAD** -- Wrong format tokens:
```typescript
format(date, 'YYYY-MM-DD'); // YYYY = ISO week year, DD = day of year!
```

**GOOD** -- Correct Unicode tokens:
```typescript
format(date, 'yyyy-MM-dd'); // yyyy = calendar year, dd = day of month
```

**BAD** -- Not validating:
```typescript
format(parseISO(userInput), 'PPP'); // May crash on invalid input
```

**GOOD** -- Always validate:
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
| Relative time | `formatDistance()` | `formatDistance(date, new Date(), { addSuffix: true })` |
| Relative to now | `formatDistanceToNow()` | `formatDistanceToNow(date, { addSuffix: true })` |
| Duration format | `formatDuration()` | `formatDuration({ hours: 2, minutes: 30 })` |
| Add days | `addDays()` | `addDays(date, 5)` |
| Subtract | `subDays()` | `subDays(date, 3)` |
| Add weeks | `addWeeks()` | `addWeeks(date, 2)` |
| Start of day | `startOfDay()` | `startOfDay(date)` |
| End of month | `endOfMonth()` | `endOfMonth(date)` |
| Difference | `differenceInDays()` | `differenceInDays(date2, date1)` |
| Compare | `isBefore()` | `isBefore(date1, date2)` |
| Validate | `isValid()` | `isValid(date)` |
| Interval check | `isWithinInterval()` | `isWithinInterval(date, { start, end })` |
| Unix timestamp | `getUnixTime()` | `getUnixTime(date)` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and imports | [01-setup-installation.md](01-setup-installation.md) |
| Design philosophy | [02-core-concepts.md](02-core-concepts.md) |
| Format tokens reference | [03-api-formatting.md](03-api-formatting.md) |
| Add, sub, startOf, endOf | [04-api-manipulation.md](04-api-manipulation.md) |
| Comparison and getters | [05-api-query.md](05-api-query.md) |
| Intervals, durations, timezones | [06-api-advanced.md](06-api-advanced.md) |
| Localization | [07-locales-i18n.md](07-locales-i18n.md) |
| Common recipes | [08-practical-guides.md](08-practical-guides.md) |

---

**Version:** 4.1.0 | **Source:** https://date-fns.org/
