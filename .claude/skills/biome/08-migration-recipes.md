# Migration & Recipes

**Source:** https://biomejs.dev/linter/rules-sources/

---

## Migrating from ESLint

### Step 1: Install Biome

```bash
npm install --save-dev --save-exact @biomejs/biome
npx biome init
```

### Step 2: Migrate Configuration

Automatic conversion from ESLint config:

```bash
npx biome migrate eslint
```

This reads your `.eslintrc.json` (or equivalent) and updates `biome.json` with mapped rules.

### Step 3: Suppress New Violations

Biome catches more issues than ESLint. Suppress newly detected violations during migration:

```bash
npx biome lint --suppress --reason="migrated from eslint" src/
```

This adds `// biome-ignore` comments instead of failing.

### Step 4: Remove ESLint

```bash
npm uninstall eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser \
  eslint-plugin-react eslint-plugin-react-hooks eslint-plugin-jsx-a11y \
  eslint-plugin-import eslint-config-prettier

rm .eslintrc.json .eslintrc.js .eslintignore
```

### Step 5: Update Scripts

```json
{
  "scripts": {
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "format": "biome format --write .",
    "check:ci": "biome ci ."
  }
}
```

---

## Migrating from Prettier

### Step 1: Migrate Configuration

```bash
npx biome migrate prettier
```

Detects and converts: `.prettierrc`, `.prettierrc.json`, `.prettierrc.js`, `prettier.config.js`, `package.json` prettier field.

### Step 2: Verify Output

```bash
npx biome format src/
```

Compare against previous Prettier output. Minor differences are expected (Biome has a different formatting philosophy in some edge cases).

### Step 3: Remove Prettier

```bash
npm uninstall prettier eslint-config-prettier eslint-plugin-prettier
rm .prettierrc .prettierrc.json .prettierignore
```

---

## ESLint Rule Mapping (Core)

Key ESLint core rules and their Biome equivalents:

| ESLint Rule | Biome Rule |
|-------------|-----------|
| `eqeqeq` | `noDoubleEquals` |
| `no-console` | `noConsole` |
| `no-debugger` | `noDebugger` |
| `no-unused-vars` | `noUnusedVariables` |
| `no-var` | `noVar` |
| `prefer-const` | `useConst` |
| `prefer-template` | `useTemplate` |
| `no-eval` | `noGlobalEval` |
| `no-empty` | `noEmptyBlockStatements` |
| `no-fallthrough` | `noFallthroughSwitchClause` |
| `no-self-assign` | `noSelfAssign` |
| `no-unreachable` | `noUnreachable` |
| `curly` | `useBlockStatements` |
| `default-case-last` | `useDefaultSwitchClauseLast` |
| `require-await` | `useAwait` |
| `no-throw-literal` | `useThrowOnlyError` |
| `no-useless-catch` | `noUselessCatch` |
| `no-useless-rename` | `noUselessRename` |
| `no-sparse-arrays` | `noSparseArray` |

---

## TypeScript-ESLint Rule Mapping

| @typescript-eslint Rule | Biome Rule |
|------------------------|-----------|
| `no-explicit-any` | `noExplicitAny` |
| `no-unused-vars` | `noUnusedVariables` |
| `consistent-type-imports` | `useImportType` |
| `consistent-type-exports` | `useExportType` |
| `explicit-function-return-type` | `useExplicitType` |
| `no-non-null-assertion` | `noNonNullAssertion` |
| `no-empty-interface` | `noEmptyInterface` |
| `no-inferrable-types` | `noInferrableTypes` |
| `prefer-optional-chain` | `useOptionalChain` |
| `prefer-as-const` | `useAsConstAssertion` |
| `no-namespace` | `noNamespace` |
| `naming-convention` | `useNamingConvention` |
| `no-require-imports` | `noCommonJs` |
| `no-useless-constructor` | `noUselessConstructor` |
| `array-type` | `useConsistentArrayType` |

---

## React Plugin Rule Mapping

| eslint-plugin-react | Biome Rule |
|---------------------|-----------|
| `jsx-key` | `useJsxKeyInIterable` |
| `jsx-no-target-blank` | `noBlankTarget` |
| `jsx-no-duplicate-props` | `noDuplicateJsxProps` |
| `jsx-no-useless-fragment` | `noUselessFragments` |
| `no-children-prop` | `noChildrenProp` |
| `no-danger` | `noDangerouslySetInnerHtml` |
| `no-array-index-key` | `noArrayIndexKey` |
| `button-has-type` | `useButtonType` |

