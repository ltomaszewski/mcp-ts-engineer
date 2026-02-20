# Path Validator Debugging Guide

## Overview

The MCP software-house `todo_reviewer` capability validates file paths in spec documents. This guide documents known false positive patterns, the fix implemented, and how to work around remaining edge cases.

## Path Validation Flow

1. `extractFilePaths(content)` — Extracts paths using regex + post-filter
2. `validateSpecPaths(paths, target)` — Classifies as valid/correctable/uncorrectable
3. `correctSpecPaths(content, target)` — Applies corrections
4. `ValidationError` thrown if uncorrectable paths exist

## False Positive Prevention (Implemented)

The `isLikelyFilePath()` filter rejects:

| Pattern Type | Example | Why Rejected |
|--------------|---------|--------------|
| Code prefixes | `this.agendaService.define` | Starts with `this.` |
| Abbreviations | `e.g.`, `i.e.`, `etc.`, `vs.` | In ABBREVIATIONS_BLACKLIST |
| Invalid extensions | `router.push`, `user.name` | `.push`, `.name` not in VALID_EXTENSIONS |
| Bare filenames | `app.store.ts`, `_layout.tsx` | No `/` and no known prefix |

### Valid Extensions Whitelist

Only these extensions are recognized as file paths:

```
ts, tsx, js, jsx, json, md, yaml, yml, css, html, sh, py
```

## Path Classification Logic

Paths are classified as:
- **valid**: Starts with `apps/` or `packages/`
- **correctable**: Starts with `src/` or `./`
- **uncorrectable**: Starts with `/` (absolute) or `../` (parent)

## Best Practices for Spec Authors

### Always Use Full Monorepo Paths

```markdown
<!-- GOOD: Full path -->
| `apps/bastion-app/src/stores/app.store.ts` | MODIFY | Add fields |

<!-- AVOID: Bare filename (filtered out) -->
| `app.store.ts` | MODIFY | Add fields |
```

### Use Descriptive Text Instead of Code

```markdown
<!-- GOOD: Descriptive -->
- Read ageInDays from useUserWithSleepStates data (from the selectedKidDetails object)
- Navigate to the unlock screen via router

<!-- AVOID: Code references (may be filtered) -->
- Read `selectedKidDetails.ageInDays`
- Call `router.push('/(unlock)/1')`
```

### Avoid Inline Code for Non-Path References

```markdown
<!-- GOOD: Descriptive file references -->
2. In the layout file:
3. In the index file:

<!-- AVOID: Bare filenames in steps -->
2. In `_layout.tsx`:
3. In `index.tsx`:
```

## Debugging Tips

1. **Check extension**: Is the extension in the whitelist? (`ts`, `tsx`, `js`, `jsx`, `json`, `md`, `yaml`, `yml`, `css`, `html`, `sh`, `py`)

2. **Check for code patterns**: Does the path start with `this.` or look like a method/property access?

3. **Check for slashes**: Bare filenames without `/` are rejected

4. **Test extraction locally**:
   ```bash
   # Grep for potential false positives
   grep -E '\b[a-zA-Z]+\.[a-zA-Z]{1,4}\b' your-spec.md
   ```

## Source Files

- Validation: `apps/bastion-mcp-software-house/src/core/utils/spec-path-utils.ts`
- Tests: `apps/bastion-mcp-software-house/src/core/utils/__tests__/spec-path-utils.test.ts`
- Capability: `apps/bastion-mcp-software-house/src/capabilities/todo-reviewer/todo-reviewer.capability.ts`
