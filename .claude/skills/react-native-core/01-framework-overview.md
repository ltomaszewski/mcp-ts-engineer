# React Native 0.81.5 -- Framework Overview & Architecture

Core concepts, New Architecture (Fabric, TurboModules, JSI), Hermes engine, and development model.

---

## What Is React Native

React Native is a framework for building native iOS and Android apps using React and JavaScript/TypeScript. Components render to real native views, not web views.

**Key principle:** "Learn once, write anywhere" -- use React skills to build true native applications that share most code across platforms.

### Core Benefits

| Benefit | Detail |
|---------|--------|
| Shared codebase | 85-95% code sharing between iOS and Android |
| Native performance | Components compile to native platform views |
| Fast refresh | See code changes instantly during development |
| JS ecosystem | Full access to npm packages |
| Large community | Mature framework backed by Meta |

---

## Architecture: New Architecture (Default)

React Native 0.81.5 runs the New Architecture by default. The legacy architecture was frozen in RN 0.80 and fully removed as an option in RN 0.82.

### The Four Pillars

```
┌─────────────────────────────────────────────┐
│   Your App (TypeScript/JSX)                 │
├─────────────────────────────────────────────┤
│   React (Reconciler)                        │
├──────────────┬──────────────────────────────┤
│  Fabric      │  TurboModules               │
│  (Renderer)  │  (Native Modules)           │
├──────────────┴──────────────────────────────┤
│   JSI (JavaScript Interface)                │
├─────────────────────────────────────────────┤
│   Hermes Engine (JS Runtime)                │
├─────────────────────────────────────────────┤
│   Native Platform (iOS / Android)           │
└─────────────────────────────────────────────┘
```

### JSI (JavaScript Interface)

JSI replaces the old asynchronous bridge with direct, synchronous C++ bindings between JavaScript and native code. Benefits:
- No JSON serialization overhead
- Synchronous calls when needed
- Direct memory sharing between JS and native
- Host objects exposed to JavaScript

### Fabric (New Renderer)

Fabric is the new rendering system that replaces the legacy renderer:
- Supports React concurrent features (Suspense, transitions)
- Synchronous layout operations (no bridge latency)
- Multi-priority rendering with interruption support
- Immutable shadow tree for thread-safe UI updates
- Works with Yoga layout engine for Flexbox calculations

### TurboModules

TurboModules replace legacy Native Modules:
- Lazy loading -- modules loaded on first use, not at startup
- Type-safe -- Codegen generates native interfaces from TypeScript specs
- Synchronous calls -- via JSI, no async bridge serialization
- C++ support -- cross-platform modules without platform-specific code

### Codegen

The React Native Codegen tool generates type-safe native code from your TypeScript/Flow specifications:
- Generates C++ interfaces for TurboModules
- Generates Fabric component view descriptors
- Runs automatically during build (Android Gradle / iOS CocoaPods)
- Ensures JS spec and native implementation stay in sync

---

## Hermes Engine (Default)

Hermes is Meta's JavaScript engine optimized for React Native. It is the default engine in RN 0.81.5.

| Metric | Without Hermes | With Hermes | Improvement |
|--------|---------------|-------------|-------------|
| APK size | ~5 MB JS engine | ~2.5 MB | ~50% smaller |
| Startup (TTI) | ~1000 ms | ~600 ms | ~40% faster |
| Memory usage | ~100 MB | ~70 MB | ~30% less |

Key features:
- Ahead-of-time bytecode compilation (faster startup)
- Optimized garbage collector
- No JIT compilation (smaller binary, predictable performance)
- ES2020+ support
- Built-in Hermes debugger support

Verify Hermes is active:

```typescript
const isHermes = (): boolean => !!global.HermesInternal;
console.log('Using Hermes:', isHermes());
```

**Note:** In RN 0.81, the built-in JavaScriptCore has been removed. Apps requiring JSC must use the community package `@react-native-community/javascriptcore`.

---

## Metro Bundler

