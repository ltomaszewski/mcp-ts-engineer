# Core API - Sentry React Native

Error capture, user identification, breadcrumbs, scopes, context enrichment, and user feedback.

---

## captureException()

Captures an error event and sends it to Sentry.

```typescript
import * as Sentry from '@sentry/react-native';

// Basic
Sentry.captureException(error);

// With context
Sentry.captureException(error, {
  tags: { feature: 'checkout', severity: 'critical' },
  extra: { orderId: '12345', cartItems: 3 },
  level: 'error',
});

// With hint (advanced)
Sentry.captureException(error, {
  data: { order },
  originalException: error,
});
```

---

## captureMessage()

Captures a text message event.

```typescript
import * as Sentry from '@sentry/react-native';

// Basic
Sentry.captureMessage('User completed onboarding');

// With severity level
Sentry.captureMessage('Payment retried 3 times', 'warning');

// With context
Sentry.captureMessage('Checkout abandoned', {
  level: 'info',
  tags: { section: 'checkout' },
  extra: { cartValue: 149.99 },
});
```

### Severity Levels

| Level | Use Case |
|-------|----------|
| `'fatal'` | App crash, unrecoverable error |
| `'error'` | Error affecting functionality |
| `'warning'` | Unexpected but handled |
| `'info'` | Important events (login, purchase) |
| `'debug'` | Diagnostic information |

---

## captureEvent()

Sends a manually constructed event.

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.captureEvent({
  message: 'Manual event',
  level: 'info',
  tags: { source: 'analytics' },
  extra: { data: someData },
});
```

---

## captureFeedback()

Captures user feedback. Replaces the removed `captureUserFeedback()` API (removed in v7).

### Signature

```typescript
Sentry.captureFeedback(
  feedback: SendFeedbackParams,
  hint?: FeedbackHint,
): string // Returns the event ID
```

### SendFeedbackParams

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | No | User's full name |
| `email` | string | No | User's email address |
| `message` | string | Yes | Feedback content |
| `associatedEventId` | string | No | Links feedback to a specific error event |

### FeedbackHint

| Parameter | Type | Description |
|-----------|------|-------------|
| `captureContext` | object | Tags and other metadata |
| `attachments` | array | File attachments |

### Examples

```typescript
import * as Sentry from '@sentry/react-native';

// Basic feedback
Sentry.captureFeedback({
  name: 'John Doe',
  email: 'john@doe.com',
  message: 'The checkout flow is broken.',
});

// Feedback linked to an error event
const eventId = Sentry.captureMessage('Checkout failure');
Sentry.captureFeedback({
  name: 'Jane Smith',
  email: 'jane@example.com',
  message: 'I cannot complete my purchase.',
  associatedEventId: eventId,
});

// Feedback with additional context and attachments
Sentry.captureFeedback(
  { message: 'I really like your App, thanks!' },
  {
    captureContext: { tags: { source: 'feedback-form' } },
    attachments: [{ filename: 'screenshot.txt', data: 'base64data' }],
  },
);
```

---

## User Identification

### setUser()

Sets the current user context. Persists across all subsequent events.

```typescript
import * as Sentry from '@sentry/react-native';

// On login
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username,
  ip_address: '{{auto}}', // Let Sentry infer IP
});

// On logout -- ALWAYS clear
Sentry.setUser(null);
```

### User Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique user identifier |
| `email` | string | User email address |
| `username` | string | Display name |
| `ip_address` | string | IP address or `'{{auto}}'` for auto-detection |
| Custom keys | any | Additional user properties |

### setTag()

Adds a searchable, indexed tag. Tags appear in Sentry search and filters.

```typescript
Sentry.setTag('feature', 'payment');
Sentry.setTag('plan', 'premium');
Sentry.setTag('app_version', '2.1.0');
```

### setContext()

Adds structured context data (not indexed, but visible in event detail).

```typescript
Sentry.setContext('order', {
  id: order.id,
  total: order.total,
  items: order.items.length,
  currency: 'USD',
});
```

### setExtra()

Adds arbitrary extra data to events.

```typescript
Sentry.setExtra('lastAction', 'add_to_cart');
Sentry.setExtra('responsePayload', JSON.stringify(data));
```

---

## Breadcrumbs

Breadcrumbs record a trail of events leading up to an error.

### addBreadcrumb()

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to checkout',
  level: 'info',
  data: { from: '/cart', to: '/checkout' },
});
```

### Breadcrumb Properties

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Event classification |
| `category` | string | Grouping label (e.g., `'navigation'`, `'http'`, `'auth'`) |
| `message` | string | Event description |
| `level` | string | Severity: `'fatal'`, `'error'`, `'warning'`, `'info'`, `'debug'` |
| `timestamp` | number | Auto-set by SDK |
| `data` | object | Additional structured information |

### Common Categories

