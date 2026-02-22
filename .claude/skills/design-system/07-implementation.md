# Implementation Guide

> **Purpose**: Provide step-by-step guidance for creating and implementing a design system, including format options and distribution strategies.

**Version**: 1.0.0
**Last Updated**: February 2026
**Prerequisite**: [01-architecture.md](01-architecture.md)

---

## Getting Started

### Step 1: Define Your Primitives (30 min)

**Questions to answer**:
- What brand colors does your company have?
- What font should be used (Google Fonts, custom, system)?
- What color is pure white? Pure black?
- What spacing unit? (4px, 8px, 10px?)

**Output**: Primitives file or Figma styles

```
Example Output:
┌─────────────────────────────────────┐
│ Brand Primary: #6366F1              │
│ Brand Secondary: #8B5CF6            │
│ Font: Inter (from Google Fonts)     │
│ Base Spacing: 4px                   │
│ White: #FFFFFF                      │
│ Black: #000000                      │
└─────────────────────────────────────┘
```

**Reference**: [02-color-tokens.md](02-color-tokens.md) → Layer 1

---

### Step 2: Create Semantic Tokens (1-2 hours)

**For each category** (colors, typography, spacing):

1. **Map primitives to semantics**
   - Choose primitive value
   - Assign semantic name describing purpose
   - Test in light and dark modes

2. **Verify accessibility**
   - Check contrast ratios
   - Test with color blindness simulator
   - Validate token naming (semantic, not appearance)

3. **Store in chosen format**
   - CSS variables
   - JSON/YAML
   - TypeScript object
   - Figma design tokens

**Output**: Token definitions

**Reference**: [02-color-tokens.md](02-color-tokens.md) → Layer 2

---

### Step 3: Define Typography (30 min)

- Choose font families
- Define heading, body, label scales
- Set line heights
- Create typography tokens

**Output**: Typography tokens

**Reference**: [03-typography.md](03-typography.md)

---

### Step 4: Define Spacing (30 min)

- Choose base unit (4px or 8px)
- Create spacing scale (xs, sm, md, lg, xl)
- Define border radius tokens

**Output**: Spacing tokens

**Reference**: [04-spacing-layout.md](04-spacing-layout.md)

---

### Step 5: Specify Core Components (2-3 hours)

- Document: Button, Input, Text, Card, Modal, Toast, Badge
- Define variants, states, tokens for each
- Include accessibility requirements

**Output**: Component specifications

**Reference**: [05-components.md](05-components.md)

---

### Step 6: Verify Accessibility (1-2 hours)

- Run WCAG 2.2 AA compliance check
- Test color contrast
- Verify keyboard navigation
- Test with screen readers

**Output**: Accessibility audit checklist ✅

**Reference**: [06-accessibility.md](06-accessibility.md)

---

## Format Options

### Option A: CSS Variables (Web, NativeWind)

