# API: Formatting & Parsing — date-fns v4.1.0

## format() — Formatting Dates to Strings

**Purpose:** Convert JavaScript Date objects to formatted strings using pattern tokens.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/format/index.ts

### Signature

```typescript
function format(
  date: Date | number,
  format: string,
  options?: OptionsWithTZ
): string
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | `Date \| number` | Yes | The date to format. Can be Date object or Unix timestamp (ms) |
| `format` | `string` | Yes | Pattern string with tokens (e.g., `'yyyy-MM-dd'`) |
| `options` | `OptionsWithTZ` | No | Configuration object |

### Format Tokens

#### Year
- `yy` — 2-digit year (24)
- `yyyy` — 4-digit year (2024)

#### Month
- `M` — Month 1-12 (1, 12)
- `MM` — Month zero-padded (01, 12)
- `MMM` — Month abbreviated (Jan, Dec)
- `MMMM` — Month full name (January, December)

#### Day
- `d` — Day of month 1-31 (1, 27)
- `dd` — Day zero-padded (01, 27)
- `do` — Day with ordinal (1st, 27th)

#### Weekday
- `E` — Day name 3-letter (Fri)
- `EEEE` — Day name full (Friday)

#### Hour/Minute/Second
- `H` — Hour 0-23 (0, 15)
- `HH` — Hour zero-padded (00, 15)
- `h` — Hour 1-12 (1, 3)
- `hh` — Hour zero-padded (01, 03)
- `m` — Minute (0-59)
- `mm` — Minute zero-padded
- `s` — Second (0-59)
- `ss` — Second zero-padded

#### Preset Formats
- `P` — Localized date (12/27/2024)
- `PP` — Localized date (Dec 27, 2024)
- `PPP` — Localized date (December 27, 2024)
- `PPPP` — Full date with day (Friday, December 27, 2024)
- `p` — Localized time (3:30 PM)
- `pp` — Localized time with seconds (3:30:45 PM)

### Code Examples

#### Basic Formatting

```javascript
import { format } from 'date-fns';

const date = new Date(2024, 11, 27, 15, 30, 45);

// ISO format
console.log(format(date, 'yyyy-MM-dd'));
//=> "2024-12-27"

// US format
console.log(format(date, 'MM/dd/yyyy'));
//=> "12/27/2024"

// Full date and time
console.log(format(date, 'PPPP, pp'));
//=> "Friday, December 27, 2024, 3:30:45 PM"

// ISO with time
console.log(format(date, "yyyy-MM-dd'T'HH:mm:ss"));
//=> "2024-12-27T15:30:45"
```

#### With Locale

```javascript
import { format } from 'date-fns';
import { fr, de, es } from 'date-fns/locale';

const date = new Date(2024, 11, 27);

console.log(format(date, 'PPPP', { locale: fr }));
//=> "vendredi 27 décembre 2024"

console.log(format(date, 'PPPP', { locale: de }));
//=> "Freitag, 27. Dezember 2024"

console.log(format(date, 'PPPP', { locale: es }));
//=> "viernes, 27 de diciembre de 2024"
```

---

## parse() — Parsing Strings to Dates

**Purpose:** Convert formatted strings back to Date objects using a pattern.

**Source:** https://github.com/date-fns/date-fns/blob/main/src/parse/index.ts

### Signature

```typescript
function parse(
  dateString: string,
  formatString: string,
  referenceDate: Date | number,
  options?: ParseOptions
): Date
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateString` | `string` | Yes | Date string to parse |
| `formatString` | `string` | Yes | Pattern describing the input format |
| `referenceDate` | `Date \| number` | Yes | Reference date for missing values |
| `options` | `ParseOptions` | No | Configuration object |

### Code Examples

#### Basic Parsing

```javascript
import { parse, isValid } from 'date-fns';

const dateString = '2024-12-27';
const referenceDate = new Date();

const parsed = parse(dateString, 'yyyy-MM-dd', referenceDate);

if (isValid(parsed)) {
  console.log(parsed);
  //=> Fri Dec 27 2024 00:00:00
} else {
  console.error('Invalid date format');
}
```

#### Different Formats

```javascript
import { parse } from 'date-fns';

const ref = new Date();

// ISO format
parse('2024-12-27', 'yyyy-MM-dd', ref);

// US format
parse('12/27/2024', 'MM/dd/yyyy', ref);

// European format
parse('27.12.2024', 'dd.MM.yyyy', ref);

// With time
parse('2024-12-27 15:30:45', 'yyyy-MM-dd HH:mm:ss', ref);

