# Core API Methods -- Expo Notifications SDK 54

Token retrieval, permissions, badges, notification handler, and presentation management.

---

## Push Token Methods

### `getExpoPushTokenAsync(options?)`

Get an Expo push token for use with Expo Push Service.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options.projectId` | `string` | Yes | EAS project ID |
| `options.devicePushToken` | `DevicePushToken` | No | Use specific device token |
| `options.development` | `boolean` | No | iOS: use sandbox APNs |
| `options.applicationId` | `string` | No | Override application ID |
| `options.baseUrl` | `string` | No | Custom Expo push service URL |

**Returns:** `Promise<ExpoPushToken>` -- `{ data: string, type: 'expo' }`

```typescript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

async function getExpoPushToken(): Promise<string | undefined> {
  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    throw new Error('Project ID not configured');
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenData.data; // "ExponentPushToken[xxxxx]"
}
```

---

### `getDevicePushTokenAsync()`

Get the native device push token (FCM on Android, APNs on iOS).

**Parameters:** None

**Returns:** `Promise<DevicePushToken>` -- `{ data: string, type: 'ios' | 'android' }`

```typescript
import * as Notifications from 'expo-notifications';

async function getDeviceToken(): Promise<DevicePushToken> {
  const token = await Notifications.getDevicePushTokenAsync();
  console.log('Platform:', token.type); // 'ios' or 'android'
  console.log('Token:', token.data);
  return token;
}
```

Use `getExpoPushTokenAsync()` unless you need direct FCM/APNs access.

---

## Permission Management

### `getPermissionsAsync()`

Check current notification permissions without prompting the user.

**Parameters:** None

**Returns:** `Promise<NotificationPermissionsStatus>`

```typescript
import * as Notifications from 'expo-notifications';

async function checkPermissions(): Promise<boolean> {
  const { granted, ios, android } = await Notifications.getPermissionsAsync();

  if (ios) {
    console.log('iOS status:', ios.status);
    console.log('Alerts:', ios.allowsAlert);
    console.log('Badges:', ios.allowsBadge);
    console.log('Sounds:', ios.allowsSound);
  }

  return granted;
}
```

---

### `requestPermissionsAsync(permissions?)`

Request notification permissions. Shows native permission dialog.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `permissions.ios.allowAlert` | `boolean` | No | Allow alerts (default: true) |
| `permissions.ios.allowBadge` | `boolean` | No | Allow badges (default: true) |
| `permissions.ios.allowSound` | `boolean` | No | Allow sounds (default: true) |
| `permissions.ios.allowCriticalAlerts` | `boolean` | No | Critical alerts (default: false) |
| `permissions.ios.allowProvisional` | `boolean` | No | Provisional auth (default: false) |

**Returns:** `Promise<NotificationPermissionsStatus>`

```typescript
import * as Notifications from 'expo-notifications';

async function requestPermissions(): Promise<boolean> {
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });

  return status === 'granted';
}
```

On Android 13+, permission is requested automatically when first channel is created.

---

## Badge Management

### `getBadgeCountAsync()`

Get current app icon badge count.

**Returns:** `Promise<number>`

```typescript
const count = await Notifications.getBadgeCountAsync();
```

iOS returns accurate badge count. Android always returns 0 (badges not natively supported).

---

### `setBadgeCountAsync(badgeCount, options?)`

Set app icon badge count. Pass 0 to clear.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `badgeCount` | `number` | Yes | Badge count (0 = clear) |
| `options` | `SetBadgeCountOptions` | No | Platform options |

**Returns:** `Promise<boolean>` -- true if successful

```typescript
await Notifications.setBadgeCountAsync(5);  // Set to 5
await Notifications.setBadgeCountAsync(0);  // Clear badge
```

---

## Notification Handler

### `setNotificationHandler(handler)`

Define how the app handles incoming notifications when in the foreground.

| Parameter | Type | Description |
|-----------|------|-------------|
| `handler` | `NotificationHandler \| null` | Handler object |
| `handler.handleNotification` | `(notification) => Promise<NotificationBehavior>` | Return display behavior |
| `handler.handleSuccess` | `(notificationId: string) => void` | Called after successful display |
| `handler.handleError` | `(notificationId: string, error: Error) => void` | Called on display failure |

### NotificationBehavior

| Property | Type | Description |
|----------|------|-------------|
| `shouldShowBanner` | `boolean` | Show as banner notification |
| `shouldShowList` | `boolean` | Show in notification list/center |
| `shouldPlaySound` | `boolean` | Play notification sound |
| `shouldSetBadge` | `boolean` | Update badge count (iOS) |
| `priority` | `AndroidNotificationPriority` | Android priority override |

```typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
  handleSuccess: (notificationId) => {
    console.log('Notification displayed:', notificationId);
  },
  handleError: (notificationId, error) => {
    console.error('Notification failed:', notificationId, error);
  },
});
```

**Important:** `shouldShowAlert` is deprecated in SDK 54. Use `shouldShowBanner` and `shouldShowList` instead.

---

## Notification Presentation

### `getPresentedNotificationsAsync()`

Get all currently displayed notifications in the notification center.

**Returns:** `Promise<Notification[]>`

```typescript
const presented = await Notifications.getPresentedNotificationsAsync();
console.log('Currently displayed:', presented.length);
```

---

### `dismissNotificationAsync(identifier)`

Dismiss a specific notification from the notification center.

| Parameter | Type | Description |
|-----------|------|-------------|
| `identifier` | `string` | Notification identifier |

**Returns:** `Promise<void>`

```typescript
await Notifications.dismissNotificationAsync(notificationId);
```

---

### `dismissAllNotificationsAsync()`

Dismiss all notifications from the notification center.

**Returns:** `Promise<void>`

```typescript
await Notifications.dismissAllNotificationsAsync();
```

---

## NotificationContentInput

Properties for notification content when scheduling:

| Property | Type | Platform | Description |
|----------|------|----------|-------------|
| `title` | `string` | Both | Notification title |
| `subtitle` | `string` | iOS | Subtitle below title |
| `body` | `string` | Both | Notification body text |
| `data` | `Record<string, unknown>` | Both | Custom data payload |
| `badge` | `number` | iOS | Badge count to set |
| `sound` | `boolean \| string` | Both | Sound to play (`'default'`, filename, or boolean) |
| `categoryIdentifier` | `string` | Both | Category for interactive actions |
| `color` | `string` | Android | Notification accent color |
| `priority` | `AndroidNotificationPriority` | Android | Priority level |
| `vibrate` | `number[]` | Android | Vibration pattern |
| `sticky` | `boolean` | Android | Cannot be swiped away |
| `autoDismiss` | `boolean` | Android | Auto-dismiss on tap |
| `interruptionLevel` | `string` | iOS | `'passive'`, `'active'`, `'timeSensitive'`, `'critical'` |
| `attachments` | `NotificationContentAttachmentIos[]` | iOS | Media attachments |
| `threadIdentifier` | `string` | iOS | Thread ID for grouping |

---

## Complete Initialization Example

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

// 1. Set handler at module scope (before app renders)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 2. Initialization function
export async function initializeNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications require physical device');
    return null;
  }

  // Android: create channel before requesting permissions
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) throw new Error('Project ID not found');

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  await Notifications.setBadgeCountAsync(0);

  return data;
}
```

---

**Version:** SDK 54 | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
