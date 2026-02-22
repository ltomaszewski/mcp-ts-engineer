# Localization & Internationalization — date-fns v4.1.0

## Available Locales (50+)

date-fns includes comprehensive multi-language support:

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
  // ... 35+ more locales
} from 'date-fns/locale';
```

---

## Basic Locale Usage

### Using a Locale

```javascript
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const date = new Date(2024, 11, 27);

// Without locale (English)
console.log(format(date, 'PPPP'));
//=> "Friday, February 22, 2026"

// With French locale
console.log(format(date, 'PPPP', { locale: fr }));
//=> "vendredi 27 décembre 2024"

// With German locale
import { de } from 'date-fns/locale';
console.log(format(date, 'PPPP', { locale: de }));
//=> "Freitag, 27. Dezember 2024"
```

### Other Functions with Locales

```javascript
import { formatDistance, formatRelative } from 'date-fns';
import { fr, es } from 'date-fns/locale';

const past = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

// Distance formatting
formatDistance(past, new Date(), { addSuffix: true, locale: fr });
//=> "il y a 3 jours"

formatDistance(past, new Date(), { addSuffix: true, locale: es });
//=> "hace 3 días"

// Relative formatting
formatRelative(past, new Date(), { locale: fr });
//=> "mercredi à 3:30 PM"
```

---

## Locale-Specific Formatting

### Month Names

```javascript
import { format } from 'date-fns';
import { fr, ja, ar } from 'date-fns/locale';

const date = new Date(2024, 0, 15); // January 15

// French
format(date, 'MMMM yyyy', { locale: fr });
//=> "janvier 2024"

// Japanese
format(date, 'MMMM d', { locale: ja });
//=> "1月 15"

// Arabic
format(date, 'MMMM yyyy', { locale: ar });
//=> "يناير 2024"
```

### Weekday Names

```javascript
import { format } from 'date-fns';
import { de, ru, ko } from 'date-fns/locale';

const friday = new Date(2024, 11, 27);

// German
format(friday, 'EEEE', { locale: de });
//=> "Freitag"

// Russian
format(friday, 'EEEE', { locale: ru });
//=> "пятница"

// Korean
format(friday, 'EEEE', { locale: ko });
//=> "금요일"
```

### Ordinal Numbers

```javascript
import { format } from 'date-fns';
import { enUS, fr, es } from 'date-fns/locale';

const date = new Date(2024, 11, 27);

// English
format(date, 'do MMMM yyyy', { locale: enUS });
//=> "27th December 2024"

// French
format(date, 'do MMMM yyyy', { locale: fr });
//=> "27e décembre 2024"

// Spanish
format(date, 'do MMMM yyyy', { locale: es });
//=> "27.º diciembre 2024"
```

---

## Custom Locale Creation

### Building on Existing Locales

```javascript
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';

// Start from existing locale
const customLocale = {
  ...enUS,
  name: 'custom-english',
  options: {
    ...enUS.options,
    weekStartsOn: 1, // Week starts Monday instead of Sunday
  },
};

// Use it
const date = new Date(2024, 11, 27); // Friday
format(date, 'EEEE', { locale: customLocale });
//=> "Friday"
```

---

## Multi-Locale Application

### Dynamic Locale Selection

```javascript
import { format } from 'date-fns';
import * as locales from 'date-fns/locale';

const LOCALE_MAP = {
  'en-US': 'enUS',
  'en-GB': 'enGB',
  'fr': 'fr',
  'de': 'de',
  'es': 'es',
  'ja': 'ja',
  'zh-CN': 'zhCN',
};

function formatInLocale(date, pattern, userLocale = 'en-US') {
  const localeKey = LOCALE_MAP[userLocale] || 'enUS';
  const locale = locales[localeKey];
  
  return format(date, pattern, { locale });
}

// Usage
formatInLocale(new Date(), 'PPPP', 'fr');  // French
formatInLocale(new Date(), 'PPPP', 'ja');  // Japanese
```

### User Preference Storage

```javascript
// Store in localStorage
function setUserLocale(locale) {
  localStorage.setItem('user-locale', locale);
}

function getUserLocale() {
  return localStorage.getItem('user-locale') || 'en-US';
}

// Use throughout app
import { format } from 'date-fns';

