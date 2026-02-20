# Component Specifications

> **Purpose**: Provide templates and examples for documenting components with proper specifications for variants, states, tokens, and accessibility.

**Version**: 1.0.0
**Last Updated**: December 2025
**Prerequisite**: [01-architecture.md](01-architecture.md), [02-color-tokens.md](02-color-tokens.md)

---

## General Template

Every component should document the following:

### 1. Purpose
**Definition**: What is this component for? When should it be used?

### 2. Variants
**Definition**: Visual options (colors, sizes, styles)

### 3. States
**Definition**: Interactive states (default, hover, active, disabled, focused)

### 4. Tokens Used
**Definition**: Which design tokens does this component use?

### 5. Accessibility
**Definition**: WCAG 2.2 AA compliance requirements

### 6. Example Usage
**Definition**: Code example showing how to use the component

---

## Core Component List

Minimum components for a complete system:

```
Primitive Components
├── Button (CTA, form actions)
├── Input (text, email, password, number)
├── Checkbox (yes/no selection)
├── Radio (single selection from list)
├── Toggle/Switch (on/off state)
├── Text (typography display)
└── Icon (visual indicators)

Container Components
├── Card (content container, elevated)
├── Modal (focused interaction, overlay)
├── Drawer/Sheet (side panel, slide-up)
└── Popover/Tooltip (contextual info)

Feedback Components
├── Toast/Snackbar (transient notification)
├── Alert/Banner (persistent notification)
├── Badge (status indicator, label)
└── Loading Indicator (progress feedback)

Layout Components
├── Container (max-width wrapper)
├── Grid (multi-column layout)
├── Flexbox (flexible layout)
├── Spacer (consistent spacing)
└── Divider (visual separator)

Navigation Components
├── Header (top navigation)
├── Tabs (tabbed navigation)
├── Breadcrumbs (location indicator)
└── Link (navigation anchor)
```

---

## Full Example: Button Component

### Purpose

Trigger primary actions (form submit, navigation, CTA)

### Variants

**Color Variants**:

| Variant | Background | Text | Use Case |
|---------|------------|------|----------|
| primary | brand-primary | text-inverse | Main CTA |
| secondary | surface | text-primary | Alternative action |
| ghost | transparent | text-primary | Tertiary action |
| destructive | status-error | text-inverse | Destructive action |

**Size Variants**:

| Size | Padding | Font | Min Height |
|------|---------|------|------------|
| small | padding-sm × padding-md | body-small | 32px |
| medium | padding-md × padding-lg | body-default | 40px |
| large | padding-lg × padding-xl | body-large | 48px |

### States

```
States
├── Default: Normal appearance
├── Hover: Subtle highlight (opacity or shade change)
├── Active/Pressed: Pressed/selected appearance
├── Disabled: Reduced opacity (50%), no interaction
└── Focus: Visible focus ring (accessibility)
```

**State Styling**:

| State | Primary | Secondary |
|-------|---------|-----------|
| Default | brand-primary bg | surface bg |
| Hover | 10% darker | 5% darker |
| Active | 15% darker | 10% darker |
| Disabled | 50% opacity | 50% opacity |
| Focus | 2px ring, 4px offset | 2px ring, 4px offset |

### Tokens Used

```
Color Tokens
├── Primary: brand-primary (bg), text-inverse (text)
├── Secondary: surface (bg), text-primary (text)
├── Destructive: status-error (bg), text-inverse (text)
└── Focus ring: brand-primary

Typography Tokens
└── body-default (medium size)

Spacing Tokens
├── padding: size-specific
├── border-radius: radius-md
└── gap: spacing-sm (for icon + text)

Elevation Tokens (if using shadows)
├── Default: none or shadow-sm
└── Hover: shadow-md
```

### Accessibility

```
✅ Color Contrast
   └── Text on background: 4.5:1 minimum (WCAG AA)

✅ Focus Indicator
   └── 2px solid focus ring, 4px offset
   └── Visible in both light and dark modes

✅ Touch Target Size
   └── Minimum 44px × 44px (mobile)

✅ Interactive Feedback
   └── Visual change on hover, active, disabled
   └── Not relying on color alone

✅ Screen Readers
   └── aria-label for icon-only buttons
   └── aria-disabled="true" for disabled state
   └── aria-busy="true" for loading state
```

### Example Usage

```typescript
// Primary button
<Button variant="primary" size="lg" onPress={handleSubmit}>
  Submit
</Button>

// Secondary button with loading state
<Button
  variant="secondary"
  isLoading={isSubmitting}
  disabled={isSubmitting}
>
  {isSubmitting ? "Submitting..." : "Save"}
</Button>

// Icon-only button (requires accessible label)
<Button
  variant="ghost"
  aria-label="Close menu"
  onPress={closeMenu}
>
  <CloseIcon />
</Button>

// Destructive button
<Button variant="destructive" onPress={handleDelete}>
  Delete Account
</Button>
```

---

## Component Documentation Template

Use this template when creating new component specifications:

```markdown
# Component: [Name]

## Purpose
[What is this component for?]

## Variants
| Variant | Description | Use Case |
|---------|-------------|----------|
| ... | ... | ... |

## States
- Default: [description]
- Hover: [description]
- Active: [description]
- Disabled: [description]
- Focus: [description]

## Tokens Used
- Colors: [list tokens]
- Typography: [list tokens]
- Spacing: [list tokens]

## Accessibility
- [ ] Color contrast 4.5:1
- [ ] Focus indicator visible
- [ ] Touch target 44px
- [ ] ARIA attributes
- [ ] Keyboard support

## Example Usage
[code examples]
```

---

## Best Practices

### Do's
- ✅ Document all variants and states
- ✅ Use tokens (never hardcode)
- ✅ Include accessibility requirements
- ✅ Provide copy-paste ready examples
- ✅ Test in light and dark modes

### Don'ts
- ❌ Skip accessibility documentation
- ❌ Use hardcoded colors or sizes
- ❌ Forget loading and error states
- ❌ Ignore focus indicators
- ❌ Leave states undocumented

---

## Cross-References

- **See**: [01-architecture.md](01-architecture.md) for component layer concept
- **See**: [02-color-tokens.md](02-color-tokens.md) for color tokens
- **See**: [03-typography.md](03-typography.md) for typography tokens
- **See**: [04-spacing-layout.md](04-spacing-layout.md) for spacing tokens
- **See**: [06-accessibility.md](06-accessibility.md) for WCAG requirements
- **See**: [08-maintenance.md](08-maintenance.md) for adding new components

---

**Module**: 05-components
**Last Updated**: December 2025
**Status**: Complete
