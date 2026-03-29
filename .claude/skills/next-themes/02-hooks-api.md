# next-themes: useTheme Hook & API

The `useTheme` hook, return values, hydration safety, and programmatic theme control.

---

## useTheme Hook

Import from `next-themes`. Must be used inside a component wrapped by `ThemeProvider`.

```tsx
"use client"
import { useTheme } from "next-themes"

export function MyComponent() {
  const { theme, setTheme, resolvedTheme, systemTheme, forcedTheme, themes } = useTheme()
  // ...
}
```

---

## Return Values Reference

| Property | Type | Description |
|----------|------|-------------|
| `theme` | `string \| undefined` | Active theme name as stored in localStorage. Can be `"system"`, `"light"`, `"dark"`, or any custom theme name |
| `setTheme` | `(theme: string) => void` | Function to update the active theme. Persists to localStorage |
| `resolvedTheme` | `string \| undefined` | If `enableSystem` is true and `theme` is `"system"`, resolves to `"dark"` or `"light"` based on system preference. Otherwise identical to `theme` |
| `systemTheme` | `string \| undefined` | Current system preference (`"dark"` or `"light"`), regardless of active theme. Only available when `enableSystem` is true |
| `forcedTheme` | `string \| undefined` | The forced theme if set via `ThemeProvider`'s `forcedTheme` prop. Falsy when no theme is forced |
| `themes` | `string[]` | List of all available themes (includes `"system"` when `enableSystem` is true) |

### Server-Side Values

On the server (SSR/RSC), `useTheme` returns `undefined` for `theme`, `resolvedTheme`, and `systemTheme` because localStorage and `window.matchMedia` are not available. This is the root cause of hydration mismatches.

---

## theme vs resolvedTheme

Understanding the difference is critical for correct rendering.

| Scenario | `theme` | `resolvedTheme` | Use Which? |
|----------|---------|-----------------|------------|
| User selected "light" | `"light"` | `"light"` | Either |
| User selected "dark" | `"dark"` | `"dark"` | Either |
| User selected "system", OS is dark | `"system"` | `"dark"` | `resolvedTheme` |
| User selected "system", OS is light | `"system"` | `"light"` | `resolvedTheme` |
| Custom theme "ocean" | `"ocean"` | `"ocean"` | Either |

**Rule:** Use `resolvedTheme` when you need the actual visual theme (dark vs light). Use `theme` when you need to know what the user explicitly chose (to show in a selector).

---

## Hydration Safety Pattern

`useTheme` returns `undefined` on the server. Any UI that depends on theme values will cause a hydration mismatch. Use a mounted guard.

### Standard Mounted Guard

```tsx
"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function ThemeStatus() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  if (!mounted) {
    // Return a placeholder with the same dimensions to avoid layout shift
    return <div className="h-6 w-20 animate-pulse rounded bg-muted" />
  }

  return <span>Current theme: {resolvedTheme}</span>
}
```

### When You Don't Need a Mounted Guard

If your component only uses `setTheme` (not reading theme values for rendering), no guard is needed:

```tsx
"use client"
import { useTheme } from "next-themes"

export function DarkModeButton() {
  const { setTheme } = useTheme()
  // Safe: setTheme doesn't affect rendered output
  return <button onClick={() => setTheme("dark")}>Go Dark</button>
}
```

---

## setTheme Usage

### Direct Theme Setting

```tsx
const { setTheme } = useTheme()

setTheme("light")    // Switch to light
setTheme("dark")     // Switch to dark
setTheme("system")   // Follow system preference
setTheme("ocean")    // Switch to custom theme (must be in themes list)
```

### Toggle Between Two Themes

