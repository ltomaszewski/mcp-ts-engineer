# API: Advanced Utilities -- date-fns v4.1.0

> Intervals, durations, timestamps, iteration functions, and timezone operations.

**Source:** https://date-fns.org/docs/intervalToDuration

---

## intervalToDuration() -- Interval to Duration

Converts a date interval `{ start, end }` into a `Duration` object with broken-down components.

### Signature

```typescript
function intervalToDuration(interval: Interval): Duration

interface Duration {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}
```

```typescript
import { intervalToDuration } from 'date-fns';

const duration = intervalToDuration({
  start: new Date(2026, 0, 1, 10, 0, 0),
  end: new Date(2026, 3, 15, 14, 30, 45),
});
// { months: 3, days: 14, hours: 4, minutes: 30, seconds: 45 }

// Simple example
intervalToDuration({
  start: new Date(2026, 0, 1),
  end: new Date(2026, 0, 6),
});
// { days: 5 }
```

---

## formatDuration() -- Duration to String

See `03-api-formatting.md` for full documentation. Quick reference:

```typescript
import { formatDuration, intervalToDuration } from 'date-fns';

formatDuration({ hours: 2, minutes: 30 });
// "2 hours 30 minutes"

const duration = intervalToDuration({
  start: new Date(2026, 0, 1),
  end: new Date(2026, 3, 15),
});
formatDuration(duration);
// "3 months 14 days"

formatDuration(duration, { format: ['months', 'days'], delimiter: ', ' });
// "3 months, 14 days"
```

---

## Timestamp Functions

### getUnixTime() -- Date to Unix Seconds

```typescript
function getUnixTime(date: Date | number): number
```

```typescript
import { getUnixTime } from 'date-fns';

getUnixTime(new Date(2026, 0, 25));
// 1737763200 (seconds since epoch)
```

### fromUnixTime() -- Unix Seconds to Date

```typescript
function fromUnixTime(unixTime: number): Date
```

```typescript
import { fromUnixTime, format } from 'date-fns';

const date = fromUnixTime(1737763200);
format(date, 'PPPP');
// "Sunday, January 25, 2026"
```

### getTime() -- Date to Milliseconds

```typescript
function getTime(date: Date | number): number
```

```typescript
import { getTime } from 'date-fns';

getTime(new Date(2026, 0, 25));
// 1737763200000 (milliseconds since epoch)
```

### toDate() -- Convert to Date

```typescript
function toDate(argument: Date | number | string): Date
```

```typescript
import { toDate, isValid } from 'date-fns';

toDate(1737763200000);                  // from milliseconds
toDate(new Date(2026, 0, 25));          // passthrough
toDate('2026-01-25');                    // from string

const result = toDate('invalid');
isValid(result);                         // false
```

---

## min() / max() -- Find Earliest/Latest

```typescript
function min(dates: (Date | number)[]): Date
function max(dates: (Date | number)[]): Date
```

```typescript
import { min, max } from 'date-fns';

const dates = [
  new Date(2026, 0, 25),
  new Date(2026, 0, 20),
  new Date(2026, 0, 30),
];

min(dates);  // Jan 20, 2026
max(dates);  // Jan 30, 2026
```

---

## Interval Functions

### isWithinInterval()

```typescript
function isWithinInterval(date: Date | number, interval: Interval): boolean
```

```typescript
import { isWithinInterval } from 'date-fns';

isWithinInterval(new Date(2026, 0, 25), {
  start: new Date(2026, 0, 20),
  end: new Date(2026, 0, 30),
});
// true
```

### areIntervalsOverlapping()

```typescript
function areIntervalsOverlapping(
  intervalLeft: Interval,
  intervalRight: Interval,
  options?: { inclusive?: boolean }
): boolean
```

```typescript
import { areIntervalsOverlapping } from 'date-fns';

areIntervalsOverlapping(
  { start: new Date(2026, 0, 10), end: new Date(2026, 0, 20) },
  { start: new Date(2026, 0, 15), end: new Date(2026, 0, 25) },
);
// true (they overlap from Jan 15-20)

areIntervalsOverlapping(
  { start: new Date(2026, 0, 10), end: new Date(2026, 0, 15) },
  { start: new Date(2026, 0, 20), end: new Date(2026, 0, 25) },
);
// false (no overlap)

// inclusive: treat touching endpoints as overlapping
areIntervalsOverlapping(
  { start: new Date(2026, 0, 10), end: new Date(2026, 0, 15) },
  { start: new Date(2026, 0, 15), end: new Date(2026, 0, 20) },
  { inclusive: true },
);
// true (endpoints touch)
```

---

## Iteration Functions

### eachDayOfInterval()

