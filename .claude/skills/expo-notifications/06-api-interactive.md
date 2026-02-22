# Interactive Notifications -- Expo Notifications SDK 54

Notification categories, action buttons, text input, and handling user actions.

---

## Notification Categories

Categories define sets of actions (buttons) that users can perform on a notification without opening the app.

### setNotificationCategoryAsync(identifier, actions, options?)

Create a notification category with action buttons.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `identifier` | `string` | Yes | Unique category ID |
| `actions` | `NotificationAction[]` | Yes | Array of action definitions |
| `options` | `NotificationCategoryOptions` | No | Category options |

**Returns:** `Promise<NotificationCategory>`

### NotificationAction Properties

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `identifier` | `string` | Yes | Unique action ID |
| `buttonTitle` | `string` | Yes | Button label text |
| `options.isDestructive` | `boolean` | No | Show in red (iOS) |
| `options.isAuthenticationRequired` | `boolean` | No | Require device unlock (iOS) |
| `options.opensAppToForeground` | `boolean` | No | Open app on tap |
| `textInput` | `object` | No | Enable text input |
| `textInput.placeholder` | `string` | No | Placeholder text |
| `textInput.submitButtonTitle` | `string` | No | Submit button label |

```typescript
import * as Notifications from 'expo-notifications';

async function setupMessageCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('message', [
    {
      identifier: 'reply',
      buttonTitle: 'Reply',
      textInput: {
        placeholder: 'Type your reply...',
        submitButtonTitle: 'Send',
      },
    },
    {
      identifier: 'mark_read',
      buttonTitle: 'Mark as Read',
      options: {
        isDestructive: false,
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'delete',
      buttonTitle: 'Delete',
      options: {
        isDestructive: true,
        opensAppToForeground: false,
      },
    },
  ]);
}
```

---

### getNotificationCategoriesAsync()

Get all registered notification categories.

**Returns:** `Promise<NotificationCategory[]>`

```typescript
const categories = await Notifications.getNotificationCategoriesAsync();
categories.forEach((cat) => {
  console.log(cat.identifier, cat.actions.length, 'actions');
});
```

---

### deleteNotificationCategoryAsync(identifier)

Delete a notification category.

| Parameter | Type | Description |
|-----------|------|-------------|
| `identifier` | `string` | Category ID to delete |

**Returns:** `Promise<boolean>` -- true if category existed and was deleted

```typescript
const deleted = await Notifications.deleteNotificationCategoryAsync('message');
```

---

## Using Categories in Notifications

Set `categoryIdentifier` in notification content to attach action buttons:

```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'New Message',
    body: 'You have a message from Alex',
    categoryIdentifier: 'message', // matches category ID
    data: { messageId: '123', senderId: 'alex' },
  },
  trigger: null,
});
```

---

## Handling User Actions

### DEFAULT_ACTION_IDENTIFIER

Constant returned when user taps the notification itself (not an action button).

```typescript
import * as Notifications from 'expo-notifications';

Notifications.addNotificationResponseReceivedListener((response) => {
  const { actionIdentifier, userText } = response;
  const { data } = response.notification.request.content;

  switch (actionIdentifier) {
    case Notifications.DEFAULT_ACTION_IDENTIFIER:
      // User tapped notification body
      handleOpenNotification(data);
      break;
    case 'reply':
      // User used text input action
      handleReply(data?.messageId as string, userText);
      break;
    case 'mark_read':
      handleMarkRead(data?.messageId as string);
      break;
    case 'delete':
      handleDelete(data?.messageId as string);
      break;
  }
});
```

---

## Complete Example: Calendar Invite

```typescript
import * as Notifications from 'expo-notifications';

async function setupCalendarCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('calendar_invite', [
    {
      identifier: 'accept',
      buttonTitle: 'Accept',
      options: {
        isDestructive: false,
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'decline',
      buttonTitle: 'Decline',
      options: {
        isDestructive: true,
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'maybe',
      buttonTitle: 'Maybe',
      options: {
        isDestructive: false,
        opensAppToForeground: false,
      },
    },
  ]);
}

async function sendCalendarInvite(event: {
  id: string;
  title: string;
  time: string;
}): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Calendar Invite',
      body: `${event.title} at ${event.time}`,
      categoryIdentifier: 'calendar_invite',
      data: { eventId: event.id },
    },
    trigger: null,
  });
}

function handleCalendarActions(): void {
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { actionIdentifier } = response;
    const eventId = response.notification.request.content.data?.eventId;

    if (typeof eventId !== 'string') return;

    switch (actionIdentifier) {
      case 'accept':
        await respondToInvite(eventId, 'accepted');
        break;
      case 'decline':
        await respondToInvite(eventId, 'declined');
        break;
      case 'maybe':
        await respondToInvite(eventId, 'tentative');
        break;
    }

    // Dismiss the notification
    await Notifications.dismissNotificationAsync(
      response.notification.request.identifier
    );
  });
}
```

---

## Complete Example: Todo Reminder with Snooze

```typescript
import * as Notifications from 'expo-notifications';

async function setupTodoCategory(): Promise<void> {
  await Notifications.setNotificationCategoryAsync('todo', [
    {
      identifier: 'done',
      buttonTitle: 'Mark Done',
      options: { isDestructive: false },
    },
    {
      identifier: 'snooze_15',
      buttonTitle: 'Snooze 15min',
      options: { isDestructive: false },
    },
    {
      identifier: 'snooze_1h',
      buttonTitle: 'Snooze 1h',
      options: { isDestructive: false },
    },
  ]);
}

function handleTodoActions(): void {
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { actionIdentifier } = response;
    const { data, title, body } = response.notification.request.content;
    const todoId = data?.todoId;

    switch (actionIdentifier) {
      case 'done':
        await markTodoComplete(todoId as string);
        break;
      case 'snooze_15':
        await Notifications.scheduleNotificationAsync({
          content: { title, body, categoryIdentifier: 'todo', data },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 900,
          },
        });
        break;
      case 'snooze_1h':
        await Notifications.scheduleNotificationAsync({
          content: { title, body, categoryIdentifier: 'todo', data },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
            seconds: 3600,
          },
        });
        break;
    }
  });
}
```

---

## Platform Notes

### iOS
- Full support for categories with action buttons
- Text input actions supported
- `isDestructive` renders button in red
- `isAuthenticationRequired` requires Face ID/Touch ID
- Up to 4 actions per category

### Android
- Categories work but with limited visual customization
- Text input support is limited
- Actions appear in notification shade when expanded
- Use Android notification channels for sound/vibration control

---

**Version:** SDK 54 | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
