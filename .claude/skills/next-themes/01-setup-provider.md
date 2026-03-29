# next-themes: Setup & ThemeProvider

Installation, ThemeProvider configuration, App Router setup, and suppressHydrationWarning.

---

## Installation

```bash
npm install next-themes
```

No additional peer dependencies required. Works with Next.js 13+ App Router and Pages Router.

---

## App Router Setup (Recommended)

### Step 1: Create a Client Providers Component

ThemeProvider is a client component. Create a wrapper to keep your root layout as a server component.

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

### Step 2: Wrap Root Layout

Add `suppressHydrationWarning` to `<html>` -- next-themes modifies this element before React hydration.

```tsx
// app/layout.tsx
import type { Metadata } from "next"
import { Providers } from "./providers"

export const metadata: Metadata = {
  title: "My App",
}

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

**Why `suppressHydrationWarning`?** next-themes injects a script that updates the `<html>` element's attributes (class or data-theme) before React hydrates. Without this prop, React warns about the mismatch between server-rendered HTML and the client DOM. The prop only applies one level deep -- it does not suppress warnings on child elements.

---

## ThemeProvider Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `attribute` | `string \| string[]` | `"data-theme"` | HTML attribute modified on `<html>`. Use `"class"` for Tailwind. Supports multiple: `["class", "data-theme"]` |
| `defaultTheme` | `string` | `"system"` | Default theme when no stored preference exists |
| `enableSystem` | `boolean` | `true` | Enable system preference detection via `prefers-color-scheme` |
| `enableColorScheme` | `boolean` | `true` | Set `color-scheme` CSS property for browser built-in UI (inputs, buttons, scrollbars) |
| `storageKey` | `string` | `"theme"` | localStorage key for persisting theme |
| `themes` | `string[]` | `["light", "dark"]` | List of theme names. `"system"` is auto-appended when `enableSystem` is true |
| `forcedTheme` | `string \| undefined` | `undefined` | Force a specific theme, ignoring user preference. Does not modify stored value |
| `disableTransitionOnChange` | `boolean` | `false` | Disable CSS transitions during theme switch to prevent inconsistent animations |
| `value` | `Record<string, string \| string[]>` | `undefined` | Map theme names to custom DOM attribute values |
| `nonce` | `string` | `undefined` | CSP nonce for the injected inline script |
| `scriptProps` | `object` | `undefined` | Additional props passed to the injected `<script>` tag |
| `children` | `ReactNode` | `undefined` | Child components (optional in v0.4+) |

---

## Common Provider Configurations

### Tailwind CSS Dark Mode (Most Common)

```tsx
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

Sets `.dark` or `.light` class on `<html>`, enabling Tailwind `dark:` variants.

### Data Attribute (DaisyUI, CSS Variables)

```tsx
<ThemeProvider attribute="data-theme" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

Sets `data-theme="dark"` or `data-theme="light"` on `<html>`. Use CSS selectors like `[data-theme="dark"]` for styling.

### Multiple Attributes

```tsx
<ThemeProvider attribute={["class", "data-theme"]} defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

Sets both `class="dark"` and `data-theme="dark"` simultaneously. Useful when combining Tailwind with another theming system.

### Custom Theme List

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

Supports any number of custom themes. `"system"` is auto-appended when `enableSystem` is true.

### Value Mapping

Map logical theme names to DOM attribute values that differ from the theme name.

```tsx
<ThemeProvider
  attribute="data-theme"
  defaultTheme="system"
  enableSystem
  value={{
    light: "fantasy",
    dark: "night",
    ocean: "aqua",
  }}
>
  {children}
</ThemeProvider>
```

When theme is `"dark"`: localStorage stores `"dark"`, but DOM renders `data-theme="night"`.

**Multiple class values:**

```tsx
<ThemeProvider
  attribute="class"
  value={{
    dark: ["dark", "dark-theme"],
    light: ["light", "light-theme"],
  }}
>
  {children}
</ThemeProvider>
```

Both class names are applied when the corresponding theme is active.

### Disable System Preference

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="light"
  enableSystem={false}
>
  {children}
</ThemeProvider>
```

No system preference detection. Default falls back to `"light"` instead of `"system"`.

### Smooth Theme Switching

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  disableTransitionOnChange
>
  {children}
</ThemeProvider>
```

Temporarily disables all CSS transitions during theme change, then re-enables them. Prevents inconsistent animation durations when switching.

### CSP-Compliant Setup

```tsx
<ThemeProvider
  attribute="class"
  defaultTheme="system"
  enableSystem
  nonce="random-nonce-value"
>
  {children}
</ThemeProvider>
```

The `nonce` is applied to the injected inline script for Content Security Policy compliance.

---

## Pages Router Setup

For projects using the Pages Router, configure in `_app.tsx`:

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app"
import { ThemeProvider } from "next-themes"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

No `suppressHydrationWarning` needed on `<html>` for Pages Router -- the script injection handles flash prevention via `next/head`.

---

## Forced Theme Per Page (Pages Router)

Force specific pages to a fixed theme without affecting the stored preference.

```tsx
// pages/dashboard.tsx
function DashboardPage() {
  return <div>Always dark dashboard</div>
}
DashboardPage.theme = "dark"
export default DashboardPage
```

```tsx
// pages/_app.tsx
import type { AppProps } from "next/app"
import { ThemeProvider } from "next-themes"

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ThemeProvider
      attribute="class"
      forcedTheme={(Component as any).theme || undefined}
    >
      <Component {...pageProps} />
    </ThemeProvider>
  )
}
```

### Forced Theme in App Router

For App Router, pass `forcedTheme` dynamically or use a nested provider:

```tsx
// app/dashboard/providers.tsx
"use client"
import { ThemeProvider } from "next-themes"

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider forcedTheme="dark" attribute="class">
      {children}
    </ThemeProvider>
  )
}
```

```tsx
// app/dashboard/layout.tsx
import { DashboardProviders } from "./providers"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <DashboardProviders>{children}</DashboardProviders>
}
```

When `forcedTheme` is set, theme switching UI should be disabled -- check `forcedTheme` from `useTheme()`.

---

## How Flash Prevention Works

next-themes injects an inline `<script>` into the page that runs before React hydrates. This script:

1. Reads the stored theme from localStorage (using `storageKey`)
2. Falls back to `defaultTheme` if no stored value exists
3. If theme is `"system"`, checks `window.matchMedia("(prefers-color-scheme: dark)")`
4. Updates the `<html>` element's attribute (class or data-theme) immediately
5. Sets `color-scheme` CSS property if `enableColorScheme` is true

Because the script runs synchronously before any paint, users never see a flash of the wrong theme.

---

## Troubleshooting

### Hydration Mismatch Warnings

**Cause:** Missing `suppressHydrationWarning` on `<html>`.

```tsx
// Fix: add suppressHydrationWarning
<html lang="en" suppressHydrationWarning>
```

### Theme Not Persisting

**Cause:** `storageKey` conflict or localStorage disabled.

```tsx
// Use a unique storage key if multiple apps share the domain
<ThemeProvider storageKey="my-app-theme">
```

### Extra Attributes Warning

**Cause:** React warning about server-rendered attributes not matching client. The `suppressHydrationWarning` on `<html>` resolves this.

### System Theme Not Detected

**Cause:** `enableSystem` defaults to `true`, but `defaultTheme` may not be `"system"`.

```tsx
// Ensure both are set
<ThemeProvider enableSystem defaultTheme="system">
```

---

**Version:** ^0.4 | **Source:** https://github.com/pacocoursey/next-themes
