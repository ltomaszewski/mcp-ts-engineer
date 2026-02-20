# Expo Notifications: Core API Methods

> Complete reference for fundamental Expo Notifications API methods including push token retrieval, permission management, badge control, and foreground notification handling.

**Module Purpose**: Token retrieval, permissions, badges, and notification handlers — the essential APIs for any notification implementation.

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Overview

The core API provides the foundational methods needed for:
1. Getting push tokens (Expo or device-specific)
2. Requesting and checking permissions
3. Managing app icon badges
4. Controlling foreground notification behavior

**See also**:
- Setup: [`02-quickstart-setup.md`](02-quickstart-setup.md)
- Scheduling: [`04-api-scheduling.md`](04-api-scheduling.md)
- Listeners: [`05-api-listeners.md`](05-api-listeners.md)

---

## Push Token Methods

### `getExpoPushTokenAsync(options?)`

**Purpose**: Obtain an Expo push token that can be used with Expo Push Service to send notifications.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `options` | `ExpoPushTokenOptions` | No | Configuration object |
| `options.projectId` | `string` | Yes* | Project ID from EAS |

**Return Type**: `Promise<ExpoPushToken>`

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

async function getExpoPushToken() {
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;

    if (!projectId) {
      throw new Error('Project ID not configured');
    }

    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    console.log('Expo Push Token:', tokenData.data);
    return tokenData.data;

  } catch (error) {
    console.error('Failed to get Expo push token:', error);
  }
}

getExpoPushToken().then(token => {
  // Send token to your backend
  fetch('https://your-server.com/register-token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ expoPushToken: token }),
  });
});
```

**Best Practices**:
- Cache the token locally after obtaining it
- Only request new token on failure or when token expires
- Send token to your backend for push notification targeting
- Listen for token changes with `addPushTokenListener()` (see [`05-api-listeners.md`](05-api-listeners.md))

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

### `getDevicePushTokenAsync()`

**Purpose**: Get the native device push token (FCM on Android, APNs on iOS). Used when not relying on Expo Push Service.

**Parameters**: None

**Return Type**: `Promise<DevicePushToken>`

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';

async function getDeviceToken() {
  try {
    const token = await Notifications.getDevicePushTokenAsync();

    console.log('Device Token:', token.data);
    console.log('Platform:', token.type);  // 'ios' or 'android'

    return token;

  } catch (error) {
    console.error('Failed to get device push token:', error);
  }
}
```

**Use Cases**:
- Using custom push service (not Expo)
- Using Firebase Cloud Messaging directly
- Using Apple Push Notification service directly
- Requirement for native token handling

**Best Practices**:
- Use `getExpoPushTokenAsync()` unless you have specific reason not to
- Device tokens are platform-specific and can change
- Always handle errors gracefully

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Permission Management

### `getPermissionsAsync()`

**Purpose**: Check the current notification permissions without prompting the user.

**Parameters**: None

**Return Type**: `Promise<NotificationPermissionsStatus>`

**Returns**:
```typescript
{
  granted: boolean;           // Overall permission status
  ios?: {                     // iOS-specific
    status: 'granted' | 'denied' | 'undetermined';
    allowsAlert: boolean;
    allowsBadge: boolean;
    allowsSound: boolean;
    allowsDisplayInNotificationCenter: boolean;
    allowsDisplayOnLockScreen: boolean;
    allowsCriticalAlerts: boolean;
  };
  android?: {                 // Android-specific
    isPermitted: boolean;
  };
}
```

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';

