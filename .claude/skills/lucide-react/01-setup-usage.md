# Lucide React -- Setup and Usage

> Installation, props reference, styling, color inheritance, and naming conventions.

---

## Installation

```bash
# npm
npm install lucide-react

# pnpm
pnpm add lucide-react

# yarn
yarn add lucide-react

# bun
bun add lucide-react
```

No additional configuration required. Icons are tree-shakeable ES Modules.

---

## Basic Usage

Each icon is a named export that renders an inline SVG element:

```tsx
import { Camera } from 'lucide-react'

const App = () => {
  return <Camera />
}

export default App
```

Multiple icons:

```tsx
import { Home, Settings, User, Bell, Search } from 'lucide-react'

function Header() {
  return (
    <nav className="flex items-center gap-4">
      <Home />
      <Search />
      <Bell />
      <Settings />
      <User />
    </nav>
  )
}
```

---

## Props Reference

All Lucide icon components accept these props plus any standard SVG attributes:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `number \| string` | `24` | Sets both width and height of the icon |
| `color` | `string` | `currentColor` | Stroke color of the icon |
| `strokeWidth` | `number` | `2` | Width of the SVG strokes |
| `absoluteStrokeWidth` | `boolean` | `false` | Keep stroke width constant regardless of icon size |
| `className` | `string` | -- | CSS class name applied to the SVG element |
| `children` | `ReactNode` | -- | SVG children for combining icons |

All standard SVG attributes (e.g., `fill`, `opacity`, `transform`, `x`, `y`) are also accepted as props.

---

## Size

The `size` prop sets both `width` and `height` of the SVG. Default is `24`:

```tsx
import { Star } from 'lucide-react'

function SizeExamples() {
  return (
    <div className="flex items-center gap-4">
      <Star size={16} />   {/* Small */}
      <Star />             {/* Default 24 */}
      <Star size={32} />   {/* Medium */}
      <Star size={48} />   {/* Large */}
      <Star size="2rem" /> {/* String values work too */}
    </div>
  )
}
```

---

## Color

Icons use `currentColor` by default, inheriting the text color from parent elements. This is the recommended approach for consistent theming:

### Color Inheritance (Recommended)

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

The icon automatically picks up the `text-blue-500` color via `currentColor`.

### Explicit Color Prop

```tsx
import { Smile } from 'lucide-react'

function ColorExamples() {
  return (
    <div className="flex gap-4">
      <Smile color="#3e9392" />       {/* Hex */}
      <Smile color="red" />           {/* Named color */}
      <Smile color="rgb(59,130,246)" /> {/* RGB */}
      <Smile color="hsl(220,90%,56%)" /> {/* HSL */}
    </div>
  )
}
```

### With Tailwind CSS Classes

```tsx
import { Heart } from 'lucide-react'

function TailwindColor() {
  return (
    <div>
      {/* Using text color class (works via currentColor) */}
      <Heart className="text-red-500" />

      {/* Hover states */}
      <Heart className="text-gray-400 hover:text-red-500 transition-colors" />

      {/* Dark mode */}
      <Heart className="text-gray-600 dark:text-gray-300" />
    </div>
  )
}
```

---

## Stroke Width

All icons use a default stroke width of `2`. Adjust with `strokeWidth` prop:

```tsx
import { FolderLock } from 'lucide-react'

function StrokeExamples() {
  return (
    <div className="flex gap-4">
      <FolderLock strokeWidth={0.5} /> {/* Thin */}
      <FolderLock strokeWidth={1} />   {/* Light */}
      <FolderLock />                   {/* Default 2 */}
      <FolderLock strokeWidth={3} />   {/* Bold */}
    </div>
  )
}
```

### Absolute Stroke Width

By default, stroke width scales proportionally with icon size. When you resize an icon, strokes get thicker or thinner. Enable `absoluteStrokeWidth` to keep strokes at a constant pixel width:

```tsx
import { RollerCoaster } from 'lucide-react'

function AbsoluteStrokeExample() {
  return (
    <div className="flex items-center gap-4">
      {/* Without absoluteStrokeWidth -- stroke scales with size */}
      <RollerCoaster size={24} />
      <RollerCoaster size={48} />  {/* Stroke appears thicker */}
      <RollerCoaster size={96} />  {/* Stroke appears even thicker */}

      {/* With absoluteStrokeWidth -- stroke stays consistent */}
      <RollerCoaster size={24} absoluteStrokeWidth />
      <RollerCoaster size={48} absoluteStrokeWidth />  {/* Same visual stroke */}
      <RollerCoaster size={96} absoluteStrokeWidth />  {/* Same visual stroke */}
    </div>
  )
}
```

