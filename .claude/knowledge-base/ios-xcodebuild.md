# iOS xcodebuild Best Practices

## Overview

This document captures lessons learned when using `xcodebuild` for iOS simulator builds, particularly in CI/E2E testing contexts.

---

## Critical Rules

### 1. Use UDID for Destination (NOT Device Name)

**Problem**: xcodebuild fails to match devices by name alone.

```bash
# ❌ WRONG - Unreliable, often fails with "Unable to find device"
xcodebuild -destination "platform=iOS Simulator,name=iPhone 16 Pro" ...

# Error: Unable to find a device matching the provided destination specifier:
#        { platform:iOS Simulator, OS:latest, name:iPhone 16 Pro }
```

**Solution**: Use the simulator UDID directly.

```bash
# Get UDID first
UDID=$(xcrun simctl list devices | grep "iPhone 16 Pro" | grep -oE '\([0-9A-F-]+\)' | head -1 | tr -d '()')

# ✅ CORRECT - Use UDID
xcodebuild -destination "id=$UDID" ...
```

**Why**: Device names can have encoding issues, multiple matches, or require exact OS version. UDID is unique and unambiguous.

---

### 2. Use Custom derivedDataPath

**Problem**: Global DerivedData (`~/Library/Developer/Xcode/DerivedData`) contains stale builds from old projects.

```bash
# ❌ WRONG - May find old/stale .app files
find ~/Library/Developer/Xcode/DerivedData -name "*.app"
# Could return: OldProject.app, OldProject.app, etc.
```

**Solution**: Use custom `-derivedDataPath` for isolated, predictable builds.

```bash
DERIVED_DATA="./ios/build/DerivedData"

# Clean before building
rm -rf "$DERIVED_DATA"
mkdir -p "$DERIVED_DATA"

# ✅ CORRECT - Isolated build output
xcodebuild \
  -workspace ios/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -sdk iphonesimulator \
  -destination "id=$UDID" \
  -derivedDataPath "$DERIVED_DATA" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  build

# App location is now predictable:
# $DERIVED_DATA/Build/Products/Release-iphonesimulator/App.app
```

**Why**:
- Avoids conflicts with other projects
- Ensures fresh builds
- Makes .app location predictable

---

### 3. Verify Build Actually Succeeded

**Problem**: When piping xcodebuild output, exit code can be unreliable. Previous cached output may show "BUILD SUCCEEDED" even when build failed.

```bash
# ❌ WRONG - Exit code unreliable when piping
xcodebuild ... 2>&1 | tail -30
# May show "BUILD SUCCEEDED" from cache even if current build failed
```

**Solution**: Save full log and verify BUILD SUCCEEDED string exists.

```bash
# ✅ CORRECT - Save log and verify
xcodebuild ... 2>&1 | tee /tmp/xcodebuild.log | tail -50

if ! grep -q "BUILD SUCCEEDED" /tmp/xcodebuild.log; then
  echo "Build failed!"
  cat /tmp/xcodebuild.log
  exit 1
fi
```

---

## Complete Example Script

```bash
#!/bin/bash
set -e

DEVICE_NAME="iPhone 16 Pro"
WORKSPACE="ios/App.xcworkspace"
SCHEME="App"
CONFIGURATION="Release"
DERIVED_DATA="./ios/build/DerivedData"

# Get simulator UDID
UDID=$(xcrun simctl list devices | grep "$DEVICE_NAME" | grep -oE '\([0-9A-F-]+\)' | head -1 | tr -d '()')

if [ -z "$UDID" ]; then
  echo "Simulator not found: $DEVICE_NAME"
  exit 1
fi

# Clean build directory
rm -rf "$DERIVED_DATA"
mkdir -p "$DERIVED_DATA"

# Build with UDID and custom derivedDataPath
xcodebuild \
  -workspace "$WORKSPACE" \
  -scheme "$SCHEME" \
  -configuration "$CONFIGURATION" \
  -sdk iphonesimulator \
  -destination "id=$UDID" \
  -derivedDataPath "$DERIVED_DATA" \
  CODE_SIGN_IDENTITY="" \
  CODE_SIGNING_REQUIRED=NO \
  CODE_SIGNING_ALLOWED=NO \
  build \
  2>&1 | tee /tmp/xcodebuild.log | tail -50

# Verify build succeeded
if ! grep -q "BUILD SUCCEEDED" /tmp/xcodebuild.log; then
  echo "Build failed!"
  exit 1
fi

# Find the .app
APP_PATH=$(find "$DERIVED_DATA" -name "*.app" -path "*$CONFIGURATION-iphonesimulator*" -type d | head -1)

if [ -z "$APP_PATH" ]; then
  echo "App not found in build output"
  exit 1
fi

echo "Built: $APP_PATH"

# Install to simulator
xcrun simctl install "$UDID" "$APP_PATH"
```

---

## Quick Reference

| Issue | Wrong | Correct |
|-------|-------|---------|
| Device not found | `-destination "name=iPhone 16 Pro"` | `-destination "id=$UDID"` |
| Stale builds | Global DerivedData | `-derivedDataPath ./build` |
| False success | `xcodebuild \| tail` | `xcodebuild \| tee log && grep BUILD SUCCEEDED` |

---

