# Advanced Patterns - Sentry React Native

ErrorBoundary, offline events, source maps, and testing.

---

## ErrorBoundary

React component that catches JavaScript errors in its child tree, reports them to Sentry, and renders a fallback UI.

```typescript
import * as Sentry from '@sentry/react-native';

function App(): React.JSX.Element {
  return (
    <Sentry.ErrorBoundary
      fallback={({ error, componentStack, resetError }) => (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text>Something went wrong</Text>
          <Text>{error.toString()}</Text>
          <Button title="Try Again" onPress={resetError} />
        </View>
      )}
      beforeCapture={(scope) => {
        scope.setTag('boundary', 'root');
        scope.setLevel('fatal');
      }}
      onError={(error, componentStack, eventId) => {
        console.error('ErrorBoundary caught:', error);
      }}
    >
      <AppNavigator />
    </Sentry.ErrorBoundary>
  );
}
```

### ErrorBoundary Props

| Prop | Type | Description |
|------|------|-------------|
| `fallback` | ReactNode \| `(props: FallbackProps) => ReactNode` | UI to render when error is caught |
| `beforeCapture` | `(scope: Scope, error: Error, componentStack: string) => void` | Modify scope before error is sent to Sentry |
| `onError` | `(error: Error, componentStack: string, eventId: string) => void` | Called when error is caught |
| `onMount` | `() => void` | Called on `componentDidMount` |
| `onUnmount` | `(error: Error \| null, componentStack: string \| null, eventId: string \| null) => void` | Called on `componentWillUnmount` |
| `showDialog` | boolean | Show Sentry crash report dialog |

### FallbackProps

| Property | Type | Description |
|----------|------|-------------|
| `error` | Error | The caught error |
| `componentStack` | string | React component stack trace |
| `resetError` | `() => void` | Reset the error boundary and re-render children |
| `eventId` | string | Sentry event ID for the captured error |

### Nested Error Boundaries

```typescript
import * as Sentry from '@sentry/react-native';

function App(): React.JSX.Element {
  return (
    <Sentry.ErrorBoundary
      fallback={<FullScreenError />}
      beforeCapture={(scope) => scope.setTag('boundary', 'root')}
    >
      <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Home">
            {() => (
              <Sentry.ErrorBoundary
                fallback={({ resetError }) => (
                  <ScreenError onRetry={resetError} />
                )}
                beforeCapture={(scope) => scope.setTag('boundary', 'home')}
              >
                <HomeScreen />
              </Sentry.ErrorBoundary>
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </Sentry.ErrorBoundary>
  );
}
```

---

## Offline and Buffered Events

The React Native SDK automatically buffers events when the device is offline:

- **Android**: Queued events are sent when the app restarts
- **iOS**: Queued events are sent when the next event is captured

### Controlling Cache

```typescript
Sentry.init({
  dsn: 'YOUR_DSN',
  maxCacheItems: 30, // Max envelopes cached before oldest deleted (default: 30)
});
```

### Flush Before Background

Ensure pending events are transmitted before the app enters background state:

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

## Source Maps

### Expo (EAS Build)

The Expo plugin handles source map uploads automatically during EAS builds:

```json
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

Set the auth token in your CI environment:

```bash
SENTRY_AUTH_TOKEN=your_auth_token
```

### Metro Configuration

Enable component annotation for session replays:

```javascript
// metro.config.js
const { getDefaultConfig } = require('@react-native/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');

module.exports = withSentryConfig(getDefaultConfig(__dirname), {
  annotateReactComponents: true,
});
```

### Manual Source Map Upload

For non-EAS builds, use the Sentry CLI:

```bash
npx sentry-cli sourcemaps upload \
  --org your-org \
  --project your-project \
  --release your-release-name \
  ./path/to/sourcemaps
