# Setup & Configuration - Sentry React Native

Complete setup guide for @sentry/react-native v8.7.0 in React Native and Expo projects.

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

## Minimum Version Requirements (v8)

### iOS / macOS / tvOS

| Platform | Minimum Version |
|----------|-----------------|
| iOS | 15.0+ |
| macOS | 10.14+ |
| tvOS | 15.0+ |
| Xcode | 16.4+ |

### Android

| Requirement | Minimum Version |
|-------------|-----------------|
| Android Gradle Plugin | 7.4.0+ |
| Sentry Android Gradle Plugin | 6.0.0 |
| Kotlin | 1.8+ |

### Self-Hosted Sentry

| Requirement | Minimum Version |
|-------------|-----------------|
| Sentry Server | 25.11.1+ |

### Native SDK Dependencies (v8)

| Component | Version |
|-----------|---------|
| Cocoa SDK | v9.1.0+ |
| Sentry CLI | v3.1.0+ |
| Android Gradle Plugin | v6.0.0 |

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

### Expo Plugin Options

| Option | Type | Description |
|--------|------|-------------|
| `organization` | string | Sentry organization slug |
| `project` | string | Sentry project slug |
| `useNativeInit` | boolean | Enable native initialization for app start error capture (v8+) |

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

## Native Initialization (v8+)

Version 8 introduces native initialization to capture crashes and errors during React Native bridge setup, bundle loading, and native module initialization.

### sentry.options.json

Create `sentry.options.json` in the React Native project root with the same options as `Sentry.init()`:

```json
{
  "dsn": "YOUR_DSN",
  "environment": "production",
  "tracesSampleRate": 0.1
}
```

### iOS Native Init

Set `autoInitializeNativeSdk: false` in JS and follow the Cocoa SDK initialization:

```typescript
Sentry.init({
  dsn: 'YOUR_DSN',
  autoInitializeNativeSdk: false,
});
```

### Android Native Init

Add to `AndroidManifest.xml`:

```xml
<meta-data
  android:name="io.sentry.auto-init"
  tools:replace="android:value"
  android:value="true"
/>
```

### Expo Native Init

Use the `useNativeInit` Expo plugin option:

```json
{
  "expo": {
    "plugins": [
      [
        "@sentry/react-native/expo",
        {
          "organization": "your-org-slug",
          "project": "your-project-slug",
          "useNativeInit": true
        }
      ]
    ]
  }
}
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
| `normalizeMaxBreadth` | number | `1000` | Max object/array properties included |

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
| `propagateTraceparent` | boolean | `false` | W3C traceparent header propagation alongside sentry-trace and baggage headers |

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
| `enableCaptureFailedRequests` | boolean | `false` | HTTP error capture |
| `enableNativeNagger` | boolean | `true` | Show native nagger alert when SDK init fails |

### New in v8.3+

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `nativeInit` | boolean | `true` | Explicit control over native SDK initialization (v8.3+) |
| `onNativeLog` | function | -- | Callback to intercept and forward native SDK logs to JavaScript (v8.3+) |
| `enableAnrFingerprinting` | boolean | `true` | Enable ANR fingerprinting on Android (v8.5+) |
| `enableTombstone` | boolean | `false` | Enable tombstone crash reporting on Android 12+ (v8+) |
| `captureScreenshots` | boolean | -- | Control screenshot capture behavior in mobile replay (v8.3+) |

### Logs Options (v7.7.0+)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enableLogs` | boolean | `false` | Activate log capturing in Sentry |
| `beforeSendLog` | function | -- | Modify/filter logs before transmission |
| `logsOrigin` | string | -- | Log source: `'native'`, `'js'`, or `'all'` |

### Session Replay Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `replaysSessionSampleRate` | number | -- | Session replay sampling rate |
| `replaysOnErrorSampleRate` | number | -- | Error-triggered replay sampling rate |

### Transport Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `transport` | function | -- | Custom event transmission implementation |
| `transportOptions` | object | -- | Headers and fetch config for requests |
| `shutdownTimeout` | number | `2000` | Ms to wait for pending events before closing |

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

## Migration from v6 to v8

### Removed in v7

| Removed | Replacement |
|---------|-------------|
| `captureUserFeedback()` | `captureFeedback()` |
| `autoSessionTracking` option | `enableAutoSessionTracking` option |

### Changed in v7

| Change | Details |
|--------|---------|
| App Start span names | "Cold/Warm App Start" changed to "Cold/Warm Start" |
| Expo detection | Uses `ExpoGo` module instead of `appOwnership` |
| Minimum Expo SDK | 50+ required |
| JavaScript SDK | Updated to v10 (includes v9 + v10 breaking changes) |
| Android SDK | Updated to v8 |
| Self-hosted Sentry | 25.2.0+ required |

### New in v8

| Feature | Version | Details |
|---------|---------|---------|
| Native initialization | 8.0 | Capture app start crashes via `sentry.options.json` |
| Tombstone integration | 8.0 | Android 12+ native crash detail via `io.sentry.tombstone.enable` manifest key |
| iOS replay filtering | 8.0 | `includedViewClasses` / `excludedViewClasses` |
| Expo `useNativeInit` | 8.0 | Auto native init for app start error capture |
| `nativeInit` option | 8.3 | Explicit control over native SDK initialization |
| `onNativeLog` callback | 8.3 | Intercept and forward native SDK logs to JavaScript |
| `wrapExpoImage()` / `wrapExpoAsset()` | 8.4 | Instrument expo-image and expo-asset for performance |
| Shake-to-report feedback | 8.5 | `enableFeedbackOnShake()` / `disableFeedbackOnShake()` |
| ANR fingerprinting | 8.5 | `enableAnrFingerprinting` option on Android |
| `expoUpdatesListenerIntegration()` | 8.5 | Expo Updates lifecycle breadcrumbs (default in Expo) |
| `Sentry.appLoaded()` | 8.7 | Explicitly signal app finish loading for app start span |
| `frames.delay` span data | 8.7 | Frame delay data from native SDKs on app start / TTID / TTFD spans |
| `FeedbackForm` / `showFeedbackForm()` | 8.7 | Renamed from `FeedbackWidget` / `showFeedbackWidget()` |
| `FeedbackButton` deprecated | 8.7 | `FeedbackButton`, `showFeedbackButton`, `hideFeedbackButton` deprecated |
| Minimum iOS | 8.0 | 15.0+ (was 11.0+) |
| Minimum Xcode | 8.0 | 16.4+ |
| Cocoa SDK | 8.0 | v9.1.0+ |
| Sentry CLI | 8.0 | v3.1.0+ |
| Self-hosted Sentry | 8.0 | 25.11.1+ |

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

**Version:** 8.7.0 | **Source:** https://docs.sentry.io/platforms/react-native/configuration/options/
