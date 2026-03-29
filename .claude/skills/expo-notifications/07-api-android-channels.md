# Android Notification Channels -- Expo Notifications SDK 55

Android 8.0+ notification channel creation, configuration, groups, and management.

---

## Overview

Notification channels are required on Android 8.0 (API 26) and higher. They let apps organize notifications and give users granular control over notification settings.

**Key Facts:**
- Each channel has independent settings (sound, vibration, importance)
- Users can mute/customize individual channels in system settings
- Channels cannot be modified after creation (only name and description can change)
- Each notification belongs to exactly one channel
- On Android 13+, creating the first channel triggers the permission prompt

---

## Channel Methods

### setNotificationChannelAsync(channelId, channel)

Create or update a notification channel.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `channelId` | `string` | Yes | Unique channel ID |
| `channel.name` | `string` | Yes | Display name (shown to users) |
| `channel.importance` | `AndroidImportance` | Yes | Priority level |
| `channel.description` | `string` | No | Channel description |
| `channel.sound` | `string \| null` | No | Sound file name or null for silent |
| `channel.vibrationPattern` | `number[]` | No | Vibration pattern in ms |
| `channel.lightColor` | `string` | No | LED light color (hex) |
| `channel.bypassDnd` | `boolean` | No | Bypass Do Not Disturb |
| `channel.enableLights` | `boolean` | No | Show notification light |
| `channel.enableVibrate` | `boolean` | No | Vibrate on notification |
| `channel.showBadge` | `boolean` | No | Show badge on app icon |
| `channel.lockscreenVisibility` | `AndroidNotificationVisibility` | No | Lockscreen behavior |
| `channel.groupId` | `string \| null` | No | Channel group ID |
| `channel.audioAttributes` | `AudioAttributesInput` | No | Audio playback attributes |

**Returns:** `Promise<NotificationChannel | null>`

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

async function createDefaultChannel(): Promise<void> {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default Notifications',
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#FF231F7C',
  });
}
```

---

### getNotificationChannelAsync(channelId)

Get a specific channel by ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `channelId` | `string` | Channel ID to retrieve |

**Returns:** `Promise<NotificationChannel | null>`

```typescript
const channel = await Notifications.getNotificationChannelAsync('alerts');
if (channel) {
  console.log('Name:', channel.name);
  console.log('Importance:', channel.importance);
}
```

---

### getNotificationChannelsAsync()

Get all notification channels.

**Returns:** `Promise<NotificationChannel[]>`

```typescript
const channels = await Notifications.getNotificationChannelsAsync();
channels.forEach((ch) => {
  console.log(ch.id, ch.name, ch.importance);
});
```

---

### deleteNotificationChannelAsync(channelId)

Delete a notification channel.

| Parameter | Type | Description |
|-----------|------|-------------|
| `channelId` | `string` | Channel ID to delete |

**Returns:** `Promise<void>`

```typescript
await Notifications.deleteNotificationChannelAsync('old-channel');
```

---

## AndroidImportance Enum

| Level | Value | Behavior |
|-------|-------|----------|
| `NONE` | 0 | No notifications shown |
| `MIN` | 1 | No sound, no status bar icon |
| `LOW` | 2 | No sound, appears in status bar |
| `DEFAULT` | 3 | Sound and vibration |
| `HIGH` | 4 | Heads-up notification (pops up) |
| `MAX` | 5 | Urgent, full-screen intent possible |

```typescript
// Most common levels
Notifications.AndroidImportance.DEFAULT  // Standard notifications
Notifications.AndroidImportance.HIGH     // Heads-up/popup
Notifications.AndroidImportance.LOW      // Silent, in shade only
Notifications.AndroidImportance.MIN      // Background, minimal
```

---

## AndroidNotificationVisibility Enum

Controls how notifications appear on the lock screen.

| Level | Value | Description |
|-------|-------|-------------|
| `PUBLIC` | 1 | Full content shown on lock screen |
| `PRIVATE` | 0 | Hidden content on lock screen |
| `SECRET` | -1 | Not shown on lock screen at all |

```typescript
await Notifications.setNotificationChannelAsync('private', {
  name: 'Private Messages',
  importance: Notifications.AndroidImportance.HIGH,
  lockscreenVisibility: Notifications.AndroidNotificationVisibility.PRIVATE,
});
```

---

## Channel Setup Examples

### Multiple Channels by Priority

```typescript
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

