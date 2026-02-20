# API: Advanced Utilities — date-fns v4.1.0

## intervalToDuration() — Interval to Duration

**Purpose:** Convert date interval to Duration object with components (years, months, days, hours, etc.).

**Source:** https://github.com/date-fns/date-fns/blob/main/src/intervalToDuration/index.ts

### Signature

```typescript
function intervalToDuration(
  interval: Interval,
  options?: IntervalToDurationOptions
): Duration
```

### Code Examples

```javascript
import { intervalToDuration, subDays, format } from 'date-fns';

const date1 = new Date(2024, 11, 27);
const date2 = subDays(date1, 5);

const duration = intervalToDuration({
  start: date2,
  end: date1,
});

console.log(duration);
//=> { days: 5 }

// Complex duration
const start = new Date(2024, 0, 1, 10, 30, 45);
const end = new Date(2024, 3, 15, 14, 45, 20);

const complex = intervalToDuration({ start, end });
console.log(complex);
//=> { months: 3, days: 14, hours: 4, minutes: 14, seconds: 35 }
```

---

## toDate() — Convert to Date

**Purpose:** Convert various input types to JavaScript Date object.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/toDate/index.ts

### Signature

```typescript
function toDate(argument: Date | number | string): Date
```

### Code Examples

```javascript
import { toDate, isValid } from 'date-fns';

// From number (Unix timestamp in milliseconds)
toDate(0);                                    // Jan 1, 1970
toDate(1703692800000);                        // Dec 27, 2024

// From Date (returns same)
toDate(new Date(2024, 11, 27));              // Dec 27, 2024

// From string (attempts ISO parse)
toDate('2024-12-27');                         // Dec 27, 2024
toDate('2024-12-27T15:30:45Z');              // Dec 27, 2024 15:30:45

// Invalid conversion
const invalid = toDate('invalid');
isValid(invalid);                             // false
```

---

## toUnixTime() — Date to Unix Timestamp

**Purpose:** Convert Date to Unix timestamp (seconds since epoch).

**Source:** https://github.com/date-fns/date-fns/blob/main/src/toUnixTime/index.ts

### Signature

```typescript
function toUnixTime(date: Date | number): number
```

### Code Examples

```javascript
import { toUnixTime, fromUnixTime, format } from 'date-fns';

const date = new Date(2024, 11, 27, 0, 0, 0);

const unixSeconds = toUnixTime(date);
console.log(unixSeconds);
//=> 1735689600 (seconds, not milliseconds)

// Convert back
const restored = fromUnixTime(unixSeconds);
console.log(format(restored, 'PPPP'));
//=> "Friday, December 27, 2024"
```

---

## fromUnixTime() — Unix Timestamp to Date

**Purpose:** Convert Unix timestamp (seconds) to JavaScript Date.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/fromUnixTime/index.ts

### Signature

```typescript
function fromUnixTime(unixTime: number): Date
```

### Code Examples

```javascript
import { fromUnixTime, format } from 'date-fns';

// Create date from Unix timestamp
fromUnixTime(0);                    // Jan 1, 1970
fromUnixTime(1735689600);          // Dec 27, 2024

const date = fromUnixTime(1735689600);
console.log(format(date, 'PPPP'));
//=> "Friday, December 27, 2024"
```

---

## getTime() — Get Milliseconds Since Epoch

**Purpose:** Get milliseconds since Unix epoch (same as Date.getTime()).

**Source:** https://github.com/date-fns/date-fns/blob/main/src/getTime/index.ts

### Signature

```typescript
function getTime(date: Date | number): number
```

### Code Examples

```javascript
import { getTime } from 'date-fns';

const date = new Date(2024, 11, 27);

const ms = getTime(date);
console.log(ms);
//=> 1735689600000 (milliseconds)

// Useful for: storing timestamps, comparing dates
const now = getTime(new Date());
const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
console.log(getTime(tomorrow) > now);  // true
```

---

## min() & max() — Find Min/Max Date

**Purpose:** Find earliest or latest date from an array.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/min/index.ts

### Signature

```typescript
function min(datesArray: (Date | number)[]): Date
function max(datesArray: (Date | number)[]): Date
```

### Code Examples

```javascript
import { min, max } from 'date-fns';

const dates = [
  new Date(2024, 11, 25),
  new Date(2024, 11, 27),
  new Date(2024, 11, 26),
];

min(dates);
//=> Tue Dec 25 2024

max(dates);
//=> Fri Dec 27 2024

// Practical use case: find earliest deadline
const deadlines = [
  new Date('2024-12-30'),
  new Date('2024-12-28'),
  new Date('2024-12-31'),
];

const urgent = min(deadlines);
console.log('Most urgent deadline:', urgent);
```

---

## isWithinInterval() — Date Within Interval?

**Purpose:** Check if date falls within a date range.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/isWithinInterval/index.ts

### Signature

```typescript
function isWithinInterval(
  date: Date | number,
  interval: Interval,
  options?: IsWithinIntervalOptions
): boolean
```

### Code Examples

