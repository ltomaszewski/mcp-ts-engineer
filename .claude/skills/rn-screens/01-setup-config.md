# Setup & Configuration

Installation, enableScreens, enableFreeze, Expo config, and Android native setup for react-native-screens.

---

## Installation

### Expo (Managed Workflow)

```bash
npx expo install react-native-screens
```

This installs the version compatible with your Expo SDK. For SDK 55, this resolves to react-native-screens v4.x.

### Bare React Native

```bash
yarn add react-native-screens
# or
npm install react-native-screens
```

### iOS Setup (Bare RN Only)

```bash
cd ios && pod install
```

Auto-linking handles iOS installation. No manual configuration required.

### Android Setup (Bare RN Only)

Add `RNScreensFragmentFactory` to `MainActivity` for proper fragment restoration.

**Kotlin (recommended):**

```kotlin
// android/app/src/main/java/.../MainActivity.kt
import android.os.Bundle
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory

class MainActivity : ReactActivity() {

  override fun onCreate(savedInstanceState: Bundle?) {
    supportFragmentManager.fragmentFactory = RNScreensFragmentFactory()
    super.onCreate(savedInstanceState)
  }

  // ... rest of activity
}
```

**Java:**

```java
// android/app/src/main/java/.../MainActivity.java
import android.os.Bundle;
import com.swmansion.rnscreens.fragment.restoration.RNScreensFragmentFactory;

public class MainActivity extends ReactActivity {

  @Override
  protected void onCreate(Bundle savedInstanceState) {
    getSupportFragmentManager().setFragmentFactory(new RNScreensFragmentFactory());
    super.onCreate(savedInstanceState);
  }
}
```

> Expo managed projects handle this automatically. No `MainActivity` changes needed.

---

## enableScreens

Activates native screen containers globally. Must be called once before any navigation component renders.

```typescript
import { enableScreens } from 'react-native-screens';

// Enable native screen rendering (recommended)
enableScreens(true);

// Disable to fall back to plain RN Views (debugging only)
enableScreens(false);
```

### When enableScreens is Active

| Behavior | With enableScreens | Without enableScreens |
|----------|-------------------|----------------------|
| Screen containers | Native (UINavigationController / Fragment) | Plain React Native Views |
| Transitions | Platform-native animations | JS-driven animations |
| Memory | Inactive screens can be detached | All screens stay in memory |
| Performance | OS-level optimizations | No native optimization |

### Placement

Call `enableScreens()` in your app entry point, before any navigation:

```typescript
// app/_layout.tsx (Expo Router)
import { enableScreens } from 'react-native-screens';

enableScreens(true);

export default function RootLayout() {
  return <Stack />;
}
```

```typescript
// App.tsx (React Navigation)
import { enableScreens } from 'react-native-screens';

enableScreens(true);

export default function App() {
  return (
    <NavigationContainer>
      {/* navigators */}
    </NavigationContainer>
  );
}
```

> React Navigation v6+ and Expo Router call `enableScreens()` automatically. Explicit calls are only needed if you want to disable screens or if using a custom navigation library.

---

## enableFreeze

Prevents inactive screens from re-rendering by leveraging React Suspense internally (via `react-freeze`). Inactive screen components suspend, retaining their React state and native view instances (scroll position, input values, loaded images).

```typescript
import { enableFreeze } from 'react-native-screens';

// Enable freeze for inactive screens
enableFreeze(true);
```

### How It Works

| State | Screen Behavior |
|-------|----------------|
| Active | Renders normally, responds to touches |
| Frozen | Suspends rendering, retains state, invisible |
| Unfrozen | Resumes rendering from preserved state |

### Requirements

- React Native 0.68+
- react-native-screens >= 3.9.0
- React 17+ (Suspense support)

### Per-Screen Override

Override the global freeze setting on individual screens:

```typescript
// Expo Router
<Stack.Screen
  name="settings"
  options={{ freezeOnBlur: false }}
/>

// React Navigation
<Stack.Screen
  name="Settings"
  component={SettingsScreen}
  options={{ freezeOnBlur: true }}
/>
```

### Caveats

- **Experimental feature** -- test thoroughly before production use
- Timers and subscriptions in frozen screens continue running (they are not unmounted)
- Some tab navigators may become unresponsive with `enableFreeze(true)` -- use `freezeOnBlur` per-screen as a workaround
- Does not work on web (`react-native-web`)

---

## Version Compatibility

### Fabric (New Architecture) -- Required for v4.25.0+

| Library Version | Minimum React Native | Notes |
|----------------|---------------------|-------|
| 4.25.0+ | 0.82.0+ | Legacy architecture dropped |
| 4.0.0 - 4.24.x | 0.76.0+ | Fabric supported |

### Paper (Legacy Architecture) -- Unsupported in v4.25.0+

| Library Version | Minimum React Native | Notes |
|----------------|---------------------|-------|
| 4.19.0 - 4.24.x | 0.80.0+ | Last versions with legacy support |
| 4.0.0 - 4.18.x | 0.72.0+ | Legacy supported |

### Expo SDK Compatibility

| Expo SDK | React Native | react-native-screens | Architecture |
|----------|-------------|---------------------|--------------|
| 55 | 0.83.x | ~4.x | New Architecture (always enabled) |
| 54 | 0.79.x | ~4.x | New Architecture (opt-in) |

---

## Platform Support

| Platform | Support Level |
|----------|--------------|
| iOS | Full support |
| Android | Full support |
| tvOS | Supported |
| visionOS | Supported |
| Web | Partial (no native containers, basic compatibility) |
| Windows | Partial |

---

## Utility Functions

### screensEnabled

Check if native screens are active:

```typescript
import { screensEnabled } from 'react-native-screens';

if (screensEnabled()) {
  console.log('Native screen containers active');
}
```

### executeNativeBackPress

Programmatically trigger the native Android back button:

```typescript
import { executeNativeBackPress } from 'react-native-screens';

// Android only -- triggers native back navigation
executeNativeBackPress();
```

### isSearchBarAvailableForCurrentPlatform

Check if the native SearchBar component is available:

```typescript
import { isSearchBarAvailableForCurrentPlatform } from 'react-native-screens';

if (isSearchBarAvailableForCurrentPlatform) {
  // Render native search bar
}
```

---

## Troubleshooting

### Screen Content Hidden Behind Header

```typescript
// Set on ScrollView inside native stack screen
<ScrollView contentInsetAdjustmentBehavior="automatic">
  {/* content */}
</ScrollView>

// Or set headerTranslucent in screen options
<Stack.Screen options={{ headerTranslucent: true }} />
```

### Android Fragment Crash on Restore

Ensure `RNScreensFragmentFactory` is set in `MainActivity.onCreate()` **before** `super.onCreate()`.

### Screens Not Using Native Containers

Verify `enableScreens(true)` is called before navigation renders. Check with `screensEnabled()`.

### enableFreeze Causing Unresponsive Tabs

Disable global freeze and use per-screen `freezeOnBlur`:

```typescript
enableFreeze(false); // Disable global

// Enable selectively
<Tab.Screen options={{ freezeOnBlur: true }} />
```

---

**Source:** https://github.com/software-mansion/react-native-screens | **Version:** 4.x (^4.23.0)