```typescript
function eachDayOfInterval(interval: Interval, options?: { step?: number }): Date[]
```

```typescript
import { eachDayOfInterval, format } from 'date-fns';

const days = eachDayOfInterval({
  start: new Date(2026, 0, 20),
  end: new Date(2026, 0, 25),
});
// [Jan 20, Jan 21, Jan 22, Jan 23, Jan 24, Jan 25]

// With step (every other day)
const everyOther = eachDayOfInterval(
  { start: new Date(2026, 0, 20), end: new Date(2026, 0, 28) },
  { step: 2 },
);
// [Jan 20, Jan 22, Jan 24, Jan 26, Jan 28]
```

### eachWeekOfInterval()

```typescript
function eachWeekOfInterval(interval: Interval, options?: { weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6 }): Date[]
```

```typescript
import { eachWeekOfInterval, format } from 'date-fns';

const weeks = eachWeekOfInterval({
  start: new Date(2026, 0, 1),
  end: new Date(2026, 0, 31),
});
// Array of week start dates in January 2026

// With Monday as week start
const mondayWeeks = eachWeekOfInterval(
  { start: new Date(2026, 0, 1), end: new Date(2026, 0, 31) },
  { weekStartsOn: 1 },
);
```

### eachMonthOfInterval()

```typescript
function eachMonthOfInterval(interval: Interval): Date[]
```

```typescript
import { eachMonthOfInterval, format } from 'date-fns';

const months = eachMonthOfInterval({
  start: new Date(2026, 0, 1),
  end: new Date(2026, 5, 30),
});
// [Jan 1, Feb 1, Mar 1, Apr 1, May 1, Jun 1]

months.map((m) => format(m, 'MMMM yyyy'));
// ["January 2026", "February 2026", ..., "June 2026"]
```

### eachHourOfInterval()

```typescript
import { eachHourOfInterval } from 'date-fns';

const hours = eachHourOfInterval({
  start: new Date(2026, 0, 25, 9, 0),
  end: new Date(2026, 0, 25, 17, 0),
});
// [9:00, 10:00, 11:00, ..., 17:00]
```

---

## Timezone Functions (@date-fns/tz)

Requires `@date-fns/tz` package: `npm install @date-fns/tz`

### TZDate -- Timezone-Aware Date

```typescript
import { TZDate } from '@date-fns/tz';
import { format, addDays } from 'date-fns';

const sgDate = new TZDate(2026, 0, 25, 12, 0, 0, 'Asia/Singapore');
format(sgDate, 'yyyy-MM-dd HH:mm:ss');
// "2026-01-25 12:00:00"

const nyDate = new TZDate(2026, 0, 25, 12, 0, 0, 'America/New_York');
format(nyDate, 'yyyy-MM-dd HH:mm:ss');
// "2026-01-25 12:00:00" (different UTC offset)

// Arithmetic preserves timezone
const tomorrow = addDays(sgDate, 1);
// Still in Asia/Singapore timezone
```

---

## Common Patterns

### Calendar Month Grid

```typescript
import { eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, format } from 'date-fns';

function getCalendarDays(date: Date): Date[] {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calStart = startOfWeek(monthStart);
  const calEnd = endOfWeek(monthEnd);

  return eachDayOfInterval({ start: calStart, end: calEnd });
}

const days = getCalendarDays(new Date(2026, 0, 1));
// Returns all days needed for a full calendar grid (including padding days)
```

### Event Overlap Detection

```typescript
import { areIntervalsOverlapping } from 'date-fns';

interface Event { start: Date; end: Date; title: string }

function hasConflict(newEvent: Event, events: Event[]): boolean {
  return events.some((event) =>
    areIntervalsOverlapping(
      { start: newEvent.start, end: newEvent.end },
      { start: event.start, end: event.end },
    )
  );
}
```

### Countdown Timer

```typescript
import { intervalToDuration, formatDuration } from 'date-fns';

function getCountdown(targetDate: Date): string {
  const now = new Date();
  if (now >= targetDate) return 'Expired';

  const duration = intervalToDuration({ start: now, end: targetDate });
  return formatDuration(duration, {
    format: ['days', 'hours', 'minutes'],
    delimiter: ', ',
  });
}

getCountdown(new Date(2026, 11, 31));
// "340 days, 9 hours, 30 minutes"
```

---

## Cross-References

- **Formatting (formatDuration):** `03-api-formatting.md`
- **Manipulation:** `04-api-manipulation.md`
- **Query and comparison:** `05-api-query.md`
- **Localization:** `07-locales-i18n.md`
- **Practical recipes:** `08-practical-guides.md`

---

**Version:** 4.1.0 | **Source:** https://date-fns.org/docs/intervalToDuration
