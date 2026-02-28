# shadcn/ui Setup and Installation

> Complete setup guide for shadcn/ui with Next.js 15 and Tailwind v4.

---

## Overview

shadcn/ui is NOT an npm package. It is a CLI tool that copies component source files into your project. You own the code, can modify it directly, and have full control over styling and behavior. Components are built on Radix UI primitives and styled with Tailwind CSS.

---

## Prerequisites

- Next.js 15+ with App Router
- Tailwind CSS v4 (CSS-first configuration)
- TypeScript 5+
- React 19+

---

## Installation

### Step 1: Initialize shadcn/ui

Run the init command in your Next.js project root:

```bash
npx shadcn@latest init
```

Alternative package managers:

```bash
# pnpm
pnpm dlx shadcn@latest init

# yarn
yarn dlx shadcn@latest init

# bun
bunx shadcn@latest init
```

The CLI will prompt for:
- Style preference (new-york is default)
- Base color (neutral, gray, slate, stone, zinc)
- CSS variables for theming (recommended: yes)
- React Server Components support
- Import alias paths

### Step 2: Verify Generated Files

After init, the CLI creates/modifies:

```
project-root/
  components.json          # shadcn/ui configuration
  src/
    lib/
      utils.ts             # cn() utility function
    components/
      ui/                  # Component files go here (empty initially)
    app/
      globals.css          # Updated with CSS variables and theme
```

---

## components.json Configuration

The `components.json` file controls how the CLI adds components:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### Key Fields

| Field | Purpose | Notes |
|-------|---------|-------|
| `style` | Component design system | `"new-york"` is the current default |
| `rsc` | React Server Components | `true` adds `"use client"` directives automatically |
| `tsx` | TypeScript output | `false` generates `.jsx` files instead |
| `tailwind.config` | Tailwind config path | **Leave blank for Tailwind v4** (CSS-first) |
| `tailwind.css` | Global CSS path | Path to your main CSS file |
| `tailwind.baseColor` | Color palette | Cannot change after init |
| `tailwind.cssVariables` | Use CSS variables | Cannot change after init |
| `tailwind.prefix` | Utility class prefix | e.g., `"tw-"` for `tw-bg-primary` |
| `aliases.ui` | UI component directory | Where `add` command places files |
| `aliases.utils` | Utility functions path | Where `cn()` lives |

---

## Adding Components

### Individual Components

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add select
```

### Multiple Components at Once

```bash
npx shadcn@latest add button card dialog form input label select sheet table tabs
```

### All Components

```bash
npx shadcn@latest add --all
```

### Overwrite Existing (Update)

```bash
npx shadcn@latest add button --overwrite
npx shadcn@latest add --all --overwrite
```

### What Happens on `add`

1. CLI reads `components.json` for paths and config
2. Downloads component source from the shadcn registry
3. Copies `.tsx` file to `src/components/ui/<name>.tsx`
4. Installs required npm dependencies (Radix packages, etc.)
5. Adds `"use client"` directive if `rsc: true` and component needs client features

---

## Project Structure After Setup

```
src/
  app/
    globals.css              # Theme CSS variables + Tailwind imports
    layout.tsx               # Root layout (ThemeProvider + Toaster)
  components/
    ui/                      # shadcn components (button.tsx, card.tsx, dialog.tsx, etc.)
    theme-provider.tsx       # next-themes wrapper
  lib/
    utils.ts                 # cn() utility
  hooks/                     # Custom hooks
```

---

## Core Dependencies

### Installed by `shadcn init`

| Package | Purpose |
|---------|---------|
| `tailwind-merge` | Merges Tailwind classes, resolves conflicts |
| `clsx` | Conditional class string builder |
| `class-variance-authority` | Type-safe component variants (CVA) |
| `lucide-react` | Icon library used by components |
| `tw-animate-css` | Animation utilities for Tailwind v4 |
| `sonner` | Toast notification library (used by shadcn Toast) |
| `next-themes` | Dark mode / theme switching for Next.js |

### Installed per Component

Each component auto-installs its Radix UI primitives (e.g., `@radix-ui/react-dialog` for Dialog/Sheet, `@radix-ui/react-select` for Select). Form components require: `react-hook-form`, `@hookform/resolvers`, `zod`. Toast requires: `sonner`.

---

## The cn() Utility

Located at `src/lib/utils.ts`:

```typescript
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

