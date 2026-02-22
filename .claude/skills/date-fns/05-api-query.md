# API: Query & Comparison Functions -- date-fns v4.1.0

> Date inspection, comparisons, differences, getters, and sorting functions.

**Source:** https://date-fns.org/docs/isValid

---

## Validation

### isValid()

```typescript
function isValid(date: unknown): boolean
```

```typescript
import { isValid, parseISO, parse } from 'date-fns';

isValid(new Date());                    // true
isValid(new Date(2026, 0, 25));         // true
isValid(new Date('invalid'));           // false
isValid(new Date(NaN));                 // false
isValid('2026-01-25');                  // false (string, not Date)
isValid(null);                          // false

// Safe parsing pattern
const parsed = parse('2026-01-25', 'yyyy-MM-dd', new Date());
if (isValid(parsed)) { /* use it */ }
```

---

## Comparison Functions

### isBefore()

```typescript
function isBefore(date: Date | number, dateToCompare: Date | number): boolean
```

```typescript
import { isBefore } from 'date-fns';

const d1 = new Date(2026, 0, 20);
const d2 = new Date(2026, 0, 25);

isBefore(d1, d2);    // true
isBefore(d2, d1);    // false
isBefore(d1, d1);    // false (equal is not before)
```

### isAfter()

```typescript
function isAfter(date: Date | number, dateToCompare: Date | number): boolean
```

```typescript
import { isAfter } from 'date-fns';

isAfter(new Date(2026, 0, 25), new Date(2026, 0, 20));  // true
isAfter(new Date(2026, 0, 20), new Date(2026, 0, 25));  // false
```

### isEqual()

```typescript
function isEqual(dateLeft: Date | number, dateRight: Date | number): boolean
```

```typescript
import { isEqual } from 'date-fns';

const d1 = new Date(2026, 0, 25, 12, 0, 0);
const d2 = new Date(2026, 0, 25, 12, 0, 0);

isEqual(d1, d2);  // true (same timestamp)
```

---

## Same-Period Checks

### isSameDay()

```typescript
import { isSameDay } from 'date-fns';

const morning = new Date(2026, 0, 25, 8, 0);
const evening = new Date(2026, 0, 25, 20, 0);
const nextDay = new Date(2026, 0, 26, 8, 0);

isSameDay(morning, evening);  // true (same calendar day)
isSameDay(morning, nextDay);  // false
```

### isSameMonth()

```typescript
import { isSameMonth } from 'date-fns';

isSameMonth(new Date(2026, 0, 1), new Date(2026, 0, 31));  // true
isSameMonth(new Date(2026, 0, 1), new Date(2026, 1, 1));   // false
```

### isSameYear()

```typescript
import { isSameYear } from 'date-fns';

isSameYear(new Date(2026, 0, 1), new Date(2026, 11, 31));  // true
isSameYear(new Date(2026, 0, 1), new Date(2027, 0, 1));    // false
```

---

## Day-Type Checks

### isWeekend()

```typescript
import { isWeekend } from 'date-fns';

isWeekend(new Date(2026, 0, 24));  // true (Saturday)
isWeekend(new Date(2026, 0, 25));  // true (Sunday)
isWeekend(new Date(2026, 0, 26));  // false (Monday)
```

### isFuture() / isPast() / isToday()

```typescript
import { isFuture, isPast, isToday, addDays, subDays } from 'date-fns';

isFuture(addDays(new Date(), 1));   // true
isPast(subDays(new Date(), 1));     // true
isToday(new Date());                // true
```

---

## Difference Functions

All `differenceIn*` functions calculate: `dateLeft - dateRight`. Result is positive when `dateLeft > dateRight`.

### differenceInDays()

```typescript
import { differenceInDays } from 'date-fns';

const d1 = new Date(2026, 0, 20);
const d2 = new Date(2026, 0, 25);

differenceInDays(d2, d1);  // 5
differenceInDays(d1, d2);  // -5
```

### differenceInWeeks()

```typescript
import { differenceInWeeks } from 'date-fns';

differenceInWeeks(new Date(2026, 1, 8), new Date(2026, 0, 25));  // 2
```

### differenceInMonths()

```typescript
import { differenceInMonths } from 'date-fns';

differenceInMonths(new Date(2026, 6, 1), new Date(2026, 0, 1));  // 6
```

