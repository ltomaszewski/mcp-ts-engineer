# Framework Overview -- Expo Notifications SDK 55

Architecture, mental model, and platform differences for push and local notifications.

---

## Core Mental Model

### Push Notification Flow

```
Backend Server
    | (sends to Expo Push Service)
Expo Push Service
    | (routes to platform services)
APNs (iOS) / FCM (Android)
    | (delivers to device)
Device OS
    | (delivers to app)
Your React Native App
    | (handlers & listeners)
User Interaction
```

### Local Notification Flow

```
Your App
    | (schedules notification)
Device OS Scheduler
    | (waits for trigger)
Trigger Fires (date, interval, calendar, daily, weekly, monthly, yearly)
    | (delivers to notification tray)
Device OS
    | (shows notification)
User Taps
    | (calls response listener)
Your App (handles interaction)
```

---

## Key Concepts

### Push vs. Local Notifications

| Aspect | Push | Local |
|--------|------|-------|
| Origin | Backend server | App itself |
| Requires token | Yes | No |
| Requires backend | Yes | No |
| Works when app killed | Yes | Yes (if scheduled) |
| Targeted to users | Yes | No (device only) |
| Use cases | Messages, alerts, campaigns | Alarms, timers, reminders |

### Two Types of Tokens

**Expo Push Token** (`getExpoPushTokenAsync()`):
- Format: `ExponentPushToken[...]`
- Used with Expo Push Service
- Simplest for development and prototyping
- Subject to Expo rate limits

**Device Push Token** (`getDevicePushTokenAsync()`):
- Native FCM token (Android) or APNs token (iOS)
- Used with custom push services or Firebase
- Platform-specific formats
- More control, higher complexity

### Notification Lifecycle

1. **Creation** -- Scheduled locally or sent from backend
2. **Delivery** -- Device receives notification
3. **Handler** -- `setNotificationHandler()` processes it (foreground only)
4. **Display** -- OS shows banner/alert based on handler return
5. **User Action** -- User taps notification or action button
6. **Response** -- `addNotificationResponseReceivedListener()` fires

### Foreground vs. Background

**Foreground** (app is running):
- iOS: Notifications do not show by default
- Android: High-priority notifications show heads-up
- Use `setNotificationHandler()` to control display
- Both platforms fire listeners immediately

**Background** (app is not running):
- OS delivers notification to notification tray
- User can tap to open app
- `getLastNotificationResponseAsync()` detects cold-start from notification
- Use headless tasks for processing before app opens (requires `expo-task-manager`)

---

## Architecture Layers

```
+---------------------------------------------+
|  Your React Native App                       |
|  - Components, screens, navigation          |
+---------------------------------------------+
               |
+---------------------------------------------+
|  Expo Notifications API                      |
|  - schedule, cancel, listen                  |
|  - handlers for foreground behavior          |
|  - event listeners for user interactions     |
+---------------------------------------------+
               |
+---------------------------------------------+
|  Platform Layer (iOS / Android)              |
|  - iOS: APNs (Apple Push Notification)       |
|  - Android: FCM (Firebase Cloud Messaging)   |
|  - Local notification schedulers             |
+---------------------------------------------+
```

### Components You Interact With

**Core API**:
- `getExpoPushTokenAsync()`, `getDevicePushTokenAsync()` -- Token management
- `requestPermissionsAsync()`, `getPermissionsAsync()` -- Permissions
- `scheduleNotificationAsync()` -- Scheduling
- `cancelScheduledNotificationAsync()`, `cancelAllScheduledNotificationsAsync()` -- Cancellation
- `getAllScheduledNotificationsAsync()` -- Retrieval

**Event System**:
- `setNotificationHandler()` -- Foreground behavior
- `addNotificationReceivedListener()` -- Incoming notifications
- `addNotificationResponseReceivedListener()` -- User taps
- `addPushTokenListener()` -- Token changes
- `addNotificationsDroppedListener()` -- Dropped notifications
- `getLastNotificationResponseAsync()` -- App opened from notification
- `useLastNotificationResponse()` -- React hook for last response

