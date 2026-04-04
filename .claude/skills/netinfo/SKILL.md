---
name: netinfo
version: "12.x"
description: "@react-native-community/netinfo v12 network connectivity — state, type, listeners, offline handling, WiFi details."
when_to_use: "Use when working with @react-native-community/netinfo, checking network status, handling offline mode, or detecting connection type."
---

# NetInfo

> Network connectivity detection for React Native applications with real-time monitoring.

**Package:** `@react-native-community/netinfo`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Checking network connectivity status
- Implementing offline-first features
- Monitoring connection changes in real-time
- Detecting connection type (WiFi, cellular, none)
- Building retry logic for failed network requests
- Retrieving WiFi SSID/BSSID details

---

## Critical Rules

**ALWAYS:**
1. Check `isInternetReachable` for true connectivity -- `isConnected` only checks for network interface
2. Handle `null` initial state -- first value from hook can be null before detection completes
3. Clean up event listeners -- prevent memory leaks in useEffect
4. Use named exports from package -- `import { useNetInfo }` not default import
5. Add Access Wi-Fi Information entitlement on iOS for WiFi details -- required by NEHotspotNetwork in v12

**NEVER:**
1. Assume `isConnected === true` means internet works -- could be connected to WiFi with no internet
2. Forget null checks on initial render -- `netInfo.isConnected` can be `null`
3. Block UI on connectivity check -- show offline indicator but don't prevent interaction
4. Skip listener cleanup -- causes memory leaks and stale callbacks
5. Use `shouldFetchWiFiSSID: true` on iOS without proper permissions -- leaks memory

---

## Core Patterns

### useNetInfo Hook (Reactive)

```typescript
import { useNetInfo } from '@react-native-community/netinfo';
import { Text } from 'react-native';

export function ConnectivityStatus(): React.JSX.Element {
  const netInfo = useNetInfo();

  // Handle null initial state
  if (netInfo.isConnected === null) {
    return <Text>Checking connection...</Text>;
  }

  if (!netInfo.isConnected) {
    return <OfflineBanner />;
  }

  // Optional: check actual internet reachability
  if (netInfo.isInternetReachable === false) {
    return <NoInternetBanner />;
  }

  return <OnlineContent />;
}
```

### One-Time Fetch

```typescript
import { fetch } from '@react-native-community/netinfo';

async function checkConnection(): Promise<void> {
  const state = await fetch();

  console.log('Connected:', state.isConnected);
  console.log('Type:', state.type); // 'wifi' | 'cellular' | 'none' | etc.
  console.log('Internet reachable:', state.isInternetReachable);

  if (state.type === 'wifi' && state.details) {
    console.log('WiFi SSID:', state.details.ssid);
  }
}
```

### Event Listener for Changes

```typescript
import { useEffect } from 'react';
import { addEventListener } from '@react-native-community/netinfo';

export function useConnectionListener(
  onOffline: () => void,
  onOnline: () => void,
): void {
  useEffect(() => {
    const unsubscribe = addEventListener((state) => {
      if (state.isConnected === false) {
        onOffline();
      } else if (state.isConnected && state.isInternetReachable) {
        onOnline();
      }
    });

    return () => unsubscribe();
  }, [onOffline, onOnline]);
}
```

### Offline-Aware API Calls

```typescript
import { fetch as fetchNetInfo } from '@react-native-community/netinfo';

class OfflineError extends Error {
  constructor(message = 'No internet connection') {
    super(message);
    this.name = 'OfflineError';
  }
}

async function fetchWithOfflineCheck<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  const state = await fetchNetInfo();

  if (!state.isConnected || state.isInternetReachable === false) {
    throw new OfflineError();
  }

  const response = await fetch(url, options);
  return response.json();
}
```

---

## Anti-Patterns

**BAD** -- Not handling null initial state:
```typescript
const netInfo = useNetInfo();
if (!netInfo.isConnected) { // null is falsy - wrong!
  showOffline();
}
```

**GOOD** -- Explicit null check:
```typescript
const netInfo = useNetInfo();
if (netInfo.isConnected === false) {
  showOffline();
}
```

**BAD** -- Trusting isConnected alone:
```typescript
if (netInfo.isConnected) {
  fetchData(); // May fail - WiFi connected but no internet!
}
```

**GOOD** -- Check isInternetReachable:
```typescript
if (netInfo.isConnected && netInfo.isInternetReachable) {
  fetchData();
}
```

**BAD** -- No listener cleanup:
```typescript
useEffect(() => {
  addEventListener((state) => { /* ... */ });
}, []);
```

**GOOD** -- Proper cleanup:
```typescript
useEffect(() => {
  const unsubscribe = addEventListener((state) => { /* ... */ });
  return () => unsubscribe();
}, []);
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Reactive state | `useNetInfo()` | `const netInfo = useNetInfo()` |
| One-time check | `fetch()` | `const state = await fetch()` |
| Listen to changes | `addEventListener()` | `const unsub = addEventListener(cb)` |
| Manual refresh | `refresh()` | `const state = await refresh()` |
| Check connected | `state.isConnected` | `if (state.isConnected === true)` |
| Check internet | `state.isInternetReachable` | `if (state.isInternetReachable)` |
| Get type | `state.type` | `'wifi' \| 'cellular' \| 'none'` |
| Configure | `configure()` | `NetInfo.configure({ ... })` |
| Isolated instance | `useNetInfoInstance()` | `const { netInfo, refresh } = useNetInfoInstance()` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation, permissions, iOS/Android setup | [01-setup.md](01-setup.md) |
| fetch(), addEventListener(), useNetInfo() | [02-api-core.md](02-api-core.md) |
| useNetInfoInstance, configure(), custom reachability | [03-api-advanced.md](03-api-advanced.md) |
| Offline queue, sync patterns, testing | [04-guides.md](04-guides.md) |
| Debugging connectivity issues | [05-troubleshooting.md](05-troubleshooting.md) |
| TypeScript interfaces, platform matrix | [06-types.md](06-types.md) |

---

**Version:** 12.x | **Source:** https://github.com/react-native-netinfo/react-native-netinfo
