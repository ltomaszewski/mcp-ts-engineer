# Background Tasks -- Expo Notifications SDK 55

Headless notification processing, background task registration, and `expo-task-manager` integration.

---

## Overview

Headless notifications allow JavaScript code to run when a notification arrives while the app is completely terminated. Requires `expo-task-manager`.

**Use Cases:**
- Sync data in background
- Process important alerts
- Update local database
- Send acknowledgment to server

**Limitations:**
- Maximum 30 seconds to complete
- Cannot show UI or navigate
- Cannot access camera or location
- Task must be defined at module scope (e.g., in `index.ts`)

---

## Installation

```bash
npx expo install expo-task-manager
```

Enable background remote notifications in `app.json` config plugin (iOS):

```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", { "enableBackgroundRemoteNotifications": true }]
    ]
  }
}
```

---

## Background Task Methods

### registerTaskAsync(taskName)

Register a background notification task. The task must be defined with `TaskManager.defineTask()` first.

| Parameter | Type | Description |
|-----------|------|-------------|
| `taskName` | `string` | Task name (must match `defineTask` name) |

**Returns:** `Promise<null>`

---

### unregisterTaskAsync(taskName)

Unregister a background notification task.

| Parameter | Type | Description |
|-----------|------|-------------|
| `taskName` | `string` | Task name to unregister |

**Returns:** `Promise<null>`

---

## BackgroundNotificationResult

Return values from background task to indicate result:

| Value | Name | Description |
|-------|------|-------------|
| 0 | `NoData` | No new data was received |
| 1 | `NewData` | New data was received and processed |

---

## Basic Setup

```typescript
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

// 1. Define task at module scope (must be top-level, not inside component)
TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, ({ data, error }) => {
  if (error) {
    console.error('Background task error:', error);
    return;
  }

  if (!data) {
    console.warn('No notification data received');
    return;
  }

  const notification = data as Notifications.Notification;
  const { title, body, data: payload } = notification.request.content;

  console.log('Background notification:', title, body);
  // Process payload here
});

// 2. Register task (call during app initialization)
async function registerBackgroundTask(): Promise<void> {
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('Background task registered');
  } catch (error) {
    console.error('Failed to register:', error);
  }
}

// 3. Unregister when no longer needed
async function unregisterBackgroundTask(): Promise<void> {
  try {
    await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('Background task unregistered');
  } catch (error) {
    console.error('Failed to unregister:', error);
  }
}
```

---

## Data Sync Example

```typescript
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const SYNC_TASK = 'NOTIFICATION_SYNC_TASK';

TaskManager.defineTask(SYNC_TASK, async ({ data, error }) => {
  if (error || !data) return;

  const notification = data as Notifications.Notification;
  const payload = notification.request.content.data;

  try {
    const type = payload?.type as string;

    switch (type) {
      case 'message':
        await fetch('https://api.example.com/messages/ack', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messageId: payload?.messageId,
            timestamp: new Date().toISOString(),
          }),
        });
        break;

      case 'data_sync':
        const response = await fetch('https://api.example.com/sync');
        const updates = await response.json();
        // Apply updates to local storage
        break;

      default:
        console.log('Unknown notification type:', type);
    }
  } catch (err) {
    console.error('Background sync failed:', err);
  }
});

export async function initBackgroundSync(): Promise<void> {
  await Notifications.registerTaskAsync(SYNC_TASK);
}
```

---

## Error Handling with Timeout

Background tasks are terminated after 30 seconds. Add a safety timeout:

```typescript
TaskManager.defineTask('SAFE_TASK', async ({ data, error }) => {
  if (error || !data) return;

  const processPromise = processNotification(data);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Task timeout')), 28000)
  );

  try {
    await Promise.race([processPromise, timeoutPromise]);
  } catch (err) {
    if ((err as Error).message === 'Task timeout') {
      console.warn('Background task timed out');
    } else {
      console.error('Background task error:', err);
    }
  }
});
```

---

## Checking Task Registration

```typescript
import * as TaskManager from 'expo-task-manager';

async function checkTaskStatus(taskName: string): Promise<boolean> {
  const registered = await TaskManager.isTaskRegisteredAsync(taskName);
  console.log(`Task "${taskName}" registered:`, registered);
  return registered;
}
```

---

## What You CAN Do in Background Tasks

- Make HTTP/fetch API calls
- Read/write to AsyncStorage or MMKV
- Process and transform data
- Send events/acknowledgments to server
- Download small files

## What You CANNOT Do

- Show UI or alerts
- Navigate between screens
- Access camera or location
- Run operations longer than 30 seconds
- Access Expo modules that require UI context

---

## Platform-Specific Notes

### iOS
- Requires `enableBackgroundRemoteNotifications: true` in config plugin
- iOS may throttle background executions
- Silent push notifications (content-available) trigger background task
- Background task must be defined in module scope for execution when app is terminated

### Android
- Background task support is automatic with FCM
- Ensure FCM is properly configured
- Data-only messages (no notification key) trigger background processing
- SDK 55 fixes issue where background tasks were not executing in some cases

---

**Version:** Expo SDK 55 (~55.0.14) | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
