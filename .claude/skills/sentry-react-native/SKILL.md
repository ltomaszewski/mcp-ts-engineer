---
name: sentry-react-native
version: "8.7.0"
description: "@sentry/react-native v8 — error monitoring, crash reporting, performance tracing, session replay."
when_to_use: "Use when integrating Sentry, capturing errors, configuring performance monitoring, setting up error boundaries, or enabling native app start crash capture."
---

# Sentry React Native

> Error monitoring, crash reporting, and performance tracing for React Native and Expo apps.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Setting up Sentry in React Native or Expo projects
- Capturing errors with context, tags, and breadcrumbs
- Configuring performance tracing and navigation instrumentation
- Setting up ErrorBoundary components
- Implementing session replay
- Enabling native initialization for app start error capture
- Collecting user feedback with captureFeedback
- Troubleshooting missing events or unreadable stack traces

---

## Critical Rules

**ALWAYS:**
1. Initialize Sentry as early as possible (before other code runs) -- ensures all errors are captured
2. Wrap root component with `Sentry.wrap(App)` -- enables touch event tracking, user interaction instrumentation, and feedback widget support
3. Include contextual tags and extra data on captured exceptions -- makes debugging possible
4. Clear user context on logout with `Sentry.setUser(null)` -- prevents data leaking between sessions
5. Set `enabled: !__DEV__` -- avoids polluting production data with development errors
6. Upload source maps for every release -- without them stack traces are unreadable
7. Use `captureFeedback()` instead of removed `captureUserFeedback()` -- old API removed in v7+
8. Use `enableAutoSessionTracking` instead of removed `autoSessionTracking` -- renamed in v7+
9. Use `FeedbackForm` / `showFeedbackForm()` instead of deprecated `FeedbackWidget` / `showFeedbackWidget()` -- renamed in v8.7+
10. Call `Sentry.appLoaded()` when app is ready to mark end of app start span (v8.7+)

**NEVER:**
1. Capture exceptions without context -- useless for debugging
2. Log sensitive data (passwords, tokens, PII) in tags or extra -- security and compliance risk
3. Set `tracesSampleRate: 1.0` in production -- generates excessive data and cost
4. Forget to call `Sentry.flush()` before app backgrounds -- pending events may be lost
5. Initialize Sentry inside a component render -- causes re-initialization on every render
6. Use `captureUserFeedback()` -- removed in v7, replaced by `captureFeedback()`
7. Use `FeedbackWidget` / `showFeedbackWidget()` -- deprecated in v8.7, use `FeedbackForm` / `showFeedbackForm()`
8. Use `FeedbackButton` / `showFeedbackButton()` -- deprecated in v8.7

---

## Core Patterns

### Basic Setup (Expo)

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN',
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__,
  tracesSampleRate: 0.1,
  attachScreenshot: true,
  attachViewHierarchy: true,
});

export default Sentry.wrap(App);
```

### Capture Exception with Context

```typescript
import * as Sentry from '@sentry/react-native';

try {
  await riskyOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { section: 'checkout', feature: 'payment' },
    extra: { orderId: order.id, amount: total },
  });
}
```

### Set User on Login / Clear on Logout

```typescript
import * as Sentry from '@sentry/react-native';

// On login
Sentry.setUser({ id: user.id, email: user.email });
// On logout -- ALWAYS clear
Sentry.setUser(null);
```

### Error Boundary with Fallback

```typescript
import * as Sentry from '@sentry/react-native';

<Sentry.ErrorBoundary
  fallback={({ resetError }) => <ErrorScreen onRetry={resetError} />}
  beforeCapture={(scope) => scope.setTag('boundary', 'root')}
>
  <AppNavigator />
</Sentry.ErrorBoundary>
```

### Custom Performance Span

```typescript
import * as Sentry from '@sentry/react-native';

