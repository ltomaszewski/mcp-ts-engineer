# Expo Notifications: Modular Knowledge Base

> Client-side push and local notifications for React Native Expo applications. Token management, permission handling, scheduling, event listeners, and background task processing across iOS and Android platforms.

**Framework**: Expo Notifications
**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/
**Version**: SDK 50+
**Last Updated**: December 2025

---

## 📋 Module Navigation

This modular knowledge base is organized into self-contained modules optimized for LLM context windows. Each module is independently retrievable with clear cross-references for broader context.

### Core Foundation

| Module | File | Purpose | Start Here If... |
|--------|------|---------|------------------|
| **Framework Overview** | [`01-framework-overview.md`](01-framework-overview.md) | Core concepts, architecture, mental model | You're new to Expo Notifications |
| **Quick Start Setup** | [`02-quickstart-setup.md`](02-quickstart-setup.md) | Installation, configuration, credentials, permissions | You want to get started quickly |

### API Reference

| Module | File | Purpose | Typical Use Case |
|--------|------|---------|------------------|
| **Core API Methods** | [`03-api-core.md`](03-api-core.md) | Token retrieval, permissions, badge control, handlers | Implementing basic notifications |
| **Scheduling & Cancellation** | [`04-api-scheduling.md`](04-api-scheduling.md) | Scheduling, cancellation, retrieval, trigger timing | Planning time-based notifications |
| **Event Listeners** | [`05-api-listeners.md`](05-api-listeners.md) | Event handlers, listeners, deep linking, lifecycle | Handling user interactions |
| **Interactive Notifications** | [`06-api-interactive.md`](06-api-interactive.md) | Categories, action buttons, text input, responses | Adding user action buttons |
| **Android Channels** | [`07-api-android-channels.md`](07-api-android-channels.md) | Channel creation, importance, sounds, vibration | Configuring Android 8.0+ notifications |
| **Background Tasks** | [`08-api-background.md`](08-api-background.md) | Headless notifications, background processing, sync | Processing notifications when app is closed |

### Implementation Guides

| Module | File | Purpose | Typical Use Case |
|--------|------|---------|------------------|
| **Common Patterns** | [`09-guide-patterns.md`](09-guide-patterns.md) | Complete setup, token management, utilities, testing | Building real-world notification systems |
| **Troubleshooting** | [`10-troubleshooting.md`](10-troubleshooting.md) | Issues, debugging, known limitations, solutions | Debugging notification problems |

---

## 🎯 Quick Navigation by Use Case

