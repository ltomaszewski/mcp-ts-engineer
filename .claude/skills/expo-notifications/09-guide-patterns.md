# Implementation Patterns -- Expo Notifications SDK 54

Complete setup guides, token management, deep linking, and production patterns.

---

## Complete Setup Guide

### Step 1: Install Dependencies

```bash
npx expo install expo-notifications expo-device expo-constants
```

### Step 2: Configure app.json

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

### Step 3: Create Notification Service

```typescript
// src/services/notifications.ts
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// Set handler at module scope
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function setupAndroidChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
  });

  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require physical device');
    return null;
  }

  // Android: create channel before requesting permissions
  await setupAndroidChannels();

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permission denied');
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Project ID not found');

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  return data;
}
```

### Step 4: Initialize in Root Layout

```typescript
// app/_layout.tsx
import { useEffect, useRef } from 'react';
import { Stack } from 'expo-router';
import * as Notifications from 'expo-notifications';
import { registerForPushNotifications } from '../src/services/notifications';

export default function RootLayout() {
  const receivedRef = useRef<Notifications.EventSubscription>();
  const responseRef = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    registerForPushNotifications().then((token) => {
      if (token) {
        console.log('Push token:', token);
        // Send token to your backend
      }
    });

    receivedRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Received:', notification.request.content.title);
      }
    );

    responseRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('Tapped:', response.notification.request.content.title);
      }
    );

    return () => {
      receivedRef.current?.remove();
      responseRef.current?.remove();
    };
  }, []);

  return <Stack />;
}
```

---

## Token Management Pattern

```typescript
import * as Notifications from 'expo-notifications';

export async function registerTokenWithBackend(
  token: string,
  userId: string
): Promise<void> {
  const response = await fetch('https://api.example.com/push-tokens', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      token,
      platform: Platform.OS,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to register token');
  }
}

export function monitorTokenChanges(userId: string): () => void {
  const subscription = Notifications.addPushTokenListener((newToken) => {
    registerTokenWithBackend(newToken.data, userId).catch((err) => {
      console.error('Failed to update token:', err);
    });
  });

  return () => subscription.remove();
}
```

---

## Deep Linking with Expo Router

```typescript
// app/_layout.tsx
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

function NotificationDeepLinkHandler(): null {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!lastResponse) return;

    const url = lastResponse.notification.request.content.data?.url;
    if (typeof url === 'string') {
      router.push(url);
    }
  }, [lastResponse, router]);

  return null;
}
```

---

## Custom Notification Sounds

### Step 1: Add sound file to `assets/`

```
assets/notification-sound.wav
```

### Step 2: Declare in app.json

```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", { "sounds": ["./assets/notification-sound.wav"] }]
    ]
  }
}
```

### Step 3: Use in notification

```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Custom Sound',
    body: 'This uses a custom sound',
    sound: 'notification-sound.wav',
  },
  trigger: null,
});
```

---

## Daily Reminder Pattern

```typescript
import * as Notifications from 'expo-notifications';

export async function scheduleDailyReminder(
  hour: number,
  minute: number,
  title: string,
  body: string
): Promise<string> {
  // Cancel existing daily reminders
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'daily_reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }

  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default',
      data: { type: 'daily_reminder' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour,
      minute,
    },
  });
}

export async function cancelDailyReminder(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notif of scheduled) {
    if (notif.content.data?.type === 'daily_reminder') {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}
```

---

## Badge Management Pattern

```typescript
import * as Notifications from 'expo-notifications';

export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

export function setupBadgeListeners(): () => void {
  const receivedSub = Notifications.addNotificationReceivedListener(
    async () => {
      const current = await Notifications.getBadgeCountAsync();
      await Notifications.setBadgeCountAsync(current + 1);
    }
  );

  const responseSub = Notifications.addNotificationResponseReceivedListener(
    async () => {
      const current = await Notifications.getBadgeCountAsync();
      if (current > 0) {
        await Notifications.setBadgeCountAsync(current - 1);
      }
    }
  );

  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
```

---

## Permission Check Utility

```typescript
import * as Notifications from 'expo-notifications';

export async function getPermissionStatus(): Promise<{
  granted: boolean;
  canAsk: boolean;
}> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    canAsk: canAskAgain,
  };
}

export async function ensurePermissions(): Promise<boolean> {
  const { granted, canAsk } = await getPermissionStatus();

  if (granted) return true;
  if (!canAsk) return false;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}
```

---

## Testing Notifications Locally

```typescript
export async function sendTestNotification(): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Test Notification',
      body: 'This is a test notification',
      data: { test: true },
    },
    trigger: null,
  });
}

export async function sendDelayedTestNotification(
  seconds: number
): Promise<string> {
  return await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Delayed Test',
      body: `This fired after ${seconds} seconds`,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds,
    },
  });
}
```

---

**Version:** SDK 54 | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