```css
:root {
  /* Colors */
  --color-background: 255 255 255;
  --color-text-primary: 17 24 39;
  --color-brand-primary: 99 102 241;

  /* Spacing */
  --spacing-md: 16px;
  --radius-md: 8px;
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: 17 24 39;
    --color-text-primary: 249 250 251;
  }
}

/* Usage */
.button {
  background: rgb(var(--color-brand-primary));
  color: rgb(var(--color-text-inverse));
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

**Best for**: Web apps, React Native with NativeWind

---

### Option B: TypeScript Object (React, React Native)

```typescript
// theme.ts
export const theme = {
  colors: {
    light: {
      background: "#ffffff",
      textPrimary: "#111827",
      brandPrimary: "#6366f1",
    },
    dark: {
      background: "#111827",
      textPrimary: "#f9fafb",
      brandPrimary: "#6366f1",
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    md: 8,
    lg: 12,
  },
};

// Usage
const styles = {
  button: {
    backgroundColor: theme.colors.light.brandPrimary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
  },
};
```

**Best for**: React, React Native, TypeScript projects

---

### Option C: JSON/YAML (Portable)

```json
{
  "color": {
    "background": {
      "light": "#ffffff",
      "dark": "#111827"
    },
    "text": {
      "primary": {
        "light": "#111827",
        "dark": "#f9fafb"
      }
    },
    "brand": {
      "primary": "#6366f1"
    }
  },
  "spacing": {
    "xs": "4px",
    "sm": "8px",
    "md": "16px"
  }
}
```

**Best for**: Design token synchronization, cross-platform, Figma plugins

---

### Option D: Figma Design Tokens

```
Organization:
├── Primitives
│   ├── Brand / Primary (#6366F1)
│   ├── Brand / Secondary (#8B5CF6)
│   ├── Neutral / White (#FFFFFF)
│   └── Neutral / Gray-50 (#F9FAFB)
│
├── Semantic (Light)
│   ├── Background / Default
│   ├── Text / Primary
│   └── Brand / Primary
│
└── Semantic (Dark)
    ├── Background / Default
    ├── Text / Primary
    └── Brand / Primary
```

**Best for**: Design team source of truth, handoff

---

## Distribution Strategies

### 1. Design Tool Library (Figma, Adobe XD)

**Contents**:
- Token styles (colors, typography)
- Component library
- Documentation links

**Maintenance**:
- Update tokens in design tool
- Publish library version
- Notify team of changes

---

### 2. Code Package (npm, internal registry)

**Contents**:
- TypeScript types
- CSS files / Sass variables
- Component library
- Theme provider

**Example structure**:
```
@company/design-tokens/
├── dist/
│   ├── css/variables.css
│   ├── scss/_variables.scss
│   ├── js/tokens.js
│   └── ts/tokens.d.ts
├── src/
│   └── tokens.json
└── package.json
```

---

### 3. Documentation Site (Storybook, custom)

**Contents**:
- Token reference with examples
- Component documentation
- Usage guidelines
- Accessibility notes

---

### 4. Monorepo Package

**For monorepos**, create a shared package:

```
packages/design-tokens/
├── src/
│   ├── colors.ts
│   ├── typography.ts
│   ├── spacing.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Usage in apps**:
```typescript
import { colors, spacing } from '@company/design-tokens';
```

---

## Quick Start Workflow

### For New Projects

```
Day 1 (4-6 hours)
├── Define primitives (30 min)
├── Create color tokens (1 hour)
├── Create typography tokens (30 min)
├── Create spacing tokens (30 min)
├── Specify 3-4 core components (2 hours)
└── Verify accessibility (1 hour)

Week 1 (ongoing)
├── Add remaining components as needed
├── Refine tokens based on usage
├── Set up distribution (package, docs)
└── Train team on usage
```

### For Existing Projects

```
Phase 1: Audit (2-4 hours)
├── Document existing colors used
├── Document existing typography
├── Document existing spacing
├── Identify gaps and inconsistencies

Phase 2: Define Tokens (4-6 hours)
├── Create semantic token mapping
├── Define light/dark modes
├── Verify accessibility

Phase 3: Migrate (ongoing)
├── Replace hardcoded values with tokens
├── Update component by component
├── Test and verify each change
```

---

## Best Practices

### Do's
- ✅ Start with minimal tokens
- ✅ Document as you build
- ✅ Test accessibility early
- ✅ Use same names across platforms
- ✅ Version your design system

### Don'ts
- ❌ Create tokens for everything
- ❌ Skip dark mode support
- ❌ Mix naming conventions
- ❌ Leave documentation for later
- ❌ Deploy without testing

---

## Cross-References

- **See**: [01-architecture.md](01-architecture.md) for 3-layer model
- **See**: [02-color-tokens.md](02-color-tokens.md) for color implementation
- **See**: [03-typography.md](03-typography.md) for typography implementation
- **See**: [04-spacing-layout.md](04-spacing-layout.md) for spacing implementation
- **See**: [08-maintenance.md](08-maintenance.md) for ongoing maintenance

---

**Version:** WCAG 2.2 | **Source:** https://www.w3.org/TR/WCAG22/
