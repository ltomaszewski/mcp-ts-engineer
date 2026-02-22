# API: Formatting & Parsing -- date-fns v4.1.0

> Convert between Date objects and formatted strings. Includes complete format token reference.

**Source:** https://date-fns.org/docs/format

---

## format() -- Date to String

### Signature

```typescript
function format(date: Date | number, formatStr: string, options?: FormatOptions): string
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `date` | `Date \| number` | Yes | Date to format |
| `formatStr` | `string` | Yes | Pattern string with Unicode tokens |
| `options.locale` | `Locale` | No | Locale object |
| `options.weekStartsOn` | `0-6` | No | First day of week (0=Sunday) |
| `options.firstWeekContainsDate` | `1-7` | No | Day that defines first week of year |

---

## Complete Format Token Table

### Year

| Token | Output | Example |
|-------|--------|---------|
| `y` | Calendar year (min digits) | `2`, `26`, `2026` |
| `yy` | 2-digit year | `26` |
| `yyyy` | 4-digit year | `2026` |

### Month

| Token | Output | Example |
|-------|--------|---------|
| `M` | Month (1-12) | `1`, `12` |
| `MM` | Month zero-padded | `01`, `12` |
| `MMM` | Abbreviated name | `Jan`, `Dec` |
| `MMMM` | Full name | `January`, `December` |
| `MMMMM` | Narrow | `J`, `D` |

### Day of Month

| Token | Output | Example |
|-------|--------|---------|
| `d` | Day (1-31) | `1`, `27` |
| `dd` | Day zero-padded | `01`, `27` |
| `do` | Ordinal | `1st`, `27th` |

### Day of Week

| Token | Output | Example |
|-------|--------|---------|
| `E` | Abbreviated name | `Mon`, `Fri` |
| `EE` | Abbreviated name | `Mon`, `Fri` |
| `EEE` | Abbreviated name | `Mon`, `Fri` |
| `EEEE` | Full name | `Monday`, `Friday` |
| `EEEEE` | Narrow | `M`, `F` |
| `EEEEEE` | Short | `Mo`, `Fr` |
| `e` | Local day (1-7) | `2` (Mon if week starts Sun) |
| `i` | ISO day (1=Mon, 7=Sun) | `1`, `5` |

### AM/PM

| Token | Output | Example |
|-------|--------|---------|
| `a` | AM/PM | `AM`, `PM` |
| `aa` | AM/PM | `AM`, `PM` |
| `aaa` | am/pm | `am`, `pm` |
| `aaaa` | a.m./p.m. | `a.m.`, `p.m.` |

### Hour

| Token | Output | Example |
|-------|--------|---------|
| `h` | Hour 1-12 | `1`, `12` |
| `hh` | Hour 1-12 padded | `01`, `12` |
| `H` | Hour 0-23 | `0`, `23` |
| `HH` | Hour 0-23 padded | `00`, `23` |

### Minute / Second / Fraction

| Token | Output | Example |
|-------|--------|---------|
| `m` | Minute (0-59) | `0`, `59` |
| `mm` | Minute padded | `00`, `59` |
| `s` | Second (0-59) | `0`, `59` |
| `ss` | Second padded | `00`, `59` |
| `S` | Fraction (1/10 sec) | `1` |
| `SS` | Fraction (1/100 sec) | `12` |
| `SSS` | Milliseconds | `123` |

### Timezone

| Token | Output | Example |
|-------|--------|---------|
| `x` | Offset (+HHmm) | `+0530` |
| `xx` | Offset (+HH:mm) | `+05:30` |
| `xxx` | Offset (+HH:mm) | `+05:30` |
| `X` | Offset (Z for UTC) | `Z`, `+05` |
| `O` | Short GMT offset | `GMT+5` |
| `OOOO` | Full GMT offset | `GMT+05:30` |

### Localized Presets

| Token | Output | Example (en-US) |
|-------|--------|-----------------|
| `P` | Short date | `12/27/2024` |
| `PP` | Medium date | `Dec 27, 2024` |
| `PPP` | Long date | `December 27, 2024` |
| `PPPP` | Full date | `Friday, December 27, 2024` |
| `p` | Short time | `3:30 PM` |
| `pp` | Medium time | `3:30:45 PM` |
| `Pp` | Date + time | `12/27/2024, 3:30 PM` |
| `PPp` | Medium date + time | `Dec 27, 2024, 3:30 PM` |
| `PPPp` | Long date + time | `December 27, 2024 at 3:30 PM` |

### Dangerous Tokens (Common Mistakes)

| Wrong | Right | Why |
|-------|-------|-----|
| `YYYY` | `yyyy` | `YYYY` = ISO week-numbering year, not calendar year |
| `DD` | `dd` | `DD` = day of year (1-366), not day of month |
| `D` | `d` | Same issue: day of year vs day of month |

---

### Code Examples

```typescript
import { format } from 'date-fns';

