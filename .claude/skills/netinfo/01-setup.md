# Setup Guide: @react-native-community/netinfo

**Installation, configuration, and platform-specific setup for React Native NetInfo**

## Table of Contents

1. [Installation](#installation)
2. [Platform-Specific Setup](#platform-specific-setup)
3. [Manual Linking](#manual-linking)
4. [React Native Compatibility](#react-native-compatibility)
5. [Browser Compatibility](#browser-compatibility)
6. [Node Compatibility](#node-compatibility)
7. [Migration from Core React Native](#migration-from-core-react-native)
8. [Initial Configuration](#initial-configuration)

---

## Installation

### Via Yarn (Recommended)

```bash
yarn add @react-native-community/netinfo
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#getting-started

### Via NPM

```bash
npm install --save @react-native-community/netinfo
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#getting-started

### Auto-Linking (React Native 0.60+)

For React Native 0.60 and above, manual linking is **not required**. The library uses React Native's built-in auto-linking feature to automatically integrate with your project during the build process.

---

## Platform-Specific Setup

### iOS Platform

#### Using CocoaPods (Recommended)

After installing the package, run:

```bash
npx pod-install
```

**Why**: iOS uses CocoaPods to manage native dependencies. This command installs the native pods required by `@react-native-community/netinfo`.

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#using-react-native--060

#### Configuration for SSID/BSSID Retrieval (Optional)

If you need to retrieve WiFi SSID and BSSID information, your app must meet **at least one** of these requirements:

1. **Location Permission**: Declare `NSLocationWhenInUseUsageDescription` in your `Info.plist`
2. **Local Network Permission**: For iOS 14.5+, declare `NSLocalNetworkUsageDescription` in your `Info.plist`
3. **Bluetooth Permission**: For tvOS, declare `NSBluetoothAlwaysAndWhenInUseUsageDescription`

Then, when setting up the hook or calling methods, set `shouldFetchWiFiSSID: true`:

```javascript
import { useNetInfo } from '@react-native-community/netinfo';

const netInfo = useNetInfo({
  shouldFetchWiFiSSID: true
});
```

**⚠️ Warning**: Setting this option without meeting the above requirements will leak memory on iOS.

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#type-is-wifi

### Android Platform

#### AndroidX Configuration

Modify your `android/build.gradle` file to ensure proper SDK configuration:

```gradle
buildscript {
  ext {
    buildToolsVersion = "xx.yy.zz"
    minSdkVersion = xyz
    compileSdkVersion = xyz
    targetSdkVersion = xyz
  }
  // ... rest of your config
}
```

**Required Values**:
- `buildToolsVersion`: Match your Android build tools (e.g., "33.0.0")
- `minSdkVersion`: Minimum supported version (recommended: 21+)
- `compileSdkVersion`: Target Android API level (recommended: 33+)
- `targetSdkVersion`: Should match compileSdkVersion

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#android-platform-with-androidx

#### Permissions for SSID/BSSID Retrieval

Add the following permission to your `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

Additionally, request this permission at runtime using your app's runtime permission system.

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#type-is-wifi

#### WiFi State Permission

To read the `isWifiEnabled` property:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

### macOS Platform

#### Manual Linking Required

Autolinking is **not yet available** on macOS. Follow these steps:

1. **Open Xcode**

```bash
open macos/YourProject.xcodeproj
```

2. **Add Library Project**
   - Right-click on the "Libraries" folder in the left panel
   - Select "Add files to 'YourProject'"
   - Navigate to `node_modules/@react-native-community/react-native-netinfo/macos`
   - Select `RNCNetInfo.xcodeproj` and click "Add"

3. **Link Binary with Libraries**
   - Select your project in the left panel
   - Go to "Build Phases" tab
   - Expand "Link Binary With Libraries"
   - Click the "+" button
   - Select `libRNCNetInfo-macOS.a`
   - Click "Add"

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#macos-platform

### Windows Platform

#### Auto-Linking

For `react-native-windows` version **0.63 or newer**, auto-linking works automatically. No manual configuration required.

#### System Requirements

- **Minimum RNW Version**: 0.63 or newer
- **MSVC Build Tools**: v142 (included in Visual Studio 2019) or newer
- **Supported Architectures**: x86, x64, arm64 (32-bit arm is **not** supported)

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#windows-platform

### Web Platform

No platform-specific setup required. The library uses the standard **Network Information API** when available and gracefully falls back to basic `navigator.onLine` status.

**Browser Support**: The Network Information API is experimental and not supported in all browsers. See [Browser Compatibility](#browser-compatibility) for details.

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#browser-compatilibity

---

## Manual Linking

### When to Use Manual Linking

Manual linking is required in these scenarios:

- **React Native < 0.60**: Auto-linking not available
- **macOS platform**: No auto-linking support yet
- **Custom configurations**: Non-standard build setup

### iOS Manual Linking

1. Open your project in Xcode
2. Go to "Build Phases" → "Link Binary with Libraries"
3. Click "+" and find and select `RNCNetInfo.xcodeproj`
4. Run `npx pod-install` to install CocoaPods dependencies

### Android Manual Linking

For React Native < 0.60, edit `android/app/build.gradle`:

```gradle
dependencies {
    // ... other dependencies
    implementation project(':react-native-netinfo')
}
```

Also add to `android/settings.gradle`:

```gradle
include ':react-native-netinfo'
project(':react-native-netinfo').projectDir = new File(rootProject.projectDir, '../node_modules/@react-native-community/netinfo/android')
```

---

## React Native Compatibility

| NetInfo Version | Minimum React Native | Status |
|-----------------|----------------------|--------|
| 11.x | 0.60+ | ✓ Current |
| 10.x | 0.60+ | ✓ Supported |
| 9.x and below | 0.60+ | ⚠️ Deprecated |
| Pre-0.60 versions | < 0.60 | ✗ Not supported |

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#react-native-compatibility

### Checking Your React Native Version

```bash
react-native --version
# or
npm list react-native
```

If your version is below 0.60, you must upgrade React Native before using current versions of NetInfo.

---

## Browser Compatibility

### Network Information API Support

The library relies on the experimental **Network Information API** for detailed network information. Not all browsers support this API.

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 61+ | ✓ Supported | Full Network Information API |
| Edge 79+ | ✓ Supported | Full Network Information API |
| Firefox | ⚠️ Partial | Requires about:config changes |
| Safari | ✗ Not supported | Falls back to `navigator.onLine` |
| Internet Explorer | ✗ Not supported | Falls back to `navigator.onLine` |

### AbortController Support

The library uses `AbortController` to cancel network requests. Browser support:

| Browser | Support | Notes |
|---------|---------|-------|
| Chrome 63+ | ✓ Yes | |
| Firefox 55+ | ✓ Yes | |
| Safari 11.1+ | ✓ Yes | |
| Edge 16+ | ✓ Yes | |
| Internet Explorer 11 | ✗ No | No AbortController support |

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#browser-compatilibity

### Graceful Fallback

If the Network Information API is unavailable, the library automatically falls back to the basic `navigator.onLine` property, providing minimal but functional network state information.

---

## Node Compatibility

**Minimum Node Version**: v16+

`AbortController` is required for the library to function properly and is only available in Node.js stable versions v16 and above.

```bash
node --version
# Should output v16.0.0 or higher
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#node-compatibility

---

## Migration from Core React Native

### Before (Core React Native)

```javascript
import { NetInfo } from 'react-native';

NetInfo.getConnectionInfo().then((connectionInfo) => {
  console.log('Type: ' + connectionInfo.type);
  console.log('Effective Type: ' + connectionInfo.effectiveType);
});
```

**Source**: https://archive.reactnative.dev/docs/0.50/netinfo

### After (@react-native-community/netinfo)

```javascript
import NetInfo from '@react-native-community/netinfo';

NetInfo.fetch().then((state) => {
  console.log('Type: ' + state.type);
  console.log('Is Connected: ' + state.isConnected);
});
```

### What Changed

| Aspect | Before | After |
|--------|--------|-------|
| Import | `import { NetInfo } from 'react-native'` | `import NetInfo from '@react-native-community/netinfo'` |
| Get info | `getConnectionInfo()` | `fetch()` |
| Property | `type`, `effectiveType` | `type`, `isConnected`, `isInternetReachable` |
| Listeners | `addEventListener('connectionChange', ...)` | `addEventListener((state) => {...})` |
| Hooks | Not available | `useNetInfo()` hook |
| Details | Limited | Extensive platform-specific data |

### Backward Compatibility

The old API still works for backward compatibility, but the new API is recommended for all new code.

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#migrating-from-the-core-react-native-module

---

## Initial Configuration

### Basic Setup

```javascript
import NetInfo from '@react-native-community/netinfo';

// Optional: Configure on app start
NetInfo.configure({
  reachabilityUrl: 'https://clients3.google.com/generate_204',
  reachabilityTest: async (response) => response.status === 204,
  shouldFetchWiFiSSID: false
});

// Now use NetInfo anywhere in your app
export default NetInfo;
```

### Using in React Components

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

export const NetworkStatus = () => {
  const netInfo = useNetInfo();

  return (
    <View>
      <Text>Type: {netInfo.type}</Text>
      <Text>Connected: {netInfo.isConnected ? 'Yes' : 'No'}</Text>
      <Text>Internet: {netInfo.isInternetReachable ? 'Yes' : 'No'}</Text>
    </View>
  );
};
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#usage

---

## Verification Checklist

- [ ] Package installed via `yarn add` or `npm install`
- [ ] `npx pod-install` run on macOS/iOS
- [ ] Platform-specific permissions added to manifests
- [ ] React Native version is 0.60 or higher
- [ ] Node version is v16 or higher
- [ ] First import test successful
- [ ] No TypeScript errors (if using TypeScript)

---

**Source Repository**: https://github.com/react-native-netinfo/react-native-netinfo
