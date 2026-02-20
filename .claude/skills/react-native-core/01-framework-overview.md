# React Native 0.83 - Framework Overview & Architecture

**Core Concepts, Mental Model, and Platform Support**

---

## 🎯 What is React Native?

React Native is a framework for building iOS and Android apps using JavaScript and React. Unlike React for web, it compiles to native code and runs directly on mobile devices.

**Key Principle**: "Learn once, write anywhere" — Use JavaScript skills to build true native applications.

### Benefits
- **Single codebase** for iOS and Android (with platform-specific customization)
- **Native performance** — Direct access to platform APIs
- **Hot reload** — See changes instantly during development
- **JavaScript ecosystem** — Use npm packages and familiar tools
- **Large community** — Mature framework with extensive libraries

---

## 🏗️ Architecture Overview

### The Three Layers

```
┌─────────────────────────────────────┐
│    JavaScript Code (Your App)       │  <- React components, business logic
├─────────────────────────────────────┤
│  JavaScript Engine (Hermes/V8)      │  <- Parses and executes JS
├─────────────────────────────────────┤
│  React Native Bridge                │  <- Message passing between JS & Native
├─────────────────────────────────────┤
│    iOS (Swift/Objective-C)          │  <- Platform-specific implementation
│    Android (Java/Kotlin)            │
└─────────────────────────────────────┘
```

### Development Loop

1. **Write JavaScript/TypeScript** in your favorite editor
2. **Metro Bundler** compiles code into device-readable format
3. **JavaScript Engine** (Hermes or V8) executes your code
4. **React Native Bridge** communicates between JS and native layers
5. **Native modules** handle platform-specific operations
6. **Device** renders the UI with native components

---

## 📋 Prerequisites

### System Requirements

**Minimum:**
- Node.js 20.19.4 or higher
- npm 10+

**macOS (iOS/Android):**
- macOS 12+
- Xcode 14+ (for iOS)
- Android Studio 4.2+ (for Android)
- Watchman (optional, recommended)

**Windows (Android only):**
- Windows 10+
- Android Studio 4.2+
- OpenJDK 17

**Linux (Android only):**
- Ubuntu 18.04+
- Android Studio 4.2+
- Node.js 20+

### Development Environment

Install prerequisites for your platform:

**macOS:**
```bash
brew install node watchman
brew install --cask zulu@17  # JDK 17
```

**Windows:**
```powershell
choco install -y nodejs-lts microsoft-openjdk17
```

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs watchman openjdk-17-jdk-headless
```

See **[02-quickstart-setup.md](02-quickstart-setup.md)** for complete platform setup.

---

## 🎨 Core Concepts

### 1. Components are Functions

React Native uses functional components with hooks (same as React web):

```typescript
import { View, Text } from 'react-native';

const MyComponent = ({ name }: { name: string }) => (
  <View>
    <Text>{name}</Text>
  </View>
);
```

### 2. Components Render to Native Views

Unlike web where components render to HTML:

```
<View>        →  Android: android.widget.FrameLayout
               →  iOS: UIView

<Text>        →  Android: android.widget.TextView
               →  iOS: UILabel

<ScrollView>  →  Android: android.widget.ScrollView
               →  iOS: UIScrollView
```

### 3. Styling with StyleSheet

No CSS in React Native. Use `StyleSheet.create()` with JS objects:

```typescript
import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
  },
});
```

**Advantages:**
- Type-safe (TypeScript support)
- Performance optimized (styles compiled once)
- Platform-specific styles (if needed)

### 4. Layout with Flexbox

React Native uses Flexbox for layout (similar to CSS):

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,                  // Take full available space
    flexDirection: 'column',  // Stack items vertically
    justifyContent: 'center', // Center vertically
    alignItems: 'center',     // Center horizontally
  },
  row: {
    flexDirection: 'row',     // Stack items horizontally
    gap: 8,                   // Spacing between items
  },
});
```

### 5. Native Modules for Platform Features

Access platform-specific APIs through native modules:

```typescript
import { Camera, Location, Vibration } from 'react-native';

// Use native camera
const photo = await Camera.getPhoto();

// Use native location
const pos = await Location.getCurrentPosition();

// Vibrate device
Vibration.vibrate(100);
```

---

## 📱 Platform Differences

### iOS vs Android

| Feature | iOS | Android | Handling |
|---------|-----|---------|----------|
| Safe Area | Notch, Dynamic Island | System bars | `useSafeAreaInsets()` |
| Back button | Gesture (swipe) | Hardware button | Navigate manually |
| TextInput | Single line default | Multiline default | Use `multiline` prop |
| Permissions | Request at runtime | Request at install | Use Permissions API |
| Navigation | Standard stack | Back stack concept | Use same approach |

