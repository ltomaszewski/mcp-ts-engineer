# 03 -- API Reference: App Lifecycle (Constants, SplashScreen, Linking, Updates)

Runtime system information, splash screen management, deep linking, and OTA update APIs for Expo SDK 54.

---

## Constants

Provides system information that remains constant throughout the app's installation lifetime.

### Installation

```bash
npx expo install expo-constants
```

### Import

```typescript
import Constants from 'expo-constants';
```

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `expoConfig` | `ExpoConfig \| null` | Parsed app.json/app.config.ts config object |
| `executionEnvironment` | `ExecutionEnvironment` | `"bare"`, `"standalone"`, or `"storeClient"` |
| `sessionId` | `string` | Unique identifier for current app session |
| `debugMode` | `boolean` | `true` when app runs in debug/development mode |
| `isHeadless` | `boolean` | `true` when app launched in headless mode (e.g., background task) |
| `statusBarHeight` | `number` | Default status bar height in pixels |
| `systemFonts` | `string[]` | Available system font family names |
| `deviceName` | `string \| undefined` | Human-readable device name |
| `platform` | `PlatformManifest \| undefined` | Platform-specific manifest data |

### Platform-Specific Properties

**iOS** (`Constants.platform?.ios`):

| Property | Type | Description |
|----------|------|-------------|
| `buildNumber` | `string \| null` | `CFBundleVersion` from Info.plist |
| `platform` | `string` | Apple internal model identifier (e.g., `"iPhone14,5"`) |
| `systemVersion` | `string` | iOS version string |
| `userInterfaceIdiom` | `UserInterfaceIdiom` | `"handset"`, `"tablet"`, `"desktop"`, `"tv"` |

**Android** (`Constants.platform?.android`):

| Property | Type | Description |
|----------|------|-------------|
| `versionCode` | `number` | `android.versionCode` from app config |

### Methods

| Method | Return | Description |
|--------|--------|-------------|
| `getWebViewUserAgentAsync()` | `Promise<string \| null>` | Web view user agent string |

### Usage Example

```typescript
import Constants from 'expo-constants';

// Access custom config values
const apiUrl = Constants.expoConfig?.extra?.apiUrl;

// Check execution environment
if (Constants.executionEnvironment === 'storeClient') {
  console.log('Running in Expo Go');
}

// Get platform info
const iosVersion = Constants.platform?.ios?.systemVersion;
const isTablet = Constants.platform?.ios?.userInterfaceIdiom === 'tablet';

// Status bar height (useful for custom headers)
const statusBarHeight = Constants.statusBarHeight;
```

**Source:** https://docs.expo.dev/versions/latest/sdk/constants/

---

## SplashScreen

Controls the visibility of the native splash screen during app startup. Keeps splash visible while loading fonts, assets, or making API calls.

### Installation

```bash
npx expo install expo-splash-screen
```

### Methods

| Method | Return | Description |
|--------|--------|-------------|
| `preventAutoHideAsync()` | `Promise<boolean>` | Keeps splash visible until explicitly hidden. **Call at module scope.** |
| `hideAsync()` | `Promise<void>` | Hides the splash screen (async, backward compatible) |
| `hide()` | `void` | Hides the splash screen (synchronous, SDK 54+) |
| `setOptions(options)` | `void` | Configure animation behavior |

### SplashScreenOptions

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `duration` | `number` | `400` | Animation duration in milliseconds |
| `fade` | `boolean` | `false` | Enable fade animation (iOS only) |

### App.json Configuration

```json
{
  "expo": {
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    }
  }
}
```

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `backgroundColor` | `string` | `"#ffffff"` | Hex background color |
| `image` | `string` | -- | Path to splash image |
| `imageWidth` | `number` | `100` | Image width |
| `resizeMode` | `enum` | -- | `"contain"`, `"cover"`, or `"native"` |
| `dark` | `object` | -- | Dark mode overrides (`image`, `backgroundColor`) |

### Usage Pattern

