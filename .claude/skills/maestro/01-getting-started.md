# MODULE 1: GETTING STARTED

## What is Maestro?

Maestro is a mobile app testing framework that simplifies end-to-end (E2E) testing by providing:

1. **Human-Readable YAML Syntax** - Define test flows in YAML instead of complex code
2. **No Fragile Selectors** - Tap buttons by visible text or unique testID attributes
3. **Automatic Waiting** - Built-in tolerance for UI delays and animations
4. **Real Device Testing** - Test on actual Android and iOS devices, not just emulators
5. **Visual Recording** - Maestro Studio lets you record tests visually
6. **Cross-Platform** - Write once, run on iOS and Android

**Source:** https://maestro.dev/insights/react-native-automation-setup-guide

## Why Choose Maestro?

| Feature | Benefit | Use Case |
|---------|---------|----------|
| **Flakiness Handling** | Automatic waits eliminate timing issues | Mobile testing where delays are unpredictable |
| **Fast Iteration** | Interpreted YAML, no compilation needed | Rapid test development and iteration |
| **Accessibility** | Non-technical team members can write tests | Cross-functional QA teams |
| **Parallel Execution** | Run tests simultaneously on multiple devices | Faster feedback in CI/CD pipelines |
| **CI/CD Native** | Integrates seamlessly with pipelines | DevOps and release automation |
| **AI Assistance** | MaestroGPT helps write commands | Accelerated test creation |

## Your First Test in 30 Seconds

### Step 1: Install Maestro

```bash
# macOS with Homebrew (recommended)
brew install maestro

# Or with curl (all platforms)
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Verify installation
maestro --version
# Output: Maestro X.Y.Z
```

### Step 2: Create Test File

```bash
touch first_test.yaml
```

### Step 3: Write Simple Flow

```yaml
appId: com.example.app
---
- launchApp
- tapOn: "Login Button"
- inputText: "user@example.com"
- tapOn: "Password Field"
- inputText: "password123"
- tapOn: "Sign In"
- assertVisible: "Welcome Dashboard"
```

### Step 4: Run Test

```bash
maestro test first_test.yaml
```

**Expected Output:**
```
✓ launchApp
✓ tapOn "Login Button"
✓ inputText "user@example.com"
✓ tapOn "Password Field"
✓ inputText "password123"
✓ tapOn "Sign In"
✓ assertVisible "Welcome Dashboard"

✅ Test passed (7 steps in 12s)
```

---

## Quick Navigation

**For New Users:**
→ Continue with **02-installation-setup.md** for full environment setup

**For React Native Teams:**
→ Jump to **07-react-native-integration.md** for React Native-specific guidance

**For Understanding Concepts:**
→ See **03-core-concepts.md** for Flows, Commands, and Selectors

**For Writing Flows:**
→ Check **06-yaml-syntax.md** for complete command reference

**For CI/CD Setup:**
→ See **09-cicd-integration.md** for GitHub Actions and Jenkins integration

**For Troubleshooting:**
→ Check **10-troubleshooting.md** for debugging failed tests

**For AI-Assisted Testing:**
→ See **11-mcp-integration.md** for Claude and AI assistant integration

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

### Commands: User Actions & Assertions

- **Action Commands** - `launchApp`, `tapOn`, `inputText`, `scroll`, `swipe`
- **Assertion Commands** - `assertVisible`, `assertNotVisible`, `assertTrue`

### Selectors: Finding Elements

Multiple ways to identify UI elements:
- **By visible text**: `tapOn: "Login"`
- **By testID**: `tapOn: { id: "login_button" }`
- **By XPath**: `tapOn: { xpath: "//Button[@text='Login']" }`

### Automatic Waiting

Maestro **automatically waits** for UI elements to appear and animations to complete. No manual delays needed!

---

## Decision Checklist

### Should You Use Maestro?

✅ **YES, if you:**
- Test mobile apps (iOS, Android, React Native)
- Want maintainable, human-readable test code
- Need cross-platform test coverage
- Prefer YAML over complex scripting languages
- Want CI/CD integration
- Work with non-technical QA teams

❌ **Consider alternatives if you:**
- Only test web applications
- Need pixel-perfect visual testing (use screenshot tools instead)
- Have very minimal testing needs

---

## What's Next?

### Recommended Learning Path

1. **Installation** → **02-installation-setup.md** (system requirements, device setup)
2. **Core Concepts** → **03-core-concepts.md** (understand flows and commands)
3. **YAML Syntax** → **06-yaml-syntax.md** (reference all available commands)
4. **Your Technology**:
   - React Native? → **07-react-native-integration.md**
   - Need production setup? → **08-best-practices.md**
5. **Automation** → **09-cicd-integration.md** (CI/CD pipelines)

---

**Learn More:** https://maestro.dev
