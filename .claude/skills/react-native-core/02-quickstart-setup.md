# React Native 0.83.4 -- Quickstart & Environment Setup

Complete platform setup (macOS/Windows/Linux), project creation, and first run.

---

## Prerequisites Summary

| Platform | iOS Dev | Android Dev | Node.js | JDK |
|----------|---------|-------------|---------|-----|
| macOS | Xcode 16.1+ | Android Studio | 20.19.4+ | 17 |
| Windows | Not supported | Android Studio | 20.19.4+ | 17 |
| Linux | Not supported | Android Studio | 20.19.4+ | 17 |

---

## macOS Setup

### Step 1: Node.js & Watchman

```bash
brew install node watchman
node --version   # 20.19.4+ required, 24+ recommended
```

### Step 2: JDK 17 (for Android)

```bash
brew install --cask zulu@17
```

Add to `~/.zshrc`:

```bash
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home
```

### Step 3: Xcode (for iOS)

```bash
# Install from Mac App Store, then:
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

Install CocoaPods:

```bash
sudo gem install cocoapods
```

### Step 4: Android Studio

1. Download from https://developer.android.com/studio
2. SDK Manager: Install Android 15 (API 35), Build-Tools 35.0.0
3. SDK Manager: Install Android 16 (API 36) for 0.81 targeting

Add to `~/.zshrc`:

```bash
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### Verify macOS Setup

```bash
node --version && java -version && echo $ANDROID_HOME && xcode-select -p && pod --version
```

---

## Windows Setup

### Step 1: Install via Chocolatey

```powershell
choco install -y nodejs-lts microsoft-openjdk17
```

### Step 2: Android Studio

1. Download and install Android Studio
2. SDK Manager: Android 15 (API 35) + Build-Tools 35.0.0
3. Add to environment variables:
   - `ANDROID_HOME`: `%LOCALAPPDATA%\Android\Sdk`
   - Add to PATH: `%LOCALAPPDATA%\Android\Sdk\platform-tools`

---

## Linux Setup (Ubuntu/Debian)

```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs

# JDK
sudo apt-get install -y openjdk-17-jdk-headless

# Android Studio: download from developer.android.com/studio
```

Add to `~/.bashrc`:

```bash
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools
```

---

## Create New Project

```bash
npx @react-native-community/cli@latest init MyProject
cd MyProject
```

This creates a TypeScript project with the New Architecture enabled by default.

### Project Naming Rules

- PascalCase or kebab-case: `MyApp`, `my-app`
- No spaces or special characters (except hyphen/underscore)
- Must start with a letter

---

## First Run

### Start Metro

```bash
npm start
```

### Run on Android (new terminal)

```bash
npm run android
```

### Run on iOS (macOS only, new terminal)

```bash
# Install CocoaPods dependencies first
cd ios && pod install && cd ..

npm run ios
```

---

## Android Device Setup

### Emulator

1. Android Studio > Device Manager > Create Virtual Device
2. Select device (e.g., Pixel 7) and system image (API 35+)
3. Launch emulator

### Physical Device

1. Enable Developer Mode: Settings > About > Tap Build Number 7 times
2. Enable USB Debugging: Settings > Developer Options > USB Debugging
3. Connect via USB, trust computer

Verify: `adb devices`

---

## iOS Device Setup

### Simulator

```bash
open -a Simulator
```

Or launch from Xcode: Product > Destination > Choose simulator.

### Physical Device

1. Enable Developer Mode: Settings > Privacy & Security > Developer Mode
2. Connect via USB
3. In Xcode: Select your device as run target, run with Cmd+R
4. Requires Apple Developer account for device provisioning

---

## Common Configuration Files

### metro.config.js

```typescript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const config = {};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

### babel.config.js

```typescript
module.exports = {
  presets: ['module:@react-native/babel-preset'],
};
```

---

## Clean Build Commands

```bash
# Metro cache
npm start -- --reset-cache

# Android
cd android && ./gradlew clean && cd ..

# iOS
cd ios && rm -rf Pods Podfile.lock build && pod install && cd ..

# Full reset
rm -rf node_modules && npm install
```

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| `Command failed: ./gradlew...` | `cd android && ./gradlew clean` then retry |
| `xcrun: unable to find utility` | `sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer` |
| `adb: command not found` | Verify `$ANDROID_HOME` is set and PATH includes `platform-tools` |
| `error: Could not find iPhone` | Open Simulator app first, or specify: `npm run ios -- --simulator="iPhone 16"` |
| Metro cache stale | `npm start -- --reset-cache` |
| CocoaPods out of date | `cd ios && pod install --repo-update && cd ..` |

---

**Version:** React Native 0.83.4 | Node.js 20.19.4+ | Xcode 16.1+ | JDK 17
**Source:** https://reactnative.dev/docs/set-up-your-environment
