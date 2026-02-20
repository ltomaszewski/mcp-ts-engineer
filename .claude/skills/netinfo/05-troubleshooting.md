# Troubleshooting & Platform Issues: @react-native-community/netinfo

## Android Build Errors

### Issue: Build Fails with Gradle Error

**Error Message:**
```
FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':app:compileDebugJavaWithJavac'.
> Incompatible types: NetInfoState cannot be converted to Object
```

**Solution**:

Verify your `android/build.gradle` configuration:

```gradle
buildscript {
  ext {
    buildToolsVersion = "33.0.0"
    minSdkVersion = 21
    compileSdkVersion = 33
    targetSdkVersion = 33
  }
  
  dependencies {
    classpath "com.android.tools.build:gradle:7.4.2"
  }
}
```

**Key Points**:
- Ensure `minSdkVersion` is 21 or higher
- Match `compileSdkVersion` and `targetSdkVersion`
- Use Gradle 7.x or higher
- Clean build: `./gradlew clean build`

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#getting-started

---

### Issue: Missing Permissions at Runtime

**Error Message:**
```
No permission to access WiFi information
Error: Call requires permission which may be rejected
```

**Solution**:

Request permissions dynamically on Android 6.0+:

```javascript
import { PermissionsAndroid } from 'react-native';

async function requestWiFiPermission() {
  try {
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      {
        title: 'WiFi Permission',
        message: 'App needs location permission to access WiFi details',
        buttonPositive: 'Grant',
        buttonNegative: 'Deny'
      }
    );
    
    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (err) {
    console.error('Permission request failed:', err);
    return false;
  }
}
```

---

## Jest Testing Configuration

### Setup: Configure Jest

**1. Add Jest Setup File to `package.json`:**

```json
{
  "jest": {
    "setupFiles": ["<rootDir>/jest.setup.js"],
    "preset": "react-native"
  }
}
```

**2. Create `jest.setup.js`:**

```javascript
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#errors-while-running-jest-tests

### Example Test Suite

```javascript
import { render, screen } from '@testing-library/react-native';
import { useNetInfo } from '@react-native-community/netinfo';
import MyComponent from './MyComponent';

jest.mock('@react-native-community/netinfo');

describe('MyComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('displays online content when connected', () => {
    useNetInfo.mockReturnValue({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      isWifiEnabled: true,
      details: {
        ssid: 'TestWiFi',
        isConnectionExpensive: false
      }
    });

    render(<MyComponent />);
    expect(screen.getByText('Online')).toBeTruthy();
  });

  it('displays offline content when disconnected', () => {
    useNetInfo.mockReturnValue({
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
      isWifiEnabled: false,
      details: null
    });

    render(<MyComponent />);
    expect(screen.getByText('Offline')).toBeTruthy();
  });
});
```

---

## iOS Simulator Issues

### Issue: Network Changes Not Detected in Simulator

**Problem**: 
- App doesn't receive network state change notifications
- `addEventListener` callbacks not firing when network changes

**Root Cause**:
iOS Simulator has a known limitation with the `SCNetworkReachability` API.

**Solution - Device Testing**:

Always test network functionality on **actual iOS devices**. The simulator uses the host Mac's network and doesn't properly simulate network disconnection.

```javascript
import { Platform } from 'react-native';

const useNetworkDetection = () => {
  useEffect(() => {
    if (Platform.OS === 'ios' && __DEV__) {
      console.warn('⚠️ Network detection is unreliable on iOS Simulator. Test on a real device.');
    }
  }, []);
};
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#issues-with-the-ios-simulator

---

## iOS WiFi Switching

### Issue: WiFi Network Changes While App is Backgrounded

**Problem**:
- App doesn't detect when WiFi network changes while backgrounded
- Network state becomes out of sync

**Solution - Refresh on Foreground**:

```javascript
import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { refresh } from '@react-native-community/netinfo';

export const useNetworkRefreshOnResume = () => {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (nextAppState === 'active') {
      const state = await refresh();
      console.log('Network refreshed. Current WiFi:', state.details?.ssid);
    }
  };
};
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#switching-between-different-wi-fi-does-not-send-events-in-ios

---

## Browser Compatibility

### Issue: Network Information API Not Available

**Problem**:
- `navigator.connection` undefined
- `isInternetReachable` always null

**Cause**: Not all browsers support the experimental Network Information API.

**Browser Support Matrix**:

| Browser | Supported | Notes |
|---------|-----------|-------|
| Chrome 61+ | ✓ Yes | Full support |
| Edge 79+ | ✓ Yes | Full support |
| Firefox | ⚠️ Partial | Experimental |
| Safari | ✗ No | Falls back to navigator.onLine |
| IE 11 | ✗ No | Falls back to navigator.onLine |

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#browser-compatilibity

### Solution: Graceful Fallback

```javascript
import { useNetInfo } from '@react-native-community/netinfo';

