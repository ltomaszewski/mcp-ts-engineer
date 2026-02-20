---
name: biome
description: Biome linting and formatting - configuration, rules, CLI, migration. Use when setting up linting, configuring formatting rules, or migrating from ESLint/Prettier.
---

# Biome

> Fast linter and formatter combining ESLint and Prettier functionality in one tool.

**Package:** `@biomejs/biome`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Setting up project linting and formatting
- Configuring biome.json rules
- Migrating from ESLint/Prettier
- Running lint/format checks in CI
- Fixing lint errors automatically

---

## Critical Rules

**ALWAYS:**
1. Start with `recommended` rules — sensible defaults, enable stricter rules incrementally
2. Use `biome check` in CI — runs both lint and format in one command
3. Configure via `biome.json` — central configuration, not CLI flags
4. Use `--write` for auto-fix — fixes both lint and format issues

**NEVER:**
1. Mix Biome with ESLint/Prettier — causes conflicts, pick one toolchain
2. Skip the `--ci` flag in pipelines — ensures no files are written
3. Disable rules without reason — document why in config comments
4. Forget to run after install — `npx @biomejs/biome init` to create config

---

## Core Patterns

### Basic Configuration (biome.json)

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "organizeImports": {
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
    "ignore": [
      "node_modules",
      "dist",
      "build",
      "*.generated.ts",
      "coverage"
    ]
  }
}
```

### CLI Commands

```bash
# Check (lint + format) - dry run
biome check .

# Check and auto-fix
biome check --write .

# Format only
biome format .
biome format --write .

# Lint only
biome lint .
biome lint --write .

# CI mode (strict, no writes)
biome ci .

# Check specific files
biome check src/components/**/*.tsx

# Initialize config
npx @biomejs/biome init
```

### Migration from ESLint/Prettier

```bash
# Migrate ESLint config
biome migrate eslint --write

# Migrate Prettier config
biome migrate prettier --write

# Then remove old configs
rm .eslintrc* .prettierrc* .eslintignore .prettierignore
npm uninstall eslint prettier eslint-config-* eslint-plugin-* @typescript-eslint/*
```

### VSCode Integration

```json
// .vscode/settings.json
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

**BAD** — Using both Biome and ESLint:
```json
// package.json
{
  "devDependencies": {
    "@biomejs/biome": "^1.9.0",
    "eslint": "^8.0.0"  // Conflict!
  }
}
```

**GOOD** — Use only Biome:
```json
{
  "devDependencies": {
    "@biomejs/biome": "^1.9.0"
  }
}
```

**BAD** — Disabling rules without documentation:
```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noExplicitAny": "off"
      }
    }
  }
}
```

**GOOD** — Document why rules are disabled:
```json
{
  "linter": {
    "rules": {
      "suspicious": {
        // Disabled: migrating from legacy codebase, will enable after refactor
        "noExplicitAny": "off"
      }
    }
  }
}
```

---

## Quick Reference

| Task | Command | Description |
|------|---------|-------------|
| Check all | `biome check .` | Lint + format (dry run) |
| Fix all | `biome check --write .` | Auto-fix lint and format |
| Format only | `biome format --write .` | Only formatting |
| Lint only | `biome lint --write .` | Only linting |
| CI check | `biome ci .` | Strict mode, no writes |
| Init config | `npx @biomejs/biome init` | Create biome.json |
| Migrate ESLint | `biome migrate eslint --write` | Convert ESLint config |
| Migrate Prettier | `biome migrate prettier --write` | Convert Prettier config |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and setup | [01-setup.md](01-setup.md) |
| Formatter configuration | [02-formatter-config.md](02-formatter-config.md) |
| Linter rules | [03-linter-config.md](03-linter-config.md) |
| biome.json options | [04-configuration.md](04-configuration.md) |
| CLI reference | [05-cli-reference.md](05-cli-reference.md) |
| VSCode and CI integration | [06-integration-guides.md](06-integration-guides.md) |
| All rules reference | [07-api-reference.md](07-api-reference.md) |
| ESLint/Prettier migration | [08-migration-recipes.md](08-migration-recipes.md) |

---

**Version:** 1.9.x | **Source:** https://biomejs.dev/
