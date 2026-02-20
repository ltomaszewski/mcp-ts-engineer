# Linter Configuration

**Source:** [https://biomejs.dev/linter/](https://biomejs.dev/linter/)

---

## Linter Overview

Biome's linter statically analyzes code to find errors and enforce best practices. It provides **399+ rules** organized into **groups** and **domains**, supporting multiple languages including JavaScript, TypeScript, JSON, CSS, and HTML.

**Key Characteristics:**
- Rules starting with `use*` enforce/suggest a pattern
- Rules starting with `no*` deny a pattern
- Each rule has configurable severity (error, warn, info, off)
- Many rules provide automatic **safe** or **unsafe** fixes

---

## Linter Configuration

### linter.enabled
**Type:** `boolean`  
**Default:** `true`

Enable or disable the entire linter.

```json
{
  "linter": {
    "enabled": true
  }
}
```

---

### linter.rules

Configure individual rules and rule groups.

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

## Rule Configuration

### Enable Recommended Rules

```json
{
  "linter": {
    "rules": {
      "recommended": true
    }
  }
}
```

**Behavior:** Automatically enables language-appropriate recommended rules

---

### Disable a Specific Rule

```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noDebugger": "off"
      }
    }
  }
}
```

---

### Change Rule Severity

Override the default severity level:

```json
{
  "linter": {
    "rules": {
      "style": {
        "noShoutyConstants": "error"
      },
      "correctness": {
        "noUnusedVariables": "warn"
      }
    }
  }
}
```

**Severity Levels:**
- `"error"`: Fails CLI with non-zero exit code
- `"warn"`: Warning; doesn't fail unless `--error-on-warnings` used
- `"info"`: Informational; never fails
- `"off"`: Rule disabled

---

## Rule Groups

### Accessibility (a11y)
Rules preventing accessibility problems.

```json
{
  "linter": {
    "rules": {
      "a11y": {
        "useAltText": "error",
        "useAriaProps": "error"
      }
    }
  }
}
```

---

### Complexity
Rules identifying code that could be simplified.

```json
{
  "linter": {
    "rules": {
      "complexity": {
        "noExcessiveCognitiveComplexity": "warn"
      }
    }
  }
}
```

---

### Correctness
Rules detecting guaranteed incorrect code.

```json
{
  "linter": {
    "rules": {
      "correctness": {
        "noConstAssign": "error",
        "noUnusedVariables": "error"
      }
    }
  }
}
```

---

### Performance
Rules catching patterns that could be optimized.

```json
{
  "linter": {
    "rules": {
      "performance": {
        "noBarrelFile": "warn"
      }
    }
  }
}
```

---

### Security
Rules detecting potential security vulnerabilities.

```json
{
  "linter": {
    "rules": {
      "security": {
        "noDangerouslySetInnerHtml": "error"
      }
    }
  }
}
```

---

### Style
Rules enforcing consistent code style.

```json
{
  "linter": {
    "rules": {
      "style": {
        "noVar": "error",
        "useConst": "warn"
      }
    }
  }
}
```

---

### Suspicious
Rules detecting likely incorrect code.

```json
{
  "linter": {
    "rules": {
      "suspicious": {
        "noExplicitAny": "error",
        "noArrayIndexKey": "error"
      }
    }
  }
}
```

---

## Domains

### React Domain

Enables when `react` dependency detected.

```json
{
  "linter": {
    "rules": {
      "react": {
        "recommended": true,
        "useExhaustiveDependencies": "error"
      }
    }
  }
}
```

---

### Testing Domain

Enables for test framework dependencies.

```json
{
  "linter": {
    "rules": {
      "test": {
        "recommended": true,
        "noSkippedTests": "warn",
        "noFocusedTests": "error"
      }
    }
  }
}
```

---

## Code Fixes

### Safe Fixes
Guaranteed to preserve program semantics.

```bash
npx biome lint --write src/
```

---

### Unsafe Fixes
May change program semantics.

```bash
npx biome lint --write --unsafe src/
```

---

## Suppress Lint Rules

### Inline Suppression

```javascript
// biome-ignore lint/suspicious/noExplicitAny: required by legacy API
const value: any = getData();
```

---

## Complete Example Configuration

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "correctness": {
        "noConstAssign": "error",
        "noUnusedVariables": "error"
      },
      "security": {
        "noDangerouslySetInnerHtml": "error"
      },
      "style": {
        "noVar": "error",
        "useConst": "warn"
      },
      "react": {
        "recommended": true,
        "useExhaustiveDependencies": "error"
      }
    }
  }
}
```

---

**Document Version:** 2.3.10  
**Last Updated:** December 2024