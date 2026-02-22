# Linter Configuration

**Source:** https://biomejs.dev/linter/

---

## Overview

Biome's linter provides **450+ rules** organized into **groups** and **domains**, supporting JavaScript, TypeScript, JSON, CSS, GraphQL, and HTML.

**Key Characteristics:**
- Rules starting with `use*` enforce/suggest a pattern
- Rules starting with `no*` deny a pattern
- Each rule has configurable severity: `error`, `warn`, `info`, `off`
- Many rules provide automatic **safe** or **unsafe** fixes
- **v2**: Style rules default to `warn` (not `error`)
- **v2**: `all` option removed; use `recommended` or enable individually
- **v2**: Multi-file analysis, GritQL plugins, domain auto-detection

---

## Linter Configuration

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

### Severity Levels

| Level | Behavior |
|-------|----------|
| `"error"` | Fails CLI with non-zero exit code |
| `"warn"` | Warning; only fails with `--error-on-warnings` |
| `"info"` | Informational; never fails |
| `"off"` | Rule disabled |

### Rule with Options

```json
{
  "linter": {
    "rules": {
      "complexity": {
        "noExcessiveCognitiveComplexity": {
          "level": "warn",
          "options": { "maxAllowedComplexity": 15 }
        }
      }
    }
  }
}
```

---

## Rule Groups

### Accessibility (a11y)

Rules preventing accessibility problems. Key rules:

| Rule | Description |
|------|-------------|
| `useAltText` | Require alt text on images |
| `useAriaProps` | Ensure valid ARIA props |
| `useValidAriaRole` | Ensure valid ARIA roles |
| `noAccessKey` | Disallow accessKey attribute |
| `useSemanticElements` | Prefer semantic HTML |

### Complexity

Rules identifying code that could be simplified:

| Rule | Description |
|------|-------------|
| `noExcessiveCognitiveComplexity` | Limit cognitive complexity |
| `noForEach` | Prefer for...of over forEach |
| `useFlatMap` | Prefer flatMap over map+flat |
| `useOptionalChain` | Prefer optional chaining |
| `noUselessFragments` | Remove unnecessary React fragments |

### Correctness

Rules detecting guaranteed incorrect code:

| Rule | Description |
|------|-------------|
| `noConstAssign` | No reassigning const |
| `noUnusedVariables` | Detect unused variables |
| `noUnusedImports` | Detect unused imports |
| `noUndeclaredVariables` | Detect undeclared variables |
| `noInvalidConstructorSuper` | Ensure valid super() calls |
| `noNewSymbol` | Disallow new Symbol() |
| `noUndeclaredDependencies` | Detect undeclared deps |

### Performance

Rules catching inefficient patterns:

| Rule | Description |
|------|-------------|
| `noBarrelFile` | Disallow barrel (index) files |
| `noAccumulatingSpread` | Avoid spread in reduce |
| `noDelete` | Avoid delete operator |
| `noReExportAll` | Avoid re-export all |

### Security

Rules detecting security vulnerabilities:

| Rule | Description |
|------|-------------|
| `noDangerouslySetInnerHtml` | Disallow dangerouslySetInnerHTML |
| `noGlobalEval` | Disallow eval() |

### Style

Rules enforcing consistent code style:

| Rule | Description |
|------|-------------|
| `noVar` | Prefer let/const over var |
| `useConst` | Prefer const for unchanged vars |
| `useExplicitType` | Require explicit return types |
| `useImportType` | Prefer type-only imports |
| `useTemplate` | Prefer template literals |
| `useShorthandAssign` | Prefer shorthand assignment |
| `noShoutyConstants` | Avoid ALL_CAPS for non-constants |
| `useImportExtensions` | Enforce file extensions in imports |

### Suspicious

Rules detecting likely incorrect code:

| Rule | Description |
|------|-------------|
| `noExplicitAny` | Disallow explicit `any` type |
| `noArrayIndexKey` | Disallow array index as key |
| `noDebugger` | Disallow debugger statements |
| `noDoubleEquals` | Require === over == |
| `noImplicitAnyLet` | Disallow implicit any in let |
| `noConsole` | Disallow console.log |
| `noEmptyCatch` | Disallow empty catch blocks |

---

## Domains (v2)

Domains group framework-specific rules. Auto-detected from `package.json` dependencies.

### React Domain

```json
{
  "linter": {
    "rules": {
      "react": {
        "recommended": true,
        "useExhaustiveDependencies": "error",
        "useJsxKeyInIterable": "error"
      }
    }
  }
}
```

Key rules: `useExhaustiveDependencies`, `useJsxKeyInIterable`, `noBlankTarget`, `useFragmentSyntax`

### Testing Domain

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

### Next.js Domain

```json
{
  "linter": {
    "rules": {
      "nextjs": {
        "recommended": true
      }
    }
  }
}
```

Key rules: `useGoogleFontDisplay`, `noImgElement`

### Solid Domain

Auto-detected when `solid-js` in dependencies.

---

## Code Fixes

### Safe Fixes (semantics preserved)

```bash
npx biome lint --write src/
```

### Unsafe Fixes (may change semantics)

```bash
npx biome lint --write --unsafe src/
```

---

## Suppression Comments

### Single Line

```javascript
// biome-ignore lint/suspicious/noExplicitAny: required by legacy API
const value: any = getData();
```

### File-Level (v2)

```javascript
// biome-ignore-all lint/suspicious/noExplicitAny: legacy file, will refactor
```

### Range (v2)

```javascript
// biome-ignore-start lint/suspicious/noExplicitAny: third-party types
const x: any = externalLib.parse();
const y: any = externalLib.transform();
// biome-ignore-end lint/suspicious/noExplicitAny
```

### Format

```
// biome-ignore lint/<GROUP>/<RULE>: <explanation>
```

The explanation after the colon is **required**.

---

## Assists (v2)

Import sorting and other code actions moved from `organizeImports` to `assists`:

```json
{
  "assists": {
    "enabled": true,
    "actions": {
      "source": {
        "organizeImports": "on"
      }
    }
  }
}
```

Other assist actions: `useSortedKeys`, `useSortedAttributes`

---

## Plugins (v2)

Custom lint rules via GritQL pattern matching:

```json
{
  "plugins": ["./my-rules.grit"]
}
```

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/linter/
