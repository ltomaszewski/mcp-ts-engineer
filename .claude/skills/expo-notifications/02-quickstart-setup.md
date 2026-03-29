# Quick Start Setup -- Expo Notifications SDK 55

Installation, configuration, credentials, and build setup for push and local notifications.

---

## Installation

### Step 1: Install Main Package

```bash
npx expo install expo-notifications
```

### Step 2: Install Optional Dependencies

```bash
# For push token functionality
npx expo install expo-device expo-constants

# For background notification processing
npx expo install expo-task-manager
```

---

## App Configuration (app.json)

### Config Plugin (Required in SDK 55)

In SDK 55, the root-level `notification` field in app.json has been **removed**. Use the `expo-notifications` config plugin instead. Specifying a root `notification` entry will throw an error in `prebuild`.

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#ffffff",
          "defaultChannel": "default",
          "sounds": [
            "./assets/notification-sound.wav"
          ],
          "enableBackgroundRemoteNotifications": false
        }
      ]
    ]
  }
}
```

### Config Plugin Properties

| Property | Type | Platform | Required | Description |
|----------|------|----------|----------|-------------|
| `icon` | `string` | Android | No | 96x96 all-white PNG with transparency |
| `color` | `string` | Android | No | Tint color for icon (#AARRGGBB or #RRGGBB, default: `#ffffff`) |
| `defaultChannel` | `string` | Android | No | Default channel ID for FCMv1 (default: `default`) |
| `sounds` | `string[]` | Both | No | Array of local .wav file paths to include in build |
| `enableBackgroundRemoteNotifications` | `boolean` | iOS | No | Adds `remote-notification` to UIBackgroundModes (default: `false`) |

### Migration from SDK 54

If you were using the root-level `notification` field:

```json
// BEFORE (SDK 54) -- will throw error in SDK 55
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#ffffff"
    }
  }
}

// AFTER (SDK 55) -- use config plugin
{
  "expo": {
    "plugins": [
      ["expo-notifications", {
        "icon": "./assets/notification-icon.png",
        "color": "#ffffff"
      }]
    ]
  }
}
```

---

## iOS Setup

### APNs Configuration

1. Open [Apple Developer Account](https://developer.apple.com)
2. Navigate to **Certificates, Identifiers & Profiles** > **Keys**
3. Create new key with **Apple Push Notifications service (APNs)** enabled
4. Download the `.p8` file
5. Save your **Key ID** and **Team ID**

### Add to EAS Credentials

```bash
eas credentials
```

Select: **iOS** > **Production** > **APNs certificate** > Upload `.p8` file

### iOS Testing Notes

- Push notifications require a physical device (simulators do not support push)
- Local notifications work on simulators
- Verify bundle ID matches Apple Developer account
- Ensure APNs certificate is not expired
- APNs entitlement is auto-set to 'development' in builds; Xcode switches to 'production' for release archives

---

## Android Setup

### Firebase Cloud Messaging (FCM)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select project
3. Navigate to **Project Settings** > **Service Accounts**
4. Click **Generate New Private Key** > download JSON
5. Navigate to **Project Settings** > **General** > download `google-services.json`

### Add to EAS Credentials

```bash
eas credentials
```

Select: **Android** > **Production** > **FCM API Key** > paste `private_key` from JSON

### Configure app.json

```json
{
  "android": {
    "package": "com.example.app",
    "googleServicesFile": "./google-services.json"
  }
}
```

### Android Permissions (Auto-Added)

| Permission | Purpose |
|-----------|---------|
| `RECEIVE_BOOT_COMPLETED` | Reschedule notifications after device reboot |
| `SCHEDULE_EXACT_ALARM` | Exact alarm triggers (Android 12+) |
| `POST_NOTIFICATIONS` | Post notifications (Android 13+) |

### Android 13+ Notification Permission

On Android 13+, create notification channel BEFORE requesting token:

```typescript
import * as Notifications from 'expo-notifications';

// Create channel first (triggers permission prompt on Android 13+)
await Notifications.setNotificationChannelAsync('default', {
  name: 'Default',
  importance: Notifications.AndroidImportance.DEFAULT,
});

// Now request token
const projectId =
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants?.easConfig?.projectId;
const token = await Notifications.getExpoPushTokenAsync({ projectId });
```

---

## Building

### Development Build (Required for Push)

Push notifications do not work in Expo Go. In SDK 55, attempting to use push notifications in Expo Go on Android **throws an error**. A development build is required.

```bash
# Create development build (first time)
npx expo prebuild --clean

# Run on device
npx expo run:android
npx expo run:ios
```

### EAS Build (Production)

```bash
# Preview build
eas build --platform android --profile preview
eas build --platform ios --profile preview

# Production build
eas build --platform android
eas build --platform ios
```

### After Config Changes

```bash
npx expo prebuild --clean
```

---

## Verification Checklist

- [ ] `expo-notifications` installed in package.json
- [ ] `app.json` has notifications config plugin (not root `notification` field)
- [ ] Icon and sound files exist at configured paths
- [ ] iOS: APNs certificate generated and added to EAS
- [ ] Android: Firebase project created and credentials added
- [ ] Development build created with `prebuild --clean`
- [ ] App runs on physical device
- [ ] Permissions request works when app opens

---

## Troubleshooting Installation

### "Cannot find module 'expo-notifications'"

```bash
npx expo install expo-notifications
npm install
```

### Android permissions not requested

Create notification channel before requesting token (see Android 13+ section above).

### iOS build fails with APNs errors

1. Check APNs certificate is not expired
2. Confirm `.p8` file was generated correctly
3. Run `eas credentials` to update
4. Rebuild with `eas build --platform ios`

### "notification" config error on prebuild (SDK 55)

Remove the root-level `notification` field from app.json and move settings to the config plugin. See Migration from SDK 54 section above.

### Push notifications throw error in Expo Go (Android)

This is expected in SDK 55. Use a development build instead of Expo Go for push notification testing.

### "app.json plugin configuration invalid"

Verify plugin syntax matches the Config Plugin Properties table above. All values must be correct types.

---

**Version:** Expo SDK 55 (~55.0.14) | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
