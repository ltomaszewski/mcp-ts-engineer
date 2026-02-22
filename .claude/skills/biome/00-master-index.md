# Biome Modular Knowledge Base - Master Index

**Version:** 2.x (^2.4.4)
**Source:** https://biomejs.dev/

---

## Overview

Biome is a fast, unified toolchain for JavaScript, TypeScript, JSON, CSS, GraphQL, and HTML. It combines linting (450+ rules), formatting, and import sorting into a single binary. 35x faster than Prettier, zero-config defaults, single command for everything.

---

## Module Index

| Module | File | Summary |
|--------|------|---------|
| Setup & Installation | [01-setup.md](01-setup.md) | Installation (npm/yarn/pnpm/bun), init, zero-config defaults |
| Formatter Configuration | [02-formatter-config.md](02-formatter-config.md) | Global + per-language formatter options (JS, JSON, CSS, GraphQL, HTML) |
| Linter Configuration | [03-linter-config.md](03-linter-config.md) | 450+ rules, 8 groups, domains (react, test, nextjs), suppression comments |
| Configuration Files | [04-configuration.md](04-configuration.md) | biome.json schema, files, vcs, overrides, extends, environment variables |
| CLI Reference | [05-cli-reference.md](05-cli-reference.md) | All commands (check, lint, format, ci, search, migrate), flags, reporters |
| Integration Guides | [06-integration-guides.md](06-integration-guides.md) | VS Code, WebStorm, Vim, GitHub Actions, GitLab CI, pre-commit hooks |
| API Reference | [07-api-reference.md](07-api-reference.md) | @biomejs/js-api, WASM bindings, programmatic format/lint, daemon architecture |
| Migration & Recipes | [08-migration-recipes.md](08-migration-recipes.md) | ESLint/Prettier migration, rule mappings, project recipes (React, Next.js, NestJS) |

---

## Quick Start

```bash
npm install --save-dev --save-exact @biomejs/biome
npx biome init
npx biome check .
npx biome check --write .
```

---

## Use-Case Routing

| I need to... | Start with |
|--------------|------------|
| Install and set up Biome | [01-setup.md](01-setup.md) |
| Configure formatting rules | [02-formatter-config.md](02-formatter-config.md) |
| Configure linting rules | [03-linter-config.md](03-linter-config.md) |
| Understand biome.json schema | [04-configuration.md](04-configuration.md) |
| Run CLI commands | [05-cli-reference.md](05-cli-reference.md) |
| Set up editor or CI | [06-integration-guides.md](06-integration-guides.md) |
| Use Biome programmatically | [07-api-reference.md](07-api-reference.md) |
| Migrate from ESLint/Prettier | [08-migration-recipes.md](08-migration-recipes.md) |

---

## Core Concepts

### Three-in-One Toolchain

Biome replaces ESLint + Prettier + import-sorter with a single command:
- `biome check .` runs formatter, linter, and assists together
- `biome check --write .` applies all safe fixes

### Safe vs Unsafe Fixes

- **Safe fixes** preserve program semantics -- auto-apply on save
- **Unsafe fixes** may change behavior -- require `--unsafe` flag and manual review

### Configuration Resolution

Biome discovers `biome.json`/`biome.jsonc` by walking up the directory tree. Stops at `"root": true`. Enables monorepo support with per-project overrides inheriting from root config.

### Domains (v2)

Framework-specific rule groups auto-detected from `package.json`:
- **react** -- hooks deps, JSX keys, fragments
- **test** -- skipped tests, focused tests
- **nextjs** -- image elements, font display
- **solid** -- reactivity rules

### Suppression Comments (v2)

```javascript
// Single line
// biome-ignore lint/suspicious/noExplicitAny: reason here

// Entire file
// biome-ignore-all lint/suspicious/noExplicitAny: reason here

// Range
// biome-ignore-start lint/suspicious/noExplicitAny: reason
// ... code ...
// biome-ignore-end lint/suspicious/noExplicitAny
```

---

## Rule Statistics

- **Total rules:** 450+
- **Rule groups:** 8 (a11y, complexity, correctness, nursery, performance, security, style, suspicious)
- **Domains:** react, test, nextjs, solid
- **Languages:** JavaScript, TypeScript, JSX, TSX, JSON, CSS, GraphQL, HTML

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/
