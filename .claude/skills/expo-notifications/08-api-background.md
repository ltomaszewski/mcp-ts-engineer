# Background Tasks & Headless Notifications

**Module Purpose**: Complete guide to background notification processing, headless tasks, and long-running operations.

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Headless Notifications

### What are Headless Notifications?

Headless notifications allow you to run JavaScript code when a notification arrives while your app is completely terminated (not running in background or foreground).

**Use Cases**:
- Sync data in background
- Process important alerts
- Update local database
- Send acknowledgment to server

**Limitations**:
- Maximum 30 seconds to complete
- Must complete before user opens app
- Cannot show UI or navigate

---

## Setting Up Background Task Handler

### `registerTaskAsync(taskName, task)`

**Requires**: `expo-task-manager`

```bash
npx expo install expo-task-manager
```

**Code Example - Register Background Task**:

```typescript
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const BACKGROUND_NOTIFICATION_TASK = 'BACKGROUND_NOTIFICATION_TASK';

TaskManager.defineTask(BACKGROUND_NOTIFICATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Error in background task:', error);
    return;
  }
  
  const notification = data;
  
  console.log('🔔 Headless notification received:');
  console.log('Title:', notification.request.content.title);
  console.log('Body:', notification.request.content.body);
  
  // Do background work here
  try {
    await syncDataWithServer(notification.request.content.data);
    console.log('✅ Background task completed successfully');
  } catch (error) {
    console.error('❌ Background task failed:', error);
  }
});

async function registerBackgroundTask() {
  try {
    await Notifications.registerTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('Background task registered');
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
}

async function unregisterBackgroundTask() {
  try {
    await Notifications.unregisterTaskAsync(BACKGROUND_NOTIFICATION_TASK);
    console.log('Background task unregistered');
  } catch (error) {
    console.error('Failed to unregister background task:', error);
  }
}
```

---

## Background Data Sync Example

```typescript
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const SYNC_TASK = 'SYNC_NOTIFICATIONS_TASK';

TaskManager.defineTask(SYNC_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Task error:', error);
    return;
  }
  
  const notification = data;
  const { type, payload } = notification.request.content.data;
  
  try {
    switch (type) {
      case 'message':
        await syncMessage(payload);
        break;
      case 'order_update':
        await syncOrderUpdate(payload);
        break;
      case 'data_sync':
        await fullDataSync();
        break;
      default:
        console.log('Unknown notification type:', type);
    }
  } catch (error) {
    console.error('Sync failed:', error);
    // Retry later
    await scheduleRetrySync(notification);
  }
});

async function syncMessage(payload: any) {
  const response = await fetch('https://api.example.com/messages/ack', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messageId: payload.messageId,
      timestamp: new Date().toISOString(),
    }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to acknowledge message');
  }
  
  console.log('✅ Message synced');
}

async function syncOrderUpdate(payload: any) {
  // Update local database with order info
  const db = await openDatabase();
  await db.run('UPDATE orders SET status = ? WHERE id = ?', 
    [payload.status, payload.orderId]);
  
  console.log('✅ Order updated locally');
}

async function fullDataSync() {
  const response = await fetch('https://api.example.com/sync');
  const updates = await response.json();
  
  // Process updates
  const db = await openDatabase();
  for (const update of updates) {
    // Apply updates to database
  }
  
  console.log('✅ Full sync completed');
}

async function scheduleRetrySync(notification: any) {
  // Re-schedule for later
  await Notifications.scheduleNotificationAsync({
    content: notification.request.content,
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 60 * 5,
    },
  });
}

async function initializeBackgroundSync() {
  await Notifications.registerTaskAsync(SYNC_TASK);
}
```

---

## Background Download Example

```typescript
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import * as FileSystem from 'expo-file-system';

const DOWNLOAD_TASK = 'BACKGROUND_DOWNLOAD_TASK';

TaskManager.defineTask(DOWNLOAD_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Download task error:', error);
    return;
  }
  
  const { fileUrl, fileName } = data.request.content.data;
  
  try {
    const localPath = `${FileSystem.documentDirectory}${fileName}`;
    
    const downloadResult = await FileSystem.downloadAsync(
      fileUrl,
      localPath
    );
    
    if (downloadResult.status === 200) {
      console.log('✅ File downloaded to:', localPath);
      
      // Send receipt to server
      await fetch('https://api.example.com/download-receipt', {
        method: 'POST',
        body: JSON.stringify({
          fileName,
          localPath,
          timestamp: new Date().toISOString(),
        }),
      });
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
});

async function initializeBackgroundDownload() {
  await Notifications.registerTaskAsync(DOWNLOAD_TASK);
}

async function downloadFileInBackground(fileUrl: string, fileName: string) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Downloading...',
      body: `Starting download of ${fileName}`,
      data: { fileUrl, fileName },
    },
    trigger: null,
  });
}
```