### Platform-Specific Code

```typescript
import { Platform } from 'react-native';

// Conditional imports
const MyComponent = Platform.select({
  ios: () => require('./ios/MyComponent'),
  android: () => require('./android/MyComponent'),
})();

// Conditional styling
const styles = StyleSheet.create({
  container: {
    backgroundColor: Platform.select({
      ios: '#ffffff',
      android: '#f5f5f5',
    }),
  },
});

// Conditional rendering
<View>
  {Platform.OS === 'ios' && <Text>iOS only content</Text>}
  {Platform.OS === 'android' && <Text>Android only content</Text>}
</View>
```

---

## 🔄 Development Workflow

### 1. Create Project

```bash
npx @react-native-community/cli@latest init MyProject --version 0.83
cd MyProject
npm install
```

### 2. Start Metro Bundler

```bash
npm start
```

Metro is the development server that bundles your code for the device.

### 3. Run on Device

**Android:**
```bash
# In new terminal
npm run android
```

**iOS (macOS only):**
```bash
npm run ios
```

### 4. Hot Reload

While Metro is running, press:
- `r` to reload
- `a` to open Android app
- `i` to open iOS app
- `d` to open DevTools

---

## 🔌 Metro Bundler

Metro is the JavaScript bundler for React Native. It:
- Watches file changes
- Hot reloads code instantly
- Transforms JSX and modern JavaScript
- Optimizes for mobile performance

### Configuration

`metro.config.js` (created automatically):

```javascript
const config = {
  project: {
    ios: {},
    android: {},
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: false,
      },
    }),
  },
};

module.exports = config;
```

---

## 📦 JavaScript Engine

React Native 0.83 supports two JavaScript engines:

### Hermes (Default)
- **Size**: 50% smaller APK/IPA
- **Startup**: 40% faster
- **Memory**: Lower usage
- **Best for**: Production apps

**Enable Hermes:**
```gradle
// android/app/build.gradle
project.ext.react = [
    enableHermes: true,
]
```

### V8
- **V8 is Google's engine (used in Node.js)**
- **Better debugging**: Chrome DevTools
- **Standard**: Same as web

See **[08-hermes-optimization.md](08-hermes-optimization.md)** for complete Hermes setup.

---

## 🎯 Project Structure

```
MyProject/
├── android/          # Android native code
│   ├── app/
│   ├── build.gradle
│   └── gradle.properties
│
├── ios/              # iOS native code
│   ├── MyProject/
│   ├── Pods/
│   └── Podfile
│
├── node_modules/     # Dependencies
├── app.json         # App metadata
├── App.tsx          # Root component
├── index.js         # Entry point
├── package.json
├── tsconfig.json
└── metro.config.js
```

---

## 🚀 TypeScript Setup

React Native 0.83 includes TypeScript by default.

### Key Files

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ES2020",
    "lib": ["ES2020"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

### Using TypeScript

1. Use `.tsx` extension for components
2. Type your props:

```typescript
interface Props {
  name: string;
  age?: number;
}

const MyComponent = ({ name, age }: Props) => {
  // Implementation
};
```

3. Import types when needed:

```typescript
import { StyleProp, ViewStyle } from 'react-native';

interface Props {
  style?: StyleProp<ViewStyle>;
}
```

---

## 📚 Learning Path

### Phase 1: Foundation (4-6 hours)
1. Read this module ✓
2. Follow **[02-quickstart-setup.md](02-quickstart-setup.md)**
3. Learn **[03-core-components.md](03-core-components.md)**
4. Build simple UI with components

### Phase 2: App Structure (3-4 hours)
1. Study **[06-navigation.md](06-navigation.md)**
2. Add **[05-data-persistence.md](05-data-persistence.md)**
3. Learn **[07-best-practices.md](07-best-practices.md)**

### Phase 3: Advanced (4-5 hours)
1. Explore **[04-native-modules.md](04-native-modules.md)**
2. Optimize with **[08-hermes-optimization.md](08-hermes-optimization.md)**
3. Test with **[09-testing-devtools.md](09-testing-devtools.md)**

---

## ✅ Core Checklist

Before moving to **[02-quickstart-setup.md](02-quickstart-setup.md)**:

- [ ] You understand components render to native views
- [ ] You understand Flexbox layout system
- [ ] You know the three-layer architecture (JS → Bridge → Native)
- [ ] You're familiar with platform-specific code patterns
- [ ] You have Node.js 20.19.4+ installed

---

**Source**: https://reactnative.dev/docs/getting-started
**Version**: React Native 0.83
**Last Updated**: December 2025