Metro is the JavaScript bundler for React Native:
- Watches files and hot-reloads changes
- Transforms TypeScript/JSX to platform-ready bundles
- Supports tree shaking and minification for production
- Handles asset resolution (images, fonts)

### Metro Dev Server Keys

| Key | Action |
|-----|--------|
| `r` | Reload app |
| `d` | Open DevTools |
| `j` | Open debugger |
| `i` | Run on iOS |
| `a` | Run on Android |

---

## Components Map to Native Views

React Native components render to actual platform views:

| React Native | iOS | Android |
|-------------|-----|---------|
| `<View>` | `UIView` | `android.view.ViewGroup` |
| `<Text>` | `UILabel` / `UITextView` | `android.widget.TextView` |
| `<Image>` | `UIImageView` | `android.widget.ImageView` |
| `<ScrollView>` | `UIScrollView` | `android.widget.ScrollView` |
| `<TextInput>` | `UITextField` | `android.widget.EditText` |

---

## Layout with Flexbox

React Native uses Yoga (C++ Flexbox implementation) for layout. Key differences from CSS Flexbox:
- `flexDirection` defaults to `column` (not `row`)
- `alignContent` defaults to `flex-start` (not `stretch`)
- `flexShrink` defaults to `0` (not `1`)
- Dimensions are unitless (density-independent pixels)
- `gap` property is supported

```typescript
import { View, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
```

---

## Platform-Specific Code

### Runtime Detection

```typescript
import { Platform } from 'react-native';

// Check OS
if (Platform.OS === 'ios') { /* iOS-specific */ }

// Select by platform
const padding = Platform.select({
  ios: 20,
  android: 16,
  default: 16,
});

// Check version
if (Platform.OS === 'android' && Platform.Version >= 33) {
  // Android 13+ specific
}
```

### File-Based Platform Extensions

React Native resolves platform-specific files automatically:

```
MyComponent.ios.tsx    -- loaded on iOS
MyComponent.android.tsx -- loaded on Android
MyComponent.tsx        -- fallback for both
```

Import without extension:

```typescript
import { MyComponent } from './MyComponent'; // auto-resolves per platform
```

---

## TypeScript Setup

RN 0.81.5 ships with TypeScript support by default. Key configuration:

```json
{
  "compilerOptions": {
    "target": "esnext",
    "module": "commonjs",
    "lib": ["es2021"],
    "jsx": "react-jsx",
    "strict": true,
    "moduleResolution": "node",
    "skipLibCheck": true,
    "resolveJsonModule": true
  }
}
```

### Common Type Imports

```typescript
import type {
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
  LayoutChangeEvent,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
```

---

## Project Structure (Bare RN CLI)

```
MyProject/
├── android/           # Android native project (Gradle)
├── ios/               # iOS native project (Xcode/CocoaPods)
├── node_modules/
├── app.json           # App metadata
├── App.tsx            # Root component
├── index.js           # Entry point (registers root component)
├── metro.config.js    # Metro bundler config
├── package.json
├── tsconfig.json
└── babel.config.js
```

---

## System Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| Node.js | 20.19.4 | 24+ |
| Xcode (iOS) | 16.1 | Latest |
| Android Studio | Hedgehog+ | Latest |
| JDK | 17 | 17 |
| macOS (iOS dev) | 13+ | Latest |
| Windows (Android) | 10+ | 11 |

---

## Development Workflow

```bash
# Create project
npx @react-native-community/cli@latest init MyProject

# Start Metro
npm start

# Run on platforms (new terminal)
npm run android
npm run ios

# Build production
cd android && ./gradlew assembleRelease
cd ios && xcodebuild -workspace MyProject.xcworkspace -scheme MyProject -configuration Release
```

---

**Version:** React Native 0.81.5 | React 19.1.0 | Hermes (default) | New Architecture (default)
**Source:** https://reactnative.dev/docs/getting-started | https://reactnative.dev/architecture/landing-page