### differenceInYears()

```typescript
import { differenceInYears } from 'date-fns';

differenceInYears(new Date(2028, 0, 1), new Date(2026, 0, 1));  // 2
```

### differenceInHours()

```typescript
import { differenceInHours } from 'date-fns';

const d1 = new Date(2026, 0, 25, 8, 0);
const d2 = new Date(2026, 0, 25, 14, 30);

differenceInHours(d2, d1);  // 6
```

### differenceInMinutes()

```typescript
import { differenceInMinutes } from 'date-fns';

const d1 = new Date(2026, 0, 25, 14, 0);
const d2 = new Date(2026, 0, 25, 14, 45);

differenceInMinutes(d2, d1);  // 45
```

### differenceInSeconds()

```typescript
import { differenceInSeconds } from 'date-fns';

const d1 = new Date(2026, 0, 25, 14, 0, 0);
const d2 = new Date(2026, 0, 25, 14, 0, 30);

differenceInSeconds(d2, d1);  // 30
```

---

## Getter Functions

### Date Component Getters

| Function | Returns | Range | Example |
|----------|---------|-------|---------|
| `getYear(date)` | Calendar year | - | `2026` |
| `getMonth(date)` | Month (0-indexed) | `0-11` | `0` = January |
| `getDate(date)` | Day of month | `1-31` | `25` |
| `getDay(date)` | Day of week | `0-6` | `0` = Sunday |
| `getHours(date)` | Hour | `0-23` | `14` |
| `getMinutes(date)` | Minute | `0-59` | `30` |
| `getSeconds(date)` | Second | `0-59` | `45` |
| `getDaysInMonth(date)` | Days in month | `28-31` | `31` |
| `getDayOfYear(date)` | Day of year | `1-366` | `25` |
| `getWeek(date)` | Week number | `1-53` | `4` |

```typescript
import { getYear, getMonth, getDate, getDay, getHours, getMinutes, getSeconds, getDaysInMonth } from 'date-fns';

const date = new Date(2026, 0, 25, 14, 30, 45);

getYear(date);        // 2026
getMonth(date);       // 0 (January, 0-indexed)
getDate(date);        // 25
getDay(date);         // 0 (Sunday)
getHours(date);       // 14
getMinutes(date);     // 30
getSeconds(date);     // 45
getDaysInMonth(date); // 31 (January)

// Leap year check
getDaysInMonth(new Date(2024, 1));  // 29 (February, leap year)
getDaysInMonth(new Date(2025, 1));  // 28 (February, non-leap)
```

---

## Sorting

### compareAsc() / compareDesc()

```typescript
function compareAsc(dateLeft: Date | number, dateRight: Date | number): -1 | 0 | 1
function compareDesc(dateLeft: Date | number, dateRight: Date | number): -1 | 0 | 1
```

```typescript
import { compareAsc, compareDesc } from 'date-fns';

const dates = [
  new Date(2026, 6, 2),
  new Date(2026, 1, 11),
  new Date(2026, 6, 10),
];

dates.sort(compareAsc);   // [Feb 11, Jul 2, Jul 10]
dates.sort(compareDesc);  // [Jul 10, Jul 2, Feb 11]
```

---

## Common Patterns

### Age Calculation

```typescript
import { differenceInYears } from 'date-fns';

function getAge(birthDate: Date): number {
  return differenceInYears(new Date(), birthDate);
}

getAge(new Date(1990, 5, 15));  // 35 (in 2026)
```

### Business Hours Check

```typescript
import { getHours, getDay } from 'date-fns';

function isBusinessHours(date: Date): boolean {
  const hour = getHours(date);
  const day = getDay(date);
  return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
}
```

### Upcoming Event Filter

```typescript
import { isFuture, differenceInDays } from 'date-fns';

function isUpcoming(eventDate: Date, withinDays: number = 30): boolean {
  return isFuture(eventDate) && differenceInDays(eventDate, new Date()) <= withinDays;
}
```

---

## Cross-References

- **Formatting:** `03-api-formatting.md`
- **Manipulation:** `04-api-manipulation.md`
- **Intervals and durations:** `06-api-advanced.md`
- **Practical patterns:** `08-practical-guides.md`

---

**Version:** 4.1.0 | **Source:** https://date-fns.org/docs/isValid