```tsx
"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function ThemeToggle() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return <button className="h-9 w-9" aria-label="Toggle theme" />

  return (
    <button
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${resolvedTheme === "dark" ? "light" : "dark"} mode`}
    >
      {resolvedTheme === "dark" ? "Sun" : "Moon"}
    </button>
  )
}
```

### Three-Way Toggle (Light / Dark / System)

```tsx
"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function ThemeCycler() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  const cycle = () => {
    if (theme === "system") setTheme("light")
    else if (theme === "light") setTheme("dark")
    else setTheme("system")
  }

  return (
    <button onClick={cycle} aria-label={`Current theme: ${theme}`}>
      {theme === "system" ? "System" : theme === "dark" ? "Dark" : "Light"}
    </button>
  )
}
```

---

## Theme Selector Dropdown

### Basic Select

```tsx
"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function ThemeSelector() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme, themes } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <select value={theme} onChange={(e) => setTheme(e.target.value)}>
      {themes.map((t) => (
        <option key={t} value={t}>
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </option>
      ))}
    </select>
  )
}
```

### With shadcn/ui Select

```tsx
"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export function ThemeSelect() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <Select value={theme} onValueChange={setTheme}>
      <SelectTrigger className="w-[140px]">
        <SelectValue placeholder="Theme" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="light">Light</SelectItem>
        <SelectItem value="dark">Dark</SelectItem>
        <SelectItem value="system">System</SelectItem>
      </SelectContent>
    </Select>
  )
}
```

---

## Conditional Rendering by Theme

### Theme-Dependent Images

```tsx
"use client"
import { useEffect, useState } from "react"
import Image from "next/image"
import { useTheme } from "next-themes"

export function ThemedLogo() {
  const [mounted, setMounted] = useState(false)
  const { resolvedTheme } = useTheme()

  useEffect(() => setMounted(true), [])

  // Show placeholder until mounted
  if (!mounted) {
    return <div className="h-10 w-32 animate-pulse rounded bg-muted" />
  }

  return (
    <Image
      src={resolvedTheme === "dark" ? "/logo-dark.svg" : "/logo-light.svg"}
      alt="Logo"
      width={128}
      height={40}
    />
  )
}
```

### CSS-Only Approach (No Mounted Guard Needed)

Use CSS to show/hide elements based on theme class -- avoids hydration issues entirely:

```tsx
export function ThemedLogo() {
  return (
    <>
      <img src="/logo-light.svg" alt="Logo" className="block dark:hidden" />
      <img src="/logo-dark.svg" alt="Logo" className="hidden dark:block" />
    </>
  )
}
```

This approach works because Tailwind `dark:` variants apply via CSS, not JavaScript. Both images exist in the DOM but only one is visible.

---

## Forced Theme Detection

When `forcedTheme` is set, disable theme switching UI:

```tsx
"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function ThemeControls() {
  const [mounted, setMounted] = useState(false)
  const { forcedTheme, resolvedTheme, setTheme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  // If theme is forced, show indicator but disable controls
  if (forcedTheme) {
    return <span>Theme: {forcedTheme} (forced)</span>
  }

  return (
    <button onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}>
      Toggle theme
    </button>
  )
}
```

---

## Listening to System Theme Changes

`systemTheme` updates reactively when the user changes their OS preference:

```tsx
"use client"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

export function SystemThemeIndicator() {
  const [mounted, setMounted] = useState(false)
  const { systemTheme, theme } = useTheme()

  useEffect(() => setMounted(true), [])
  if (!mounted) return null

  return (
    <div>
      <p>System preference: {systemTheme}</p>
      <p>Active theme: {theme}</p>
      <p>Following system: {theme === "system" ? "Yes" : "No"}</p>
    </div>
  )
}
```

---

## Common Patterns Summary

| Pattern | Key Point |
|---------|-----------|
| Theme toggle | Use `resolvedTheme` for comparison, `setTheme` for switching |
| Theme selector | Use `themes` array for options, `theme` for current selection |
| Theme-dependent images | Use mounted guard OR CSS `dark:hidden`/`dark:block` |
| Forced theme pages | Check `forcedTheme` before showing controls |
| System preference display | Read `systemTheme` for OS setting, `theme` for user choice |
| Server-safe rendering | Always guard with `useState(false)` + `useEffect` |

---

**Version:** ^0.4 | **Source:** https://github.com/pacocoursey/next-themes
