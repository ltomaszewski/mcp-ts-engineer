# Performance Tracing - Sentry React Native

Custom spans, navigation instrumentation, and session replay.

---

## startSpan()

Creates a span that is active within its callback and ends automatically when the callback returns.

```typescript
import * as Sentry from '@sentry/react-native';

// Synchronous
const result = Sentry.startSpan(
  { name: 'computeTotal', op: 'function' },
  () => {
    return calculateOrderTotal(items);
  },
);

// Asynchronous
const userData = await Sentry.startSpan(
  { name: 'fetchUserProfile', op: 'http.client' },
  async () => {
    const response = await api.getUser(userId);
    return response.data;
  },
);
```

### Nested Spans

```typescript
import * as Sentry from '@sentry/react-native';

const result = await Sentry.startSpan(
  { name: 'checkout', op: 'task' },
  async () => {
    const validated = await Sentry.startSpan(
      { name: 'validateCart', op: 'function' },
      async () => validateCartItems(cart),
    );

    const payment = await Sentry.startSpan(
      { name: 'processPayment', op: 'http.client' },
      async () => chargeCard(validated.total),
    );

    return { validated, payment };
  },
);
```

---

## startSpanManual()

Creates an active span that requires explicit `span.end()` to finish.

```typescript
import * as Sentry from '@sentry/react-native';

function trackFileUpload(file: File): void {
  Sentry.startSpanManual(
    { name: 'uploadFile', op: 'file.upload' },
    (span) => {
      uploadService.upload(file, {
        onProgress: (pct) => {
          span.setAttribute('upload.progress', pct);
        },
        onComplete: (result) => {
          span.setAttribute('upload.size', result.bytes);
          span.setStatus({ code: 1, message: 'ok' });
          span.end();
        },
        onError: (error) => {
          span.setStatus({ code: 2, message: error.message });
          span.end();
        },
      });
    },
  );
}
```

---

## startInactiveSpan()

Creates a span that is not active on any scope and must be ended manually. Useful for operations that run independently of the current execution context.

```typescript
import * as Sentry from '@sentry/react-native';

const span = Sentry.startInactiveSpan({
  name: 'backgroundSync',
  op: 'task',
});

await performBackgroundSync();
span.end();
```

---

## Span Configuration Options

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `name` | string | Yes | Identifies the span in Sentry UI |
| `op` | string | No | Operation type (e.g., `http.client`, `db`, `function`, `task`) |
| `startTime` | number | No | Custom start timestamp (epoch seconds) |
| `attributes` | `Record<string, Primitive>` | No | Key-value metadata attached to the span |
| `parentSpan` | Span | No | Explicit parent span reference |
| `onlyIfParent` | boolean | No | Skip creation if no parent exists |
| `forceTransaction` | boolean | No | Display as transaction in Sentry UI |

### Common Operation Types

| Op | Use Case |
|----|----------|
| `http.client` | Outgoing HTTP requests |
| `http.server` | Incoming HTTP requests |
| `db` | Database operations |
| `db.query` | Specific database queries |
| `function` | Function execution |
| `task` | Background or multi-step tasks |
| `file.upload` | File upload operations |
| `file.download` | File download operations |
| `serialize` | Data serialization |
| `ui.render` | UI rendering |

---

## Span Attributes and Methods

### Setting Attributes

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.startSpan(
  {
    name: 'processOrder',
    op: 'task',
    attributes: {
      'order.id': orderId,
      'order.items': itemCount,
      'order.currency': 'USD',
    },
  },
  async () => {
    // work
  },
);
```

### Modifying Active Span

```typescript
import * as Sentry from '@sentry/react-native';

const span = Sentry.getActiveSpan();
if (span) {
  span.setAttribute('result.status', 'success');
  span.setAttributes({ 'result.count': 42, 'result.cached': false });
  span.updateName('processOrder:completed');
  span.setHttpStatus(200);
}
```

### Span Instance Methods

| Method | Description |
|--------|-------------|
| `span.setAttribute(key, value)` | Set a single attribute |
| `span.setAttributes(attrs)` | Set multiple attributes |
| `span.updateName(name)` | Change span name |
| `span.setStatus({ code, message })` | Set span status (1=ok, 2=error) |
| `span.setHttpStatus(statusCode)` | Set HTTP status code |
| `span.end()` | End the span (manual spans only) |

---

## Utility Functions

| Function | Purpose | Example |
|----------|---------|---------|
| `getActiveSpan()` | Get current active span | `const span = Sentry.getActiveSpan()` |
| `getRootSpan(span)` | Get root ancestor of a span | `const root = Sentry.getRootSpan(activeSpan)` |
| `withActiveSpan(span, cb)` | Temporarily activate a span | `Sentry.withActiveSpan(span, () => {...})` |
| `suppressTracing(cb)` | Prevent span creation in callback | `Sentry.suppressTracing(() => fetch(...))` |

---

## React Navigation Instrumentation

### Setup

```typescript
import * as Sentry from '@sentry/react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

