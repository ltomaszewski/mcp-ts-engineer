---
name: biome
description: Biome v2 linting, formatting, and code assists - configuration, 450+ rules, CLI, migration. Use when setting up linting, configuring formatting rules, running CI checks, or migrating from ESLint/Prettier.
---

# Biome v2

Fast unified linter, formatter, and import sorter. 35x faster than Prettier, 450+ lint rules, zero-config defaults.

**Package:** `@biomejs/biome`

---

## When to Use

LOAD THIS SKILL when user is:
- Setting up project linting and formatting
- Configuring biome.json rules or formatter options
- Migrating from ESLint/Prettier
- Running lint/format checks in CI
- Fixing lint errors or configuring suppression comments

---

## Critical Rules

**ALWAYS:**
1. Start with `recommended` rules -- sensible defaults, enable stricter rules incrementally
2. Use `biome check` in CI -- runs formatter + linter + assists in one command
3. Configure via `biome.json` -- central configuration, not CLI flags
4. Use `--write` for auto-fix -- fixes both lint and format issues
5. Use `assists` section for import sorting -- replaces v1 `organizeImports`

**NEVER:**
1. Mix Biome with ESLint/Prettier -- causes conflicts, pick one toolchain
2. Skip the `biome ci` command in pipelines -- ensures read-only mode, no writes
3. Disable rules without documenting why -- use biome.jsonc with comments
4. Use `.strict()`/`.passthrough()` v1 config keys -- use v2 schema
5. Use `organizeImports` top-level key -- moved to `assists` in v2

---

## v2 Migration Notes

Key changes from v1:
- **`organizeImports`**: Replaced by `assists` section -- `{ "assists": { "enabled": true } }`
- **Schema URL**: Update to `https://biomejs.dev/schemas/2.0.0/schema.json`
- **`ignore`/`include` fields**: Replaced by `includes` field (single field)
- **Glob behavior**: Globs relative to config file, `**/` no longer auto-prepended
- **CSS/GraphQL/HTML support**: Now stable (formatter/linter)
- **`biome search`**: New structural code search with GritQL patterns
- **Plugin system**: Community plugins via GritQL patterns
- **Stricter defaults**: Some `warn` rules promoted to `error`
- **Config inheritance**: `extends` supports globs and remote configs
- **`--reporter` flag**: New `github`, `gitlab`, `junit`, `sarif`, `checkstyle` reporters
- **Style rules**: Default to `warn` (not `error`)
- **`linter.rules.all`**: Removed; use `recommended` or enable individually
- **Domains**: Auto-detected from package.json (react, test, nextjs, solid)
- **File-level suppression**: `biome-ignore-all` and range `biome-ignore-start`/`biome-ignore-end`

---

## Core Patterns

### Basic Configuration (biome.json)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "assists": {
    "enabled": true
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  }
}
```

### Customizing Rules

```json
{
  "linter": {
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": { "maxAllowedComplexity": 15 }
        }
      },
      "style": {
        "noNonNullAssertion": "error",
        "useConst": "error"
      },
      "suspicious": {
        "noExplicitAny": "error"
      },
      "correctness": {
        "noUnusedVariables": "warn"
      }
    }
  }
}
```

### File Ignores

```json
{
  "files": {
    "include": ["src/**/*.{js,ts,tsx}"],
    "exclude": ["node_modules", "dist", "build", "coverage"]
  }
}
```

### CLI Commands

```bash
# Check (lint + format + assists) - dry run
biome check .

# Check and auto-fix (safe fixes)
biome check --write .

# Apply unsafe fixes too
biome check --write --unsafe .

# Format only
biome format --write .

# Lint only
biome lint --write .

# CI mode (read-only, strict)
biome ci .

# Check staged files only
biome check --staged

# Initialize config
npx @biomejs/biome init
```

### Suppression Comments

```javascript
// Single line
// biome-ignore lint/suspicious/noExplicitAny: required by legacy API
const value: any = getData();

// Entire file (v2)
// biome-ignore-all lint/suspicious/noExplicitAny: legacy file

// Range (v2)
// biome-ignore-start lint/suspicious/noExplicitAny: third-party types
const x: any = externalLib.parse();
const y: any = externalLib.transform();
// biome-ignore-end lint/suspicious/noExplicitAny
```

### VSCode Integration

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "quickfix.biome": "explicit",
    "source.organizeImports.biome": "explicit"
  }
}
```

---

## Anti-Patterns

**BAD** -- Using both Biome and ESLint:
```json
{
  "devDependencies": {
    "@biomejs/biome": "^2.0.0",
    "eslint": "^8.0.0"
  }
}
```

**GOOD** -- Use only Biome:
```json
{
  "devDependencies": {
    "@biomejs/biome": "^2.0.0"
  }
}
```

**BAD** -- Using v1 organizeImports:
```json
{
  "organizeImports": { "enabled": true }
}
```

**GOOD** -- Using v2 assists:
```json
{
  "assists": { "enabled": true }
}
```

---

## Quick Reference

| Task | Command | Description |
|------|---------|-------------|
| Check all | `biome check .` | Lint + format (dry run) |
| Fix all | `biome check --write .` | Auto-fix lint and format |
| Fix unsafe | `biome check --write --unsafe .` | Include unsafe fixes |
| Format only | `biome format --write .` | Only formatting |
| Lint only | `biome lint --write .` | Only linting |
| CI check | `biome ci .` | Strict mode, no writes |
| Init config | `npx @biomejs/biome init` | Create biome.json |
| Staged files | `biome check --staged` | Only git staged |
| Changed files | `biome check --changed` | Only changed files |
| Migrate ESLint | `biome migrate eslint` | Convert ESLint config |
| Migrate Prettier | `biome migrate prettier` | Convert Prettier config |
| Search patterns | `biome search 'pattern' .` | GritQL code search |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and setup | [01-setup.md](01-setup.md) |
| Formatter configuration | [02-formatter-config.md](02-formatter-config.md) |
| Linter rules and domains | [03-linter-config.md](03-linter-config.md) |
| biome.json full schema | [04-configuration.md](04-configuration.md) |
| CLI commands and flags | [05-cli-reference.md](05-cli-reference.md) |
| VSCode, CI, pre-commit setup | [06-integration-guides.md](06-integration-guides.md) |
| Programmatic API usage | [07-api-reference.md](07-api-reference.md) |
| ESLint/Prettier migration | [08-migration-recipes.md](08-migration-recipes.md) |

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/