---

## Important Restrictions

### Time Limits

- **Maximum 30 seconds** for background task execution
- Tasks that exceed limit are terminated
- Use `setInterval` to check status, not async/await

### What You CAN Do

- ✅ Make API calls
- ✅ Update local database
- ✅ Download small files
- ✅ Process data
- ✅ Send events to server

### What You CAN'T Do

- ❌ Show UI or alerts
- ❌ Navigate screens
- ❌ Large file operations
- ❌ Long-running operations (>30s)
- ❌ Access camera or location

---

## Checking Task Registration Status

```typescript
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

async function checkBackgroundTaskStatus() {
  try {
    const registered = await TaskManager.isTaskRegisteredAsync(
      BACKGROUND_NOTIFICATION_TASK
    );
    
    console.log('Task registered:', registered);
    
    if (registered) {
      const info = await TaskManager.getTaskInfoAsync(
        BACKGROUND_NOTIFICATION_TASK
      );
      console.log('Task info:', info);
    }
  } catch (error) {
    console.error('Error checking task status:', error);
  }
}
```

---

## Error Handling in Background Tasks

```typescript
const TASK_WITH_ERROR_HANDLING = 'TASK_WITH_ERROR_HANDLING';

TaskManager.defineTask(TASK_WITH_ERROR_HANDLING, async ({ data, error }) => {
  // Handle task manager errors
  if (error) {
    console.error('Task Manager Error:', error);
    return;
  }
  
  // Handle missing data
  if (!data) {
    console.error('No notification data received');
    return;
  }
  
  try {
    const { content } = data.request;
    
    // Validate content
    if (!content.data) {
      console.warn('Notification has no data payload');
      return;
    }
    
    // Process with timeout
    const processPromise = processNotification(content.data);
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Processing timeout')), 28000)
    );
    
    await Promise.race([processPromise, timeoutPromise]);
    
  } catch (error) {
    console.error('Processing error:', error);
    
    if (error.message === 'Processing timeout') {
      // Schedule for retry
      console.log('Task timed out, scheduling retry...');
    }
  }
});
```

---

## Platform-Specific Behavior

### iOS Background Notification Handling

iOS requires `UIBackgroundModes` in app.json:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "enableBackgroundRemoteNotifications": true
        }
      ]
    ]
  }
}
```

### Android Background Notification Handling

Android automatically supports background tasks. Ensure FCM is properly configured.

---

## Complete Initialization

```typescript
import * as Notifications from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';

const BG_NOTIFICATION_TASK = 'BG_NOTIFICATION_TASK';

export async function setupBackgroundNotifications() {
  // Register task handler
  TaskManager.defineTask(BG_NOTIFICATION_TASK, async ({ data, error }) => {
    if (error) {
      console.error('Background task error:', error);
      return;
    }
    
    try {
      const { content } = data.request;
      console.log('Processing background notification:', content.title);
      
      // Your processing logic
      await processBackgroundNotification(content);
      
    } catch (error) {
      console.error('Failed to process background notification:', error);
    }
  });
  
  // Register task
  try {
    await Notifications.registerTaskAsync(BG_NOTIFICATION_TASK);
    console.log('✅ Background notification task registered');
  } catch (error) {
    console.error('Failed to register background task:', error);
  }
}

export async function cleanupBackgroundNotifications() {
  try {
    await Notifications.unregisterTaskAsync(BG_NOTIFICATION_TASK);
    console.log('✅ Background notification task unregistered');
  } catch (error) {
    console.error('Failed to unregister background task:', error);
  }
}

async function processBackgroundNotification(content: any) {
  // Implement your background processing logic
  const { data } = content;
  
  if (data?.type === 'sync') {
    // Perform sync
    const response = await fetch('https://api.example.com/sync');
    const updates = await response.json();
    return updates;
  }
  
  if (data?.type === 'acknowledge') {
    // Send acknowledgment
    await fetch('https://api.example.com/ack', {
      method: 'POST',
      body: JSON.stringify({ id: data.id }),
    });
  }
}

// Call during app startup
setupBackgroundNotifications();
```

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/