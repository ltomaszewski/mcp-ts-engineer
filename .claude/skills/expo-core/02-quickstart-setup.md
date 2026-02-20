# 02 — Quickstart Setup & Local Development

**Module Summary**: Step-by-step guide to create an Expo project, configure your development environment, run on simulators and real devices, and understand the CLI tools and configuration.

---

## Prerequisites

Before starting, ensure you have:
- **Node.js 18+** — Check with `node --version`
- **npm or yarn** — Package manager
- **Git** — Version control (optional but recommended)
- **For iOS testing**: Mac with Xcode 14+ or use simulator
- **For Android testing**: Android SDK/emulator or physical device

---

## Step 1: Create Your First Project

### Using Expo CLI (Recommended)

```bash
npx create-expo-app@latest my-awesome-app
cd my-awesome-app
```

This creates a minimal project structure:

```
my-awesome-app/
├── app.json              # Configuration
├── package.json          # Dependencies
├── App.tsx               # Root component
├── app.json
└── babel.config.js
```

### Alternative: With Expo Router (File-Based Routing)

If you want file-based routing from the start:

```bash
npx create-expo-app --template expo-router-template
cd my-awesome-app
```

This scaffolds:

```
my-awesome-app/
├── app/
│   ├── _layout.tsx       # Root navigation
│   └── index.tsx         # Home screen
├── app.json
├── eas.json              # EAS Build config
└── package.json
```

**See**: [07-guide-routing-navigation.md](07-guide-routing-navigation.md) for Expo Router details.

**Source**: https://docs.expo.dev/get-started/create-a-project/

---

## Step 2: Understand app.json Configuration

### Minimal Configuration

```json
{
  "expo": {
    "name": "My Awesome App",
    "slug": "my-awesome-app",
    "version": "1.0.0",
    "platforms": ["ios", "android", "web"],
    "ios": {
      "supportsTabletWorkspace": true
    },
    "android": {
      "softwareKeyboardLayoutMode": "pan"
    },
    "web": {
      "bundler": "metro"
    }
  }
}
```

### Key Properties

| Property | Type | Description |
|----------|------|-------------|
| `name` | string | App display name |
| `slug` | string | URL slug (must be unique on Expo) |
| `version` | string | App version (semantic versioning) |
| `platforms` | array | Target platforms: `ios`, `android`, `web` |
| `icon` | string | Path to app icon (1024x1024 PNG) |
| `splash` | object | Splash screen config |
| `plugins` | array | Native modules to include |
| `scheme` | string | Deep linking scheme (e.g., `myapp://`) |

### iOS Configuration

```json
{
  "ios": {
    "bundleIdentifier": "com.company.myapp",
    "buildNumber": "1.0.0",
    "icon": "./assets/icon.png",
    "supportsTabletWorkspace": true,
    "infoPlist": {
      "NSCameraUsageDescription": "Camera access for photos"
    }
  }
}
```

### Android Configuration

```json
{
  "android": {
    "package": "com.company.myapp",
    "versionCode": 1,
    "icon": "./assets/icon.png",
    "permissions": ["CAMERA", "ACCESS_FINE_LOCATION"]
  }
}
```

### Adding Plugins (Native Modules)

Plugins configure native iOS/Android settings declaratively:

```json
{
  "plugins": [
    "expo-camera",
    "expo-file-system",
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermissions": true
      }
    ]
  ]
}
```

This configures permissions, manifests, and framework dependencies automatically during build.

**See**: Individual API modules for plugin configuration ([03-api-auth.md](03-api-auth.md), [05-api-device-access.md](05-api-device-access.md), etc.)

**Source**: https://docs.expo.dev/guides/app-config/

---

## Step 3: Local Development Setup

### Install Dependencies

```bash
# Install npm packages
npm install
# or with yarn
yarn install
```

### Start Development Server

```bash
npx expo start
```

Output:

```
Starting Metro Bundler
Starting application on Simulator
Tunneling is required to connect from external networks
```

### Available Commands at Runtime

Press these in the terminal where `expo start` is running:

| Key | Action |
|-----|--------|
| `i` | Open iOS Simulator |
| `a` | Open Android Emulator |
| `w` | Open web in browser |
| `r` | Reload app |
| `m` | Open Developer Menu |
| `Shift + m` | Toggle slow animations |
| `q` | Quit |

**Source**: https://docs.expo.dev/guides/local-app-development/

---

## Step 4: Run on iOS Simulator

### Prerequisites

- Mac with Xcode 14+ installed
- iOS Simulator (included with Xcode)

### Launch Simulator

```bash
# Automatically open iOS Simulator
npx expo start -i
```

Or manually:

```bash
# Open Simulator.app
open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app
```

Then from `npx expo start`, press `i`.

### Install Build Tools (macOS)

```bash
# Install command line tools
xcode-select --install

# Accept Xcode license
sudo xcode-select --accept-license
```

---

## Step 5: Run on Android Emulator

### Prerequisites

- Android SDK (download via Android Studio)
- Android Emulator or physical device

### Launch Emulator

```bash
# List available emulators
emulator -list-avds

# Start an emulator
emulator -avd Pixel_4_API_30
```

Then from `npx expo start`, press `a`.

Or automatically:

```bash
npx expo start -a
```

### Install SDK

Open Android Studio:
1. **SDK Manager** → Install API 30+ (or latest)
2. **Device Manager** → Create Virtual Device (Pixel 4 recommended)

---

## Step 6: Run on Physical Device

### Using Expo Go (Easiest)

1. **On iOS**:
   - Install "Expo Go" from App Store
   - Open Expo Go app
   - Scan QR code from terminal

