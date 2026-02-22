# Core API - Sentry React Native

Error capture, user identification, breadcrumbs, scopes, and context enrichment.

---

## captureException()

Captures an error event and sends it to Sentry.

```typescript
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
Sentry.captureEvent({
  message: 'Manual event',
  level: 'info',
  tags: { source: 'analytics' },
  extra: { data: someData },
});
```

---

## User Identification

### setUser()

Sets the current user context. Persists across all subsequent events.

```typescript
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
Sentry.withScope((scope) => {
  scope.setTag('critical', 'true');
  scope.setLevel('fatal');
  scope.setExtra('retryCount', 3);
  scope.setFingerprint(['payment-failure', orderId]);
  Sentry.captureException(error);
});
// Tags/level revert after this block
```

### configureScope()

Modifies the global scope (persists across events).

```typescript
Sentry.configureScope((scope) => {
  scope.setTag('app_state', 'foreground');
  scope.setUser({ id: user.id });
});
```

---

## Flush Before Background

Ensure pending events are sent before the app goes to background:

```typescript
import { AppState } from 'react-native';
import { useEffect } from 'react';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'background') {
      Sentry.flush(2000); // Wait up to 2 seconds
    }
  });
  return () => subscription.remove();
}, []);
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

**Version:** 6.x | **Source:** https://docs.sentry.io/platforms/react-native/enriching-events/
