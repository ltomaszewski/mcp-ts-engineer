---
name: shadcn-ui
description: shadcn/ui component library - CLI installation, Radix primitives, CVA variants, Tailwind v4 theming, accessible components. Use when adding UI components, building forms, or customizing design tokens.
---

# shadcn/ui

> Copy-paste component library built on Radix primitives with Tailwind CSS styling and full source ownership.

**Stack:** shadcn/ui latest | Radix UI | Tailwind v4 | CVA | TypeScript

---

## When to Use

**LOAD THIS SKILL** when user is:
- Adding UI components to a Next.js project (Button, Dialog, Form, Table, etc.)
- Building forms with react-hook-form + zod + shadcn Field components
- Customizing theme colors, dark mode, or design tokens in globals.css
- Creating component variants with CVA (class-variance-authority)
- Installing or configuring shadcn/ui CLI (`npx shadcn@latest`)
- Composing Radix primitives into custom components
- Setting up toast notifications with Sonner

---

## Critical Rules

**ALWAYS:**
1. Install components via CLI (`npx shadcn@latest add <name>`) -- components are copied to `src/components/ui/`, not imported from a package
2. Use the `cn()` utility for conditional classes -- combines `clsx` + `tailwind-merge` to resolve conflicts
3. Import from `@/components/ui/<component>` -- path alias configured in `components.json`
4. Use CSS variables in `globals.css` for theming -- components reference `--background`, `--primary`, etc.
5. Use `@theme inline` directive for Tailwind v4 -- maps CSS variables to Tailwind utility classes
6. Use OKLCH color format for v4 projects -- perceptually uniform, better accessibility
7. Wrap forms with react-hook-form `Controller` + `Field` components -- provides validation and accessibility
8. Add `data-slot` attributes when building custom components -- follows shadcn/ui v4 convention

**NEVER:**
1. Install shadcn/ui as an npm package -- it is NOT a dependency; components are source files you own
2. Use `hsl()` color format in Tailwind v4 projects -- v4 uses OKLCH; HSL is deprecated
3. Use `tailwindcss-animate` with Tailwind v4 -- deprecated in favor of `tw-animate-css`
4. Use `forwardRef` in v4 projects -- removed; use direct function components with `data-slot`
5. Modify components in `node_modules` -- components live in `src/components/ui/`, edit them directly
6. Skip the `htmlFor`/`id` association on Label+Input -- breaks accessibility

---

## Core Patterns

### Adding Components via CLI

```bash
# Initialize shadcn/ui in a Next.js project
npx shadcn@latest init

# Add individual components
npx shadcn@latest add button
npx shadcn@latest add card dialog form input select

# Add all components at once
npx shadcn@latest add --all

# Overwrite existing components with latest
npx shadcn@latest add --all --overwrite
```

### Using the cn() Utility

```typescript
import { cn } from "@/lib/utils"

// Merge conditional classes with conflict resolution
function MyComponent({ className, isActive }: Props) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isActive && "border-primary bg-primary/10",
        className
      )}
    />
  )
}
```

### Basic Component Usage

```tsx
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function DashboardCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue</CardTitle>
        <CardDescription>Monthly overview</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">$12,450</p>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm">View details</Button>
      </CardFooter>
    </Card>
  )
}
```

### Form with Zod Validation (react-hook-form)

```tsx
"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const schema = z.object({
  email: z.string().email("Invalid email"),
  name: z.string().min(2, "Min 2 characters"),
})
type FormValues = z.infer<typeof schema>

export function ContactForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "", name: "" },
  })
  return (
    <form onSubmit={form.handleSubmit((data) => console.log(data))} className="space-y-4">
      <Controller name="name" control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Name</FieldLabel>
            <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )} />
      <Button type="submit">Submit</Button>
    </form>
  )
}
```

### Creating Variants with CVA

```typescript
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive text-destructive-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}
```

### Dialog (Controlled)

```tsx
"use client"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog, DialogContent, DialogDescription,
  DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

export function ConfirmDialog() {
  const [open, setOpen] = useState(false)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="destructive">Delete</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Are you sure?</DialogTitle>
          <DialogDescription>This action cannot be undone.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={() => setOpen(false)}>Delete</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### Toast Notifications (Sonner)

```tsx
import { toast } from "sonner"

toast("Default")              // neutral
toast.success("Saved!")       // green check
toast.error("Failed")         // red error
toast.warning("Check input")  // yellow warning
toast.info("Update ready")    // blue info
```

---

## Anti-Patterns

**BAD** -- Installing as npm package:
```bash
npm install shadcn-ui  # Does NOT exist as a package!
```
**GOOD** -- CLI copies source files you own:
```bash
npx shadcn@latest add button  # => src/components/ui/button.tsx
```

**BAD** -- Hardcoding colors:
```tsx
<div className="bg-[#1a1a2e] text-[#ffffff]">Content</div>
```
**GOOD** -- Semantic tokens:
```tsx
<div className="bg-background text-foreground">Content</div>
```

**BAD** -- Concatenating classes manually:
```tsx
<div className={`rounded-lg ${isActive ? "border-blue-500" : ""} ${className}`} />
```
**GOOD** -- Using cn():
```tsx
<div className={cn("rounded-lg", isActive && "border-primary", className)} />
```

**BAD** -- HSL in Tailwind v4:
```css
:root { --primary: 222.2 47.4% 11.2%; }
```
**GOOD** -- OKLCH in Tailwind v4:
```css
:root { --primary: oklch(0.21 0.034 264.66); }
```

---

## Quick Reference

| Task | Command / API | Example |
|------|--------------|---------|
| Init project | `npx shadcn@latest init` | Interactive setup with components.json |
| Add component | `npx shadcn@latest add` | `npx shadcn@latest add button card dialog` |
| Merge classes | `cn()` | `cn("base", condition && "active", className)` |
| Button variants | `variant` prop | `<Button variant="outline" size="sm">` |
| Dark mode | next-themes | `<ThemeProvider attribute="class" defaultTheme="system">` |
| Toast | `toast()` from sonner | `toast.success("Saved!")` |
| Form field | `Controller` + `Field` | `<Controller name="x" control={control} render={...} />` |
| Zod resolver | `zodResolver()` | `resolver: zodResolver(schema)` |
| CVA variant | `cva()` | `cva("base-classes", { variants: { ... } })` |
| Theme colors | CSS variables | `--primary: oklch(0.21 0.034 264.66)` |
| Sheet side | `side` prop | `<SheetContent side="left">` |
| asChild | Render as child element | `<Button asChild><Link href="/">Home</Link></Button>` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Installation, CLI, components.json, project structure, dependencies | [01-setup.md](01-setup.md) |
| Component APIs: Button, Card, Dialog, Select, Table, Tabs, Toast, Sheet | [02-components.md](02-components.md) |
| Theme customization, CSS variables, OKLCH, dark mode, CVA, cn() | [03-customization.md](03-customization.md) |

---

**Version:** latest (2025) | **Source:** https://ui.shadcn.com/docs