```typescript
import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';

// IMPORTANT: Call at module scope, NOT inside a component
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [appIsReady, setAppIsReady] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync({
          'Inter-Bold': require('./assets/fonts/Inter-Bold.otf'),
        });
        // Any other async initialization here
      } catch (e) {
        console.warn(e);
      } finally {
        setAppIsReady(true);
      }
    }
    prepare();
  }, []);

  const onLayoutRootView = useCallback(() => {
    if (appIsReady) {
      SplashScreen.hide(); // SDK 54: synchronous hide()
    }
  }, [appIsReady]);

  if (!appIsReady) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      {/* App content */}
    </View>
  );
}
```

**Source:** https://docs.expo.dev/versions/latest/sdk/splash-screen/

---

## Linking

Create and handle deep links, open URLs, and manage URL scheme navigation.

### Installation

```bash
npx expo install expo-linking
```

### Methods

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `createURL(path, options?)` | `path: string`, `options?: CreateURLOptions` | `string` | Create deep link for your app |
| `parse(url)` | `url: string` | `ParsedURL` | Parse deep link into components |
| `openURL(url)` | `url: string` | `Promise<true>` | Open URL in appropriate app |
| `openSettings()` | -- | `Promise<void>` | Open OS app settings page |
| `canOpenURL(url)` | `url: string` | `Promise<boolean>` | Check if any app can handle URL |
| `getInitialURL()` | -- | `Promise<string \| null>` | URL that launched the app |
| `getLinkingURL()` | -- | `string \| null` | Current linking URL (synchronous) |

### Hooks

| Hook | Return | Description |
|------|--------|-------------|
| `useURL()` | `string \| null` | Initial URL + listens for subsequent changes |
| `useLinkingURL()` | `string \| null` | Preferred alternative to `useURL()` |

### Events

| Method | Description |
|--------|-------------|
| `addEventListener('url', handler)` | Listen for incoming deep link events. Returns subscription with `.remove()` |

### Types

```typescript
interface CreateURLOptions {
  scheme?: string;
  queryParams?: Record<string, string>;
  isTripleSlashed?: boolean;
}

interface ParsedURL {
  hostname: string | null;
  path: string | null;
  scheme: string | null;
  queryParams: Record<string, undefined | string | string[]>;
}
```

### App.json Configuration

```json
{
  "expo": {
    "scheme": "myapp"
  }
}
```

### Usage Example

```typescript
import * as Linking from 'expo-linking';
import { useEffect } from 'react';

// Create deep links
const url = Linking.createURL('profile/123', {
  queryParams: { tab: 'posts' },
});
// → myapp://profile/123?tab=posts

// Parse incoming deep links
const parsed = Linking.parse('myapp://profile/123?tab=posts');
// → { scheme: 'myapp', path: 'profile/123', queryParams: { tab: 'posts' } }

// Open external URLs
await Linking.openURL('https://expo.dev');

// Open app settings (for permission re-enable)
await Linking.openSettings();

// Listen for incoming links
function App() {
  const url = Linking.useURL();

  useEffect(() => {
    if (url) {
      const { path, queryParams } = Linking.parse(url);
      // Handle deep link navigation
    }
  }, [url]);

  return null;
}
```

**Source:** https://docs.expo.dev/versions/latest/sdk/linking/

---

## Updates

Manage OTA (over-the-air) updates for JavaScript and asset bundles. Integrates with EAS Update for hosted update management.

### Installation

```bash
npx expo install expo-updates
```

### Methods

| Method | Return | Description |
|--------|--------|-------------|
| `checkForUpdateAsync()` | `Promise<UpdateCheckResult>` | Query server for available updates (does not download) |
| `fetchUpdateAsync()` | `Promise<UpdateFetchResult>` | Download latest update to device storage |
| `reloadAsync(options?)` | `Promise<void>` | Reload app with most recently downloaded update |
| `setUpdateRequestHeadersOverride(headers)` | `void` | Override headers sent with update requests at runtime |
| `setExtraParamAsync(key, value)` | `Promise<void>` | Set extra parameters in update requests |
| `readLogEntriesAsync(maxAge?)` | `Promise<LogEntry[]>` | Read expo-updates logs (default: 1 hour) |
| `clearLogEntriesAsync()` | `Promise<void>` | Clear expo-updates log entries |

### Hooks

