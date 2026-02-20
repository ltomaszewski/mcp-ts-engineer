# 01 — Framework Overview & Core Concepts

**Module Summary**: Comprehensive introduction to Expo as a framework, its architecture, core concepts, and the mental model of universal app development. Covers file-based routing, EAS services, and when to use Expo.

---

## What is Expo?

Expo is a framework built on top of React Native that simplifies developing Android, iOS, and web apps from a single JavaScript/TypeScript codebase. It provides:

1. **Rapid development** — Write once, run on iOS, Android, and web
2. **Zero native build configuration** — No need to manage Android Studio or Xcode for basic apps
3. **Rich SDK modules** — Camera, location, notifications, maps, and 100+ more
4. **Managed build & deployment** — Optional Expo Application Services (EAS)

**Source**: https://docs.expo.dev/get-started/introduction/

---

## The Mental Model: Development Loop

Expo's development process follows this pattern:

```
Code (TypeScript/JavaScript)
    ↓
    ├→ Expo CLI watches files
    ├→ Metro bundler compiles
    └→ Live reload / Fast Refresh
           ↓
        [Simulator/Device] ← Preview app
           ↓
       Modify code → Instant hot reload
           ↓
        Test locally on real devices
           ↓
        Build signed binary (EAS or local)
           ↓
        Deploy to app stores / web
```

### Key Phases

#### 1. **Local Development**
- Use `npx expo start` to launch development server
- App loads in Expo Go or custom dev client
- Fast Refresh: Modify code, see changes instantly
- Access dev menu (press `m` in terminal) for debugging

#### 2. **Custom Development Builds**
- When you need native modules beyond Expo SDK
- `npx expo prebuild` generates native iOS/Android directories
- Run with Xcode/Android Studio for full native debugging

#### 3. **Production Build**
- EAS Build: Managed cloud builds for iOS/Android
- Local builds: `eas build --local` using your machine
- Both produce signed, distribution-ready binaries

#### 4. **Distribution**
- iOS: TestFlight (testing) → App Store (production)
- Android: Google Play Console
- Web: Vercel, Netlify, or any static host

**Source**: https://docs.expo.dev/guides/overview/

---

## Core Concepts

### File-Based Routing (Expo Router)

Expo Router brings file-based routing (like Next.js) to React Native:

```
app/
├── _layout.tsx          # Root navigation container
├── index.tsx            # Home screen (/)
├── profile.tsx          # Profile screen (/profile)
└── [id].tsx             # Dynamic route (/user/123)
```

Each file automatically becomes a screen. Organize navigation with layout files.

**Cross-ref**: See [07-guide-routing-navigation.md](07-guide-routing-navigation.md) for complete routing API.

### Universal Code

Write code once that runs on:
- **iOS** (via React Native)
- **Android** (via React Native)
- **Web** (via React Native for Web)

Use platform-specific code when needed:

```typescript
import { Platform } from 'react-native';

if (Platform.OS === 'ios') {
  // iOS-specific code
} else if (Platform.OS === 'android') {
  // Android-specific code
} else if (Platform.OS === 'web') {
  // Web-specific code
}
```

**Best Practice**: Minimize platform-specific code; design UI to work universally.

### App Configuration (app.json)

Central configuration file for your app:

```json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "ios": {
      "bundleIdentifier": "com.company.myapp",
      "buildNumber": "1"
    },
    "android": {
      "package": "com.company.myapp",
      "versionCode": 1
    },
    "plugins": [
      "expo-camera",
      ["expo-location", { "locationAlwaysAndWhenInUsePermissions": true }]
    ]
  }
}
```

Config plugins modify native iOS/Android build settings declaratively.

**See**: app.json reference for all configurable options at https://docs.expo.dev/guides/app-config/

### Expo SDK Modules

Expo provides 100+ modules for device capabilities:

| Category | Examples |
|----------|----------|
| **Media** | Camera, ImagePicker, Video, Audio |
| **Location** | Location, Geolocation, Maps |
| **Device** | Haptics, Battery, Device Info, SecureStore |
| **Notification** | Push Notifications, Local Notifications |
| **Data** | AsyncStorage, SQLite, Filesystem |
| **Hardware** | Sensors, Accelerometer, Compass |

All available at: https://docs.expo.dev/versions/latest/sdk/

---

## Expo vs. Plain React Native

| Aspect | Expo | Plain React Native |
|--------|------|-------------------|
| **Setup Time** | Minutes | Hours (Xcode, Android Studio) |
| **Native Module Access** | Built-in for 100+, custom via prebuild | All native libraries |
| **Development Speed** | Fast Refresh, no compile | Longer rebuild times |
| **Build Complexity** | EAS handles signing/provisioning | Manual keystore, certificates |
| **Web Support** | Built-in | React Native Web (community) |
| **When to Use** | Most apps | Apps requiring deeply custom native code |

**Decision Point**: Use Expo by default. Switch to plain React Native only if you need native modules not available via Expo.

**Source**: https://docs.expo.dev/guides/overview/

---

## Expo Application Services (EAS)

EAS extends Expo with cloud-based services for the entire app lifecycle:

### EAS Build
- Cloud infrastructure for compiling iOS/Android binaries
- Handles code signing, provisioning profiles, certificates
- No local native environment needed
- Integrates with CI/CD (GitHub Actions, GitLab CI, etc.)

### EAS Submit
- Automated app store submission
- Uploads to Apple App Store, Google Play Store
- Handles app review requirements

### EAS Updates
- Push updates to users without app store review
- JavaScript/TypeScript code + assets only (not native code)
- Downgrade or rollback versions instantly

### EAS Metadata
- Centralized store listing management
- iOS App Store, Google Play metadata in JSON

### Automation & Workflows
- EAS Workflows: YAML-based automation for builds, tests, submissions
- Trigger on PR, tag, schedule, or manually
- Parallel builds, conditional steps, notifications

**Cross-ref**: See [11-guide-eas-services.md](11-guide-eas-services.md) for complete EAS workflows.

**Source**: https://docs.expo.dev/eas/

---

## When to Use Expo

### ✅ Good Fit
- **Greenfield projects** (building from scratch)
- **Cross-platform apps** that need iOS, Android, and web
- **Rapid prototyping** and MVP development
- **Apps that don't need deeply custom native code**
- **Teams wanting to avoid native build complexity**
- **Published apps** needing automated deployment

### ⚠️ Consider Plain React Native if:
- **You need a native module not in Expo SDK** (and can't add via Modules API)
- **You have deep expertise in iOS/Android native development**
- **Your app requires very fine-grained control of native behavior**
- **You're already invested in plain React Native**

### ❌ Not Suitable for:
- Apps needing Java/Swift for 100% of business logic
- Projects where you must use specific proprietary native libraries
- Extreme performance-critical games (consider game engines instead)

**Source**: https://docs.expo.dev/guides/overview/

---

## Architecture: What Happens Under the Hood?

### Development Mode (`expo start`)

1. **Expo CLI** starts a local development server
2. **Metro bundler** transforms TypeScript → JavaScript + assets
3. **Fast Refresh** watches for file changes
4. **Your app** (Expo Go or dev client) connects to server
5. **Hot reload** updates JS without restarting app

**Network**: App and CLI communicate over local network or Tunnel (cloud relay).

### Production Build

1. **App Configuration** (app.json) + source code → build inputs
2. **EAS Build service** (or local machine):
   - Fetches dependencies
   - Runs prebuild (generates native iOS/Android)
   - Compiles with native tools (Xcode/Gradle)
   - Signs with credentials
3. **Output**: Signed `.ipa` (iOS) or `.aab`/`.apk` (Android)
4. **Distribution**: Uploaded to store (TestFlight, Play Console, etc.)

### Code Execution

```
User taps app icon
    ↓
OS loads JavaScript engine (Hermes or JavaScriptCore)
    ↓
Loads JavaScript bundle (app.js compiled from TypeScript)
    ↓
React renders component tree
    ↓
Native components (Text, View, etc.) render on screen
    ↓
User interaction → JavaScript event handler → setState → re-render
```

---

## Key Files & Directories

```
my-app/
├── app/                    # File-based routing (Expo Router)
│   ├── _layout.tsx
│   ├── index.tsx
│   └── [id].tsx
├── app.json                # Configuration, plugins, metadata
├── package.json            # Dependencies
├── package-lock.json       # Lock file
├── .env                    # Environment variables (not committed)
├── tsconfig.json           # TypeScript config
├── babel.config.js         # Babel transformation config
├── metro.config.js         # Metro bundler config
├── eas.json                # EAS configuration (build profiles, etc.)
├── android/                # Native Android (if prebuilt)
├── ios/                    # Native iOS (if prebuilt)
└── node_modules/           # Dependencies
```

**See**: [02-quickstart-setup.md](02-quickstart-setup.md) for detailed setup.

---

## Terminology Glossary

| Term | Meaning |
|------|---------|
| **Expo Go** | Pre-built dev app (iOS, Android) for instant previewing |
| **Dev Client** | Custom dev build with your plugins/native code |
| **Prebuild** | Generate native iOS/Android directories from app.json + plugins |
| **EAS Build** | Cloud build service; compiles and signs your app |
| **Development Build** | Build for testing custom native code locally |
| **Release Build** | Signed production build for distribution |
| **Update** | Push JS/asset changes without app store review |
| **Tunnel** | Cloud relay for dev server when not on same network |
| **config plugin** | Declarative way to configure native settings in app.json |

---

## Next Steps

1. **Get started**: [02-quickstart-setup.md](02-quickstart-setup.md) — Create your first project
2. **Build UI**: [07-guide-routing-navigation.md](07-guide-routing-navigation.md) — Learn routing and navigation
3. **Add features**: [03-api-auth.md](03-api-auth.md), [04-api-data-storage.md](04-api-data-storage.md), [05-api-device-access.md](05-api-device-access.md)
4. **Deploy**: [10-guide-build-publish.md](10-guide-build-publish.md) — Create production builds
5. **Optimize**: [14-best-practices-performance.md](14-best-practices-performance.md) — Improve app performance

---

**Source Attribution**: All content sourced from https://docs.expo.dev/  
**Last Updated**: December 2024