export const useNetworkWithFallback = () => {
  const netInfo = useNetInfo();

  const isConnected = netInfo.isConnected ?? navigator.onLine;
  const isInternetReachable = netInfo.isInternetReachable ?? navigator.onLine;

  return {
    ...netInfo,
    isConnected,
    isInternetReachable
  };
};
```

---

## Memory Leaks

### Issue: Memory Grows Over Time

**Problem**:
- Memory usage increases continuously
- App becomes sluggish or crashes

**Common Causes**:
1. Forgotten unsubscribe from `addEventListener()`
2. Multiple instances not cleaned up
3. WiFi SSID fetching on iOS without proper permissions

### Solution: Proper Listener Cleanup

```javascript
// ❌ WRONG - No cleanup
useEffect(() => {
  addEventListener((state) => {
    console.log('Network changed:', state);
  });
}, []);

// ✅ CORRECT - Store and unsubscribe
useEffect(() => {
  const unsubscribe = addEventListener((state) => {
    console.log('Network changed:', state);
  });

  return () => unsubscribe();  // Critical!
}, []);
```

### Solution: iOS WiFi SSID Configuration

⚠️ **Important**: `shouldFetchWiFiSSID: true` leaks memory on iOS if requirements aren't met.

```javascript
const netInfo = useNetInfo({
  shouldFetchWiFiSSID: Platform.OS === 'ios' && hasLocationPermission()
});
```

---

## Performance Issues

### Issue: App Sluggish / High CPU Usage

**Cause**: Excessive reachability checks or polling.

**Solution - Adjust Timeouts**:

```javascript
import NetInfo from '@react-native-community/netinfo';

NetInfo.configure({
  reachabilityLongTimeout: 120 * 1000,  // Check every 2 min when online
  reachabilityShortTimeout: 30 * 1000,  // Check every 30s when offline
  reachabilityRequestTimeout: 5 * 1000,
  reachabilityShouldRun: () => appIsInForeground
});
```

### Issue: Battery Drain

**Solution - Optimize for Battery**:

```javascript
import NetInfo from '@react-native-community/netinfo';
import { AppState } from 'react-native';

let appState = 'active';

AppState.addEventListener('change', (state) => {
  appState = state;
});

NetInfo.configure({
  useNativeReachability: true,
  reachabilityLongTimeout: 5 * 60 * 1000,  // 5 minutes
  reachabilityShortTimeout: 60 * 1000,      // 1 minute
  reachabilityShouldRun: () => appState === 'active'
});
```

---

## Debugging Tips

### Enable Verbose Logging

```javascript
import { addEventListener } from '@react-native-community/netinfo';

addEventListener((state) => {
  console.log('=== Network State Change ===');
  console.log('Type:', state.type);
  console.log('Connected:', state.isConnected);
  console.log('Internet:', state.isInternetReachable);
  console.log('WiFi Enabled:', state.isWifiEnabled);
  
  if (state.details) {
    console.log('Details:', JSON.stringify(state.details, null, 2));
  }
  console.log('============================');
});
```

### Network State Snapshot

```javascript
import { fetch } from '@react-native-community/netinfo';

async function debugNetworkState() {
  const state = await fetch();
  
  const debug = {
    timestamp: new Date().toISOString(),
    platform: Platform.OS,
    state: {
      type: state.type,
      isConnected: state.isConnected,
      isInternetReachable: state.isInternetReachable,
      isWifiEnabled: state.isWifiEnabled,
      details: state.details
    }
  };
  
  console.log('📡 Network Debug:', JSON.stringify(debug, null, 2));
  return debug;
}

global.debugNetwork = debugNetworkState;
```

---

## FAQ

### Q: Why is `isInternetReachable` always null?

**A**: 
- On Web: Browser doesn't support Network Information API
- On all platforms: Reachability checks disabled in config
- Verify `useNativeReachability` is true

### Q: How often are network checks performed?

**A**: 
- When online: Every `reachabilityLongTimeout` milliseconds (default: 60s)
- When offline: Every `reachabilityShortTimeout` milliseconds (default: 5s)

### Q: Can I get real-time network speed?

**A**:
- WiFi: `linkSpeed` (Android only)
- Cellular: `cellularGeneration` indicates speed class
- No real-time throughput measurement

### Q: Is there a network bandwidth limit?

**A**: No. Use RxJS, Axios interceptors, or native implementations for bandwidth limiting.

---

**Source Repository**: https://github.com/react-native-netinfo/react-native-netinfo#troubleshooting
