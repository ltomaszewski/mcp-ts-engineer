# MODULE 1: GETTING STARTED

## What is Maestro?

Maestro is a mobile and web app testing framework that simplifies end-to-end (E2E) testing:

1. **Human-Readable YAML Syntax** -- Define test flows in YAML instead of complex code
2. **No Fragile Selectors** -- Tap buttons by visible text or unique testID attributes
3. **Automatic Waiting** -- Built-in tolerance for UI delays and animations
4. **Real Device Testing** -- Test on actual Android and iOS devices or emulators
5. **Visual Recording** -- Maestro Studio lets you record tests visually
6. **Cross-Platform** -- Write once, run on iOS, Android, and Web
7. **AI-Powered Assertions** -- Use `assertWithAI` for natural-language visual checks

**Source:** https://docs.maestro.dev/

## Why Choose Maestro?

| Feature | Benefit | Use Case |
|---------|---------|----------|
| **Flakiness Handling** | Automatic waits eliminate timing issues | Mobile testing where delays are unpredictable |
| **Fast Iteration** | Interpreted YAML, no compilation needed | Rapid test development and iteration |
| **Accessibility** | Non-technical team members can write tests | Cross-functional QA teams |
| **Parallel Execution** | Sharding across multiple devices | Faster feedback in CI/CD pipelines |
| **CI/CD Native** | Integrates seamlessly with pipelines | DevOps and release automation |
| **AI Assistance** | MaestroGPT + MCP tools for AI assistants | Accelerated test creation |
| **Web Support** | Test desktop browser flows | Cross-platform coverage |

## Your First Test in 30 Seconds

### Step 1: Install Maestro

```bash
# macOS with Homebrew (recommended)
brew tap mobile-dev-inc/tap
brew install maestro

# Or with curl (macOS, Linux)
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Verify installation (requires Java 17+)
maestro --version
# Output: Maestro 2.x.x
```

### Step 2: Create Test File

```bash
mkdir -p .maestro
touch .maestro/first_test.yaml
```

### Step 3: Write Simple Flow

```yaml
appId: com.example.app
---
- launchApp:
    clearState: true
- tapOn: "Login Button"
- inputText: "user@example.com"
- tapOn: "Password Field"
- inputText: "password123"
- tapOn: "Sign In"
- assertVisible: "Welcome Dashboard"
```

### Step 4: Run Test

```bash
maestro test .maestro/first_test.yaml
```

**Expected Output:**
```
 launchApp
 tapOn "Login Button"
 inputText "user@example.com"
 tapOn "Password Field"
 inputText "password123"
 tapOn "Sign In"
 assertVisible "Welcome Dashboard"

Test passed (7 steps in 12s)
```

---

## v2.x Breaking Changes from v1.x

If you are upgrading from Maestro 1.x, be aware of these breaking changes:

| Change | v1.x | v2.x | Action |
|--------|------|------|--------|
| **Java version** | Java 11+ | Java 17+ (required) | Upgrade JDK |
| **JavaScript engine** | Rhino | GraalJS (default) | Update JS if using Rhino-specific syntax |
| **Web flow appId** | URL in `appId` | Use `url` field | Replace `appId: https://...` with `url: https://...` |
| **Workspace config** | `deterministic order` | Removed in v2.1 | Use `executionOrder` instead |
| **Upload command** | `maestro upload` | Removed in v2.1 | Use Maestro Cloud CLI instead |

### New Commands in v2.x

| Command | Version | Description |
|---------|---------|-------------|
| `setOrientation` | 2.0.0 | Set device orientation (PORTRAIT, LANDSCAPE, etc.) |
| `setPermissions` | 2.1.0 | Set app permissions outside launchApp |
| `setClipboard` | 2.1.0 | Set clipboard content without copying from element |
| `assertScreenshot` | 2.2.0 | Visual regression testing |
| `clearState` (web) | 2.3.0 | `clearState` now works for web flows |

### New in v2.3.x

