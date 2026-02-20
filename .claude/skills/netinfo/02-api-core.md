# Core API Reference: @react-native-community/netinfo

**Type definitions and global instance methods for React Native NetInfo**

## Method: fetch()

### Description

Returns a Promise that resolves to a `NetInfoState` object containing the current network state. Use this for one-time network state checks. Does not set up listeners for state changes.

### Signature

```typescript
fetch(type?: NetInfoStateType): Promise<NetInfoState>
```

### Parameters

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `type` | `NetInfoStateType` | Yes | Filter results to a specific connection type. If provided, the Promise resolves with state information only for that type. If not provided, returns state for the currently active connection. |

### Return Value

| Aspect | Details |
|--------|---------|
| **Type** | `Promise<NetInfoState>` |
| **Resolution** | `NetInfoState` object with current network information |
| **Rejection** | Generally does not reject; returns null values for unavailable data |

### Example 1: Basic Usage

```javascript
import { fetch } from '@react-native-community/netinfo';

fetch().then(state => {
  console.log('Connection type:', state.type);
  console.log('Is connected?', state.isConnected);
});
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#fetch

### Example 2: Async/Await Pattern

```javascript
import { fetch } from '@react-native-community/netinfo';

async function checkNetworkStatus() {
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

checkNetworkStatus();
```

### Example 3: Fetch Specific Type (WiFi SSID)

```javascript
import { fetch } from '@react-native-community/netinfo';

fetch('wifi').then(state => {
  if (state.type === 'wifi') {
    console.log('SSID:', state.details.ssid);
    console.log('BSSID:', state.details.bssid);
    console.log('Signal Strength:', state.details.strength);
  } else {
    console.log('Not currently connected to WiFi');
  }
});
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#fetch

---

## Method: addEventListener()

### Description

Subscribes a listener function to network state change events. The listener is called immediately upon subscription with the current state, then called again whenever the connection state changes. Returns an unsubscribe function to stop receiving updates.

### Signature

```typescript
addEventListener(
  listener: (state: NetInfoState) => void
): () => void
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(state: NetInfoState) => void` | Callback function invoked when network state changes. Called immediately with current state upon subscription. Receives the new `NetInfoState` object as its argument. |

### Return Value

| Aspect | Details |
|--------|---------|
| **Type** | `() => void` (unsubscribe function) |
| **Usage** | Call this function to stop listening to network changes and clean up the listener |
| **Timing** | Should be called in component cleanup (useEffect return) |

### Example 1: Basic Subscription

```javascript
import { addEventListener } from '@react-native-community/netinfo';

// Subscribe to network changes
const unsubscribe = addEventListener(state => {
  console.log('Connection type:', state.type);
  console.log('Is connected?', state.isConnected);
});

// Later: unsubscribe
unsubscribe();
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#addeventlistener

### Example 2: Class Component

```javascript
import React from 'react';
import { View, Text } from 'react-native';
import { addEventListener } from '@react-native-community/netinfo';

export class NetworkMonitor extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isConnected: null,
      type: null
    };
    this.unsubscribe = null;
  }

  componentDidMount() {
    // Subscribe to network changes
    this.unsubscribe = addEventListener(state => {
      this.setState({
        isConnected: state.isConnected,
        type: state.type
      });
    });
  }

  componentWillUnmount() {
    // Clean up listener
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }

  render() {
    return (
      <View>
        <Text>Connected: {this.state.isConnected ? 'Yes' : 'No'}</Text>
        <Text>Type: {this.state.type}</Text>
      </View>
    );
  }
}
```

### Example 3: Functional Component with useEffect

```javascript
import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { addEventListener } from '@react-native-community/netinfo';

export const NetworkStatus = () => {
  const [connectionInfo, setConnectionInfo] = useState({
    isConnected: null,
    type: null
  });

  useEffect(() => {
    // Subscribe on mount
    const unsubscribe = addEventListener(state => {
      setConnectionInfo({
        isConnected: state.isConnected,
        type: state.type
      });
    });

    // Unsubscribe on unmount
    return () => unsubscribe();
  }, []);

  return (
    <View>
      <Text>
        Status: {connectionInfo.isConnected ? 'Online' : 'Offline'}
      </Text>
      <Text>Connection: {connectionInfo.type}</Text>
    </View>
  );
};
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#addeventlistener

---

## Method: useNetInfo()

### Description

React Hook for accessing the latest network state from the global instance. Automatically subscribes to state changes and returns the current `NetInfoState`. Hook handles subscription lifecycle automatically.

### Signature

```typescript
useNetInfo(
  configuration?: Partial<NetInfoConfiguration>
): NetInfoState
```

### Parameters

| Parameter | Type | Optional | Description |
|-----------|------|----------|-------------|
| `configuration` | `Partial<NetInfoConfiguration>` | Yes | Optional configuration for this hook instance. Defaults to global configuration. Note: It's recommended to use `NetInfo.configure()` once at app startup instead of passing configuration to each hook. |

### Return Value

| Aspect | Details |
|--------|---------|
| **Type** | `NetInfoState` |
| **Properties** | `type`, `isConnected`, `isInternetReachable`, `isWifiEnabled`, `details` |
| **Updates** | Re-renders component whenever network state changes |

