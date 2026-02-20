# API: Query & Comparison Functions — date-fns v4.1.0

## isValid() — Validate Date

**Purpose:** Check if a value is a valid Date object.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/isValid/index.ts

### Signature

```typescript
function isValid(date: unknown): boolean
```

### Code Examples

```javascript
import { isValid } from 'date-fns';

// Valid dates
isValid(new Date());                    // true
isValid(new Date(2024, 11, 27));       // true
isValid(new Date('2024-12-27'));       // true (if valid string)

// Invalid dates
isValid(new Date('invalid'));          // false
isValid(new Date(NaN));                // false
isValid('2024-12-27');                 // false (string, not Date)
isValid(null);                          // false
isValid(undefined);                     // false

// Safe parsing pattern
import { parse } from 'date-fns';

const parsed = parse('2024-12-27', 'yyyy-MM-dd', new Date());
if (isValid(parsed)) {
  console.log('Valid date');
} else {
  console.error('Invalid date format');
}
```

---

## isBefore() — Date A Before Date B?

**Source:** https://github.com/date-fns/date-fns/blob/main/src/isBefore/index.ts

```javascript
import { isBefore, subDays } from 'date-fns';

const date = new Date(2024, 11, 27);
const earlier = subDays(date, 5);

isBefore(earlier, date);     // true
isBefore(date, earlier);     // false
isBefore(date, date);        // false (equal, not before)
```

---

## isAfter() — Date A After Date B?

**Source:** https://github.com/date-fns/date-fns/blob/main/src/isAfter/index.ts

```javascript
import { isAfter, addDays } from 'date-fns';

const date = new Date(2024, 11, 27);
const later = addDays(date, 5);

isAfter(later, date);        // true
isAfter(date, later);        // false
isAfter(date, date);         // false (equal, not after)
```

---

## isSameDay() — Same Day?

**Source:** https://github.com/date-fns/date-fns/blob/main/src/isSameDay/index.ts

```javascript
import { isSameDay } from 'date-fns';

const date1 = new Date(2024, 11, 27, 8, 0, 0);
const date2 = new Date(2024, 11, 27, 20, 30, 0);
const date3 = new Date(2024, 11, 28, 8, 0, 0);

isSameDay(date1, date2);     // true (same day, different times)
isSameDay(date1, date3);     // false (different days)
isSameDay(date1, date1);     // true
```

---

## isSameMonth() & isSameYear() & isSameQuarter()

**Source:** https://github.com/date-fns/date-fns/blob/main/src/isSameMonth/index.ts

```javascript
import { isSameMonth, isSameYear, isSameQuarter } from 'date-fns';

const date1 = new Date(2024, 0, 15);
const date2 = new Date(2024, 0, 31);
const date3 = new Date(2024, 1, 15);
const date4 = new Date(2025, 0, 15);

isSameMonth(date1, date2);     // true (both January 2024)
isSameMonth(date1, date3);     // false (different months)

isSameYear(date1, date3);      // true (both 2024)
isSameYear(date1, date4);      // false (different years)

isSameQuarter(date1, date2);   // true (both Q1)
```

---

## isWeekend() — Is Date a Weekend?

**Source:** https://github.com/date-fns/date-fns/blob/main/src/isWeekend/index.ts

```javascript
import { isWeekend, addDays } from 'date-fns';

const friday = new Date(2024, 11, 27);
const saturday = addDays(friday, 1);
const monday = addDays(friday, 3);

isWeekend(friday);           // false
isWeekend(saturday);         // true
isWeekend(monday);           // false
```

---

## getYear() — Get Year

**Source:** https://github.com/date-fns/date-fns/blob/main/src/getYear/index.ts

```javascript
import { getYear } from 'date-fns';

getYear(new Date(2024, 11, 27));  // 2024
getYear(new Date(2025, 0, 1));    // 2025
```

---

## getMonth() — Get Month (0-11)

**Source:** https://github.com/date-fns/date-fns/blob/main/src/getMonth/index.ts

```javascript
import { getMonth } from 'date-fns';

getMonth(new Date(2024, 0, 15));   // 0 (January)
getMonth(new Date(2024, 11, 25));  // 11 (December)
```

---

## getDate() — Get Day of Month

