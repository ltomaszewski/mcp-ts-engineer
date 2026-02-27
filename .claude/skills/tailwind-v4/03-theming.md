# Tailwind CSS v4 Theming

CSS variables for theming, oklch colors, dark mode, responsive breakpoints, and container queries.

---

## CSS Variables as Design Tokens

All `@theme` variables compile to CSS custom properties at `:root`:

```css
@theme {
  --color-brand: oklch(0.72 0.11 178);
  --font-sans: "Inter", sans-serif;
}
/* Generated: :root { --color-brand: oklch(0.72 0.11 178); --font-sans: ...; } */
```

### Using in custom CSS

```css
@layer components {
  .typography p { font-size: var(--text-base); color: var(--color-gray-700); }
  .typography h1 { font-size: var(--text-2xl); font-weight: var(--font-weight-semibold); }
}
```

### Using in JavaScript

```typescript
const styles = getComputedStyle(document.documentElement);
const color = styles.getPropertyValue("--color-brand");
```

---

## @theme inline

Use when referencing CSS variables that change at runtime (theme toggles):

```css
:root { --brand-color: oklch(0.72 0.11 178); }
[data-theme="dark"] { --brand-color: oklch(0.85 0.08 178); }

@theme inline {
  --color-brand: var(--brand-color);
}
```

Now `bg-brand` and `text-brand` change automatically when the theme switches.

---

## Custom Colors with Oklch

v4 uses oklch for all default colors. Format: `oklch(L C H)` where L=lightness (0-1), C=chroma (0-0.4), H=hue (0-360).

Common hue angles: Red ~25, Orange ~55, Yellow ~90, Green ~145, Cyan ~195, Blue ~260, Purple ~300, Pink ~350.

### Adding a color scale

```css
@theme {
  --color-brand-50: oklch(0.98 0.01 250);
  --color-brand-100: oklch(0.95 0.03 250);
  --color-brand-200: oklch(0.90 0.06 250);
  --color-brand-300: oklch(0.82 0.10 250);
  --color-brand-400: oklch(0.72 0.14 250);
  --color-brand-500: oklch(0.63 0.18 250);
  --color-brand-600: oklch(0.53 0.16 250);
  --color-brand-700: oklch(0.44 0.14 250);
  --color-brand-800: oklch(0.35 0.11 250);
  --color-brand-900: oklch(0.27 0.08 250);
  --color-brand-950: oklch(0.20 0.06 250);
}
```

### Color opacity

```html
<div class="bg-brand-500/50">50% opacity</div>
<div class="bg-brand-500/[0.15]">15% arbitrary</div>
```

In custom CSS: `background: --alpha(var(--color-brand-500) / 50%);`

---

## shadcn/ui Theme Integration

Define variables in `:root` and `.dark`, map to Tailwind via `@theme inline`:

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0.004 285.823);
  --primary: oklch(0.205 0.006 285.885);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.97 0.001 286.375);
  --secondary-foreground: oklch(0.205 0.006 285.885);
  --muted: oklch(0.97 0.001 286.375);
  --muted-foreground: oklch(0.556 0.009 285.938);
  --accent: oklch(0.97 0.001 286.375);
  --accent-foreground: oklch(0.205 0.006 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.922 0.004 286.032);
  --input: oklch(0.922 0.004 286.032);
  --ring: oklch(0.708 0.165 254.624);
  --radius: 0.625rem;
}

.dark {
  --background: oklch(0.145 0.004 285.823);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0.004 286.032);
  --primary-foreground: oklch(0.205 0.006 285.885);
  --muted: oklch(0.269 0.007 285.885);
  --muted-foreground: oklch(0.708 0.008 285.885);
  --destructive: oklch(0.577 0.245 27.325);
  --border: oklch(0.269 0.007 285.885);
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

Usage:

```html
<div class="bg-background text-foreground">
  <div class="bg-card rounded-lg border border-border p-6">
    <h2 class="text-lg font-semibold">Title</h2>
    <p class="text-muted-foreground">Description</p>
    <button class="bg-primary text-primary-foreground rounded-md px-4 py-2">Action</button>
  </div>
</div>
```

---

## Dark Mode

### Default: prefers-color-scheme (no config needed)

```html
<div class="bg-white dark:bg-gray-900">
  <h3 class="text-gray-900 dark:text-white">Title</h3>
</div>
```

### Class strategy (manual toggle)

```css
@custom-variant dark (&:where(.dark, .dark *));
```

```html
<html class="dark"><body class="bg-white dark:bg-gray-900">...</body></html>
```

### Three-way toggle (light/dark/system)

```javascript
// Place inline in <head> to prevent FOUC
document.documentElement.classList.toggle(
  "dark",
  localStorage.theme === "dark" ||
    (!("theme" in localStorage) &&
      window.matchMedia("(prefers-color-scheme: dark)").matches),
);
localStorage.theme = "light";        // Force light
localStorage.theme = "dark";         // Force dark
localStorage.removeItem("theme");    // Follow system
```

