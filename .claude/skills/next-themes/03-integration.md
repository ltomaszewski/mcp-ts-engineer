# next-themes: Integration Patterns

Tailwind CSS v4 dark mode, shadcn/ui theming, flash prevention, custom multi-theme setups, and testing.

---

## Tailwind CSS v4 Dark Mode Integration

Tailwind CSS v4 uses CSS-first configuration. No `tailwind.config.js` needed.

### Step 1: Configure Tailwind v4 Dark Variant

In your main CSS file, override the dark variant to use the `.dark` class selector:

```css
/* app/globals.css */
@import "tailwindcss";

/* Override dark mode to use class-based selector (required for next-themes) */
@custom-variant dark (&:where(.dark, .dark *));
```

This replaces the v3 `darkMode: "class"` config in `tailwind.config.js`.

### Step 2: Configure ThemeProvider

```tsx
// app/providers.tsx
"use client"
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </ThemeProvider>
  )
}
```

Setting `attribute="class"` tells next-themes to add/remove the `dark` class on `<html>`, which the `@custom-variant dark` rule picks up.

### Step 3: Use dark: Variants

```tsx
export function Card() {
  return (
    <div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 rounded-lg p-6">
      <h2 className="text-lg font-semibold">Dashboard</h2>
      <p className="text-gray-600 dark:text-gray-400">Welcome back</p>
    </div>
  )
}
```

### Custom Data Attribute (Alternative)

If you prefer `data-theme` instead of class:

```css
/* app/globals.css */
@import "tailwindcss";

@custom-variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
```

```tsx
<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

---

## Tailwind v3 Dark Mode (Legacy)

For projects still on Tailwind v3, use `tailwind.config.js`:

```js
// tailwind.config.js
module.exports = {
  darkMode: "selector", // or "class" for tailwindcss < 3.4.1
  // ...
}
```

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

---

## shadcn/ui Integration

shadcn/ui uses CSS variables for theming and works seamlessly with next-themes.

### Complete Setup

```css
/* app/globals.css */
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:where(.dark, .dark *));

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
  --color-ring: var(--ring);
  /* ... additional tokens */
}

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.21 0.034 264.66);
  --primary: oklch(0.21 0.034 264.66);
  --primary-foreground: oklch(0.98 0.002 247.84);
  /* ... light theme values */
}

.dark {
  --background: oklch(0.21 0.034 264.66);
  --foreground: oklch(0.98 0.002 247.84);
  --primary: oklch(0.98 0.002 247.84);
  --primary-foreground: oklch(0.21 0.034 264.66);
  /* ... dark theme values */
}
```

```tsx
// app/providers.tsx
"use client"
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      {children}
    </ThemeProvider>
  )
}
```

### shadcn/ui Theme Toggle Component

```tsx
// components/theme-toggle.tsx
"use client"
import { useEffect, useState } from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { setTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return <Button variant="outline" size="icon" className="h-9 w-9" />

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon">
          <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => setTheme("light")}>Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

Note: The Sun/Moon icons use CSS transitions with `dark:` variants, so no mounted guard is needed for the icon rendering itself -- only for preventing the button placeholder mismatch.

---

## Custom Multi-Theme Setup

next-themes supports any number of themes beyond light/dark.

### Define Custom Themes in CSS

```css
/* app/globals.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));
@custom-variant theme-ocean (&:where(.ocean, .ocean *));
@custom-variant theme-forest (&:where(.forest, .forest *));

:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.15 0 0);
  --primary: oklch(0.55 0.2 260);
}

.dark {
  --background: oklch(0.15 0 0);
  --foreground: oklch(0.95 0 0);
  --primary: oklch(0.7 0.15 260);
}

.ocean {
  --background: oklch(0.18 0.03 230);
  --foreground: oklch(0.92 0.02 200);
  --primary: oklch(0.65 0.18 220);
}

.forest {
  --background: oklch(0.15 0.03 140);
  --foreground: oklch(0.92 0.02 130);
  --primary: oklch(0.55 0.15 150);
}
```

### Configure Provider

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  themes={["light", "dark", "ocean", "forest"]}
>
  {children}
</ThemeProvider>
```

### Theme Selector Component

```tsx
"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

const THEME_LABELS: Record<string, string> = {
  light: "Light",
  dark: "Dark",
  ocean: "Ocean",
  forest: "Forest",
  system: "System",
}

