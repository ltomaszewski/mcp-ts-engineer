# shadcn/ui Customization

> Theme customization, CSS variables, dark mode, CVA variants, and the cn() utility.

---

## Theme Architecture

shadcn/ui theming uses a layered system:

1. **CSS variables** in `globals.css` define raw color values (OKLCH format)
2. **`@theme inline`** maps CSS variables to Tailwind utility classes
3. **Components** reference semantic tokens like `bg-primary`, `text-muted-foreground`
4. **Dark mode** via `.dark` class overrides the same CSS variables

Changing a single CSS variable updates every component that uses that token.

---

## CSS Variable Naming Convention

Background + foreground pattern. The `background` suffix is omitted in utilities:

| Variable | Tailwind Usage | Purpose |
|----------|---------------|---------|
| `--background` / `--foreground` | `bg-background text-foreground` | Page background/text |
| `--primary` / `--primary-foreground` | `bg-primary text-primary-foreground` | Primary actions |
| `--secondary` / `--secondary-foreground` | `bg-secondary text-secondary-foreground` | Secondary surfaces |
| `--muted` / `--muted-foreground` | `bg-muted text-muted-foreground` | De-emphasized content |
| `--accent` / `--accent-foreground` | `bg-accent text-accent-foreground` | Highlights |
| `--destructive` / `--destructive-foreground` | `bg-destructive` | Danger/error |
| `--card` / `--card-foreground` | `bg-card text-card-foreground` | Card surfaces |
| `--popover` / `--popover-foreground` | `bg-popover` | Dropdowns/popovers |
| `--border` | `border-border` | Default borders |
| `--input` | `border-input` | Form input borders |
| `--ring` | `ring-ring` | Focus rings |
| `--radius` | `rounded-lg` | Border radius base |
| `--chart-1..5` | `text-chart-1` | Data visualization |
| `--sidebar-*` | `bg-sidebar` | Sidebar component |

---

## Customizing Theme Colors

Edit CSS variables in `globals.css` `:root` and `.dark` blocks, then map them via `@theme inline`. All colors use OKLCH format.

For detailed Tailwind v4 theming (`@theme inline`, `@custom-variant`, OKLCH color format, container queries), see `tailwind-v4/03-theming.md`.

### Adding Custom shadcn Tokens

```css
:root {
  --success: oklch(0.723 0.219 149.58);
  --success-foreground: oklch(0.985 0 0);
}
.dark {
  --success: oklch(0.6 0.2 149.58);
  --success-foreground: oklch(0.985 0 0);
}

@theme inline {
  --color-success: var(--success);
  --color-success-foreground: var(--success-foreground);
}
```

Then use: `<div className="bg-success text-success-foreground">Done</div>`

---

## Border Radius

The `--radius` variable controls all radii. Components derive specific sizes:

```css
@theme inline {
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}
```

| Style | Value |
|-------|-------|
| Sharp | `--radius: 0` |
| Subtle | `--radius: 0.375rem` |
| Default | `--radius: 0.625rem` |
| Rounded | `--radius: 1rem` |

---

## CVA (class-variance-authority)

Type-safe component variants used internally by Button, Badge, Alert, etc.

```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const alertVariants = cva(
  "relative w-full rounded-lg border px-4 py-3 text-sm", // base
  {
    variants: {
      variant: {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive",
        success: "border-green-500/50 text-green-700",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface AlertProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

function Alert({ className, variant, ...props }: AlertProps) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}
export { Alert, alertVariants }
```

### Compound Variants

```typescript
const buttonVariants = cva("inline-flex items-center justify-center", {
  variants: {
    variant: { default: "bg-primary", outline: "border bg-background" },
    size: { default: "h-10 px-4", sm: "h-9 px-3" },
  },
  compoundVariants: [
    { variant: "outline", size: "sm", className: "border-2" },
  ],
  defaultVariants: { variant: "default", size: "default" },
})
```

---

## The cn() Utility

```typescript
// src/lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
```

`clsx` handles conditionals, `twMerge` resolves Tailwind conflicts (last wins):

```typescript
cn("px-4 bg-red-500", "bg-blue-500")  // => "px-4 bg-blue-500"
cn("base", isActive && "active")       // => "base active" or "base"
cn("base", { error: hasError })        // => "base error" (if true)
```

**Pattern:** Always accept and merge `className` prop:

```tsx
function MyCard({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-lg border p-4", className)} {...props} />
}
```

---

## Extending Components

### Add Variants to Button

Edit `src/components/ui/button.tsx` directly (you own the code):

```typescript
// Add to existing buttonVariants
variants: {
  variant: {
    // ...existing variants...
    success: "bg-green-600 text-white hover:bg-green-700",
    warning: "bg-yellow-500 text-black hover:bg-yellow-600",
  },
  size: {
    // ...existing sizes...
    xl: "h-14 px-10 text-lg",
  },
}
```

### Create Wrapper Components

```tsx
import { Button, type ButtonProps } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoadingButtonProps extends ButtonProps { loading?: boolean }

export function LoadingButton({ loading, disabled, children, className, ...props }: LoadingButtonProps) {
  return (
    <Button disabled={disabled || loading} className={cn(loading && "cursor-not-allowed", className)} {...props}>
      {loading && <Loader2 className="animate-spin" data-icon="inline-start" />}
      {children}
    </Button>
  )
}
```

---

## Dark Mode

Powered by `next-themes`. The `.dark` class on `<html>` activates dark CSS variables. Use `useTheme()` from `next-themes` for toggle controls.

For `@custom-variant` dark mode setup in Tailwind v4, see `tailwind-v4/03-theming.md`.

---

## data-slot Convention (v4)

Components use `data-slot` instead of `forwardRef`:

```tsx
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="card" className={cn("rounded-lg border", className)} {...props} />
}

// Enables parent-level styling
<div className="[&_[data-slot=card]]:shadow-lg">
  <Card>Styled via data-slot</Card>
</div>
```

---

## Animation (tw-animate-css)

```css
@import "tw-animate-css"; /* in globals.css */
```

| Class | Effect |
|-------|--------|
| `animate-in` / `animate-out` | Enter/exit |
| `fade-in-0` / `fade-out-0` | Opacity |
| `zoom-in-95` / `zoom-out-95` | Scale |
| `slide-in-from-top` / `right` / `bottom` / `left` | Directional |

---

**Version:** CLI v4 (March 2026) | **Source:** https://ui.shadcn.com/docs