// 12-hour format
parse('03:30 PM', 'hh:mm a', ref);
```

---

## parseISO() — Parsing ISO 8601 Strings

**Purpose:** Parse ISO 8601 date strings (fast, optimized).

**Source:** https://github.com/date-fns/date-fns/blob/main/src/parseISO/index.ts

### Signature

```typescript
function parseISO(
  argument: string | number,
  options?: ParseISOOptions
): Date
```

### Code Examples

```javascript
import { parseISO, format } from 'date-fns';

// Full ISO 8601
parseISO('2024-12-27T15:30:45.123Z');
//=> Fri Dec 27 2024 15:30:45 GMT

// Date only
parseISO('2024-12-27');
//=> Fri Dec 27 2024 00:00:00 (local time)

// With timezone offset
parseISO('2024-12-27T15:30:45+05:30');
//=> Adjusted for timezone

// API response parsing
const apiResponse = { createdAt: '2024-12-27T15:30:45.123Z' };
const date = parseISO(apiResponse.createdAt);
console.log(format(date, 'PPPP'));
//=> "Friday, December 27, 2024"
```

---

## formatDistance() — Relative Time Formatting

**Purpose:** Format dates as relative distances ("3 days ago", "in 2 weeks").

**Source:** https://github.com/date-fns/date-fns/blob/main/src/formatDistance/index.ts

### Signature

```typescript
function formatDistance(
  date: Date | number,
  baseDate?: Date | number,
  options?: FormatDistanceOptions
): string
```

### Options

```typescript
interface FormatDistanceOptions {
  includeSeconds?: boolean;  // Include seconds (default: false)
  addSuffix?: boolean;       // Add "ago" or "in" (default: false)
  locale?: Locale;
}
```

### Code Examples

#### Basic Distance

```javascript
import { formatDistance, subDays, addDays } from 'date-fns';

const now = new Date();

formatDistance(subDays(now, 3), now);
//=> "3 days"

formatDistance(addDays(now, 7), now);
//=> "7 days"

formatDistance(now, now);
//=> "0 seconds"
```

#### With Suffix

```javascript
import { formatDistance, subDays, addDays } from 'date-fns';

const now = new Date();

formatDistance(subDays(now, 3), now, { addSuffix: true });
//=> "3 days ago"

formatDistance(addDays(now, 7), now, { addSuffix: true });
//=> "in 7 days"
```

---

## formatRelative() — Semantic Relative Formatting

**Purpose:** Format dates semantically ("last Friday", "tomorrow", "next Monday").

**Source:** https://github.com/date-fns/date-fns/blob/main/src/formatRelative/index.ts

### Code Examples

```javascript
import { formatRelative, subDays, addDays } from 'date-fns';

const now = new Date(2024, 11, 27, 12, 0, 0); // Friday noon

formatRelative(subDays(now, 2), now);
//=> "Wednesday at 12:00 PM"

formatRelative(now, now);
//=> "Today at 12:00 PM"

formatRelative(addDays(now, 1), now);
//=> "Tomorrow at 12:00 PM"

formatRelative(addDays(now, 3), now);
//=> "Sunday at 12:00 PM"
```

---

## Common Patterns

### Pattern 1: Input Validation

```javascript
import { parse, isValid, format } from 'date-fns';

function safeFormat(dateString, formatStr, outputFormat) {
  const parsed = parse(dateString, formatStr, new Date());
  
  if (!isValid(parsed)) {
    console.error(`Invalid date: ${dateString}`);
    return null;
  }
  
  return format(parsed, outputFormat);
}

safeFormat('2024-12-27', 'yyyy-MM-dd', 'PPPP');
//=> "Friday, December 27, 2024"
```

### Pattern 2: Format String Reusability

```javascript
import { format } from 'date-fns';

// Define formats as constants
const FORMATS = {
  ISO: 'yyyy-MM-dd',
  US: 'MM/dd/yyyy',
  DISPLAY: 'PPPP',
  TIME: 'HH:mm:ss',
  FULL: 'PPPP, pp',
};

const date = new Date();

console.log(format(date, FORMATS.ISO));
console.log(format(date, FORMATS.DISPLAY));
console.log(format(date, FORMATS.FULL));
```

---

## Module Navigation

- **Start here:** `01-setup-installation.md` (Installation)
- **Concepts:** `02-core-concepts.md` (Design philosophy)
- 📍 **You are here:** API: Formatting & Parsing (03-api-formatting.md)
- **Related APIs:** `04-api-manipulation.md`, `05-api-query.md`, `06-api-advanced.md`
- **For locales:** `07-locales-i18n.md` (Internationalization)
- **Complete index:** `00-master-index.md`

---

**Document Status:** Complete | **Last Updated:** December 27, 2024