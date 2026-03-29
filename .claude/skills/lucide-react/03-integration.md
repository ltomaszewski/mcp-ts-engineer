# Lucide React -- Integration Patterns

> shadcn/ui usage, Tailwind CSS v4 styling, Next.js optimization, and bundle size strategies.

---

## shadcn/ui Integration

shadcn/ui uses Lucide React as its icon library. Icons are used throughout shadcn/ui components and examples.

### shadcn/ui Components with Icons

```tsx
import { Button } from "@/components/ui/button"
import { Plus, Download, Trash2, Loader2 } from "lucide-react"

function ActionButtons() {
  return (
    <div className="flex gap-2">
      {/* Icon + text */}
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Add Item
      </Button>

      {/* Icon-only button */}
      <Button variant="outline" size="icon">
        <Download className="h-4 w-4" />
      </Button>

      {/* Destructive with icon */}
      <Button variant="destructive">
        <Trash2 className="mr-2 h-4 w-4" />
        Delete
      </Button>

      {/* Loading state */}
      <Button disabled>
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Please wait
      </Button>
    </div>
  )
}
```

### Navigation Menu with Icons

```tsx
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu"
import { LayoutDashboard, Users, Settings, BarChart } from "lucide-react"

function MainNav() {
  return (
    <NavigationMenu>
      <NavigationMenuList>
        <NavigationMenuItem>
          <NavigationMenuTrigger>
            <LayoutDashboard className="mr-2 h-4 w-4" />
            Dashboard
          </NavigationMenuTrigger>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  )
}
```

### Sidebar Pattern (shadcn/ui)

```tsx
import { type LucideIcon } from "lucide-react"
import {
  Home, Inbox, Calendar, Search, Settings,
  ChevronDown, Plus
} from "lucide-react"
import { cn } from "@/lib/utils"

interface SidebarItemProps {
  icon: LucideIcon
  label: string
  href: string
  isActive?: boolean
}

function SidebarItem({ icon: Icon, label, href, isActive }: SidebarItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </a>
  )
}

const sidebarItems: SidebarItemProps[] = [
  { icon: Home, label: "Home", href: "/", isActive: true },
  { icon: Inbox, label: "Inbox", href: "/inbox" },
  { icon: Calendar, label: "Calendar", href: "/calendar" },
  { icon: Search, label: "Search", href: "/search" },
  { icon: Settings, label: "Settings", href: "/settings" },
]

function Sidebar() {
  return (
    <aside className="w-64 border-r p-4">
      <nav className="space-y-1">
        {sidebarItems.map((item) => (
          <SidebarItem key={item.href} {...item} />
        ))}
      </nav>
    </aside>
  )
}
```

### Alert / Toast with Icons

```tsx
import { AlertCircle, CheckCircle2, Info, AlertTriangle } from "lucide-react"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"

function AlertExamples() {
  return (
    <div className="space-y-4">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Info</AlertTitle>
        <AlertDescription>This is an informational message.</AlertDescription>
      </Alert>

      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>Something went wrong.</AlertDescription>
      </Alert>
    </div>
  )
}
```

### DropdownMenu with Icons

```tsx
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Edit, Copy, Trash2, Share2 } from "lucide-react"

function ActionsMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem>
          <Edit className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Copy className="mr-2 h-4 w-4" />
          Duplicate
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive">
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### Common shadcn/ui Icon Sizes

| Context | Class | Size |
|---------|-------|------|
| Button icon (with text) | `h-4 w-4` | 16px |
| Button icon-only (size="icon") | `h-4 w-4` | 16px |
| Sidebar navigation | `h-4 w-4` | 16px |
| Alert leading icon | `h-4 w-4` | 16px |
| Dropdown menu item | `h-4 w-4` | 16px |
| Card header icon | `h-5 w-5` | 20px |
| Empty state | `h-12 w-12` | 48px |
| Page hero | `h-16 w-16` | 64px |

---

## Tailwind CSS v4 Styling

### Size with Tailwind Classes

```tsx
import { Star } from 'lucide-react'

function TailwindSizing() {
  return (
    <div className="flex gap-4">
      <Star className="h-4 w-4" />     {/* 16px */}
      <Star className="h-5 w-5" />     {/* 20px */}
      <Star className="h-6 w-6" />     {/* 24px */}
      <Star className="h-8 w-8" />     {/* 32px */}
      <Star className="size-4" />      {/* 16px -- Tailwind v4 shorthand */}
      <Star className="size-6" />      {/* 24px */}
    </div>
  )
}
```

### Color with Tailwind

```tsx
import { Heart, Bell, Shield } from 'lucide-react'

function TailwindColors() {
  return (
    <div className="flex gap-4">
      {/* Semantic colors (shadcn/ui tokens) */}
      <Heart className="text-destructive" />
      <Bell className="text-primary" />
      <Shield className="text-muted-foreground" />

      {/* Tailwind palette colors */}
      <Heart className="text-red-500" />
      <Bell className="text-blue-600" />
      <Shield className="text-emerald-500" />

      {/* Dark mode aware */}
      <Heart className="text-red-500 dark:text-red-400" />
    </div>
  )
}
```

### Transitions and Animations

```tsx
import { Heart, ChevronDown, RefreshCw, Loader2 } from 'lucide-react'

function AnimatedIcons() {
  return (
    <div className="flex gap-4">
      {/* Hover color transition */}
      <Heart className="text-gray-400 transition-colors hover:text-red-500" />

      {/* Rotate on hover (accordion chevron) */}
      <ChevronDown className="transition-transform data-[state=open]:rotate-180" />

      {/* Continuous spin (loading) */}
      <Loader2 className="animate-spin" />

      {/* Spin on click */}
      <RefreshCw className="transition-transform active:rotate-180" />

      {/* Scale on hover */}
      <Heart className="transition-transform hover:scale-125" />
    </div>
  )
}
```

### Responsive Icons

```tsx
import { Menu, X } from 'lucide-react'