async function checkPermissions() {
  try {
    const permissions = await Notifications.getPermissionsAsync();

    console.log('Overall granted:', permissions.granted);

    if (permissions.ios) {
      console.log('iOS Status:', permissions.ios.status);
      console.log('Alert allowed:', permissions.ios.allowsAlert);
      console.log('Badge allowed:', permissions.ios.allowsBadge);
      console.log('Sound allowed:', permissions.ios.allowsSound);
    }

    if (permissions.android) {
      console.log('Android permitted:', permissions.android.isPermitted);
    }

    return permissions;
  } catch (error) {
    console.error('Error checking permissions:', error);
  }
}
```

**Best Practices**:
- Check permissions before trying to get tokens
- Don't assume permissions are granted
- Use for conditional UI (show prompt if needed)
- Check on app start and after permission changes

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

### `requestPermissionsAsync(permissions?)`

**Purpose**: Request notification permissions from the user. Shows native permission dialog.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `permissions` | `NotificationPermissionsRequest` | No | Configuration object for iOS |

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';

async function requestNotificationPermissions() {
  try {
    const result = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });

    if (result.granted) {
      console.log('Permissions granted!');
      return true;
    } else {
      console.log('Permissions denied');
      return false;
    }

  } catch (error) {
    console.error('Error requesting permissions:', error);
    return false;
  }
}
```

