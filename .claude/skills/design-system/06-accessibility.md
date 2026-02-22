# Accessibility Standards

> **Purpose**: Define WCAG 2.2 Level AA requirements for design systems, ensuring all tokens and components are accessible to all users.

**Version**: 1.0.0
**Last Updated**: February 2026

---

## WCAG 2.2 Level AA Overview

**Requirement**: All components meet WCAG 2.2 Level AA standards.

---

## Color Contrast (1.4.3)

### Minimum Ratios

| Element Type | Minimum Ratio | Standard |
|--------------|---------------|----------|
| Normal text (14px+) | 4.5:1 | WCAG AA |
| Large text (18px+ or 14px+ bold) | 3:1 | WCAG AA |
| UI Components (borders, icons) | 3:1 | WCAG AA |

### Token Pairs to Verify

| Token Pair | Minimum | Context |
|------------|---------|---------|
| text-primary on background | 4.5:1 | Body text |
| text-secondary on background | 4.5:1 | Labels |
| text-tertiary on surface | 4.5:1 | Placeholders |
| text-inverse on brand-primary | 4.5:1 | Button text |
| border on surface | 3:1 | Input borders |
| status-error on background | 4.5:1 | Error messages |

### Testing Tools

- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Accessible Colors](https://accessible-colors.com/)
- [Color Blindness Simulator](https://www.color-blindness.com/coblis-color-blindness-simulator/)

---

## Focus Indicators (2.4.7)

### Visible Focus Ring

```
Requirements:
├── 2px solid outline
├── Offset 4px from element
├── Contrast ratio: 3:1 with background
├── Cannot be removed (only replaced)
```

### CSS Example

```css
:focus-visible {
  outline: 2px solid rgb(var(--color-brand-primary));
  outline-offset: 4px;
}

/* For dark backgrounds */
.dark :focus-visible {
  outline-color: rgb(var(--color-brand-secondary));
}
```

### Focus Order

```
Requirements:
├── Logical, predictable order (left-to-right, top-to-bottom)
├── Skip links for long navigation
└── Focus trap for modals (focus stays inside)
```

---

## Touch Target Size (2.5.5)

### Minimum Sizes

| Platform | Minimum Size | Recommended |
|----------|--------------|-------------|
| Mobile (Touch) | 44px × 44px | 48px × 48px |
| Web (Pointer) | 24px × 24px | 44px × 44px |

### Implementation

```css
/* Ensure minimum touch target */
.button {
  min-height: 44px;
  min-width: 44px;
}

/* For small visual elements, add padding */
.icon-button {
  padding: 10px; /* Makes 24px icon into 44px target */
}
```

---

## Keyboard Navigation (2.1.1)

### Requirements

```
All Functionality Keyboard Accessible:
├── No keyboard traps (can always move focus)
├── All interactive elements focusable
├── Logical tab order
```

### Standard Keyboard Shortcuts

| Key | Action |
|-----|--------|
| Tab | Move to next focusable element |
| Shift + Tab | Move to previous focusable element |
| Enter | Activate button/link |
| Space | Activate button, toggle checkbox |
| Escape | Close modal/dropdown |
| Arrow keys | Navigate within component |

---

## ARIA Attributes (1.3.1, 4.1.2)

### Buttons

```html
<!-- Standard button -->
<button>Submit</button>

<!-- Disabled button -->
<button aria-disabled="true">Submit</button>

<!-- Icon-only button -->
<button aria-label="Close menu">
  <CloseIcon />
</button>

<!-- Loading button -->
<button aria-busy="true">
  <Spinner /> Submitting...
</button>
```

### Form Inputs

```html
<!-- Input with label -->
<label for="email">Email</label>
<input id="email" type="email" />

<!-- Input with error -->
<input
  id="email"
  aria-invalid="true"
  aria-describedby="email-error"
/>
<span id="email-error">Please enter a valid email</span>

<!-- Required input -->
<input id="name" aria-required="true" />
```

### Navigation

```html
<!-- Navigation region -->
<nav aria-label="Main navigation">
  <a href="/" aria-current="page">Home</a>
  <a href="/about">About</a>
</nav>

<!-- Multiple nav regions -->
<nav aria-label="Primary">...</nav>
<nav aria-label="Footer">...</nav>
```

### Live Regions

```html
<!-- Toast notification -->
<div role="status" aria-live="polite">
  Changes saved successfully
</div>

<!-- Error alert -->
<div role="alert" aria-live="assertive">
  Error: Please fix the form errors
</div>
```

---

## Semantic HTML

### Use Semantic Elements

```
✅ Correct
├── <header>, <nav>, <main>, <footer>
├── <h1> through <h6> for headings
├── <button> for buttons
├── <a href> for links
├── <label> for form fields
├── <img alt="description"> for images

❌ Incorrect
├── <div onclick> for buttons
├── <span onclick> for links
├── <div class="heading"> for headings
├── <img> without alt attribute
```

### Heading Hierarchy

```
✅ Correct
├── <h1>Page Title</h1>
│   ├── <h2>Section</h2>
│   │   ├── <h3>Subsection</h3>
│   │   └── <h3>Subsection</h3>
│   └── <h2>Section</h2>

❌ Incorrect (skipping levels)
├── <h1>Page Title</h1>
│   └── <h3>Section</h3> ← Skipped h2
```

---

## Color Usage

### Color is Not the Only Indicator

```
✅ Correct
├── Error: Red text + "Error:" prefix + icon
├── Success: Green + checkmark icon
├── Required: Asterisk + "Required" label

❌ Incorrect
├── Error: Only red text (no icon, no prefix)
├── Required: Only red asterisk
```

### Color Blindness Considerations

```
Safe Color Combinations:
├── Blue and orange (distinguishable)
├── Purple and yellow
├── Green and purple

Problematic:
├── Red and green (most common color blindness)
├── Similar saturation levels
```

---

## Readable Text

### Font Size Requirements

| Type | Minimum | Standard |
|------|---------|----------|
| Body text | 12px | 16px |
| Labels | 12px | 14px |
| Headings | 18px+ | 24px+ |

### Line Height

| Content Type | Minimum | Recommended |
|--------------|---------|-------------|
| Headings | 1.25 | 1.25-1.4 |
| Body text | 1.5 | 1.5 |
| Long-form | 1.5 | 1.75 |

### Line Length

```
Optimal: 50-75 characters per line
Maximum: 100 characters per line
Exception: Code blocks (no limit)
```

---

## Verification Checklist

### Per Component

- [ ] Color contrast ≥ 4.5:1 for text
- [ ] Color contrast ≥ 3:1 for UI elements
- [ ] Focus indicator visible (2px, 4px offset)
- [ ] Touch target ≥ 44px × 44px
- [ ] Keyboard accessible
- [ ] ARIA attributes present
- [ ] Works without color alone

### Per Design System

- [ ] All color combinations tested
- [ ] Light and dark modes verified
- [ ] Screen reader tested
- [ ] Color blindness simulator checked
- [ ] Heading hierarchy correct
- [ ] Skip links for navigation

---

## Best Practices

### Do's
- ✅ Test with actual screen readers
- ✅ Use semantic HTML first
- ✅ Provide text alternatives
- ✅ Support keyboard navigation
- ✅ Maintain consistent focus indicators

### Don'ts
- ❌ Remove focus outlines
- ❌ Rely on color alone
- ❌ Use tiny touch targets
- ❌ Skip heading levels
- ❌ Disable zoom

---

## Cross-References

- **See**: [02-color-tokens.md](02-color-tokens.md) for contrast validation
- **See**: [03-typography.md](03-typography.md) for readable text
- **See**: [05-components.md](05-components.md) for component accessibility
- **See**: [08-maintenance.md](08-maintenance.md) for verification checklist

---

**Version:** WCAG 2.2 | **Source:** https://www.w3.org/TR/WCAG22/
