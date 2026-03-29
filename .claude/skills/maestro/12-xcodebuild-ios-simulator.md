# MODULE 12: XCODEBUILD FOR iOS SIMULATOR BUILDS

## Overview

When running E2E tests with Maestro, you need a standalone `.app` file that doesn't require Metro bundler. This guide covers the correct `xcodebuild` usage for building iOS simulator apps.

## Key Concepts

### Why Not Use `expo run:ios`?

- `expo run:ios` starts Metro bundler and **never exits**
- For CI/CD and automated testing, you need the build to complete and exit
- Use `xcodebuild` directly for full control over the build process

### Build Output Location

The `.app` file will be located at:
```
<derivedDataPath>/Build/Products/<Configuration>-iphonesimulator/<AppName>.app
```

Example:
```
ios/build/Build/Products/Release-iphonesimulator/MyApp.app
```

---

## Complete xcodebuild Command

### For Expo/React Native Projects

```bash
xcodebuild \
  clean build \
  -workspace ios/MyApp.xcworkspace \
  -scheme MyApp \
  -configuration Release \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=iPhone 16 Pro" \
  -derivedDataPath ios/build \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO
```

### Command Breakdown

| Option | Description |
|--------|-------------|
| `clean build` | Clean previous artifacts, then build (use together!) |
| `-workspace` | Path to `.xcworkspace` file |
| `-scheme` | Build scheme name (usually app name) |
| `-configuration` | `Release` for standalone, `Debug` for dev |
| `-sdk iphonesimulator` | Target iOS Simulator SDK |
| `-destination` | Target simulator device |
| `-derivedDataPath` | Custom output directory (important!) |
| `CODE_SIGN_IDENTITY=""` | Disable code signing for simulator |
| `CODE_SIGNING_REQUIRED=NO` | Simulator builds don't need signing |
| `CODE_SIGNING_ALLOWED=NO` | Prevent signing attempts |

---

## Critical Gotchas

### 1. derivedDataPath Often Ignored with Workspaces

**IMPORTANT**: `-derivedDataPath` is frequently ignored by xcodebuild when building workspaces (`.xcworkspace`). The build output goes to the default DerivedData location instead.

**Workaround**: Search for the `.app` in the default DerivedData location:
```bash
APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData \
  -path "*YourApp*" \
  -name "YourApp.app" \
  -path "*Release-iphonesimulator*" \
  -type d 2>/dev/null | head -1)
```

If you must use `-derivedDataPath`, don't use equals sign:
```bash
# CORRECT
-derivedDataPath ios/build

# WRONG
-derivedDataPath=ios/build
```

### 2. Clean Before Build

Run clean and build as separate steps for more reliable results:
```bash
# Step 1: Clean
xcodebuild clean -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release

# Step 2: Build
xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release \
  -sdk iphonesimulator -destination "platform=iOS Simulator,name=iPhone 16 Pro" \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO CODE_SIGNING_ALLOWED=NO \
  build
```

Alternatively, use them together:
```bash
xcodebuild clean build -workspace ...
```

### 3. Code Signing for Simulator

Simulator builds don't need code signing. Always include:
```bash
CODE_SIGN_IDENTITY="" \
CODE_SIGNING_REQUIRED=NO \
CODE_SIGNING_ALLOWED=NO
```

### 4. Don't Mix -arch with -destination

When using `-destination`, don't specify `-arch`. Use `ARCHS` instead if needed:
```bash
# WRONG
-arch arm64 -destination "platform=iOS Simulator,name=iPhone 16 Pro"

# CORRECT (if you need to specify architecture)
ARCHS="arm64 x86_64" -destination "platform=iOS Simulator,name=iPhone 16 Pro"
```

---

## Full E2E Testing Script

### Complete Workflow

```bash
#!/bin/bash
set -e

APP_DIR="$(pwd)"
DEVICE_NAME="iPhone 16 Pro"
BUNDLE_ID="com.example.myapp"
BUILD_DIR="$APP_DIR/ios/build"
CONFIGURATION="Release"

# Step 1: Generate native projects (Expo)
echo "Prebuilding..."
npx expo prebuild --clean

# Step 2: Build with xcodebuild
echo "Building..."
rm -rf "$BUILD_DIR"

xcodebuild \
  clean build \
  -workspace "$APP_DIR/ios/MyApp.xcworkspace" \
  -scheme MyApp \
  -configuration "$CONFIGURATION" \
  -sdk iphonesimulator \
  -destination "platform=iOS Simulator,name=$DEVICE_NAME" \
  -derivedDataPath "$BUILD_DIR" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO

# Step 3: Find simulator UDID
UDID=$(xcrun simctl list devices | grep "$DEVICE_NAME" | grep -oE '\([0-9A-F-]+\)' | head -1 | tr -d '()')

# Step 4: Install app
APP_PATH="$BUILD_DIR/Build/Products/$CONFIGURATION-iphonesimulator/MyApp.app"
xcrun simctl install "$UDID" "$APP_PATH"

# Step 5: Launch app
xcrun simctl launch "$UDID" "$BUNDLE_ID"

# Step 6: Run Maestro tests
sleep 5  # Wait for app to stabilize
maestro test .maestro/
```

