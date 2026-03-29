# Core API Methods -- Expo Notifications SDK 55

Token retrieval, permissions, badges, notification handler, presentation management, and topic subscription.

---

## Push Token Methods

### `getExpoPushTokenAsync(options?)`

Get an Expo push token for use with Expo Push Service. Makes requests to Expo servers; can reject due to network issues.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options.projectId` | `string` | Recommended | EAS project ID (defaults to `Constants.expoConfig.extra.eas.projectId`) |
| `options.devicePushToken` | `DevicePushToken` | No | Use specific device token |
| `options.development` | `boolean` | No | iOS: use sandbox APNs |
| `options.applicationId` | `string` | No | Override application ID |
| `options.deviceId` | `string` | No | Override device ID |
| `options.baseUrl` | `string` | No | Custom Expo push service URL |
| `options.url` | `string` | No | Full custom URL |
| `options.type` | `string` | No | Token type |

**Returns:** `Promise<ExpoPushToken>` -- `{ data: string, type: 'expo' }`

```typescript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

async function getExpoPushToken(): Promise<string | undefined> {
  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

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

async function getDeviceToken(): Promise<Notifications.DevicePushToken> {
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
    console.log('Critical alerts:', ios.allowsCriticalAlerts);
  }

  if (android) {
    console.log('Android importance:', android.importance);
  }

  return granted;
}
```

### NotificationPermissionsStatus

| Property | Type | Description |
|----------|------|-------------|
| `granted` | `boolean` | Whether permissions are granted |
| `status` | `PermissionStatus` | `'granted'`, `'denied'`, `'undetermined'` |
| `expires` | `'never' \| number` | Permission expiration |
| `canAskAgain` | `boolean` | Whether user can be re-prompted |
| `ios.status` | `IosAuthorizationStatus` | iOS-specific auth status |
| `ios.allowsAlert` | `boolean \| null` | Alert display allowed |
| `ios.allowsBadge` | `boolean \| null` | Badge display allowed |
| `ios.allowsSound` | `boolean \| null` | Sound playback allowed |
| `ios.allowsCriticalAlerts` | `boolean \| null` | Critical alerts allowed |
| `ios.allowsDisplayInCarPlay` | `boolean \| null` | CarPlay display allowed |
| `ios.allowsDisplayOnLockScreen` | `boolean \| null` | Lock screen display allowed |
| `ios.allowsDisplayInNotificationCenter` | `boolean \| null` | Notification center display |
| `ios.alertStyle` | `IosAlertStyle` | Alert display style |
| `ios.allowsPreviews` | `IosAllowsPreviews \| null` | Preview behavior |
| `ios.providesAppNotificationSettings` | `boolean \| null` | App provides settings UI |
| `android.importance` | `number` | Android importance level |
| `android.interruptionFilter` | `number` | Android interruption filter |

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
| `permissions.ios.allowDisplayInCarPlay` | `boolean` | No | CarPlay display (default: false) |
| `permissions.ios.provideAppNotificationSettings` | `boolean` | No | App provides settings UI |
| `permissions.android` | `object` | No | Empty; all permissions granted by default |

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

iOS returns accurate badge count. Not all Android launchers support badges.

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

Define how the app handles incoming notifications when in the foreground. Must respond within 3 seconds or notification is discarded.

| Parameter | Type | Description |
|-----------|------|-------------|
| `handler` | `NotificationHandler \| null` | Handler object |
| `handler.handleNotification` | `(notification) => Promise<NotificationBehavior>` | Return display behavior |
| `handler.handleSuccess` | `(notificationId: string) => void` | Called after successful display |
| `handler.handleError` | `(notificationId: string, error: NotificationHandlingError) => void` | Called on display failure |

### NotificationBehavior

| Property | Type | Platform | Description |
|----------|------|----------|-------------|
| `shouldShowBanner` | `boolean` | Both | Show as banner notification |
| `shouldShowList` | `boolean` | Both | Show in notification list/center |
| `shouldPlaySound` | `boolean` | Both | Play notification sound |
| `shouldSetBadge` | `boolean` | iOS | Update badge count |
| `priority` | `AndroidNotificationPriority` | Android | Priority override |
| `shouldShowAlert` | `boolean` | Both | **Deprecated** -- use `shouldShowBanner` and `shouldShowList` |

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

---

## Notification Presentation

### `getPresentedNotificationsAsync()`

Get all currently displayed notifications in the notification center. Android 6.0+ required.

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

## Device Registration

### `unregisterForNotificationsAsync()`

Unregister the device from receiving notifications.

**Returns:** `Promise<void>`

```typescript
await Notifications.unregisterForNotificationsAsync();
```

---

## FCM Topic Subscription (Android Only)

### `subscribeToTopicAsync(topic)`

Subscribe to an FCM topic for receiving topic-based push notifications.

| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | `string` | Topic name to subscribe to |

**Returns:** `Promise<null>`

```typescript
await Notifications.subscribeToTopicAsync('news');
await Notifications.subscribeToTopicAsync('promotions');
```

---

### `unsubscribeFromTopicAsync(topic)`

Unsubscribe from an FCM topic.

| Parameter | Type | Description |
|-----------|------|-------------|
| `topic` | `string` | Topic name to unsubscribe from |

**Returns:** `Promise<null>`

```typescript
await Notifications.unsubscribeFromTopicAsync('promotions');
```

---

## NotificationContentInput

Properties for notification content when scheduling:

| Property | Type | Platform | Description |
|----------|------|----------|-------------|
| `title` | `string \| null` | Both | Notification title |
| `subtitle` | `string \| null` | iOS | Subtitle below title |
| `body` | `string \| null` | Both | Notification body text |
| `data` | `Record<string, unknown>` | Both | Custom data payload |
| `badge` | `number` | iOS | Badge count to set |
| `sound` | `boolean \| 'default' \| 'defaultCritical' \| 'defaultRingtone' \| string` | Both | Sound to play |
| `categoryIdentifier` | `string` | Both | Category for interactive actions |
| `color` | `string` | Android | Notification accent color (#AARRGGBB or #RRGGBB) |
| `priority` | `AndroidNotificationPriority` | Android | Priority level |
| `vibrate` | `number[]` | Android | Vibration pattern |
| `sticky` | `boolean` | Android | Cannot be swiped away |
| `autoDismiss` | `boolean` | Android | Auto-dismiss on tap (default: true) |
| `interruptionLevel` | `InterruptionLevel` | iOS | `'passive'`, `'active'`, `'timeSensitive'`, `'critical'` |
| `attachments` | `NotificationContentAttachmentIos[]` | iOS | Media attachments |
| `launchImageName` | `string` | iOS | Launch image name |
| `threadIdentifier` | `string` | iOS | Thread ID for grouping |

---

## Constants

### `DEFAULT_ACTION_IDENTIFIER`

Value: `'expo.modules.notifications.actions.DEFAULT'`

Returned as `actionIdentifier` when the user taps the notification body (not a custom action button).

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
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
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

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants?.easConfig?.projectId;

  if (!projectId) throw new Error('Project ID not found');

  const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
  await Notifications.setBadgeCountAsync(0);

  return data;
}
```

