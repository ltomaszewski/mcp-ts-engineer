# Expo Notifications: Scheduling & Cancellation API

> Complete reference for scheduling notifications, managing scheduled notifications, cancellation, retrieval, and trigger timing strategies.

**Module Purpose**: Scheduling methods, trigger types, cancellation API, and practical scheduling patterns.

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Scheduling Notifications

### `scheduleNotificationAsync(request)`

**Purpose**: Schedule a notification to be triggered at a specific time or interval.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `request` | `NotificationRequestInput` | Yes | Configuration for the scheduled notification |
| `request.content` | `NotificationContentInput` | Yes | Notification content (title, body, etc.) |
| `request.trigger` | `NotificationTriggerInput` | Yes | When to trigger (time, date, interval) |

**Return Type**: `Promise<string>` — Notification ID for later cancellation/tracking

**Code Example - Simple Delay**:

```typescript
import * as Notifications from 'expo-notifications';

async function scheduleDelayedNotification() {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: "Time's up! ⏰",
        body: 'Your timer has completed',
        sound: 'default',
        badge: 1,
        data: { timerType: 'workout' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60,
        repeats: false,
      },
    });

    console.log('Notification scheduled:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('Failed to schedule notification:', error);
  }
}
```

**Code Example - Repeating Notification**:

```typescript
async function scheduleRepeatingNotification() {
  try {
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Drink Water 💧',
        body: 'Stay hydrated throughout the day',
        sound: 'default',
        data: { reminderType: 'hydration' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 60 * 30,  // Every 30 minutes
        repeats: true,
      },
    });

    console.log('Repeating notification scheduled:', notificationId);
    return notificationId;

  } catch (error) {
    console.error('Failed to schedule repeating notification:', error);
  }
}
```

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Trigger Types

### TIME_INTERVAL Trigger

**Purpose**: Schedule a notification to trigger after a delay or repeatedly at fixed intervals.

**Code Example - One-Time Delay**:

```typescript
async function scheduleInFiveSeconds() {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hello!',
      body: 'This notification fires in 5 seconds',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
    },
  });
  console.log('Scheduled notification ID:', id);
}
```

**Common Intervals**:

```typescript
// Every minute
seconds: 60

// Every 5 minutes
seconds: 60 * 5

// Every 15 minutes
seconds: 60 * 15

// Every hour
seconds: 60 * 60

// Every day
seconds: 60 * 60 * 24

// Every week
seconds: 60 * 60 * 24 * 7
```

---

### DATE Trigger

**Purpose**: Schedule a notification for a specific date and time.

**Code Example - Tomorrow at 9 AM**:

```typescript
async function scheduleTomorrowAt9AM() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(9, 0, 0, 0);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: "Good Morning! 🌅",
      body: 'Start your day with our app',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: tomorrow,
    },
  });
  return id;
}
```

**Code Example - Next Week Monday 2 PM**:

```typescript
async function scheduleNextMondayAt2PM() {
  const now = new Date();
  const nextMonday = new Date(now);

  const day = nextMonday.getDay();
  const daysToMonday = (1 - day + 7) % 7 || 7;

  nextMonday.setDate(nextMonday.getDate() + daysToMonday);
  nextMonday.setHours(14, 0, 0, 0);

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekly Meeting 📅',
      body: 'Team sync-up in 1 hour',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: nextMonday,
    },
  });
  return id;
}
```

---

### CALENDAR Trigger (iOS)

**Purpose**: Schedule recurring notifications based on calendar components (daily, weekly, monthly).

**Code Example - Daily at 9 AM**:

```typescript
async function scheduleDailyAt9AM() {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Daily Reminder 📌',
      body: 'Check your tasks',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      dateComponents: {
        hour: 9,
        minute: 0,
        second: 0,
      },
      repeats: true,
    },
  });
  return id;
}
```

**Code Example - Weekdays at 8 AM**:

```typescript
async function scheduleWeekdayMorning() {
  // Weekday values: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Weekday Reminder',
      body: 'Good morning! Time to work',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      dateComponents: {
        weekday: 2,  // Monday
        hour: 8,
        minute: 0,
      },
      repeats: true,
    },
  });
  return id;
}
```

**Code Example - Every Friday at 5 PM**:

```typescript
async function scheduleFriday5PM() {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'End of Week! 🎉',
      body: 'Great work this week!',
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      dateComponents: {
        weekday: 6,  // Friday
        hour: 17,    // 5 PM
        minute: 0,
      },
      repeats: true,
    },
  });
  return id;
}
```

---

## Real-World Scheduling Patterns

### User Preference-Based Scheduling

