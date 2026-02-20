# React Native 0.83 - Quickstart & Environment Setup

**Complete platform setup (macOS/Windows/Linux) and first project creation**

---

## 🏁 Quick Start (Choose Your Path)

### New to React Native? (Start here)
1. Choose your platform below (macOS, Windows, or Linux)
2. Complete "Verification Checklist"
3. Create a new project
4. Run on device/simulator

### Already familiar with React development?
Jump to **[Create New Project](#create-new-project)** after environment verification.

---

## 💻 macOS Setup

### Prerequisites
- macOS 12+
- Internet connection
- ~50GB disk space (Xcode, Android Studio)

### Step 1: Install Homebrew (if needed)

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

### Step 2: Install Node & Watchman

```bash
brew install node watchman
```

Verify:
```bash
node --version    # Should be 20.19.4+
npm --version     # Should be 10+
watchman --version
```

### Step 3: Install Java Development Kit (JDK)

For Android development:

```bash
brew install --cask zulu@17
```

Configure JAVA_HOME:
```bash
# Add to ~/.zshrc (or ~/.bash_profile for older macOS)
export JAVA_HOME=/Library/Java/JavaVirtualMachines/zulu-17.jdk/Contents/Home

# Reload shell
source ~/.zshrc

# Verify
echo $JAVA_HOME
```

### Step 4: Install Xcode (iOS Development)

```bash
# Command line tools only (minimal)
xcode-select --install

# Or full Xcode from App Store (recommended, ~12GB)
# Then:
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

Install CocoaPods:
```bash
sudo gem install cocoapods
```

### Step 5: Install Android Studio

1. Download: https://developer.android.com/studio
2. Run installer
3. Launch Android Studio

**Configure SDK in Android Studio:**
1. Open Android Studio → SDK Manager
2. Go to SDK Platforms tab:
   - Check "Show Package Details"
   - Select "Android 15" (API Level 35)
   - Select "Android SDK Platform 35"
   - Select "Intel x86 Atom_64" system image
3. Go to SDK Tools tab:
   - Expand "Android SDK Build-Tools"
   - Select "35.0.0"
   - Click "Apply"

### Step 6: Configure Android Environment

```bash
# Add to ~/.zshrc
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

# Reload
source ~/.zshrc

# Verify
echo $ANDROID_HOME
adb version
```

### macOS Verification

```bash
node --version
npm --version
java -version
echo $JAVA_HOME
echo $ANDROID_HOME
xcode-select --print-path
pod --version
watchman --version
```

All should return versions without errors.

---

## 🪟 Windows Setup

### Prerequisites
- Windows 10+
- Internet connection
- ~40GB disk space

### Step 1: Install Chocolatey (Package Manager)

Open PowerShell as Administrator:
```powershell
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
```

### Step 2: Install Node & JDK

```powershell
choco install -y nodejs-lts microsoft-openjdk17
```

Verify:
```powershell
node --version    # 20.19.4+
npm --version
java -version     # Shows OpenJDK 17
```

### Step 3: Install Android Studio

1. Download: https://developer.android.com/studio
2. Run installer
3. Use default settings

### Step 4: Configure Android SDK

In Android Studio:
1. Tools → Device Manager
2. Create Virtual Device (or connect physical device)
3. Tools → SDK Manager:
   - Platforms: Android 15 (API 35)
   - Tools: Build-Tools 35.0.0

### Step 5: Set Environment Variables

1. Press `Win + R`, type `sysdm.cpl`, press Enter
2. Click "Environment Variables"
3. Click "New" under User Variables:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YourUsername\AppData\Local\Android\Sdk`
4. Edit `Path` variable, add: `C:\Users\YourUsername\AppData\Local\Android\Sdk\platform-tools`
5. Restart Command Prompt

### Step 6: Verify Setup

```powershell
echo %ANDROID_HOME%
adb devices          # Should list devices
```

**Note:** iOS development requires macOS. Use Android emulator on Windows.

---

## 🐧 Linux Setup (Ubuntu/Debian)

### Prerequisites
- Ubuntu 18.04+ or Debian equivalent
- Sudo access
- ~40GB disk space

### Step 1: Install Node.js

```bash
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

Verify:
```bash
node --version
npm --version
```

### Step 2: Install Dependencies

```bash
sudo apt-get install -y watchman openjdk-17-jdk-headless
```

### Step 3: Download Android Studio

```bash
# Visit https://developer.android.com/studio
# Download Linux version
tar -xzf android-studio-*.tar.gz
sudo mv android-studio /opt/
/opt/android-studio/bin/studio.sh
```

### Step 4: Configure Android SDK

Same as Windows Step 4 in Android Studio GUI.

### Step 5: Set Environment Variables

```bash
# Add to ~/.bashrc or ~/.zshrc
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/platform-tools

source ~/.bashrc
```

### Step 6: Verify

```bash
echo $ANDROID_HOME
adb devices
```

---

## 📱 Device Setup

### Android Emulator

1. Open Android Studio
2. Device Manager → Create Virtual Device
3. Select "Pixel 6" (or your preferred device)
4. Choose "API Level 35"
5. Click "Next" → "Finish"
6. Click play button to launch

Verify:
```bash
adb devices
# Output: emulator-5554 device
```

### Android Physical Device

1. Enable Developer Mode:
   - Settings → About Phone
   - Tap "Build Number" 7 times
2. Enable USB Debugging:
   - Settings → Developer Options → USB Debugging (ON)
3. Connect via USB cable
4. Trust computer when prompted

Verify:
```bash
adb devices
# Should list your device
```

### iOS Simulator (macOS only)

1. Open Simulator:
```bash
open -a Simulator
```

2. Or from Xcode:
   - Xcode → Open Developer Tool → Simulator

3. In Simulator:
   - Hardware → Device → Choose your device
   - Hardware → Version → Choose iOS version

### iOS Physical Device (macOS only)

**Prerequisites:**
- iPhone with Developer Mode enabled (iOS 16+)
- Xcode installed
- Paid Apple Developer account

**Setup:**
1. Settings → Privacy & Security → Developer Mode (ON)
2. Trust computer when prompted
3. Connect via USB
4. Open Xcode project from ios folder
5. Select your device as build target
6. Run with ⌘R

---

## 🎯 Create New Project

### Using React Native CLI

```bash
# Create project
npx @react-native-community/cli@latest init MyProject --version 0.83

# Navigate to project
cd MyProject

# Install dependencies
npm install
```

### Project Naming Rules

- No spaces (use camelCase or PascalCase)
- No special characters except hyphen/underscore
- ✅ Good: `MyAwesomeApp`, `my-awesome-app`
- ❌ Bad: `My Awesome App`, `MyAwesome!App`

### TypeScript by Default

All files use `.tsx` extension. Type your components:

```typescript
// App.tsx
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome to React Native!</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000000',
  },
});
```

---

## 🚀 First Run

### Start Metro Bundler

```bash
cd MyProject
npm start
```

Keep this running in a terminal. You'll see:
```
│ Starting the app on pid <pid>.
│ Starting Metro Bundler
```

### Run on Device (New Terminal)

**Android:**
```bash
npm run android
```

You'll see:
- Metro compiling messages
- App loading on emulator/device
- Welcome screen with "Tap to reload"

**iOS (macOS only):**
```bash
npm run ios
```

Same process as Android.

### Metro Commands

While Metro is running:

| Key | Action |
|-----|--------|
| `r` | Reload app |
| `a` | Open Android |
| `i` | Open iOS |
| `d` | Open DevTools |
| `j` | Open debugger |
| `q` | Quit Metro |

### Troubleshooting First Run

**Problem**: "Command failed: ./gradlew..."
**Solution**:
```bash
cd android && ./gradlew clean && cd ..
npm start -- --reset-cache
npm run android
```

**Problem**: "xcrun: error: unable to find utility..."
**Solution** (macOS):
```bash
sudo xcode-select --reset
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
```

**Problem**: "adb: command not found"
**Solution**: Check $ANDROID_HOME is set:
```bash
echo $ANDROID_HOME
```

---

## 📂 Project Structure

```
MyProject/
├── android/
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── java/
│   │   │   │   │   └── com/myproject/MainActivity.java
│   │   │   │   └── AndroidManifest.xml
│   │   └── build.gradle
│   ├── build.gradle
│   ├── gradle.properties
│   └── gradlew
│
├── ios/
│   ├── MyProject/
│   │   ├── AppDelegate.swift
│   │   ├── Info.plist
│   │   └── LaunchScreen.storyboard
│   ├── MyProject.xcodeproj/
│   ├── Podfile
│   └── Pods/
│
├── app.json          # App metadata
├── App.tsx           # Root component (TypeScript)
├── index.js          # Entry point
├── package.json      # Dependencies & scripts
├── tsconfig.json     # TypeScript config
├── metro.config.js   # Bundler config
└── .gitignore
```

---

## ⚙️ Configuration Files

### app.json

Metadata about your app:

```json
{
  "name": "MyProject",
  "displayName": "My Awesome App",
  "version": "1.0.0",
  "description": "A React Native app",
  "main": "index.js",
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint ."
  }
}
```

### package.json Scripts

```json
{
  "scripts": {
    "android": "react-native run-android",
    "ios": "react-native run-ios",
    "start": "react-native start",
    "test": "jest",
    "lint": "eslint .",
    "clean": "npm cache clean --force && rm -rf node_modules"
  }
}
```

### tsconfig.json

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

---

## 🔧 Common Setup Tasks

### Install a Package

```bash
# JavaScript/TypeScript package
npm install axios