**When to use `absoluteStrokeWidth`:**
- Icons rendered at multiple sizes in the same UI
- Large decorative icons (48px+) where thick strokes look wrong
- Icon size grids or icon pickers

---

## Icon Naming Conventions

### Import Names (PascalCase)

React component imports use PascalCase:

```tsx
import {
  ArrowUp,       // arrow-up
  HeartHandshake, // heart-handshake
  FileText,       // file-text
  CircleCheck,    // circle-check
  ShoppingCart,   // shopping-cart
} from 'lucide-react'
```

### Icon File Names (kebab-case)

The underlying icon identifiers use kebab-case. This is relevant for DynamicIcon and icon search:

| kebab-case (icon name) | PascalCase (React import) |
|------------------------|---------------------------|
| `arrow-up` | `ArrowUp` |
| `heart-handshake` | `HeartHandshake` |
| `file-text` | `FileText` |
| `circle-check` | `CircleCheck` |
| `shopping-cart` | `ShoppingCart` |
| `log-in` | `LogIn` |
| `more-horizontal` | `MoreHorizontal` |

### Naming Rules

- Icons are named by **what they depict**, not their use case (e.g., `floppy-disk` not `save`)
- Grouped icons follow `<group>-<variant>` pattern (e.g., `badge-plus` based on `badge`)
- International English is used (e.g., `color` not `colour`)

---

## Searching for Icons

Browse and search all 1600+ icons at: https://lucide.dev/icons/

Search tips:
- Search by visual description: "arrow", "chart", "user"
- Search by use case: "notification", "settings", "search"
- Filter by category on the website
- Each icon page shows the component name and available aliases

---

## Accessibility

Icons render as inline SVG. For accessible icons:

```tsx
import { AlertTriangle } from 'lucide-react'

// Decorative icon (no screen reader announcement)
function DecorativeIcon() {
  return <AlertTriangle aria-hidden="true" />
}

// Meaningful icon with accessible label
function MeaningfulIcon() {
  return (
    <AlertTriangle
      role="img"
      aria-label="Warning"
    />
  )
}

// Icon button with accessible label
function IconButton() {
  return (
    <button aria-label="Close dialog">
      <X size={20} aria-hidden="true" />
    </button>
  )
}
```

---

## SVG Attributes as Props

Since icons render as SVG elements, all standard SVG attributes work as props:

```tsx
import { Circle } from 'lucide-react'

function SVGAttributeExample() {
  return (
    <Circle
      size={48}
      fill="currentColor"     // Fill the shape
      fillOpacity={0.1}        // Semi-transparent fill
      strokeDasharray="4 2"    // Dashed stroke
      opacity={0.8}            // Overall opacity
      transform="rotate(45)"  // SVG transform
    />
  )
}
```

---

## Common Icon Categories

| Category | Common Icons |
|----------|-------------|
| Navigation | `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `ChevronDown`, `ChevronRight`, `Menu`, `X` |
| Actions | `Plus`, `Minus`, `Trash2`, `Edit`, `Copy`, `Download`, `Upload`, `Share2` |
| Status | `Check`, `X`, `AlertCircle`, `AlertTriangle`, `Info`, `HelpCircle` |
| Media | `Play`, `Pause`, `SkipForward`, `Volume2`, `Camera`, `Image` |
| Communication | `Mail`, `MessageSquare`, `Phone`, `Send`, `Bell` |
| Files | `File`, `FileText`, `Folder`, `FolderOpen`, `Save` |
| Users | `User`, `Users`, `UserPlus`, `UserMinus`, `LogIn`, `LogOut` |
| UI | `Search`, `Settings`, `Filter`, `SortAsc`, `Eye`, `EyeOff`, `MoreHorizontal` |
| Social | `Heart`, `ThumbsUp`, `Star`, `Bookmark`, `Share2` |

---

**Version:** ^0.500.0 | **Source:** https://lucide.dev/guide/react/getting-started
