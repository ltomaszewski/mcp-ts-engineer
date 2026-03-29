---
name: expo-notifications
description: Expo push notifications - tokens, scheduling, handlers, permissions. Use when implementing push notifications, local notifications, or notification handling.
---

# Expo Notifications

> Push and local notification implementation for Expo apps with cross-platform support.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Setting up push notification infrastructure
- Registering devices for push tokens
- Scheduling local notifications
- Handling notification tap responses
- Configuring Android notification channels
- Implementing interactive notification actions
- Processing notifications in background
- Subscribing to FCM topics (Android)

---

## Critical Rules

**ALWAYS:**
1. Request permissions before registering for push -- required on iOS, good practice on Android
2. Configure notification handler before any notifications -- ensures foreground display works
3. Use Android channels for Android 8+ -- required for notifications to appear
4. Store push tokens on backend -- needed for server-initiated push delivery
5. Handle both foreground and background notification states -- different code paths required
6. Clean up event listeners in useEffect return -- prevents memory leaks
7. Use the `expo-notifications` config plugin in `app.json` plugins array -- the root-level `notification` field is removed in SDK 55 and throws on prebuild

**NEVER:**
1. Assume permissions are granted -- always check status first
2. Skip notification handler configuration -- foreground notifications will not display
3. Use hardcoded project IDs -- use `Constants.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId`
4. Forget to clean up listeners -- causes memory leaks in useEffect
5. Use `shouldShowAlert` -- deprecated since SDK 54; use `shouldShowBanner` and `shouldShowList` instead
6. Use the root-level `notification` field in app.json -- removed in SDK 55, throws error on prebuild
7. Test push notifications in Expo Go on Android -- throws an error in SDK 55; use a development build

---

## Core Patterns

### Notification Handler Configuration

```typescript
import * as Notifications from 'expo-notifications';

// Configure BEFORE any notifications (typically in _layout.tsx)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

### Push Token Registration

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.warn('Push notifications require physical device');
    return null;
  }

  // Android: create channel before requesting permissions
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) throw new Error('Project ID not found');

  const token = await Notifications.getExpoPushTokenAsync({ projectId });
  return token.data; // "ExponentPushToken[xxxxx]"
}
```

### Notification Listeners in Component

```typescript
import { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';

export function useNotificationListeners() {
  const notificationListener = useRef<Notifications.EventSubscription>();
  const responseListener = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Received:', notification.request.content);
      }
    );

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data;
        // Handle deep linking based on data
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
}
```

### Schedule Local Notification

```typescript
import * as Notifications from 'expo-notifications';

// Schedule for specific time
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Reminder',
    body: 'Time to check in!',
    data: { screen: 'home' },
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(Date.now() + 60 * 1000),
  },
});

// Schedule repeating (daily)
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Daily Reminder',
    body: 'Good morning!',
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: 9,
    minute: 0,
  },
});
```

### Android Channel Setup

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}
```

---

## Anti-Patterns

**BAD** -- Registering without permission check:
```typescript
const token = await Notifications.getExpoPushTokenAsync(); // May fail!
```

**GOOD** -- Always check permissions first:
```typescript
const { status } = await Notifications.requestPermissionsAsync();
if (status === 'granted') {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;
  const token = await Notifications.getExpoPushTokenAsync({ projectId });
}
```

**BAD** -- Using deprecated shouldShowAlert:
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true, // DEPRECATED since SDK 54
  }),
});
```

**GOOD** -- Use shouldShowBanner and shouldShowList:
```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

**BAD** -- Using root-level notification config in app.json (SDK 55):
```json
{
  "expo": {
    "notification": {
      "icon": "./assets/icon.png",
      "color": "#ffffff"
    }
  }
}
```

**GOOD** -- Using the config plugin:
```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#ffffff"
      }]
    ]
  }
}
```

**BAD** -- Not cleaning up listeners:
```typescript
useEffect(() => {
  Notifications.addNotificationReceivedListener(handler);
  // Missing cleanup!
}, []);
```

**GOOD** -- Proper cleanup:
```typescript
useEffect(() => {
  const subscription = Notifications.addNotificationReceivedListener(handler);
  return () => subscription.remove();
}, []);
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Get push token | `getExpoPushTokenAsync()` | `const { data } = await Notifications.getExpoPushTokenAsync({ projectId })` |
| Get device token | `getDevicePushTokenAsync()` | `const { data, type } = await Notifications.getDevicePushTokenAsync()` |
| Request permission | `requestPermissionsAsync()` | `const { status } = await Notifications.requestPermissionsAsync()` |
| Schedule notification | `scheduleNotificationAsync()` | `await Notifications.scheduleNotificationAsync({ content, trigger })` |
| Cancel one scheduled | `cancelScheduledNotificationAsync()` | `await Notifications.cancelScheduledNotificationAsync(id)` |
| Cancel all scheduled | `cancelAllScheduledNotificationsAsync()` | `await Notifications.cancelAllScheduledNotificationsAsync()` |
| Listen to received | `addNotificationReceivedListener()` | `const sub = Notifications.addNotificationReceivedListener(cb)` |
| Listen to response | `addNotificationResponseReceivedListener()` | `const sub = Notifications.addNotificationResponseReceivedListener(cb)` |
| Dismiss notification | `dismissNotificationAsync()` | `await Notifications.dismissNotificationAsync(id)` |
| Set badge count | `setBadgeCountAsync()` | `await Notifications.setBadgeCountAsync(5)` |
| Create Android channel | `setNotificationChannelAsync()` | `await Notifications.setNotificationChannelAsync('id', config)` |
| Set category | `setNotificationCategoryAsync()` | `await Notifications.setNotificationCategoryAsync('id', actions)` |
| Last response hook | `useLastNotificationResponse()` | `const response = Notifications.useLastNotificationResponse()` |
| Subscribe to topic | `subscribeToTopicAsync()` | `await Notifications.subscribeToTopicAsync('news')` |
| Unsubscribe topic | `unsubscribeFromTopicAsync()` | `await Notifications.unsubscribeFromTopicAsync('news')` |
| Unregister device | `unregisterForNotificationsAsync()` | `await Notifications.unregisterForNotificationsAsync()` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Architecture and concepts | [01-framework-overview.md](01-framework-overview.md) |
| Installation and permissions setup | [02-quickstart-setup.md](02-quickstart-setup.md) |
| Push token and handler details | [03-api-core.md](03-api-core.md) |
| Local notification scheduling | [04-api-scheduling.md](04-api-scheduling.md) |
| Notification event listeners | [05-api-listeners.md](05-api-listeners.md) |
| Interactive notifications (actions) | [06-api-interactive.md](06-api-interactive.md) |
| Android channel configuration | [07-api-android-channels.md](07-api-android-channels.md) |
| Background task handlers | [08-api-background.md](08-api-background.md) |
| Server-side push patterns | [09-guide-patterns.md](09-guide-patterns.md) |
| Debugging common issues | [10-troubleshooting.md](10-troubleshooting.md) |

---

**Version:** Expo SDK 55 (~55.0.14) | React Native 0.83.4 | React 19.2.0 | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
