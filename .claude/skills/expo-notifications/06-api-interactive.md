# Interactive Notifications & User Actions

**Module Purpose**: Complete guide to notification categories, action buttons, text input, and user interactions.

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Notification Categories & Actions

### What are Categories?

Categories define sets of actions (buttons) that users can perform on a notification without opening the app.

**Common Uses**:
- Reply to messages
- Accept/Reject invitations
- Mark as read
- Snooze reminders

---

## iOS Implementation

### Setting Up Categories (iOS)

**Step 1: Define Actions**

```typescript
import * as Notifications from 'expo-notifications';

const messageActions = [
  {
    identifier: 'reply',
    buttonTitle: 'Reply',
    options: {
      isDestructive: false,
      isAuthenticationRequired: false,
      opensAppToForeground: false,
    },
  },
  {
    identifier: 'read',
    buttonTitle: 'Mark as Read',
    options: {
      isDestructive: false,
      isAuthenticationRequired: false,
      opensAppToForeground: false,
    },
  },
  {
    identifier: 'delete',
    buttonTitle: 'Delete',
    options: {
      isDestructive: true,
      isAuthenticationRequired: false,
      opensAppToForeground: false,
    },
  },
];
```

**Step 2: Create Category**

```typescript
async function setupMessageCategory() {
  if (Platform.OS !== 'ios') return;
  
  await Notifications.setNotificationCategoryAsync('message', messageActions);
}
```

**Step 3: Use Category in Notification**

```typescript
async function scheduleMessageNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'New Message',
      body: 'You have a new message from Alex',
      categoryIdentifier: 'message',
      data: { messageId: '123' },
    },
    trigger: null,
  });
}
```

---

### iOS Action Button Examples

**Code Example - Simple Actions**:

```typescript
async function setupCalendarCategory() {
  if (Platform.OS !== 'ios') return;
  
  const actions = [
    {
      identifier: 'accept',
      buttonTitle: 'Accept ✓',
      options: {
        isDestructive: false,
        opensAppToForeground: false,
      },
    },
    {
      identifier: 'decline',
      buttonTitle: 'Decline ✗',
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
  ];
  
  await Notifications.setNotificationCategoryAsync('calendar', actions);
}
```

---

### iOS Text Input Actions

```typescript
async function setupReplyCategory() {
  if (Platform.OS !== 'ios') return;
  
  const actions = [
    {
      identifier: 'reply',
      buttonTitle: 'Reply',
      options: {
        isDestructive: false,
        opensAppToForeground: false,
        textInputAction: {
          placeholder: 'Type your reply...',
          submitButtonTitle: 'Send',
        },
      },
    },
    {
      identifier: 'quick_reply_yes',
      buttonTitle: 'Quick: Yes',
      options: {
        isDestructive: false,
        opensAppToForeground: false,
      },
    },
  ];
  
  await Notifications.setNotificationCategoryAsync('reply', actions);
}

// Handle response with text
Notifications.addNotificationResponseReceivedListener((response) => {
  if (response.actionIdentifier === 'reply') {
    const userText = response.userText;
    console.log('User replied:', userText);
  }
});
```

---

## Android Implementation

### Android Notification Styles

Android doesn't use categories but supports different content styles:

**BigTextStyle** (Default for long text):

```typescript
async function sendBigTextNotification() {
  if (Platform.OS !== 'android') return;
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Email from Boss',
      body: 'This is a very long notification that will use the BigTextStyle...',
      data: {
        style: 'big_text',
      },
    },
    trigger: null,
  });
}
```

**InboxStyle** (Multiple lines):

```typescript
async function sendInboxNotification() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Inbox (5 new)',
      body: 'Message 1\nMessage 2\nMessage 3',
      data: {
        style: 'inbox',
      },
    },
    trigger: null,
  });
}
```

---

## Handling User Actions

### Response Listener Pattern

```typescript
import * as Notifications from 'expo-notifications';

Notifications.addNotificationResponseReceivedListener((response) => {
  const { actionIdentifier, userText } = response;
  const { data, title } = response.notification.request.content;
  
  console.log(`User action: ${actionIdentifier}`);
  console.log(`User text: ${userText}`);
  console.log(`Notification data:`, data);
  
  // Handle different actions
  switch (actionIdentifier) {
    case 'reply':
      handleReplyAction(data?.messageId, userText);
      break;
    case 'accept':
      handleAcceptAction(data?.eventId);
      break;
    case 'decline':
      handleDeclineAction(data?.eventId);
      break;
    case Notifications.DEFAULT_ACTION_IDENTIFIER:
      handleUserOpenedNotification(data);
      break;
  }
});
```