function ResponsiveIcon() {
  return (
    <button>
      {/* Smaller on mobile, larger on desktop */}
      <Menu className="size-5 md:size-6" />
    </button>
  )
}
```

---

## Next.js Optimization

### Tree-Shaking (Automatic)

Next.js with its default bundler (Turbopack or Webpack) tree-shakes lucide-react automatically. Named imports ensure only used icons are bundled:

```tsx
// GOOD -- only Camera and Heart are included in the bundle
import { Camera, Heart } from 'lucide-react'

// BAD -- imports entire library, ALL 1600+ icons bundled
import * as LucideIcons from 'lucide-react'
```

### Server Components (Default in Next.js 15)

Lucide icons work in both Server and Client Components:

```tsx
// app/page.tsx (Server Component -- no "use client" needed)
import { Rocket, Star, Zap } from 'lucide-react'

export default function HomePage() {
  return (
    <section className="flex flex-col items-center gap-6 py-20">
      <div className="flex gap-4">
        <Rocket className="size-8 text-primary" />
        <Star className="size-8 text-yellow-500" />
        <Zap className="size-8 text-orange-500" />
      </div>
      <h1 className="text-4xl font-bold">Welcome</h1>
    </section>
  )
}
```

### Client Components with Interactive Icons

```tsx
"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

function LikeButton() {
  const [liked, setLiked] = useState(false)

  return (
    <button
      onClick={() => setLiked(!liked)}
      className="flex items-center gap-1"
    >
      <Heart
        className={cn(
          "size-5 transition-colors",
          liked ? "fill-red-500 text-red-500" : "text-gray-400"
        )}
      />
      <span>{liked ? "Liked" : "Like"}</span>
    </button>
  )
}
```

---

## Bundle Size Strategies

Each Lucide icon adds approximately 200-500 bytes (gzipped) to your bundle. With tree-shaking, you only pay for icons you import.

### Strategy Comparison

| Approach | Bundle Impact | When to Use |
|----------|--------------|-------------|
| Named imports | Minimal (~300B per icon) | Default for all static icons |
| DynamicIcon | All icons (~300KB+) | Only when icon name is truly dynamic |
| Icon + IconNode | Minimal (custom data only) | Custom icons, Lucide Lab |
| Icon map (Record) | Only mapped icons | Known set with string lookup |

### Barrel Import Detection

If your linter supports it, flag barrel imports:

```tsx
// biome.json or ESLint rule to prevent:
import * as Icons from 'lucide-react'       // BAD
import { icons } from 'lucide-react'         // BAD

// Only allow named imports:
import { Camera, Heart } from 'lucide-react' // GOOD
```

---

## Common Patterns

### Icon with Loading State

```tsx
"use client"

import { type LucideIcon } from "lucide-react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface LoadingButtonProps {
  icon: LucideIcon
  label: string
  isLoading: boolean
  onClick: () => void
}

function LoadingButton({ icon: Icon, label, isLoading, onClick }: LoadingButtonProps) {
  return (
    <Button onClick={onClick} disabled={isLoading}>
      {isLoading ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Icon className="mr-2 h-4 w-4" />
      )}
      {label}
    </Button>
  )
}
```

### Empty State with Icon

```tsx
import { Inbox } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Inbox className="h-12 w-12 text-muted-foreground mb-4" />
      <h3 className="text-lg font-semibold">No items yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Get started by creating your first item.
      </p>
      <Button>
        <Plus className="mr-2 h-4 w-4" />
        Create Item
      </Button>
    </div>
  )
}
```

### Status Indicator with Icon

```tsx
import { type LucideIcon } from "lucide-react"
import { CheckCircle2, XCircle, Clock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

type Status = "success" | "error" | "pending" | "warning"

const statusConfig: Record<Status, { icon: LucideIcon; className: string; label: string }> = {
  success: { icon: CheckCircle2, className: "text-green-500", label: "Success" },
  error: { icon: XCircle, className: "text-red-500", label: "Error" },
  pending: { icon: Clock, className: "text-yellow-500", label: "Pending" },
  warning: { icon: AlertTriangle, className: "text-orange-500", label: "Warning" },
}

function StatusBadge({ status }: { status: Status }) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <div className={cn("flex items-center gap-1.5 text-sm", config.className)}>
      <Icon className="h-4 w-4" />
      <span>{config.label}</span>
    </div>
  )
}
```

### Search Input with Icon

```tsx
import { Search, X } from "lucide-react"
import { Input } from "@/components/ui/input"

function SearchInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder="Search..." className="pl-9" />
    </div>
  )
}
```

---

## Troubleshooting

| Problem | Cause | Fix |
|---------|-------|-----|
| Icon not rendering | Wrong import name | Check https://lucide.dev/icons/ for exact PascalCase name |
| Bundle size too large | Barrel import or DynamicIcon | Use named imports for static icons |
| Color prop not working | CSS global styling overrides | Switch from `.lucide` CSS to `LucideProvider` |
| Stroke looks too thick at large size | Default relative stroke scaling | Add `absoluteStrokeWidth` prop |
| Icon invisible | Color matches background | Check `color` prop or inherited `currentColor` |
| TypeScript error on icon prop | Using `React.ComponentType` | Use `LucideIcon` type from `lucide-react` |
| DynamicIcon flash | Client-side dynamic loading | Expected behavior; use static imports when possible |

---

**Version:** ^0.500.0 | **Source:** https://lucide.dev/guide/packages/lucide-react, https://lucide.dev/guide/react/getting-started
