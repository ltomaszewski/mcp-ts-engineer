# Event Listeners -- Expo Notifications SDK 54

Notification event listeners, deep linking from notifications, and lifecycle management.

---

## Event Listeners

### addNotificationReceivedListener(listener)

Listen for notifications arriving while the app is running (foreground).

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(notification: Notification) => void` | Callback with notification data |

**Returns:** `EventSubscription` (call `.remove()` to unsubscribe)

```typescript
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export function useNotificationReceived(): void {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        const { title, body, data } = notification.request.content;
        console.log('Received:', title, body);
        console.log('Data:', data);
      }
    );

    return () => subscription.remove();
  }, []);
}
```

---

### addNotificationResponseReceivedListener(listener)

Listen for user tapping on notifications (foreground, background, or cold start).

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(response: NotificationResponse) => void` | Callback with user action |

**Returns:** `EventSubscription`

```typescript
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export function useNotificationResponse(
  onResponse: (data: Record<string, unknown>) => void
): void {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { actionIdentifier, userText } = response;
        const { data } = response.notification.request.content;

        console.log('Action:', actionIdentifier);
        if (userText) console.log('User text:', userText);

        if (data) onResponse(data);
      }
    );

    return () => subscription.remove();
  }, [onResponse]);
}
```

---

### addPushTokenListener(listener)

Listen for changes to the device push token (token rotation).

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(token: { data: string, type: string }) => void` | Callback with new token |

**Returns:** `EventSubscription`

```typescript
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export function usePushTokenListener(
  onTokenChange: (token: string) => void
): void {
  useEffect(() => {
    const subscription = Notifications.addPushTokenListener((newToken) => {
      console.log('Token changed:', newToken.data);
      onTokenChange(newToken.data);
    });

    return () => subscription.remove();
  }, [onTokenChange]);
}
```

---

### addNotificationsDroppedListener(listener)

Listen for when notifications are dropped (e.g., device received too many).

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `() => void` | Callback when notifications dropped |

**Returns:** `EventSubscription`

```typescript
import * as Notifications from 'expo-notifications';

const subscription = Notifications.addNotificationsDroppedListener(() => {
  console.warn('Some notifications were dropped');
});
```

---

## Last Notification Response

### getLastNotificationResponseAsync()

Get the notification response that launched/resumed the app. Use for cold-start deep linking.

**Returns:** `Promise<NotificationResponse | null>`

```typescript
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

export function useInitialNotification(
  navigate: (screen: string, params?: Record<string, unknown>) => void
): void {
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;

      const { data } = response.notification.request.content;
      if (data?.screen && typeof data.screen === 'string') {
        navigate(data.screen, data.params as Record<string, unknown>);
      }
    });
  }, [navigate]);
}
```

---

### clearLastNotificationResponseAsync()

Clear the stored last notification response.

**Returns:** `Promise<void>`

```typescript
await Notifications.clearLastNotificationResponseAsync();
```

---

### useLastNotificationResponse()

React hook that returns the last notification response. Re-renders when a new response arrives.

**Returns:** `NotificationResponse | null | undefined`

```typescript
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export function NotificationHandler(): null {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!lastResponse) return;

    const { data } = lastResponse.notification.request.content;
    if (data?.url && typeof data.url === 'string') {
      router.push(data.url);
    }
  }, [lastResponse, router]);

  return null;
}
```

---

## Notification Object Structure

### Notification Interface

```typescript
interface Notification {
  request: {
    identifier: string;
    content: {
      title: string | null;
      subtitle: string | null;
      body: string | null;
      sound: string | null;
      badge: number | null;
      data: Record<string, unknown>;
      categoryIdentifier: string | null;
    };
    trigger: NotificationTrigger | null;
  };
  date: number; // Unix timestamp
}
```

### NotificationResponse Interface

```typescript
interface NotificationResponse {
  notification: Notification;
  actionIdentifier: string;
  userText?: string;
}
```

The `actionIdentifier` is `Notifications.DEFAULT_ACTION_IDENTIFIER` when user taps the notification itself (not an action button).

---

## Complete Listener Setup

```typescript
import * as Notifications from 'expo-notifications';
import { useEffect, useRef } from 'react';

export function useNotifications(
  onData: (data: Record<string, unknown>) => void
): void {
  const receivedRef = useRef<Notifications.EventSubscription>();
  const responseRef = useRef<Notifications.EventSubscription>();

  useEffect(() => {
    // Listen for incoming notifications
    receivedRef.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Received:', notification.request.content.title);
      }
    );

    // Listen for user taps
    responseRef.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { data } = response.notification.request.content;
        if (data) onData(data);
      }
    );

    // Check if app was opened from notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        const { data } = response.notification.request.content;
        if (data) onData(data);
      }
    });

    return () => {
      receivedRef.current?.remove();
      responseRef.current?.remove();
    };
  }, [onData]);
}
```

---

## Deep Linking Pattern with Expo Router

```typescript
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';
import { useRouter } from 'expo-router';

export function useNotificationDeepLinks(): void {
  const router = useRouter();
  const lastResponse = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!lastResponse) return;

    const url = lastResponse.notification.request.content.data?.url;
    if (typeof url === 'string') {
      router.push(url);
    }
  }, [lastResponse, router]);
}
```

---

## Badge Management with Listeners

```typescript
import * as Notifications from 'expo-notifications';

// Increment badge on notification received
Notifications.addNotificationReceivedListener(async () => {
  const current = await Notifications.getBadgeCountAsync();
  await Notifications.setBadgeCountAsync(current + 1);
});

// Decrement badge on notification tapped
Notifications.addNotificationResponseReceivedListener(async () => {
  const current = await Notifications.getBadgeCountAsync();
  if (current > 0) {
    await Notifications.setBadgeCountAsync(current - 1);
  }
});
```

---

**Version:** SDK 54 | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
