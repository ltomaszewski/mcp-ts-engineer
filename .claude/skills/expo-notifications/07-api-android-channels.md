# Android Notification Channels

**Module Purpose**: Complete guide to Android 8.0+ notification channels including creation, configuration, and management.

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Understanding Notification Channels

### What are Notification Channels?

Notification channels are a requirement on Android 8.0 (API level 26) and higher. They allow apps to organize notifications and let users control notification settings with granular control.

**Key Points**:
- Each channel has independent settings
- Users can mute/customize individual channels
- Channels cannot be modified after creation
- Each notification belongs to exactly one channel

---

## Creating Notification Channels

### `setNotificationChannelAsync(channelId, channel)`

**Purpose**: Create or update a notification channel (Android 8.0+).

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `channelId` | `string` | Unique channel identifier |
| `channel` | `NotificationChannelInput` | Channel configuration |

**NotificationChannelInput Properties**:

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `name` | `string` | Yes | Display name (shown to users) |
| `importance` | `AndroidImportance` | No | Priority level (default: DEFAULT) |
| `sound` | `string \| null` | No | Sound file name |
| `vibrationPattern` | `number[]` | No | Vibration pattern in milliseconds |
| `lightColor` | `string` | No | Notification light color (hex) |
| `bypassDnd` | `boolean` | No | Bypass Do Not Disturb |
| `enableLights` | `boolean` | No | Show notification light |
| `enableVibration` | `boolean` | No | Vibrate on notification |

**Code Example - Basic Channel**:

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

async function createBasicChannel() {
  if (Platform.OS !== 'android') return;
  
  try {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default Notifications',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
    
    console.log('Default channel created');
  } catch (error) {
    console.error('Error creating channel:', error);
  }
}
```

---

## Importance Levels

The `AndroidImportance` enum determines how prominent notifications are:

| Level | Value | Behavior |
|-------|-------|----------|
| `MIN` | 1 | No sound/vibration, doesn't appear in status bar |
| `LOW` | 2 | No sound/vibration, appears in status bar |
| `DEFAULT` | 3 | Shows sound/vibration (default) |
| `HIGH` | 4 | Shows heads-up notification |
| `MAX` | 5 | Urgent, full-screen notification |

**Code Example - Different Importance Levels**:

```typescript
import * as Notifications from 'expo-notifications';

async function createChannelsWithDifferentImportance() {
  if (Platform.OS !== 'android') return;
  
  // Alerts - High priority
  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'Alerts & Warnings',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibration: true,
    vibrationPattern: [0, 250, 250, 250, 250, 250],
  });
  
  // Messages - High priority
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    enableVibration: true,
  });
  
  // Updates - Low priority
  await Notifications.setNotificationChannelAsync('updates', {
    name: 'App Updates',
    importance: Notifications.AndroidImportance.LOW,
  });
  
  // Background Tasks - Minimal
  await Notifications.setNotificationChannelAsync('background', {
    name: 'Background Services',
    importance: Notifications.AndroidImportance.MIN,
  });
}
```

---

## Advanced Channel Configuration

### Custom Sounds

```typescript
async function createChannelWithCustomSound() {
  if (Platform.OS !== 'android') return;
  
  await Notifications.setNotificationChannelAsync('notification', {
    name: 'Custom Sound Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'notification_sound',  // .wav file in assets without extension
    enableVibration: true,
    vibrationPattern: [0, 250, 250, 250],
  });
}
```

**Note**: Add sound to `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": ["./assets/notification_sound.wav"]
        }
      ]
    ]
  }
}
```

---

### Vibration Patterns

Vibration patterns are arrays of milliseconds: `[delay, vibrate, pause, vibrate, ...]`

**Common Patterns**:

```typescript
// Single short vibration
vibrationPattern: [0, 100]

// Double tap
vibrationPattern: [0, 100, 100, 100]

// Triple tap
vibrationPattern: [0, 250, 250, 250, 250, 250]

