# Complete Type Reference: @react-native-community/netinfo

**TypeScript type definitions, interfaces, and enums for complete type safety**

## Core Types

### NetInfoState

**Complete network state object**

```typescript
interface NetInfoState {
  type: NetInfoStateType;
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  isWifiEnabled?: boolean;
  details: NetInfoDetails | null;
}
```

**Properties**:

| Property | Type | Platforms | Description |
|----------|------|-----------|-------------|
| `type` | `NetInfoStateType` | All | Current connection type |
| `isConnected` | `boolean \| null` | All | Is there an active network connection? |
| `isInternetReachable` | `boolean \| null` | All | Can reach internet through current network? |
| `isWifiEnabled` | `boolean` | Android | Is WiFi hardware enabled? |
| `details` | `NetInfoDetails \| null` | All | Platform-specific connection details |

**Example**:

```typescript
const state: NetInfoState = {
  type: 'wifi',
  isConnected: true,
  isInternetReachable: true,
  isWifiEnabled: true,
  details: {
    isConnectionExpensive: false,
    ssid: 'MyNetwork',
    bssid: 'AA:BB:CC:DD:EE:FF',
    strength: 85,
    ipAddress: '192.168.1.100',
    subnet: '255.255.255.0'
  }
};
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#netinfostate

---

### NetInfoStateType

**Enum-like type for connection type values**

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

**Values**:

| Value | Description | Platforms |
|-------|-------------|-----------|
| `'none'` | No network connection | All |
| `'unknown'` | Connection status unknown | All |
| `'cellular'` | Cellular network (2G-5G) | Android, iOS, Windows, Web |
| `'wifi'` | WiFi network | Android, iOS, macOS, Windows, Web |
| `'bluetooth'` | Bluetooth connection | Android, Web |
| `'ethernet'` | Wired Ethernet | Android, macOS, Windows, Web |
| `'wimax'` | WiMax broadband | Android, Web |
| `'vpn'` | Virtual Private Network | Android |
| `'other'` | Other network type | All |

**Usage**:

```typescript
type MyConnectionType = NetInfoStateType;

const type: NetInfoStateType = 'wifi';

function isOnCellular(type: NetInfoStateType): type is 'cellular' {
  return type === 'cellular';
}
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#netinfostatetype

---

### NetInfoCellularGeneration

**Type for cellular network speed/generation**

```typescript
type NetInfoCellularGeneration = null | '2g' | '3g' | '4g' | '5g';
```

**Values**:

| Value | Description | Technologies |
|-------|-------------|---------------|
| `null` | Not on cellular | N/A |
| `'2g'` | 2G cellular (slow) | CDMA, EDGE, GPRS |
| `'3g'` | 3G cellular (moderate) | HSPA, EVDO, UTMS |
| `'4g'` | 4G/LTE (fast) | LTE, HSPAP |
| `'5g'` | 5G (very fast) | NR, NRNSA |

**Platform Support**:

| Generation | Android | iOS | Windows |
|------------|---------|-----|---------|
| 2g | ✓ | ✓ | ✓ |
| 3g | ✓ | ✓ | ✓ |
| 4g | ✓ | ✓ | ✓ |
| 5g | ✓ | ✓ | ✓ |

**Usage**:

