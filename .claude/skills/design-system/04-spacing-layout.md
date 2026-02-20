# Spacing & Layout System

> **Purpose**: Define spacing primitives and tokens that ensure consistent padding, margins, gaps, and border radii across all components.

**Version**: 1.0.0
**Last Updated**: December 2025
**Prerequisite**: [01-architecture.md](01-architecture.md)

---

## Layer 1: Spacing Primitives

**Definition**: Raw spacing values in units (pixels, rem, etc.).

### Spacing Scale

| Value | Multiple | Use Case |
|-------|----------|----------|
| 4px | 1x | Base unit, minimal spacing |
| 8px | 2x | Tight spacing |
| 12px | 3x | Compact spacing |
| 16px | 4x | Default spacing (most common) |
| 20px | 5x | Moderate spacing |
| 24px | 6x | Generous spacing |
| 32px | 8x | Section spacing |
| 48px | 12x | Large section spacing |
| 64px | 16x | Major layout spacing |

**Principle**: Use consistent base unit (usually 4px or 8px). All values should be multiples.

### Alternative Naming

```
xs:  4px   (1x)
sm:  8px   (2x)
md:  16px  (4x) ← default, most common
lg:  24px  (6x)
xl:  32px  (8x)
2xl: 48px  (12x)
3xl: 64px  (16x)
```

---

## Layer 2: Spacing Tokens

**Definition**: Named spacing values used in specific contexts.

### Padding Tokens (Inside Components)

| Token | Value | Use Case |
|-------|-------|----------|
| padding-xs | 4px | Very tight, chips, badges |
| padding-sm | 8px | Tight, small components |
| padding-md | 16px | Default, buttons, inputs |
| padding-lg | 24px | Generous, cards |
| padding-xl | 32px | Very generous, modals |

### Margin Tokens (Between Components)

| Token | Value | Use Case |
|-------|-------|----------|
| margin-sm | 8px | Tight, adjacent elements |
| margin-md | 16px | Default spacing |
| margin-lg | 24px | Section spacing |
| margin-xl | 32px | Major layout spacing |

### Gap Tokens (Grid/Flex Children)

| Token | Value | Use Case |
|-------|-------|----------|
| gap-sm | 8px | Compact layout |
| gap-md | 16px | Default layout |
| gap-lg | 24px | Spacious layout |
| gap-xl | 32px | Section spacing |

### Border Radius Tokens

| Token | Value | Use Case |
|-------|-------|----------|
| radius-sm | 4px | Subtle rounding |
| radius-md | 8px | Default |
| radius-lg | 12px | Prominent rounding |
| radius-xl | 16px | Very rounded |
| radius-full | 9999px | Pill shape, circles |

---

## Implementation

### CSS Variables

```css
/* Spacing */
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-2xl: 48px;
--spacing-3xl: 64px;

/* Border Radius */
--radius-sm: 4px;
--radius-md: 8px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-full: 9999px;
```

### TypeScript Object

```typescript
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};
```

---

## Component Usage

### Button Example

```css
.button {
  padding: var(--spacing-md) var(--spacing-lg);
  border-radius: var(--radius-md);
}

.button-small {
  padding: var(--spacing-sm) var(--spacing-md);
  border-radius: var(--radius-sm);
}

.button-large {
  padding: var(--spacing-lg) var(--spacing-xl);
  border-radius: var(--radius-lg);
}
```

### Card Example

```css
.card {
  padding: var(--spacing-lg);
  border-radius: var(--radius-lg);
  gap: var(--spacing-md);
}
```

### Layout Example

```css
.section {
  padding: var(--spacing-2xl) 0;
  gap: var(--spacing-xl);
}

.grid {
  gap: var(--spacing-md);
}
```

---

## Common Patterns

### Consistent Internal Spacing

```
Component Internal Spacing
├── Small components: padding-sm (8px)
├── Medium components: padding-md (16px)
├── Large components: padding-lg (24px)
└── Modals/sheets: padding-xl (32px)
```

### Consistent External Spacing

```
Between Elements
├── Related elements: gap-sm (8px)
├── Sibling elements: gap-md (16px)
├── Sections: gap-lg or margin-lg (24px)
└── Major sections: gap-xl or margin-xl (32px)
```

### Border Radius Guidelines

```
Component Type → Radius
├── Small elements (badges, chips): radius-sm (4px)
├── Standard elements (buttons, inputs): radius-md (8px)
├── Large elements (cards, modals): radius-lg (12px)
├── Pills, avatars: radius-full (9999px)
```

---

## Best Practices

### Do's
- ✅ Use consistent base unit (4px or 8px)
- ✅ Apply spacing tokens consistently
- ✅ Match radius to component size
- ✅ Use gap for flex/grid children
- ✅ Document spacing decisions

### Don'ts
- ❌ Use arbitrary pixel values
- ❌ Mix different spacing systems
- ❌ Use too many spacing variations
- ❌ Ignore touch target requirements
- ❌ Apply radius inconsistently

---

## Cross-References

- **See**: [01-architecture.md](01-architecture.md) for token layer concept
- **See**: [05-components.md](05-components.md) for component specifications
- **See**: [06-accessibility.md](06-accessibility.md) for touch target sizes
- **See**: [07-implementation.md](07-implementation.md) for implementation patterns

---

**Module**: 04-spacing-layout
**Last Updated**: December 2025
**Status**: Complete