// Long buzz
vibrationPattern: [0, 500]

// SOS pattern
vibrationPattern: [0, 100, 100, 100, 100, 100, 500, 500, 100]
```

**Code Example**:

```typescript
async function createChannelWithVibration() {
  await Notifications.setNotificationChannelAsync('vibration', {
    name: 'Vibrating Alerts',
    importance: Notifications.AndroidImportance.HIGH,
    enableVibration: true,
    vibrationPattern: [0, 250, 250, 250, 250, 250],
  });
}
```

---

### Light Color

```typescript
async function createChannelWithLighting() {
  await Notifications.setNotificationChannelAsync('lights', {
    name: 'LED Notifications',
    importance: Notifications.AndroidImportance.HIGH,
    enableLights: true,
    lightColor: '#FF0000',  // Red
    enableVibration: true,
  });
}
```

---

## Notification Channel Groups

Group related channels for easier organization (Android 11+).

### `setNotificationChannelGroupAsync(groupId, group)`

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';

async function setupChannelGroups() {
  if (Platform.OS !== 'android') return;
  
  // Create group
  await Notifications.setNotificationChannelGroupAsync('communication', {
    name: 'Communication',
  });
  
  // Add channels to group (set groupId in channel)
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
  });
}
```

---

## Retrieving Channel Information

### `getNotificationChannelsAsync()`

**Purpose**: Fetch all notification channels created by the app.

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';

async function listAllChannels() {
  if (Platform.OS !== 'android') return;
  
  try {
    const channels = await Notifications.getNotificationChannelsAsync();
    
    console.log(`Total channels: ${channels?.length || 0}`);
    
    channels?.forEach((channel, index) => {
      console.log(`\n[${index + 1}] ${channel.name}`);
      console.log(`  ID: ${channel.id}`);
      console.log(`  Importance: ${channel.importance}`);
    });
    
  } catch (error) {
    console.error('Error fetching channels:', error);
  }
}
```

---

## Do Not Disturb (DND) Bypass

```typescript
async function createUrgentChannel() {
  await Notifications.setNotificationChannelAsync('emergency', {
    name: 'Emergency Alerts',
    importance: Notifications.AndroidImportance.MAX,
    bypassDnd: true,  // Bypasses Do Not Disturb
    enableVibration: true,
    vibrationPattern: [0, 250, 250, 250],
  });
}
```

---

## Complete Channel Setup

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;
  
  // Default channel
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default Notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
  
  // Urgent alerts
  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'Urgent Alerts',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    enableVibration: true,
    vibrationPattern: [0, 250, 250, 250, 250, 250],
    bypassDnd: true,
  });
  
  // Messages
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages & Chat',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    lightColor: '#0084FF',
  });
  
  // Reminders
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });
  
  // Background
  await Notifications.setNotificationChannelAsync('background', {
    name: 'Background Services',
    importance: Notifications.AndroidImportance.MIN,
  });
}

// Call during app initialization
export function initializeNotificationsAndroid() {
  setupAndroidChannels();
}
```

---

## Using Channels in Notifications

### Specifying Channel for Notification

When scheduling a notification, specify which channel it belongs to via `data`:

```typescript
async function sendNotificationToChannel(
  channelId: string,
  content: any
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      ...content,
      data: { channelId },
    },
    trigger: null,
  });
}
```

Or set default channel in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "defaultChannel": "default"
        }
      ]
    ]
  }
}
```

---

## Common Issues & Solutions

### Issue: "Cannot modify channel after creation"

**Cause**: Android doesn't allow modifying existing channels.

**Solution**: Delete and recreate

```typescript
async function updateChannel(channelId: string, config: any) {
  if (Platform.OS !== 'android') return;
  
  // Channels are immutable - users must manually change in settings
  // Or delete app and reinstall
  console.warn('To update channel, user must change settings manually');
}
```

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/