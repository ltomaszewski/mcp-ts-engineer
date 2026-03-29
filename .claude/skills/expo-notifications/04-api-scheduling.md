# Scheduling & Cancellation API -- Expo Notifications SDK 55

Scheduling notifications, trigger types, cancellation, and retrieval.

---

## scheduleNotificationAsync(request)

Schedule a notification to be triggered at a specific time or interval.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request.content` | `NotificationContentInput` | Yes | Notification content |
| `request.trigger` | `NotificationTriggerInput \| null` | Yes | When to trigger (`null` = immediate) |
| `request.identifier` | `string` | No | Custom notification ID |

**Returns:** `Promise<string>` -- notification identifier

```typescript
import * as Notifications from 'expo-notifications';

// Immediate notification (trigger = null)
const id = await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Hello',
    body: 'This fires immediately',
    data: { screen: 'home' },
  },
  trigger: null,
});
```

---

## Trigger Types

### SchedulableTriggerInputTypes Enum

| Type | Value | Description |
|------|-------|-------------|
| `TIME_INTERVAL` | `'timeInterval'` | Fire after N seconds (optionally repeating) |
| `DATE` | `'date'` | Fire at specific date/time |
| `CALENDAR` | `'calendar'` | Fire based on date components (repeating) |
| `DAILY` | `'daily'` | Fire daily at specific time |
| `WEEKLY` | `'weekly'` | Fire weekly on specific day and time |
| `MONTHLY` | `'monthly'` | Fire monthly on specific day and time |
| `YEARLY` | `'yearly'` | Fire yearly on specific date and time |

All trigger types support an optional `channelId` property (Android) to specify which notification channel to use.

---

### TIME_INTERVAL Trigger

Fire after a delay or repeatedly at fixed intervals.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `SchedulableTriggerInputTypes.TIME_INTERVAL` | Yes | Trigger type |
| `seconds` | `number` | Yes | Seconds until trigger |
| `repeats` | `boolean` | No | Repeat at interval (default: false) |
| `channelId` | `string` | No | Android notification channel ID |

**iOS constraint:** When `repeats: true`, `seconds` must be >= 60.

```typescript
// One-time delay (5 seconds)
await Notifications.scheduleNotificationAsync({
  content: { title: 'Timer', body: 'Time is up!' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 5,
    repeats: false,
  },
});

// Repeating every 30 minutes
await Notifications.scheduleNotificationAsync({
  content: { title: 'Reminder', body: 'Stay hydrated' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
    seconds: 1800,
    repeats: true,
  },
});
```

---

### DATE Trigger

Fire at a specific date and time. Does not repeat.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `SchedulableTriggerInputTypes.DATE` | Yes | Trigger type |
| `date` | `Date \| number` | Yes | Date object or Unix timestamp (ms) |
| `channelId` | `string` | No | Android notification channel ID |

```typescript
// Schedule for tomorrow at 9 AM
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
tomorrow.setHours(9, 0, 0, 0);

