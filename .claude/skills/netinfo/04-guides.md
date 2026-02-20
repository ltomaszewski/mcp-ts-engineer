# Usage Guides & Patterns: @react-native-community/netinfo

## Offline-First Architecture

### Pattern: Context-Based Network State

```javascript
// NetworkContext.js
import React, { createContext, useContext } from 'react';
import { useNetInfo } from '@react-native-community/netinfo';

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const netInfo = useNetInfo();

  return (
    <NetworkContext.Provider value={netInfo}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }
  return context;
};
```

**Usage in App:**

```javascript
// App.js
import { NetworkProvider } from './NetworkContext';

export default function App() {
  return (
    <NetworkProvider>
      <YourAppStack />
    </NetworkProvider>
  );
}

// In any component:
import { useNetwork } from './NetworkContext';

const MyComponent = () => {
  const { isConnected, isInternetReachable } = useNetwork();
  
  if (!isInternetReachable) {
    return <OfflineMessage />;
  }
  
  return <OnlineContent />;
};
```

**Source**: https://github.com/react-native-netinfo/react-native-netinfo#usage

---

## Connection Quality Detection

### Pattern: Detect Network Speed

```javascript
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text } from 'react-native';

export const NetworkQualityIndicator = () => {
  const { type, details } = useNetInfo();

  const getQualityLabel = () => {
    if (type === 'none') return 'No Connection';
    if (type === 'unknown') return 'Unknown';
    
    if (type === 'cellular') {
      const gen = details?.cellularGeneration;
      if (gen === '5g') return 'Excellent (5G)';
      if (gen === '4g') return 'Good (4G/LTE)';
      if (gen === '3g') return 'Fair (3G)';
      if (gen === '2g') return 'Poor (2G)';
      return 'Unknown Cellular';
    }
    
    if (type === 'wifi') {
      const strength = details?.strength;
      if (strength >= 80) return 'Excellent WiFi';
      if (strength >= 60) return 'Good WiFi';
      if (strength >= 40) return 'Fair WiFi';
      return 'Poor WiFi';
    }
    
    if (type === 'ethernet') return 'Excellent (Wired)';
    
    return 'Connected';
  };

  const getQualityColor = () => {
    const label = getQualityLabel();
    if (label.includes('No Connection')) return '#FF0000';
    if (label.includes('Poor')) return '#FF9800';
    if (label.includes('Fair')) return '#FFC107';
    if (label.includes('Good')) return '#8BC34A';
    if (label.includes('Excellent')) return '#4CAF50';
    return '#9E9E9E';
  };

  return (
    <View style={{ padding: 10, backgroundColor: getQualityColor() }}>
      <Text style={{ color: 'white' }}>{getQualityLabel()}</Text>
    </View>
  );
};
```

---

## Network State Monitoring

### Pattern: Real-Time Connection Dashboard

```javascript
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text, StyleSheet } from 'react-native';

export const NetworkDashboard = () => {
  const netInfo = useNetInfo();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Network Status</Text>
      <View style={styles.section}>
        <Row label="Type" value={netInfo.type} />
        <Row label="Connected" value={netInfo.isConnected ? 'Yes' : 'No'} />
        <Row label="Internet" value={netInfo.isInternetReachable ? 'Yes' : 'No'} />
        {netInfo.isWifiEnabled !== undefined && (
          <Row label="WiFi Hardware" value={netInfo.isWifiEnabled ? 'On' : 'Off'} />
        )}
      </View>

      {netInfo.type === 'wifi' && netInfo.details && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>WiFi Details</Text>
          <Row label="SSID" value={netInfo.details.ssid || 'Unknown'} />
          <Row label="BSSID" value={netInfo.details.bssid || 'Unknown'} />
          <Row label="Signal" value={`${netInfo.details.strength || 'N/A'}%`} />
        </View>
      )}

      {netInfo.type === 'cellular' && netInfo.details && (
        <View style={styles.section}>
          <Text style={styles.subtitle}>Cellular Details</Text>
          <Row label="Generation" value={netInfo.details.cellularGeneration || 'Unknown'} />
          <Row label="Carrier" value={netInfo.details.carrier || 'Unknown'} />
        </View>
      )}
    </View>
  );
};

const Row = ({ label, value }) => (
  <View style={styles.row}>
    <Text style={styles.label}>{label}:</Text>
    <Text style={styles.value}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: '#f5f5f5' },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  section: { marginBottom: 16, backgroundColor: '#fff', padding: 12, borderRadius: 8 },
  subtitle: { fontWeight: 'bold', marginBottom: 8 },
  row: { flexDirection: 'row', marginBottom: 6 },
  label: { fontWeight: '500', flex: 1 },
  value: { flex: 1, color: '#666' }
});
```

