# shadcn/ui Setup and Installation

> Complete setup guide for shadcn/ui CLI v4 with Next.js 15, Tailwind v4, and unified radix-ui.

---

## Overview

shadcn/ui is NOT an npm package. It is a CLI tool that copies component source files into your project. You own the code, can modify it directly, and have full control over styling and behavior. Components are built on Radix UI or Base UI primitives and styled with Tailwind CSS. CLI v4 (March 2026) adds AI agent skills, design presets, `registry:base`, first-class fonts, and inspection flags.

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
- Base color (neutral, gray, slate, stone, zinc, mauve, olive, mist, taupe)
- CSS variables for theming (recommended: yes)
- React Server Components support
- Import alias paths

### Initialize with a Preset (New in CLI v4)

A preset packs your entire design system config into a short code -- colors, theme, icon library, fonts, and radius:

```bash
# Initialize with a preset code
npx shadcn@latest init --preset <preset-code>

# Short form
npx shadcn@latest init -p <preset-code>
```

Build your preset on `shadcn/create` (https://ui.shadcn.com/create), preview it live, and grab the code when ready.

### Initialize with RTL Support

```bash
npx shadcn@latest init --rtl
```

Or for a new project:

```bash
npx shadcn@latest create --rtl
```

### Project Templates

`shadcn init` now scaffolds full project templates for: Next.js, Vite, Laravel, React Router, Astro, and TanStack Start (with dark mode included for Next.js and Vite).

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
| `rtl` | RTL support | `true` converts physical to logical CSS classes |
| `registries` | Custom registries | Configure private/third-party component sources |
| `iconLibrary` | Icon library | e.g., `"lucide"` |

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

### Inspect Before Writing (New in CLI v4)

```bash
# Preview what will be added without writing files
npx shadcn@latest add button --dry-run

# Show diff for registry updates
npx shadcn@latest add button --diff

# Show file contents
npx shadcn@latest add button --view
```

### What Happens on `add`

1. CLI reads `components.json` for paths and config
2. Downloads component source from the shadcn registry
3. Copies `.tsx` file to `src/components/ui/<name>.tsx`
4. Installs required npm dependencies (unified `radix-ui` package, etc.)
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
| `lucide-react` | Icon library used by components (configurable via `iconLibrary`) |
| `tw-animate-css` | Animation utilities for Tailwind v4 |
| `sonner` | Toast notification library (used by shadcn Toast) |
| `next-themes` | Dark mode / theme switching for Next.js |
| `radix-ui` | Unified Radix UI primitives package (replaces individual `@radix-ui/react-*`) |

### Installed per Component

Components use the unified `radix-ui` package (for new-york style). Form components require: `react-hook-form`, `@hookform/resolvers`, `zod`. Toast requires: `sonner`.

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

## Unified radix-ui Package

The new-york style now uses the unified `radix-ui` package instead of individual `@radix-ui/react-*` packages:

```typescript
// New (unified package)
import { Dialog as DialogPrimitive } from "radix-ui"

// Old (individual packages -- legacy)
import * as DialogPrimitive from "@radix-ui/react-dialog"
```

### Migration from Individual Packages

```bash
# Migrate all UI components
npx shadcn@latest migrate radix

# Migrate a specific file
npx shadcn@latest migrate radix src/components/ui/dialog.tsx

# Migrate files matching a glob
npx shadcn@latest migrate radix "src/components/ui/**"

# Migrate components outside ui directory
npx shadcn@latest migrate radix src/components/custom/
```

After migration, remove unused `@radix-ui/react-*` packages from `package.json`.

---

## RTL Support

shadcn/ui has first-class RTL support. When `rtl: true` is set in `components.json`, the CLI automatically converts physical CSS classes to logical equivalents:

| Physical | Logical (RTL-safe) |
|---|---|
| `ml-4` / `mr-4` | `ms-4` / `me-4` |
| `pl-2` / `pr-2` | `ps-2` / `pe-2` |
| `left-0` / `right-0` | `start-0` / `end-0` |
| `text-left` / `text-right` | `text-start` / `text-end` |
| `slide-in-from-left` | `slide-in-from-start` |

Icons are automatically flipped using `rtl:rotate-180`.

Migrate existing projects:

```bash
npx shadcn@latest migrate rtl
```

---

## Custom Registries

Configure multiple component registries in `components.json`:

```json
{
  "registries": {
    "@v0": "https://v0.dev/chat/b/{name}",
    "@acme": {
      "url": "https://registry.acme.com/r/{name}",
      "headers": {
        "Authorization": "Bearer ${ACME_REGISTRY_TOKEN}"
      }
    }
  }
}
```

Install from a namespaced registry:

```bash
npx shadcn@latest add @acme/data-table
```

### registry:base (New in CLI v4)

Distribute an entire design system as a single payload -- components, dependencies, CSS vars, fonts, and config:

```bash
npx shadcn@latest add @acme/design-system
```

### registry:font (New in CLI v4)

Fonts are a first-class registry type:

```bash
npx shadcn@latest add @acme/custom-font
```

---

## shadcn/skills (New in CLI v4)

shadcn/skills gives coding agents the context they need to work with components and registries correctly. The skill covers:
- Both Radix and Base UI primitives and updated APIs
- Component patterns and composition rules (FieldGroup for forms, ToggleGroup for option sets, semantic colors)
- Registry workflows and CLI commands with correct flags
- Project detection via `components.json`

The skill runs `shadcn info --json` to inject project config into the agent's context.

---

## shadcn MCP Server

The MCP server lets AI assistants browse, search, and install components from registries:

```json
// .mcp.json (for Claude Code)
{
  "mcpServers": {
    "shadcn": {
      "command": "npx",
      "args": ["-y", "shadcn@latest", "mcp"]
    }
  }
}
```

Supports multiple registries through your project's `components.json`.

---

## Common CLI Commands

| Command | Purpose |
|---------|---------|
| `npx shadcn@latest init` | Initialize project config |
| `npx shadcn@latest init --preset <code>` | Initialize with design preset |
| `npx shadcn@latest init --rtl` | Initialize with RTL support |
| `npx shadcn@latest add <name>` | Add component(s) |
| `npx shadcn@latest add --all` | Add all available components |
| `npx shadcn@latest add <name> --overwrite` | Update existing component |
| `npx shadcn@latest add <name> --dry-run` | Preview changes without writing |
| `npx shadcn@latest add <name> --diff` | Show diff from registry |
| `npx shadcn@latest add <name> --view` | Show file contents |
| `npx shadcn@latest migrate radix` | Migrate to unified radix-ui package |
| `npx shadcn@latest migrate rtl` | Convert physical to logical CSS classes |
| `npx shadcn@latest info` | Show project config as JSON |
| `npx shadcn@latest search <query>` | Search for components |
| `npx shadcn@latest docs <name>` | Show component documentation |
| `npx shadcn@latest build` | Build registry for distribution |

---

**Version:** CLI v4 (March 2026) | **Source:** https://ui.shadcn.com/docs