Sentry.init({
  dsn: 'YOUR_DSN',
  tracesSampleRate: 0.1,
  integrations: [navigationIntegration],
});

function App(): React.JSX.Element {
  const navigation = useNavigationContainerRef();

  return (
    <NavigationContainer
      ref={navigation}
      onReady={() => {
        navigationIntegration.registerNavigationContainer(navigation);
      }}
    >
      <AppNavigator />
    </NavigationContainer>
  );
}

export default Sentry.wrap(App);
```

### reactNavigationIntegration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableTimeToInitialDisplay` | boolean | `false` | Measure time-to-initial-display for each route |
| `routeChangeTimeoutMs` | number | `1000` | Time (ms) to wait for route mounting before discarding transaction |
| `ignoreEmptyBackNavigationTransactions` | boolean | `true` | Drop transactions from previously-seen routes with no spans |
| `useDispatchedActionData` | boolean | `false` | Populate transaction metadata from dispatched action data |

---

## Expo Router Instrumentation

Uses the same `reactNavigationIntegration` in the root layout.

```typescript
// app/_layout.tsx
import * as Sentry from '@sentry/react-native';
import { useNavigationContainerRef, Slot } from 'expo-router';
import { useEffect } from 'react';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

Sentry.init({
  dsn: 'YOUR_DSN',
  tracesSampleRate: 0.1,
  integrations: [navigationIntegration],
});

function RootLayout(): React.JSX.Element {
  const ref = useNavigationContainerRef();

  useEffect(() => {
    if (ref?.current) {
      navigationIntegration.registerNavigationContainer(ref);
    }
  }, [ref]);

  return <Slot />;
}

export default Sentry.wrap(RootLayout);
```

---

## Session Replay

### Setup

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN',

  // Replay sampling
  replaysSessionSampleRate: 0.1,  // 10% of sessions recorded
  replaysOnErrorSampleRate: 1.0,  // 100% of error sessions recorded

  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
      maskAllVectors: false,
    }),
  ],
});
```

### mobileReplayIntegration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `maskAllText` | boolean | `true` | Mask all text content in replay |
| `maskAllImages` | boolean | `true` | Mask all images in replay |
| `maskAllVectors` | boolean | `true` | Mask all vector graphics in replay |
| `screenshotStrategy` | `'pixelCopy'` \| `'canvas'` | `'pixelCopy'` | Android screenshot method |
| `includedViewClasses` | string[] | -- | iOS: only traverse these view classes (v8+) |
| `excludedViewClasses` | string[] | -- | iOS: exclude these view classes (v8+) |
| `beforeErrorSampling` | function | -- | Filter which error replays are captured |

### beforeErrorSampling

Filter which error replays are captured:

```typescript
Sentry.mobileReplayIntegration({
  maskAllText: true,
  maskAllImages: true,
  beforeErrorSampling: (event, hint) => {
    // Only capture replays for unhandled errors
    const isHandled = event.exception?.values?.some(
      (ex) => ex.mechanism?.handled === true,
    );
    return !isHandled; // Return false to skip replay
  },
});
```

### Sampling Rates

| Option | Description | Recommended (Production) | Recommended (Testing) |
|--------|-------------|--------------------------|----------------------|
| `replaysSessionSampleRate` | Continuous recording of all sessions | `0.1` (10%) | `1.0` (100%) |
| `replaysOnErrorSampleRate` | Buffered recording, captured on error (up to 60s pre-error) | `1.0` (100%) | `1.0` (100%) |

### Sampling Evaluation Order

1. **Session sampling** evaluates first; if triggered, continuous recording begins
2. **Error sampling** activates only if session sampling does not trigger, buffering up to one minute of events prior to the error

### Session Lifecycle

- Sessions start at SDK init or app foreground
- Sessions end after 30+ seconds in background or 60 minutes max
- Returning within 30 seconds continues the same session and `replay_id`

---

## Complete Performance Setup

```typescript
import * as Sentry from '@sentry/react-native';
import { useNavigationContainerRef } from 'expo-router';

const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: true,
});

Sentry.init({
  dsn: 'YOUR_DSN',
  enabled: !__DEV__,
  environment: __DEV__ ? 'development' : 'production',

  // Performance
  tracesSampleRate: 0.1,
  enableAutoPerformanceTracing: true,

  // Session Replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    navigationIntegration,
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
    }),
  ],
});
```

---

**Version:** 8.x | **Source:** https://docs.sentry.io/platforms/react-native/tracing/instrumentation/custom-instrumentation/