---

## WiFi Network Details

### Getting WiFi SSID on iOS

```javascript
import { useNetInfo } from '@react-native-community/netinfo';

export const useWiFiSSID = () => {
  const netInfo = useNetInfo({
    shouldFetchWiFiSSID: true
  });

  if (netInfo.type === 'wifi') {
    return netInfo.details?.ssid || null;
  }
  
  return null;
};
```

**iOS Requirements:**
- Add to `Info.plist`: `NSLocationWhenInUseUsageDescription`
- Request location permission
- Pass `shouldFetchWiFiSSID: true`

### Getting WiFi Details on Android

```javascript
import { useNetInfo } from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { PermissionsAndroid } from 'react-native';

export const useWiFiDetails = () => {
  const netInfo = useNetInfo();

  useEffect(() => {
    const requestPermissions = async () => {
      try {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'WiFi Network Details',
            message: 'We need location permission to show WiFi details',
            buttonPositive: 'OK',
          },
        );
      } catch (err) {
        console.warn(err);
      }
    };

    requestPermissions();
  }, []);

  if (netInfo.type !== 'wifi') {
    return null;
  }

  return {
    ssid: netInfo.details?.ssid,
    bssid: netInfo.details?.bssid,
    strength: netInfo.details?.strength,
    ipAddress: netInfo.details?.ipAddress,
    linkSpeed: netInfo.details?.linkSpeed,
  };
};
```

**Android Requirements:**
- Add to `AndroidManifest.xml`: `ACCESS_FINE_LOCATION`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE`
- Request location permission at runtime

---

## iOS-Specific Patterns

### Handling Background State Changes

```javascript
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { refresh } from '@react-native-community/netinfo';

export const useNetworkRefreshOnForeground = () => {
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = async (nextAppState) => {
    if (nextAppState === 'active') {
      const state = await refresh();
      console.log('Refreshed network state:', state.type);
    }
  };
};
```

---

## Android-Specific Patterns

### VPN Detection

```javascript
import { useNetInfo } from '@react-native-community/netinfo';
import { View, Text } from 'react-native';

export const VPNStatus = () => {
  const { type } = useNetInfo();

  const isVPNActive = type === 'vpn';

  return (
    <View>
      <Text style={{ color: isVPNActive ? '#FF6B6B' : '#4CAF50' }}>
        VPN: {isVPNActive ? 'ACTIVE' : 'INACTIVE'}
      </Text>
    </View>
  );
};
```

---

## Testing Patterns

### Jest Mock Setup

```javascript
// jest.setup.js
import mockRNCNetInfo from '@react-native-community/netinfo/jest/netinfo-mock.js';

jest.mock('@react-native-community/netinfo', () => mockRNCNetInfo);
```

### Test Examples

```javascript
import { useNetInfo } from '@react-native-community/netinfo';
import { render, screen } from '@testing-library/react-native';

jest.mock('@react-native-community/netinfo');

describe('Network-dependent component', () => {
  it('shows online content when connected', () => {
    useNetInfo.mockReturnValue({
      type: 'wifi',
      isConnected: true,
      isInternetReachable: true,
      isWifiEnabled: true,
      details: { isConnectionExpensive: false, ssid: 'Test WiFi' }
    });

    render(<YourComponent />);
    expect(screen.getByText('Online Content')).toBeTruthy();
  });

  it('shows offline content when disconnected', () => {
    useNetInfo.mockReturnValue({
      type: 'none',
      isConnected: false,
      isInternetReachable: false,
      isWifiEnabled: false,
      details: null
    });

    render(<YourComponent />);
    expect(screen.getByText('Offline Content')).toBeTruthy();
  });
});
```

---

**Source Repository**: https://github.com/react-native-netinfo/react-native-netinfo
