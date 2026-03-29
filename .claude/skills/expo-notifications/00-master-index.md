# Expo Notifications -- Master Index

> Complete navigation hub for the Expo Notifications modular knowledge base. SDK 55.

---

## Module Map

| # | Module | Purpose | Key APIs |
|---|--------|---------|----------|
| 01 | [Framework Overview](01-framework-overview.md) | Architecture, mental model | Concepts only |
| 02 | [Quick Start Setup](02-quickstart-setup.md) | Installation, credentials | app.json config plugin |
| 03 | [Core API](03-api-core.md) | Tokens, permissions, handler | `getExpoPushTokenAsync`, `requestPermissionsAsync`, `setNotificationHandler` |
| 04 | [Scheduling](04-api-scheduling.md) | Triggers, cancellation | `scheduleNotificationAsync`, trigger types |
| 05 | [Listeners](05-api-listeners.md) | Events, deep linking | `addNotificationReceivedListener`, `addNotificationResponseReceivedListener` |
| 06 | [Interactive](06-api-interactive.md) | Categories, actions | `setNotificationCategoryAsync`, `DEFAULT_ACTION_IDENTIFIER` |
| 07 | [Android Channels](07-api-android-channels.md) | Channel config | `setNotificationChannelAsync`, `AndroidImportance` |
| 08 | [Background](08-api-background.md) | Headless tasks | `registerTaskAsync`, `TaskManager.defineTask` |
| 09 | [Patterns](09-guide-patterns.md) | Complete examples | Full setup, token management, deep linking |
| 10 | [Troubleshooting](10-troubleshooting.md) | Debugging | Diagnostic checks, known limitations |

---

## Navigation by Use Case

### "I am new to Expo Notifications"
1. [01-framework-overview.md](01-framework-overview.md) -- Understand core concepts
2. [02-quickstart-setup.md](02-quickstart-setup.md) -- Get set up
3. [09-guide-patterns.md](09-guide-patterns.md) -- Full working example

### "I need to request permissions and get tokens"
- [03-api-core.md](03-api-core.md) -- Permission and token APIs

### "I need to schedule notifications"
- [04-api-scheduling.md](04-api-scheduling.md) -- Trigger types and scheduling

### "I need to handle user taps on notifications"
- [05-api-listeners.md](05-api-listeners.md) -- Listener setup and deep linking

### "I need action buttons on notifications"
- [06-api-interactive.md](06-api-interactive.md) -- Categories and actions

### "I am configuring Android channels"
- [07-api-android-channels.md](07-api-android-channels.md) -- Channel setup

### "I need background processing"
- [08-api-background.md](08-api-background.md) -- Headless tasks

### "I need FCM topic subscriptions (Android)"
- [03-api-core.md](03-api-core.md) -- `subscribeToTopicAsync`, `unsubscribeFromTopicAsync`

### "My notifications are not working"
- [10-troubleshooting.md](10-troubleshooting.md) -- Common issues and debugging

---

## Dependency Graph

```
01-framework-overview (Foundation)
  |-- 02-quickstart-setup (Project Setup)
  |     |-- 03-api-core (Tokens & Permissions)
  |     |-- 04-api-scheduling (Schedule)
  |     |     |-- 07-api-android-channels (Android Channels)
  |     |-- 05-api-listeners (Events)
  |     |-- 06-api-interactive (Actions)
  |     |-- 08-api-background (Background Tasks)
  |
  |-- 09-guide-patterns (Complete Examples)
  |     |-- All above modules
  |     |-- 10-troubleshooting (Debugging)
```

---

## Platform Support Matrix

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| Push Notifications | Yes | Yes | Requires development build |
| Local Notifications | Yes | Yes | Works in Expo Go |
| Notification Channels | No | Yes | Android 8.0+ only |
| Interactive Actions | Yes | Yes | Platform-specific implementation |
| Text Input Actions | Yes | Limited | iOS has full support |
| Background Tasks | Yes | Yes | Requires expo-task-manager |
| Custom Sounds | Yes | Yes | .wav format recommended |
| Notification Light | No | Yes | Android only |
| FCM Topic Subscription | No | Yes | Android only |
| Lockscreen Visibility | No | Yes | Android only |

---

## SDK 55 Changes Summary

| Change | Impact |
|--------|--------|
| Root-level `notification` field removed from app.json | Must use config plugin in plugins array |
| Push in Expo Go (Android) throws error | Must use development build |
| Updated Android Firebase dependency | Bug fixes for background tasks, crashes |
| FCM intent origin validation | Security improvement |
| Custom sound existence validation | Build-time validation |
| New Architecture mandatory | Cannot disable with `newArchEnabled: false` |

---

**Version:** Expo SDK 55 (~55.0.14) | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
