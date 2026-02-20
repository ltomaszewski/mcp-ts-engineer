# Expo Notifications: Framework Overview

> A comprehensive understanding of how push and local notifications work in Expo applications. Core concepts, architecture, and the mental model for implementing notifications across iOS and Android.

**Framework**: Expo Notifications
**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/
**SDK Version**: 50+

---

## Overview

Expo Notifications is a client-side library that enables React Native applications to handle push notifications from external services (like Expo Push Service) and schedule local notifications. It provides a unified API that abstracts platform differences between iOS and Android.

**Key Strengths**:
- Unified API for both iOS and Android
- Simple token management
- Flexible scheduling with multiple trigger types
- Event-driven notification handling
- Background task processing
- Built-in support for interactive notifications

---

## Core Mental Model

Understanding notifications requires knowing these key flows:

### 1. Push Notification Flow

```
External Service (Backend)
    ↓ (sends notification to Expo Push Service)
Expo Push Service
    ↓ (routes to platform services)
iOS (APNs) / Android (FCM)
    ↓ (sends to device)
Device OS
    ↓ (delivers to app if running)
Your React Native App
    ↓ (handled by handlers & listeners)
User Interaction
```

### 2. Local Notification Flow

```
Your App
    ↓ (schedules notification)
Device OS Scheduler
    ↓ (waits for trigger time)
Trigger Fires (date, interval, or calendar)
    ↓ (delivers to notification tray)
Device OS
    ↓ (shows in notification center)
User (taps notification)
    ↓ (calls response listener)
Your App (handles interaction)
```

---

## Key Concepts

### Push vs. Local Notifications

**Push Notifications**:
- Sent from a backend server
- Requires valid push token
- Reach users regardless of app state
- Can be targeted to specific users/devices
- Used for: Messages, alerts, campaigns, reminders

**Local Notifications**:
- Scheduled by the app itself
- Don't require tokens or backend
- Only work on the device that scheduled them
- Used for: Alarms, timers, offline reminders, local events

### Two Types of Tokens

**Expo Push Token** (`getExpoPushTokenAsync()`):
- Used with Expo Push Service
- Format: `ExponentPushToken[...]`
- Allows sending notifications via Expo infrastructure
- Simplest for development and prototyping
- Subject to Expo's rate limits and quotas

**Device Push Token** (`getDevicePushTokenAsync()`):
- Native FCM token (Android) or APNs token (iOS)
- Used for custom push services or Firebase
- Platform-specific formats
- More control but higher complexity

### Notification Lifecycle

Every notification goes through these states:

1. **Creation** — Scheduled or sent from backend
2. **Delivery** — Device receives notification
3. **Handler** — `setNotificationHandler()` processes it
4. **Display** — OS shows alert/banner (based on handler return)
5. **User Action** — User taps notification (or not)
6. **Response** — `addNotificationResponseReceivedListener()` fires

### Foreground vs. Background

**Foreground Behavior** (app is running):
- iOS: Notifications don't show by default
- Android: High-priority notifications show heads-up
- Use `setNotificationHandler()` to control display
- Both platforms fire listeners immediately

**Background Behavior** (app is not running):
- OS delivers notification to notification tray
- User can tap to open app
- `getLastNotificationResponseAsync()` detects this
- Use headless tasks for processing before app opens

---

## Architecture Overview

### Three Integration Layers

```
┌─────────────────────────────────────────────┐
│  Your React Native App                       │
│  - Components, screens, navigation          │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│  Expo Notifications API                      │
│  - Methods: schedule, cancel, listen        │
│  - Handlers for foreground behavior         │
│  - Event listeners for user interactions    │
└──────────────┬──────────────────────────────┘
               │
┌──────────────┴──────────────────────────────┐
│  Platform Layer (iOS/Android)                │
│  - iOS: APNs (Apple Push Notification)      │
│  - Android: FCM (Firebase Cloud Messaging)  │
│  - Local notification schedulers            │
└─────────────────────────────────────────────┘
```

### Components You Interact With

**Core API Functions**:
- **Token Management**: `getExpoPushTokenAsync()`, `getDevicePushTokenAsync()`
- **Permissions**: `requestPermissionsAsync()`, `getPermissionsAsync()`
- **Scheduling**: `scheduleNotificationAsync()`
- **Cancellation**: `cancelScheduledNotificationAsync()`, `cancelAllScheduledNotificationsAsync()`
- **Retrieval**: `getAllScheduledNotificationsAsync()`

**Event System**:
- **Handlers**: `setNotificationHandler()` — foreground behavior
- **Listeners**: `addNotificationReceivedListener()` — incoming notifications
- **Responses**: `addNotificationResponseReceivedListener()` — user taps
- **Tokens**: `addPushTokenListener()` — token changes
- **Last Response**: `getLastNotificationResponseAsync()` — app opened from notification

**Platform-Specific**:
- **Android**: `setNotificationChannelAsync()` — organize notifications
- **Background**: `registerTaskAsync()` — headless notification processing

---

## Configuration & Setup

### Prerequisites

1. **Expo Project** — Must use managed Expo workflow
2. **EAS Account** — Free account at eas.json
3. **Credentials** — APNs certificate (iOS) or FCM key (Android)
4. **Physical Device** — Push notifications require real device

### Setup Sequence

