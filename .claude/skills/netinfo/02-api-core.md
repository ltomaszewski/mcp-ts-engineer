# Core API Reference: @react-native-community/netinfo

Type definitions and global instance methods for React Native NetInfo v12.x.

---

## Method: fetch()

Returns a Promise that resolves to a `NetInfoState` object containing the current network state. Use this for one-time network state checks.

### Signature

```typescript
fetch(type?: NetInfoStateType): Promise<NetInfoState>
```

### Parameters

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `type` | `NetInfoStateType` | Yes | Filter results to a specific connection type. If provided, resolves with state for that type only. |

### Return Value

| Aspect | Details |
|--------|---------|
| **Type** | `Promise<NetInfoState>` |
| **Resolution** | `NetInfoState` object with current network information |
| **Rejection** | Generally does not reject; returns null values for unavailable data |

### Examples

```typescript
import { fetch } from '@react-native-community/netinfo';

// Basic usage
const state = await fetch();
console.log('Connection type:', state.type);
console.log('Is connected?', state.isConnected);

// Async/await with error handling
async function checkNetworkStatus(): Promise<void> {
  try {
    const state = await fetch();
    if (state.isConnected) {
      console.log('Connected via:', state.type);
    } else {
      console.log('Device is offline');
    }
  } catch (error) {
    console.error('Failed to fetch network state:', error);
  }
}

// Fetch specific type (WiFi details)
const wifiState = await fetch('wifi');
if (wifiState.type === 'wifi' && wifiState.details) {
  console.log('SSID:', wifiState.details.ssid);
  console.log('BSSID:', wifiState.details.bssid);
  console.log('Signal Strength:', wifiState.details.strength);
}
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#fetch

---

## Method: addEventListener()

Subscribes a listener to network state change events. The listener is called immediately upon subscription with the current state, then called again whenever the connection state changes. Returns an unsubscribe function.

### Signature

```typescript
addEventListener(
  listener: (state: NetInfoState) => void
): () => void
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(state: NetInfoState) => void` | Callback invoked on network state changes. Called immediately with current state. |

### Return Value

| Aspect | Details |
|--------|---------|
| **Type** | `() => void` (unsubscribe function) |
| **Usage** | Call to stop listening and clean up |
| **Timing** | Must be called in component cleanup (useEffect return) |

### Examples

```typescript
import { addEventListener } from '@react-native-community/netinfo';

// Basic subscription
const unsubscribe = addEventListener((state) => {
  console.log('Connection type:', state.type);
  console.log('Is connected?', state.isConnected);
});

// Later: unsubscribe
unsubscribe();
```

```typescript
// Functional component with useEffect
import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { addEventListener } from '@react-native-community/netinfo';
import type { NetInfoState } from '@react-native-community/netinfo';

export function NetworkStatus(): React.JSX.Element {
  const [connectionInfo, setConnectionInfo] = useState<{
    isConnected: boolean | null;
    type: string | null;
  }>({
    isConnected: null,
    type: null,
  });

  useEffect(() => {
    const unsubscribe = addEventListener((state: NetInfoState) => {
      setConnectionInfo({
        isConnected: state.isConnected,
        type: state.type,
      });
    });

    return () => unsubscribe();
  }, []);

  return (
    <View>
      <Text>Status: {connectionInfo.isConnected ? 'Online' : 'Offline'}</Text>
      <Text>Connection: {connectionInfo.type}</Text>
    </View>
  );
}
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#addeventlistener

---

## Method: useNetInfo()

React Hook for accessing the latest network state from the global instance. Automatically subscribes to state changes and returns the current `NetInfoState`.

### Signature

```typescript
useNetInfo(
  configuration?: Partial<NetInfoConfiguration>
): NetInfoState
```

### Parameters

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `configuration` | `Partial<NetInfoConfiguration>` | Yes | Optional configuration for this hook instance. Recommended to use `NetInfo.configure()` at app startup instead. |

### Return Value

| Aspect | Details |
|--------|---------|
| **Type** | `NetInfoState` |
| **Properties** | `type`, `isConnected`, `isInternetReachable`, `isWifiEnabled`, `details` |
| **Updates** | Re-renders component whenever network state changes |