```typescript
function getGenerationSpeed(gen: NetInfoCellularGeneration): string {
  switch (gen) {
    case '2g': return 'Slow';
    case '3g': return 'Moderate';
    case '4g': return 'Fast';
    case '5g': return 'Very Fast';
    case null: return 'Not cellular';
  }
}
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#netinfocellulargeneration

---

## Interface Definitions

### WiFi Details

**Structure of `details` when `type === 'wifi'`**

```typescript
interface WiFiDetails {
  isConnectionExpensive: boolean;
  ssid?: string;        // Android, iOS*, Windows
  bssid?: string;       // Android, iOS*, Windows*
  strength?: number;    // Android, Windows
  ipAddress?: string;   // Android, iOS, macOS, Windows
  subnet?: string;      // Android, iOS, macOS
  frequency?: number;   // Android, Windows (MHz)
  linkSpeed?: number;   // Android (Mbps)
}
```

*Requires permissions and `shouldFetchWiFiSSID: true`

**Platform Support Matrix**:

| Property | Android | iOS* | macOS | Windows** |
|----------|---------|------|-------|-----------|
| `ssid` | ✓ | ✓ | ✗ | ✓ |
| `bssid` | ✓ | ✓ | ✗ | ✓ |
| `strength` | ✓ | ✗ | ✗ | ✓ |
| `ipAddress` | ✓ | ✓ | ✓ | ✓ |
| `subnet` | ✓ | ✓ | ✓ | ✗ |
| `frequency` | ✓ | ✗ | ✗ | ✓ |
| `linkSpeed` | ✓ | ✗ | ✗ | ✗ |

---

### Cellular Details

**Structure of `details` when `type === 'cellular'`**

```typescript
interface CellularDetails {
  isConnectionExpensive: boolean;
  cellularGeneration: NetInfoCellularGeneration;
  carrier?: string; // Android, iOS
}
```

**Platform Support**:

| Property | Android | iOS | Windows |
|----------|---------|-----|---------|
| `cellularGeneration` | ✓ | ✓ | ✓ |
| `carrier` | ✓ | ✓ | ✗ |
| `isConnectionExpensive` | ✓ | ✓ | ✓ |

---

### Other Connection Types

**Structure of `details` for other connection types**

```typescript
interface OtherConnectionDetails {
  isConnectionExpensive: boolean;
}
```

---

## NetInfoConfiguration

**Configuration interface for network detection**

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

**Properties**:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `reachabilityUrl` | `string` | `'https://clients3.google.com/generate_204'` | HTTP endpoint for internet test |
| `reachabilityHeaders` | `object \| Headers \| string[][]` | `{}` | Custom HTTP headers |
| `reachabilityMethod` | `'HEAD' \| 'GET'` | `'HEAD'` | HTTP method for requests |
| `reachabilityTest` | `(response: Response) => boolean \| Promise<boolean>` | Status 204 check | Response validation |
| `reachabilityShortTimeout` | `number` | `5000` | Check interval offline (ms) |
| `reachabilityLongTimeout` | `number` | `60000` | Check interval online (ms) |
| `reachabilityRequestTimeout` | `number` | `15000` | Request timeout (ms) |
| `reachabilityShouldRun` | `() => boolean` | `() => true` | Enable/disable checks |
| `shouldFetchWiFiSSID` | `boolean` | `false` | Get WiFi SSID (iOS) |
| `useNativeReachability` | `boolean` | `true` | Use platform native APIs |

---

## Enum Reference

### Connection Types

```typescript
enum NetInfoStateTypeEnum {
  NONE = 'none',
  UNKNOWN = 'unknown',
  CELLULAR = 'cellular',
  WIFI = 'wifi',
  BLUETOOTH = 'bluetooth',
  ETHERNET = 'ethernet',
  WIMAX = 'wimax',
  VPN = 'vpn',
  OTHER = 'other'
}
```

---

### HTTP Methods

```typescript
enum NetInfoMethodTypeEnum {
  HEAD = 'HEAD',
  GET = 'GET'
}
```

---

## Platform Compatibility Matrix

### Complete Feature Support

| Feature | Android | iOS | macOS | Windows | Web |
|---------|---------|-----|-------|---------|-----|
| none | ✓ | ✓ | ✓ | ✓ | ✓ |
| unknown | ✓ | ✓ | ✓ | ✓ | ✓ |
| cellular | ✓ | ✓ | ✗ | ✓ | ✓ |
| wifi | ✓ | ✓ | ✓ | ✓ | ✓ |
| bluetooth | ✓ | ✗ | ✗ | ✗ | ✓ |
| ethernet | ✓ | ✗ | ✓ | ✓ | ✓ |
| wimax | ✓ | ✗ | ✗ | ✗ | ✓ |
| vpn | ✓ | ✗ | ✗ | ✗ | ✗ |
| other | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## TypeScript Setup Guide

### Using Types in Your Project

```typescript
import type {
  NetInfoState,
  NetInfoStateType,
  NetInfoCellularGeneration,
  NetInfoConfiguration
} from '@react-native-community/netinfo';
import NetInfo, { useNetInfo } from '@react-native-community/netinfo';

function useNetworkStatus(): NetInfoState {
  return useNetInfo();
}

function handleNetworkChange(state: NetInfoState): void {
  if (state.isConnected && state.isInternetReachable) {
    console.log('Online:', state.type);
  }
}

const config: Partial<NetInfoConfiguration> = {
  reachabilityUrl: 'https://example.com',
  reachabilityTest: async (response) => response.status === 200
};

NetInfo.configure(config);
```

### Strict Type Checking

Enable in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true
  }
}
```

### Type Guards

```typescript
import type { NetInfoState } from '@react-native-community/netinfo';

function isWiFiConnected(state: NetInfoState): state is NetInfoState & { type: 'wifi' } {
  return state.type === 'wifi' && state.isConnected === true;
}

const state = useNetInfo();

if (isWiFiConnected(state)) {
  console.log('WiFi SSID:', state.details?.ssid);
}
```

---

**Source Repository**: https://github.com/react-native-netinfo/react-native-netinfo
