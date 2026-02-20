# Advanced API & Configuration: @react-native-community/netinfo

## Method: configure()

Configures the library with custom settings for network detection and reachability testing.

### Signature

```typescript
configure(configuration: Partial<NetInfoConfiguration>): void
```

### Example 1: Basic Configuration

```javascript
import NetInfo from '@react-native-community/netinfo';

NetInfo.configure({
  reachabilityUrl: 'https://clients3.google.com/generate_204',
  reachabilityTest: async (response) => response.status === 204,
  reachabilityLongTimeout: 60 * 1000,
  reachabilityShortTimeout: 5 * 1000,
  reachabilityRequestTimeout: 15 * 1000,
  reachabilityShouldRun: () => true,
  shouldFetchWiFiSSID: true,
  useNativeReachability: true
});

export default NetInfo;
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#configure

### Example 2: Custom Reachability Endpoint

```javascript
import NetInfo from '@react-native-community/netinfo';

NetInfo.configure({
  reachabilityUrl: 'https://api.myapp.com/health',
  reachabilityTest: async (response) => {
    const data = await response.json();
    return data.status === 'ok';
  },
  reachabilityRequestTimeout: 10 * 1000
});
```

### Example 3: Battery Optimization

```javascript
import NetInfo from '@react-native-community/netinfo';

NetInfo.configure({
  reachabilityLongTimeout: 120 * 1000,
  reachabilityShortTimeout: 30 * 1000,
  useNativeReachability: true
});
```

---

## Type: NetInfoConfiguration

Configuration interface for network detection behavior.

```typescript
interface NetInfoConfiguration {
  reachabilityUrl: string;
  reachabilityHeaders: object | Headers | string[][];
  reachabilityMethod: NetInfoMethodType;
  reachabilityTest: (response: Response) => boolean | Promise<boolean>;
  reachabilityShortTimeout: number;
  reachabilityLongTimeout: number;
  reachabilityRequestTimeout: number;
  reachabilityShouldRun: () => boolean;
  shouldFetchWiFiSSID: boolean;
  useNativeReachability: boolean;
}
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `reachabilityUrl` | `string` | `'https://clients3.google.com/generate_204'` | HTTP endpoint for internet test |
| `reachabilityHeaders` | `object` \| `Headers` \| `string[][]` | `{}` | Custom HTTP headers |
| `reachabilityMethod` | `'HEAD'` \| `'GET'` | `'HEAD'` | HTTP method for requests |
| `reachabilityTest` | `(response: Response) => boolean \| Promise<boolean>` | Status 204 check | Response validation |
| `reachabilityShortTimeout` | `number` | `5000` | Check interval offline (ms) |
| `reachabilityLongTimeout` | `number` | `60000` | Check interval online (ms) |
| `reachabilityRequestTimeout` | `number` | `15000` | Request timeout (ms) |
| `reachabilityShouldRun` | `() => boolean` | `() => true` | Enable/disable checks |
| `shouldFetchWiFiSSID` | `boolean` | `false` | Get WiFi SSID (iOS) |
| `useNativeReachability` | `boolean` | `true` | Use native APIs |

---

## Method: useNetInfoInstance()

Creates an isolated network state manager instance for independent monitoring.

### Signature

```typescript
useNetInfoInstance(
  isPaused?: boolean,
  configuration?: Partial<NetInfoConfiguration>
): { netInfo: NetInfoState; refresh: () => Promise<NetInfoState> }
```

### Example 1: Basic Isolated Instance

```javascript
import { useNetInfoInstance } from '@react-native-community/netinfo';
import { View, Text, Button } from 'react-native';

export const IsolatedNetworkMonitor = () => {
  const { netInfo, refresh } = useNetInfoInstance();

  return (
    <View>
      <Text>Type: {netInfo.type}</Text>
      <Text>Connected: {netInfo.isConnected ? 'Yes' : 'No'}</Text>
      <Button title="Refresh" onPress={() => refresh()} />
    </View>
  );
};
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#useNetInfoInstance

### Example 2: Paused Instance

```javascript
import { useNetInfoInstance } from '@react-native-community/netinfo';
import { useIsFocused } from '@react-navigation/native';

