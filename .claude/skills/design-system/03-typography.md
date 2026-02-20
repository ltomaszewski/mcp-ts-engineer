# Typography System

> **Purpose**: Define typography primitives and tokens that ensure consistent, readable text across all components and platforms.

**Version**: 1.0.0
**Last Updated**: December 2025
**Prerequisite**: [01-architecture.md](01-architecture.md)

---

## Layer 1: Typography Primitives

**Definition**: Raw values for fonts, sizes, weights, and line heights.

### Font Family

```
Standard UI Font (default)
├── Font name: Inter (or your choice)
├── Weights: 400 (normal), 500 (medium), 600 (semibold), 700 (bold)
├── Fallback: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
└── Load from: Google Fonts, custom hosting, system fonts

Monospace Font (code, data)
├── Font name: "JetBrains Mono" or "Courier New"
├── Weight: 400 (normal)
└── Use for: Code blocks, timestamps, numeric data
```

### Font Sizes

| Token | Value | Use Case |
|-------|-------|----------|
| xs | 12px | Captions, very small text |
| sm | 14px | Secondary text, small labels |
| base | 16px | Default, body text |
| lg | 18px | Large body, prominent secondary |
| xl | 20px | Subheadings |
| 2xl | 24px | Heading 2 |
| 3xl | 30px | Heading 1 |
| 4xl | 36px | Hero, display text |

**Principle**: Use 5-7 core sizes. Not every size needs a token.

### Font Weights

| Value | Name | Use Case |
|-------|------|----------|
| 400 | normal | Body text, most UI copy |
| 500 | medium | Labels, emphasis within body |
| 600 | semibold | Section headers, emphasis |
| 700 | bold | Page headers, strong emphasis |

**Principle**: Avoid 300 (too light) and 800+ (too heavy) unless brand-specific.

### Line Heights

| Token | Value | Use Case |
|-------|-------|----------|
| tight | 1.25 | Headers, short text |
| normal | 1.5 | Body text (default) |
| relaxed | 1.75 | Descriptions, long-form copy |

**Calculation**: Line height = font size × multiplier

### Letter Spacing

| Token | Value | Use Case |
|-------|-------|----------|
| normal | 0 | Default |
| tight | -0.01em | Headers, when text feels loose |

---

## Layer 2: Typography Tokens

**Definition**: Named combinations of font, size, weight, and line height.

### Token Structure

```
Headings (bold, tight line height)
├── heading-1
│   ├── Font size: 36px (4xl)
│   ├── Font weight: 600 (semibold)
│   ├── Line height: 1.25 (tight)
│   └── Letter spacing: -0.01em
│
├── heading-2
│   ├── Font size: 30px (3xl)
│   ├── Font weight: 600
│   └── Line height: 1.25
│
├── heading-3
│   ├── Font size: 24px (2xl)
│   ├── Font weight: 600
│   └── Line height: 1.25
│
└── heading-4
    ├── Font size: 20px (xl)
    ├── Font weight: 600
    └── Line height: 1.5

Body Text (regular weight, normal line height)
├── body-large
│   ├── Font size: 18px (lg)
│   ├── Font weight: 400
│   └── Line height: 1.5
│
├── body-default
│   ├── Font size: 16px (base)
│   ├── Font weight: 400
│   └── Line height: 1.5
│
└── body-small
    ├── Font size: 14px (sm)
    ├── Font weight: 400
    └── Line height: 1.5

Labels & Captions
├── label-default
│   ├── Font size: 14px (sm)
│   ├── Font weight: 500 (medium)
│   └── Line height: 1.5
│
└── label-small
    ├── Font size: 12px (xs)
    ├── Font weight: 500
    └── Line height: 1.25

Code
└── code
    ├── Font family: monospace
    ├── Font size: 14px (sm)
    ├── Font weight: 400
    └── Line height: 1.5
```

---

## Implementation

### CSS Variables

```css
/* Font families */
--font-sans: "Inter", -apple-system, BlinkMacSystemFont, sans-serif;
--font-mono: "JetBrains Mono", "Courier New", monospace;

/* Font sizes */
--text-xs: 12px;
--text-sm: 14px;
--text-base: 16px;
--text-lg: 18px;
--text-xl: 20px;
--text-2xl: 24px;
--text-3xl: 30px;
--text-4xl: 36px;

/* Line heights */
--leading-tight: 1.25;
--leading-normal: 1.5;
--leading-relaxed: 1.75;

/* Font weights */
--font-normal: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### TypeScript Object

```typescript
export const typography = {
  fontFamily: {
    sans: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
    mono: '"JetBrains Mono", "Courier New", monospace',
  },
  headings: {
    h1: { size: 36, weight: 600, lineHeight: 1.25 },
    h2: { size: 30, weight: 600, lineHeight: 1.25 },
    h3: { size: 24, weight: 600, lineHeight: 1.25 },
    h4: { size: 20, weight: 600, lineHeight: 1.5 },
  },
  body: {
    large: { size: 18, weight: 400, lineHeight: 1.5 },
    default: { size: 16, weight: 400, lineHeight: 1.5 },
    small: { size: 14, weight: 400, lineHeight: 1.5 },
  },
  labels: {
    default: { size: 14, weight: 500, lineHeight: 1.5 },
    small: { size: 12, weight: 500, lineHeight: 1.25 },
  },
  code: { size: 14, weight: 400, lineHeight: 1.5 },
};
```

---

## Component Usage

```
Text Component
├── Props
│   ├── variant: "h1" | "h2" | "h3" | "body" | "label" | "code"
│   ├── color: token name (text-primary, status-error, etc.)
│   ├── weight: override (medium, bold, etc.)
│   └── className: additional styling
│
├── Variant h1 applies
│   ├── Font size: 36px
│   ├── Font weight: 600
│   ├── Line height: 1.25
│   └── Color: text-primary (default)
│
└── Usage
    <Text variant="h1">Page Title</Text>
    <Text variant="body" color="text-secondary">Description</Text>
    <Text variant="label-small" color="text-tertiary">Hint</Text>
```

---

## Accessibility Requirements

### Font Size
- Minimum 12px (xs tokens)
- Standard 16px (body text)
- Headings: 20px+ (xl and above)

### Line Height
- Minimum 1.25 for headings
- Minimum 1.5 for body text
- Minimum 1.75 for long-form content

### Line Length
- 50-75 characters per line (optimal)
- Maximum 100 characters per line
- Exceptions for code blocks

---

## Best Practices

### Do's
- ✅ Use typography tokens consistently
- ✅ Maintain heading hierarchy (h1 → h2 → h3)
- ✅ Test readability at different sizes
- ✅ Use appropriate line heights
- ✅ Limit to 5-7 size variations

### Don'ts
- ❌ Skip heading levels (h1 → h3)
- ❌ Use too many font weights
- ❌ Set line height below 1.25
- ❌ Use font sizes below 12px
- ❌ Mix multiple typefaces without purpose

---

## Cross-References

- **See**: [01-architecture.md](01-architecture.md) for token layer concept
- **See**: [02-color-tokens.md](02-color-tokens.md) for text color tokens
- **See**: [06-accessibility.md](06-accessibility.md) for readable text standards
- **See**: [05-components.md](05-components.md) for component usage

---

**Module**: 03-typography
**Last Updated**: December 2025
**Status**: Complete