export function MultiThemeSelector() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, themes } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div className="flex gap-2">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={theme === t ? "font-bold underline" : ""}
        >
          {THEME_LABELS[t] ?? t}
        </button>
      ))}
    </div>
  )
}
```

---

## Flash Prevention Deep Dive

next-themes prevents flash of incorrect theme (FOIT) through an inline script injection.

### How It Works

1. An inline `<script>` is injected before any page content renders
2. The script reads the theme from localStorage synchronously
3. If theme is `"system"`, it checks `window.matchMedia("(prefers-color-scheme: dark)")`
4. It sets the appropriate class/attribute on `<html>` immediately
5. It sets the `color-scheme` CSS property if `enableColorScheme` is true

Because this runs synchronously before React hydrates, there is no flash.

### enableColorScheme

When `enableColorScheme` is true (default), next-themes sets `color-scheme: dark` or `color-scheme: light` on `<html>`. This tells the browser to style built-in elements (scrollbars, form inputs, buttons) with the appropriate color scheme.

```tsx
// Disable if you want full control over built-in element styling
<ThemeProvider enableColorScheme={false}>
```

### disableTransitionOnChange

When enabled, next-themes adds a `<style>` tag that disables all CSS transitions (`* { transition: none !important }`), changes the theme, then removes the style tag on the next frame. This prevents elements with different transition durations from animating at different speeds during theme switches.

```tsx
<ThemeProvider disableTransitionOnChange>
```

### CSP (Content Security Policy)

The inline script requires CSP accommodation. Use the `nonce` prop:

```tsx
// Read nonce from response headers
import { headers } from "next/headers"

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const nonce = (await headers()).get("x-nonce") ?? undefined

  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" nonce={nonce}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
```

---

## CSS Variables Theming Pattern

Use CSS variables that change per theme instead of Tailwind `dark:` variants for complex theming:

```css
/* app/globals.css */
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-surface: var(--surface);
  --color-on-surface: var(--on-surface);
  --color-surface-variant: var(--surface-variant);
}

:root {
  --surface: oklch(0.99 0 0);
  --on-surface: oklch(0.1 0 0);
  --surface-variant: oklch(0.93 0 0);
}

.dark {
  --surface: oklch(0.13 0 0);
  --on-surface: oklch(0.93 0 0);
  --surface-variant: oklch(0.22 0 0);
}
```

```tsx
// Use semantic color names -- they automatically adapt to theme
<div className="bg-surface text-on-surface">
  <aside className="bg-surface-variant">Sidebar</aside>
</div>
```

No `dark:` prefix needed -- CSS variables change automatically when next-themes updates the class.

---

## Testing with next-themes

### Mocking next-themes in Vitest

```tsx
// __tests__/theme-toggle.test.tsx
import { render, screen, fireEvent } from "@testing-library/react"
import { vi, describe, it, expect, beforeEach } from "vitest"

// Mock next-themes
const mockSetTheme = vi.fn()
vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "light",
    setTheme: mockSetTheme,
    resolvedTheme: "light",
    systemTheme: "light",
    themes: ["light", "dark", "system"],
  }),
}))

import { ThemeToggle } from "@/components/theme-toggle"

describe("ThemeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it("calls setTheme when toggled", () => {
    render(<ThemeToggle />)
    fireEvent.click(screen.getByRole("button"))
    expect(mockSetTheme).toHaveBeenCalledWith("dark")
  })
})
```

### Testing with Different Themes

```tsx
// Override mock per test
import { useTheme } from "next-themes"

vi.mock("next-themes")

describe("ThemedComponent", () => {
  it("renders dark mode content", () => {
    vi.mocked(useTheme).mockReturnValue({
      theme: "dark",
      setTheme: vi.fn(),
      resolvedTheme: "dark",
      systemTheme: "dark",
      themes: ["light", "dark", "system"],
      forcedTheme: undefined,
    })

    render(<ThemedComponent />)
    expect(screen.getByText("Dark mode")).toBeInTheDocument()
  })
})
```

---

## Migration from v0.3 to v0.4

Key changes in v0.4:

| Feature | v0.3 | v0.4 |
|---------|------|------|
| Children prop | Required | Optional |
| Multiple attributes | Not supported | `attribute={["class", "data-theme"]}` |
| Inline script | Standard | Improved minification |
| Value mapping | Single values | Arrays supported: `value={{ dark: ["dark", "theme-dark"] }}` |
| TypeScript | ThemeProviderProps exported | Types refined |

### Breaking Changes

- None significant. v0.4 is backward compatible with v0.3 configurations.
- If upgrading from v0.2 or earlier: `defaultTheme` changed from `"light"` to `"system"`.

---

## Integration Checklist

### New Next.js + Tailwind v4 Project

- [ ] `npm install next-themes`
- [ ] Add `@custom-variant dark (&:where(.dark, .dark *))` to `globals.css`
- [ ] Create `app/providers.tsx` with `"use client"` and `ThemeProvider`
- [ ] Set `attribute="class"` on ThemeProvider
- [ ] Add `suppressHydrationWarning` to `<html>` in `app/layout.tsx`
- [ ] Wrap children with `<Providers>` in layout
- [ ] Create theme toggle component with mounted guard
- [ ] Define `:root` and `.dark` CSS variables for light/dark tokens
- [ ] Test: no flash on page load
- [ ] Test: theme persists across page reloads
- [ ] Test: system preference detection works

### Adding to Existing shadcn/ui Project

- [ ] `npm install next-themes` (if not already installed)
- [ ] Verify `@custom-variant dark` in `globals.css`
- [ ] Verify `:root` and `.dark` CSS variable blocks exist
- [ ] Add ThemeProvider to providers (shadcn/ui init may have done this)
- [ ] Add theme toggle component to navbar/header
- [ ] Verify `disableTransitionOnChange` for smooth switches

---

**Version:** ^0.4 | **Source:** https://github.com/pacocoursey/next-themes