export const OffScreenNetworkMonitor = () => {
  const isFocused = useIsFocused();
  
  const { netInfo, refresh } = useNetInfoInstance(
    !isFocused,  // isPaused: true when not focused
  );

  if (!isFocused) {
    return <Text>Component hidden</Text>;
  }

  return (
    <View>
      <Text>Type: {netInfo.type}</Text>
      <Button title="Refresh" onPress={() => refresh()} />
    </View>
  );
};
```

### Example 3: Instance with Custom Configuration

```javascript
import { useNetInfoInstance } from '@react-native-community/netinfo';

export const CustomConfiguredInstance = () => {
  const { netInfo, refresh } = useNetInfoInstance(
    false,
    {
      reachabilityUrl: 'https://my-api.example.com/health',
      reachabilityTest: async (response) => response.status === 200,
      reachabilityLongTimeout: 120 * 1000,
      reachabilityShortTimeout: 3 * 1000,
      reachabilityRequestTimeout: 10 * 1000
    }
  );

  return (
    <View>
      <Text>Internet: {netInfo.isInternetReachable ? 'Yes' : 'No'}</Text>
    </View>
  );
};
```

---

## Custom Reachability Testing

Implement custom health checks for your API:

```javascript
import NetInfo from '@react-native-community/netinfo';

NetInfo.configure({
  reachabilityUrl: 'https://api.myapp.com/health',
  
  reachabilityTest: async (response) => {
    if (response.status !== 200) {
      return false;
    }
    
    try {
      const data = await response.json();
      return data.status === 'healthy' && data.database === 'connected';
    } catch {
      return false;
    }
  },
  
  reachabilityHeaders: {
    'X-App-Version': '1.0.0',
    'X-Device-Id': 'some-id'
  },
  
  reachabilityShortTimeout: 5 * 1000,
  reachabilityLongTimeout: 60 * 1000,
  reachabilityRequestTimeout: 10 * 1000
});
```

---

## Platform-Specific Capabilities

### WiFi Details Support

| Property | Android | iOS* | macOS | Windows** |
|----------|---------|------|-------|-----------|
| `ssid` | ✓ | ✓ | ✗ | ✓ |
| `bssid` | ✓ | ✓ | ✗ | ✓ |
| `strength` | ✓ | ✗ | ✗ | ✓ |
| `ipAddress` | ✓ | ✓ | ✓ | ✓ |
| `subnet` | ✓ | ✓ | ✓ | ✗ |
| `frequency` | ✓ | ✗ | ✗ | ✓ |
| `linkSpeed` | ✓ | ✗ | ✗ | ✗ |

*Requires permissions and `shouldFetchWiFiSSID: true`
**Requires WiFiControl capability

### Cellular Details Support

| Property | Android | iOS | Windows |
|----------|---------|-----|---------|
| `cellularGeneration` | ✓ | ✓ | ✓ |
| `carrier` | ✓ | ✓ | ✗ |
| `isConnectionExpensive` | ✓ | ✓ | ✓ |

---

## Performance Optimization

```javascript
import NetInfo from '@react-native-community/netinfo';

// For battery-sensitive apps
NetInfo.configure({
  reachabilityLongTimeout: 120 * 1000,  // 2 minutes
  reachabilityShortTimeout: 10 * 1000,  // 10 seconds
  
  reachabilityShouldRun: () => {
    return appState === 'active';  // Skip when backgrounded
  },
  
  useNativeReachability: true  // Use native APIs only
});
```

---

**Source Repository**: https://github.com/react-native-netinfo/react-native-netinfo#global-instance-methods
