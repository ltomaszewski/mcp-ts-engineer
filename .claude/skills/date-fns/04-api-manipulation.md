# API: Manipulation Functions — date-fns v4.1.0

## add() — Generic Date Addition

**Purpose:** Add specified amount of time to a date.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/add/index.ts

### Signature

```typescript
function add(
  date: Date | number,
  duration: Duration,
  options?: OptionsWithTZ
): Date
```

### Duration Object

```typescript
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

### Code Examples

```javascript
import { add, format } from 'date-fns';

const date = new Date(2024, 11, 27);

// Single unit addition
add(date, { days: 5 });      // +5 days
add(date, { months: 1 });    // +1 month
add(date, { years: 1 });     // +1 year
add(date, { hours: 3 });     // +3 hours

// Multiple units
const result = add(date, {
  years: 1,
  months: 2,
  days: 5,
  hours: 3,
  minutes: 15,
});

console.log(format(result, 'PPPP, pp'));
//=> "Monday, March 03, 2026, 3:15 PM"
```

---

## sub() — Generic Date Subtraction

**Purpose:** Subtract specified amount of time from a date.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/sub/index.ts

```javascript
import { sub, format } from 'date-fns';

const date = new Date(2024, 11, 27);

sub(date, { days: 3 });           // -3 days
sub(date, { months: 6 });         // -6 months
sub(date, { days: 7, hours: 2 }); // -7 days and 2 hours

const past = sub(date, { 
  years: 1,
  months: 1,
  days: 1,
});

console.log(format(past, 'PPPP'));
//=> "Saturday, November 26, 2023"
```

---

## addDays() & subDays() — Day Arithmetic

**Source:** https://github.com/date-fns/date-fns/blob/main/src/addDays/index.ts

```javascript
import { addDays, subDays, format } from 'date-fns';

const date = new Date(2024, 11, 27);

addDays(date, 1);   // Tomorrow
addDays(date, 7);   // Next week
subDays(date, 3);   // 3 days ago

console.log(format(addDays(date, 5), 'PPPP'));
//=> "Wednesday, January 01, 2025"
```

---

## addMonths() & subMonths() — Month Arithmetic

**Source:** https://github.com/date-fns/date-fns/blob/main/src/addMonths/index.ts

```javascript
import { addMonths, subMonths, format } from 'date-fns';

const date = new Date(2024, 0, 31); // Jan 31

addMonths(date, 1);  // Feb 29, 2024 (leap year, adjusted)
addMonths(date, 2);  // Mar 31
subMonths(date, 1);  // Dec 31, 2023

// Month-end handling
const endOfMonth = new Date(2024, 0, 31);
const nextMonth = addMonths(endOfMonth, 1);
console.log(format(nextMonth, 'yyyy-MM-dd'));
//=> "2024-02-29" (leap year)
```

---

## addYears() & subYears() — Year Arithmetic

**Source:** https://github.com/date-fns/date-fns/blob/main/src/addYears/index.ts

```javascript
import { addYears, subYears, format } from 'date-fns';

const date = new Date(2024, 1, 29); // Feb 29 (leap year)

addYears(date, 1);   // Feb 28, 2025 (not leap year)
addYears(date, 4);   // Feb 29, 2028 (leap year)
subYears(date, 1);   // Feb 29, 2023 (leap year)

console.log(format(addYears(date, 1), 'yyyy-MM-dd'));
//=> "2025-02-28" (adjusted)
```

---

## setYear() — Set Year

**Source:** https://github.com/date-fns/date-fns/blob/main/src/setYear/index.ts

```javascript
import { setYear, format } from 'date-fns';

const date = new Date(2024, 11, 27);

setYear(date, 2025); // Change to 2025
setYear(date, 2000); // Y2K

console.log(format(setYear(date, 2026), 'PPPP'));
//=> "Saturday, December 27, 2026"
```

---

## setMonth() — Set Month

**Source:** https://github.com/date-fns/date-fns/blob/main/src/setMonth/index.ts

```javascript
import { setMonth, format } from 'date-fns';

