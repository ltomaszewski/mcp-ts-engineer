# Lucide React -- Advanced Usage

> DynamicIcon, Icon component, IconNode, Lucide Lab, combining icons, TypeScript types, and global styling.

---

## DynamicIcon Component

`DynamicIcon` loads icons by name at runtime. Useful when icon names come from a CMS, database, or user configuration.

### Import and Basic Usage

```tsx
import { DynamicIcon } from 'lucide-react/dynamic'

const App = () => (
  <DynamicIcon name="camera" color="red" size={48} />
)
```

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | Yes | Icon name in kebab-case (e.g., `"arrow-up"`, `"heart-handshake"`) |
| `size` | `number \| string` | No | Width and height (default: `24`) |
| `color` | `string` | No | Stroke color (default: `currentColor`) |
| `strokeWidth` | `number` | No | Stroke width (default: `2`) |
| `absoluteStrokeWidth` | `boolean` | No | Constant stroke width regardless of size |

All standard `LucideProps` and SVG attributes are also accepted.

### CMS-Driven Example

```tsx
import { DynamicIcon } from 'lucide-react/dynamic'

interface Feature {
  id: string
  icon: string    // kebab-case from database: "shield-check"
  title: string
  description: string
}

function FeatureCard({ icon, title, description }: Feature) {
  return (
    <div className="rounded-lg border p-6">
      <DynamicIcon name={icon} size={32} className="text-primary mb-3" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  )
}

function FeaturesGrid({ features }: { features: Feature[] }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {features.map((feature) => (
        <FeatureCard key={feature.id} {...feature} />
      ))}
    </div>
  )
}
```

### Caveats

| Issue | Impact |
|-------|--------|
| All icons imported at build time | Increases build time |
| Separate module per icon | Can increase network requests |
| Flash on load | Icon may flash when loading dynamically |
| Bundle size | ALL 1600+ icons included even if only a few are used |

**Rule:** Only use `DynamicIcon` when icon names are truly dynamic (database, CMS, API). For known/static icons, always use direct named imports.

---

## Icon Component

The `Icon` component renders icons from raw `IconNode` data. Used for Lucide Lab icons and custom icon definitions.

### With Lucide Lab

Lucide Lab provides experimental icons not in the main library:

```bash
npm install @lucide/lab
```

```tsx
import { Icon } from 'lucide-react'
import { coconut } from '@lucide/lab'

function App() {
  return (
    <Icon iconNode={coconut} size={24} color="brown" />
  )
}
```

All standard Lucide props (`size`, `color`, `strokeWidth`, `absoluteStrokeWidth`) work on the `Icon` component.

### Icon Component Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `iconNode` | `IconNode` | Yes | Array of SVG element definitions |
| `size` | `number \| string` | No | Width and height (default: `24`) |
| `color` | `string` | No | Stroke color (default: `currentColor`) |
| `strokeWidth` | `number` | No | Stroke width (default: `2`) |
| `absoluteStrokeWidth` | `boolean` | No | Constant stroke width |

---

## Custom Icons with IconNode

`IconNode` is an array of SVG element tuples: `[elementName, attributes][]`.

### IconNode Type Definition

```typescript
type IconNode = [elementName: string, attrs: Record<string, string | number>][]
```

### Creating Custom Icons

```tsx
import { type IconNode, Icon } from 'lucide-react'

// Custom warning icon
const warningIcon: IconNode = [
  ['circle', { cx: 12, cy: 12, r: 10 }],
  ['line', { x1: 12, y1: 8, x2: 12, y2: 12 }],
  ['line', { x1: 12, y1: 16, x2: 12, y2: 16 }],
]

function WarningIcon() {
  return <Icon iconNode={warningIcon} size={24} color="orange" />
}
```

### Reusable Custom Icon Component

```tsx
import { type IconNode, type LucideProps, Icon } from 'lucide-react'

const brandLogoNode: IconNode = [
  ['path', { d: 'M12 2L2 7l10 5 10-5-10-5z' }],
  ['path', { d: 'M2 17l10 5 10-5' }],
  ['path', { d: 'M2 12l10 5 10-5' }],
]

function BrandLogo(props: LucideProps) {
  return <Icon iconNode={brandLogoNode} {...props} />
}

// Usage -- behaves like any other Lucide icon
function Header() {
  return (
    <nav>
      <BrandLogo size={32} className="text-primary" />
    </nav>
  )
}
```

All IconNode icons render within a 24x24 viewBox. Supported SVG elements: `path`, `circle`, `rect`, `line`, `polyline`, `polygon`, `ellipse`.

---

## Combining Icons

Lucide icons accept children, allowing you to nest icons inside each other since SVGs support nesting.

### Nesting Icons

```tsx
import { Scan, User } from 'lucide-react'

function UserScanIcon() {
  return (
    <Scan size={48}>
      <User size={12} x={6} y={6} absoluteStrokeWidth />
    </Scan>
  )
}
```

**Important:** The `x` and `y` coordinates must be within the outer icon's viewBox (24x24). Position child elements accordingly.

### Notification Badge with Native SVG

```tsx
import { Mail } from 'lucide-react'

function MailWithBadge({ hasUnread }: { hasUnread: boolean }) {
  return (
    <Mail size={48}>
      {hasUnread && (
        <circle
          r="3"
          cx="21"
          cy="5"
          stroke="none"
          fill="#F56565"
        />
      )}
    </Mail>
  )
}
```

### Text Overlay on Icon

