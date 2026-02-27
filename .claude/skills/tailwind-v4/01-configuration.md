# Tailwind CSS v4 Configuration

CSS-first configuration system. Design tokens live in CSS, not JavaScript.

---

## Installation (PostCSS for Next.js)

```bash
npm install tailwindcss @tailwindcss/postcss postcss
```

No `autoprefixer` needed -- built into `@tailwindcss/postcss`.

```javascript
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

```css
/* src/app/globals.css */
@import "tailwindcss";
```

For Vite projects, use `@tailwindcss/vite` plugin instead (faster, no PostCSS config needed).

---

## CSS-First Config with @import

The single `@import "tailwindcss"` replaces all v3 directives:

```css
/* v3 (deprecated) */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 */
@import "tailwindcss";
```

Additional imports are supported natively -- no `postcss-import` plugin needed:

```css
@import "tailwindcss";
@import "tw-animate-css";
@import "./components.css";
```

---

## @theme Directive

Define design tokens that generate both CSS variables and utility classes.

```css
@import "tailwindcss";

@theme {
  --color-brand: oklch(0.72 0.11 178);
  --color-brand-light: oklch(0.85 0.08 178);
  --font-display: "Satoshi", sans-serif;
  --breakpoint-3xl: 120rem;
  --radius-pill: 9999px;
}
```

This generates:
- Utility classes: `bg-brand`, `text-brand`, `font-display`, `rounded-pill`
- CSS variables: `var(--color-brand)`, `var(--font-display)`, etc.

### Theme variable namespaces

| Namespace | Generates | Example Utilities |
|-----------|-----------|-------------------|
| `--color-*` | Color utilities | `bg-red-500`, `text-sky-300` |
| `--font-*` | Font family | `font-sans`, `font-serif` |
| `--text-*` | Font size + line-height | `text-xl`, `text-2xl` |
| `--font-weight-*` | Font weight | `font-bold`, `font-semibold` |
| `--tracking-*` | Letter spacing | `tracking-wide` |
| `--leading-*` | Line height | `leading-tight` |
| `--breakpoint-*` | Responsive variants | `sm:*`, `md:*` |
| `--container-*` | Container query sizes | `@sm:*`, `max-w-md` |
| `--spacing-*` | Spacing/sizing | `px-4`, `max-h-16` |
| `--radius-*` | Border radius | `rounded-sm`, `rounded-lg` |
| `--shadow-*` | Box shadow | `shadow-md`, `shadow-lg` |
| `--ease-*` | Timing functions | `ease-out` |
| `--animate-*` | Animations | `animate-spin` |

### Overriding defaults

```css
/* Override a single value */
@theme { --breakpoint-sm: 30rem; }

/* Override entire namespace (removes all defaults) */
@theme {
  --color-*: initial;
  --color-white: #fff;
  --color-primary: oklch(0.72 0.11 178);
}

/* Reset everything */
@theme {
  --*: initial;
  --spacing: 4px;
  --color-brand: oklch(0.72 0.11 221.19);
}
```

### @theme inline

Use when referencing CSS variables that change at runtime (theme toggles):

```css
@theme inline {
  --font-sans: var(--font-inter);
  --color-primary: var(--brand-color);
}
```

### @theme static

Generate CSS variables even when unused:

```css
@theme static {
  --color-primary: var(--color-red-500);
}
```

---

## @source Directive

v4 auto-detects source files. Use `@source` only for files excluded by default:

```css
@import "tailwindcss";
@source "../node_modules/@my-company/ui-lib";
```

---

## @custom-variant Directive

### Dark mode (class strategy)

```css
@custom-variant dark (&:where(.dark, .dark *));
```

### Data attribute strategy

```css
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

### Complex variant with nesting

```css
@custom-variant any-hover {
  @media (any-hover: hover) {
    &:hover {
      @slot;
    }
  }
}
```

---

## @utility Directive

Register custom utility classes that work with all variants:

```css
/* Simple */
@utility content-auto {
  content-visibility: auto;
}

/* With nesting */
@utility scrollbar-hidden {
  &::-webkit-scrollbar {
    display: none;
  }
}

/* Functional (accepts values) */
@utility tab-* {
  tab-size: --value(--tab-size-*);
}
```

---

## @variant Directive

Apply Tailwind variants in custom CSS:

```css
.my-element {
  background: white;
  @variant dark {
    background: black;
  }
  @variant dark {
    @variant hover {
      background: gray;
    }
  }
}
```

---

## @layer Directive

```css
@layer base {
  h1 { font-size: var(--text-2xl); font-weight: var(--font-weight-bold); }
}

@layer components {
  .card {
    background-color: var(--color-white);
    border-radius: var(--radius-lg);
    padding: --spacing(6);
    box-shadow: var(--shadow-xl);
  }
}
```

Components in `@layer components` can be overridden by utility classes:

```html
<div class="card rounded-none"><!-- rounded-none wins --></div>
```

---

## @apply Directive

Inline utility classes in custom CSS (use sparingly):

```css
.select2-dropdown { @apply rounded-b-lg shadow-md; }
.select2-search { @apply rounded border border-gray-300; }
```

---

## CSS Functions

```css
/* --spacing(): spacing from theme */
.element { margin: --spacing(4); }
/* Compiles to: margin: calc(var(--spacing) * 4); */

/* --alpha(): color opacity */
.element { color: --alpha(var(--color-lime-300) / 50%); }
/* Compiles to: color: color-mix(in oklab, var(--color-lime-300) 50%, transparent); */
```

---

## Custom Animations

```css
@theme {
  --animate-fade-in-scale: fade-in-scale 0.3s ease-out;

  @keyframes fade-in-scale {
    0% { opacity: 0; transform: scale(0.95); }
    100% { opacity: 1; transform: scale(1); }
  }
}
```

Usage: `<div class="animate-fade-in-scale">`

---

## Migration from v3

| v3 | v4 | Notes |
|----|----|----|
| `@tailwind base/components/utilities` | `@import "tailwindcss"` | Single import |
| `tailwind.config.js` | `@theme {}` in CSS | No JS config needed |
| `content: [...]` | Auto-detected | Use `@source` for edge cases |
| `bg-gradient-to-r` | `bg-linear-to-r` | Renamed |
| `theme()` function | `var(--color-*)` | CSS variables |
| `@tailwindcss/container-queries` | Built-in `@container` | No plugin needed |
| `postcss-import` + `autoprefixer` | Only `@tailwindcss/postcss` | Built-in |
| `darkMode: 'class'` | `@custom-variant dark (...)` | CSS-based |

### Automated migration

```bash
npm install -D @tailwindcss/upgrade
npx @tailwindcss/upgrade
```

### PostCSS config migration

```javascript
// v3
export default {
  plugins: { "postcss-import": {}, tailwindcss: {}, autoprefixer: {} },
};

// v4
export default {
  plugins: { "@tailwindcss/postcss": {} },
};
```

---

## Project Context: Next.js + shadcn/ui

Typical `globals.css` for this project:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... shadcn/ui variables mapped via @theme inline */
}
```

The shadcn/ui theme variables are defined in `:root` and `.dark` selectors using oklch, then mapped to Tailwind utilities via `@theme inline`.

---

**Version:** 4.x | **Source:** https://tailwindcss.com/docs
