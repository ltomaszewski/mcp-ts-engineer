# CLI Reference

**Source:** [https://biomejs.dev/reference/cli/](https://biomejs.dev/reference/cli/)

---

## CLI Command Summary

| Command | Function | Use Case |
|---------|----------|----------|
| `biome check` | Formatter + Linter + Imports | Default comprehensive check |
| `biome lint` | Linter only | Find violations |
| `biome format` | Formatter only | Format code |
| `biome ci` | Formatter + Linter + Imports (CI mode) | CI pipelines |
| `biome init` | Initialize config | Project setup |
| `biome migrate` | Migrate from other tools | ESLint/Prettier migration |

---

## biome check

**Description:** Runs formatter, linter, and import sorting on files.

**Syntax:**
```bash
npx biome check [OPTIONS] [PATH...]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `PATH` | string | Files or directories to check |
| `--write` | flag | Apply safe fixes to files |
| `--unsafe` | flag | Apply unsafe fixes |
| `--fix` | flag | Alias for `--write` |
| `--formatter-enabled` | boolean | Enable/disable formatter |
| `--linter-enabled` | boolean | Enable/disable linter |
| `--staged` | flag | Check only staged files |
| `--changed` | flag | Check only changed files |

**Code Example:**

```bash
# Check all files
npx biome check .

# Check and apply fixes
npx biome check --write .

# Apply unsafe fixes
npx biome check --write --unsafe src/

# Check staged files
npx biome check --staged

# Check changed files
npx biome check --changed
```

**Return:**
- Exit code 0: All checks passed
- Exit code 1: Violations found

---

## biome lint

**Description:** Run linting checks on files.

**Syntax:**
```bash
npx biome lint [OPTIONS] [PATH...]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `PATH` | string | Files/directories to lint |
| `--write` | flag | Apply safe fixes |
| `--unsafe` | flag | Apply unsafe fixes |
| `--only` | string | Run only specific rule(s) |
| `--skip` | string | Skip specific rule(s) |
| `--staged` | flag | Lint only staged files |
| `--changed` | flag | Lint only changed files |

**Code Example:**

```bash
# Lint all files
npx biome lint .

# Lint and fix
npx biome lint --write src/

# Apply unsafe fixes
npx biome lint --write --unsafe src/

# Lint only correctness rules
npx biome lint --only=correctness src/

# Skip style rules
npx biome lint --skip=style src/

# Lint staged files
npx biome lint --staged
```

**Return:**
- Exit code 0: No violations
- Exit code 1: Violations found

---

## biome format

**Description:** Run formatter on files.

**Syntax:**
```bash
npx biome format [OPTIONS] [PATH...]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `PATH` | string | Files/directories to format |
| `--write` | flag | Write formatted output to files |
| `--indent-style` | string | Indentation style (tab\|space) |
| `--indent-width` | number | Spaces per indent level |
| `--line-width` | number | Max line length |
| `--quote-style` | string | Quote style (double\|single) |
| `--semicolons` | string | Semicolon insertion |
| `--trailing-commas` | string | Trailing comma behavior |

**Code Example:**

```bash
# Format all files
npx biome format --write .

# Preview formatting
npx biome format src/

# Format with specific indentation
npx biome format --write --indent-width=4 src/

# Format with custom line width
npx biome format --write --line-width=120 src/

# Use single quotes
npx biome format --write --quote-style=single src/

# Format without semicolons
npx biome format --write --semicolons=as-needed src/
```

**Return:**
- Exit code 0: Success
- Exit code 1: Formatting errors

---

## biome ci

**Description:** Run checks in CI mode (read-only).

**Syntax:**
```bash
npx biome ci [OPTIONS] [PATH...]
```

**Code Example:**

```bash
# Check all files in CI
npx biome ci .

# Check only changed files
npx biome ci --changed

# Disable formatter in CI
npx biome ci --formatter-enabled=false
```

**Return:**
- Exit code 0: All checks passed
- Exit code 1: Violations or formatting needed

---

## biome init

**Description:** Initialize a new Biome configuration file.

**Syntax:**
```bash
npx biome init [OPTIONS]
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `--jsonc` | flag | Create config in JSONC format |

**Code Example:**

```bash
# Create default biome.json
npx biome init

# Create with JSONC format
npx biome init --jsonc
```

**Return:** Creates `biome.json` or `biome.jsonc` with defaults

---

## biome migrate

**Description:** Migrate configuration from other tools.

**Syntax:**
```bash
npx biome migrate [SUBCOMMAND]
```

**Subcommands:**

### biome migrate eslint

```bash
npx biome migrate eslint
```

**Behavior:** Reads ESLint config and updates biome.json

---

### biome migrate prettier

```bash
npx biome migrate prettier
```

**Behavior:** Reads Prettier config and updates biome.json

---

## biome version

**Description:** Display Biome version information.

**Syntax:**
```bash
npx biome version
```

**Return:** Version number

---

## Global Options

### --colors
**Type:** `<off|force>`

Control output formatting.

```bash
npx biome lint --colors=off src/
npx biome lint --colors=force src/
```

---

### --verbose
**Type:** Flag

Print additional diagnostics.

```bash
npx biome check --verbose .
```

---

### --config-path
**Type:** String

Override config file path.

```bash
npx biome check --config-path=custom/biome.json src/
```

---

### --max-diagnostics
**Type:** Number

Limit diagnostics shown.

```bash
npx biome lint --max-diagnostics=100 src/
```

---

### --error-on-warnings
**Type:** Flag

Exit with error if warnings found.

```bash
npx biome check --error-on-warnings .
```

---

### --reporter
**Type:** String

Change output format.

```bash
# JSON output
npx biome lint --reporter=json src/ | jq

# GitHub Actions format
npx biome check --reporter=github .

# JUnit XML
npx biome check --reporter=junit . > results.xml
```

---

## Performance Optimization

Use daemon for repeated operations:

```bash
# Start daemon
npx biome start

# Use daemon
npx biome check --use-server .

# Stop daemon
npx biome stop
```

---

## Exit Codes

| Code | Meaning |
|------|---------|
| 0 | Success |
| 1 | Violations found |
| 2 | CLI error |

---

**Document Version:** 2.3.10  
**Last Updated:** December 2024