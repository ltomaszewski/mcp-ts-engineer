# Notification Handling & Event Listeners

**Module Purpose**: Complete guide to handling incoming notifications, event listeners, and lifecycle management.

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Notification Handler Setup

### `setNotificationHandler(handler)`

**Purpose**: Define app behavior for foreground notifications and success/failure callbacks.

**Code Example - Basic Handler**:

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

---

## Event Listeners

### `addNotificationReceivedListener(listener)`

**Purpose**: Listen for notifications arriving while app is running (foreground or background).

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(notification) => void` | Callback function |

**Return Type**: `EventSubscription` (has `.remove()` method)

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';

export function NotificationListener() {
  useEffect(() => {
    const subscription = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('📬 Notification arrived');
        console.log('Title:', notification.request.content.title);
        console.log('Body:', notification.request.content.body);
        console.log('Data:', notification.request.content.data);
      }
    );
    
    return () => subscription.remove();
  }, []);
  
  return null;
}
```

---

### `addNotificationResponseReceivedListener(listener)`

**Purpose**: Listen for user tapping on notifications.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(response) => void` | Callback with user action |

**Return Type**: `EventSubscription`

**Code Example - Basic Response**:

```typescript
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';

export function NotificationResponseListener() {
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        console.log('👆 User tapped notification');
        const notification = response.notification;
        
        console.log('Notification ID:', notification.request.identifier);
        console.log('Title:', notification.request.content.title);
        console.log('User Action:', response.actionIdentifier);
      }
    );
    
    return () => subscription.remove();
  }, []);
  
  return null;
}
```

---

### `addPushTokenListener(listener)`

**Purpose**: Listen for changes to the device's push token.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(token) => void` | Callback with new token |

**Return Type**: `EventSubscription`

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';

export function PushTokenListener() {
  useEffect(() => {
    const subscription = Notifications.addPushTokenListener((newToken) => {
      console.log('🔑 Push token changed:', newToken.data);
      
      // Send to your backend
      fetch('https://your-api.com/update-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newToken.data }),
      });
    });
    
    return () => subscription.remove();
  }, []);
  
  return null;
}
```

---

## Last Notification Response

### `getLastNotificationResponseAsync()`

**Purpose**: Get the notification that the user tapped to open the app.

**Return Type**: `Promise<NotificationResponse | null>`

**Code Example - Deep Linking**:

```typescript
import * as Notifications from 'expo-notifications';
import React, { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';

export function InitialNotificationHandler() {
  const navigation = useNavigation();
  
  useEffect(() => {
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) {
          console.log('App not opened from notification');
          return;
        }
        
        console.log('App opened from notification');
        const { data, title } = response.notification.request.content;
        
        if (data?.screen) {
          navigation.navigate(data.screen, data.params);
        }
      });
  }, [navigation]);
  
  return null;
}
```

---

## Foreground Notification Behavior

### Platform Differences

**iOS Behavior**:
- Notifications in foreground don't show by default
- Must configure handler to show alerts
- Banner appears if `shouldShowBanner: true`

**Android Behavior**:
- High-priority notifications show heads-up
- Low-priority notifications appear silently
- Behavior depends on channel importance

**Code Example - Platform-Specific Handling**:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const { title, body } = notification.request.content;
    
    if (Platform.OS === 'ios') {
      // Always show on iOS
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
        shouldPlaySound: false,  // Sound from channel
        shouldSetBadge: false,
        shouldShowList: true,
      };
    }
  },
});
```

---

## Complete Notification Setup

```typescript
import * as Notifications from 'expo-notifications';
import React, { useEffect, useRef } from 'react';

export function useNotifications() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  
  useEffect(() => {
    // 1. Set handler
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
    
    // 2. Listen for notifications arriving
    notificationListener.current = 
      Notifications.addNotificationReceivedListener((notification) => {
        console.log('📬 Received:', notification.request.content.title);
      });
    
    // 3. Listen for user interaction
    responseListener.current = 
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log('👆 Tapped:', response.notification.request.content.title);
      });
    
    // 4. Check if app was opened by notification
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        console.log('App opened from notification');
      }
    });
    
    // Cleanup
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
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
      title?: string;
      body?: string;
      sound?: string;
      badge?: number;
      color?: string;
      data?: Record<string, any>;
      categoryIdentifier?: string;
      threadId?: string;
      subtitle?: string;
      priority?: string;
      vibrate?: number[];
      sticky?: boolean;
    };
    trigger: NotificationTrigger | null;
  };
  date: number;
}
```

### Response Interface

```typescript
interface NotificationResponse {
  notification: Notification;
  actionIdentifier: string;
  userText?: string;
}
```

---

## Extracting Data from Notifications

```typescript
import * as Notifications from 'expo-notifications';

export class NotificationExtractor {
  static extractNotificationData(notification: Notification) {
    const content = notification.request.content;
    
    return {
      id: notification.request.identifier,
      title: content.title,
      body: content.body,
      data: content.data,
      timestamp: new Date(notification.date),
      sound: content.sound,
      badge: content.badge,
      color: content.color,
    };
  }
  
  static extractResponseData(response: NotificationResponse) {
    const { notification, actionIdentifier, userText } = response;
    const content = notification.request.content;
    
    return {
      notificationId: notification.request.identifier,
      action: actionIdentifier,
      userReply: userText,
      data: content.data,
      timestamp: new Date(notification.date),
    };
  }
}
```

---

## Common Patterns

### Increment Badge on Notification

```typescript
Notifications.addNotificationReceivedListener(async (notification) => {
  const current = await Notifications.getBadgeCountAsync();
  const newCount = (current || 0) + 1;
  await Notifications.setBadgeCountAsync(newCount);
});
```

### Clear Badge on User Interaction

```typescript
Notifications.addNotificationResponseReceivedListener(async (response) => {
  const current = await Notifications.getBadgeCountAsync();
  if (current > 0) {
    await Notifications.setBadgeCountAsync(current - 1);
  }
});
```

### Log All Notification Lifecycle Events

```typescript
export function setupNotificationLogging() {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('[HANDLER] Processing notification');
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
    handleSuccess: (id) => {
      console.log('[SUCCESS] Displayed:', id);
    },
    handleError: (id, error) => {
      console.log('[ERROR] Failed:', id, error);
    },
  });
  
  Notifications.addNotificationReceivedListener((notif) => {
    console.log('[RECEIVED]', notif.request.content.title);
  });
  
  Notifications.addNotificationResponseReceivedListener((response) => {
    console.log('[RESPONSE]', response.actionIdentifier);
  });
  
  Notifications.addPushTokenListener((token) => {
    console.log('[TOKEN]', token.data);
  });
}
```

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/