```javascript
import { isWithinInterval, addDays } from 'date-fns';

const start = new Date(2024, 11, 20);
const end = new Date(2024, 11, 31);
const dateInRange = new Date(2024, 11, 25);
const dateOutOfRange = new Date(2025, 0, 5);

isWithinInterval(dateInRange, { start, end });
//=> true

isWithinInterval(dateOutOfRange, { start, end });
//=> false

// Practical: Check if event is within business hours
function isBusinessHours(dateTime) {
  const start = new Date(dateTime);
  start.setHours(9, 0, 0, 0);
  
  const end = new Date(dateTime);
  end.setHours(17, 0, 0, 0);
  
  return isWithinInterval(dateTime, { start, end });
}
```

---

## Timezone Functions (v4.0+)

These functions are from the `@date-fns/tz` package.

### TZDate — Timezone-Aware Date

**Purpose:** Create a date in a specific timezone.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/tz/TZDate/index.ts

### Signature

```typescript
class TZDate extends Date {
  constructor(
    year: number,
    month: number,
    date?: number,
    hours?: number,
    minutes?: number,
    seconds?: number,
    milliseconds?: number,
    timeZone?: string
  )
}
```

### Code Examples

```javascript
import { TZDate } from '@date-fns/tz';
import { format, addDays } from 'date-fns';

// Create date in Singapore timezone
const sgDate = new TZDate(2025, 0, 1, 12, 0, 0, 'Asia/Singapore');
console.log(format(sgDate, 'yyyy-MM-dd HH:mm:ss'));
//=> "2025-01-01 12:00:00"

// Create date in New York timezone
const nyDate = new TZDate(2025, 0, 1, 12, 0, 0, 'America/New_York');
console.log(format(nyDate, 'yyyy-MM-dd HH:mm:ss'));
//=> "2025-01-01 12:00:00" (different UTC offset)

// Arithmetic preserves timezone
const tomorrow = addDays(sgDate, 1);
console.log(format(tomorrow, 'yyyy-MM-dd')); // Still in Singapore TZ
```

---

## utcToZonedTime() — UTC to Timezone

**Purpose:** Convert UTC date to specific timezone (v4.0+).

**Source:** https://github.com/date-fns/date-fns/blob/main/src/tz/utcToZonedTime/index.ts

### Signature

```typescript
function utcToZonedTime(
  date: Date | string | number,
  timeZone: string
): Date
```

### Code Examples

```javascript
import { utcToZonedTime } from '@date-fns/tz';
import { format } from 'date-fns';

const utcDate = new Date('2024-12-27T00:00:00Z');

// Convert to Singapore time
const sgTime = utcToZonedTime(utcDate, 'Asia/Singapore');
console.log(format(sgTime, 'yyyy-MM-dd HH:mm:ss'));
//=> "2024-12-27 08:00:00" (+8 offset)

// Convert to New York time
const nyTime = utcToZonedTime(utcDate, 'America/New_York');
console.log(format(nyTime, 'yyyy-MM-dd HH:mm:ss'));
//=> "2024-12-26 19:00:00" (-5 offset)
```

---

## zonedTimeToUtc() — Timezone to UTC

**Purpose:** Convert timezone-aware time to UTC.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/tz/zonedTimeToUtc/index.ts

### Code Examples

```javascript
import { zonedTimeToUtc } from '@date-fns/tz';
import { format } from 'date-fns';

// Local time in Singapore
const sgLocal = new Date(2024, 11, 27, 8, 0, 0);

const utc = zonedTimeToUtc(sgLocal, 'Asia/Singapore');
console.log(format(utc, "yyyy-MM-dd HH:mm:ss 'UTC'"));
//=> "2024-12-27 00:00:00 UTC"
```

---

## Advanced Pattern: Find Available Slots

```javascript
import { isWithinInterval, addMinutes, startOfDay, endOfDay, eachHourOfInterval } from 'date-fns';

function findAvailableSlots(date, busyIntervals, slotDuration = 60) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  
  const allSlots = eachHourOfInterval({
    start: dayStart,
    end: dayEnd,
  }).map(slot => ({
    start: slot,
    end: addMinutes(slot, slotDuration),
  }));
  
  return allSlots.filter(slot =>
    !busyIntervals.some(busy =>
      isWithinInterval(slot.start, busy) ||
      isWithinInterval(slot.end, busy)
    )
  );
}

// Find 1-hour slots not conflicting with meetings
const busy = [
  { start: new Date(2024, 11, 27, 9, 0), end: new Date(2024, 11, 27, 10, 0) },
  { start: new Date(2024, 11, 27, 14, 0), end: new Date(2024, 11, 27, 15, 0) },
];

findAvailableSlots(new Date(2024, 11, 27), busy);
```

---

## Module Navigation

- **Manipulation:** `04-api-manipulation.md` (Date arithmetic)
- **Query & comparison:** `05-api-query.md` (Date inspection)
- 📍 **You are here:** API: Advanced Utilities (06-api-advanced.md)
- **Localization:** `07-locales-i18n.md` (International support)
- **Practical patterns:** `08-practical-guides.md` (Real-world recipes)
- **Complete index:** `00-master-index.md`

---

**Document Status:** Complete | **Last Updated:** December 27, 2024