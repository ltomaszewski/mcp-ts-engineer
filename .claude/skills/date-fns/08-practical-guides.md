# Practical Guides & Recipes — date-fns v4.1.0

Real-world examples, patterns, and solutions for common date-time problems.

---

## Guide 1: Date Range Operations

### Creating Date Ranges

```javascript
import { startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';

function getMonthDays(date) {
  return eachDayOfInterval({
    start: startOfMonth(date),
    end: endOfMonth(date),
  });
}

// Get all days in current month
const daysInMonth = getMonthDays(new Date());
console.log(`Days in month: ${daysInMonth.length}`);

// Generate array of day objects for a calendar
const calendarDays = getMonthDays(new Date()).map(day => ({
  date: day,
  day: day.getDate(),
  isToday: isSameDay(day, new Date()),
}));
```

### Finding Upcoming Dates

```javascript
import { isAfter, isBefore, format, addDays, compareAsc, differenceInDays } from 'date-fns';

function getUpcomingDates(dates, daysAhead = 30) {
  const now = new Date();
  const deadline = addDays(now, daysAhead);
  
  return dates
    .filter(date => isAfter(date, now) && isBefore(date, deadline))
    .sort(compareAsc)
    .map(date => ({
      date,
      formatted: format(date, 'PPPP'),
      daysUntil: differenceInDays(date, now),
    }));
}

// Find events in next 30 days
const events = [
  new Date(2024, 11, 28),
  new Date(2025, 0, 15),
  new Date(2025, 1, 20),
];

getUpcomingDates(events);
//=> [{ date, formatted, daysUntil }, ...]
```

---

## Guide 2: Business Day Calculations

### Add Business Days

```javascript
import { addDays, isWeekend } from 'date-fns';

function addBusinessDays(startDate, businessDays) {
  let count = 0;
  let current = new Date(startDate);
  
  while (count < businessDays) {
    current = addDays(current, 1);
    if (!isWeekend(current)) {
      count++;
    }
  }
  
  return current;
}

// Add 5 business days
const deadline = addBusinessDays(new Date(), 5);
console.log(`Deadline: ${format(deadline, 'PPPP')}`);
```

### Business Days Between

```javascript
import { eachDayOfInterval, isWeekend } from 'date-fns';

function businessDaysBetween(startDate, endDate) {
  const allDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });
  
  return allDays.filter(day => !isWeekend(day)).length;
}

// Calculate business days between two dates
const start = new Date(2024, 11, 23); // Monday
const end = new Date(2024, 11, 27);   // Friday

businessDaysBetween(start, end);
//=> 5 (all are business days)
```

---

## Guide 3: Age & Birthday Calculations

### Calculate Age

```javascript
import { differenceInYears, isAfter } from 'date-fns';

function getAge(birthDate) {
  const age = differenceInYears(new Date(), birthDate);
  
  // Check if birthday has passed this year
  const today = new Date();
  const birthdayThisYear = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );
  
  if (isAfter(today, birthdayThisYear)) {
    return age;
  }
  
  return age - 1;
}

// Get age from birthdate
const age = getAge(new Date(1990, 5, 15));
console.log(`Age: ${age}`);
```

### Upcoming Birthday

```javascript
import { isBefore, addYears, format, differenceInDays } from 'date-fns';

function getNextBirthday(birthDate) {
  const today = new Date();
  let nextBirthday = new Date(
    today.getFullYear(),
    birthDate.getMonth(),
    birthDate.getDate()
  );
  
  // If birthday hasn't occurred yet this year
  if (isBefore(today, nextBirthday)) {
    return nextBirthday;
  }
  
  // Otherwise, next year
  return addYears(nextBirthday, 1);
}

function daysUntilBirthday(birthDate) {
  const nextBday = getNextBirthday(birthDate);
  return differenceInDays(nextBday, new Date());
}

// Check upcoming birthday
const birthday = new Date(1990, 11, 25); // Dec 25
const daysLeft = daysUntilBirthday(birthday);
console.log(`${daysLeft} days until birthday`);
```

