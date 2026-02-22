# Color Token System

> **Purpose**: Define color primitives and semantic tokens that enable consistent, accessible color usage across light and dark modes.

**Version**: 1.0.0
**Last Updated**: February 2026
**Prerequisite**: [01-architecture.md](01-architecture.md)

---

## Layer 1: Color Primitives

**Definition**: Raw color values with no semantic meaning. Store in one location for centralized management.

### Format Options

**Option A: RGB (Recommended for Dynamic Opacity)**
```
Advantage: Enables `rgba(var(--color), 0.5)` syntax for transparency
Format: "255 255 255" (space-separated, no commas)

Examples:
white: "255 255 255"
black: "0 0 0"
brand-indigo: "99 102 241"
```

**Option B: Hex (Simpler, No Opacity)**
```
Advantage: Simpler to read, familiar format
Format: "#FFFFFF" or "#fff"

Examples:
white: "#FFFFFF"
black: "#000000"
brand-indigo: "#6366F1"
```

**Option C: HSL (Best for Systematic Generation)**
```
Advantage: Easy to create color scales (adjust lightness)
Format: "hue saturation% lightness%"

Examples:
brand-indigo: "249 58% 67%"
brand-indigo-light: "249 58% 80%"
brand-indigo-dark: "249 58% 40%"
```

### Primitive Color Categories

```
Brand Colors (Constant - never change for themes)
├── Primary: Main brand color (CTAs, highlights)
├── Secondary: Alternative brand color
└── Tertiary: Tertiary accent color

Neutral Colors (Change based on theme)
├── Light Mode
│   ├── White: #FFFFFF
│   ├── Gray-50 through Gray-900
│   └── Black: #000000
│
└── Dark Mode (inverted scale)

Status Colors (Constant - meaning beyond color)
├── Success: Green
├── Error: Red
├── Warning: Orange
└── Info: Blue

Domain-Specific Colors (Your product domain)
└── Custom colors for product-specific purposes
```

### Storing Primitives

**TypeScript**:
```typescript
export const primitives = {
  // Brand (constant)
  brandIndigo: "99 102 241",
  brandViolet: "139 92 246",

  // Neutral (light mode)
  white: "255 255 255",
  gray50: "249 250 251",
  gray100: "243 244 246",

  // Status (constant)
  statusSuccess: "16 185 129",
  statusError: "239 68 68",
} as const;
```

**JSON**:
```json
{
  "primitives": {
    "brand": {
      "indigo": "99 102 241",
      "violet": "139 92 246"
    },
    "neutral": {
      "white": "255 255 255",
      "gray50": "249 250 251"
    },
    "status": {
      "success": "16 185 129",
      "error": "239 68 68"
    }
  }
}
```

---

## Layer 2: Semantic Color Tokens

**Definition**: Primitives mapped to semantic names describing their purpose.

### Semantic Token Structure

**Light Mode** (defaults):

| Category | Token | Primitive | Purpose |
|----------|-------|-----------|---------|
| Background | background | white | Main page background |
| Background | surface | gray-50 | Cards, components |
| Background | surface-elevated | white | Modals, popovers |
| Text | text-primary | gray-900 | Body text, headings |
| Text | text-secondary | gray-500 | Labels, secondary |
| Text | text-tertiary | gray-400 | Placeholders, hints |
| Text | text-inverse | white | On dark backgrounds |
| Border | border | gray-200 | Default borders |
| Border | divider | gray-100 | Subtle lines |
| Brand | brand-primary | indigo | Main CTA |
| Brand | brand-secondary | violet | Alternative accent |
| Status | status-success | green | Positive actions |
| Status | status-error | red | Errors, destructive |
| Status | status-warning | orange | Caution, alerts |
| Status | status-info | blue | Information, help |

**Dark Mode** (override only changing tokens):

| Category | Token | Light Value | Dark Override |
|----------|-------|-------------|---------------|
| Background | background | white | gray-900 |
| Background | surface | gray-50 | gray-800 |
| Text | text-primary | gray-900 | white |
| Text | text-secondary | gray-500 | gray-300 |
| Border | border | gray-200 | gray-700 |

**Note**: Brand and status tokens remain constant across themes.

---

## Implementation Options

### CSS Variables

```css
:root {
  /* Light mode (default) */
  --color-background: 255 255 255;
  --color-surface: 249 250 251;
  --color-text-primary: 17 24 39;
  --color-text-secondary: 107 114 128;
  --color-border: 229 231 235;

  --color-brand-primary: 99 102 241;
  --color-status-success: 16 185 129;
  --color-status-error: 239 68 68;
}

/* Dark mode override */
@media (prefers-color-scheme: dark) {
  :root {
    --color-background: 17 24 39;
    --color-surface: 30 41 59;
    --color-text-primary: 249 250 251;
    --color-text-secondary: 156 163 175;
    /* Brand and status stay the same */
  }
}

/* Usage with RGB */
.card {
  background: rgb(var(--color-surface));
  color: rgb(var(--color-text-primary));
}

/* Usage with opacity */
.overlay {
  background: rgba(var(--color-background), 0.8);
}
```

### TypeScript Object

```typescript
export const theme = {
  light: {
    colors: {
      background: "#ffffff",
      surface: "#f9fafb",
      text: {
        primary: "#111827",
        secondary: "#6b7280",
        tertiary: "#9ca3af",
      },
      border: "#e5e7eb",
      brand: {
        primary: "#6366f1",
        secondary: "#8b5cf6",
      },
      status: {
        success: "#10b981",
        error: "#ef4444",
      },
    },
  },
  dark: {
    colors: {
      background: "#111827",
      surface: "#1e293b",
      text: {
        primary: "#f9fafb",
        secondary: "#9ca3af",
      },
      /* brand and status same as light */
    },
  },
};
```

---

## Accessibility Validation

For every token, verify contrast ratios.

| Token Pair | Minimum Ratio | Requirement |
|------------|---------------|-------------|
| text-primary on background | 4.5:1 | WCAG AA (normal text) |
| text-secondary on background | 4.5:1 | WCAG AA (normal text) |
| text on brand-primary | 4.5:1 | WCAG AA (button text) |
| border on surface | 3:1 | WCAG AA (UI components) |
| status-error on background | 4.5:1 | WCAG AA (error text) |

**Testing Tools**:
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)
- [Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)

**Verification Checklist**:
- [ ] All text tokens meet 4.5:1 contrast (or 3:1 for large text)
- [ ] Status colors (error/success) have meaning beyond color
- [ ] Dark mode maintains adequate contrast
- [ ] Color blindness simulator shows distinct colors

---

## Best Practices

### Do's
- ✅ Use semantic names (purpose-based)
- ✅ Define both light and dark mode values
- ✅ Test contrast ratios for all combinations
- ✅ Keep token set minimal (15-20 color tokens)
- ✅ Document usage examples for each token

### Don'ts
- ❌ Name tokens by appearance (e.g., `blue-button`)
- ❌ Skip dark mode testing
- ❌ Use primitives directly in components
- ❌ Create tokens for one-off colors
- ❌ Ignore color blindness accessibility

---

## Cross-References

- **See**: [01-architecture.md](01-architecture.md) for 3-layer model
- **See**: [06-accessibility.md](06-accessibility.md) for WCAG requirements
- **See**: [08-maintenance.md](08-maintenance.md) for adding new tokens

---

**Version:** WCAG 2.2 | **Source:** https://www.w3.org/TR/WCAG22/