---

## Complete Example: Email-Like Notification

```typescript
async function setupEmailCategories() {
  if (Platform.OS !== 'ios') return;
  
  // Reply category
  await Notifications.setNotificationCategoryAsync('email_reply', [
    {
      identifier: 'reply',
      buttonTitle: 'Reply',
      options: {
        textInputAction: {
          placeholder: 'Type your reply...',
          submitButtonTitle: 'Send',
        },
      },
    },
    {
      identifier: 'archive',
      buttonTitle: 'Archive',
      options: {
        isDestructive: false,
      },
    },
    {
      identifier: 'spam',
      buttonTitle: 'Spam',
      options: {
        isDestructive: true,
      },
    },
  ]);
}

async function scheduleEmailNotification(email: {
  from: string;
  subject: string;
  preview: string;
  emailId: string;
}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: email.from,
      body: email.subject,
      subtitle: email.preview,
      categoryIdentifier: 'email_reply',
      data: { emailId: email.emailId },
    },
    trigger: null,
  });
}

function handleEmailActions() {
  Notifications.addNotificationResponseReceivedListener((response) => {
    const { actionIdentifier, userText } = response;
    const { emailId } = response.notification.request.content.data;
    
    if (actionIdentifier === 'reply' && userText) {
      sendEmailReply(emailId, userText);
    } else if (actionIdentifier === 'archive') {
      archiveEmail(emailId);
    } else if (actionIdentifier === 'spam') {
      markAsSpam(emailId);
    }
  });
}
```

---

## Complete Example: Todo List Notification

```typescript
async function setupTodoCategories() {
  if (Platform.OS !== 'ios') return;
  
  await Notifications.setNotificationCategoryAsync('todo', [
    {
      identifier: 'done',
      buttonTitle: 'Mark Done ✓',
      options: {
        isDestructive: false,
      },
    },
    {
      identifier: 'snooze_15',
      buttonTitle: 'Snooze 15min',
      options: {
        isDestructive: false,
      },
    },
    {
      identifier: 'snooze_1h',
      buttonTitle: 'Snooze 1h',
      options: {
        isDestructive: false,
      },
    },
    {
      identifier: 'delete',
      buttonTitle: 'Delete',
      options: {
        isDestructive: true,
      },
    },
  ]);
}

async function scheduleTodoNotification(todo: {
  id: string;
  title: string;
  dueDate: Date;
}) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Todo Due',
      body: todo.title,
      categoryIdentifier: 'todo',
      data: { todoId: todo.id },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: todo.dueDate,
    },
  });
}

function handleTodoActions() {
  Notifications.addNotificationResponseReceivedListener(async (response) => {
    const { actionIdentifier } = response;
    const { todoId } = response.notification.request.content.data;
    
    switch (actionIdentifier) {
      case 'done':
        markTodoComplete(todoId);
        break;
      case 'snooze_15':
        snoozeTodo(todoId, 15);
        break;
      case 'snooze_1h':
        snoozeTodo(todoId, 60);
        break;
      case 'delete':
        deleteTodo(todoId);
        break;
    }
    
    // Clear related notifications
    await Notifications.dismissNotificationAsync(
      response.notification.request.identifier
    );
  });
}
```

---

## Action Response Handling

### Complete Response Handler

```typescript
export class NotificationActionHandler {
  private handlers: Map<string, (data: any, text?: string) => void> = new Map();
  
  registerHandler(actionId: string, handler: (data: any, text?: string) => void) {
    this.handlers.set(actionId, handler);
  }
  
  setup() {
    Notifications.addNotificationResponseReceivedListener((response) => {
      const { actionIdentifier, userText } = response;
      const { data } = response.notification.request.content;
      
      const handler = this.handlers.get(actionIdentifier);
      
      if (handler) {
        handler(data, userText);
      } else if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // User tapped notification itself
        this.handleDefaultAction(data);
      }
    });
  }
  
  private handleDefaultAction(data: any) {
    console.log('Notification tapped:', data);
  }
}

// Usage
const handler = new NotificationActionHandler();

handler.registerHandler('reply', (data, text) => {
  console.log('Replying with:', text);
});

handler.registerHandler('accept', (data) => {
  console.log('Accepted:', data.eventId);
});

handler.setup();
```

---

## Default Notification Action

```typescript
// When user taps the notification itself (not an action button)
Notifications.addNotificationResponseReceivedListener((response) => {
  if (response.actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
    console.log('User tapped the notification');
    // Navigate to app screen
  }
});
```

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/