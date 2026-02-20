# Expo Notifications: Modular Knowledge Base

> Client-side push and local notifications for React Native Expo applications with LLM-optimized modular organization.

---

## Quick Overview

Expo Notifications provides a unified API for managing push and local notifications across iOS and Android. This knowledge base is organized into self-contained, independently loadable modules optimized for LLM context management.

**Key Features**:
- Token management (Expo or device-specific)
- Permission handling
- Notification scheduling with multiple trigger types
- Event listeners for user interactions
- Android notification channels
- Background task processing
- Deep linking support

**Installation**:
```bash
npx expo install expo-notifications
```

---

## Module Navigation Guide

| # | Module | Purpose |
|---|--------|---------|
| **00** | [Master Index](00-master-index.md) | Comprehensive navigation hub |
| **01** | [Framework Overview](01-framework-overview.md) | Core concepts and architecture |
| **02** | [Quick Start Setup](02-quickstart-setup.md) | Installation and configuration |
| **03** | [Core API Methods](03-api-core.md) | Tokens, permissions, badges, handlers |
| **04** | [Scheduling & Cancellation](04-api-scheduling.md) | Scheduling, triggers, cancellation |
| **05** | [Event Listeners](05-api-listeners.md) | Handlers, listeners, deep linking |
| **06** | [Interactive Notifications](06-api-interactive.md) | Categories, actions, text input |
| **07** | [Android Channels](07-api-android-channels.md) | Android 8.0+ channel configuration |
| **08** | [Background Tasks](08-api-background.md) | Headless notifications, background processing |
| **09** | [Common Patterns](09-guide-patterns.md) | Complete setup and implementation guides |
| **10** | [Troubleshooting](10-troubleshooting.md) | Issues, debugging, solutions |

---

## Quick Start (5 minutes)

1. **Install**: `npx expo install expo-notifications`
2. **Configure**: Add plugin to `app.json`
3. **Setup**: Request permissions and get token
4. **Listen**: Add event listeners for interactions
5. **Test**: Try local notifications first

See [Quick Start Setup](02-quickstart-setup.md) for detailed instructions.

---

## Common Tasks

### I'm new to Expo Notifications
→ Start with [Framework Overview](01-framework-overview.md) → [Quick Start Setup](02-quickstart-setup.md)

### I need to send notifications
→ Get tokens: [Core API](03-api-core.md) → Schedule: [Scheduling](04-api-scheduling.md)

### Notifications aren't working
→ [Troubleshooting](10-troubleshooting.md) → [Common Patterns](09-guide-patterns.md)

### I need action buttons
→ [Interactive Notifications](06-api-interactive.md)

### Android configuration
→ [Android Channels](07-api-android-channels.md) → [Quick Start](02-quickstart-setup.md#android-setup)

### Background processing
→ [Background Tasks](08-api-background.md)

---

## Module Organization

```
00-master-index.md          ← Start here for comprehensive overview
   ├→ 01-framework-overview.md
   │   └→ 02-quickstart-setup.md
   │       ├→ 03-api-core.md
   │       ├→ 04-api-scheduling.md
   │       ├→ 05-api-listeners.md
   │       ├→ 06-api-interactive.md
   │       ├→ 07-api-android-channels.md
   │       └→ 08-api-background.md
   │
   └→ 09-guide-patterns.md    ← Complete real-world examples
       └→ 10-troubleshooting.md
```

---

## Key Statistics

- **10 modular documents**
- **32+ API methods** documented
- **50+ code examples**
- **150+ solutions** for common scenarios
- **All platforms** covered (iOS + Android)
- **Optimized for LLM** context efficiency

---

## For LLM/RAG Systems

Each module is:
- **Self-contained** — Can be loaded independently
- **Cross-referenced** — Links to related content
- **Token-efficient** — Optimized for context windows
- **Comprehensive** — All information in one place

Use [Master Index](00-master-index.md) to navigate by use case or query intent.

---

## Official References

All content sourced from official Expo documentation:
- https://docs.expo.dev/versions/latest/sdk/notifications/
- https://docs.expo.dev/push-notifications/overview/

---

**Last Updated**: December 2025
**Maintainer**: Modular Knowledge Base
**License**: Based on Official Expo Documentation