# React Native package (may need linking)
npm install react-native-gesture-handler

# Dev dependency
npm install --save-dev @types/react-native
```

### Add Type Definitions

```bash
npm install --save-dev @types/react-native @types/react
```

### Clean Build Cache

```bash
# Clear Metro cache
npm start -- --reset-cache

# Clear npm cache
npm cache clean --force

# Android clean
cd android && ./gradlew clean && cd ..

# iOS clean
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..
```

---

## ✅ Verification Checklist

Before proceeding to **[03-core-components.md](03-core-components.md)**:

**Environment:**
- [ ] Node.js 20.19.4+ installed
- [ ] npm 10+ installed
- [ ] Java/JDK 17 installed
- [ ] Android Studio installed and SDK configured
- [ ] Xcode installed (macOS only) or command-line tools
- [ ] Environment variables set ($ANDROID_HOME, $JAVA_HOME on macOS)

**Device:**
- [ ] Android emulator running OR Android device connected
- [ ] iOS simulator running OR iOS device connected (macOS)

**Project:**
- [ ] New project created
- [ ] First run successful (see app on device)
- [ ] Metro reloads work (`r` key)
- [ ] Can modify code and see changes

---

**Source**: https://reactnative.dev/docs/getting-started
**Version**: React Native 0.83
**Last Updated**: December 2025
