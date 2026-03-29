---
name: next-themes
description: next-themes v0.4 theme management - ThemeProvider, useTheme, dark mode, system preference, Tailwind integration. Use when implementing dark mode, theme switching, or system preference detection in Next.js.
---

# next-themes

> Perfect dark mode in Next.js with zero flash, system preference detection, and any number of custom themes.

**Package:** `next-themes` ^0.4 | **Requires:** Next.js App Router or Pages Router

---

## When to Use

**LOAD THIS SKILL** when user is:
- Adding dark mode or theme switching to a Next.js application
- Configuring ThemeProvider with system preference detection
- Integrating next-themes with Tailwind CSS v4 dark mode
- Handling hydration mismatches from theme-dependent UI
- Implementing per-page forced themes
- Building a theme toggle component with useTheme hook
- Preventing flash of incorrect theme on page load

---

## Critical Rules

**ALWAYS:**
1. Add `suppressHydrationWarning` to `<html>` element -- next-themes modifies it before hydration, React will warn without this
2. Create a separate `"use client"` Providers component -- ThemeProvider is a client component, keep layout as server component
3. Use `resolvedTheme` instead of `theme` for rendering theme-dependent UI -- `theme` can be `"system"` which is not actionable
4. Guard theme-dependent UI with a mounted check -- `useTheme` returns `undefined` on the server, causes hydration mismatch
5. Set `attribute="class"` when using Tailwind CSS dark mode -- Tailwind v4 `dark:` variant requires `.dark` class on html
6. Use `disableTransitionOnChange` for smooth theme switches -- prevents inconsistent transition durations across elements

**NEVER:**
1. Render theme-dependent content without a mounted guard -- causes hydration mismatch errors in SSR/RSC
2. Read `theme` to determine light vs dark when `enableSystem` is true -- use `resolvedTheme` which resolves `"system"` to actual value
3. Import `ThemeProvider` directly in a server component layout -- wrap in a `"use client"` providers file
4. Forget `suppressHydrationWarning` on `<html>` -- generates React hydration warnings in console
5. Use `tailwind.config.js` `darkMode` in Tailwind v4 -- use `@custom-variant dark (&:where(.dark, .dark *))` in CSS instead

---

## Core Patterns

### Minimal App Router Setup

```tsx
// app/providers.tsx
"use client"
import { ThemeProvider } from "next-themes"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      {children}
    </ThemeProvider>
  )
}
```

```tsx
// app/layout.tsx
import { Providers } from "./providers"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
```

### Theme Toggle with Hydration Guard

```tsx
"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return <div className="h-9 w-9" /> // placeholder to avoid layout shift

  return (
    <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      {resolvedTheme === "dark" ? "Light" : "Dark"}
    </button>
  )
}
```

### Theme Selector (Multiple Themes)

```tsx
"use client"
import { useTheme } from "next-themes"
import { useEffect, useState } from "react"

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, themes } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      {themes.map((t) => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  )
}
```

---

## Anti-Patterns

**BAD** -- Reading `theme` to render dark/light UI:
```tsx
const { theme } = useTheme()
// When theme is "system", this renders nothing useful
return <span>{theme === "dark" ? "Dark" : "Light"} mode</span>
```

**GOOD** -- Use `resolvedTheme` which resolves system preference:
```tsx
const { resolvedTheme } = useTheme()
return <span>{resolvedTheme === "dark" ? "Dark" : "Light"} mode</span>
```

**BAD** -- Rendering theme-dependent UI without mount check:
```tsx
const { resolvedTheme } = useTheme()
// Causes hydration mismatch: server renders undefined, client renders "dark"
return <img src={resolvedTheme === "dark" ? "/dark-logo.svg" : "/light-logo.svg"} />
```

**GOOD** -- Guard with mounted state:
```tsx
const [mounted, setMounted] = useState(false)
const { resolvedTheme } = useTheme()
useEffect(() => setMounted(true), [])
if (!mounted) return <img src="/placeholder-logo.svg" />
return <img src={resolvedTheme === "dark" ? "/dark-logo.svg" : "/light-logo.svg"} />
```

**BAD** -- ThemeProvider directly in server component layout:
```tsx
// app/layout.tsx -- ERROR: ThemeProvider is a client component
import { ThemeProvider } from "next-themes"
export default function Layout({ children }) {
  return <html><body><ThemeProvider>{children}</ThemeProvider></body></html>
}
```

**GOOD** -- Wrap in a "use client" providers file:
```tsx
// app/providers.tsx
"use client"
import { ThemeProvider } from "next-themes"
export function Providers({ children }) {
  return <ThemeProvider attribute="class">{children}</ThemeProvider>
}
// app/layout.tsx
import { Providers } from "./providers"
export default function Layout({ children }) {
  return <html suppressHydrationWarning><body><Providers>{children}</Providers></body></html>
}
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Get current theme | `useTheme()` | `const { theme, resolvedTheme } = useTheme()` |
| Set theme | `setTheme()` | `setTheme("dark")` or `setTheme("system")` |
| System preference | `systemTheme` | `const { systemTheme } = useTheme()` |
| All themes list | `themes` | `const { themes } = useTheme()` |
| Force page theme | `forcedTheme` prop | `<ThemeProvider forcedTheme="dark">` |
| Custom storage key | `storageKey` prop | `<ThemeProvider storageKey="my-theme">` |
| Tailwind integration | `attribute="class"` | `<ThemeProvider attribute="class">` |
| Data attribute | `attribute` prop | `<ThemeProvider attribute="data-theme">` |
| Disable transitions | `disableTransitionOnChange` | `<ThemeProvider disableTransitionOnChange>` |
| Custom themes | `themes` prop | `<ThemeProvider themes={["light","dark","ocean"]}>` |
| Value mapping | `value` prop | `<ThemeProvider value={{ dark: "night" }}>` |
| CSP nonce | `nonce` prop | `<ThemeProvider nonce="abc123">` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Installation, ThemeProvider config, App Router setup, suppressHydrationWarning | [01-setup-provider.md](01-setup-provider.md) |
| useTheme hook, theme values, resolvedTheme, systemTheme, setTheme | [02-hooks-api.md](02-hooks-api.md) |
| Tailwind v4 dark mode, shadcn/ui, flash prevention, custom themes | [03-integration.md](03-integration.md) |

---

**Version:** ^0.4 | **Source:** https://github.com/pacocoursey/next-themes