**Presentation**:
- `getPresentedNotificationsAsync()` -- Currently displayed notifications
- `dismissNotificationAsync()` -- Dismiss specific notification
- `dismissAllNotificationsAsync()` -- Dismiss all notifications

**Platform-Specific**:
- `setNotificationChannelAsync()` -- Android channels (Android 8+)
- `setNotificationCategoryAsync()` -- Interactive actions
- `registerTaskAsync()` -- Background headless task processing
- `subscribeToTopicAsync()` -- FCM topic subscription (Android)
- `unsubscribeFromTopicAsync()` -- FCM topic unsubscription (Android)
- `unregisterForNotificationsAsync()` -- Unregister device from notifications

---

## Platform Differences

| Feature | iOS | Android |
|---------|-----|---------|
| Foreground show | No (set in handler) | Yes (by channel importance) |
| Channels | No | Yes (required Android 8+) |
| Text input actions | Yes | Limited |
| Calendar triggers | Full date components | Limited |
| Badge behavior | Automatic via OS | Manual (setBadgeCountAsync) |
| Notification light | No | Yes |
| Custom sounds | Yes (.wav) | Yes (.wav via channel) |
| DND bypass | Critical alerts | bypassDnd channel option |
| Lockscreen visibility | No | Yes (PUBLIC, PRIVATE, SECRET) |
| FCM topic subscription | No | Yes |

### iOS Specifics

- APNs is the only push service
- Requires `.p8` certificate from Apple Developer
- Foreground notifications do not show by default
- No notification channels (categories instead)
- Supports `interruptionLevel`: passive, active, timeSensitive, critical
- Full text input in notification actions
- APNs entitlement set to 'development' in builds; Xcode auto-switches to 'production' for release archives

### Android Specifics

- FCM is the standard push service
- Requires Google Services JSON from Firebase
- Notification channels required on Android 8+ (API 26)
- Users can mute/customize individual channels
- `POST_NOTIFICATIONS` permission required on Android 13+ (API 33)
- Channel must be created before requesting permission on Android 13+
- `SCHEDULE_EXACT_ALARM` permission required for exact-time scheduling (Android 12+)
- Supports FCM topic subscription via `subscribeToTopicAsync()`
- Lockscreen visibility control via `AndroidNotificationVisibility`

---

## Setup Sequence

```
1. Install expo-notifications (+ expo-device, expo-constants)
   |
2. Configure app.json with config plugin (not root notification field)
   |
3. Set up platform credentials (iOS APNs / Android FCM)
   |
4. Call setNotificationHandler() at app startup
   |
5. Create Android channels (before requesting permissions)
   |
6. Request permissions with requestPermissionsAsync()
   |
7. Get tokens with getExpoPushTokenAsync()
   |
8. Register listeners for events
   |
9. Create development build (push notifications require it)
```

---

## Decision Trees

### Which token should I use?

```
Using Expo Push Service?
  YES --> Expo Push Token (simple, managed)
  NO  --> Device Push Token (Firebase or custom service)
```

### Push or local notifications?

```
Have a backend server?
  YES --> Push notifications (targeted, any app state)
  NO  --> Local notifications (scheduled on device)
```

---

## Performance Considerations

- **Token caching**: Cache tokens locally, only re-fetch on failure
- **Listener cleanup**: Remove listeners in useEffect return to prevent memory leaks
- **Scheduling limits**: OS limits usually 64-128 scheduled notifications
- **Background tasks**: Maximum 30 seconds for headless task execution
- **Handler speed**: `handleNotification` must return quickly (3-second timeout)
- **Development builds**: Push notifications do not work in Expo Go on Android (SDK 55 throws error)

---

**Version:** Expo SDK 55 (~55.0.14) | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
