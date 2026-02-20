---
name: sentry-react-native
description: Sentry React Native SDK - error monitoring, crash reporting, performance tracing, session replay. Use when integrating Sentry, capturing errors, or configuring performance monitoring.
---

# Sentry React Native

> Error monitoring, crash reporting, and performance tracing for React Native and Expo apps.

**Package:** `@sentry/react-native`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Setting up Sentry in React Native or Expo
- Capturing errors with context and tags
- Implementing user identification for tracking
- Configuring performance monitoring
- Setting up error boundaries
- Troubleshooting missing events or stack traces

---

## Critical Rules

**ALWAYS:**
1. Initialize Sentry as early as possible — before any other code runs
2. Include contextual tags and extra data — makes debugging possible
3. Clear user context on logout — `Sentry.setUser(null)`
4. Use `withScope()` for error-specific context — doesn't persist globally
5. Flush pending events before backgrounding — `Sentry.flush(2000)`
6. Set `enabled: !__DEV__` — avoid polluting production with dev errors

**NEVER:**
1. Capture exceptions without context — useless for debugging
2. Log sensitive data (passwords, tokens, PII) — security risk
3. Enable Sentry in development without reason — pollutes data
4. Forget to upload source maps — unreadable stack traces
5. Set sampling rates to 1.0 in production — expensive and unnecessary

---

## Core Patterns

### Basic Setup

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN',
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

### Expo Plugin Configuration

```json
// app.json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "your-org-slug",
          "project": "your-project-slug"
        }
      ]
    ]
  }
}
```

### Capture Exception with Context

```typescript
try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'checkout' },
    extra: { orderId: order.id }
  });
}
```

### Set User on Login

```typescript
Sentry.setUser({
  id: user.id,
  email: user.email,
  username: user.username
});

// Clear on logout
Sentry.setUser(null);
```

### Add Breadcrumbs

```typescript
Sentry.addBreadcrumb({
  category: 'navigation',
  message: 'User navigated to checkout',
  level: 'info',
  data: { from: '/cart', to: '/checkout' }
});
```

### Isolated Scope for Critical Errors

```typescript
Sentry.withScope(scope => {
  scope.setTag('critical', 'true');
  scope.setLevel('fatal');
  Sentry.captureException(error);
});
```

### Error Boundary with Fallback

```typescript
import { ErrorBoundary } from '@sentry/react-native';

function App() {
  return (
    <ErrorBoundary
      fallback={({ resetError }) => (
        <ErrorFallbackScreen onRetry={resetError} />
      )}
      beforeCapture={(scope) => {
        scope.setTag('boundary', 'root');
      }}
    >
      <AppNavigator />
    </ErrorBoundary>
  );
}
```

### Flush Before Background

```typescript
import { AppState } from 'react-native';

useEffect(() => {
  const subscription = AppState.addEventListener('change', (state) => {
    if (state === 'background') {
      Sentry.flush(2000);
    }
  });
  return () => subscription.remove();
}, []);
```

---

## Anti-Patterns

**BAD** — Capture without context:
```typescript
Sentry.captureException(error);  // No useful info!
```

**GOOD** — Include context:
```typescript
Sentry.captureException(error, {
  tags: { feature: 'payment' },
  extra: { userId: user.id, amount: total }
});
```

**BAD** — Enabled in development:
```typescript
Sentry.init({
  dsn: 'YOUR_DSN',
  enabled: true  // Pollutes Sentry with dev errors
});
```

**GOOD** — Disabled in development:
```typescript
Sentry.init({
  dsn: 'YOUR_DSN',
  enabled: !__DEV__
});
```

**BAD** — Logging sensitive data:
```typescript
Sentry.setContext('auth', {
  token: user.accessToken,  // Exposed!
  password: form.password   // Exposed!
});
```

**GOOD** — Only safe identifiers:
```typescript
Sentry.setContext('auth', {
  userId: user.id,
  authMethod: 'oauth'
});
```

**BAD** — High sampling in production:
```typescript
Sentry.init({
  tracesSampleRate: 1.0,           // Expensive!
  replaysSessionSampleRate: 1.0    // Very expensive!
});
```

**GOOD** — Reasonable sampling:
```typescript
Sentry.init({
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0  // 100% only for errors
});
```

---

## Quick Reference

| Method | Purpose | Example |
|--------|---------|---------|
| `init()` | Initialize SDK | `Sentry.init({ dsn: '...' })` |
| `captureException()` | Capture error | `Sentry.captureException(error, { tags })` |
| `captureMessage()` | Capture message | `Sentry.captureMessage('msg', 'warning')` |
| `setUser()` | Set user context | `Sentry.setUser({ id: '123' })` |
| `setTag()` | Add searchable tag | `Sentry.setTag('feature', 'auth')` |
| `setContext()` | Add structured data | `Sentry.setContext('order', { id: 1 })` |
| `addBreadcrumb()` | Record event trail | `Sentry.addBreadcrumb({ category, message })` |
| `withScope()` | Isolated context | `Sentry.withScope(scope => {...})` |
| `flush()` | Send pending events | `await Sentry.flush(2000)` |

### Init Options

| Option | Recommended | Description |
|--------|-------------|-------------|
| `dsn` | Required | Your Sentry DSN |
| `enabled` | `!__DEV__` | Disable in development |
| `environment` | `'production'` | Environment name |
| `tracesSampleRate` | `0.1` | Performance sampling (0-1) |
| `replaysSessionSampleRate` | `0.1` | Session replay sampling |
| `replaysOnErrorSampleRate` | `1.0` | Error session recording |

### Severity Levels

| Level | Use Case |
|-------|----------|
| `'fatal'` | App crash, unrecoverable error |
| `'error'` | Error affecting functionality |
| `'warning'` | Unexpected but handled |
| `'info'` | Important events (login, purchase) |
| `'debug'` | Diagnostic information |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation, init options, Expo | [01-setup.md](knowledge-base/01-setup.md) |
| captureException, setUser, breadcrumbs | [02-core-api.md](knowledge-base/02-core-api.md) |
| Performance, replay, error boundaries | [03-advanced-features.md](knowledge-base/03-advanced-features.md) |
| Source maps, testing, troubleshooting | [04-guides.md](knowledge-base/04-guides.md) |

---

**Version:** 6.x | **Source:** https://docs.sentry.io/platforms/react-native/