```
1. Install expo-notifications package
   ↓
2. Configure app.json with plugin settings
   ↓
3. Set up platform credentials (iOS/Android)
   ↓
4. Call getPermissionsAsync() & requestPermissionsAsync()
   ↓
5. Set notification handler with setNotificationHandler()
   ↓
6. Get tokens with getExpoPushTokenAsync()
   ↓
7. Register listeners (optional)
   ↓
8. Create development or EAS build
```

---

## Decision Trees

### Should I use push or local notifications?

```
Do I have a backend?
├─ YES → Push notifications
│         (user needs to opt-in, can be targeted)
│
└─ NO → Local notifications
        (schedule in app, no backend needed)
```

### Which token should I use?

```
Using Expo Push Service?
├─ YES → Expo Push Token (simple, managed)
│
└─ NO → Use Device Token
        (for Firebase or custom service)
```

### How should I handle notifications?

```
App is in foreground?
├─ YES → Use setNotificationHandler()
│         (control alert/sound/badge)
│
└─ NO → Use listeners
        (addNotificationReceivedListener)
        (addNotificationResponseReceivedListener)
```

---

## Development vs. Production

### Development

- **Token**: Expo Push Token (easiest)
- **Setup**: Simple credentials
- **Building**: Development build with `prebuild --clean`
- **Testing**: Use local notifications for quick iteration
- **Devices**: Simulators (local only), physical device (push required)

### Production

- **Token**: Device Token or Expo Token (based on backend)
- **Setup**: Production APNs/FCM credentials
- **Building**: EAS Build for managed workflow
- **Testing**: TestFlight (iOS) or internal testing (Android)
- **Monitoring**: Log token changes and registration failures

---

## Platform Differences

### iOS Specifics

- APNs is the only push service
- Requires `.p8` certificate from Apple Developer
- Foreground notifications don't show by default
- No notification channels (but categories work)
- Supports text input in notification actions
- Calendar triggers with more flexible date components

### Android Specifics

- FCM is the standard push service
- Requires Google Services JSON from Firebase
- High-priority notifications show as heads-up
- **Requires notification channels** (Android 8+)
- Users can disable by channel
- Limited action text input
- TIME_INTERVAL triggers work well

### Behavior Differences

| Feature | iOS | Android |
|---------|-----|---------|
| Foreground show | No (set in handler) | Yes (by importance) |
| Channels | No | Yes (required) |
| Text actions | Yes | No |
| Calendar triggers | Full control | Limited |
| Badge behavior | Automatic | Manual (set badge) |

---

## Common Patterns

### Pattern 1: Basic Setup (Most Apps)

```
1. Install packages → 2. Configure app.json → 3. Setup handler →
4. Request permissions → 5. Get token → 6. Send to backend →
7. Listen for taps
```

### Pattern 2: Local Notification Scheduler

```
1. Create notification content → 2. Set trigger → 3. Schedule →
4. Handle response when user taps
```

### Pattern 3: Token Rotation (Production)

```
1. Get initial token → 2. Register on backend → 3. Listen for changes →
4. Send updated token to backend on change
```

### Pattern 4: Deep Linking

```
1. Listen for last notification response → 2. Extract data.screen →
3. Navigate to that screen with params
```

---

## Performance Considerations

### Token Operations
- **Caching**: Cache tokens locally, only re-fetch on failure
- **Listeners**: Remove listeners in cleanup to prevent memory leaks
- **Subscriptions**: Use `useEffect` return function to unsubscribe

### Scheduling Large Numbers
- **Batch Operations**: Schedule many at once vs. one-by-one
- **Cleanup**: Cancel old notifications before scheduling new ones
- **Limits**: OS has limits (usually 64-128 scheduled notifications)

### Background Tasks
- **Time Limit**: 30 seconds maximum for headless tasks
- **Battery**: Avoid heavy processing in background
- **Rate Limiting**: Don't fire too frequently

---

## Security Considerations

### Tokens
- Don't hardcode tokens in client
- Rotate tokens regularly
- Delete tokens when user logs out
- Store securely on backend (encrypted)

### Data in Notifications
- Don't send sensitive data in notification bodies
- Sensitive info goes in encrypted payload
- Validate notification source on client

### Deep Linking
- Validate deep link URLs before navigation
- Prevent arbitrary navigation attacks
- Sanitize any data from notifications

---

## Best Practices Summary

✅ **DO**:
- Test on physical devices (not simulators)
- Handle permission denials gracefully
- Cache tokens locally
- Remove listeners when no longer needed
- Use notification handlers for foreground behavior
- Validate deep links from notifications
- Test on both iOS and Android

❌ **DON'T**:
- Try push notifications on simulators
- Ignore permission requests
- Spam users with too many notifications
- Send sensitive data in notification bodies
- Assume all notifications will be delivered
- Use global listeners without cleanup
- Send notifications without user consent

---

## Next Steps

1. **Getting Started**: Continue to [`02-quickstart-setup.md`](02-quickstart-setup.md)
2. **API Reference**: Jump to specific modules (03-08) for detailed API
3. **Implementation**: See [`09-guide-patterns.md`](09-guide-patterns.md) for complete examples
4. **Troubleshooting**: Use [`10-troubleshooting.md`](10-troubleshooting.md) if issues arise

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/
**Last Updated**: December 2025
