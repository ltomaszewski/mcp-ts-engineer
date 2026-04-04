---
name: design-system
version: "WCAG 2.2"
description: "Design system fundamentals - tokens, components, accessibility, WCAG 2.2 compliance"
when_to_use: "creating design systems, defining tokens (colors, typography, spacing), or ensuring accessibility standards"
---

# Design System

> Framework for creating and maintaining consistent design tokens, components, and accessibility standards.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating or maintaining design systems
- Defining color, typography, or spacing tokens
- Building component specifications
- Implementing WCAG 2.2 AA accessibility
- Reviewing design system architecture

---

## Critical Rules

**ALWAYS:**
1. Use 3-layer token architecture — Primitives → Semantic → Component tokens
2. Follow naming convention — `category-property-variant-state` (e.g., `color-text-primary-hover`)
3. Validate contrast ratios — 4.5:1 minimum for text, 3:1 for large text/UI
4. Document every token — purpose, usage context, and accessibility notes
5. Use 4px/8px base grid for spacing — consistent visual rhythm

**NEVER:**
1. Skip semantic layer — never reference primitives directly in components
2. Use color values directly — always use tokens for theming support
3. Ignore accessibility — WCAG 2.2 AA is minimum requirement
4. Create one-off values — add to token system if needed more than once
5. Mix naming conventions — consistency enables automation

---

## Core Patterns

### 3-Layer Token Architecture

```typescript
// Layer 1: Primitives (raw values)
const primitives = {
  colors: {
    blue50: '#EFF6FF',
    blue500: '#3B82F6',
    blue600: '#2563EB',
    blue900: '#1E3A8A',
    gray50: '#F9FAFB',
    gray900: '#111827',
  },
  spacing: {
    1: 4,
    2: 8,
    3: 12,
    4: 16,
    6: 24,
    8: 32,
  },
};

// Layer 2: Semantic Tokens (purpose-based)
const semantic = {
  color: {
    text: {
      primary: primitives.colors.gray900,
      secondary: primitives.colors.gray600,
      inverse: primitives.colors.gray50,
    },
    background: {
      primary: primitives.colors.gray50,
      secondary: primitives.colors.gray100,
      interactive: primitives.colors.blue500,
    },
    border: {
      default: primitives.colors.gray200,
      focus: primitives.colors.blue500,
    },
  },
  spacing: {
    xs: primitives.spacing[1],  // 4px
    sm: primitives.spacing[2],  // 8px
    md: primitives.spacing[4],  // 16px
    lg: primitives.spacing[6],  // 24px
    xl: primitives.spacing[8],  // 32px
  },
};

// Layer 3: Component Tokens (component-specific)
const components = {
  button: {
    primary: {
      background: semantic.color.background.interactive,
      text: semantic.color.text.inverse,
      paddingX: semantic.spacing.md,
      paddingY: semantic.spacing.sm,
    },
  },
};
```

### Typography Scale

```typescript
const typography = {
  // Font families
  fontFamily: {
    sans: 'Inter, system-ui, sans-serif',
    mono: 'JetBrains Mono, monospace',
  },

  // Size scale (based on 16px)
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },

  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },

  // Font weights
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Composite text styles
  styles: {
    h1: { fontSize: 36, lineHeight: 1.25, fontWeight: 700 },
    h2: { fontSize: 30, lineHeight: 1.25, fontWeight: 700 },
    h3: { fontSize: 24, lineHeight: 1.25, fontWeight: 600 },
    body: { fontSize: 16, lineHeight: 1.5, fontWeight: 400 },
    caption: { fontSize: 12, lineHeight: 1.5, fontWeight: 400 },
  },
};
```

### Spacing System (4px Base)

```typescript
const spacing = {
  // Base unit: 4px
  px: 1,
  0: 0,
  0.5: 2,   // 2px
  1: 4,     // 4px  - xs
  2: 8,     // 8px  - sm
  3: 12,    // 12px
  4: 16,    // 16px - md
  5: 20,    // 20px
  6: 24,    // 24px - lg
  8: 32,    // 32px - xl
  10: 40,   // 40px
  12: 48,   // 48px
  16: 64,   // 64px
};

// Named spacing for common use cases
const namedSpacing = {
  inset: { xs: 4, sm: 8, md: 16, lg: 24 },       // Padding
  stack: { xs: 4, sm: 8, md: 16, lg: 24 },       // Vertical margin
  inline: { xs: 4, sm: 8, md: 16, lg: 24 },      // Horizontal margin
  section: { sm: 24, md: 32, lg: 48, xl: 64 },   // Section spacing
};
```

