# Maestro Testing Framework - Modular Knowledge Base

> End-to-End testing framework for mobile apps with human-readable YAML syntax, automatic waiting, and cross-platform support. LLM-optimized modular architecture for context efficiency.

**Source:** [https://maestro.dev](https://maestro.dev)

---

## Quick Overview

Maestro is a mobile app testing framework that simplifies end-to-end (E2E) testing by providing:
- **Human-Readable YAML Syntax** - Define test flows without complex code
- **No Fragile Selectors** - Tap buttons by visible text or unique testID attributes
- **Automatic Waiting** - Built-in tolerance for UI delays and animations
- **Real Device Testing** - Test on actual Android and iOS devices
- **Visual Recording** - Record tests visually using Maestro Studio
- **Cross-Platform** - Write once, run on iOS and Android

**Installation:**
```bash
brew install maestro
# or
curl -fsSL "https://get.maestro.mobile.dev" | bash
```

---

## Module Navigation Guide

This knowledge base is organized into **10 self-contained modules** optimized for LLM context windows. Each module is independently retrievable and includes cross-references for broader context.

### Core Modules

| Module | File | Purpose | Typical Use Case |
|--------|------|---------|------------------|
| **Getting Started** | `01-getting-started.md` | Why Maestro, first test in 30 seconds, quick navigation | First-time users, quick introduction, decision making |
| **Installation & Setup** | `02-installation-setup.md` | System requirements, installation methods, device setup (emulator/physical) | Setting up Maestro, configuring environment, device management |
| **Core Concepts** | `03-core-concepts.md` | Flows, Commands, Selectors, Variables, Execution model | Understanding Maestro fundamentals, test structure, core patterns |
| **CLI Reference** | `04-cli-reference.md` | All maestro commands (test, init, devices, doctor, logs, record) | Command-line usage, scripting, CI/CD automation |
| **API Reference: Maestro Studio** | `05-api-maestro-studio.md` | Element Inspector, View Hierarchy Inspector, interactive features | Visual element inspection, debugging, test recording |
| **YAML Syntax Reference** | `06-yaml-syntax.md` | Complete YAML command reference (launchApp, tapOn, inputText, scroll, swipe, assertions, etc.) | Writing flows, command syntax, action/assertion patterns |
| **React Native Integration** | `07-react-native-integration.md` | React Native setup, testID usage, component interactions, complete sample app | Testing React Native apps, integrating with React Native projects |
| **Best Practices & Optimization** | `08-best-practices.md` | Test organization, reducing flakiness, modularization, test data patterns | Production-ready tests, maintainability, reliability |
| **CI/CD Integration** | `09-cicd-integration.md` | GitHub Actions, Jenkins, parallel execution, CI/CD pipelines | Automation, continuous testing, DevOps integration |
| **Troubleshooting & Debugging** | `10-troubleshooting.md` | Common issues, debugging checklist, element identification problems, timing issues | Fixing failures, debugging tests, resolving flakiness |
| **MCP Server Integration** | `11-mcp-integration.md` | Model Context Protocol setup, AI assistant integration (Claude, Cursor, Windsurf), 47+ MCP tools | AI-assisted testing, IDE integration, LLM workflows |

---

## How to Use This Knowledge Base

### For Implementation Tasks

1. **"I need to write my first test"**
   → Start with `01-getting-started.md`, then reference `06-yaml-syntax.md`

2. **"How do I set up Maestro for React Native?"**
   → Go to `02-installation-setup.md`, then `07-react-native-integration.md`

3. **"My test is failing - how do I debug?"**
   → See `10-troubleshooting.md`

4. **"How do I integrate Maestro into CI/CD?"**
   → Check `09-cicd-integration.md` with reference to `04-cli-reference.md`

5. **"How do I make my tests more reliable?"**
   → Navigate to `08-best-practices.md`

6. **"Can I integrate Maestro with AI assistants like Claude?"**
   → Check `11-mcp-integration.md` for MCP setup and AI workflows

### For API Lookups

Each module contains:
- **Command/Feature Name** as heading
- **Description** of what it does
- **Syntax** showing usage pattern
- **Parameters** table with types and descriptions
- **Return Values** specification
- **Examples** showing real usage
- **Source URL** for official documentation verification

### For Troubleshooting

- **"Element not found"?** → `10-troubleshooting.md` (Issue 1)
- **"Timeout waiting"?** → `10-troubleshooting.md` (Issue 2)
- **"Works locally, fails in CI"?** → `10-troubleshooting.md` (Issue 3)
- **"Flaky tests"?** → `08-best-practices.md` (Reducing Flakiness) or `10-troubleshooting.md` (Issue 4)
- **"Can't find element with testID"?** → `06-yaml-syntax.md` (Selectors) or `07-react-native-integration.md` (testID setup)
- **"MCP server not found"?** → `11-mcp-integration.md` (Troubleshooting section)

---

## Core Concepts at a Glance

### Flow Files
A **Flow** is a YAML file containing a sequence of test steps representing a user journey:

```yaml
appId: com.example.app
---
- launchApp
- tapOn: "Login"
- inputText: "test@example.com"
- assertVisible: "Welcome"
```

### Commands: Two Types
- **Action Commands** - `launchApp`, `tapOn`, `inputText`, `scroll`, `swipe`
- **Assertion Commands** - `assertVisible`, `assertNotVisible`, `assertTrue`

### Selectors: Multiple Strategies
- **By visible text**: `tapOn: "Login"`
- **By testID**: `tapOn: { id: "login_button" }`
- **By XPath**: `tapOn: { xpath: "//Button[@text='Login']" }`
- **By coordinates**: `tapOn: [150, 200]` (avoid - fragile)

### Automatic Waiting
Maestro automatically waits for UI elements to appear, animations to complete, and network responses - no manual delays needed.

---

## Cross-Module Dependencies

```
01-getting-started
├─ references: 03-core-concepts (fundamentals)
└─ links to: 06-yaml-syntax (syntax reference)

02-installation-setup
├─ foundational for: all other modules
└─ referenced by: 07-react-native-integration

03-core-concepts
├─ requires: None (foundational)
└─ referenced by: 01, 04, 06, 07

04-cli-reference
├─ requires: 03-core-concepts (understanding flows)
└─ used by: 09-cicd-integration, 10-troubleshooting

05-api-maestro-studio
├─ requires: 03-core-concepts
└─ used for: debugging in 10-troubleshooting

06-yaml-syntax.md
├─ requires: 03-core-concepts
└─ critical for: 01, 07, 08

07-react-native-integration
├─ requires: 02, 03, 06
└─ specialized for: React Native projects

08-best-practices
├─ requires: 03, 06, 07
└─ references: All modules (best practices summary)

09-cicd-integration
├─ requires: 02, 03, 04
└─ implementations: Jenkins, GitHub Actions

10-troubleshooting
├─ requires: All previous modules (for context)
└─ references: Specific issues in all modules

11-mcp-integration
├─ requires: 01, 03, 04, 06 (core concepts and CLI)
└─ enhances: AI-assisted workflows for modules 01-10
```

---

## Best Practices Summary

✅ **DO:**
- Use selectors by visible text or testID (stable & maintainable)
- Let Maestro handle waits automatically
- Organize flows in logical directories by feature
- Use variables for test data and credentials
- Modularize tests with `runFlow` command
- Implement proper CI/CD integration

❌ **DON'T:**
- Use coordinate-based tapping (fragile on layout changes)
- Add manual `sleep` delays (let Maestro wait)
- Hardcode test data in flows (use variables)
- Create monolithic test files (split by feature)
- Ignore XPath patterns (powerful for complex selectors)
- Skip CI/CD automation (parallel execution saves time)

---

## Official Documentation

- **Main Site:** https://maestro.dev
- **Documentation:** https://docs.maestro.dev
- **React Native Guide:** https://maestro.dev/insights/react-native-automation-setup-guide
- **GitHub:** https://github.com/mobile-dev-inc/maestro
- **Community:** https://chat.maestro.dev

---

## Version & Compatibility

- **Maestro Version:** 1.35.0+ (documentation current as of February 2026)
- **Android:** API Level 16+
- **iOS:** 11.0+
- **React Native:** Full support with testID integration
- **Platforms:** Android, iOS, React Native, Web

---

## Content Statistics

| Metric | Value |
|--------|-------|
| **Total Modules** | 11 |
| **Total Words** | 85,000+ |
| **Code Examples** | 107+ |
| **Reference Tables** | 25+ |
| **CLI Commands** | 23+ documented |
| **YAML Commands** | 11+ command types |
| **MCP Tools** | 47+ documented |
| **Setup Guides** | 4 (Claude, Cursor, Windsurf, VS Code) |

---

**Last Updated:** December 27, 2025 | **Status:** Complete | **Format:** Modular LLM-Optimized Architecture