```typescript
import { useUpdates } from 'expo-updates';

const {
  currentlyRunning,     // Active app/update details
  isUpdateAvailable,    // New version detected
  isUpdatePending,      // Downloaded and ready to apply
  isChecking,           // Check in progress
  isDownloading,        // Download in progress
  downloadProgress,     // Number 0-1 tracking download (SDK 54+)
  checkError,           // Error from check
  downloadError,        // Error from download
} = useUpdates();
```

### Constants

| Property | Type | Description |
|----------|------|-------------|
| `Updates.updateId` | `string \| null` | UUID of current update |
| `Updates.runtimeVersion` | `string \| null` | Native runtime compatibility identifier |
| `Updates.channel` | `string \| null` | EAS Update channel name |
| `Updates.isEmbeddedLaunch` | `boolean` | Current update is bundled, not downloaded |
| `Updates.isEmergencyLaunch` | `boolean` | Fallback to embedded after failed updates |
| `Updates.isEnabled` | `boolean` | Library is enabled and functional |
| `Updates.createdAt` | `Date \| null` | Update creation timestamp |

### Result Types

```typescript
// Check result
type UpdateCheckResult =
  | { isAvailable: true; manifest: object }      // Update found
  | { isAvailable: false; reason: string }        // No update
  | { isRollBack: true };                         // Rollback directive

// Fetch result
type UpdateFetchResult =
  | { isNew: true; manifest: object }             // Downloaded successfully
  | { isNew: false }                              // No new update
  | { isRollBackToEmbedded: true };               // Rolled back
```

### App.json Configuration

```json
{
  "expo": {
    "runtimeVersion": { "policy": "fingerprint" },
    "updates": {
      "url": "https://u.expo.dev/your-project-id",
      "enabled": true,
      "checkAutomatically": "ON_LOAD"
    }
  }
}
```

### Runtime Version Policies

| Policy | Derivation | Use When |
|--------|-----------|----------|
| `"appVersion"` | From `version` field | Custom native code; manual version tracking |
| `"nativeVersion"` | `version` + build numbers | Every upload has unique runtime version |
| `"fingerprint"` | Hash of entire project state | Default; works with and without custom native code |

### Usage Example

```typescript
import * as Updates from 'expo-updates';
import { useUpdates } from 'expo-updates';
import { useEffect } from 'react';
import { Alert, Button, View } from 'react-native';

export function UpdateChecker() {
  const {
    isUpdateAvailable,
    isUpdatePending,
    isDownloading,
    downloadProgress,
  } = useUpdates();

  useEffect(() => {
    if (isUpdatePending) {
      Alert.alert(
        'Update Ready',
        'Restart to apply the update?',
        [
          { text: 'Later', style: 'cancel' },
          { text: 'Restart', onPress: () => Updates.reloadAsync() },
        ]
      );
    }
  }, [isUpdatePending]);

  const handleCheckUpdate = async () => {
    try {
      const result = await Updates.checkForUpdateAsync();
      if (result.isAvailable) {
        await Updates.fetchUpdateAsync();
      } else {
        Alert.alert('Up to date', 'No new updates available.');
      }
    } catch (error) {
      console.error('Update check failed:', error);
    }
  };

  return (
    <View>
      <Button title="Check for Updates" onPress={handleCheckUpdate} />
      {isDownloading && (
        <Text>Downloading: {Math.round(downloadProgress * 100)}%</Text>
      )}
    </View>
  );
}
```

### Error Codes

| Code | Meaning |
|------|---------|
| `ERR_UPDATES_DISABLED` | Library disabled or in development mode |
| `ERR_UPDATES_RELOAD` | Failed app reload |
| `ERR_UPDATES_CHECK` | Update check failure |
| `ERR_UPDATES_FETCH` | Download failure |

**Source:** https://docs.expo.dev/versions/latest/sdk/updates/

---

**Version:** Expo SDK 54 (~54.0.33) | React Native 0.81.5 | React 19.1.0 | **Source:** https://docs.expo.dev/versions/latest/sdk/constants/, https://docs.expo.dev/versions/latest/sdk/splash-screen/, https://docs.expo.dev/versions/latest/sdk/linking/, https://docs.expo.dev/versions/latest/sdk/updates/