```

---

## Event Filtering

### beforeSend

Filter or modify events before transmission:

```typescript
Sentry.init({
  dsn: 'YOUR_DSN',
  beforeSend(event, hint) {
    // Drop events from development builds
    if (event.tags?.environment === 'development') {
      return null;
    }

    // Redact email from user context
    if (event.user?.email) {
      event.user.email = '[REDACTED]';
    }

    // Drop known non-actionable errors
    const errorMessage = event.exception?.values?.[0]?.value;
    if (errorMessage?.includes('Network request failed')) {
      return null;
    }

    return event;
  },
});
```

### beforeSendTransaction

Filter performance transactions:

```typescript
Sentry.init({
  dsn: 'YOUR_DSN',
  beforeSendTransaction(event) {
    // Drop health check transactions
    if (event.transaction === '/health') {
      return null;
    }
    return event;
  },
});
```

### ignoreErrors

Drop events matching error message patterns:

```typescript
Sentry.init({
  dsn: 'YOUR_DSN',
  ignoreErrors: [
    'Network request failed',
    'AbortError',
    /ResizeObserver loop/,
  ],
});
```

---

## Touch Event Tracking

Wrap the root component with `Sentry.wrap()` to automatically capture touch events as breadcrumbs:

```typescript
import * as Sentry from '@sentry/react-native';

function App(): React.JSX.Element {
  return (
    <View>
      <AppNavigator />
    </View>
  );
}

export default Sentry.wrap(App);
```

Touch events appear as breadcrumbs with category `touch` and the component name.

---

## Testing Sentry Integration

### Verify Events Reach Sentry

```typescript
// Add a test button in development
import * as Sentry from '@sentry/react-native';

function DevTools(): React.JSX.Element | null {
  if (!__DEV__) return null;

  return (
    <View>
      <Button
        title="Test Exception"
        onPress={() => {
          Sentry.captureException(new Error('Test exception from DevTools'));
        }}
      />
      <Button
        title="Test Message"
        onPress={() => {
          Sentry.captureMessage('Test message from DevTools', 'info');
        }}
      />
      <Button
        title="Test Crash"
        onPress={() => {
          throw new Error('Test unhandled crash');
        }}
      />
    </View>
  );
}
```

### Mock Sentry in Unit Tests

```typescript
// __mocks__/@sentry/react-native.ts
export const init = jest.fn();
export const wrap = jest.fn((component) => component);
export const captureException = jest.fn();
export const captureMessage = jest.fn();
export const setUser = jest.fn();
export const setTag = jest.fn();
export const setContext = jest.fn();
export const setExtra = jest.fn();
export const addBreadcrumb = jest.fn();
export const withScope = jest.fn((callback) => callback({ setTag: jest.fn(), setLevel: jest.fn(), setExtra: jest.fn(), setFingerprint: jest.fn() }));
export const startSpan = jest.fn((_options, callback) => callback());
export const flush = jest.fn();

export const ErrorBoundary = ({ children }: { children: React.ReactNode }) => children;
```

### Test Error Capture

```typescript
import * as Sentry from '@sentry/react-native';
import { render, screen, userEvent } from '@testing-library/react-native';

jest.mock('@sentry/react-native');

describe('ErrorReporting', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('captures exception with context on API failure', async () => {
    const user = userEvent.setup();
    render(<CheckoutScreen />);

    await user.press(screen.getByRole('button', { name: 'Submit Order' }));

    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({ feature: 'checkout' }),
      }),
    );
  });
});
```

### Enable Debug Mode

```typescript
Sentry.init({
  dsn: 'YOUR_DSN',
  debug: true, // Logs SDK operations to console
});
```

---

## Fingerprinting

Control how Sentry groups errors:

```typescript
Sentry.withScope((scope) => {
  // Group all payment errors together
  scope.setFingerprint(['payment-error', paymentProvider]);
  Sentry.captureException(error);
});

// Or set default fingerprint in beforeSend
Sentry.init({
  dsn: 'YOUR_DSN',
  beforeSend(event) {
    if (event.tags?.feature === 'payment') {
      event.fingerprint = ['payment-error', event.tags.provider ?? 'unknown'];
    }
    return event;
  },
});
```

---

**Version:** 6.x | **Source:** https://docs.sentry.io/platforms/react-native/
