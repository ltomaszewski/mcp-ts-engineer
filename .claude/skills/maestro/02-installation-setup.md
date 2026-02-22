# MODULE 2: INSTALLATION & SETUP

## System Requirements

### Minimum Specifications

| Component | Requirement | Details |
|-----------|-------------|---------|
| **Java** | JDK 17+ (required) | v2.0 breaking change -- Java 11 no longer supported |
| **Memory** | 2GB minimum, 8GB recommended | RAM allocation |
| **Disk Space** | 2GB | Tools + dependencies |
| **macOS** | 10.13+ | For iOS development |
| **Android API** | Level 29, 30, 31, 33, or 34 | Supported API levels (35-36 support expected Q1 2026) |
| **iOS Version** | 16, 17, 18, or 24 | Supported iOS runtimes |

### Platform-Specific Prerequisites

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`
- Homebrew: https://brew.sh
- Apple ID for iOS development
- Latest Xcode installed from Mac App Store

**Android:**
- Android Studio or Android SDK Command Line Tools
- Set `ANDROID_HOME` environment variable
- Configured emulator or connected device (Pixel 8 recommended for emulator)
- Android SDK Platform Tools

**iOS:**
- Xcode 14.0 or higher
- iOS Simulator or connected iPhone
- Command Line Tools configured in Xcode > Settings > Locations

## Installation Methods

### Method 1: Homebrew (macOS -- Recommended)

```bash
# Add repository
brew tap mobile-dev-inc/tap

# Install Maestro
brew install maestro

# Verify
maestro --version
# Output: Maestro 2.x.x
```

**Advantages:**
- Single command installation
- Automatic updates with `brew upgrade maestro`
- Easy uninstall with `brew uninstall maestro`

### Method 2: Curl Installation (macOS, Linux)

```bash
# Download and install
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Add to PATH if needed
export PATH=$PATH:~/.maestro/bin

# Verify
maestro --version
```

### Method 3: Windows Installation

```bash
# Option A: Curl (same as above in PowerShell)
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Option B: Manual download
# 1. Download maestro.zip from https://github.com/mobile-dev-inc/maestro/releases
# 2. Extract to a stable location (e.g., C:\maestro)
# 3. Add bin folder to PATH:
setx PATH "%PATH%;C:\maestro\bin"
# 4. Restart terminal
```

### Method 4: Maestro Studio Desktop (GUI)

Maestro Studio Desktop is a lightweight IDE for visual test creation:

| Platform | Installer |
|----------|-----------|
| **Windows** | `MaestroStudio.exe` |
| **macOS** | `MaestroStudio.dmg` (drag to Applications) |
| **Linux** | `MaestroStudio.AppImage` (requires `chmod +x` and `--no-sandbox`) |

Download from https://maestro.dev/

## Environment Configuration

### JAVA_HOME Setup (Required -- Java 17+)

```bash
# Find Java installation
/usr/libexec/java_home -v 17

# Add to profile
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc

# Verify
source ~/.zshrc
echo $JAVA_HOME
java -version  # Must show JDK 17+
```

**Alternative -- Install via SDKMAN:**
```bash
curl -s "https://get.sdkman.io" | bash
sdk install java 17.0.5-tem
```

### ANDROID_HOME Setup

```bash
# Identify Android SDK location
# Default: ~/Library/Android/sdk (macOS) or ~/Android/sdk (Linux)

# Add to shell profile
echo 'export ANDROID_HOME=$HOME/Library/Android/sdk' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/emulator' >> ~/.zshrc
echo 'export PATH=$PATH:$ANDROID_HOME/platform-tools' >> ~/.zshrc

# Apply changes
source ~/.zshrc

# Verify
echo $ANDROID_HOME
adb --version  # Should show version
```

### Verify Environment

```bash
maestro doctor

# Output shows:
# Maestro CLI version 2.x.x
# Java JDK 17.x.x (JAVA_HOME set correctly)
# Android SDK (ANDROID_HOME: /Users/dev/Library/Android/sdk)
# Android Emulator: Available
# iOS Simulator: Available
# Network: Connected
#
# Status: Ready for testing
```

## Device Setup

### Android Emulator Configuration

```bash
# List available emulators
emulator -list-avds

# Start emulator (Pixel 8 recommended)
emulator -avd Pixel_8_API_34

# Or use Android Studio: Tools > Device Manager > Create Device

# Verify connection
maestro devices
```

### iOS Simulator Setup (macOS Only)

```bash
# List simulators
xcrun simctl list devices

# Start simulator
open -a Simulator

# Or via Xcode: Xcode > Open Developer Tool > Simulator

# Verify
maestro devices
```

### Real Android Device

1. **Enable Developer Mode:** Settings > About > Build Number (tap 7 times)
2. **Enable USB Debugging:** Settings > Developer Options > USB Debugging
3. **Connect via USB:** `adb devices` should show device
4. **Authorize Computer:** Tap "Allow" on device prompt

### Real iOS Device

1. **Enable Developer Mode:** Settings > Privacy > Developer Mode (toggle on)
2. **Trust Computer:** Settings > General > Device Management > Trust
3. **Connect via USB:** `maestro devices` should show device

### Specify Device for Tests

```bash
# Run on specific device (v2.1+ supports --device flag on test command)
maestro test flow.yaml --device emulator-5554

# Filter by platform (v2.1+)
maestro test .maestro/ --platform ios

# Sharding across multiple devices
maestro test .maestro/ --shard-all 3
maestro test .maestro/ --shard-split 3
```

## Environment Variables

### Driver Startup Timeout

```bash
# Default: 15,000ms (Android), 120,000ms (iOS)
# Extend for slow CI machines:
export MAESTRO_DRIVER_STARTUP_TIMEOUT=180000  # 3 minutes
```

### Built-in Environment Variables (v2.2+)

| Variable | Description |
|----------|-------------|
| `MAESTRO_DEVICE_UDID` | UDID of the device running the test |
| `MAESTRO_SHARD_ID` | Shard identifier when using `--shard-*` |
| `MAESTRO_SHARD_INDEX` | Zero-based shard index |

---

**See Also:** [03-core-concepts.md](03-core-concepts.md) for Flow fundamentals, Commands, and Selectors.

**Version:** 2.x (2.2.0) | **Source:** https://docs.maestro.dev/maestro-cli/how-to-install-maestro-cli