---

## Guide 4: Timezone Operations (v4.0+)

### Working with Timezones

```javascript
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

// Create dates in different timezones
const tokyo = new TZDate(2025, 0, 1, 0, 0, 0, 'Asia/Tokyo');
const newyork = new TZDate(2025, 0, 1, 0, 0, 0, 'America/New_York');
const london = new TZDate(2025, 0, 1, 0, 0, 0, 'Europe/London');

console.log(format(tokyo, 'yyyy-MM-dd HH:mm:ss Z'));
console.log(format(newyork, 'yyyy-MM-dd HH:mm:ss Z'));
console.log(format(london, 'yyyy-MM-dd HH:mm:ss Z'));
```

### Convert UTC to Local

```javascript
import { utcToZonedTime } from '@date-fns/tz';
import { format } from 'date-fns';

function displayLocalTime(utcDate, timezone) {
  const zonedDate = utcToZonedTime(utcDate, timezone);
  return format(zonedDate, 'yyyy-MM-dd HH:mm:ss');
}

// API returns UTC
const apiDate = new Date('2024-12-27T12:00:00Z');

displayLocalTime(apiDate, 'Asia/Singapore');  // "2024-12-27 20:00:00"
displayLocalTime(apiDate, 'America/New_York'); // "2024-12-27 07:00:00"
```

### World Clock

```javascript
import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';

const TIMEZONES = [
  'America/New_York',
  'Europe/London',
  'Asia/Tokyo',
  'Australia/Sydney',
];

function worldClock() {
  return TIMEZONES.map(tz => ({
    timezone: tz,
    time: format(new TZDate(new Date(), tz), 'HH:mm:ss'),
    date: format(new TZDate(new Date(), tz), 'PPPP'),
  }));
}

worldClock();
//=> [{ timezone, time, date }, ...]
```

---

## Guide 5: Data Validation & Edge Cases

### Validate Date Inputs

```javascript
import { parse, isValid, isDate } from 'date-fns';

function safeParseDate(input, format) {
  // Check if already a Date
  if (isDate(input)) {
    return isValid(input) ? input : null;
  }
  
  // Try to parse string
  if (typeof input === 'string') {
    const parsed = parse(input, format, new Date());
    return isValid(parsed) ? parsed : null;
  }
  
  // Try number as timestamp
  if (typeof input === 'number') {
    const date = new Date(input);
    return isValid(date) ? date : null;
  }
  
  return null;
}

// Validate user input
const userInput = '2024-12-27';
const date = safeParseDate(userInput, 'yyyy-MM-dd');

if (date) {
  console.log('Valid:', date);
} else {
  console.error('Invalid date format');
}
```

### Handle Month-End Edge Cases

```javascript
import { addMonths, setDate, getDaysInMonth } from 'date-fns';

function addMonthsSafely(date, months) {
  const result = addMonths(date, months);
  const originalDay = date.getDate();
  const daysInMonth = getDaysInMonth(result);
  
  if (originalDay > daysInMonth) {
    return setDate(result, daysInMonth);
  }
  
  return result;
}

// Jan 31 + 1 month = Feb 28/29, not Mar 3
const jan31 = new Date(2024, 0, 31);
const feb = addMonthsSafely(jan31, 1);
console.log(getDate(feb)); // 29 (leap year)
```

---

## Guide 6: API Integration

### Formatting API Requests

```javascript
import { format, startOfDay, endOfDay } from 'date-fns';

function buildDateRangeQuery(startDate, endDate) {
  return {
    from: format(startOfDay(startDate), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
    to: format(endOfDay(endDate), "yyyy-MM-dd'T'HH:mm:ss'Z'"),
  };
}

// API query: Get records from today
const query = buildDateRangeQuery(new Date(), new Date());
//=> {
//   from: '2024-12-27T00:00:00Z',
//   to: '2024-12-27T23:59:59Z'
// }
```