const date = new Date(2026, 0, 25, 14, 30, 45);

format(date, 'yyyy-MM-dd');                // "2026-01-25"
format(date, 'MM/dd/yyyy');                // "01/25/2026"
format(date, 'PPPP');                      // "Sunday, January 25, 2026"
format(date, 'PPp');                       // "Jan 25, 2026, 2:30 PM"
format(date, "yyyy-MM-dd'T'HH:mm:ss");    // "2026-01-25T14:30:45"
format(date, 'EEEE, MMMM do yyyy');       // "Sunday, January 25th 2026"
format(date, 'HH:mm:ss.SSS');             // "14:30:45.000"
format(date, 'h:mm a');                    // "2:30 PM"
```

### With Locale

```typescript
import { format } from 'date-fns';
import { fr, de, ja } from 'date-fns/locale';

const date = new Date(2026, 0, 25);

format(date, 'PPPP', { locale: fr });  // "dimanche 25 janvier 2026"
format(date, 'PPPP', { locale: de });  // "Sonntag, 25. Januar 2026"
format(date, 'PPPP', { locale: ja });  // "2026年1月25日日曜日"
```

---

## parse() -- String to Date

### Signature

```typescript
function parse(dateString: string, formatString: string, referenceDate: Date | number, options?: ParseOptions): Date
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateString` | `string` | Yes | String to parse |
| `formatString` | `string` | Yes | Pattern matching the string |
| `referenceDate` | `Date \| number` | Yes | Reference for missing components |
| `options.locale` | `Locale` | No | Locale for parsing |

```typescript
import { parse, isValid } from 'date-fns';

const ref = new Date();
parse('2026-01-25', 'yyyy-MM-dd', ref);             // Sun Jan 25 2026
parse('01/25/2026', 'MM/dd/yyyy', ref);              // Sun Jan 25 2026
parse('25.01.2026', 'dd.MM.yyyy', ref);              // Sun Jan 25 2026
parse('2026-01-25 14:30:45', 'yyyy-MM-dd HH:mm:ss', ref);
parse('03:30 PM', 'hh:mm a', ref);

// Always validate
const parsed = parse(userInput, 'yyyy-MM-dd', new Date());
if (!isValid(parsed)) { /* handle invalid */ }
```

---

## parseISO() -- Parse ISO 8601

### Signature

```typescript
function parseISO(dateString: string, options?: ParseISOOptions): Date
```

```typescript
import { parseISO, format } from 'date-fns';

parseISO('2026-01-25T14:30:45.123Z');    // full ISO with ms
parseISO('2026-01-25');                   // date only
parseISO('2026-01-25T14:30:45+05:30');   // with offset
```

---

## formatDistance() -- Relative Time

### Signature

```typescript
function formatDistance(date: Date | number, baseDate: Date | number, options?: FormatDistanceOptions): string
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `addSuffix` | `boolean` | `false` | Add "ago" or "in" prefix/suffix |
| `includeSeconds` | `boolean` | `false` | Include seconds for small intervals |
| `locale` | `Locale` | `enUS` | Locale for output |

