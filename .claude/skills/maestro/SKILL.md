---
name: maestro
description: "Maestro E2E testing framework v2.x - YAML-based flows, selectors, assertions, gestures, scroll, swipe, repeat, runFlow, environment variables, CI integration, React Native testID. Use when writing end-to-end tests, automating UI flows, debugging test failures, or setting up mobile CI testing."
---

# Maestro

Mobile and web E2E testing framework with human-readable YAML flows, automatic waiting, and cross-platform support.

**CLI:** `maestro` | **Current Version:** 2.2.0 | **Java:** 17+

---

## When to Use

**LOAD THIS SKILL** when user is:
- Writing E2E test flows in YAML for iOS, Android, or Web
- Setting up Maestro in a React Native or Expo project
- Automating mobile UI interactions (tap, swipe, scroll, input)
- Configuring CI/CD pipelines with Maestro tests
- Debugging flaky or failing Maestro flows
- Recording flows with Maestro Studio
- Setting up Maestro MCP for AI-assisted testing
- Building iOS simulator apps with xcodebuild for E2E testing

---

## Critical Rules

**ALWAYS:**
1. Use `testID` (accessibility ID) selectors for reliability -- text selectors break with i18n or copy changes
2. Assert state after navigation before continuing -- prevents race conditions
3. Use environment variables for credentials and test data -- enables CI and avoids secrets in repo
4. Keep flows focused on one feature per file -- easier to debug and maintain
5. Use `runFlow` for shared setup (login, onboarding) -- reduces duplication
6. Run flows on real devices or simulators -- Maestro requires an actual device or emulator
7. Use Java 17+ (required since v2.0) -- older versions will fail
8. Use `url` field for web flows -- `appId` no longer accepts URLs (v2.0 breaking change)

**NEVER:**
1. Use coordinate-based tapping (`point: "100,200"`) -- breaks across screen sizes
2. Add manual sleep/delays -- Maestro handles waiting automatically
3. Hardcode credentials in YAML files -- use `env` variables or `--env` CLI flag
4. Chain many actions without assertions -- makes debugging impossible when failures occur
5. Ignore `--debug-output` on failures -- contains screenshots and hierarchy data
6. Use Rhino JavaScript engine -- deprecated in v2.0, GraalJS is the default

---

## Core Patterns

### Basic Login Flow

```yaml
appId: com.myapp
---
- launchApp:
    clearState: true

- tapOn:
    id: "email-input"
- inputText: "test@example.com"

- tapOn:
    id: "password-input"
- inputText: "password123"

- tapOn:
    id: "login-button"

- assertVisible:
    id: "home-screen"
```

### Flow with Environment Variables and Hooks

```yaml
appId: com.myapp
env:
  EMAIL: test@example.com
  PASSWORD: ${TEST_PASSWORD}
onFlowStart:
  - runFlow: helpers/clear-state.yaml
onFlowComplete:
  - runFlow: helpers/cleanup.yaml
---
- launchApp:
    clearState: true
- tapOn:
    id: "email-input"
- inputText: ${EMAIL}
- tapOn:
    id: "password-input"
- inputText: ${PASSWORD}
- tapOn:
    id: "login-button"
- assertVisible:
    id: "home-screen"
```

### Scroll Until Visible with Retry

```yaml
- scrollUntilVisible:
    element:
      id: "settings-item"
    direction: DOWN
    timeout: 10000
    speed: 60

- tapOn:
    id: "settings-item"
- assertVisible:
    id: "settings-screen"
```

### Conditional Flow (Skip Onboarding)

```yaml
- runFlow:
    when:
      visible: "onboarding-screen"
    file: complete-onboarding.yaml

- assertVisible:
    id: "home-screen"
```

### Repeat Pattern

```yaml
- repeat:
    times: 3
    commands:
      - tapOn:
          id: "increment-button"
- assertVisible:
    text: "Count: 3"
```

---

## Anti-Patterns

**BAD** -- Hardcoded credentials:
```yaml
- inputText: "real-password-123"
```

**GOOD** -- Environment variables:
```yaml
env:
  PASSWORD: ${TEST_PASSWORD}
---
- inputText: ${PASSWORD}
```

**BAD** -- Text selector for dynamic content:
```yaml
- tapOn:
    text: "Welcome, John"
```

**GOOD** -- Accessibility ID:
```yaml
- tapOn:
    id: "welcome-message"
```

**BAD** -- No assertion after navigation:
```yaml
- tapOn:
    id: "submit-button"
- tapOn:
    id: "next-button"
```

**GOOD** -- Assert before continuing:
```yaml
- tapOn:
    id: "submit-button"
- assertVisible:
    id: "success-message"
- tapOn:
    id: "next-button"
```

**BAD** -- URL in appId (broken since v2.0):
```yaml
appId: https://example.com
```

**GOOD** -- Use url field for web:
```yaml
url: https://example.com
```

---

## Quick Reference

