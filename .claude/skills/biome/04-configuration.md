# Configuration Files

**Source:** [https://biomejs.dev/reference/configuration/](https://biomejs.dev/reference/configuration/)

---

## Configuration Overview

Biome uses configuration files named `biome.json` or `biome.jsonc` to control formatter, linter, and import sorting behavior.

**Key Points:**
- Located in project root (next to `package.json`)
- Auto-discovered up directory tree
- Comments supported in `.jsonc` format
- All CLI options can be set in config file

---

## File Formats

### biome.json
Standard JSON format without comments.

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  }
}
```

---

### biome.jsonc
JSON with Comments format.

```jsonc
{
  // Use spaces for indentation
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2
  },
  // Recommended linter rules
  "linter": {
    "rules": {
      "recommended": true
    }
  }
}
```

**Create with:** `npx biome init --jsonc`

---

## Configuration File Resolution

Biome searches for configuration files in this order:

1. **Working directory** - `biome.json` or `biome.jsonc`
2. **Parent directories** - Walks up the tree
3. **Default configuration** - Built-in if not found

---

## Root Configuration Sections

### $schema
**Type:** String

JSON schema URL for IDE support.

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json"
}
```

---

### files
**Type:** Object

Configure file patterns and limits.

```json
{
  "files": {
    "include": ["src/**/*.{js,ts,jsx,tsx}", "tests/**/*.ts"],
    "exclude": ["node_modules", "dist", "*.min.js"],
    "maxSize": 1048576
  }
}
```

---

### vcs
**Type:** Object

Version Control System integration.

```json
{
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  }
}
```

---

### formatter
**Type:** Object

Global formatter configuration.

```json
{
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  }
}
```

---

### linter
**Type:** Object

Global linter configuration.

```json
{
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true
    }
  }
}
```

---

### javascript
**Type:** Object

JavaScript/TypeScript specific settings.

```json
{
  "javascript": {
    "formatter": {
      "enabled": true,
      "quoteStyle": "double",
      "trailingCommas": "all"
    }
  }
}
```

---

## Overrides

Apply different settings to specific file patterns.

```json
{
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2
  },
  "overrides": [
    {
      "include": ["**/*.test.ts"],
      "linter": {
        "rules": {
          "correctness": {
            "noUnusedVariables": "off"
          }
        }
      }
    }
  ]
}
```

---

## Complete Configuration Example

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json",
  "files": {
    "include": ["src", "tests"],
    "exclude": ["node_modules", "dist"]
  },
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "defaultBranch": "main"
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
        "noConstAssign": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "enabled": true,
      "quoteStyle": "double",
      "trailingCommas": "all"
    }
  },
  "overrides": [
    {
      "include": ["**/*.test.ts"],
      "linter": {
        "rules": {
          "correctness": {
            "noUnusedVariables": "off"
          }
        }
      }
    },
    {
      "include": ["generated/**"],
      "linter": {
        "enabled": false
      }
    }
  ]
}
```

---

## Environment Variables

### BIOME_CONFIG_PATH

Override config file location:

```bash
export BIOME_CONFIG_PATH=/path/to/biome.json
npx biome check .
```

### BIOME_LOG_PATH

Customize daemon log directory:

```bash
export BIOME_LOG_PATH=/var/log/biome
npx biome start
```

---

## Best Practices

1. **Commit configuration** - Check `biome.json` into version control
2. **Use JSONC** - Easier team documentation with comments
3. **Document overrides** - Comment why specific files have different rules
4. **Validate schema** - Use `$schema` for IDE support
5. **Keep it DRY** - Use overrides instead of duplicating base config

---

**Document Version:** 2.3.10  
**Last Updated:** December 2024