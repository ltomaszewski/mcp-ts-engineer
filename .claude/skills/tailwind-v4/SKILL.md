---
name: tailwind-v4
description: "Tailwind CSS v4 utility-first CSS - CSS-first config, @theme, @import, PostCSS plugin, responsive design, dark mode"
when_to_use: "styling components, configuring themes, or migrating from v3"
---

# Tailwind CSS v4

> Utility-first CSS framework with CSS-first configuration. No JavaScript config file needed -- design tokens defined directly in CSS via `@theme` blocks.

**Package:** `tailwindcss` + `@tailwindcss/postcss`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Styling components with Tailwind utility classes
- Configuring theme colors, fonts, spacing, or breakpoints
- Setting up dark mode or responsive design
- Adding custom utilities or variants
- Migrating from Tailwind v3 to v4
- Working with shadcn/ui theme variables (oklch colors)
- Configuring PostCSS or Vite integration

---

## Critical Rules

**ALWAYS:**
1. Use `@import "tailwindcss"` in CSS -- replaces v3 `@tailwind base/components/utilities` directives
2. Define design tokens in `@theme {}` blocks -- not in `tailwind.config.js`
3. Use oklch color space for custom colors -- better perceptual uniformity, wider gamut
4. Use `@tailwindcss/postcss` for Next.js -- configured in `postcss.config.mjs`
5. Use mobile-first breakpoints -- unprefixed = all sizes, `md:` = 768px and above
6. Use `@layer components {}` for reusable class patterns -- keeps proper cascade order
7. Use `cn()` helper (clsx + tailwind-merge) for conditional classes -- prevents class conflicts

**NEVER:**
1. Create `tailwind.config.js` -- v4 uses CSS-first config, JS config is legacy compatibility only
2. Use `@tailwind base/components/utilities` directives -- replaced by `@import "tailwindcss"`
3. Use `bg-gradient-*` classes -- renamed to `bg-linear-*` in v4
4. Add `autoprefixer` to PostCSS -- built into `@tailwindcss/postcss`
5. Add `postcss-import` plugin -- native `@import` support in v4
6. Use `content` config for file scanning -- v4 auto-detects, use `@source` only for edge cases
7. Use `theme()` function in CSS -- deprecated, use `var(--color-*)` CSS variables instead

---

## Core Patterns

### CSS-First Configuration

```css
/* globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@theme {
  --color-primary: oklch(0.72 0.11 178);
  --color-background: oklch(0.99 0 0);
  --font-sans: "Inter", sans-serif;
  --breakpoint-3xl: 120rem;
  --radius-lg: 0.75rem;
}
```

### PostCSS Setup (Next.js)

```javascript
// postcss.config.mjs
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

### Dark Mode (Class Strategy)

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

```html
<html class="dark">
  <body class="bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
    <p class="text-gray-500 dark:text-gray-400">Content</p>
  </body>
</html>
```

### Responsive Design

```html
<!-- Mobile-first: unprefixed = all screens, md: = 768px+ -->
<div class="flex flex-col md:flex-row gap-4 md:gap-8">
  <div class="w-full md:w-1/3">Sidebar</div>
  <div class="w-full md:w-2/3">Content</div>
</div>
```

### Container Queries

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row">
    <div class="@md:w-1/3">Sidebar</div>
    <div class="@md:w-2/3">Content</div>
  </div>
</div>
```

### Custom Utility

```css
@utility scrollbar-hidden {
  &::-webkit-scrollbar {
    display: none;
  }
}
```

### Theme Variable Usage in Custom CSS

```css
@layer components {
  .card {
    background-color: var(--color-white);
    border-radius: var(--radius-lg);
    padding: --spacing(6);
    box-shadow: var(--shadow-xl);
  }
}
```

### Color Opacity

```html
<div class="bg-sky-500/50">50% opacity</div>
<div class="bg-sky-500/[0.15]">15% opacity</div>
```

---

## Anti-Patterns

**BAD** -- Using v3 directives:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**GOOD** -- Using v4 import:
```css
@import "tailwindcss";
```

---

**BAD** -- JavaScript config file:
```javascript
// tailwind.config.js (v3 pattern)
module.exports = {
  theme: {
    extend: {
      colors: { primary: '#3b82f6' },
    },
  },
  content: ['./src/**/*.{ts,tsx}'],
};
```

**GOOD** -- CSS-first config:
```css
@import "tailwindcss";

@theme {
  --color-primary: oklch(0.63 0.14 262.52);
}
```

---

**BAD** -- v3 gradient utility:
```html
<div class="bg-gradient-to-r from-blue-500 to-purple-500"></div>
```

**GOOD** -- v4 gradient utility:
```html
<div class="bg-linear-to-r from-blue-500 to-purple-500"></div>
```

---

**BAD** -- Using `theme()` function:
```css
.element { color: theme(colors.gray.700); }
```

**GOOD** -- Using CSS variables:
```css
.element { color: var(--color-gray-700); }
```

---

## Quick Reference

| Task | Class/Directive | Example |
|------|----------------|---------|
| Import Tailwind | `@import` | `@import "tailwindcss";` |
| Define tokens | `@theme {}` | `@theme { --color-brand: oklch(...); }` |
| Dark mode variant | `@custom-variant` | `@custom-variant dark (&:where(.dark, .dark *));` |
| Custom utility | `@utility` | `@utility content-auto { content-visibility: auto; }` |
| Apply variants in CSS | `@variant` | `@variant dark { background: black; }` |
| Reusable styles | `@layer components` | `@layer components { .card { ... } }` |
| Source detection | `@source` | `@source "../node_modules/@my-company/ui-lib";` |
| Inline utilities | `@apply` | `@apply rounded-b-lg shadow-md;` |
| Spacing function | `--spacing()` | `margin: --spacing(4);` |
| Alpha function | `--alpha()` | `color: --alpha(var(--color-lime-300) / 50%);` |
| Responsive prefix | `sm:`, `md:`, `lg:` | `<div class="md:flex">` |
| Container query | `@container`, `@sm:` | `<div class="@container"><div class="@md:flex">` |
| Arbitrary value | `[value]` | `<div class="top-[117px]">` |
| CSS variable ref | `(--var)` | `<div class="fill-(--my-brand-color)">` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| PostCSS setup, @import, @theme, @source, migrating from v3 | [01-configuration.md](01-configuration.md) |
| Utility classes by category (layout, flex, grid, spacing, typography, colors) | [02-utilities.md](02-utilities.md) |
| CSS variables, @theme inline, oklch colors, dark mode, responsive, container queries | [03-theming.md](03-theming.md) |

---

**Version:** 4.x | **Source:** https://tailwindcss.com/docs