await Notifications.scheduleNotificationAsync({
  content: { title: 'Good Morning', body: 'Start your day' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: tomorrow,
  },
});
```

---

### DAILY Trigger

Fire every day at a specific time.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `SchedulableTriggerInputTypes.DAILY` | Yes | Trigger type |
| `hour` | `number` | Yes | Hour (0-23) |
| `minute` | `number` | Yes | Minute (0-59) |
| `channelId` | `string` | No | Android notification channel ID |

```typescript
// Daily at 9:00 AM
await Notifications.scheduleNotificationAsync({
  content: { title: 'Daily Reminder', body: 'Check your tasks' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DAILY,
    hour: 9,
    minute: 0,
  },
});
```

---

### WEEKLY Trigger

Fire every week on a specific day and time.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `SchedulableTriggerInputTypes.WEEKLY` | Yes | Trigger type |
| `weekday` | `number` | Yes | Day of week (1=Sunday, 7=Saturday) |
| `hour` | `number` | Yes | Hour (0-23) |
| `minute` | `number` | Yes | Minute (0-59) |
| `channelId` | `string` | No | Android notification channel ID |

```typescript
// Every Monday at 8:00 AM
await Notifications.scheduleNotificationAsync({
  content: { title: 'Weekly Review', body: 'Plan your week' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
    weekday: 2, // Monday
    hour: 8,
    minute: 0,
  },
});
```

---

### MONTHLY Trigger

Fire every month on a specific day and time.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `SchedulableTriggerInputTypes.MONTHLY` | Yes | Trigger type |
| `day` | `number` | Yes | Day of month (1-31) |
| `hour` | `number` | Yes | Hour (0-23) |
| `minute` | `number` | Yes | Minute (0-59) |
| `channelId` | `string` | No | Android notification channel ID |

```typescript
// 1st of every month at noon
await Notifications.scheduleNotificationAsync({
  content: { title: 'Monthly Report', body: 'Time to review' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
    day: 1,
    hour: 12,
    minute: 0,
  },
});
```

---

### YEARLY Trigger

Fire every year on a specific date and time.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `SchedulableTriggerInputTypes.YEARLY` | Yes | Trigger type |
| `month` | `number` | Yes | Month (0-11) |
| `day` | `number` | Yes | Day of month (1-31) |
| `hour` | `number` | Yes | Hour (0-23) |
| `minute` | `number` | Yes | Minute (0-59) |
| `channelId` | `string` | No | Android notification channel ID |

```typescript
// Every January 1st at midnight
await Notifications.scheduleNotificationAsync({
  content: { title: 'Happy New Year!', body: 'Best wishes' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.YEARLY,
    month: 0, // January
    day: 1,
    hour: 0,
    minute: 0,
  },
});
```

---

### CALENDAR Trigger

Fire based on date components with optional repeat. Most flexible trigger type. Primarily supported on iOS.

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `type` | `SchedulableTriggerInputTypes.CALENDAR` | Yes | Trigger type |
| `repeats` | `boolean` | No | Repeat (default: false) |
| `year` | `number` | No | Year |
| `month` | `number` | No | Month (0-11) |
| `day` | `number` | No | Day of month (1-31) |
| `hour` | `number` | No | Hour (0-23) |
| `minute` | `number` | No | Minute (0-59) |
| `second` | `number` | No | Second (0-59) |
| `weekday` | `number` | No | Day of week (1=Sunday, 7=Saturday) |
| `weekdayOrdinal` | `number` | No | Weekday ordinal |
| `weekOfMonth` | `number` | No | Week of month |
| `weekOfYear` | `number` | No | Week of year |
| `timezone` | `string` | No | Timezone identifier |
| `channelId` | `string` | No | Android notification channel ID |

```typescript
// Every weekday at 8 AM (weekday values: 1=Sunday, 2=Monday...7=Saturday)
await Notifications.scheduleNotificationAsync({
  content: { title: 'Work Reminder', body: 'Time to start' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
    weekday: 2, // Monday
    hour: 8,
    minute: 0,
    repeats: true,
  },
});
```

---

## Cancellation Methods

### cancelScheduledNotificationAsync(identifier)

Cancel a single scheduled notification by its ID.

| Parameter | Type | Description |
|-----------|------|-------------|
| `identifier` | `string` | Notification ID from `scheduleNotificationAsync()` |

**Returns:** `Promise<void>`

```typescript
const id = await Notifications.scheduleNotificationAsync({ content, trigger });

// Later, cancel it
await Notifications.cancelScheduledNotificationAsync(id);
```

---

### cancelAllScheduledNotificationsAsync()

Cancel all scheduled notifications.

**Returns:** `Promise<void>`

```typescript
await Notifications.cancelAllScheduledNotificationsAsync();
```

---

## Information Retrieval

### getAllScheduledNotificationsAsync()

Get all scheduled notifications.

**Returns:** `Promise<NotificationRequest[]>`

```typescript
const scheduled = await Notifications.getAllScheduledNotificationsAsync();
console.log('Total scheduled:', scheduled.length);

scheduled.forEach((notif) => {
  console.log(notif.identifier, notif.content.title);
});
```

---

### getNextTriggerDateAsync(trigger)

Calculate when a trigger will next fire.

| Parameter | Type | Description |
|-----------|------|-------------|
| `trigger` | `SchedulableNotificationTriggerInput` | Trigger to calculate |

**Returns:** `Promise<number | null>` -- Unix timestamp in milliseconds, or null

```typescript
const nextTime = await Notifications.getNextTriggerDateAsync({
  type: Notifications.SchedulableTriggerInputTypes.DAILY,
  hour: 9,
  minute: 0,
});

if (nextTime) {
  console.log('Next trigger:', new Date(nextTime).toLocaleString());
}
```

---

## Common Scheduling Patterns

### Preference-Based Scheduling

```typescript
import * as Notifications from 'expo-notifications';

interface ReminderPrefs {
  enabled: boolean;
  hour: number;
  minute: number;
  days: number[]; // weekday values (1=Sun, 2=Mon...7=Sat)
}

async function scheduleReminders(prefs: ReminderPrefs): Promise<string[]> {
  // Cancel existing reminders first
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!prefs.enabled) return [];

  const ids: string[] = [];
  for (const weekday of prefs.days) {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title: 'Reminder', body: 'Time to check in' },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: prefs.hour,
        minute: prefs.minute,
      },
    });
    ids.push(id);
  }

  return ids;
}
```

### Channel-Specific Scheduling (Android)

```typescript
// Schedule to a specific Android channel
await Notifications.scheduleNotificationAsync({
  content: { title: 'Alert', body: 'High priority alert' },
  trigger: {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: new Date(Date.now() + 5000),
    channelId: 'alerts', // Must match a created channel
  },
});
```

---

**Version:** Expo SDK 55 (~55.0.14) | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
