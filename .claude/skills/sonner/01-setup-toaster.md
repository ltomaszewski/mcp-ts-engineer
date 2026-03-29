# Sonner: Setup & Toaster Component

> Installation, `<Toaster />` configuration, positioning, theming, and global options.

---

## Installation

### Direct Install

```bash
npm install sonner
```

### Via shadcn/ui (Recommended for shadcn projects)

```bash
npx shadcn@latest add sonner
```

This creates `src/components/ui/sonner.tsx` -- a thin wrapper around sonner's `<Toaster />` with project-specific defaults.

---

## Basic Setup

### Minimal Setup

```tsx
import { Toaster, toast } from "sonner"

function App() {
  return (
    <div>
      <Toaster />
      <button onClick={() => toast("My first toast")}>
        Give me a toast
      </button>
    </div>
  )
}
```

### Next.js App Router (Root Layout)

The `<Toaster />` component can be placed in Server Components -- it renders a client-side portal.

```tsx
// app/layout.tsx
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster />
      </body>
    </html>
  )
}
```

### Next.js with shadcn/ui Wrapper

```tsx
// app/layout.tsx
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
```

---

## Toaster Component Props

### Complete Props Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `position` | `string` | `"bottom-right"` | Toast placement on screen |
| `theme` | `"light" \| "dark" \| "system"` | `"light"` | Toast color theme |
| `richColors` | `boolean` | `false` | Colorful success/error/warning/info toasts |
| `expand` | `boolean` | `false` | Expand all toasts by default |
| `visibleToasts` | `number` | `3` | Max visible toasts before stacking |
| `closeButton` | `boolean` | `false` | Add close button to all toasts |
| `duration` | `number` | `4000` | Default auto-dismiss time in ms |
| `gap` | `number` | `14` | Gap between toasts in px when expanded |
| `offset` | `string \| number \| object` | `"32px"` | Distance from screen edges |
| `mobileOffset` | `string \| number \| object` | `"16px"` | Distance from edges on mobile (<600px) |
| `dir` | `"ltr" \| "rtl"` | `"ltr"` | Text directionality |
| `hotkey` | `string` | `"alt+T"` | Keyboard shortcut to focus toaster |
| `invert` | `boolean` | `false` | Dark toasts in light mode, vice versa |
| `id` | `string` | `undefined` | Unique toaster ID for multiple instances |
| `swipeDirections` | `string[]` | based on position | Allowed swipe-to-dismiss directions |
| `icons` | `object` | `undefined` | Override default icons per type |
| `toastOptions` | `object` | `{}` | Default options applied to all toasts |

---

## Position Options

Six positions available, controlling where toasts appear on screen:

```tsx
<Toaster position="top-left" />
<Toaster position="top-center" />
<Toaster position="top-right" />
<Toaster position="bottom-left" />
<Toaster position="bottom-center" />
<Toaster position="bottom-right" />   {/* default */}
```

Swipe direction automatically adapts based on position (e.g., top positions swipe up, bottom positions swipe down).

---

## Theme Configuration

### Light/Dark/System

```tsx
// Static theme
<Toaster theme="dark" />

// Follow system preference
<Toaster theme="system" />
```

### With next-themes

```tsx
"use client"
import { useTheme } from "next-themes"
import { Toaster } from "sonner"

export function ThemeAwareToaster() {
  const { theme } = useTheme()
  return (
    <Toaster
      theme={theme as "light" | "dark" | "system"}
      richColors
    />
  )
}
```

### Invert Mode

Dark toasts on light background, light toasts on dark background:

```tsx
<Toaster invert />
```

---

## Rich Colors

Enable colorful styling for typed toasts (success, error, warning, info):

```tsx
<Toaster richColors />
```

Without `richColors`, typed toasts use subtle styling. With it enabled:
- `toast.success()` -- green background
- `toast.error()` -- red background
- `toast.warning()` -- yellow/amber background
- `toast.info()` -- blue background

---

## Close Button

Add a close button to all toasts globally:

```tsx
<Toaster closeButton />
```

Or per-toast:

```typescript
toast("Message", { closeButton: true })
```

---

## Visible Toasts & Expansion

### Limit Visible Toasts

```tsx
// Show max 5 toasts before stacking
<Toaster visibleToasts={5} />
```

### Auto-Expand

```tsx
// All toasts expanded by default (no stacking)
<Toaster expand />
```

---

## Offset & Gap

### Screen Edge Offset

```tsx
// Uniform offset
<Toaster offset="48px" />
<Toaster offset={48} />

// Directional offset (object form)
<Toaster offset={{ top: 64, right: 16 }} />

// Mobile-specific offset (screens < 600px)
<Toaster offset="32px" mobileOffset="16px" />
```

### Gap Between Toasts

```tsx
// Space between expanded toasts (default: 14px)
<Toaster gap={20} />
```

---

## Default Toast Options

Apply defaults to all toasts via `toastOptions`:

```tsx
<Toaster
  toastOptions={{
    duration: 5000,
    style: {
      background: "var(--background)",
      border: "1px solid var(--border)",
      color: "var(--foreground)",
    },
    classNames: {
      title: "font-semibold",
      description: "text-muted-foreground",
    },
  }}
/>
```

---

## Custom Icons

Replace default icons globally:

```tsx
import { CheckCircle, AlertCircle, AlertTriangle, Info, Loader2 } from "lucide-react"

<Toaster
  icons={{
    success: <CheckCircle className="h-4 w-4" />,
    error: <AlertCircle className="h-4 w-4" />,
    warning: <AlertTriangle className="h-4 w-4" />,
    info: <Info className="h-4 w-4" />,
    loading: <Loader2 className="h-4 w-4 animate-spin" />,
  }}
/>
```

Remove icons entirely:

```tsx
<Toaster icons={{ success: null, error: null }} />
```

---

## Multiple Toaster Instances

Use distinct `id` props to render toasts to specific toasters:

```tsx
// Layout
<Toaster id="main" position="bottom-right" />
<Toaster id="notifications" position="top-right" />

// Target a specific toaster
toast("General message", { toasterId: "main" })
toast("New notification", { toasterId: "notifications" })
```

---

## RTL Support

```tsx
<Toaster dir="rtl" />
```

---

## Keyboard Shortcut

Default: `Alt + T` (focuses the toaster area for accessibility).

```tsx
// Custom hotkey
<Toaster hotkey="alt+n" />
```

---

## Complete Production Setup

```tsx
// app/layout.tsx
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          expand={false}
          visibleToasts={5}
          duration={4000}
          gap={14}
          theme="system"
          toastOptions={{
            style: {
              background: "var(--background)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            },
          }}
        />
      </body>
    </html>
  )
}
```

---

**Version:** ^2.0.0 | **Source:** https://sonner.emilkowal.ski/toaster