---

## Responsive Breakpoints

### Default breakpoints (mobile-first)

| Prefix | Min Width | Prefix | Max Width |
|--------|-----------|--------|-----------|
| `sm:` | 640px | `max-sm:` | < 640px |
| `md:` | 768px | `max-md:` | < 768px |
| `lg:` | 1024px | `max-lg:` | < 1024px |
| `xl:` | 1280px | `max-xl:` | < 1280px |
| `2xl:` | 1536px | `max-2xl:` | < 1536px |

### Mobile-first pattern

```html
<!-- WRONG: sm: does NOT target small screens -->
<div class="sm:text-center"></div>

<!-- RIGHT: unprefixed = all, sm: = 640px+ -->
<div class="text-center sm:text-left"></div>
```

### Range targeting

```html
<div class="md:max-xl:flex">Only between md and xl</div>
```

### Custom breakpoints

```css
@theme {
  --breakpoint-xs: 30rem;
  --breakpoint-3xl: 120rem;
}
/* Remove: --breakpoint-2xl: initial; */
/* Replace all: --breakpoint-*: initial; --breakpoint-tablet: 40rem; */
```

### Arbitrary breakpoints

```html
<div class="min-[320px]:text-center max-[600px]:bg-sky-300">Custom</div>
```

---

## Container Queries

Built-in, no plugin needed. Target element size instead of viewport.

```html
<div class="@container">
  <div class="flex flex-col @md:flex-row gap-4">
    <div class="@md:w-1/3">Sidebar</div>
    <div class="@md:w-2/3">Content</div>
  </div>
</div>
```

### Container sizes

| Variant | Width | Variant | Width |
|---------|-------|---------|-------|
| `@3xs:` | 256px | `@xl:` | 576px |
| `@2xs:` | 288px | `@2xl:` | 672px |
| `@xs:` | 320px | `@3xl:` | 768px |
| `@sm:` | 384px | `@4xl:` | 896px |
| `@md:` | 448px | `@5xl:` | 1024px |
| `@lg:` | 512px | `@6xl:`-`@7xl:` | 1152px-1280px |

### Max-width and ranges

```html
<div class="@container">
  <div class="flex @max-md:flex-col">Column when small</div>
  <div class="@sm:@max-md:hidden">Hidden between @sm and @md</div>
</div>
```

### Named containers

```html
<div class="@container/main">
  <div class="@container/sidebar">
    <div class="@sm/main:flex-row @sm/sidebar:flex-col">Named</div>
  </div>
</div>
```

---

## State Variants

### Interactive

```html
<button class="bg-blue-500 hover:bg-blue-600 focus:outline-2 active:bg-blue-700">
  Button
</button>
```

### Form states

```html
<input class="border invalid:border-pink-500 focus:border-sky-500 disabled:bg-gray-50" />
```

### Group and peer

```html
<a class="group p-4 hover:bg-sky-500">
  <h3 class="group-hover:text-white">Title</h3>
</a>

<input type="email" class="peer" />
<p class="invisible peer-invalid:visible text-pink-600">Invalid email</p>
```

### Data attributes and ARIA

```html
<div data-active class="data-active:opacity-100">Data attribute</div>
<div data-size="large" class="data-[size=large]:p-8">With value</div>
<div aria-checked="true" class="aria-checked:bg-sky-700">ARIA state</div>
```

### has() and not() (new in v4)

```html
<label class="has-checked:bg-indigo-50">
  <input type="radio" class="checked:border-indigo-500" />
</label>
<button class="hover:not-focus:bg-indigo-700">Not when focused</button>
```

### Variant stacking

```html
<button class="dark:md:hover:bg-fuchsia-600">Combined</button>
```

---

## Pseudo-Elements

```html
<span class="after:content-['*'] after:text-red-500">Required</span>
<input class="placeholder:text-gray-400 placeholder:italic" />
<p class="selection:bg-fuchsia-300 selection:text-fuchsia-900">Selectable</p>
<p class="first-letter:text-7xl first-letter:font-bold">Drop cap</p>
<ul class="list-disc marker:text-sky-400"><li>Item</li></ul>
```

---

## Media Query Variants

```html
<div class="motion-reduce:animate-none">Reduced motion</div>
<div class="contrast-more:border-gray-400">High contrast</div>
<div class="print:hidden">Hidden when printing</div>
<div class="portrait:flex-col landscape:flex-row">Orientation</div>
<div class="pointer-coarse:py-3">Touch devices</div>
<div class="supports-[display:grid]:grid">Feature support</div>
```

---

**Version:** 4.x | **Source:** https://tailwindcss.com/docs
