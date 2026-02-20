# Design System Architecture

> **Purpose**: Understand the foundational structure of design systems and how the 3-layer model enables consistent, maintainable design across applications.

**Version**: 1.0.0
**Last Updated**: December 2025

---

## What is a Design System?

A **design system** is a collection of reusable components, patterns, and standards that enable teams to design and build products consistently.

**Problems it solves**:
- Inconsistent visual language across products
- Duplicated effort creating similar components
- Accessibility gaps and compliance issues
- Difficulty onboarding new team members
- Maintenance burden of scattered styling decisions

---

## Three-Layer Architecture

All design elements follow this structure:

```
┌─────────────────────────────────────┐
│ Component Layer                     │
│ (Buttons, Inputs, Cards, etc.)      │
├─────────────────────────────────────┤
│ Token Layer                         │
│ (Semantic colors, typography, etc.) │
├─────────────────────────────────────┤
│ Primitive Layer                     │
│ (Raw values: hex, pixel sizes, etc.)│
└─────────────────────────────────────┘
```

---

## Layer 1: Primitives (Raw Values)

**Definition**: Uninterpretable raw values with no semantic meaning.

**Examples**:
- Colors: `#FF0000`, `rgb(255, 0, 0)`, hex codes
- Sizing: `16px`, `24px`, `48px`
- Font families: `Inter`, `Helvetica`, monospace
- Font sizes: `12px`, `16px`, `24px`

**Storage Location**:
- Figma: Color styles, typography styles, grid settings
- Code: `primitives.ts`, `variables.css`, constants file
- Documentation: Design tokens spreadsheet or tokens.json

**Key Rule**: Never use primitives directly in components.

---

## Layer 2: Tokens (Semantic Names)

**Definition**: Primitives mapped to semantic names that describe their purpose, not their appearance.

**Naming Pattern**: `category-role-state` or `purpose-intensity`

**Examples**:

```
Color Tokens:
├── Backgrounds
│   ├── background (primary page background)
│   ├── surface (card/component background)
│   ├── surface-elevated (modal/overlay background)
│
├── Text
│   ├── text-primary (body text, headings)
│   ├── text-secondary (labels, secondary copy)
│   ├── text-tertiary (placeholders, hints)
│
├── Brand
│   ├── brand-primary (main CTA, brand identity)
│   ├── brand-secondary (alternative accent)
│
└── Status
    ├── status-success (positive actions)
    ├── status-error (errors, destructive)
    ├── status-warning (caution, alerts)
    └── status-info (information, help)
```

**Storage Location**:
- Figma: Component libraries, design tokens
- Code: CSS variables, theme objects, tokens file
- Documentation: Token reference spreadsheet

---

## Layer 3: Components (Usage)

**Definition**: Reusable UI units built using tokens and primitives.

**Structure**: Each component specifies:
- **Variants** — Visual options: primary, secondary, small, large
- **States** — Interactive states: default, hover, active, disabled, focus
- **Tokens used** — Which tokens are applied in which states
- **Accessibility** — ARIA, focus indicators, contrast

**Example - Button Component**:

```
Button Component
├── Variants
│   ├── Primary: brand-primary background, text-inverse text
│   └── Secondary: surface background, text-primary text
│
├── Sizes
│   ├── Small: padding-sm
│   ├── Medium: padding-md
│   └── Large: padding-lg
│
├── Tokens Used
│   ├── Colors: brand-primary, text-inverse, surface
│   ├── Typography: body-default
│   └── Spacing: padding (variant-specific)
│
└── Accessibility
    ├── Focus ring: 2px solid, 4px offset
    ├── Touch target: 44px × 44px minimum
    └── ARIA: aria-label, aria-disabled
```

---

## Token Naming Principles

### 1. Semantic First
Name by purpose, not appearance.

```
✅ text-primary (what it's for)
❌ text-dark-gray (what it looks like)
```

### 2. Hierarchical
Use role/intensity levels.

```
✅ text-primary, text-secondary, text-tertiary
❌ text-1, text-2, text-3
```

### 3. Consistent
Same token names across platforms.

```
✅ Both web and mobile use `brand-primary`
❌ Web uses `primary-color`, mobile uses `primaryColor`
```

### 4. Limited
Restrict to necessary tokens.

```
✅ 3-4 text color levels
❌ 10+ text color levels
```

---

## Decision Framework

### Should this be a token?

```
Is this value reused in 2+ places?
  ├─ YES → Could be a token (if semantic purpose)
  └─ NO  → Keep as component-specific styling

Does this value have semantic meaning?
  ├─ YES → Define as token
  │        Examples: brand-primary, status-error
  └─ NO  → Keep as primitive or component-specific

Does this value need to change across themes/modes?
  ├─ YES → Must be a token
  │        Examples: background colors in light/dark
  └─ NO  → Could be token or component-specific
```

---

## Common Patterns

### Pattern 1: Single Source of Truth
- Define all primitives in one location
- All tokens reference primitives
- All components reference tokens
- Changes cascade automatically

### Pattern 2: Theme-Aware Tokens
- Light mode values as defaults
- Dark mode overrides only what changes
- Brand/status tokens remain constant

### Pattern 3: Platform Consistency
- Same token names everywhere
- Same structure in Figma and code
- Designers and developers share vocabulary

---

## Best Practices

### Do's
- ✅ Name tokens by purpose (semantic)
- ✅ Keep token set lean (minimal)
- ✅ Document all tokens
- ✅ Test in light and dark modes
- ✅ Enforce in code reviews

### Don'ts
- ❌ Use primitives directly in components
- ❌ Name tokens by appearance
- ❌ Create tokens for one-off uses
- ❌ Skip dark mode support
- ❌ Have different names across platforms

---

## Cross-References

- **See**: [02-color-tokens.md](02-color-tokens.md) for color system details
- **See**: [03-typography.md](03-typography.md) for typography system
- **See**: [04-spacing-layout.md](04-spacing-layout.md) for spacing system
- **See**: [05-components.md](05-components.md) for component specifications
- **See**: [07-implementation.md](07-implementation.md) for building a system

---

**Module**: 01-architecture
**Last Updated**: December 2025
**Status**: Complete