### Example 1: Basic Hook Usage

```javascript
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text } from 'react-native';

export const NetworkInfo = () => {
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

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#useNetInfo

### Example 2: Conditional Rendering Based on Connection

```javascript
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text, ActivityIndicator } from 'react-native';

export const DataSyncComponent = () => {
  const { isConnected, isInternetReachable } = useNetInfo();

  if (!isConnected || !isInternetReachable) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text>You are currently offline</Text>
        <Text>Sync will resume when connection is restored</Text>
      </View>
    );
  }

  return (
    <View>
      <ActivityIndicator size="large" color="#0000ff" />
      <Text>Syncing data...</Text>
    </View>
  );
};
```

### Example 3: Custom Reachability Configuration in Hook

```javascript
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text } from 'react-native';

export const CustomReachabilityComponent = () => {
  const netInfo = useNetInfo({
    reachabilityUrl: 'https://api.example.com/health',
    reachabilityTest: async (response) => response.status === 200,
    reachabilityLongTimeout: 60 * 1000,
    reachabilityShortTimeout: 5 * 1000
  });

  return (
    <View>
      <Text>Internet Reachable: {netInfo.isInternetReachable ? 'Yes' : 'No'}</Text>
    </View>
  );
};
```

### Example 4: WiFi Details with Hook

```javascript
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text } from 'react-native';

export const WiFiDetails = () => {
  const { type, details } = useNetInfo();

  if (type !== 'wifi') {
    return <Text>Not connected to WiFi</Text>;
  }

  const wifiDetails = details || {};

  return (
    <View>
      <Text>SSID: {wifiDetails.ssid || 'Unknown'}</Text>
      <Text>BSSID: {wifiDetails.bssid || 'Unknown'}</Text>
      <Text>Signal: {wifiDetails.strength || 'N/A'}%</Text>
      <Text>IP: {wifiDetails.ipAddress || 'Unknown'}</Text>
      <Text>Link Speed: {wifiDetails.linkSpeed || 'N/A'} Mbps</Text>
    </View>
  );
};
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#useNetInfo

---

## Method: refresh()

### Description

Manually triggers a refresh of the network state and internet reachability check. Returns a Promise that resolves to the updated `NetInfoState`. Updates all active listeners created via `addEventListener()` and `useNetInfo()` hooks.

### Signature

```typescript
refresh(): Promise<NetInfoState>
```

### Parameters

None

### Return Value

| Aspect | Details |
|--------|---------|
| **Type** | `Promise<NetInfoState>` |
| **Resolution** | Updated `NetInfoState` object after recheck |
| **Side Effect** | Updates all listeners subscribed via `addEventListener()` and `useNetInfo()` |

### Use Cases

- Manual recheck after network request fails
- Periodic polling of network state (less efficient than listeners)
- Testing network state changes in development
- Validating internet reachability after resuming from background

### Example 1: Manual Refresh on Network Error

```javascript
import { refresh } from '@react-native-community/netinfo';

async function fetchDataWithRetry(url) {
  try {
    const response = await fetch(url);
    return response.json();
  } catch (error) {
    console.log('Network request failed');
    
    // Manually refresh network state
    const state = await refresh();
    
    if (state.isInternetReachable) {
      // Retry the request
      return fetchDataWithRetry(url);
    } else {
      throw new Error('Device is offline');
    }
  }
}
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#refresh

### Example 2: Refresh on App Resume

```javascript
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { refresh } from '@react-native-community/netinfo';

export const useNetworkRefreshOnResume = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        // App came to foreground - refresh network state
        refresh().then(netInfo => {
          console.log('Network state refreshed:', netInfo);
        });
      }
    });

    return () => subscription.remove();
  }, []);
};
```

### Example 3: Periodic Network Monitoring

```javascript
import { useEffect, useRef } from 'react';
import { refresh } from '@react-native-community/netinfo';

export const usePeriodicNetworkCheck = (intervalMs = 30000) => {
  const intervalRef = useRef(null);

  useEffect(() => {
    // Check network status every 30 seconds
    intervalRef.current = setInterval(async () => {
      const state = await refresh();
      console.log('Network check:', state.type, state.isConnected);
    }, intervalMs);

    return () => clearInterval(intervalRef.current);
  }, [intervalMs]);
};
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#refresh

---

## Type: NetInfoState

### Description

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

| Property | Type | Description |
|----------|------|-------------|
| `type` | `NetInfoStateType` | The type of the current connection |
| `isConnected` | `boolean` \| `null` | Whether there is an active network connection |
| `isInternetReachable` | `boolean` \| `null` | Whether the internet is reachable |
| `isWifiEnabled` | `boolean` | Android only: WiFi hardware enabled |
| `details` | `NetInfoDetails` \| `null` | Platform-specific network details |

---

## Type: NetInfoStateType

### Description

Enum representing possible connection type values.

### Definition

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

### Description

Enum representing the generation/speed class of cellular network.

### Definition

```typescript
type NetInfoCellularGeneration = 
  | null
  | '2g'
  | '3g'
  | '4g'
  | '5g';
```

---

**Source Repository**: https://github.com/react-native-netinfo/react-native-netinfo#api
