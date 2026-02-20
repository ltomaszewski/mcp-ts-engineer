---
name: maestro
description: Maestro E2E testing - flows, assertions, gestures, CI integration. Use when writing end-to-end tests, automating UI flows, or setting up mobile CI testing.
---

# Maestro

> Mobile E2E testing framework with simple YAML-based flows.

**CLI:** `maestro`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Writing E2E test flows in YAML
- Automating mobile UI interactions
- Setting up CI/CD testing pipelines
- Debugging test failures
- Recording flows with Maestro Studio

---

## Critical Rules

**ALWAYS:**
1. Use accessibility IDs for selectors — most reliable across platforms
2. Add wait conditions for async content — prevents flaky tests
3. Keep flows focused — one feature per flow file
4. Use `env` variables for test data — enables reuse and CI configuration
5. Run on real devices/simulators — emulator behavior differs

**NEVER:**
1. Use text selectors for dynamic content — breaks with i18n or changes
2. Skip `assertVisible` after navigation — confirms state before continuing
3. Hardcode credentials in flows — use environment variables
4. Chain too many actions without assertions — makes debugging impossible
5. Ignore `--debug-output` on failures — contains critical diagnostic info

---

## Core Patterns

### Basic Login Flow

```yaml
# .maestro/login-flow.yaml
appId: com.myapp
---
- launchApp

# Enter credentials
- tapOn:
    id: "email-input"
- inputText: "test@example.com"

- tapOn:
    id: "password-input"
- inputText: "password123"

# Submit form
- tapOn:
    id: "login-button"

# Verify navigation
- assertVisible:
    id: "home-screen"
```

### Flow with Environment Variables

```yaml
appId: com.myapp
env:
  EMAIL: test@example.com
  PASSWORD: password123
---
- launchApp
- tapOn:
    id: "email-input"
- inputText: ${EMAIL}
- tapOn:
    id: "password-input"
- inputText: ${PASSWORD}
- tapOn:
    id: "login-button"
```

### Scroll Until Visible

```yaml
- scrollUntilVisible:
    element:
      text: "Settings"
    direction: DOWN
    timeout: 10000

- tapOn:
    text: "Settings"
```

### Conditional Flow

```yaml
- runFlow:
    when:
      visible: "onboarding-screen"
    file: complete-onboarding.yaml

- assertVisible:
    id: "home-screen"
```

### Wait for Element

```yaml
# Wait up to 5 seconds for async content
- extendedWaitUntil:
    visible:
      id: "loaded-content"
    timeout: 5000
```

---

## Anti-Patterns

**BAD** — Hardcoded credentials:
```yaml
- inputText: "real-password-123"  # Exposed in repo!
```

**GOOD** — Environment variables:
```yaml
env:
  PASSWORD: ${TEST_PASSWORD}
---
- inputText: ${PASSWORD}
```

**BAD** — Text selector for dynamic content:
```yaml
- tapOn:
    text: "Welcome, John"  # Breaks for other users
```

**GOOD** — Accessibility ID:
```yaml
- tapOn:
    id: "welcome-message"
```

**BAD** — No assertions after actions:
```yaml
- tapOn:
    id: "submit-button"
- tapOn:
    id: "next-screen-button"  # May not exist yet!
```

**GOOD** — Assert before continuing:
```yaml
- tapOn:
    id: "submit-button"
- assertVisible:
    id: "success-message"
- tapOn:
    id: "next-screen-button"
```

---

## Quick Reference

| Task | Command | Example |
|------|---------|---------|
| Run flow | `maestro test` | `maestro test .maestro/login.yaml` |
| Run all flows | `maestro test` | `maestro test .maestro/` |
| Record flow | `maestro studio` | Opens GUI recorder |
| Debug output | `--debug-output` | `maestro test flow.yaml --debug-output ./debug` |
| Set env var | `--env` | `maestro test flow.yaml --env EMAIL=test@x.com` |
| Run on device | `--device` | `maestro test flow.yaml --device emulator-5554` |

| Selector | Syntax | Use Case |
|----------|--------|----------|
| ID | `id: "button"` | React Native `testID` |
| Text | `text: "Submit"` | Static labels |
| Contains | `text: "Welcome.*"` | Regex matching |
| Index | `index: 0` | Multiple matches |

| Assertion | Syntax | Purpose |
|-----------|--------|---------|
| Visible | `assertVisible: { id: "x" }` | Element exists |
| Not visible | `assertNotVisible: { id: "x" }` | Element hidden |
| Contains text | `assertVisible: { text: "Welcome" }` | Text present |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and setup | [01-getting-started.md](01-getting-started.md) |
| Device configuration | [02-installation-setup.md](02-installation-setup.md) |
| YAML flow structure | [03-core-concepts.md](03-core-concepts.md) |
| All CLI commands | [04-cli-reference.md](04-cli-reference.md) |
| GUI recording | [05-api-maestro-studio.md](05-api-maestro-studio.md) |
| Selectors and loops | [06-yaml-syntax.md](06-yaml-syntax.md) |
| React Native testID | [07-react-native-integration.md](07-react-native-integration.md) |
| Optimization patterns | [08-best-practices.md](08-best-practices.md) |
| GitHub Actions, Maestro Cloud | [09-cicd-integration.md](09-cicd-integration.md) |
| Debugging failures | [10-troubleshooting.md](10-troubleshooting.md) |
| MCP server integration | [11-mcp-integration.md](11-mcp-integration.md) |

---

**Source:** https://maestro.mobile.dev/
