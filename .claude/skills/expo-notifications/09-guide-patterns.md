# Implementation Guides & Common Patterns

**Module Purpose**: Step-by-step guides, real-world patterns, and complete code examples for common notification use cases.

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Complete Setup Guide

### Step 1: Install Dependencies

```bash
npx expo install expo-notifications expo-device expo-task-manager expo-constants
```

### Step 2: Configure app.json

```json
{
  "expo": {
    "name": "MyNotificationApp",
    "slug": "my-notification-app",
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification_icon.png",
          "color": "#ffffff",
          "sounds": ["./assets/notification_sound.wav"]
        }
      ]
    ]
  }
}
```

### Step 3: Create Notification Service Module

**File: `src/services/notificationService.ts`**

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

export function setupNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

export async function registerForPushNotifications() {
  if (!Device.isDevice) {
    console.log('Must use physical device for push notifications');
    return null;
  }
  
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    console.log('Failed to get push notification permission');
    return null;
  }
  
  try {
    const projectId = Constants?.expoConfig?.extra?.eas?.projectId;
    if (!projectId) throw new Error('Project ID not found');
    
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (error) {
    console.error('Failed to get Expo push token:', error);
    return null;
  }
}

export async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;
  
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  } catch (error) {
    console.error('Error setting up channels:', error);
  }
}
```

### Step 4: Initialize in App Component

**File: `App.tsx`**

```typescript
import React, { useEffect, useRef } from 'react';
import { View } from 'react-native';
import * as Notifications from 'expo-notifications';
import { 
  setupNotificationHandler, 
  registerForPushNotifications,
  setupAndroidChannels,
} from './src/services/notificationService';

export default function App() {
  const notificationListener = useRef<any>();
  const responseListener = useRef<any>();
  
  useEffect(() => {
    setupNotificationHandler();
    setupAndroidChannels();
    
    registerForPushNotifications().then(token => {
      if (token) {
        console.log('Push token:', token);
      }
    });
    
    notificationListener.current = 
      Notifications.addNotificationReceivedListener(notification => {
        console.log('Notification received:', notification);
      });
    
    responseListener.current = 
      Notifications.addNotificationResponseReceivedListener(response => {
        console.log('User interacted with notification:', response);
      });
    
    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, []);
  
  return (
    <View style={{ flex: 1 }}>
      {/* Your app content */}
    </View>
  );
}
```

---

## Push Token Management

### Token Registration Pattern

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function registerTokenWithBackend(
  expoPushToken: string,
  userId: string
) {
  try {
    await AsyncStorage.setItem('expoPushToken', expoPushToken);
    
    const response = await fetch('https://your-api.com/notifications/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        token: expoPushToken,
        platform: Platform.OS,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to register token');
    }
    
    console.log('Token registered successfully');
  } catch (error) {
    console.error('Error registering token:', error);
  }
}

export function monitorPushTokenChanges(userId: string) {
  const subscription = Notifications.addPushTokenListener((newToken) => {
    console.log('Push token changed:', newToken.data);
    registerTokenWithBackend(newToken.data, userId);
  });
  
  return () => subscription.remove();
}
```

---

## Deep Linking with Notifications

### Navigation Setup

**File: `src/navigation/deepLinking.ts`**

```typescript
import * as Notifications from 'expo-notifications';

export async function handleDeepLinking() {
  const response = await Notifications.getLastNotificationResponseAsync();
  
  if (response?.notification) {
    const url = response.notification.request.content.data?.url;
    if (typeof url === 'string') {
      return url;
    }
  }
  
  return undefined;
}

export function setupDeepLinkingListener(callback: (url: string) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    (response) => {
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string') {
        callback(url);
      }
    }
  );
  
  return () => subscription.remove();
}
```

**File: `App.tsx` (with Expo Router)**

```typescript
import React, { useEffect } from 'react';
import { router } from 'expo-router';
import { handleDeepLinking, setupDeepLinkingListener } from './src/navigation/deepLinking';

export default function App() {
  useEffect(() => {
    handleDeepLinking().then(url => {
      if (url) {
        router.push(url);
      }
    });
    
    const unsubscribe = setupDeepLinkingListener((url) => {
      router.push(url);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    // Your app
  );
}
```

---

## Custom Notification Sounds

### Setting Up Custom Sounds

**Step 1: Add Sound File**

```
assets/
  notification_sound.wav
```

**Step 2: Configure app.json**

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": [
            "./assets/notification_sound.wav"
          ]
        }
      ]
    ]
  }
}
```

**Step 3: Use in Notification**

```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Alert',
    body: 'Custom sound notification',
    sound: 'notification_sound.wav',
  },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 5,
  },
});
```

---

## Reminder Notifications

### Daily Reminder

```typescript
export async function scheduleDailyReminder(
  hour: number = 9,
  minute: number = 0,
  title: string = 'Daily Reminder'
) {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body: 'Remember to check your tasks',
        sound: 'default',
        badge: 1,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        dateComponents: {
          hour,
          minute,
          second: 0,
        },
        repeats: true,
      },
    });
    
    console.log(`Daily reminder scheduled at ${hour}:${minute}`);
    return id;
  } catch (error) {
    console.error('Error scheduling daily reminder:', error);
  }
}

