---
name: lucide-react
description: "Lucide React icons - tree-shakeable SVG icons, customizable props, dynamic imports, shadcn/ui integration"
when_to_use: "adding icons, customizing icon appearance, or optimizing icon bundle size"
---

# lucide-react

> Tree-shakeable SVG icon library for React with 1600+ icons, customizable via props, fully typed with TypeScript.

**Stack:** lucide-react ^0.500.0 | React 19 | TypeScript | Next.js 15.5

---

## When to Use

**LOAD THIS SKILL** when user is:
- Adding icons to a React or Next.js project
- Customizing icon size, color, strokeWidth, or absoluteStrokeWidth
- Using DynamicIcon for CMS-driven or database-driven icon names
- Creating custom icons with the Icon component and IconNode
- Setting up global icon styling via LucideProvider or CSS
- Passing icon components as props with LucideIcon type
- Combining or nesting Lucide icons to create composite icons
- Optimizing icon bundle size and tree-shaking

---

## Critical Rules

**ALWAYS:**
1. Import icons individually by name -- tree-shaking only works with named imports (`import { Camera } from 'lucide-react'`)
2. Use `currentColor` inheritance for icon color -- icons inherit parent text color by default, no explicit color needed when parent sets it
3. Use `LucideIcon` type when passing icon components as props -- provides full type safety (`icon: LucideIcon`)
4. Use `absoluteStrokeWidth` when icons render at multiple sizes -- keeps stroke visually consistent across 16px to 96px
5. Use `LucideProvider` for global defaults when individual overrides are needed -- CSS global styling prevents per-icon prop overrides
6. Use kebab-case for DynamicIcon `name` prop -- e.g. `name="arrow-up"`, not `name="ArrowUp"`

**NEVER:**
1. Import all icons with barrel import -- destroys tree-shaking and adds all 1600+ icons to bundle
2. Use DynamicIcon for static/known icons -- it imports ALL icons at build time, increasing bundle size significantly
3. Use CSS global styling with `.lucide` class when you need per-icon prop overrides -- CSS specificity overrides props
4. Hardcode SVG markup when a Lucide icon exists -- check https://lucide.dev/icons/ first
5. Use `className="w-6 h-6"` without also setting `size` prop -- Tailwind classes and SVG size attributes may conflict

---

## Core Patterns

### Basic Icon Usage

```tsx
import { Camera, Heart, Settings } from 'lucide-react'

export function IconExamples() {
  return (
    <div className="flex gap-2">
      <Camera />
      <Heart size={32} color="red" />
      <Settings size={48} strokeWidth={1} absoluteStrokeWidth />
    </div>
  )
}
```

### Icon Component as Prop (Typed)

```tsx
import { type LucideIcon } from 'lucide-react'
import { AlertCircle, CheckCircle, Info } from 'lucide-react'

interface AlertProps {
  icon: LucideIcon
  message: string
}

function Alert({ icon: Icon, message }: AlertProps) {
  return (
    <div className="flex items-center gap-2">
      <Icon size={20} className="shrink-0" />
      <span>{message}</span>
    </div>
  )
}

// Usage
<Alert icon={CheckCircle} message="Saved successfully" />
<Alert icon={AlertCircle} message="Something went wrong" />
```

### Color Inheritance from Parent

```tsx
import { ThumbsUp } from 'lucide-react'

function LikeButton() {
  return (
    <button className="text-blue-500 hover:text-blue-700">
      <ThumbsUp />
      Like
    </button>
  )
}
```

### Global Defaults with LucideProvider

```tsx
import { LucideProvider, Home, Settings, User } from 'lucide-react'

function App() {
  return (
    <LucideProvider size={20} strokeWidth={1.5}>
      <Home />
      <Settings />
      <User color="blue" /> {/* overrides provider color */}
    </LucideProvider>
  )
}
```

### DynamicIcon (CMS / Database Icons)