### "I'm brand new to Expo Notifications"
1. Read: [`01-framework-overview.md`](01-framework-overview.md) — Understand core concepts
2. Follow: [`02-quickstart-setup.md`](02-quickstart-setup.md) — Get set up
3. Implement: [`09-guide-patterns.md#complete-setup-guide`](09-guide-patterns.md#complete-setup-guide) — Full working example

### "I need to request permissions and get tokens"
→ [`03-api-core.md#permission-management`](03-api-core.md#permission-management) (permissions)
→ [`03-api-core.md#push-token-methods`](03-api-core.md#push-token-methods) (tokens)
→ [`09-guide-patterns.md`](09-guide-patterns.md) (complete setup example)

### "I need to schedule notifications"
→ [`04-api-scheduling.md#scheduling-notifications`](04-api-scheduling.md#scheduling-notifications) (API reference)
→ [`04-api-scheduling.md#trigger-types`](04-api-scheduling.md#trigger-types) (trigger patterns)
→ [`09-guide-patterns.md`](09-guide-patterns.md) (real-world examples)

### "I need to handle user taps on notifications"
→ [`05-api-listeners.md#event-listeners`](05-api-listeners.md#event-listeners) (listener setup)
→ [`05-api-listeners.md#deep-linking`](05-api-listeners.md#deep-linking) (deep linking)
→ [`09-guide-patterns.md`](09-guide-patterns.md) (complete pattern)

### "I need action buttons on notifications"
→ [`06-api-interactive.md`](06-api-interactive.md) (categories and actions)
→ [`06-api-interactive.md#ios-text-input`](06-api-interactive.md#ios-text-input) (text input)

### "I'm on Android and need to configure channels"
→ [`07-api-android-channels.md#creating-channels`](07-api-android-channels.md#creating-channels) (channel setup)
→ [`07-api-android-channels.md#importance-levels`](07-api-android-channels.md#importance-levels) (priority levels)
→ [`07-api-android-channels.md#custom-sounds`](07-api-android-channels.md#custom-sounds) (sounds and vibration)

### "I need background processing while app is closed"
→ [`08-api-background.md`](08-api-background.md) (headless notifications)
→ [`09-guide-patterns.md`](09-guide-patterns.md) (setup example)

### "My notifications aren't working"
→ [`10-troubleshooting.md#common-issues`](10-troubleshooting.md#common-issues) (issues and solutions)
→ [`10-troubleshooting.md#debugging`](10-troubleshooting.md#debugging) (debugging techniques)
→ [`10-troubleshooting.md#testing-checklist`](10-troubleshooting.md#testing-checklist) (verification)

### "I need badge count management"
→ [`03-api-core.md#badge-management`](03-api-core.md#badge-management) (API methods)
→ [`09-guide-patterns.md`](09-guide-patterns.md) (utilities)

---

## 📊 Module Dependency Graph

```
01-framework-overview (Foundation)
  ├→ 02-quickstart-setup (Project Setup)
  │   ├→ 03-api-core (Token & Permissions)
  │   ├→ 04-api-scheduling (Schedule Notifications)
  │   │   └→ 07-api-android-channels (Android Channels)
  │   ├→ 05-api-listeners (Handle Events)
  │   ├→ 06-api-interactive (Action Buttons)
  │   └→ 08-api-background (Background Tasks)
  │
  └→ 09-guide-patterns (Complete Patterns)
      ├→ All above modules
      └→ 10-troubleshooting (Debugging)
```

---

## 📝 Content Schema

Each module follows a consistent structure:

### API Reference Modules (03-08)
- **Description** — What problem does this API solve?
- **Installation** — Required packages (if applicable)
- **Core Methods** — Every method includes:
  - Clear description
  - Parameters table (types, required, description)
  - Return type
  - Complete code example with error handling
  - Direct source URL
- **Best Practices** — Do's & Don'ts
- **Common Patterns** — Real-world usage scenarios

### Framework & Setup Modules (01-02)
- **Overview** — Mental model and key concepts
- **Prerequisites** — What you need before starting
- **Step-by-step Instructions** — Clear sequential steps
- **Configuration** — Full config examples
- **Troubleshooting** — Common setup issues
- **What's Next** — Navigation to next modules

### Guide & Troubleshooting Modules (09-10)
- **Use Case Description** — What problem does this solve?
- **Step-by-step Implementation** — Complete walkthrough
- **Code Examples** — Production-ready patterns
- **Common Gotchas** — What to watch out for
- **Variations** — Alternative approaches

---

## 🔗 Cross-Reference Quick Links

| Concept | Where to Find |
|---------|---------------|
| **Installation** | [`02-quickstart-setup.md#installation`](02-quickstart-setup.md#installation) |
| **App Configuration** | [`02-quickstart-setup.md#app-configuration`](02-quickstart-setup.md#app-configuration) |
| **iOS/Android Setup** | [`02-quickstart-setup.md#ios-setup`](02-quickstart-setup.md#ios-setup), [`02-quickstart-setup.md#android-setup`](02-quickstart-setup.md#android-setup) |
| **Getting Tokens** | [`03-api-core.md#push-token-methods`](03-api-core.md#push-token-methods) |
| **Requesting Permissions** | [`03-api-core.md#permission-management`](03-api-core.md#permission-management) |
| **Setting Badge** | [`03-api-core.md#badge-management`](03-api-core.md#badge-management) |
| **Handler Setup** | [`03-api-core.md#notification-handler-setup`](03-api-core.md#notification-handler-setup) |
| **Scheduling Patterns** | [`04-api-scheduling.md#trigger-types`](04-api-scheduling.md#trigger-types) |
| **Cancellation** | [`04-api-scheduling.md#cancellation-methods`](04-api-scheduling.md#cancellation-methods) |
| **Listeners** | [`05-api-listeners.md#event-listeners`](05-api-listeners.md#event-listeners) |
| **Deep Linking** | [`05-api-listeners.md#deep-linking`](05-api-listeners.md#deep-linking) |
| **Categories & Actions** | [`06-api-interactive.md#notification-categories`](06-api-interactive.md#notification-categories) |
| **Text Input** | [`06-api-interactive.md#ios-text-input`](06-api-interactive.md#ios-text-input) |
| **Android Channels** | [`07-api-android-channels.md#creating-channels`](07-api-android-channels.md#creating-channels) |
| **Importance Levels** | [`07-api-android-channels.md#importance-levels`](07-api-android-channels.md#importance-levels) |
| **Headless Tasks** | [`08-api-background.md#headless-notifications`](08-api-background.md#headless-notifications) |
| **Service Setup** | [`09-guide-patterns.md#complete-setup-guide`](09-guide-patterns.md#complete-setup-guide) |
| **Common Issues** | [`10-troubleshooting.md#common-issues`](10-troubleshooting.md#common-issues) |

---

## ⚙️ Platform Support Matrix

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| Push Notifications | ✅ | ✅ | Requires development build (SDK 53+) |
| Local Notifications | ✅ | ✅ | Works in Expo Go |
| Notification Channels | ❌ | ✅ | Android 8.0+ only |
| Interactive Actions | ✅ | ✅ | Platform-specific implementation |
| Background Tasks | ✅ | ✅ | Requires expo-task-manager |
| Custom Sounds | ✅ | ✅ | .wav recommended |
| Text Input Actions | ✅ | ⚠️ | Limited on Android |
| Notification Light | ❌ | ✅ | Android only |

---

## 📦 Module Statistics

| Module | Purpose | Key Sections |
|--------|---------|--------------|
| 01-framework-overview.md | Core concepts | Architecture, mental model, comparison |
| 02-quickstart-setup.md | Getting started | Install, configure, setup credentials |
| 03-api-core.md | Core API | Token, permissions, badges, handler |
| 04-api-scheduling.md | Scheduling API | Schedule, cancel, retrieve, triggers |
| 05-api-listeners.md | Event handlers | Listeners, deep linking, lifecycle |
| 06-api-interactive.md | User actions | Categories, buttons, text input |
| 07-api-android-channels.md | Android config | Channels, importance, sounds |
| 08-api-background.md | Background work | Headless tasks, sync, processing |
| 09-guide-patterns.md | Real-world guides | Setup, utilities, testing, patterns |
| 10-troubleshooting.md | Problem solving | Issues, debugging, limitations |

---

## 🚀 How to Use This Knowledge Base

### For Development Work
1. **Identify your task** in the Quick Navigation section above
2. **Load the relevant module(s)** — each is self-contained
3. **Use cross-references** to pull additional context as needed
4. **Check troubleshooting** if you hit issues

### For LLM/RAG Integration
1. **Query understanding** → Load 00-master-index.md to understand structure
2. **Context loading** → Load 1-3 specific modules based on tokens available
3. **Deep drilling** → Use cross-references to pull additional modules
4. **Verification** → Every module links to official sources for fact-checking

### For New Team Members
1. Start with [`01-framework-overview.md`](01-framework-overview.md)
2. Follow [`02-quickstart-setup.md`](02-quickstart-setup.md)
3. Explore [`09-guide-patterns.md`](09-guide-patterns.md) for complete examples
4. Use [`10-troubleshooting.md`](10-troubleshooting.md) as reference

---

## 🔐 Security Considerations

Key security practices are documented throughout:
- **Token storage**: [`03-api-core.md`](03-api-core.md) (secure token handling)
- **Deep linking**: [`05-api-listeners.md#deep-linking`](05-api-listeners.md#deep-linking) (validation)
- **Background tasks**: [`08-api-background.md`](08-api-background.md) (data safety)

---

## 📚 Official References

All information sourced directly from official Expo documentation:

- **Main Docs**: https://docs.expo.dev/versions/latest/sdk/notifications/
- **Push Notifications**: https://docs.expo.dev/push-notifications/overview/
- **Push Service**: https://docs.expo.dev/push-notifications/sending-notifications/
- **EAS Build**: https://docs.expo.dev/eas-update/getting-started/

Every code example and API method includes a direct link to official documentation.

---

## 🆘 Getting Help

| Issue | Where to Look |
|-------|---------------|
| **Installation problems** | [`02-quickstart-setup.md#troubleshooting-installation`](02-quickstart-setup.md#troubleshooting-installation) |
| **Configuration errors** | [`02-quickstart-setup.md`](02-quickstart-setup.md) |
| **API issues** | Module for that API (03-08) |
| **Not working** | [`10-troubleshooting.md#common-issues`](10-troubleshooting.md#common-issues) |
| **Platform specific** | [`10-troubleshooting.md#platform-specific`](10-troubleshooting.md#platform-specific) |
| **Debugging** | [`10-troubleshooting.md#debugging`](10-troubleshooting.md#debugging) |

---

## 🔄 Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Dec 2025 | Complete restructuring to modular format |
| Prev | Dec 2024 | Original flat file structure |

---

**Optimized for**: LLM context efficiency, modular loading, Claude Code integration

**Last Updated**: December 2025
**Maintenance**: Keep cross-references updated when modules change
**Contributing**: Maintain consistent format when adding new content