**Source:** https://github.com/date-fns/date-fns/blob/main/src/getDate/index.ts

```javascript
import { getDate } from 'date-fns';

getDate(new Date(2024, 11, 27));  // 27
getDate(new Date(2024, 11, 1));   // 1
```

---

## getDay() — Get Weekday (0=Sunday)

**Source:** https://github.com/date-fns/date-fns/blob/main/src/getDay/index.ts

```javascript
import { getDay } from 'date-fns';

getDay(new Date(2024, 11, 27));   // 5 (Friday)
getDay(new Date(2024, 11, 28));   // 6 (Saturday)
getDay(new Date(2024, 11, 29));   // 0 (Sunday)
```

---

## getDaysInMonth() — Days in Month

**Source:** https://github.com/date-fns/date-fns/blob/main/src/getDaysInMonth/index.ts

```javascript
import { getDaysInMonth } from 'date-fns';

getDaysInMonth(new Date(2024, 0));   // 31 (January)
getDaysInMonth(new Date(2024, 1));   // 29 (February, leap year)
getDaysInMonth(new Date(2023, 1));   // 28 (February, non-leap)
getDaysInMonth(new Date(2024, 3));   // 30 (April)
```

---

## differenceInDays() — Difference in Days

**Source:** https://github.com/date-fns/date-fns/blob/main/src/differenceInDays/index.ts

```javascript
import { differenceInDays, addDays } from 'date-fns';

const date1 = new Date(2024, 11, 27);
const date2 = addDays(date1, 5);

differenceInDays(date2, date1);   // 5
differenceInDays(date1, date2);   // -5 (order matters)
```

---

## differenceInMonths() & differenceInYears()

**Source:** https://github.com/date-fns/date-fns/blob/main/src/differenceInMonths/index.ts

```javascript
import { differenceInMonths, differenceInYears, addMonths, addYears } from 'date-fns';

const date1 = new Date(2024, 0, 15);
const date2 = addYears(date1, 2);

differenceInYears(date2, date1);   // 2

const date3 = addMonths(date1, 6);
differenceInMonths(date3, date1);  // 6
```

---

## compareAsc() & compareDesc() — Sorting

**Source:** https://github.com/date-fns/date-fns/blob/main/src/compareAsc/index.ts

```typescript
function compareAsc(dateLeft: Date | number, dateRight: Date | number): -1 | 0 | 1
function compareDesc(dateLeft: Date | number, dateRight: Date | number): -1 | 0 | 1
```

### Code Examples

```javascript
import { compareAsc, compareDesc } from 'date-fns';

const dates = [
  new Date(1995, 6, 2),
  new Date(1987, 1, 11),
  new Date(1989, 6, 10),
];

// Ascending
dates.sort(compareAsc);
//=> [Feb 11 1987, Jul 10 1989, Jul 2 1995]

// Descending
dates.sort(compareDesc);
//=> [Jul 2 1995, Jul 10 1989, Feb 11 1987]
```

---

## Common Query Patterns

### Pattern 1: Age Calculation

```javascript
import { differenceInYears } from 'date-fns';

function getAge(birthDate) {
  return differenceInYears(new Date(), birthDate);
}

getAge(new Date(1990, 5, 15));  // Age based on birthdate
```

### Pattern 2: Business Hours Check

```javascript
import { getHours } from 'date-fns';

function isBusinessHours(date) {
  const hour = getHours(date);
  const day = date.getDay();
  
  return hour >= 9 && hour < 17 && day > 0 && day < 6;
}
```

### Pattern 3: Future Event Check

```javascript
import { isFuture, addDays, differenceInDays } from 'date-fns';

function isUpcomingEvent(date) {
  const daysUntil = differenceInDays(date, new Date());
  return isFuture(date) && daysUntil <= 30;
}
```

---

## Module Navigation

- **Formatting:** `03-api-formatting.md` (String ↔ Date conversion)
- **Manipulation:** `04-api-manipulation.md` (Date arithmetic)
- 📍 **You are here:** API: Query & Comparison (05-api-query.md)
- **Advanced utilities:** `06-api-advanced.md`
- **Practical patterns:** `08-practical-guides.md`
- **Complete index:** `00-master-index.md`

---

**Document Status:** Complete | **Last Updated:** December 27, 2024