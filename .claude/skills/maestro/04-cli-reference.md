# MODULE 4: CLI REFERENCE

## maestro --version

Display installed Maestro CLI version.

```bash
maestro --version
maestro -v
# Output: Maestro 2.2.0
```

---

## maestro test

Execute test flows on connected devices.

```bash
maestro test <flow_file_or_directory> [OPTIONS]
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `flow_path` | string | (required) | YAML file or directory of flows |
| `--device` | string | auto | Device ID (from `maestro devices`) (v2.1+) |
| `--platform` | string | all | Filter by platform: `ios`, `android`, `web` (v2.1+) |
| `--format` | string | text | Report format: `junit`, `html`, `html-detailed` (v2.2+) |
| `--test-output-dir` | string | `~/.maestro/tests` | Directory for test artifacts (v2.0+) |
| `--debug-output` | string | -- | Directory for debug artifacts (screenshots, hierarchy) |
| `--env` | string | -- | Pass env variable: `KEY=VALUE` (repeatable) |
| `--include-tags` | string | -- | Only run flows with these tags |
| `--exclude-tags` | string | -- | Skip flows with these tags |
| `--shard-all` | integer | -- | Run all flows on N devices in parallel |
| `--shard-split` | integer | -- | Split flows evenly across N devices |
| `--no-ansi` | flag | -- | Disable ANSI colors in output |
| `--no-reinstall-driver` | flag | -- | Skip driver reinstallation (v2.1+) |
| `--screen-size` | string | -- | Browser window size for web flows (v2.2+) |
| `--analyze` | flag | -- | AI-powered analysis of test results |

**Examples:**

```bash
# Run single flow
maestro test login.yaml

# Run all flows in directory
maestro test .maestro/

# Run on specific device (v2.1+)
maestro test flow.yaml --device emulator-5554

# Filter by platform (v2.1+)
maestro test .maestro/ --platform ios

# Generate JUnit report
maestro test .maestro/ --format junit --test-output-dir ./results

# Generate detailed HTML report (v2.2+)
maestro test .maestro/ --format html-detailed --test-output-dir ./results

# Pass environment variables
maestro test flow.yaml --env EMAIL=test@x.com --env PASSWORD=secret

# Run with tag filtering
maestro test .maestro/ --include-tags smoke
maestro test .maestro/ --exclude-tags slow

# Enable debug output
maestro test flow.yaml --debug-output ./debug

# Shard across devices
maestro test .maestro/ --shard-all 3     # all flows on all 3 devices
maestro test .maestro/ --shard-split 3   # split flows across 3 devices

# Web flow with browser size (v2.2+)
maestro test web-flow.yaml --screen-size 1920x1080
```

**Return Codes:**
- `0` -- All tests passed
- `1` -- One or more tests failed
- `2` -- Execution error (device not found, etc.)

---

## maestro studio

Open GUI recorder and inspector for interactive test creation.

```bash
maestro studio [OPTIONS]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `--device` | string | Target specific device |

Two versions available:
- **Maestro Studio Desktop** -- Standalone app with visual flow builder
- **Maestro Studio (CLI)** -- Web-based version opened in browser

```bash
# Open web-based studio
maestro studio

# Target specific device
maestro studio --device emulator-5554
```

---

## maestro hierarchy

Print the view hierarchy of the current screen. Useful for debugging selectors.

```bash
maestro hierarchy [OPTIONS]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `--device` | string | Target specific device |
| `--no-reinstall-driver` | flag | Skip driver reinstallation (v2.1+) |

```bash
maestro hierarchy
maestro hierarchy --device emulator-5554
```

---

## maestro check-syntax

Validate YAML flow syntax without running it (added in v1.40.0).

```bash
maestro check-syntax <flow_file>
```

```bash
maestro check-syntax .maestro/login.yaml
# Output: Flow is valid (or errors listed)
```

---

## maestro download-samples

Download curated sample flow files for learning.

```bash
maestro download-samples
```

Downloads example flows to the current directory.

---

## maestro devices

List all available testing devices.

```bash
maestro devices [OPTIONS]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `--format` | string | Format: `text` (default) or `json` |

```bash
maestro devices
# Output:
# Available Devices:
# 1. emulator-5554 (Android 13)
# 2. iPhone 15 Pro (iOS 17.0)

maestro devices --format json
```

---

## maestro doctor

Diagnose environment and configuration issues.

```bash
maestro doctor
```

**Checks:**
1. Maestro CLI version
2. Java JDK installation (must be 17+)
3. Android SDK configuration
4. Android emulator availability
5. iOS Xcode and simulator
6. Device connectivity
7. Network connectivity

```bash
maestro doctor
# Output:
# Maestro CLI Version: 2.2.0
# Java JDK: 17.0.x
# Android SDK: 34.0.0
# Android Emulator: Available
# iOS Simulator: Available
# Network: Connected
# Status: Ready
```

---

## maestro mcp

Start the Model Context Protocol server for AI assistant integration.

```bash
maestro mcp [OPTIONS]
```

The MCP server is bundled with the Maestro CLI. See [11-mcp-integration.md](11-mcp-integration.md) for configuration.

```bash
# Start MCP server (connects via stdio)
maestro mcp

# List available MCP tools
maestro mcp --list-tools
```

---

## maestro chat

Chat with MaestroGPT AI assistant in the terminal (added in v1.40.0).

```bash
maestro chat [OPTIONS]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `--ask` | string | Ask a single question without entering chat mode |

```bash
# Start interactive chat
maestro chat

# Ask a single question
maestro chat --ask "How do I scroll until visible?"
```

---

## maestro record

Record device interactions and generate YAML flow.

```bash
maestro record <output_file> [OPTIONS]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `output_file` | string | YAML file to save (required) |
| `--device` | string | Specific device to record on |
| `--app-id` | string | Override app ID |

```bash
maestro record login-flow.yaml
maestro record flow.yaml --device emulator-5554
```

---

## Common Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `MAESTRO_DRIVER_STARTUP_TIMEOUT` | 15000 (Android), 120000 (iOS) | Driver startup timeout in ms |
| `MAESTRO_DEVICE_UDID` | auto | Device UDID (v2.2+, read-only in flows) |
| `MAESTRO_SHARD_ID` | -- | Shard identifier (v2.2+, read-only in flows) |
| `MAESTRO_SHARD_INDEX` | -- | Zero-based shard index (v2.2+, read-only in flows) |

---

## Workspace Configuration

A workspace config file (`maestro.yaml` or `config.yaml` in the flow directory) controls test suite behavior:

```yaml
# maestro.yaml
flows:
  - "**/*.yaml"           # Glob pattern for flow files
includeTags:
  - smoke                 # Only include these tags
excludeTags:
  - slow                  # Exclude these tags
executionOrder:
  continueOnFailure: false
  flowsOrder:
    - login.yaml          # Run these first (sequential)
    - signup.yaml
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `flows` | string[] | `["**/*.yaml"]` | Glob patterns for flow inclusion |
| `includeTags` | string[] | all | Tags to include in runs |
| `excludeTags` | string[] | none | Tags to exclude from runs |
| `executionOrder` | object | -- | Ordering and continuation behavior |
| `testOutputDir` | string | `~/.maestro/tests` | Artifact output directory |

**Note:** `deterministic order` was removed in v2.1. Use `executionOrder` instead.

---

**See Also:** [06-yaml-syntax.md](06-yaml-syntax.md) for YAML command reference.

**Version:** 2.x (2.2.0) | **Source:** https://docs.maestro.dev/