```typescript
// Navigation
Sentry.addBreadcrumb({
  category: 'navigation',
  message: 'Screen transition',
  data: { from: 'Home', to: 'Profile' },
});

// User action
Sentry.addBreadcrumb({
  category: 'ui.click',
  message: 'User tapped checkout button',
});

// HTTP request
Sentry.addBreadcrumb({
  category: 'http',
  message: 'API call to /orders',
  data: { method: 'POST', status_code: 201 },
});

// Authentication
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
  data: { method: 'email' },
});
```

### Automatic Breadcrumbs

The SDK automatically captures:
- HTTP requests (fetch/XMLHttpRequest)
- Navigation events (via instrumentation integrations)
- User interactions (via `Sentry.wrap()`)
- Console logs
- Native Android/iOS events

### Filtering Breadcrumbs

```typescript
Sentry.init({
  dsn: 'YOUR_DSN',
  beforeBreadcrumb(breadcrumb) {
    // Drop verbose breadcrumbs
    if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
      return null;
    }
    // Redact sensitive URLs
    if (breadcrumb.category === 'http' && breadcrumb.data?.url?.includes('/auth')) {
      breadcrumb.data.url = '[REDACTED]';
    }
    return breadcrumb;
  },
});
```

---

## Scopes

### withScope()

Creates an isolated scope for error-specific context. Does not persist globally.

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.withScope((scope) => {
  scope.setTag('critical', 'true');
  scope.setLevel('fatal');
  scope.setExtra('retryCount', 3);
  scope.setFingerprint(['payment-failure', orderId]);
  Sentry.captureException(error);
});
// Tags/level revert after this block
```

### Scope Methods

| Method | Description |
|--------|-------------|
| `scope.setTag(key, value)` | Set a searchable tag |
| `scope.setLevel(level)` | Set severity level |
| `scope.setExtra(key, value)` | Add extra data |
| `scope.setUser(user)` | Set user context |
| `scope.setContext(name, data)` | Set structured context |
| `scope.setFingerprint(values)` | Control error grouping |
| `scope.addBreadcrumb(breadcrumb)` | Add a breadcrumb |
| `scope.clear()` | Clear all scope data |

---

## Flush Before Background

Ensure pending events are sent before the app goes to background:

```typescript
import * as Sentry from '@sentry/react-native';
import { AppState } from 'react-native';
import { useEffect } from 'react';

function useFlushOnBackground(): void {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        Sentry.flush(2000); // Wait up to 2 seconds
      }
    });
    return () => subscription.remove();
  }, []);
}
```

---

## Complete Error Handler Pattern

```typescript
import * as Sentry from '@sentry/react-native';

async function safeApiCall<T>(
  operation: () => Promise<T>,
  context: { feature: string; action: string },
): Promise<T> {
  try {
    Sentry.addBreadcrumb({
      category: 'api',
      message: `Starting ${context.action}`,
      level: 'info',
    });
    return await operation();
  } catch (error) {
    Sentry.withScope((scope) => {
      scope.setTag('feature', context.feature);
      scope.setTag('action', context.action);
      scope.setLevel('error');
      Sentry.captureException(error);
    });
    throw error;
  }
}

// Usage
const user = await safeApiCall(
  () => api.getUser(userId),
  { feature: 'profile', action: 'fetch_user' },
);
```

---

## Available Integrations

### Default Integrations

| Integration | Purpose |
|-------------|---------|
| Dedupe | Deduplicate events |
| FunctionToString | Converts function references to strings |
| Breadcrumbs | Auto-capture breadcrumbs |
| LinkedErrors | Chain related errors |
| HttpContext (UserAgent) | Add HTTP context |

### Optional Integrations

| Integration | Purpose |
|-------------|---------|
| `mobileReplayIntegration()` | Session replay for mobile |
| `reactNavigationIntegration()` | React Navigation performance tracing |
| `expoUpdatesListenerIntegration()` | Track Expo Updates lifecycle events as breadcrumbs (v8.5+). Enabled by default in Expo apps. |
| `browserReplayIntegration()` | Session replay for web |
| Redux integration | Track Redux state |
| Component tracking | Monitor component lifecycle |
| React component names | Add component names to events |
| Consola integration | Send Consola logs to Sentry |
| Console logging | Capture console API calls as Sentry logs |
| HttpClient | Enhanced HTTP error capture |
| RewriteFrames | Modify stack frame URLs |

### Expo Image and Asset Instrumentation (v8.4+)

Instrument `expo-image` and `expo-asset` for performance monitoring of image/asset loading:

```typescript
import { Image } from 'expo-image';
import { Asset } from 'expo-asset';
import * as Sentry from '@sentry/react-native';

// Instruments Image.prefetch and Image.loadAsync
Sentry.wrapExpoImage(Image);

// Instruments Asset.loadAsync
Sentry.wrapExpoAsset(Asset);
```

### Shake-to-Report Feedback (v8.5+)

Enable the shake gesture to open the user feedback widget:

```typescript
import * as Sentry from '@sentry/react-native';

// Start listening for shake gestures
Sentry.enableFeedbackOnShake();

// Stop listening
Sentry.disableFeedbackOnShake();
```

---

**Version:** 8.6.0 | **Source:** https://docs.sentry.io/platforms/react-native/enriching-events/
