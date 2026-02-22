# Design System: Modular Knowledge Base

**Master Index & Navigation Hub**

This modular knowledge base is designed for LLM context window efficiency. Use this index to navigate to specific modules relevant to your task.

---

## Quick Navigation

### Core Framework & Setup (Start Here)
- **[01-architecture.md](01-architecture.md)** — What a design system is, 3-layer model (primitives → tokens → components), token naming principles, decision framework for new tokens.

- **[02-color-tokens.md](02-color-tokens.md)** — Color primitives (hex, RGB, HSL), semantic color tokens, light/dark mode support, accessibility validation, implementation options.

### Token Systems
- **[03-typography.md](03-typography.md)** — Font families and weights, size scales, line heights, typography tokens (headings, body, labels, code), component usage.

- **[04-spacing-layout.md](04-spacing-layout.md)** — Spacing primitives and scales (4px base), spacing tokens (padding, margin, gap), border radius tokens, implementation patterns.

### Component Layer
- **[05-components.md](05-components.md)** — Component specification template (purpose, variants, states, tokens, accessibility), core component list, full button example with accessibility.

### Standards & Quality
- **[06-accessibility.md](06-accessibility.md)** — WCAG 2.2 Level AA requirements, color contrast ratios, focus indicators, keyboard navigation, touch targets, ARIA attributes, semantic HTML.

### Implementation & Maintenance
- **[07-implementation.md](07-implementation.md)** — Step-by-step guide for creating systems, format options (CSS, TypeScript, JSON, Figma), distribution strategies, quick start workflow.

- **[08-maintenance.md](08-maintenance.md)** — Review schedules (PR, monthly, quarterly, annual), update protocols (add/update tokens, add components), verification checklists, success metrics.

---

## Quick Reference by Role

| Role | Start Here | Purpose |
|------|-----------|---------|
| **Designer** | [02-color-tokens.md](02-color-tokens.md) | Define/update design tokens |
| **Frontend Developer** | [07-implementation.md](07-implementation.md) | Implement tokens in code |
| **Design System Lead** | [01-architecture.md](01-architecture.md) | Framework and decisions |
| **Maintainer** | [08-maintenance.md](08-maintenance.md) | Keep system current |
| **Accessibility Specialist** | [06-accessibility.md](06-accessibility.md) | WCAG compliance |

---

## Quick Reference by Use Case

### "I'm new to design systems"
1. Start with **[01-architecture.md](01-architecture.md)**
2. Follow **[02-color-tokens.md](02-color-tokens.md)**
3. Explore **[03-typography.md](03-typography.md)**

### "I need to add a new color token"
→ **[02-color-tokens.md](02-color-tokens.md)** (token structure)
→ **[08-maintenance.md](08-maintenance.md)** (update protocol)
→ **[06-accessibility.md](06-accessibility.md)** (contrast validation)

### "I need to create a new component"
→ **[05-components.md](05-components.md)** (specification template)
→ **[06-accessibility.md](06-accessibility.md)** (requirements)
→ **[08-maintenance.md](08-maintenance.md)** (add component protocol)

### "I need to verify accessibility"
→ **[06-accessibility.md](06-accessibility.md)** (WCAG requirements)
→ **[08-maintenance.md](08-maintenance.md)** (verification checklist)

### "I'm building a new design system"
→ **[01-architecture.md](01-architecture.md)** (foundations)
→ **[07-implementation.md](07-implementation.md)** (step-by-step guide)
→ **[08-maintenance.md](08-maintenance.md)** (verification)

### "I need to maintain an existing system"
→ **[08-maintenance.md](08-maintenance.md)** (schedules & protocols)
→ **[06-accessibility.md](06-accessibility.md)** (audit guidelines)

---

## Module Dependency Graph

```
01-architecture (Foundation)
  ├→ 02-color-tokens (Color System)
  │   └→ 06-accessibility (WCAG Validation)
  │
  ├→ 03-typography (Typography System)
  │   └→ 06-accessibility (Readability)
  │
  ├→ 04-spacing-layout (Spacing System)
  │
  ├→ 05-components (Component Layer)
  │   ├→ 02-color-tokens
  │   ├→ 03-typography
  │   ├→ 04-spacing-layout
  │   └→ 06-accessibility
  │
  ├→ 07-implementation (Building)
  │   └→ All token modules
  │
  └→ 08-maintenance (Ongoing)
      └→ All modules
```

---

## Content Schema Explanation

Each module follows a consistent structure:

### Foundation Modules (01)
- **What is it?** — Problem statement and purpose
- **Core Concepts** — Key principles and models
- **Naming Conventions** — Standards for consistency
- **Decision Framework** — When and how to apply

### Token Modules (02, 03, 04)
- **Overview** — What problem does this token type solve?
- **Layer 1: Primitives** — Raw values and formats
- **Layer 2: Semantic Tokens** — Purpose-based mappings
- **Implementation** — CSS, TypeScript, JSON examples
- **Best Practices** — Do's & Don'ts

### Component Module (05)
- **Template** — Standard documentation structure
- **Core List** — Essential components for any system
- **Full Example** — Complete component specification
- **Accessibility** — WCAG requirements per component

### Standards Module (06)
- **Requirements** — WCAG 2.2 AA criteria
- **Testing** — How to verify compliance
- **Examples** — Correct vs incorrect patterns

### Process Modules (07, 08)
- **Step-by-Step** — Actionable workflows
- **Checklists** — Verification items
- **Schedules** — Timing for reviews
- **Metrics** — Success indicators

---

## Cross-References

Throughout each module, you'll find references like:
- **See: [Module Name](path)** — Links to related content
- **Cross-ref: [Concept](path)** — Specific section reference
- **Prerequisite: [Module Name](path)** — Required reading before this module

---

## How to Use This Knowledge Base

### For Development Teams
1. **Onboarding**: Direct new members to 01 → 02 → 03
2. **Reference**: Use specific modules (e.g., 05, 06) as needed
3. **Best Practices**: Review 08 for maintenance patterns

### For LLM/RAG Integration
1. **Load modules selectively** based on query intent
2. **Each module is self-contained** with minimal external dependencies
3. **Use cross-references** to pull related context as needed
4. **Modules are chunked for token efficiency** (target: 400-700 tokens each)

### For Documentation Searches
- Use the quick reference section to find your use case
- Each module title clearly states its scope
- Within modules, use ## and ### headings for section navigation

---

## What This IS

✅ Framework for creating/maintaining design systems
✅ Token definitions (colors, typography, spacing)
✅ Component specifications
✅ Accessibility standards (WCAG 2.2)
✅ Implementation patterns
✅ Maintenance protocols

## What This IS NOT

❌ Technology-specific (not React Native, not Web, not Figma)
❌ Company-specific branding
❌ Product roadmap
❌ Individual component code

---

---

**Version:** WCAG 2.2 | **Source:** https://www.w3.org/TR/WCAG22/