function formatDate(date, pattern = 'PPPP') {
  const userLocale = getUserLocale();
  return formatInLocale(date, pattern, userLocale);
}
```

---

## Week Start Configuration

### Week Start Settings

```javascript
import { format, getWeek, startOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

const date = new Date(2024, 11, 27); // Friday

// enUS: Week starts Sunday (default)
startOfWeek(date);
//=> Sunday Dec 22, 2024

// fr: Week starts Monday (European standard)
startOfWeek(date, { weekStartsOn: 1 });
//=> Monday Dec 23, 2024

// Get week number respecting locale
getWeek(date);                              // Sunday-based
getWeek(date, { locale: fr });             // Monday-based
```

---

## Best Practices for Localization

### Pattern 1: Locale Utilities Module

```javascript
// localeUtils.js
import * as locales from 'date-fns/locale';
import { format, formatDistance, formatRelative } from 'date-fns';

const SUPPORTED_LOCALES = {
  'en': 'enUS',
  'fr': 'fr',
  'de': 'de',
  'es': 'es',
  'ja': 'ja',
};

export function getLocale(code) {
  const localeCode = SUPPORTED_LOCALES[code] || 'enUS';
  return locales[localeCode];
}

export function formatWithLocale(date, pattern, code = 'en') {
  return format(date, pattern, { locale: getLocale(code) });
}

export function distanceWithLocale(date, baseDate, code = 'en') {
  return formatDistance(date, baseDate, {
    locale: getLocale(code),
    addSuffix: true,
  });
}

// Usage
formatWithLocale(new Date(), 'PPPP', 'fr');        // French format
distanceWithLocale(past, new Date(), 'ja');        // Japanese distance
```

### Pattern 2: Browser Locale Detection

```javascript
// Get browser locale
function getBrowserLocale() {
  const lang = navigator.language || navigator.userLanguage;
  return lang.split('-')[0]; // 'en', 'fr', 'de', etc.
}

function getDefaultLocale() {
  const browserLocale = getBrowserLocale();
  const SUPPORTED = ['en', 'fr', 'de', 'es', 'ja'];
  
  return SUPPORTED.includes(browserLocale) ? browserLocale : 'en';
}

// Usage
const userLocale = getDefaultLocale();
const formatter = (date) => formatWithLocale(date, 'PPPP', userLocale);
```

### Pattern 3: React Context for Localization

```javascript
import { createContext, useContext } from 'react';
import { getLocale } from './localeUtils';

const I18nContext = createContext('en');

export function I18nProvider({ locale, children }) {
  return (
    <I18nContext.Provider value={locale}>
      {children}
    </I18nContext.Provider>
  );
}

export function useLocale() {
  return useContext(I18nContext);
}

export function useDateFormatter() {
  const locale = useLocale();
  
  return (date, pattern = 'PPPP') => {
    const localeObj = getLocale(locale);
    return format(date, pattern, { locale: localeObj });
  };
}

// In component
function DateDisplay({ date }) {
  const formatDate = useDateFormatter();
  return <span>{formatDate(date)}</span>;
}
```

---

## Common Locale Issues & Solutions

### Issue 1: Week Number Differences

```javascript
// Problem: Different locales have different week numbering
import { getWeek } from 'date-fns';
import { enUS, de } from 'date-fns/locale';

const date = new Date(2024, 0, 1); // Jan 1, 2024

// Solution: Always specify weekStartsOn
getWeek(date, { 
  weekStartsOn: 1,  // Monday
  locale: de,
});
```

### Issue 2: Locale Not Displaying

```javascript
// Problem: Locale text shows as English
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

// Wrong: Forgot to pass locale option
format(new Date(), 'MMMM');
//=> "December" (English, not French)

// Correct: Pass locale in options
format(new Date(), 'MMMM', { locale: fr });
//=> "décembre"
```

---

## Performance Optimization

### Only Import Needed Locales

```javascript
// ❌ Bad: Imports all locales
import * as locales from 'date-fns/locale';

// ✅ Good: Import only needed
import { fr, de, es } from 'date-fns/locale';

// Usage in map
const LOCALES = {
  fr,
  de,
  es,
};
```

---

## Module Navigation

- **Formatting:** `03-api-formatting.md` (String ↔ Date conversion)
- **Advanced utilities:** `06-api-advanced.md`
- 📍 **You are here:** Localization & Internationalization (07-locales-i18n.md)
- **Practical patterns:** `08-practical-guides.md` (Real-world recipes)
- **Complete index:** `00-master-index.md`

---

**Version:** 4.1.0 | **Source:** https://date-fns.org/v4.1.0/docs/I18n