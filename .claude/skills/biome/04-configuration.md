# Configuration Files

**Source:** https://biomejs.dev/reference/configuration/

---

## Overview

Biome uses `biome.json` or `biome.jsonc` to control formatter, linter, assists, and plugins.

**Key Points:**
- Located in project root (next to `package.json`)
- Auto-discovered up directory tree; stops at `"root": true`
- Comments supported in `.jsonc` format
- **v2**: `ignore`/`include` replaced by `includes` field
- **v2**: `organizeImports` replaced by `assists` section
- **v2**: Globs relative to config file, `**/` no longer auto-prepended

---

## Top-Level Schema

| Key | Type | Description |
|-----|------|-------------|
| `$schema` | string | JSON schema URL for IDE support |
| `extends` | string[] | Paths to configs to extend |
| `root` | boolean (default: `true`) | Whether this is root config |
| `files` | object | File inclusion/exclusion |
| `vcs` | object | Version control integration |
| `formatter` | object | Global formatter settings |
| `linter` | object | Linter configuration |
| `assist` | object | Code assist configuration |
| `javascript` | object | JS/TS specific settings |
| `json` | object | JSON settings |
| `css` | object | CSS settings |
| `graphql` | object | GraphQL settings |
| `html` | object | HTML settings |
| `grit` | object | GritQL settings |
| `overrides` | object[] | Pattern-specific overrides |
| `plugins` | string[] | GritQL plugin paths |

---

## files Section

```json
{
  "files": {
    "include": ["src/**/*.{js,ts,tsx}", "tests/**/*.ts"],
    "exclude": ["node_modules", "dist", "*.min.js"],
    "maxSize": 1048576,
    "ignoreUnknown": false
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `include` | string[] | - | Glob patterns to include |
| `exclude` | string[] | - | Glob patterns to exclude |
| `maxSize` | number | `1048576` | Max file size in bytes (1MB) |
| `ignoreUnknown` | boolean | `false` | Skip unknown file types |

---

## vcs Section

```json
{
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main",
    "root": "."
  }
}
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | boolean | `false` | Enable VCS integration |
| `clientKind` | `"git"` | - | VCS type |
| `useIgnoreFile` | boolean | - | Respect .gitignore |
| `defaultBranch` | string | - | Default branch name |
| `root` | string | - | VCS root directory |

---

## assist Section (v2)

Replaces v1 `organizeImports`:

```json
{
  "assist": {
    "enabled": true,
    "includes": ["src/**"],
    "actions": {
      "recommended": true,
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

---

## javascript Section

```json
{
  "javascript": {
    "parser": {
      "unsafeParameterDecoratorsEnabled": false,
      "jsxEverywhere": true
    },
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "all",
      "semicolons": "always"
    },
    "globals": ["__DEV__", "fetch"],
    "jsxRuntime": "transparent",
    "linter": { "enabled": true },
    "assist": { "enabled": true }
  }
}
```

---

## css Section

```json
{
  "css": {
    "parser": {
      "cssModules": false,
      "tailwindDirectives": false
    },
    "formatter": {
      "enabled": true,
      "quoteStyle": "double"
    },
    "linter": { "enabled": true }
  }
}
```

---

## graphql Section

```json
{
  "graphql": {
    "formatter": {
      "enabled": true,
      "quoteStyle": "double"
    },
    "linter": { "enabled": true }
  }
}
```

---

## html Section

```json
{
  "html": {
    "parser": {
      "interpolation": false
    },
    "formatter": {
      "enabled": true,
      "attributePosition": "auto",
      "whitespaceSensitivity": "css",
      "selfCloseVoidElements": "never"
    },
    "linter": { "enabled": true }
  }
}
```

---

## overrides Section

Apply different settings to specific file patterns:

```json
{
  "overrides": [
    {
      "includes": ["**/*.test.ts", "**/*.spec.ts"],
      "linter": {
        "rules": {
          "suspicious": { "noExplicitAny": "off" },
          "correctness": { "noUnusedVariables": "off" }
        }
      }
    },
    {
      "includes": ["generated/**"],
      "linter": { "enabled": false },
      "formatter": { "enabled": false }
    }
  ]
}
```

---

## extends Field

Extend other configuration files:

```json
{
  "extends": ["./shared-biome.json", "npm:@myorg/biome-config"]
}
```

---

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BIOME_CONFIG_PATH` | Override config file location |
| `BIOME_LOG_PATH` | Customize daemon log directory |

```bash
BIOME_CONFIG_PATH=/path/to/biome.json npx biome check .
```

---

## Complete Example

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "root": true,
  "files": {
    "include": ["src", "tests"],
    "exclude": ["node_modules", "dist"]
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "assist": {
    "enabled": true
  },
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
      "recommended": true,
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "overrides": [
    {
      "includes": ["**/*.test.ts"],
      "linter": {
        "rules": {
          "correctness": { "noUnusedVariables": "off" }
        }
      }
    }
  ]
}
```

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/reference/configuration/