const date = new Date(2024, 11, 27); // December

setMonth(date, 0);   // January
setMonth(date, 5);   // June
setMonth(date, 11);  // December

console.log(format(setMonth(date, 5), 'MMMM yyyy'));
//=> "June 2024"
```

---

## setDate() — Set Day of Month

**Source:** https://github.com/date-fns/date-fns/blob/main/src/setDate/index.ts

```javascript
import { setDate, format } from 'date-fns';

const date = new Date(2024, 11, 27);

setDate(date, 1);    // First of month
setDate(date, 15);   // Fifteenth
setDate(date, 31);   // Last day

console.log(format(setDate(date, 1), 'PPPP'));
//=> "Friday, December 01, 2024"
```

---

## startOfDay() through startOfYear()

**Purpose:** Set a date to the beginning of a specified period.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/startOfDay/index.ts

```javascript
import { startOfDay, startOfMonth, startOfYear, startOfWeek, format } from 'date-fns';

const date = new Date(2024, 11, 27, 15, 30, 45);

// Start of day: 00:00:00
startOfDay(date);
//=> Fri Dec 27 2024 00:00:00

// Start of month: First day, 00:00:00
startOfMonth(date);
//=> Fri Dec 01 2024 00:00:00

// Start of year: Jan 1, 00:00:00
startOfYear(date);
//=> Mon Jan 01 2024 00:00:00

// Start of week: Sunday (default), 00:00:00
startOfWeek(date);
//=> Sun Dec 22 2024 00:00:00
```

---

## endOfDay() through endOfYear()

**Purpose:** Set a date to the end of a specified period.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/endOfDay/index.ts

```javascript
import { endOfDay, endOfMonth, endOfYear, endOfWeek, format } from 'date-fns';

const date = new Date(2024, 11, 27, 10, 30);

// End of day: 23:59:59.999
endOfDay(date);
//=> Fri Dec 27 2024 23:59:59.999

// End of month: Last day, 23:59:59.999
endOfMonth(date);
//=> Tue Dec 31 2024 23:59:59.999

// End of year: Dec 31, 23:59:59.999
endOfYear(date);
//=> Tue Dec 31 2024 23:59:59.999

// End of week: Saturday (with weekStartsOn), 23:59:59.999
endOfWeek(date);
//=> Sat Dec 28 2024 23:59:59.999
```

---

## Common Patterns

### Pattern 1: Date Range Creation

```javascript
import { startOfMonth, endOfMonth } from 'date-fns';

function getMonthRange(date) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

const range = getMonthRange(new Date());
// { start: Dec 1, 00:00, end: Dec 31, 23:59:59 }
```

### Pattern 2: Business Day Calculation

```javascript
import { addDays } from 'date-fns';

function addBusinessDays(date, days) {
  let current = new Date(date);
  let added = 0;
  
  while (added < days) {
    current = addDays(current, 1);
    // 0 = Sunday, 6 = Saturday
    if (current.getDay() !== 0 && current.getDay() !== 6) {
      added++;
    }
  }
  
  return current;
}

addBusinessDays(new Date(2024, 11, 27), 5); // Add 5 business days
```

### Pattern 3: Midnight Timestamp

```javascript
import { startOfDay, getTime } from 'date-fns';

function getMidnightTimestamp(date) {
  return getTime(startOfDay(date));
}

const timestamp = getMidnightTimestamp(new Date());
```

---

## Module Navigation

- **Concepts:** `02-core-concepts.md` (Design philosophy)
- **Formatting:** `03-api-formatting.md` (String ↔ Date conversion)
- 📍 **You are here:** API: Manipulation Functions (04-api-manipulation.md)
- **Query & comparison:** `05-api-query.md`
- **Advanced utilities:** `06-api-advanced.md`
- **Complete index:** `00-master-index.md`

---

**Document Status:** Complete | **Last Updated:** December 27, 2024