# Setup Guide: @react-native-community/netinfo

Installation, configuration, and platform-specific setup for React Native NetInfo v12.x.

---

## Installation

### Via NPM

```bash
npm install @react-native-community/netinfo
```

### Via Yarn

```bash
yarn add @react-native-community/netinfo
```

### Via Expo

```bash
npx expo install @react-native-community/netinfo
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#getting-started

### Auto-Linking (React Native 0.60+)

For React Native 0.60 and above, manual linking is **not required**. The library uses React Native's built-in auto-linking feature.

---

## Minimum Requirements (v12)

| Requirement | Version |
|-------------|---------|
| iOS | 14.0+ |
| React Native | 0.76+ |
| Node.js | v16+ |

### Breaking Change in v12

v12.0.0 raises the iOS minimum deployment target to **iOS 14+** (aligning with React Native 0.76+). The library now uses `NEHotspotNetwork` instead of the deprecated `CNCopyCurrentNetworkInfo` for retrieving WiFi information on iOS.

**Source**: https://github.com/react-native-netinfo/react-native-netinfo/releases

---

## Platform-Specific Setup

### iOS Platform

#### CocoaPods (Required)

After installing the package, run:

```bash
npx pod-install
```

#### Access Wi-Fi Information Entitlement (v12 Requirement)

In v12, WiFi information retrieval on iOS uses `NEHotspotNetwork`, which requires the **Access Wi-Fi Information** entitlement. Without it, WiFi details (SSID, BSSID) return nil.

To enable:
1. Open your Xcode project
2. Go to **Signing & Capabilities** tab
3. Click **+ Capability**
4. Add **Access WiFi Information**

#### Configuration for SSID/BSSID Retrieval

If you need to retrieve WiFi SSID and BSSID information, your app must meet **at least one** of these requirements:

1. **Access Wi-Fi Information entitlement** (required in v12)
2. **Location Permission**: Declare `NSLocationWhenInUseUsageDescription` in `Info.plist`
3. **Local Network Permission** (iOS 14.5+): Declare `NSLocalNetworkUsageDescription` in `Info.plist`

Then pass `shouldFetchWiFiSSID: true`:

```typescript
import { useNetInfo } from '@react-native-community/netinfo';

const netInfo = useNetInfo({
  shouldFetchWiFiSSID: true,
});
```

**Warning**: Setting `shouldFetchWiFiSSID: true` without meeting the above requirements will leak memory on iOS.

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#type-is-wifi

### Android Platform

#### Permissions

Add to `AndroidManifest.xml`:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />
```

For SSID/BSSID retrieval, also add:

```xml
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

And request the location permission at runtime:

```typescript
import { PermissionsAndroid } from 'react-native';

async function requestWiFiPermission(): Promise<boolean> {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
    {
      title: 'WiFi Details',
      message: 'App needs location permission to access WiFi details',
      buttonPositive: 'Grant',
    },
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}
```

#### AndroidX Configuration

Ensure your `android/build.gradle` has appropriate SDK configuration:

```gradle
buildscript {
  ext {
    buildToolsVersion = "35.0.0"
    minSdkVersion = 24
    compileSdkVersion = 35
    targetSdkVersion = 35
  }
}
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#android-platform-with-androidx

### macOS Platform

Autolinking is **not available** on macOS. Manual linking is required:

1. Open your Xcode project: `open macos/YourProject.xcodeproj`
2. Right-click "Libraries" and add `RNCNetInfo.xcodeproj` from `node_modules/@react-native-community/react-native-netinfo/macos`
3. In "Build Phases" > "Link Binary With Libraries", add `libRNCNetInfo-macOS.a`

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#macos-platform

### Windows Platform

For `react-native-windows` v0.63+, auto-linking works automatically.

**Requirements**:
- Minimum RNW: 0.63+
- MSVC Build Tools: v142+
- Supported architectures: x86, x64, arm64 (32-bit arm not supported)

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#windows-platform

### Web Platform

No platform-specific setup required. Uses the Network Information API when available, falls back to `navigator.onLine`.

---

## Initial Configuration

### Basic Setup

```typescript
import NetInfo from '@react-native-community/netinfo';

// Optional: Configure on app start
NetInfo.configure({
  reachabilityUrl: 'https://clients3.google.com/generate_204',
  reachabilityTest: async (response) => response.status === 204,
  shouldFetchWiFiSSID: false,
});
```

### Using in React Components

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { useNetInfo } from '@react-native-community/netinfo';

export function NetworkStatus(): React.JSX.Element {
  const netInfo = useNetInfo();

  return (
    <View>
      <Text>Type: {netInfo.type}</Text>
      <Text>Connected: {netInfo.isConnected === true ? 'Yes' : 'No'}</Text>
      <Text>Internet: {netInfo.isInternetReachable === true ? 'Yes' : 'No'}</Text>
    </View>
  );
}
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#usage

---

## React Native Compatibility

| NetInfo Version | Minimum React Native | Minimum iOS | Status |
|-----------------|----------------------|-------------|--------|
| 12.x | 0.76+ | iOS 14+ | Current |
| 11.x | 0.60+ | iOS 11+ | Supported |
| 10.x | 0.60+ | iOS 11+ | Supported |
| 9.x and below | 0.60+ | -- | Deprecated |

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#react-native-compatibility

---

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome 61+ | Supported | Full Network Information API |
| Edge 79+ | Supported | Full Network Information API |
| Firefox | Partial | Requires about:config changes |
| Safari | Not supported | Falls back to `navigator.onLine` |
| Internet Explorer | Not supported | Falls back to `navigator.onLine` |

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#browser-compatilibity

---

## Migration from v11 to v12

### Breaking Changes

| Change | Details |
|--------|---------|
| iOS minimum | Raised to iOS 14+ (was iOS 11+) |
| React Native minimum | 0.76+ required |
| WiFi API | Uses `NEHotspotNetwork` instead of deprecated `CNCopyCurrentNetworkInfo` |
| Entitlement | Access Wi-Fi Information entitlement required for WiFi details on iOS |
| NetworkExtension | NetworkExtension framework required on iOS (v12.0.1 fix) |

### Migration Steps

1. Update your iOS deployment target to 14.0+ in Xcode
2. Add the Access Wi-Fi Information entitlement in Xcode capabilities
3. Ensure NetworkExtension framework is linked
4. Run `npx pod-install` to update native dependencies
5. Verify WiFi SSID/BSSID retrieval still works

---

## Verification Checklist

- [ ] Package installed
- [ ] `npx pod-install` run on iOS
- [ ] iOS deployment target >= 14.0
- [ ] Access Wi-Fi Information entitlement added (if using WiFi details)
- [ ] Android permissions added to AndroidManifest.xml
- [ ] React Native version is 0.76+
- [ ] Node version is v16+
- [ ] First import test successful

---

**Version:** 12.x | **Source:** https://github.com/react-native-netinfo/react-native-netinfo