async function setupAllChannels(): Promise<void> {
  if (Platform.OS !== 'android') return;

  // Urgent alerts
  await Notifications.setNotificationChannelAsync('alerts', {
    name: 'Urgent Alerts',
    importance: Notifications.AndroidImportance.MAX,
    sound: 'default',
    enableVibrate: true,
    vibrationPattern: [0, 250, 250, 250, 250, 250],
    bypassDnd: true,
  });

  // Messages
  await Notifications.setNotificationChannelAsync('messages', {
    name: 'Messages',
    importance: Notifications.AndroidImportance.HIGH,
    sound: 'default',
    lightColor: '#0084FF',
    enableLights: true,
  });

  // Reminders
  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
  });

  // Background services
  await Notifications.setNotificationChannelAsync('background', {
    name: 'Background Services',
    importance: Notifications.AndroidImportance.MIN,
  });
}
```

---

### Custom Sound Channel

Sound files must be declared in `app.json` config plugin:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": ["./assets/notification-sound.wav"]
        }
      ]
    ]
  }
}
```

```typescript
await Notifications.setNotificationChannelAsync('custom-sound', {
  name: 'Custom Sound',
  importance: Notifications.AndroidImportance.HIGH,
  sound: 'notification-sound', // filename without extension
});
```

SDK 55 validates that declared sound files exist at build time.

---

### Vibration Patterns

Pattern format: `[delay, vibrate, pause, vibrate, ...]` in milliseconds.

```typescript
// Single short vibration
vibrationPattern: [0, 100]

// Double tap
vibrationPattern: [0, 100, 100, 100]

// Triple tap
vibrationPattern: [0, 250, 250, 250, 250, 250]

// Long buzz
vibrationPattern: [0, 500]
```

---

## Channel Groups

### setNotificationChannelGroupAsync(groupId, group)

Create a channel group for organizing related channels.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `groupId` | `string` | Yes | Unique group ID |
| `group.name` | `string` | Yes | Display name |
| `group.description` | `string` | No | Group description |

**Returns:** `Promise<NotificationChannelGroup | null>`

```typescript
await Notifications.setNotificationChannelGroupAsync('communication', {
  name: 'Communication',
  description: 'Messages and calls',
});

// Assign channel to group
await Notifications.setNotificationChannelAsync('messages', {
  name: 'Messages',
  importance: Notifications.AndroidImportance.HIGH,
  groupId: 'communication',
});
```

---

### getNotificationChannelGroupAsync(groupId)

Get a specific channel group.

**Returns:** `Promise<NotificationChannelGroup | null>`

---

### getNotificationChannelGroupsAsync()

Get all channel groups.

**Returns:** `Promise<NotificationChannelGroup[]>`

---

### deleteNotificationChannelGroupAsync(groupId)

Delete a channel group and all its channels.

| Parameter | Type | Description |
|-----------|------|-------------|
| `groupId` | `string` | Group ID to delete |

**Returns:** `Promise<void>`

```typescript
await Notifications.deleteNotificationChannelGroupAsync('old-group');
```

---

## NotificationChannel (Read-Only Properties)

Properties returned when reading a channel:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `string` | Channel identifier |
| `name` | `string \| null` | Display name |
| `description` | `string \| null` | Channel description |
| `importance` | `AndroidImportance` | Importance level |
| `enableVibrate` | `boolean` | Vibration enabled |
| `enableLights` | `boolean` | LED light enabled |
| `sound` | `'default' \| 'custom' \| null` | Sound setting |
| `vibrationPattern` | `number[] \| null` | Vibration pattern |
| `lightColor` | `string` | Light color |
| `bypassDnd` | `boolean` | Bypasses Do Not Disturb |
| `showBadge` | `boolean` | Badge display |
| `lockscreenVisibility` | `AndroidNotificationVisibility` | Lock screen behavior |
| `groupId` | `string \| null` | Channel group ID |
| `audioAttributes` | `AudioAttributes` | Audio playback attributes |

---

## Using Channels in Notifications

Set the default channel in `app.json` config plugin:

```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", { "defaultChannel": "default" }]
    ]
  }
}
```

For push notifications from server, set `channelId` in the push payload. For local notifications, use the `channelId` property on the trigger:

```typescript
await Notifications.scheduleNotificationAsync({
  content: { title: 'Alert', body: 'High priority' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(Date.now() + 5000),
    channelId: 'alerts',
  },
});
```

---

## Important Notes

- Channels are immutable after creation (except name and description)
- Users can override channel settings in system Settings
- Deleting and recreating a channel does NOT reset user preferences
- Create all channels at app startup before scheduling notifications
- On Android 13+, creating the first channel triggers the permission prompt
- Android 8.0+ requires both channel AND notification content sound config for cross-version consistency

---

**Version:** Expo SDK 55 (~55.0.14) | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