const result = await Sentry.startSpan(
  { name: 'fetchUserData', op: 'http.client' },
  async () => {
    return await api.getUser(userId);
  },
);
```

---

## Anti-Patterns

**BAD** -- Capture without context:
```typescript
Sentry.captureException(error);
```

**GOOD** -- Include context:
```typescript
Sentry.captureException(error, {
  tags: { feature: 'payment' },
  extra: { userId: user.id, amount: total },
});
```

**BAD** -- High sampling in production:
```typescript
Sentry.init({ tracesSampleRate: 1.0, replaysSessionSampleRate: 1.0 });
```

**GOOD** -- Reasonable sampling:
```typescript
Sentry.init({
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});
```

**BAD** -- Logging sensitive data:
```typescript
Sentry.setContext('auth', { token: user.accessToken });
```

**GOOD** -- Only safe identifiers:
```typescript
Sentry.setContext('auth', { userId: user.id, method: 'oauth' });
```

**BAD** -- Using removed API:
```typescript
Sentry.captureUserFeedback({ name, email, comments, event_id });
```

**GOOD** -- Using current API:
```typescript
Sentry.captureFeedback({ name, email, message, associatedEventId });
```

**BAD** -- Using deprecated widget names (v8.7+):
```typescript
<Sentry.FeedbackWidget />
Sentry.showFeedbackWidget();
```

**GOOD** -- Using current form names:
```typescript
<Sentry.FeedbackForm />
Sentry.showFeedbackForm();
```

---

## Quick Reference

| Method | Purpose | Example |
|--------|---------|---------|
| `init()` | Initialize SDK | `Sentry.init({ dsn: '...' })` |
| `wrap()` | Wrap root component | `Sentry.wrap(App)` |
| `captureException()` | Capture error | `Sentry.captureException(error, { tags })` |
| `captureMessage()` | Capture message | `Sentry.captureMessage('msg', 'warning')` |
| `captureFeedback()` | Capture user feedback | `Sentry.captureFeedback({ name, email, message })` |
| `setUser()` | Set user context | `Sentry.setUser({ id: '123' })` |
| `setTag()` | Add searchable tag | `Sentry.setTag('feature', 'auth')` |
| `setContext()` | Add structured data | `Sentry.setContext('order', { id: 1 })` |
| `setExtra()` | Add extra data | `Sentry.setExtra('payload', data)` |
| `addBreadcrumb()` | Record event trail | `Sentry.addBreadcrumb({ category, message })` |
| `withScope()` | Isolated context | `Sentry.withScope(scope => {...})` |
| `startSpan()` | Performance span | `Sentry.startSpan({ name }, callback)` |
| `flush()` | Send pending events | `await Sentry.flush(2000)` |
| `appLoaded()` | Signal app finish loading (v8.7+) | `Sentry.appLoaded()` |
| `enableFeedbackOnShake()` | Shake-to-report feedback (v8.5+) | `Sentry.enableFeedbackOnShake()` |
| `disableFeedbackOnShake()` | Stop shake listener | `Sentry.disableFeedbackOnShake()` |
| `FeedbackForm` | Feedback form component (v8.7+) | `<Sentry.FeedbackForm />` |
| `showFeedbackForm()` | Show feedback form (v8.7+) | `Sentry.showFeedbackForm()` |
| `wrapExpoImage()` | Instrument expo-image (v8.4+) | `Sentry.wrapExpoImage(Image)` |
| `wrapExpoAsset()` | Instrument expo-asset (v8.4+) | `Sentry.wrapExpoAsset(Asset)` |
| `expoUpdatesListenerIntegration()` | Expo Updates breadcrumbs (v8.5+) | Enabled by default in Expo apps |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Full init options, Expo plugin, source maps, native init | [01-setup.md](01-setup.md) |
| captureException, setUser, breadcrumbs, scopes, feedback | [02-core-api.md](02-core-api.md) |
| Performance tracing, navigation, session replay | [03-performance.md](03-performance.md) |
| ErrorBoundary, offline events, testing, fingerprinting | [04-advanced.md](04-advanced.md) |

---
**Version:** 8.7.0 | **Source:** https://docs.sentry.io/platforms/react-native/