| eslint-plugin-react-hooks | Biome Rule |
|---------------------------|-----------|
| `exhaustive-deps` | `useExhaustiveDependencies` |
| `rules-of-hooks` | `useHookAtTopLevel` |

---

## Project Recipes

### React / React Native Project

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "react": {
        "recommended": true,
        "useExhaustiveDependencies": "error",
        "useJsxKeyInIterable": "error"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "jsxQuoteStyle": "double",
      "trailingCommas": "all",
      "semicolons": "always"
    }
  },
  "overrides": [
    {
      "includes": ["**/*.test.tsx", "**/*.test.ts"],
      "linter": {
        "rules": {
          "test": { "recommended": true },
          "suspicious": { "noExplicitAny": "off" }
        }
      }
    }
  ]
}
```

---

### TypeScript Strict Project

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "suspicious": {
        "noExplicitAny": "error",
        "noImplicitAnyLet": "error"
      },
      "correctness": {
        "noUnusedVariables": "error",
        "noUnusedImports": "error"
      },
      "style": {
        "useConst": "error",
        "noVar": "error",
        "useImportType": "error",
        "useExportType": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  }
}
```

---

### Next.js Project

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "exclude": ["node_modules", ".next", "out", "build"]
  },
  "formatter": {
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "react": { "recommended": true },
      "nextjs": { "recommended": true }
    }
  },
  "assist": {
    "enabled": true
  }
}
```

---

### NestJS Backend Project

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "exclude": ["node_modules", "dist"]
  },
  "formatter": {
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
      },
      "style": {
        "useImportType": "error",
        "useExportType": "error"
      }
    }
  },
  "javascript": {
    "parser": {
      "unsafeParameterDecoratorsEnabled": true
    },
    "formatter": {
      "quoteStyle": "double",
      "semicolons": "always",
      "trailingCommas": "all"
    }
  },
  "overrides": [
    {
      "includes": ["**/*.spec.ts", "**/*.e2e-spec.ts"],
      "linter": {
        "rules": {
          "test": { "recommended": true },
          "correctness": { "noUnusedVariables": "off" }
        }
      }
    }
  ]
}
```

**Note:** `unsafeParameterDecoratorsEnabled` is required for NestJS decorators like `@Inject()`.

---

### Monorepo Setup

Root `biome.json` -- shared rules:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "root": true,
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true,
    "defaultBranch": "main"
  },
  "formatter": {
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
  "assist": {
    "enabled": true
  }
}
```

App-level `apps/my-app/biome.json` -- app-specific overrides only:

```json
{
  "$schema": "https://biomejs.dev/schemas/2.0.0/schema.json",
  "files": {
    "exclude": [".expo", "ios", "android"]
  }
}
```

Biome v2 walks up the directory tree to find parent configs. App configs inherit all rules from root.

---

## Troubleshooting Migration

### Different Output vs Prettier

**Cause:** Biome has a different formatting philosophy in some edge cases.

**Solution:** Adjust config to match team preference:

```json
{
  "formatter": {
    "lineWidth": 120
  },
  "javascript": {
    "formatter": {
      "trailingCommas": "all",
      "semicolons": "always"
    }
  }
}
```

### New Lint Violations After Migration

**Cause:** Biome has stricter rules than ESLint defaults.

**Solution:** Suppress during transition, then fix incrementally:

```bash
npx biome lint --suppress --reason="migrated from eslint" src/
```

### Performance Issues

**Cause:** Cold start on each invocation.

**Solution:** Use daemon mode:

```bash
npx biome start
npx biome check --use-server .
```

---

## Pre-Migration Checklist

- [ ] Back up existing configuration
- [ ] Commit current state to git
- [ ] Install Biome (`npm i -DE @biomejs/biome`)
- [ ] Run `npx biome init`
- [ ] Run `npx biome migrate eslint` (if using ESLint)
- [ ] Run `npx biome migrate prettier` (if using Prettier)
- [ ] Review generated `biome.json`
- [ ] Run `npx biome check .` and review diagnostics
- [ ] Suppress bulk violations with `--suppress --reason="migration"`
- [ ] Update CI pipeline (replace eslint/prettier with `biome ci`)
- [ ] Update package.json scripts
- [ ] Remove old tools from devDependencies
- [ ] Remove old config files (`.eslintrc.*`, `.prettierrc*`, `.eslintignore`, `.prettierignore`)
- [ ] Commit and push

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/linter/rules-sources/
