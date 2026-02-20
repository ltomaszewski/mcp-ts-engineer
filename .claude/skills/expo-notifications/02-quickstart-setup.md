# Expo Notifications: Quick Start Setup

> Installation, configuration, and credential setup for push and local notifications across iOS and Android platforms.

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Installation

### Step 1: Install Main Package

```bash
npx expo install expo-notifications
```

If working in an existing React Native app, also install Expo:

```bash
npx expo install expo
```

### Step 2: Install Task Manager (For Background Notifications)

```bash
npx expo install expo-task-manager
```

### Step 3: Install Optional Dependencies

For push token functionality:

```bash
npx expo install expo-device expo-constants
```

For headless background tasks, `expo-task-manager` is required (installed in Step 2).

---

## App Configuration (app.json)

### Basic Configuration

Add the `expo-notifications` plugin to your `app.json`:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification_icon.png",
          "color": "#ffffff",
          "defaultChannel": "default",
          "sounds": [
            "./assets/notification_sound.wav"
          ],
          "enableBackgroundRemoteNotifications": false
        }
      ]
    ]
  }
}
```

### Configuration Properties

| Property | Type | Platform | Required | Description |
|----------|------|----------|----------|-------------|
| `icon` | `string` | Android | No | Local path to 96x96 all-white PNG with transparency. Used on home screen and notification tray. |
| `color` | `string` | Android | No | Tint color for notification icon in hex format (default: `#ffffff`) |
| `defaultChannel` | `string` | Android | No | Default channel ID for FCMv1 notifications (default: `default`) |
| `sounds` | `string[]` | Both | No | Array of local paths to .wav sound files to include in build |
| `enableBackgroundRemoteNotifications` | `boolean` | iOS | No | Enable background remote notifications (default: `false`) |

### Complete Example Configuration

```json
{
  "expo": {
    "name": "MyNotificationApp",
    "slug": "my-notification-app",
    "version": "1.0.0",
    "assetBundlePatterns": [
      "**/*"
    ],
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#0066cc",
          "defaultChannel": "default",
          "sounds": [
            "./assets/notification-sound.wav",
            "./assets/alert-sound.wav"
          ],
          "enableBackgroundRemoteNotifications": false
        }
      ]
    ]
  }
}
```

---

## iOS Setup

### APNs Configuration

#### 1. Generate APNs Certificate