**How it works:** `clsx()` handles conditionals (strings, objects, arrays, falsy values), then `twMerge()` resolves Tailwind conflicts (last wins).

```typescript
import { cn } from "@/lib/utils"

cn("px-4 py-2", "bg-blue-500")                     // concatenation
cn("px-4", isActive && "bg-primary")                // conditional
cn("bg-primary", className)                          // override (consumer wins)
cn("base", { "text-red-500": hasError })            // object syntax
```

---

## Tailwind v4 CSS-First Configuration

Tailwind v4 uses CSS-first configuration instead of `tailwind.config.js`. All configuration lives in your CSS file.

### globals.css Structure

```css
@import "tailwindcss";
@import "tw-animate-css";

@custom-variant dark (&:is(.dark *));

:root {
  --radius: 0.625rem;
  /* Core semantic tokens (OKLCH format) */
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.82);
  --primary: oklch(0.21 0.034 264.66);
  --primary-foreground: oklch(0.985 0 0);
  --secondary: oklch(0.967 0.001 286.38);
  --secondary-foreground: oklch(0.21 0.034 264.66);
  --muted: oklch(0.967 0.001 286.38);
  --muted-foreground: oklch(0.552 0.016 285.94);
  --accent: oklch(0.967 0.001 286.38);
  --accent-foreground: oklch(0.21 0.034 264.66);
  --destructive: oklch(0.577 0.245 27.33);
  --border: oklch(0.92 0.004 286.32);
  --input: oklch(0.92 0.004 286.32);
  --ring: oklch(0.705 0.015 286.07);
  /* Also: --card, --popover, --chart-1..5, --sidebar-* */
}

.dark {
  --background: oklch(0.141 0.005 285.82);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.985 0 0);
  --primary-foreground: oklch(0.21 0.034 264.66);
  /* Override all tokens for dark mode */
}

@theme inline {
  /* Map each CSS variable to Tailwind color utility */
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... repeat for all tokens ... */
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

@layer base {
  * { @apply border-border; }
  body { @apply bg-background text-foreground; }
  button:not(:disabled),
  [role="button"]:not(:disabled) { cursor: pointer; }
}
```

---

## Dark Mode Setup with next-themes

### Install next-themes

```bash
npm install next-themes
```

### Create ThemeProvider

```typescript
// src/components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
```

### Configure Root Layout

```typescript
// src/app/layout.tsx
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
```

### Theme Toggle Component

```tsx
"use client"
import { useTheme } from "next-themes"
import { Moon, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button variant="ghost" size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
      <Sun className="size-4 dark:-rotate-90 dark:scale-0 transition-all" />
      <Moon className="absolute size-4 rotate-90 scale-0 dark:rotate-0 dark:scale-100 transition-all" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
```

---

## Sonner (Toast) Setup

```bash
npx shadcn@latest add sonner
```

Add `<Toaster />` to root layout (see layout example above), then use anywhere:

```typescript
import { toast } from "sonner"
toast.success("Saved!") // Also: toast(), toast.error(), toast.warning(), toast.info()
```

---

## TypeScript Path Aliases

Ensure `tsconfig.json` paths match `components.json` aliases:

```json
{ "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./src/*"] } } }
```

---

## Common CLI Commands

| Command | Purpose |
|---------|---------|
| `npx shadcn@latest init` | Initialize project config |
| `npx shadcn@latest add <name>` | Add component(s) |
| `npx shadcn@latest add --all` | Add all available components |
| `npx shadcn@latest add <name> --overwrite` | Update existing component |
| `npx shadcn@latest diff <name>` | Show changes from upstream |

---

**Version:** latest (2025) | **Source:** https://ui.shadcn.com/docs