---

## Enums

### IosAuthorizationStatus

| Value | Name | Description |
|-------|------|-------------|
| 0 | `NOT_DETERMINED` | Not yet determined |
| 1 | `DENIED` | Denied by user |
| 2 | `AUTHORIZED` | Authorized |
| 3 | `PROVISIONAL` | Provisional authorization |
| 4 | `EPHEMERAL` | Ephemeral authorization |

### IosAlertStyle

| Value | Name |
|-------|------|
| 0 | `NONE` |
| 1 | `BANNER` |
| 2 | `ALERT` |

### IosAllowsPreviews

| Value | Name |
|-------|------|
| 0 | `ALWAYS` |
| 1 | `WHEN_AUTHENTICATED` |
| 2 | `NEVER` |

### InterruptionLevel (iOS)

| Value | Description |
|-------|-------------|
| `'passive'` | No light/sound |
| `'active'` | Light + sound immediately |
| `'timeSensitive'` | Breaks through system controls |
| `'critical'` | Bypasses mute switch |

### AndroidNotificationPriority

| Value | Name |
|-------|------|
| -2 | `MIN` |
| -1 | `LOW` |
| 0 | `DEFAULT` |
| 1 | `HIGH` |
| 2 | `MAX` |

---

**Version:** Expo SDK 55 (~55.0.14) | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