### Parsing API Responses

```javascript
import { parseISO, format, formatDistance } from 'date-fns';

function formatApiRecord(record) {
  return {
    id: record.id,
    created: format(parseISO(record.createdAt), 'PPPP'),
    updated: format(parseISO(record.updatedAt), 'PPPP'),
    age: formatDistance(parseISO(record.createdAt), new Date(), {
      addSuffix: true,
    }),
  };
}

const apiResponse = {
  id: '123',
  createdAt: '2024-12-15T10:30:00.000Z',
  updatedAt: '2024-12-27T16:45:00.000Z',
};

formatApiRecord(apiResponse);
//=> {
//   id: '123',
//   created: 'Sunday, December 15, 2024',
//   updated: 'Friday, December 27, 2024',
//   age: '12 days ago'
// }
```

---

## Guide 7: Schedule & Meeting Finder

### Find Available Slots

```javascript
import { eachHourOfInterval, isWithinInterval, addHours, startOfDay, endOfDay } from 'date-fns';

function findAvailableSlots(date, busyIntervals, slotDuration = 60) {
  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);
  
  const allSlots = eachHourOfInterval({
    start: dayStart,
    end: dayEnd,
  }).map(slot => ({
    start: slot,
    end: addHours(slot, slotDuration / 60),
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
//=> Array of available one-hour slots
```

### Meeting Duration

```javascript
import { differenceInMinutes, format } from 'date-fns';

function formatMeetingDuration(start, end) {
  const minutes = differenceInMinutes(end, start);
  
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  return mins > 0 
    ? `${hours}h ${mins}m`
    : `${hours}h`;
}

const start = new Date(2024, 11, 27, 9, 0);
const end = new Date(2024, 11, 27, 10, 45);

formatMeetingDuration(start, end);
//=> "1h 45m"
```

---

## Guide 8: Performance Optimization

### Memoize Format Functions

```javascript
import { format } from 'date-fns';

function createFormatter(pattern, locale) {
  return (date) => format(date, pattern, { locale });
}

// Create once, reuse many times
const formatAsISO = createFormatter('yyyy-MM-dd');
const formatAsDisplay = createFormatter('PPPP');

// Efficient reuse
console.log(formatAsISO(new Date()));      // "2024-12-27"
console.log(formatAsDisplay(new Date()));  // "Friday, December 27, 2024"
```

### Cache Locale Objects

```javascript
import * as locales from 'date-fns/locale';

const localeCache = {};

function getCachedLocale(code) {
  if (!localeCache[code]) {
    localeCache[code] = locales[code];
  }
  return localeCache[code];
}

// First call creates cache
getCachedLocale('fr'); // Creates entry

// Subsequent calls use cache
getCachedLocale('fr'); // Returns cached
```

---

## Common Patterns Summary

| Problem | Solution |
|---------|----------|
| **Validate user input** | Use `parse()` + `isValid()` |
| **Format dates** | Use `format()` with locale |
| **Compare dates** | Use `isBefore()`, `isAfter()`, `isSameDay()` |
| **Calculate differences** | Use `difference*()` functions |
| **Add/subtract time** | Use `add*()` and `sub*()` functions |
| **Handle timezones** | Use `TZDate` and `utcToZonedTime()` |
| **Localize output** | Pass `locale` option to functions |
| **Find time slots** | Use `isWithinInterval()` and loops |
| **Work with month ends** | Use `getDaysInMonth()` for validation |

---

## Module Navigation

- **All API modules:** `03-api-formatting.md`, `04-api-manipulation.md`, `05-api-query.md`, `06-api-advanced.md`
- **Localization:** `07-locales-i18n.md`
- 📍 **You are here:** Practical Guides & Recipes (08-practical-guides.md)
- **Complete index:** `00-master-index.md`

---

**Version:** 4.1.0 | **Source:** https://date-fns.org/v4.1.0/docs/Getting-Started