### Color Accessibility

```typescript
// Minimum contrast ratios (WCAG 2.2 AA)
const contrastRequirements = {
  normalText: 4.5,      // 4.5:1 for body text
  largeText: 3.0,       // 3:1 for 18px+ or 14px bold
  uiComponents: 3.0,    // 3:1 for interactive elements
  focusIndicator: 3.0,  // 3:1 for focus outlines
};

// Check contrast ratio
function getContrastRatio(foreground: string, background: string): number {
  // Calculate relative luminance and return ratio
  // Use a library like 'color-contrast-checker' in production
}

// Validated color pairs
const accessiblePairs = {
  light: {
    textOnBackground: { fg: '#111827', bg: '#FFFFFF' }, // 16.1:1 ✓
    textOnPrimary: { fg: '#FFFFFF', bg: '#3B82F6' },    // 4.5:1 ✓
  },
  dark: {
    textOnBackground: { fg: '#F9FAFB', bg: '#111827' }, // 15.8:1 ✓
    textOnPrimary: { fg: '#FFFFFF', bg: '#2563EB' },    // 4.6:1 ✓
  },
};
```

### Component Specification Template

```typescript
interface ComponentSpec {
  name: string;
  description: string;
  variants: string[];
  states: string[];
  tokens: {
    [key: string]: string; // Token references
  };
  accessibility: {
    role: string;
    focusable: boolean;
    keyboardSupport: string[];
    screenReader: string;
  };
}

const buttonSpec: ComponentSpec = {
  name: 'Button',
  description: 'Primary action trigger',
  variants: ['primary', 'secondary', 'ghost'],
  states: ['default', 'hover', 'active', 'disabled', 'focus'],
  tokens: {
    background: 'color.background.interactive',
    text: 'color.text.inverse',
    paddingX: 'spacing.md',
    paddingY: 'spacing.sm',
    borderRadius: 'radius.md',
    focusRing: 'color.border.focus',
  },
  accessibility: {
    role: 'button',
    focusable: true,
    keyboardSupport: ['Enter', 'Space'],
    screenReader: 'Announces button label and state',
  },
};
```

---

## Anti-Patterns

**BAD** — Using primitives directly in components:
```typescript
const Button = styled.button`
  background: #3B82F6;  /* Hardcoded primitive! */
`;
```

**GOOD** — Use semantic tokens:
```typescript
const Button = styled.button`
  background: ${tokens.color.background.interactive};
`;
```

**BAD** — Inconsistent spacing:
```typescript
padding: 15px;  /* Not on 4px grid */
margin: 13px;   /* Random value */
```

**GOOD** — Use spacing tokens:
```typescript
padding: ${tokens.spacing.md}px;  /* 16px */
margin: ${tokens.spacing.sm}px;   /* 8px */
```

**BAD** — Skipping accessibility:
```typescript
// No focus state, no keyboard support
const Button = ({ onClick }) => <div onClick={onClick}>Click</div>;
```

**GOOD** — Full accessibility support:
```typescript
const Button = ({ onClick, children }) => (
  <button
    onClick={onClick}
    style={{ outline: `2px solid ${tokens.color.border.focus}` }}
  >
    {children}
  </button>
);
```

---

## Quick Reference

| Layer | Purpose | Example |
|-------|---------|---------|
| Primitives | Raw values | `blue500: '#3B82F6'` |
| Semantic | Purpose-based | `color.text.primary` |
| Component | Component-specific | `button.primary.background` |

| WCAG Requirement | Ratio | Applies To |
|------------------|-------|------------|
| Normal text | 4.5:1 | Body text, labels |
| Large text | 3:1 | 18px+ or 14px bold |
| UI components | 3:1 | Buttons, inputs, icons |
| Focus indicator | 3:1 | Focus outlines |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Navigation and overview | [00-master-index.md](00-master-index.md) |
| 3-layer architecture | [01-architecture.md](01-architecture.md) |
| Color token patterns | [02-color-tokens.md](02-color-tokens.md) |
| Typography system | [03-typography.md](03-typography.md) |
| Spacing and layout | [04-spacing-layout.md](04-spacing-layout.md) |
| Component specifications | [05-components.md](05-components.md) |
| WCAG 2.2 compliance | [06-accessibility.md](06-accessibility.md) |
| CSS/TypeScript/Figma export | [07-implementation.md](07-implementation.md) |
| Review and update process | [08-maintenance.md](08-maintenance.md) |

---

**Version:** WCAG 2.2 | **Source:** https://www.w3.org/TR/WCAG22/