**iOS Permission Options**:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `allowAlert` | boolean | true | Allow notification alerts |
| `allowBadge` | boolean | true | Allow app icon badge |
| `allowSound` | boolean | true | Allow notification sounds |
| `allowDisplayInNotificationCenter` | boolean | true | Show in notification center |
| `allowDisplayOnLockScreen` | boolean | true | Show on lock screen |
| `allowCriticalAlerts` | boolean | false | Allow critical alerts (don't respect mute) |

**Best Practices**:
- Request permissions after user takes action (not on app start)
- Check current status first with `getPermissionsAsync()`
- Handle permission denial gracefully
- Educate users on why permissions are needed
- Only request permissions you actually use
- On Android 13+, permission is requested automatically on first channel creation

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Badge Management

### `getBadgeCountAsync()`

**Purpose**: Get the current app icon badge count.

**Parameters**: None

**Return Type**: `Promise<number>`

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';

async function getCurrentBadge() {
  try {
    const count = await Notifications.getBadgeCountAsync();
    console.log('Current badge count:', count);
    return count;
  } catch (error) {
    console.error('Error getting badge count:', error);
  }
}
```

**Platform Notes**:
- iOS: Returns accurate badge count
- Android: Always returns 0 (badges not supported natively, must manually manage)

**Best Practices**:
- Cache badge count locally
- Update badge on notification arrival
- Clear badge when user views notifications

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

### `setBadgeCountAsync(badgeCount, options?)`

**Purpose**: Set the app icon badge count. Pass 0 to clear the badge.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `badgeCount` | `number` | Yes | Badge count (0 = clear) |
| `options` | `SetBadgeCountOptions` | No | Platform options |

**Return Type**: `Promise<boolean>` — true if successful, false if not supported

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';

async function updateBadge(count: number) {
  try {
    const success = await Notifications.setBadgeCountAsync(count);

    if (success) {
      console.log(`Badge set to ${count}`);
    } else {
      console.log('Badge setting not supported on this device');
    }

  } catch (error) {
    console.error('Error setting badge:', error);
  }
}

// Usage examples
await updateBadge(5);   // Set to 5
await updateBadge(0);   // Clear badge
```

**Common Pattern - Increment on Notification**:

```typescript
Notifications.addNotificationReceivedListener(async (notification) => {
  const current = await Notifications.getBadgeCountAsync();
  const newCount = (current || 0) + 1;
  await Notifications.setBadgeCountAsync(newCount);
});
```

**Best Practices**:
- Update badge on new notifications
- Clear badge when user opens app
- Don't set excessive numbers (reduces performance)
- Test on both iOS and Android

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Notification Handler Setup

### `setNotificationHandler(handler)`

**Purpose**: Define how the app handles incoming notifications when in the foreground. Controls whether alerts, sounds, and badges show.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `handler` | `NotificationHandler \| null` | Handler object with three callbacks |

**Handler Methods**:

```typescript
{
  handleNotification: async (notification) => {
    // Called when notification arrives
    // Return an object controlling display
    return {
      shouldShowAlert: true;
      shouldPlaySound: true;
      shouldSetBadge: false;
    };
  };

  handleSuccess: (notificationId) => {
    // Called after notification displayed successfully
  };

  handleError: (notificationId, error) => {
    // Called if notification display fails
  };
}
```

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    console.log('Notification received:', notification);

    return {
      shouldShowAlert: true,      // Show system alert
      shouldPlaySound: true,      // Play sound
      shouldSetBadge: false,      // Don't change badge
      shouldShowBanner: true,     // Show as banner (iOS 14+)
      shouldShowList: true,       // Show in notification list
    };
  },

  handleSuccess: (notificationId) => {
    console.log('✅ Notification displayed:', notificationId);
  },

  handleError: (notificationId, error) => {
    console.error('❌ Notification failed:', notificationId, error);
  },
});
```

**Platform-Specific Behavior**:

**iOS**:
- Foreground notifications don't show by default
- Must set `shouldShowAlert: true` in handler
- Returns object controls banner and alert display
- Sound plays only if `shouldPlaySound: true`

**Android**:
- High-priority notifications show as heads-up
- Low-priority notifications appear silently
- Behavior depends on channel importance
- `shouldPlaySound` ignored (use channel settings instead)

**Platform-Specific Example**:

```typescript
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { title, body } = notification.request.content;

    if (Platform.OS === 'ios') {
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
      };
    } else {
      // Android - rely on channel importance
      return {
        shouldShowAlert: true,
        shouldPlaySound: false,  // Sound from channel config
        shouldSetBadge: false,
        shouldShowList: true,
      };
    }
  },
});
```

**Best Practices**:
- Set handler early (before getting tokens)
- Always include error handling
- Use platform-specific logic
- Don't perform heavy operations in handler
- Async operations should complete quickly

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Complete Initialization Example

Complete working example showing all core APIs together:

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import React from 'react';

// 1. Set notification handler early (before app startup)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
  handleSuccess: (id) => {
    console.log('✅ Notification:', id);
  },
  handleError: (id, error) => {
    console.error('❌ Error:', error);
  },
});

// 2. Main initialization function
export async function initializeNotifications() {
  // Check if device supports notifications
  if (!Device.isDevice) {
    console.log('Notifications only work on physical devices');
    return null;
  }

  // Check existing permissions
  const { status: currentStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = currentStatus;

  // Request if not granted
  if (currentStatus !== 'granted') {
    const result = await Notifications.requestPermissionsAsync();
    finalStatus = result.status;
  }

  // Exit if permission denied
  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permission');
    return null;
  }

  // Get project ID
  const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    throw new Error('Project ID not found in app configuration');
  }

  // Get Expo push token
  const expoPushToken = await Notifications.getExpoPushTokenAsync({
    projectId,
  });

  // Get device token (optional)
  const deviceToken = await Notifications.getDevicePushTokenAsync();

  // Set badge count
  await Notifications.setBadgeCountAsync(0);

  return {
    expoPushToken: expoPushToken.data,
    deviceToken: deviceToken.data,
  };
}

// 3. Usage in App component
export default function App() {
  React.useEffect(() => {
    initializeNotifications().then(tokens => {
      if (tokens) {
        console.log('Tokens registered:', tokens);

        // Send to your backend
        fetch('https://your-api.com/register-tokens', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(tokens),
        });
      }
    });
  }, []);

  return (
    // Your app content
  );
}
```

---

## Next Steps

- **Scheduling Notifications**: See [`04-api-scheduling.md`](04-api-scheduling.md)
- **Event Listeners**: See [`05-api-listeners.md`](05-api-listeners.md)
- **Android Channels**: See [`07-api-android-channels.md`](07-api-android-channels.md)
- **Complete Setup**: See [`09-guide-patterns.md`](09-guide-patterns.md)
- **Troubleshooting**: See [`10-troubleshooting.md`](10-troubleshooting.md)

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/
**Last Updated**: December 2025