| CLI Command | Purpose | Example |
|-------------|---------|---------|
| `maestro test` | Run a single flow | `maestro test .maestro/login.yaml` |
| `maestro test` | Run all flows in directory | `maestro test .maestro/` |
| `maestro studio` | Open GUI recorder | `maestro studio` |
| `maestro hierarchy` | Print view hierarchy | `maestro hierarchy` |
| `maestro check-syntax` | Validate flow YAML syntax (v1.40+) | `maestro check-syntax flow.yaml` |
| `maestro chat` | AI assistant for Maestro (MaestroGPT) (v1.40+) | `maestro chat` |
| `--debug-output` | Save debug artifacts | `maestro test flow.yaml --debug-output ./debug` |
| `--env` | Pass environment variable | `maestro test flow.yaml --env EMAIL=test@x.com` |
| `--device` | Target specific device | `maestro test flow.yaml --device emulator-5554` |
| `--platform` | Filter by platform | `maestro test .maestro/ --platform ios` |
| `--format` | Output report format | `maestro test flow.yaml --format junit` |
| `--test-output-dir` | Set artifact output dir | `maestro test flow.yaml --test-output-dir ./results` |
| `--shard-all` | Run all flows on all devices | `maestro test .maestro/ --shard-all 3` |
| `--shard-split` | Split flows across devices | `maestro test .maestro/ --shard-split 3` |

| Selector | Syntax | Use Case |
|----------|--------|----------|
| By ID | `id: "button"` | React Native `testID` |
| By text | `text: "Submit"` | Static visible labels (regex) |
| By index | `index: 0` | First match among duplicates |
| By point | `point: "50%,50%"` | Center of screen (relative) |
| By state | `enabled: true` | Match enabled/checked/focused |
| Relative: below | `below: { id: "header" }` | Element below another |
| Relative: above | `above: { text: "Footer" }` | Element above another |
| Relative: containsChild | `containsChild: { text: "X" }` | Parent containing child |
| Relative: containsDescendants | `containsDescendants: [...]` | Parent with all listed descendants |
| Relative: childOf | `childOf: { id: "parent" }` | Child of specified parent |
| By traits | `traits: "text"` | Match by trait (text, long-text, square) |

| Command | Syntax | Purpose |
|---------|--------|---------|
| `launchApp` | `- launchApp` | Start app (clearState defaults to false) |
| `tapOn` | `- tapOn: { id: "x" }` | Tap element |
| `longPressOn` | `- longPressOn: { id: "x" }` | Long press element |
| `doubleTapOn` | `- doubleTapOn: { id: "x" }` | Double tap element |
| `inputText` | `- inputText: "hello"` | Type text into focused field |
| `eraseText` | `- eraseText: 10` | Delete characters from field |
| `pressKey` | `- pressKey: Enter` | Press special key |
| `swipe` | `- swipe: { direction: LEFT }` | Directional swipe gesture |
| `scroll` | `- scroll` | Simple vertical scroll |
| `scrollUntilVisible` | See example above | Scroll to find element |
| `assertVisible` | `- assertVisible: { id: "x" }` | Assert element exists |
| `assertNotVisible` | `- assertNotVisible: { id: "x" }` | Assert element hidden |
| `assertScreenshot` | `- assertScreenshot: "name"` | Visual regression testing (v2.2+) |
| `runFlow` | `- runFlow: other.yaml` | Execute sub-flow |
| `copyTextFrom` | `- copyTextFrom: { id: "x" }` | Copy text to clipboard |
| `pasteText` | `- pasteText` | Paste copied text |
| `setClipboard` | `- setClipboard: "text"` | Set clipboard directly (v2.1+) |
| `setPermissions` | `- setPermissions: {...}` | Set app permissions (v2.1+) |
| `setOrientation` | `- setOrientation: LANDSCAPE_LEFT` | Set device orientation: PORTRAIT, LANDSCAPE_LEFT, LANDSCAPE_RIGHT, UPSIDE_DOWN (v2.0+) |
| `repeat` | See example above | Loop commands N times |
| `retry` | `- retry: { maxRetries: 3 }` | Retry on failure |
| `back` | `- back` | Android back button |
| `hideKeyboard` | `- hideKeyboard` | Dismiss keyboard |
| `takeScreenshot` | `- takeScreenshot: "name"` | Capture screenshot |
| `evalScript` | `- evalScript: ${...}` | Run inline JavaScript (GraalJS) |
| `assertWithAI` | `- assertWithAI: "description"` | AI-powered visual assertion |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and first test | [01-getting-started.md](01-getting-started.md) |
| Device and environment setup | [02-installation-setup.md](02-installation-setup.md) |
| Flows, selectors, variables, execution model | [03-core-concepts.md](03-core-concepts.md) |
| All CLI commands and flags | [04-cli-reference.md](04-cli-reference.md) |
| Maestro Studio GUI recorder | [05-api-maestro-studio.md](05-api-maestro-studio.md) |
| Complete YAML command reference (40+ commands) | [06-yaml-syntax.md](06-yaml-syntax.md) |
| React Native testID integration | [07-react-native-integration.md](07-react-native-integration.md) |
| Test organization and reliability | [08-best-practices.md](08-best-practices.md) |
| GitHub Actions and CI/CD | [09-cicd-integration.md](09-cicd-integration.md) |
| Debugging and troubleshooting | [10-troubleshooting.md](10-troubleshooting.md) |
| MCP server integration | [11-mcp-integration.md](11-mcp-integration.md) |
| Xcode build for iOS simulator | [12-xcodebuild-ios-simulator.md](12-xcodebuild-ios-simulator.md) |

---

**Version:** Maestro 2.x (2.2.0) | **Source:** https://docs.maestro.dev/