2. **On Android**:
   - Install "Expo Go" from Google Play
   - Open Expo Go app
   - Scan QR code from terminal

### Using Tunnel (Remote Network)

If device and computer on different networks:

```bash
# Use tunnel instead of LAN
npx expo start --tunnel
```

This creates a cloud relay. Slower but works from anywhere.

### Using Development Build (Custom)

For custom native modules:

```bash
# Generate native directories
npx expo prebuild

# Create dev build (EAS Cloud or local)
eas build --platform ios --profile development
eas build --platform android --profile development

# Or build locally
eas build --local --platform ios --profile development
```

Install `.ipa` (iOS) or `.apk` (Android) on device, then:

```bash
npx expo start
```

**See**: [11-guide-eas-services.md](11-guide-eas-services.md) for EAS Build details.

---

## Environment Variables

### Setting Environment Variables

Create `.env` file in project root (not committed to git):

```bash
# .env
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_APP_ENV=development
SECRET_API_KEY=supersecret123
```

### Accessing in Code

```typescript
// Only EXPO_PUBLIC_* are available to client
const apiUrl = process.env.EXPO_PUBLIC_API_URL;
// → https://api.example.com

// Server routes have access to all
export async function GET(request: Request) {
  const secret = process.env.SECRET_API_KEY;
  // ✅ Works in API routes
  // ❌ Not available in client components
}
```

### Environment Files by Profile

For different environments:

```
.env                  # Default
.env.local            # Local overrides (not committed)
.env.production       # Production-specific
.env.development      # Development-specific
```

Load in `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "@react-native-firebase/app",
        {
          "googleServicesFile": "./google-services.json"
        }
      ]
    ]
  }
}
```

**Best Practice**: Never commit `.env.local` or files with secrets. Use CI/CD for secret injection.

**Source**: https://docs.expo.dev/guides/environment-variables/

---

## Project Structure Best Practices

### Recommended Organization

```
my-app/
├── app/                         # File-based routing (Expo Router)
│   ├── _layout.tsx              # Root navigation
│   ├── (auth)/                  # Auth layout group
│   │   ├── _layout.tsx          # Auth stack
│   │   ├── login.tsx
│   │   └── signup.tsx
│   ├── (app)/                   # App layout group (requires auth)
│   │   ├── _layout.tsx          # App tabs
│   │   ├── home.tsx
│   │   ├── profile.tsx
│   │   └── [id].tsx
│   ├── _layout.tsx              # Root layout
│   └── index.tsx                # Splash/splash redirect
│
├── services/                    # Business logic
│   ├── auth.ts                  # Auth service
│   ├── api.ts                   # API client
│   └── storage.ts               # Async storage wrapper
│
├── components/                  # Reusable UI components
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Card.tsx
│
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts
│   ├── useAppState.ts
│   └── useLocation.ts
│
├── types/                       # TypeScript types
│   ├── api.ts
│   ├── domain.ts
│   └── navigation.ts
│
├── constants/                   # App constants
│   ├── colors.ts
│   ├── fonts.ts
│   └── endpoints.ts
│
├── assets/                      # Static assets
│   ├── images/
│   ├── fonts/
│   └── icons/
│
├── app.json                     # Expo configuration
├── eas.json                     # EAS Build configuration
├── tsconfig.json
├── package.json
├── babel.config.js
└── metro.config.js
```

---

## Common Development Workflows

### Adding a New Dependency

```bash
# Install package
npm install axios

# If native module, configure in app.json:
# - Add to "plugins" if provided
# - Might require npx expo prebuild
```

### Modifying Native Code

If you need to edit native iOS/Android:

```bash
# Generate native directories
npx expo prebuild

# For Xcode (iOS)
cd ios
open YourApp.xcworkspace
# Edit, build, run in Xcode

# For Android Studio
# Open android/ folder and edit in Android Studio
```

Then:

```bash
# Use development build
eas build --local --platform ios --profile development
```

### Hot Reload Limitations

Fast Refresh reloads most changes instantly but requires full app reload for:
- Adding/removing imports
- Changing function/component signatures
- Modifying top-level constants
- Module-level side effects

Press `r` in terminal to force reload.

---

## Troubleshooting

### "Cannot connect to development server"

1. Check if same network: `npx expo start --tunnel`
2. Restart Expo CLI: Press `q`, then `npx expo start` again
3. Clear cache: `rm -rf ~/.expo/cache`

### iOS Simulator not opening

```bash
# Open manually
open /Applications/Xcode.app/Contents/Developer/Applications/Simulator.app

# Then press 'i' in expo start terminal
```

### Android Emulator slow

Use hardware acceleration:
```bash
# Edit ~/.android/avd/*/config.ini
hw.gpu=on
hw.gpu.mode=auto
```

### "Metro bundler timeout"

```bash
# Increase timeout
npx expo start --max-workers 1
```

### Port already in use

```bash
# Change port
npx expo start --port 8081
```

---

## Next Steps

1. **Build UI**: [07-guide-routing-navigation.md](07-guide-routing-navigation.md) — Learn Expo Router
2. **Add Features**: [03-api-auth.md](03-api-auth.md), [04-api-data-storage.md](04-api-data-storage.md), [05-api-device-access.md](05-api-device-access.md)
3. **Deploy**: [10-guide-build-publish.md](10-guide-build-publish.md) — Create signed builds
4. **Performance**: [14-best-practices-performance.md](14-best-practices-performance.md) — Optimize your app

---

**Source Attribution**: https://docs.expo.dev/get-started/  
**Last Updated**: December 2024
