# Biome Modular Knowledge Base - Master Index

**Version:** 2.3.10  
**Last Updated:** December 2024  
**Repository:** [https://github.com/biomejs/biome](https://github.com/biomejs/biome)  
**Official Documentation:** [https://biomejs.dev](https://biomejs.dev)

---

## 📋 Overview

Biome is a fast, unified JavaScript/TypeScript toolchain that combines linting, formatting, and import sorting into a single, performant command-line interface and LSP-compatible language server. It provides 399+ linting rules across 10+ domains (JavaScript, TypeScript, JSON, CSS, HTML, GraphQL, and more).

**Key Features:**
- ⚡ **10-20x faster** than Node.js-based alternatives (ESLint + Prettier)
- 🎯 **Zero-config** setup with intelligent defaults
- 🔧 **399+ linting rules** with automatic fixes (safe & unsafe)
- 📝 **Built-in formatter** eliminating Prettier dependency
- 🛠️ **Multi-language support** (JS, TS, JSX, JSON, CSS, HTML, GraphQL)
- 🔄 **LSP integration** for real-time editor feedback
- 🚀 **Modular architecture** with language-specific domains

---

## 🗂️ Module Index

| Module | File | Summary |
|--------|------|---------|
| **Setup & Installation** | 01-setup.md | Installation methods, project initialization, and zero-config usage patterns. |
| **Formatter Configuration** | 02-formatter-config.md | Complete formatter settings, indentation, line width, quote styles, and language-specific overrides. |
| **Linter Configuration** | 03-linter-config.md | Linter rule groups, severity levels, domain-specific rules, and configuration patterns. |
| **CLI Reference** | 05-cli-reference.md | All CLI commands with typed parameters, return values, and practical examples. |
| **Configuration Files** | 04-configuration.md | biome.json/biome.jsonc schema, file resolution, and advanced patterns. |
| **Integration Guides** | 06-integration-guides.md | Editor integrations (VS Code, IDE support), CI/CD pipelines, and pre-commit hooks. |
| **API Reference** | 07-api-reference.md | JavaScript/TypeScript API, programmatic usage, and plugin development. |
| **Migration & Recipes** | 08-migration-recipes.md | Migrating from ESLint/Prettier, common patterns, troubleshooting, and best practices. |

---

## 🚀 Quick Start

```bash
# Install Biome
npm install --save-dev @biomejs/biome

# Initialize with defaults
npx biome init

# Check all files
npx biome check .

# Format with automatic fixes
npx biome check --write

# Apply unsafe fixes
npx biome check --write --unsafe

# Lint only
npx biome lint src/

# Format only
npx biome format --write src/
```

---

## 📑 Module Descriptions

### Setup & Installation
Covers installation via npm/yarn/pnpm, zero-configuration defaults, and project bootstrapping.

### Formatter Configuration
Deep dive into formatter options: indentation styles, line widths, quote styles, bracket spacing, and language-specific formatting for JavaScript, JSON, CSS, HTML, and GraphQL.

### Linter Configuration
Complete reference for 399+ linting rules organized by groups (Correctness, Performance, Security, Style, Accessibility, Complexity, Suspicious), domains (React, Testing, etc.), and severity levels.

### CLI Reference
Exhaustive reference for all CLI commands (`check`, `lint`, `format`, `ci`, `init`, `migrate`, etc.) with parameter documentation and usage examples.

### Configuration Files
Schema documentation for `biome.json`/`biome.jsonc`, file resolution strategy, overrides, VCS integration, and ignore patterns.

### Integration Guides
First-party integrations with VS Code, WebStorm, VIM, editor-specific configurations, CI/CD workflows, and pre-commit setup.

### API Reference
Programmatic usage via `@biomejs/wasm` or `@biomejs/js`, language bindings, and CLI integration points.

### Migration & Recipes
Practical guides for migrating from ESLint (`biome migrate eslint`) and Prettier (`biome migrate prettier`), along with common project configurations and troubleshooting.

---

## 🔗 Navigation Hints

- **Just getting started?** → Start with Setup & Installation
- **Configuring formatting?** → See Formatter Configuration
- **Setting up linting rules?** → See Linter Configuration
- **Using CLI commands?** → See CLI Reference
- **Migrating from ESLint/Prettier?** → See Migration & Recipes
- **Editor integration?** → See Integration Guides
- **Programmatic usage?** → See API Reference

---

## 📌 Core Concepts

### Three-in-One Toolchain
Biome consolidates three separate tools (linter, formatter, import sorter) into a single unified command, reducing configuration overhead and improving performance.

### Language-Agnostic vs. Domain-Specific Rules
Rules work across multiple languages (e.g., `noUselessEscapeInString` for JS and CSS), while domains group framework-specific rules (React, Solid, Testing, etc.).

### Safe vs. Unsafe Fixes
- **Safe Fixes:** Guaranteed semantic preservation; can auto-apply on save
- **Unsafe Fixes:** May change program semantics; require manual review and `--unsafe` flag

### Configuration Resolution
Biome auto-discovers `biome.json`/`biome.jsonc` in the working directory and parent folders, enabling monorepo support with per-project configurations.

### Override Strategy
Use `overrides` in configuration to apply different settings to specific file globs (e.g., generated files, test directories).

---

## 📚 Module Organization

### Setup & Getting Started
- **01-setup.md** — Installation and initialization

### Configuration (Core)
- **02-formatter-config.md** — Formatting rules and options
- **03-linter-config.md** — Linting rules and configuration
- **04-configuration.md** — Config file structure and patterns

### Usage & Integration
- **05-cli-reference.md** — Command-line interface and commands
- **06-integration-guides.md** — Editor and CI/CD integration
- **07-api-reference.md** — Programmatic JavaScript/TypeScript API

### Advanced
- **08-migration-recipes.md** — Migration guides and project recipes

---

## 📊 Rule Statistics

- **Total Rules:** 399+
- **Rule Groups:** 8 (Accessibility, Complexity, Correctness, Nursery, Performance, Security, Style, Suspicious)
- **Domains:** 10+ (JavaScript, JSON, CSS, HTML, GraphQL, React, Testing, etc.)
- **Safe Fixes Available:** ~200 rules
- **Unsafe Fixes Available:** ~150 rules

---

## 🔧 Configuration Example

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json",
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "organizeImports": {
    "enabled": true
  },
  "overrides": [
    {
      "include": ["*.test.ts"],
      "linter": {
        "rules": {
          "suspicious": {
            "noExplicitAny": "off"
          }
        }
      }
    }
  ]
}
```

---

## 🆘 Support & Resources

- **Official Docs:** [https://biomejs.dev](https://biomejs.dev)
- **GitHub Issues:** [https://github.com/biomejs/biome/issues](https://github.com/biomejs/biome/issues)
- **Discord Community:** [https://discord.gg/BgQnUB9](https://discord.gg/BgQnUB9)
- **Twitter:** [@biomejs](https://twitter.com/biomejs)

---

**This knowledge base follows GitHub Flavored Markdown with strict header nesting for optimal LLM routing and automated documentation generation.**