1. Open [Apple Developer Account](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles**
3. Under **Keys**, click the `+` button to create a new key
4. Select **Apple Push Notifications service (APNs)**
5. Give it a meaningful name (e.g., "My App Push Notifications")
6. Click **Register**
7. Download the `.p8` file
8. **Save your Key ID** and **Team ID** — you'll need these

#### 2. Configure with EAS

Update or create `eas.json` in your project root:

```json
{
  "build": {
    "ios": {
      "production": {
        "ios": {
          "certificateSource": "local"
        }
      }
    }
  }
}
```

#### 3. Add to EAS Credentials

Run the credentials command:

```bash
eas credentials
```

Select:
- **iOS**
- **Production** (or the appropriate profile)
- **APNs certificate** → Upload your `.p8` file

Alternatively, use `eas credentials` interactively to manage credentials.

### iOS Testing Tips

- Use a physical device (simulators don't support push notifications)
- Verify bundle ID matches Apple Developer account
- Check that APNs certificate is not expired
- Ensure device has push notifications enabled in Settings > Notifications

---

## Android Setup

### Firebase Cloud Messaging (FCM) Setup

#### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click **Create a new project**
3. Enter your project name
4. Choose whether to enable Google Analytics (optional)
5. Create the project

#### 2. Get Server Credentials

1. In Firebase Console, navigate to **Project Settings** (gear icon in top-left)
2. Go to **Service Accounts** tab
3. Click **Generate New Private Key**
4. Download the JSON file — keep this safe!
5. **Extract** the `private_key` value from the JSON file

#### 3. Add to EAS Credentials

```bash
eas credentials
```

Select:
- **Android**
- **Production** (or appropriate profile)
- **FCM API Key** → Paste the `private_key` value from your Firebase JSON

The system will securely store your credential.

#### 4. Configure app.json for Android

```json
{
  "android": {
    "package": "com.example.app",
    "googleServicesFile": "./google-services.json"
  }
}
```

To get `google-services.json`:
1. In Firebase Console, go to **Project Settings**
2. Click **Download google-services.json**
3. Place it in your project root
4. Reference it in app.json

### Android Permissions

The following permissions are automatically added via the plugin and `AndroidManifest.xml`:

| Permission | Purpose |
|-----------|---------|
| `RECEIVE_BOOT_COMPLETED` | Receive device boot to setup scheduled notifications |
| `SCHEDULE_EXACT_ALARM` | Schedule exact alarm triggers (Android 12+) |
| `POST_NOTIFICATIONS` | Post notifications to system (Android 13+) |

### Android 13+ Notification Permission

On Android 13+, users must opt-in to notifications. This permission is requested automatically when:
1. First notification channel is created, OR
2. First push notification arrives

**Important**: Call `setNotificationChannelAsync()` **BEFORE** calling `getDevicePushTokenAsync()` or `getExpoPushTokenAsync()`:

```typescript
// Android 13+ requirement
await Notifications.setNotificationChannelAsync('default', {
  name: 'default',
  importance: Notifications.AndroidImportance.DEFAULT,
});

// Now request token
const token = await Notifications.getExpoPushTokenAsync();
```

---

## Building & Deployment

### Development Build

For development and testing:

```bash
# Create development build (first time)
npx expo prebuild --clean

# Run on Android
npx expo run:android

# Run on iOS
npx expo run:ios
```

**Why?** Development builds include native modules needed for notifications that don't work in Expo Go.

### EAS Build (Production)

For release builds:

```bash
# Preview build (TestFlight/Google Play internal testing)
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Production build (App Store/Play Store)
eas build --platform android
eas build --platform ios
```

### Rebuilding After Config Changes

After modifying `app.json` plugins or configuration:

```bash
# Clear and rebuild
npx expo prebuild --clean

# EAS rebuild for production
npx eas build --platform android --profile production
npx eas build --platform ios --profile production
```

---

## Troubleshooting Installation

### Issue: "Cannot find module 'expo-notifications'"

**Solution**: Ensure the package is installed and package.json is updated:

```bash
npx expo install expo-notifications --save
npm install  # or yarn install
```

### Issue: Android permissions not requested

**Cause**: Notification channel not created before requesting token.

**Solution**: Create notification channel first:

```typescript
await Notifications.setNotificationChannelAsync('default', {
  name: 'Default',
  importance: Notifications.AndroidImportance.MAX,
});
```

### Issue: iOS build fails with APNs errors

**Solution**: Verify credentials:
1. Check APNs certificate is not expired
2. Confirm `.p8` file was generated correctly
3. Run `eas credentials` to update credentials
4. Rebuild with `eas build --platform ios --profile production`

### Issue: Android build fails with FCM key errors

**Solution**: Verify Firebase credentials:
1. Confirm `private_key` is correct format
2. Check Firebase project still exists
3. Regenerate new private key if needed
4. Update credentials with `eas credentials`

### Issue: "app.json plugin configuration invalid"

**Solution**: Verify plugin configuration syntax:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",  // Valid path
          "color": "#ffffff",            // Valid hex
          "defaultChannel": "default",   // String
          "sounds": [],                  // Array
          "enableBackgroundRemoteNotifications": false  // Boolean
        }
      ]
    ]
  }
}
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] `expo-notifications` package installed
- [ ] `app.json` has notifications plugin configured
- [ ] `icon` and `sounds` files exist in project
- [ ] iOS: APNs certificate generated and added to EAS
- [ ] Android: Firebase project created and credentials added
- [ ] Development build created with `prebuild --clean`
- [ ] App runs on physical device (not simulator)
- [ ] Permissions request works when app opens

---

## Next Steps

1. **Get Tokens**: See [`03-api-core.md#push-token-methods`](03-api-core.md#push-token-methods)
2. **Request Permissions**: See [`03-api-core.md#permission-management`](03-api-core.md#permission-management)
3. **Set Handler**: See [`03-api-core.md#notification-handler-setup`](03-api-core.md#notification-handler-setup)
4. **Complete Setup**: See [`09-guide-patterns.md#complete-setup-guide`](09-guide-patterns.md#complete-setup-guide) for full example
5. **Schedule Notifications**: See [`04-api-scheduling.md`](04-api-scheduling.md)

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/
**Last Updated**: December 2025