---

## Simulator Management

### Reset Simulator (Clean State)

```bash
# Get UDID
UDID=$(xcrun simctl list devices | grep "iPhone 16 Pro" | grep -oE '\([0-9A-F-]+\)' | head -1 | tr -d '()')

# Shutdown if running
xcrun simctl shutdown "$UDID" 2>/dev/null || true

# Erase (complete reset)
xcrun simctl erase "$UDID"

# Boot
xcrun simctl boot "$UDID"

# Wait for boot
sleep 5
```

### Install and Launch App

```bash
# Install
xcrun simctl install "$UDID" "/path/to/MyApp.app"

# Launch
xcrun simctl launch "$UDID" "com.example.myapp"

# Terminate
xcrun simctl terminate "$UDID" "com.example.myapp"

# Uninstall
xcrun simctl uninstall "$UDID" "com.example.myapp"
```

---

## Maestro Test Configuration

### launchApp with Clean State

```yaml
appId: com.example.myapp
---
- launchApp:
    clearState: true      # Clear app data/preferences
    clearKeychain: true   # Clear keychain (auth tokens)
- assertVisible:
    id: welcome_screen
```

### Known Issue: clearState Reliability

`clearState` may not reliably clear UserDefaults on iOS. Workaround:

```yaml
# Use clearState command before launchApp
- clearState
- launchApp:
    clearState: true
    clearKeychain: true
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on:
  push:
    branches: [main]

jobs:
  e2e:
    runs-on: macos-14  # Use latest macOS for M1 simulators
    timeout-minutes: 60

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install Dependencies
        run: npm ci

      - name: Install Maestro
        run: |
          curl -fsSL "https://get.maestro.mobile.dev" | bash
          echo "$HOME/.maestro/bin" >> $GITHUB_PATH

      - name: Prebuild iOS
        run: npx expo prebuild --clean

      - name: Build for Simulator
        run: |
          xcodebuild \
            clean build \
            -workspace ios/MyApp.xcworkspace \
            -scheme MyApp \
            -configuration Release \
            -sdk iphonesimulator \
            -destination "platform=iOS Simulator,name=iPhone 15 Pro" \
            -derivedDataPath ios/build \
            CODE_SIGN_IDENTITY="" \
            CODE_SIGNING_REQUIRED=NO \
            CODE_SIGNING_ALLOWED=NO

      - name: Boot Simulator
        run: |
          xcrun simctl boot "iPhone 15 Pro" || true
          sleep 10

      - name: Install App
        run: |
          xcrun simctl install booted ios/build/Build/Products/Release-iphonesimulator/MyApp.app

      - name: Run Maestro Tests
        run: maestro test .maestro/

      - name: Upload Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: maestro-results
          path: |
            ~/.maestro/tests/
            .maestro/.screenshots/
```

---

## Troubleshooting

### Build Fails: "No matching destination"

List available simulators:
```bash
xcrun simctl list devices available
```

Use exact name from the list in `-destination`.

### App Not Found After Build

Check if derivedDataPath was used correctly:
```bash
find ios/build -name "*.app" -type d
```

If empty, the build may have gone to default DerivedData:
```bash
find ~/Library/Developer/Xcode/DerivedData -name "MyApp.app" -type d
```

### Code Signing Errors

Ensure all three code signing flags are set:
```bash
CODE_SIGN_IDENTITY="" \
CODE_SIGNING_REQUIRED=NO \
CODE_SIGNING_ALLOWED=NO
```

---

## References

- [Sauce Labs - Creating Simulator .app Files](https://docs.saucelabs.com/mobile-apps/automated-testing/app-files/)
- [Apple xcodebuild Man Page](https://keith.github.io/xcode-man-pages/xcodebuild.1.html)
- [Maestro React Native Support](https://docs.maestro.dev/platform-support/react-native)
- [Expo Prebuild Documentation](https://docs.expo.dev/workflow/prebuild/)

---

**Version:** 2.x (2.3.1) | **Source:** https://docs.maestro.dev/