```typescript
import { formatDistance, subDays, addHours } from 'date-fns';

const now = new Date();
formatDistance(subDays(now, 3), now);                          // "3 days"
formatDistance(subDays(now, 3), now, { addSuffix: true });    // "3 days ago"
formatDistance(addHours(now, 2), now, { addSuffix: true });   // "in about 2 hours"
```

---

## formatDistanceToNow() -- Relative to Now

Shorthand for `formatDistance(date, new Date())`.

```typescript
import { formatDistanceToNow, subMinutes } from 'date-fns';

formatDistanceToNow(subMinutes(new Date(), 15), { addSuffix: true });
// "15 minutes ago"
```

---

## formatDuration() -- Duration to String

### Signature

```typescript
function formatDuration(duration: Duration, options?: FormatDurationOptions): string
```

| Option | Type | Description |
|--------|------|-------------|
| `format` | `string[]` | Units to include (default: all non-zero) |
| `zero` | `boolean` | Include zero values (default: false) |
| `delimiter` | `string` | Separator between parts (default: space) |
| `locale` | `Locale` | Locale for output |

```typescript
import { formatDuration, intervalToDuration } from 'date-fns';

formatDuration({ hours: 2, minutes: 30 });
// "2 hours 30 minutes"

formatDuration({ years: 1, months: 2, days: 3 });
// "1 year 2 months 3 days"

formatDuration({ hours: 1, minutes: 30 }, { format: ['hours', 'minutes'] });
// "1 hour 30 minutes"

// Combined with intervalToDuration
const duration = intervalToDuration({
  start: new Date(2026, 0, 1),
  end: new Date(2026, 3, 15),
});
formatDuration(duration);
// "3 months 14 days"
```

---

## formatRelative() -- Semantic Relative Time

```typescript
import { formatRelative, subDays, addDays } from 'date-fns';

const now = new Date(2026, 0, 25, 12, 0);

formatRelative(subDays(now, 2), now);    // "last Friday at 12:00 PM"
formatRelative(now, now);                 // "today at 12:00 PM"
formatRelative(addDays(now, 1), now);    // "tomorrow at 12:00 PM"
formatRelative(addDays(now, 5), now);    // "Friday at 12:00 PM"
```

---

## Common Patterns

### Reusable Format Constants

```typescript
import { format } from 'date-fns';

const DATE_FORMATS = {
  ISO: 'yyyy-MM-dd',
  US: 'MM/dd/yyyy',
  EU: 'dd/MM/yyyy',
  DISPLAY: 'PPP',
  FULL: 'PPPP',
  TIME_24: 'HH:mm',
  TIME_12: 'h:mm a',
  DATETIME: 'PPp',
  ISO_DATETIME: "yyyy-MM-dd'T'HH:mm:ss",
} as const;

format(new Date(), DATE_FORMATS.ISO);      // "2026-01-25"
format(new Date(), DATE_FORMATS.DATETIME); // "Jan 25, 2026, 2:30 PM"
```

### Safe Format Helper

```typescript
import { parseISO, format, isValid } from 'date-fns';

function safeFormat(isoString: string | null | undefined, fmt: string = 'PPP'): string {
  if (!isoString) return 'N/A';
  const date = parseISO(isoString);
  return isValid(date) ? format(date, fmt) : 'Invalid date';
}
```

---

## Cross-References

- **Manipulation:** `04-api-manipulation.md`
- **Query and comparison:** `05-api-query.md`
- **Intervals and durations:** `06-api-advanced.md`
- **Localization:** `07-locales-i18n.md`
- **Practical recipes:** `08-practical-guides.md`

---

**Version:** 4.1.0 | **Source:** https://date-fns.org/docs/format