```typescript
interface NotificationPreferences {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly';
  preferredTime: { hour: number; minute: number };
  preferredDays?: number[];
}

async function scheduleBasedOnPreferences(prefs: NotificationPreferences) {
  if (!prefs.enabled) return null;

  switch (prefs.frequency) {
    case 'daily': {
      return await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Daily Update',
          body: 'Your daily summary is ready',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          dateComponents: {
            hour: prefs.preferredTime.hour,
            minute: prefs.preferredTime.minute,
          },
          repeats: true,
        },
      });
    }

    case 'weekly': {
      if (!prefs.preferredDays?.length) return null;

      const results = [];
      for (const day of prefs.preferredDays) {
        const id = await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Weekly Update',
            body: 'Your weekly summary is ready',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
            dateComponents: {
              weekday: day,
              hour: prefs.preferredTime.hour,
              minute: prefs.preferredTime.minute,
            },
            repeats: true,
          },
        });
        results.push(id);
      }
      return results;
    }
  }
}
```

---

## Cancellation Methods

### `cancelScheduledNotificationAsync(identifier)`

**Purpose**: Cancel a single scheduled notification by its ID.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `identifier` | `string` | Notification ID from `scheduleNotificationAsync()` |

**Return Type**: `Promise<void>`

**Code Example**:

```typescript
import * as Notifications from 'expo-notifications';

let timerNotificationId: string | null = null;

async function startTimer() {
  try {
    timerNotificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Timer Complete',
        body: '5 minutes elapsed',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
        seconds: 300,
      },
    });

    console.log('Timer started:', timerNotificationId);
  } catch (error) {
    console.error('Error starting timer:', error);
  }
}

async function cancelTimer() {
  try {
    if (timerNotificationId) {
      await Notifications.cancelScheduledNotificationAsync(timerNotificationId);
      console.log('Timer cancelled');
      timerNotificationId = null;
    }
  } catch (error) {
    console.error('Error cancelling timer:', error);
  }
}
```

---

### `cancelAllScheduledNotificationsAsync()`

**Purpose**: Cancel all scheduled notifications at once.

**Parameters**: None

**Return Type**: `Promise<void>`

**Code Example**:

```typescript
async function clearAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications cancelled');
  } catch (error) {
    console.error('Error cancelling notifications:', error);
  }
}
```

---

## Information Retrieval

### `getAllScheduledNotificationsAsync()`

**Purpose**: Fetch details about all scheduled notifications.

**Parameters**: None

**Return Type**: `Promise<NotificationRequest[]>`

**Code Example**:

```typescript
async function listAllScheduledNotifications() {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();

    console.log(`Total scheduled: ${scheduled.length}`);

    scheduled.forEach((notification, index) => {
      console.log(`\n[${index + 1}] ${notification.content.title}`);
      console.log(`ID: ${notification.identifier}`);
      console.log(`Body: ${notification.content.body}`);
    });

    return scheduled;

  } catch (error) {
    console.error('Error fetching scheduled notifications:', error);
  }
}

// Find notification by title
async function findNotificationByTitle(title: string) {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    return scheduled.find(n => n.content.title === title);
  } catch (error) {
    console.error('Error searching notifications:', error);
  }
}
```

---

### `getNextTriggerDateAsync(trigger)`

**Purpose**: Calculate when a notification trigger will next fire.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `trigger` | `SchedulableNotificationTriggerInput` | The trigger to calculate for |

**Return Type**: `Promise<number \| null>` — Unix timestamp or null if never fires

**Code Example**:

```typescript
async function showNextTriggerTime(trigger: any) {
  try {
    const nextTimestamp = await Notifications.getNextTriggerDateAsync(trigger);

    if (nextTimestamp === null) {
      console.log('This trigger will never fire');
      return;
    }

    const nextDate = new Date(nextTimestamp);
    console.log('Next trigger time:', nextDate.toLocaleString());

    return nextDate;

  } catch (error) {
    console.error('Error getting next trigger time:', error);
  }
}
```

---

## Complete Notification Manager Class

```typescript
import * as Notifications from 'expo-notifications';

export class NotificationManager {
  private scheduledIds: Map<string, string> = new Map();

  async scheduleNotification(
    key: string,
    content: Notifications.NotificationContentInput,
    trigger: Notifications.NotificationTriggerInput
  ) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content,
        trigger,
      });

      this.scheduledIds.set(key, id);
      console.log(`Scheduled [${key}]:`, id);
      return id;

    } catch (error) {
      console.error(`Failed to schedule [${key}]:`, error);
    }
  }

  async cancelNotification(key: string) {
    const id = this.scheduledIds.get(key);
    if (id) {
      await Notifications.cancelScheduledNotificationAsync(id);
      this.scheduledIds.delete(key);
      console.log(`Cancelled [${key}]:`, id);
    }
  }

  async getScheduledCount() {
    const all = await Notifications.getAllScheduledNotificationsAsync();
    return all.length;
  }

  async clearAll() {
    await Notifications.cancelAllScheduledNotificationsAsync();
    this.scheduledIds.clear();
  }

  async listAll() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}
```

---

## Next Steps

- **Listeners & Events**: See [`05-api-listeners.md`](05-api-listeners.md)
- **Android Channels**: See [`07-api-android-channels.md`](07-api-android-channels.md) (for scheduling on Android)
- **Complete Patterns**: See [`09-guide-patterns.md`](09-guide-patterns.md)
- **Troubleshooting**: See [`10-troubleshooting.md`](10-troubleshooting.md)

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/
**Last Updated**: December 2025