```tsx
import { File } from 'lucide-react'

function FileTypeIcon({ extension }: { extension: string }) {
  return (
    <File size={48}>
      <text
        x={7.5}
        y={19}
        fontSize={8}
        fontFamily="Verdana,sans-serif"
        strokeWidth={1}
      >
        {extension}
      </text>
    </File>
  )
}

// Usage
<FileTypeIcon extension="JS" />
<FileTypeIcon extension="TS" />
<FileTypeIcon extension="MD" />
```

### Rules for Combining

| Rule | Details |
|------|---------|
| viewBox is 24x24 | All coordinates must fit within 0-24 range |
| Use `absoluteStrokeWidth` on children | Prevents stroke scaling issues on nested icons |
| Native SVG elements work | `<circle>`, `<rect>`, `<text>`, `<path>` all valid as children |
| Children inherit SVG context | Color, stroke, and fill cascade from parent |

---

## TypeScript Types

Lucide-react exports three key types for TypeScript integration:

### LucideProps

All props accepted by any Lucide icon component:

```typescript
import { type LucideProps } from 'lucide-react'

// Use for wrapper components
function IconWrapper(props: LucideProps) {
  return <Camera {...props} />
}

// Use for component props
interface TooltipIconProps {
  iconProps?: LucideProps
  tooltip: string
}
```

### LucideIcon

The type of an icon component itself (a React functional component accepting LucideProps):

```typescript
import { type LucideIcon } from 'lucide-react'
import { Home, Settings, User } from 'lucide-react'

// Pass icon components as props
interface NavItemProps {
  icon: LucideIcon
  label: string
  href: string
}

function NavItem({ icon: Icon, label, href }: NavItemProps) {
  return (
    <a href={href} className="flex items-center gap-2">
      <Icon size={18} />
      <span>{label}</span>
    </a>
  )
}

// Usage
<NavItem icon={Home} label="Home" href="/" />
<NavItem icon={Settings} label="Settings" href="/settings" />
```

### IconNode

Raw SVG structure for custom icons:

```typescript
import { type IconNode } from 'lucide-react'

const myIcon: IconNode = [
  ['circle', { cx: 12, cy: 12, r: 10 }],
  ['path', { d: 'M8 12h8' }],
]
```

### Type Summary

| Type | Definition | When to Use |
|------|-----------|-------------|
| `LucideProps` | `{ size?, color?, strokeWidth?, absoluteStrokeWidth?, ...SVGAttributes }` | Typing icon props in wrapper components |
| `LucideIcon` | `React.FC<LucideProps>` | Passing icon components as props |
| `IconNode` | `[string, Record<string, string \| number>][]` | Defining custom icon shapes |

---

## Global Styling

### Option 1: CSS (Simple, No Per-Icon Overrides)

Every icon has the `.lucide` CSS class applied. Target all icons globally:

```css
/* globals.css */
.lucide {
  color: #333;
  width: 20px;
  height: 20px;
  stroke-width: 1.5px;
}
```

For absolute stroke width via CSS:

```css
.lucide {
  width: 48px;
  height: 48px;
  stroke-width: 1.5;
}

.lucide * {
  vector-effect: non-scaling-stroke;
}
```

**Limitation:** CSS specificity overrides props. Individual `color`, `size`, and `strokeWidth` props will NOT work when CSS global styles are applied.

### Option 2: LucideProvider (Overridable Defaults)

Use the context provider when you need global defaults but still want per-icon overrides:

```tsx
import { LucideProvider, Home, Settings, User } from 'lucide-react'

function App() {
  return (
    <LucideProvider color="gray" size={20} strokeWidth={1.5}>
      <Home />                        {/* gray, 20px, 1.5 stroke */}
      <Settings color="blue" />       {/* blue, 20px, 1.5 stroke */}
      <User size={32} color="red" />  {/* red, 32px, 1.5 stroke */}
    </LucideProvider>
  )
}
```

### LucideProvider Props

| Prop | Type | Description |
|------|------|-------------|
| `size` | `number \| string` | Default size for all child icons |
| `color` | `string` | Default color for all child icons |
| `strokeWidth` | `number` | Default stroke width for all child icons |

### When to Use Which

| Approach | Use When |
|----------|----------|
| CSS `.lucide` | All icons should look identical, no per-icon overrides needed |
| `LucideProvider` | Default styles with occasional per-icon overrides |
| Individual props | Different icons need different styles throughout the app |

---

## Icon Map Pattern

For mapping string keys to icon components (e.g., sidebar navigation):

```tsx
import { type LucideIcon } from 'lucide-react'
import { Home, Users, Settings, BarChart, FileText } from 'lucide-react'

const iconMap: Record<string, LucideIcon> = {
  home: Home,
  users: Users,
  settings: Settings,
  analytics: BarChart,
  documents: FileText,
}

interface SidebarItem {
  key: string
  label: string
}

function SidebarNav({ items }: { items: SidebarItem[] }) {
  return (
    <nav>
      {items.map((item) => {
        const Icon = iconMap[item.key]
        if (!Icon) return null // Fallback for unknown keys
        return (
          <a key={item.key} className="flex items-center gap-2 p-2">
            <Icon size={18} />
            <span>{item.label}</span>
          </a>
        )
      })}
    </nav>
  )
}
```

This pattern avoids the bundle size penalty of DynamicIcon while still supporting string-based icon lookups for a known set of icons.

---

**Version:** ^0.500.0 | **Source:** https://lucide.dev/guide/react/advanced/dynamic-icon-component, https://lucide.dev/guide/react/advanced/with-lucide-lab, https://lucide.dev/guide/react/advanced/combining-icons, https://lucide.dev/guide/react/advanced/typescript, https://lucide.dev/guide/react/advanced/global-styling