### Examples

```typescript
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text } from 'react-native';

// Basic hook usage
export function NetworkInfo(): React.JSX.Element {
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

```typescript
// Conditional rendering based on connection
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text, ActivityIndicator } from 'react-native';

export function DataSyncComponent(): React.JSX.Element {
  const { isConnected, isInternetReachable } = useNetInfo();

  if (isConnected === null) {
    return <ActivityIndicator size="large" />;
  }

  if (!isConnected || isInternetReachable === false) {
    return (
      <View>
        <Text>You are currently offline</Text>
        <Text>Sync will resume when connection is restored</Text>
      </View>
    );
  }

  return (
    <View>
      <ActivityIndicator size="large" />
      <Text>Syncing data...</Text>
    </View>
  );
}
```

```typescript
// WiFi details with hook
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text } from 'react-native';

export function WiFiDetails(): React.JSX.Element {
  const { type, details } = useNetInfo();

  if (type !== 'wifi' || !details) {
    return <Text>Not connected to WiFi</Text>;
  }

  return (
    <View>
      <Text>SSID: {details.ssid ?? 'Unknown'}</Text>
      <Text>BSSID: {details.bssid ?? 'Unknown'}</Text>
      <Text>Signal: {details.strength ?? 'N/A'}%</Text>
      <Text>IP: {details.ipAddress ?? 'Unknown'}</Text>
    </View>
  );
}
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#useNetInfo

---

## Method: refresh()

Manually triggers a refresh of the network state and internet reachability check. Returns a Promise that resolves to the updated `NetInfoState`. Updates all active listeners.

### Signature

```typescript
refresh(): Promise<NetInfoState>
```

### Parameters

None.

### Return Value

| Aspect | Details |
|--------|---------|
| **Type** | `Promise<NetInfoState>` |
| **Resolution** | Updated `NetInfoState` object after recheck |
| **Side Effect** | Updates all listeners from `addEventListener()` and `useNetInfo()` |

### Use Cases

- Manual recheck after network request fails
- Validating internet reachability after resuming from background
- Testing network state changes in development

### Examples

```typescript
import { refresh } from '@react-native-community/netinfo';

// Manual refresh on network error
async function fetchDataWithRetry(url: string): Promise<unknown> {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    const state = await refresh();
    if (state.isInternetReachable) {
      return fetchDataWithRetry(url); // Retry
    }
    throw new Error('Device is offline');
  }
}
```

```typescript
// Refresh on app resume
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { refresh } from '@react-native-community/netinfo';

export function useNetworkRefreshOnResume(): void {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh().then((netInfo) => {
          console.log('Network state refreshed:', netInfo.type);
        });
      }
    });
    return () => subscription.remove();
  }, []);
}
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#refresh

---

## Type: NetInfoState

Represents the complete current state of the device's network connection.

### Definition

```typescript
interface NetInfoState {
  type: NetInfoStateType;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isWifiEnabled?: boolean;
  details: NetInfoDetails | null;
}
```

### Properties

| Property | Type | Platforms | Description |
|----------|------|-----------|-------------|
| `type` | `NetInfoStateType` | All | Current connection type |
| `isConnected` | `boolean \| null` | All | Active network connection present |
| `isInternetReachable` | `boolean \| null` | All | Internet is reachable |
| `isWifiEnabled` | `boolean` | Android only | WiFi hardware enabled |
| `details` | `NetInfoDetails \| null` | All | Platform-specific connection details |

---

## Type: NetInfoStateType

```typescript
type NetInfoStateType =
  | 'none'
  | 'unknown'
  | 'cellular'
  | 'wifi'
  | 'bluetooth'
  | 'ethernet'
  | 'wimax'
  | 'vpn'
  | 'other';
```

---

## Type: NetInfoCellularGeneration

```typescript
type NetInfoCellularGeneration =
  | null
  | '2g'
  | '3g'
  | '4g'
  | '5g';
```

---

**Version:** 12.x | **Source:** https://github.com/react-native-netinfo/react-native-netinfo#api
