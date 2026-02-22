# API: Manipulation Functions -- date-fns v4.1.0

> Date arithmetic (add/sub), component setters, and period boundary functions.

**Source:** https://date-fns.org/docs/add

---

## add() -- Generic Addition

### Signature

```typescript
function add(date: Date | number, duration: Duration): Date

interface Duration {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}
```

```typescript
import { add, format } from 'date-fns';

const date = new Date(2026, 0, 25);

add(date, { days: 5 });               // Jan 30
add(date, { months: 1 });             // Feb 25
add(date, { years: 1, months: 2 });   // Mar 25, 2027
add(date, { hours: 3, minutes: 15 }); // Jan 25, 03:15
```

---

## sub() -- Generic Subtraction

```typescript
function sub(date: Date | number, duration: Duration): Date
```

```typescript
import { sub, format } from 'date-fns';

const date = new Date(2026, 0, 25);

sub(date, { days: 5 });                // Jan 20
sub(date, { months: 2 });              // Nov 25, 2025
sub(date, { years: 1, days: 10 });     // Jan 15, 2025
```

---

## Specialized Add/Sub Functions

All share the same signature: `(date: Date | number, amount: number) => Date`

### Days

```typescript
import { addDays, subDays } from 'date-fns';

const date = new Date(2026, 0, 25);
addDays(date, 1);    // Jan 26 (tomorrow)
addDays(date, 7);    // Feb 1 (next week)
subDays(date, 3);    // Jan 22 (3 days ago)
```

### Weeks

```typescript
import { addWeeks, subWeeks } from 'date-fns';

const date = new Date(2026, 0, 25);
addWeeks(date, 1);   // Feb 1
addWeeks(date, 4);   // Feb 22
subWeeks(date, 2);   // Jan 11
```

### Months

```typescript
import { addMonths, subMonths } from 'date-fns';

const date = new Date(2026, 0, 31); // Jan 31
addMonths(date, 1);  // Feb 28 (clamped to month end)
addMonths(date, 2);  // Mar 31
subMonths(date, 1);  // Dec 31, 2025
```

**Month-end handling:** If the target month has fewer days, the result is clamped to the last day of that month. Example: Jan 31 + 1 month = Feb 28 (or Feb 29 in leap year).

### Years

```typescript
import { addYears, subYears } from 'date-fns';

const date = new Date(2024, 1, 29); // Feb 29 (leap year)
addYears(date, 1);   // Feb 28, 2025 (clamped, non-leap)
addYears(date, 4);   // Feb 29, 2028 (leap year)
subYears(date, 1);   // Feb 28, 2023
```

### Hours

```typescript
import { addHours, subHours } from 'date-fns';

const date = new Date(2026, 0, 25, 14, 0); // 2:00 PM
addHours(date, 3);   // 5:00 PM
addHours(date, 12);  // 2:00 AM next day
subHours(date, 2);   // 12:00 PM
```

### Minutes

```typescript
import { addMinutes, subMinutes } from 'date-fns';

const date = new Date(2026, 0, 25, 14, 30);
addMinutes(date, 45);   // 3:15 PM
subMinutes(date, 30);   // 2:00 PM
```

### Seconds

```typescript
import { addSeconds, subSeconds } from 'date-fns';

const date = new Date(2026, 0, 25, 14, 30, 0);
addSeconds(date, 90);   // 2:31:30 PM
subSeconds(date, 45);   // 2:29:15 PM
```

---

## Setter Functions

All return a new Date with the specified component changed.

### setYear() / setMonth() / setDate()

```typescript
import { setYear, setMonth, setDate, format } from 'date-fns';

const date = new Date(2026, 0, 25);

setYear(date, 2028);   // Jan 25, 2028
setMonth(date, 5);     // Jun 25, 2026 (0-indexed: 5 = June)
setDate(date, 1);      // Jan 1, 2026
setDate(date, 31);     // Jan 31, 2026
```

### setHours() / setMinutes() / setSeconds()

```typescript
import { setHours, setMinutes, setSeconds } from 'date-fns';

const date = new Date(2026, 0, 25, 14, 30, 0);

setHours(date, 9);      // 9:30:00 AM
setMinutes(date, 0);    // 2:00:00 PM
setSeconds(date, 30);   // 2:30:30 PM
```

---

## Period Boundaries -- startOf*

All return a new Date set to the beginning of the specified period.

### startOfDay() / startOfWeek() / startOfMonth() / startOfYear()

```typescript
import { startOfDay, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

const date = new Date(2026, 0, 25, 14, 30, 45);

startOfDay(date);     // Jan 25, 2026 00:00:00.000
startOfWeek(date);    // Jan 25, 2026 00:00:00.000 (Sunday)
startOfWeek(date, { weekStartsOn: 1 });  // Jan 19, 2026 (Monday)
startOfMonth(date);   // Jan 1, 2026 00:00:00.000
startOfYear(date);    // Jan 1, 2026 00:00:00.000
```

---

## Period Boundaries -- endOf*

All return a new Date set to the last moment of the specified period (23:59:59.999).

### endOfDay() / endOfWeek() / endOfMonth() / endOfYear()

```typescript
import { endOfDay, endOfWeek, endOfMonth, endOfYear } from 'date-fns';

const date = new Date(2026, 0, 25, 10, 30);

endOfDay(date);     // Jan 25, 2026 23:59:59.999
endOfWeek(date);    // Jan 31, 2026 23:59:59.999 (Saturday)
endOfWeek(date, { weekStartsOn: 1 });  // Jan 25, 2026 (Sunday end)
endOfMonth(date);   // Jan 31, 2026 23:59:59.999
endOfYear(date);    // Dec 31, 2026 23:59:59.999
```

---

## Common Patterns

### Date Range Creation

```typescript
import { startOfMonth, endOfMonth } from 'date-fns';

function getMonthRange(date: Date): { start: Date; end: Date } {
  return { start: startOfMonth(date), end: endOfMonth(date) };
}
```

### Add Business Days

```typescript
import { addDays, isWeekend } from 'date-fns';

function addBusinessDays(date: Date, days: number): Date {
  let current = new Date(date);
  let added = 0;
  while (added < days) {
    current = addDays(current, 1);
    if (!isWeekend(current)) added++;
  }
  return current;
}

addBusinessDays(new Date(2026, 0, 23), 5); // skip Sat/Sun
```

### Midnight Timestamp

```typescript
import { startOfDay, getTime } from 'date-fns';

function getMidnightMs(date: Date): number {
  return getTime(startOfDay(date));
}
```

### Next Occurrence of Weekday

```typescript
import { addDays, getDay } from 'date-fns';

function nextMonday(date: Date): Date {
  let d = addDays(date, 1);
  while (getDay(d) !== 1) {
    d = addDays(d, 1);
  }
  return d;
}
```

---

## Cross-References

- **Formatting:** `03-api-formatting.md`
- **Query and comparison:** `05-api-query.md`
- **Intervals and durations:** `06-api-advanced.md`
- **Practical recipes:** `08-practical-guides.md`

---

**Version:** 4.1.0 | **Source:** https://date-fns.org/docs/add
