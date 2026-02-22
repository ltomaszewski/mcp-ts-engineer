# Setup & Configuration - Sentry React Native

Complete setup guide for @sentry/react-native v6.x in React Native and Expo projects.

---

## Installation

### Automatic (Recommended)

```bash
npx @sentry/wizard@latest -i reactNative
```

The wizard configures Metro, Expo plugin, Android Gradle, and Xcode build phases automatically.

### Manual

```bash
npm install @sentry/react-native
# or
npx expo install @sentry/react-native
```

---

## Expo Plugin Configuration

Add to `app.json` or `app.config.js`:

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

---

## Basic Initialization

Initialize as early as possible, before any other code:

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN',
  environment: __DEV__ ? 'development' : 'production',
  enabled: !__DEV__,
  tracesSampleRate: 0.1,
});

export default Sentry.wrap(App);
```

---

## Sentry.init() Options

### Core Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `dsn` | string | -- | Project DSN endpoint (required) |
| `enabled` | boolean | `true` | Enable/disable event transmission |
| `debug` | boolean | `false` | Enable debug output for troubleshooting |
| `environment` | string | -- | Deployment context (e.g., `'production'`, `'staging'`) |
| `release` | string | -- | Application release version string |
| `dist` | string | -- | Distribution identifier (max 64 chars) |
| `sampleRate` | number | `1.0` | Error event sampling rate (0.0-1.0) |
| `maxBreadcrumbs` | number | `100` | Max breadcrumbs to capture |
| `maxCacheItems` | number | `30` | Max cached envelopes before deletion |
| `attachStacktrace` | boolean | `true` | Attach stack traces to all messages |
| `sendDefaultPii` | boolean | `false` | Include PII from integrations |
| `maxValueLength` | number | `250` | Truncation limit for single values |
| `normalizeDepth` | number | `3` | Tree-walking depth for context normalization |

### Error Filtering

| Option | Type | Description |
|--------|------|-------------|
| `ignoreErrors` | string[] | Patterns filtering error messages from reporting |
| `ignoreTransactions` | string[] | Patterns excluding transaction names |
| `denyUrls` | string[] | URL patterns blocking error reporting |
| `allowUrls` | string[] | URL patterns permitting error reporting |
| `beforeSend` | function | Modify/filter events before sending; return `null` to drop |
| `beforeSendTransaction` | function | Modify/filter transactions before sending |
| `beforeBreadcrumb` | function | Modify/filter breadcrumbs; return `null` to drop |

### Tracing Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tracesSampleRate` | number | -- | Transaction sampling rate (0.0-1.0) |
| `tracesSampler` | function | -- | Dynamic per-transaction sampling function |
| `tracePropagationTargets` | string[] | -- | URL patterns receiving trace headers |
| `enableAutoPerformanceTracing` | boolean | `true` | Automatic performance monitoring |

### React Native Specific Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableNative` | boolean | `true` | Enable native SDK and crash handling |
| `autoInitializeNativeSdk` | boolean | `true` | Auto-init native SDK layer |
| `enableNativeCrashHandling` | boolean | `true` | Capture hard crashes from native code |
| `enableAutoSessionTracking` | boolean | `true` | Release health session tracking |
| `sessionTrackingIntervalMillis` | number | `30000` | Background duration (ms) before session end |
| `attachScreenshot` | boolean | `false` | Capture screenshot on errors |
| `attachViewHierarchy` | boolean | `false` | Include JSON view hierarchy on errors |
| `enableWatchdogTerminationTracking` | boolean | `true` | iOS out-of-memory tracking |
| `enableNdkScopeSync` | boolean | `true` | Java-to-NDK scope sync (Android) |
| `attachThreads` | boolean | `false` | Auto-attach all threads (Android) |
| `onReady` | function | -- | Callback after native SDK init completes |

### Session Replay Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `replaysSessionSampleRate` | number | -- | Session replay sampling rate |
| `replaysOnErrorSampleRate` | number | -- | Error-triggered replay sampling rate |

---

## Production Configuration Example

```typescript
import * as Sentry from '@sentry/react-native';

Sentry.init({
  dsn: 'YOUR_DSN',
  enabled: !__DEV__,
  environment: __DEV__ ? 'development' : 'production',

  // Error sampling
  sampleRate: 1.0,

  // Performance sampling
  tracesSampleRate: 0.1,
  enableAutoPerformanceTracing: true,

  // Session replay
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.mobileReplayIntegration({
      maskAllText: true,
      maskAllImages: true,
    }),
  ],

  // Enrichment
  attachScreenshot: true,
  attachViewHierarchy: true,

  // Filtering
  ignoreErrors: ['Network request failed'],
  beforeSend(event) {
    if (event.exception?.values?.[0]?.type === 'IgnorableError') {
      return null; // Drop event
    }
    return event;
  },
});

export default Sentry.wrap(App);
```

---

## Metro Configuration (Source Maps)

Add Sentry Metro plugin in `metro.config.js`:

```javascript
const { getDefaultConfig } = require('@react-native/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');

module.exports = withSentryConfig(getDefaultConfig(__dirname), {
  annotateReactComponents: true, // Adds component names to session replays
});
```

---

## Verification

Throw a test error to confirm events reach Sentry:

```typescript
<Button
  title="Test Sentry"
  onPress={() => {
    throw new Error('Sentry test error');
  }}
/>
```

Check the Sentry dashboard for the event within 30 seconds.

---

**Version:** 6.x | **Source:** https://docs.sentry.io/platforms/react-native/configuration/options/
