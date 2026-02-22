# Setup & Installation — date-fns v4.1.0

## Installation

### NPM

```bash
npm install date-fns --save
```

### Yarn

```bash
yarn add date-fns
```

### PNPM

```bash
pnpm add date-fns
```

**Source:** https://github.com/date-fns/date-fns

---

## Import Patterns

### ES6 Modules (Recommended)

```javascript
// Import specific functions (tree-shakeable)
import { format, addDays, parse } from 'date-fns';

const tomorrow = addDays(new Date(), 1);
const formatted = format(tomorrow, 'yyyy-MM-dd');
console.log(formatted);
```

### CommonJS

```javascript
// Require specific functions
const { format, addDays, parse } = require('date-fns');

const tomorrow = addDays(new Date(), 1);
console.log(format(tomorrow, 'yyyy-MM-dd'));
```

### Default Import (Not Recommended)

```javascript
// This imports the entire library (breaks tree-shaking)
import dateFns from 'date-fns';
dateFns.format(new Date(), 'yyyy-MM-dd');
```

---

## TypeScript Setup

date-fns includes 100% TypeScript type definitions in the package. No additional `@types` package needed.

### Basic TypeScript Usage

```typescript
import { format, addDays, parse, isValid } from 'date-fns';

// Type inference works automatically
const date: Date = new Date();
const formatted: string = format(date, 'yyyy-MM-dd');
const result: Date = addDays(date, 1);

// Parse with type safety
const parsed: Date = parse('2025-12-25', 'yyyy-MM-dd', new Date());

// Validate before use
if (isValid(parsed)) {
  console.log('Valid date:', formatted);
}
```

### Generic Function Types

Some date-fns functions accept generic types:

```typescript
import { parse } from 'date-fns';

interface DateRange {
  startDate: Date;
  endDate: Date;
}

const range: DateRange = {
  startDate: parse('2025-01-01', 'yyyy-MM-dd', new Date()),
  endDate: parse('2025-12-31', 'yyyy-MM-dd', new Date()),
};
```

---

## Locale Setup

### Basic Locale Import

```javascript
// Import locale alongside functions
import { format } from 'date-fns';
import { fr, de, es } from 'date-fns/locale';

const date = new Date(2024, 11, 27); // Dec 27, 2024

// French
console.log(format(date, 'PPPP', { locale: fr }));
//=> "vendredi 27 décembre 2024"

// German
console.log(format(date, 'PPPP', { locale: de }));
//=> "Freitag, 27. Dezember 2024"

// Spanish
console.log(format(date, 'PPPP', { locale: es }));
//=> "viernes, 27 de diciembre de 2024"
```

### Available Locales

date-fns supports 50+ locales. Common ones:

```javascript
import {
  enUS,      // English - United States
  enGB,      // English - Great Britain
  fr,        // French
  de,        // German
  es,        // Spanish
  it,        // Italian
  pt,        // Portuguese
  ru,        // Russian
  ja,        // Japanese
  zhCN,      // Chinese - Simplified
  zhTW,      // Chinese - Traditional
  ko,        // Korean
  ar,        // Arabic
  hi,        // Hindi
  pl,        // Polish
} from 'date-fns/locale';
```

---

## Timezone Support (v4.0+)

### Standard Installation

The core date-fns package includes basic UTC support. For full timezone support, install the timezone package:

```bash
npm install @date-fns/tz --save
```

### Timezone Imports

```javascript
import { TZDate } from '@date-fns/tz';
import { format, addDays } from 'date-fns';

// Create a date in specific timezone
const sgDate = new TZDate(2025, 0, 1, 'Asia/Singapore');
console.log(format(sgDate, 'yyyy-MM-dd HH:mm:ss'));

// Add days maintains timezone
const nextDay = addDays(sgDate, 1);
console.log(format(nextDay, 'yyyy-MM-dd HH:mm:ss'));
```

---

## Build Tool Configuration

### Webpack

No configuration needed. date-fns supports tree-shaking automatically.

```javascript
// webpack.config.js
module.exports = {
  mode: 'production', // Enable tree-shaking
  entry: './src/index.js',
  // ...
};
```

### Vite

```javascript
// vite.config.js
export default {
  // Tree-shaking works out of the box
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'date-fns': ['date-fns'], // Optional: separate chunk
        },
      },
    },
  },
};
```

### Next.js

```javascript
// next.config.js - No special config needed
module.exports = {
  // date-fns works with automatic tree-shaking
};
```

---

## Version Compatibility

| Node.js | Support |
|---------|---------|
| 14.x | ✅ Yes |
| 16.x | ✅ Yes |
| 18.x | ✅ Yes (LTS) |
| 20.x | ✅ Yes (LTS) |

| Browser | Support |
|---------|---------|
| Chrome | ✅ Modern versions |
| Firefox | ✅ Modern versions |
| Safari | ✅ Modern versions (15+) |
| Edge | ✅ Chromium-based |

---

## Checking Your Installation

### Verify Installation

```javascript
import { format } from 'date-fns';

const testDate = new Date(2024, 11, 27);
console.log(format(testDate, 'yyyy-MM-dd'));
//=> "2024-12-27"

console.log('✅ date-fns is working!');
```

### Check Installed Version

```bash
npm list date-fns
```

Or in your code:

```javascript
// For package.json inspection
import pkg from 'date-fns/package.json' assert { type: 'json' };
console.log('date-fns version:', pkg.version);
```

---

## Module Navigation

- 📍 **You are here:** Setup & Installation (01-setup-installation.md)
- **Next:** Read `02-core-concepts.md` to understand design philosophy
- **Then:** Choose an API module: `03-api-formatting.md`, `04-api-manipulation.md`, `05-api-query.md`, or `06-api-advanced.md`
- **For patterns:** See `08-practical-guides.md` for real-world examples
- **For locales:** See `07-locales-i18n.md` for internationalization
- **Complete index:** See `00-master-index.md` for full module guide

---

**Version:** 4.1.0 | **Source:** https://date-fns.org/v4.1.0/docs/Getting-Started