| Feature | Version | Description |
|---------|---------|-------------|
| `cropOn` for `takeScreenshot` | 2.3.0 | Crop screenshots to a specific element using a selector |
| `assertScreenshot` improvements | 2.3.0 | No file extension required, relative path support for reference images |
| `inputRandomPersonName` format | 2.3.0 | Now generates predictable "FirstName LastName" format |
| iPad landscape fix | 2.3.0 | Fixed iPad landscape orientation support |
| Web iframe hierarchy | 2.3.1 | Access to hierarchy in iframes when testing web flows |

### New CLI Commands (pre-v2 but notable)

| Command | Version | Description |
|---------|---------|-------------|
| `maestro chat` | 1.40.0 | AI assistant (MaestroGPT) in terminal |
| `maestro check-syntax` | 1.40.0 | Validate flow YAML syntax without running |

### New CLI Flags in v2.x

| Flag | Version | Description |
|------|---------|-------------|
| `--test-output-dir` | 2.0.0 | Specify artifact storage location |
| `--platform` | 2.1.0 | Filter flows by platform (ios, android, web) |
| `--device` | 2.1.0 | Specify device for test command |
| `--screen-size` | 2.2.0 | Headless browser window size |

---

## Quick Navigation

**For New Users:**
-- Continue with **02-installation-setup.md** for full environment setup

**For React Native Teams:**
-- Jump to **07-react-native-integration.md** for React Native-specific guidance

**For Understanding Concepts:**
-- See **03-core-concepts.md** for Flows, Commands, and Selectors

**For Writing Flows:**
-- Check **06-yaml-syntax.md** for complete command reference

**For CI/CD Setup:**
-- See **09-cicd-integration.md** for GitHub Actions integration

**For Troubleshooting:**
-- Check **10-troubleshooting.md** for debugging failed tests

**For AI-Assisted Testing:**
-- See **11-mcp-integration.md** for Claude and AI assistant integration

---

## Core Concepts Preview

### Flows: The Foundation

A **Flow** is a YAML file representing a user journey:

```yaml
appId: com.example.app
---
- launchApp
- tapOn: "Login"
- inputText: "test@example.com"
- assertVisible: "Welcome"
```

### Commands: User Actions and Assertions

- **Action Commands** -- `launchApp`, `tapOn`, `inputText`, `scroll`, `swipe`, `setOrientation`
- **Assertion Commands** -- `assertVisible`, `assertNotVisible`, `assertTrue`, `assertWithAI`, `assertScreenshot`

### Selectors: Finding Elements

Multiple ways to identify UI elements:
- **By visible text**: `tapOn: "Login"` (regex supported)
- **By testID**: `tapOn: { id: "login_button" }` (regex supported)
- **By relative position**: `below:`, `above:`, `leftOf:`, `rightOf:`, `containsChild:`
- **By coordinates**: `tapOn: { point: "50%,50%" }` (use as last resort)

### Automatic Waiting

Maestro **automatically waits** for UI elements to appear and animations to complete. No manual delays needed.

---

## Decision Checklist

### Should You Use Maestro?

**YES, if you:**
- Test mobile apps (iOS, Android, React Native, Flutter)
- Test web applications (desktop browser)
- Want maintainable, human-readable test code
- Need cross-platform test coverage
- Prefer YAML over complex scripting languages
- Want CI/CD integration with sharding
- Work with non-technical QA teams

**Consider alternatives if you:**
- Need pixel-perfect visual regression only (though `assertScreenshot` helps)
- Have very minimal testing needs

---

## Recommended Learning Path

1. **Installation** -- **02-installation-setup.md** (system requirements, device setup)
2. **Core Concepts** -- **03-core-concepts.md** (understand flows and commands)
3. **YAML Syntax** -- **06-yaml-syntax.md** (reference all available commands)
4. **Your Technology**:
   - React Native? -- **07-react-native-integration.md**
   - Need production setup? -- **08-best-practices.md**
5. **Automation** -- **09-cicd-integration.md** (CI/CD pipelines)

---

**Version:** 2.x (2.3.1) | **Source:** https://docs.maestro.dev/