// Usage: Schedule daily at 9 AM
scheduleDailyReminder(9, 0, 'Daily Task Reminder');
```

---

## Badge Management

```typescript
export async function incrementUnreadCount() {
  try {
    const current = await Notifications.getBadgeCountAsync();
    const newCount = (current || 0) + 1;
    
    const success = await Notifications.setBadgeCountAsync(newCount);
    console.log(`Badge updated to ${newCount}:`, success);
  } catch (error) {
    console.error('Error updating badge:', error);
  }
}

export async function clearBadge() {
  try {
    await Notifications.setBadgeCountAsync(0);
    console.log('Badge cleared');
  } catch (error) {
    console.error('Error clearing badge:', error);
  }
}

export function syncBadgeWithNotifications() {
  const subscription = Notifications.addNotificationResponseReceivedListener(
    async (response) => {
      const current = await Notifications.getBadgeCountAsync();
      if (current > 0) {
        await Notifications.setBadgeCountAsync(current - 1);
      }
    }
  );
  
  return () => subscription.remove();
}
```

---

## Error Handling & Retry Logic

```typescript
export class NotificationQueue {
  private queue: Array<{
    notification: any;
    retries: number;
    timestamp: number;
  }> = [];
  
  async scheduleWithRetry(
    notification: any,
    maxRetries: number = 3
  ) {
    try {
      return await Notifications.scheduleNotificationAsync(notification);
    } catch (error) {
      console.error('Error scheduling notification:', error);
      
      if (maxRetries > 0) {
        this.queue.push({
          notification,
          retries: maxRetries - 1,
          timestamp: Date.now(),
        });
        
        setTimeout(() => this.processQueue(), 5000);
      }
    }
  }
  
  private async processQueue() {
    for (const item of this.queue) {
      try {
        await Notifications.scheduleNotificationAsync(item.notification);
        this.queue = this.queue.filter(q => q !== item);
      } catch (error) {
        console.error('Retry failed:', error);
        if (item.retries > 0) {
          item.retries--;
        } else {
          this.queue = this.queue.filter(q => q !== item);
          console.error('Max retries exceeded');
        }
      }
    }
  }
}
```

---

## Permission Checking Utility

```typescript
export class NotificationPermissions {
  static async checkStatus() {
    const status = await Notifications.getPermissionsAsync();
    
    return {
      granted: status.granted,
      ios: status.ios?.status,
      message: this.getStatusMessage(status),
    };
  }
  
  private static getStatusMessage(status: any): string {
    if (!status.granted) {
      return 'Notifications are disabled';
    }
    
    if (status.ios?.status === 'AUTHORIZED') {
      return 'Fully authorized for notifications';
    }
    
    if (status.ios?.status === 'PROVISIONAL') {
      return 'Provisionally authorized (silent)';
    }
    
    return 'Notifications enabled';
  }
  
  static async requestPermissionsIfNeeded(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    
    if (existingStatus === 'granted') {
      return true;
    }
    
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    return newStatus === 'granted';
  }
}
```

---

## Testing Notifications

```typescript
export async function runNotificationTests() {
  console.log('🧪 Running notification tests...\n');
  
  try {
    // Test 1: Schedule immediate notification
    console.log('Test 1: Schedule immediate notification');
    const id1 = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test 1',
        body: 'Immediate notification',
      },
      trigger: null,
    });
    console.log(`✅ Scheduled with ID: ${id1}\n`);
    
    // Test 2: Schedule delayed notification
    console.log('Test 2: Schedule notification in 5 seconds');
    const id2 = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test 2',
        body: 'Delayed notification',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 5,
      },
    });
    console.log(`✅ Scheduled with ID: ${id2}\n`);
    
    // Test 3: List all scheduled
    console.log('Test 3: List all scheduled notifications');
    const all = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`✅ Total scheduled: ${all.length}\n`);
    
    // Test 4: Check badge
    console.log('Test 4: Badge management');
    await Notifications.setBadgeCountAsync(5);
    const badge = await Notifications.getBadgeCountAsync();
    console.log(`✅ Badge count: ${badge}\n`);
    
    // Test 5: Permissions
    console.log('Test 5: Permission check');
    const perms = await Notifications.getPermissionsAsync();
    console.log(`✅ Permissions granted: ${perms.granted}\n`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}
```

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/