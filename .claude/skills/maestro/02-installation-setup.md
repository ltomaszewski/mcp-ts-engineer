# MODULE 2: INSTALLATION & SETUP

## System Requirements

### Minimum Specifications

| Component | Requirement | Details |
|-----------|-------------|---------|
| **Node.js** | 18.0.0+ | JavaScript runtime |
| **Memory** | 2GB minimum, 8GB recommended | RAM allocation |
| **Disk Space** | 2GB | Tools + dependencies |
| **macOS** | 10.13+ | For iOS development |
| **Java** | JDK 17+ | Android development |
| **Android API** | Level 16+ | Minimum Android version |
| **iOS Version** | 11.0+ | Minimum iOS version |

### Platform-Specific Prerequisites

**macOS:**
- Xcode Command Line Tools: `xcode-select --install`
- Homebrew: https://brew.sh
- Apple ID for iOS development

**Android:**
- Android Studio or Android SDK Command Line Tools
- Set `ANDROID_HOME` environment variable
- Configured emulator or connected device
- Android SDK Platform Tools

**iOS:**
- Xcode 12.0 or higher
- iOS Simulator or connected iPhone
- Development Certificate (real devices)

## Installation Methods

### Method 1: Homebrew (macOS - Recommended)

```bash
# Add repository
brew tap mobile-dev-inc/tap

# Install Maestro
brew install maestro

# Verify
maestro --version
# Output: Maestro X.Y.Z (date)
```

**Advantages:**
- Single command installation
- Automatic updates with `brew upgrade maestro`
- Easy uninstall with `brew uninstall maestro`

### Method 2: Curl Installation (All Platforms)

```bash
# Download and install
curl -fsSL "https://get.maestro.mobile.dev" | bash

# Add to PATH if needed
export PATH=$PATH:~/.maestro/bin

# Verify
maestro --version
```

### Method 3: Manual Installation

1. Download binary from https://releases.maestro.dev
2. Extract to preferred location
3. Add to PATH:
   ```bash
   export PATH=$PATH:/path/to/maestro/bin
   ```
4. Verify: `maestro --version`

## Environment Configuration

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

### JAVA_HOME Setup

```bash
# Find Java installation
/usr/libexec/java_home -v 17

# Add to profile
echo 'export JAVA_HOME=$(/usr/libexec/java_home -v 17)' >> ~/.zshrc

# Verify
echo $JAVA_HOME
java -version  # Should show JDK 17+
```

### Verify Environment

```bash
maestro doctor

# Output shows:
✓ Maestro CLI version 1.35.0
✓ Java JDK 17.0.5 (JAVA_HOME set correctly)
✓ Android SDK 33.0.0 (ANDROID_HOME: /Users/dev/Library/Android/sdk)
✓ Android Emulator: Available (1 emulator)
✓ iOS Simulator: Available (6 simulators)
✓ Network: Connected

Status: Ready for testing ✓
```

## Device Setup

### Android Emulator Configuration

```bash
# List available emulators
emulator -list-avds

# Output:
# Pixel_6_Pro_API_33
# Pixel_5_API_30

# Start emulator
emulator -avd Pixel_6_Pro_API_33

# Or use Android Studio: Tools → Device Manager → Create Device

# Verify connection
maestro devices
```

### iOS Simulator Setup (macOS Only)

```bash
# List simulators
xcrun simctl list devices

# Start simulator (uses Simulator app)
open -a Simulator

# Or via Xcode: Xcode → Open Developer Tool → Simulator

# Verify
maestro devices

# Output shows:
# iPhone 14 Pro (iOS 16.0)
# iPhone SE (iOS 15.1)
```

### Real Android Device

1. **Enable Developer Mode:**
   ```
   Settings → About → Build Number (tap 7 times)
   ```

2. **Enable USB Debugging:**
   ```
   Settings → Developer Options → USB Debugging
   ```

3. **Connect via USB:**
   ```bash
   adb devices
   # Output: <device_id> device
   ```

4. **Authorize Computer:**
   - Tap "Allow" on device prompt
   - Verify: `maestro devices`

### Real iOS Device

1. **Enable Developer Mode:**
   ```
   Settings → Privacy → Developer Mode (toggle on)
   ```

2. **Trust Computer:**
   ```
   Settings → General → Device Management → Trust [Computer]
   ```

3. **Connect via USB:**
   ```bash
   # Verify connection
   maestro devices
   ```

4. **Install Certificate:**
   - Open Xcode
   - Xcode → Preferences → Accounts
   - Add Apple ID
   - Download certificate

---

**Next:** See **03-core-concepts.md** for Flow fundamentals, Commands, and Selectors.
