# CLI Reference

**Source:** https://biomejs.dev/reference/cli/

---

## Command Summary

| Command | Function | Use Case |
|---------|----------|----------|
| `biome check` | Formatter + Linter + Assists | Default comprehensive check |
| `biome lint` | Linter only | Find violations |
| `biome format` | Formatter only | Format code |
| `biome ci` | Formatter + Linter + Assists (CI) | CI pipelines (read-only) |
| `biome init` | Initialize config | Project setup |
| `biome migrate` | Migrate from other tools | ESLint/Prettier migration |
| `biome search` | Structural code search | GritQL pattern matching |
| `biome start` | Start daemon server | Performance optimization |
| `biome stop` | Stop daemon server | Cleanup |
| `biome version` | Show version info | Diagnostics |
| `biome rage` | Debugging info | Bug reports |
| `biome explain` | Show documentation | Rule reference |
| `biome clean` | Clear daemon logs | Maintenance |
| `biome lsp-proxy` | LSP handler | Editor integration |

---

## biome check

Runs formatter, linter, and assists on files.

```bash
npx biome check [OPTIONS] [PATH...]
```

| Flag | Type | Description |
|------|------|-------------|
| `--write` | flag | Apply safe fixes to files |
| `--unsafe` | flag | Apply unsafe fixes too |
| `--fix` | flag | Alias for `--write` |
| `--staged` | flag | Check only git staged files |
| `--changed` | flag | Check only changed files |
| `--since=REF` | string | Compare against branch reference |
| `--formatter-enabled` | boolean | Enable/disable formatter |
| `--linter-enabled` | boolean | Enable/disable linter |
| `--assist-enabled` | boolean | Enable/disable assists |

```bash
npx biome check .                      # Dry run
npx biome check --write .              # Apply safe fixes
npx biome check --write --unsafe src/  # Apply all fixes
npx biome check --staged               # Staged files only
npx biome check --changed              # Changed files only
npx biome check --since=main           # Changed since main branch
```

---

## biome lint

Run linting checks only.

```bash
npx biome lint [OPTIONS] [PATH...]
```

| Flag | Type | Description |
|------|------|-------------|
| `--write` | flag | Apply safe fixes |
| `--unsafe` | flag | Apply unsafe fixes |
| `--only` | string | Run specific rule(s)/group(s)/domain(s) |
| `--skip` | string | Skip specific rule(s)/group(s)/domain(s) |
| `--staged` | flag | Lint staged files only |
| `--changed` | flag | Lint changed files only |
| `--suppress` | flag | Add suppression comments instead of fixing |
| `--reason` | string | Suppression reason text |
| `--profile-rules` | flag | Capture rule execution timing |

```bash
npx biome lint .                          # Lint all
npx biome lint --write src/               # Lint and fix
npx biome lint --write --unsafe src/      # Include unsafe fixes
npx biome lint --only=correctness src/    # Only correctness rules
npx biome lint --skip=style src/          # Skip style rules
npx biome lint --staged                   # Staged files
npx biome lint --suppress --reason="migrated from eslint" src/
```

---

## biome format

Run formatter only.

```bash
npx biome format [OPTIONS] [PATH...]
```

| Flag | Type | Description |
|------|------|-------------|
| `--write` | flag | Write formatted output to files |
| `--indent-style` | string | Override indent style |
| `--indent-width` | number | Override indent width |
| `--line-width` | number | Override line width |
| `--quote-style` | string | Override quote style |
| `--semicolons` | string | Override semicolons |
| `--trailing-commas` | string | Override trailing commas |
| `--format-with-errors` | flag | Format files with syntax errors |

```bash
npx biome format --write .                  # Format all
npx biome format src/                       # Preview (dry run)
npx biome format --write --indent-width=4 . # Override indent
npx biome format --write --quote-style=single .
```

---

## biome ci

Run checks in CI mode (read-only, fails on violations).

```bash
npx biome ci [OPTIONS] [PATH...]
```

```bash
npx biome ci .                             # Full CI check
npx biome ci --changed                     # Only changed files
npx biome ci --formatter-enabled=false     # Skip formatting
```

---

## biome init

Initialize new configuration file.

```bash
npx biome init           # Create biome.json
npx biome init --jsonc   # Create biome.jsonc
```

---

## biome migrate

Migrate from other tools.

```bash
npx biome migrate eslint     # Read ESLint config, update biome.json
npx biome migrate prettier   # Read Prettier config, update biome.json
```

---

## biome search (v2, experimental)

Structural code search with GritQL patterns:

```bash
npx biome search 'console.log($msg)' src/
```

---

## Global Options

| Flag | Type | Description |
|------|------|-------------|
| `--colors` | `off` \| `force` | Output color mode |
| `--use-server` | flag | Connect to running daemon |
| `--verbose` | flag | Print additional diagnostics |
| `--config-path` | string | Override config file path |
| `--max-diagnostics` | `none` \| number | Limit diagnostics shown |
| `--skip-parse-errors` | flag | Ignore syntax errors |
| `--no-errors-on-unmatched` | flag | Suppress unmatched file errors |
| `--error-on-warnings` | flag | Exit with error on warnings |
| `--diagnostic-level` | `info` \| `warn` \| `error` | Filter diagnostics |
| `--reporter` | string | Output format |
| `--reporter-file` | string | Write report to file |
| `--stdin-file-path` | string | Virtual path for stdin input |

### Reporter Formats

| Reporter | Description |
|----------|-------------|
| `default` | Human-readable terminal output |
| `json` | JSON format |
| `json-pretty` | Pretty-printed JSON |
| `github` | GitHub Actions annotations |
| `gitlab` | GitLab CI annotations |
| `junit` | JUnit XML format |
| `summary` | Summary only |
| `checkstyle` | Checkstyle XML |
| `rdjson` | ReviewDog JSON |
| `sarif` | SARIF format |

```bash
npx biome check --reporter=github .        # GitHub Actions
npx biome check --reporter=junit . > results.xml
npx biome lint --reporter=json src/ | jq
```

---

## Daemon Mode

Use daemon for faster repeated operations:

```bash
npx biome start                    # Start daemon
npx biome check --use-server .     # Use daemon
npx biome stop                     # Stop daemon
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Violations found |
| 2 | CLI error |

---

**Version:** 2.x (^2.4.4) | **Source:** https://biomejs.dev/reference/cli/