```tsx
import { DynamicIcon } from 'lucide-react/dynamic'

interface FeatureCardProps {
  iconName: string
  title: string
}

function FeatureCard({ iconName, title }: FeatureCardProps) {
  return (
    <div className="flex items-center gap-3">
      <DynamicIcon name={iconName} size={24} />
      <h3>{title}</h3>
    </div>
  )
}

// iconName comes from database as kebab-case: "heart", "arrow-up", "settings"
```

### Custom Icon with IconNode

```tsx
import { type IconNode, Icon } from 'lucide-react'

const customIcon: IconNode = [
  ['circle', { cx: 12, cy: 12, r: 10 }],
  ['line', { x1: 12, y1: 8, x2: 12, y2: 12 }],
  ['line', { x1: 12, y1: 16, x2: 12, y2: 16 }],
]

function MyCustomIcon() {
  return <Icon iconNode={customIcon} size={24} color="blue" />
}
```

---

## Anti-Patterns

**BAD** -- Importing all icons (kills tree-shaking):
```tsx
import * as icons from 'lucide-react'
const Icon = icons['Camera']
```
**GOOD** -- Named individual imports:
```tsx
import { Camera } from 'lucide-react'
```

**BAD** -- Using DynamicIcon for known, static icons:
```tsx
import { DynamicIcon } from 'lucide-react/dynamic'
<DynamicIcon name="settings" />  // Imports ALL icons at build time!
```
**GOOD** -- Direct import for static icons:
```tsx
import { Settings } from 'lucide-react'
<Settings />  // Only this icon included in bundle
```

**BAD** -- Untyped icon prop:
```tsx
interface Props {
  icon: React.ComponentType<any>  // Loses Lucide prop types
}
```
**GOOD** -- Using LucideIcon type:
```tsx
import { type LucideIcon } from 'lucide-react'
interface Props {
  icon: LucideIcon  // Full type safety for size, color, strokeWidth
}
```

**BAD** -- CSS global styling when needing per-icon overrides:
```css
.lucide { width: 24px; height: 24px; color: blue; }
```
```tsx
<Home color="red" />  {/* CSS specificity overrides this! */}
```
**GOOD** -- LucideProvider for overridable defaults:
```tsx
<LucideProvider size={24} color="blue">
  <Home color="red" />  {/* This override works */}
</LucideProvider>
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Basic icon | Named import | `import { Camera } from 'lucide-react'` |
| Set size | `size` prop | `<Camera size={32} />` |
| Set color | `color` prop | `<Camera color="#3e9392" />` |
| Stroke width | `strokeWidth` prop | `<Camera strokeWidth={1.5} />` |
| Fixed stroke | `absoluteStrokeWidth` | `<Camera size={48} absoluteStrokeWidth />` |
| Tailwind color | `className` | `<Camera className="text-blue-500" />` |
| Type icon prop | `LucideIcon` | `icon: LucideIcon` |
| Type icon props | `LucideProps` | `(props: LucideProps) => ...` |
| Dynamic by name | `DynamicIcon` | `<DynamicIcon name="camera" />` |
| Custom icon | `Icon` + `IconNode` | `<Icon iconNode={myIcon} />` |
| Lab icons | `Icon` + `@lucide/lab` | `<Icon iconNode={coconut} />` |
| Global defaults | `LucideProvider` | `<LucideProvider size={20}>...</LucideProvider>` |
| CSS global | `.lucide` class | `.lucide { width: 20px; }` |
| Combine icons | Nest children | `<Scan><User x={6} y={6} /></Scan>` |
| Search icons | Website | https://lucide.dev/icons/ |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Installation, basic usage, all props, styling with Tailwind, color inheritance | [01-setup-usage.md](01-setup-usage.md) |
| DynamicIcon, Icon component, IconNode, Lucide Lab, combining/nesting icons | [02-advanced.md](02-advanced.md) |
| shadcn/ui patterns, Tailwind v4 integration, Next.js optimization, LucideProvider | [03-integration.md](03-integration.md) |

---

**Version:** ^0.500.0 | **Source:** https://lucide.dev/guide/packages/lucide-react
