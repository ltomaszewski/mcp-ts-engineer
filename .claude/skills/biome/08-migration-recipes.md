# Migration & Recipes

**Source:** [https://biomejs.dev/guides/](https://biomejs.dev/guides/)

---

## Migrating from ESLint

### Step 1: Install Biome

```bash
npm install --save-dev @biomejs/biome
```

---

### Step 2: Migrate Configuration

Automatic conversion from `.eslintrc.json`:

```bash
npx biome migrate eslint
```

**Return:** Updates `biome.json` with mapped ESLint rules

---

### Step 3: Address New Violations

Biome catches more issues than ESLint. Suppress newly detected violations:

```bash
# Suppress all new violations during migration
npx biome lint --suppress=<rule> --reason="migrated from eslint" src/

# Review suppressions
grep -r "biome-ignore" src/
```

---

### Step 4: Remove Old Tooling

```bash
# Remove ESLint
npm uninstall eslint

# Remove related packages
npm uninstall @typescript-eslint/eslint-plugin @typescript-eslint/parser

# Remove config files
rm .eslintrc.json .eslintignore
```

---

### Step 5: Update Scripts

Update `package.json`:

```json
{
  "scripts": {
    "lint": "biome lint --write .",
    "format": "biome format --write .",
    "check": "biome check ."
  }
}
```

---

## Migrating from Prettier

### Step 1: Install Biome

```bash
npm install --save-dev @biomejs/biome
```

---

### Step 2: Migrate Configuration

Automatic conversion from Prettier config:

```bash
npx biome migrate prettier
```

**Detects:**
- `.prettierrc.json`
- `.prettierrc.js`
- `prettier.config.js`
- `package.json` prettier field

---

### Step 3: Verify Formatting

Check that output matches expectations:

```bash
# Format specific file
npx biome format src/index.js

# Compare with Prettier
npx prettier src/index.js > prettier-output.js
biome format src/index.js > biome-output.js
diff prettier-output.js biome-output.js
```

---

### Step 4: Remove Prettier

```bash
# Remove Prettier
npm uninstall prettier

# Remove config files
rm .prettierrc .prettierignore
```

---

## Project Recipes

### React Project Setup

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json",
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "rules": {
      "recommended": true,
      "react": {
        "recommended": true,
        "useExhaustiveDependencies": "error",
        "useJsxKeyInIterable": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "jsxQuoteStyle": "double",
      "trailingCommas": "all"
    }
  },
  "overrides": [
    {
      "include": ["**/*.test.tsx"],
      "linter": {
        "rules": {
          "test": {
            "recommended": true
          }
        }
      }
    }
  ]
}
```

---

### TypeScript Strict Mode

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json",
  "linter": {
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noImplicitAnyLet": "error"
      },
      "correctness": {
        "noUnusedVariables": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always"
    }
  }
}
```

---

### Next.js Setup

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.3/schema.json",
  "files": {
    "exclude": ["node_modules", ".next", "out", "build"]
  },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "rules": {
      "recommended": true,
      "react": {
        "recommended": true
      }
    }
  }
}
```

---

### Testing Framework Setup

```json
{
  "linter": {
    "rules": {
      "recommended": true,
      "test": {
        "recommended": true,
        "noSkippedTests": "warn",
        "noFocusedTests": "error"
      }
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
    }
  ]
}
```

---

## Troubleshooting Migration

### Issue: Different Output vs Prettier

**Cause:** Different formatting philosophy

**Solution:** Adjust config to match team preference

```json
{
  "formatter": {
    "lineWidth": 120,
    "trailingCommas": "all",
    "semicolons": "always"
  }
}
```

---

### Issue: New Lint Violations

**Cause:** Biome has stricter rules

**Solution:** Suppress during transition

```bash
npx biome lint --suppress=<rule> --reason="<reason>" src/
```

---

### Issue: Performance Degradation

**Cause:** Heavy linting rules enabled

**Solution:** Use daemon mode

```bash
npx biome start
npx biome check --use-server .
```

---

## Pre-Migration Checklist

- [ ] Back up existing configuration
- [ ] Commit current state to git
- [ ] Install Biome
- [ ] Run `biome migrate eslint` (if using ESLint)
- [ ] Run `biome migrate prettier` (if using Prettier)
- [ ] Review generated `biome.json`
- [ ] Test formatting on sample files
- [ ] Update CI pipeline
- [ ] Update development scripts
- [ ] Remove old tools from dependencies
- [ ] Commit and push changes

---

**Document Version:** 2.3.10  
**Last Updated:** December 2024