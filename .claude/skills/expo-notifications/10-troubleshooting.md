# Troubleshooting -- Expo Notifications SDK 55

Common issues, debugging techniques, platform-specific problems, and known limitations.

---

## Common Issues

### "Must use physical device for Push Notifications"

**Cause:** Push notifications cannot work on simulators/emulators.

**Solution:** Use a physical device. Local notifications work on simulators for testing.

```typescript
import * as Device from 'expo-device';

if (!Device.isDevice) {
  console.warn('Push notifications require a physical device');
  // Fall back to local notifications for testing
}
```

---

### Push notifications throw error in Expo Go (Android)

**Cause:** SDK 55 changed this from a warning to an error. Push notifications are not supported in Expo Go on Android.

**Solution:** Use a development build instead of Expo Go.

```bash
npx expo prebuild --clean
npx expo run:android
```

---

### "Project ID not found"

**Cause:** `projectId` not configured in app.json.

**Solution 1:** Add to app.json extra:

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "your-project-id-here"
      }
    }
  }
}
```

**Solution 2:** Read from Constants (with fallback):

```typescript
import Constants from 'expo-constants';

const projectId =
  Constants.expoConfig?.extra?.eas?.projectId ??
  Constants?.easConfig?.projectId;

if (!projectId) throw new Error('Project ID not configured');
```

---

### "notification" config error on prebuild (SDK 55)

**Cause:** The root-level `notification` field was removed from app.json schema in SDK 55.

**Solution:** Migrate to the config plugin:

```json
// BEFORE (throws error in SDK 55)
{
  "expo": {
    "notification": {
      "icon": "./assets/notification-icon.png",
      "color": "#ffffff"
    }
  }
}

// AFTER (correct for SDK 55)
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

### Notifications not showing in foreground

**Cause:** Notification handler not configured or returning incorrect behavior.

**Solution:** Configure handler with correct properties:

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,  // Required for display
    shouldShowList: true,    // Required for notification center
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

**Note:** `shouldShowAlert` is deprecated since SDK 54. Use `shouldShowBanner` and `shouldShowList`.

---

### Android permissions dialog not appearing

**Cause:** On Android 13+, notification channel must exist before permission prompt.

**Solution:** Create channel BEFORE requesting permissions:

```typescript
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

const { status } = await Notifications.requestPermissionsAsync();
```

---

### Custom sounds not playing

**Cause:** Sound file not declared in config plugin or wrong format.

**Solution:**

1. Declare in app.json config plugin:
```json
{
  "expo": {
    "plugins": [
      ["expo-notifications", { "sounds": ["./assets/notification.wav"] }]
    ]
  }
}
```

2. Use filename in notification:
```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Alert',
    sound: 'notification.wav',
  },
  trigger: null,
});
```

3. Sound must be .wav format.
4. Rebuild after adding sounds (`npx expo prebuild --clean`).
5. SDK 55 validates sound file existence at build time -- check build logs for errors.

---

### Badge not updating

**Cause:** iOS requires `allowBadge` permission.

**Solution:**

```typescript
const { status } = await Notifications.requestPermissionsAsync({
  ios: {
    allowAlert: true,
    allowBadge: true,
    allowSound: true,
  },
});
```

On Android, not all launchers support badge display. Badge management is manual via `setBadgeCountAsync()`.

---

### Notifications work in development but not production

**Cause:** Missing or expired credentials.

**Solution:**

```bash
# Verify and update credentials
eas credentials

# Rebuild
eas build --platform ios
eas build --platform android
```

Check:
- APNs certificate not expired (iOS)
- FCM service account key valid (Android)
- Correct bundle ID / package name

---

### Background tasks not executing

**Cause:** Task not defined at module scope, or missing config.

**Solution:**
1. Define task at top-level module scope (e.g., in `index.ts`), not inside a component
2. iOS: Ensure `enableBackgroundRemoteNotifications: true` in config plugin
3. Android: Ensure FCM is properly configured
4. SDK 55 fixed a bug where background tasks were not executing in some cases -- upgrade to latest

---

## Platform-Specific Issues

### iOS

**Notification shows but no sound:**
- Check device Settings > Notifications > Your App > Sounds
- Verify `allowSound` was requested
- Ensure sound file is valid .wav

**Foreground notifications invisible:**
- Must set `shouldShowBanner: true` in handler
- Handler must be configured before notifications arrive

**Android splash screen issue:**
- ~70% failure rate when launching from notification in debug builds
- Test in release mode: `npx expo run:android --variant release`

### Android

**Notification icon wrong color:**
- Icon must be all-white PNG with transparency (96x96)
- Set `color` in config plugin for tint
- Rebuild after changing icon

**Notification appears then disappears:**
- Add `shouldShowList: true` in handler
- Ensure channel importance is at least DEFAULT

**Notification channel cannot be modified:**
- Channels are immutable after creation
- Only `name` and `description` can be updated
- To change importance/sound: delete channel, create new one (user prefs reset)

**NotificationForwarderActivity crash (Android 11/12):**
- Fixed in SDK 55 -- ensure you are using expo-notifications ~55.0.14
- Crash occurred when Parcelable extras failed to deserialize

---

## Debugging Techniques

### Diagnostic Check

```typescript
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function diagnosticCheck(): Promise<void> {
  console.log('--- Notification Diagnostic ---');
  console.log('Physical device:', Device.isDevice);
  console.log('Platform:', Platform.OS);

  const perms = await Notifications.getPermissionsAsync();
  console.log('Permission granted:', perms.granted);
  console.log('Can ask again:', perms.canAskAgain);

  if (Platform.OS === 'android') {
    const channels = await Notifications.getNotificationChannelsAsync();
    console.log('Android channels:', channels.length);
    channels.forEach((ch) => console.log(' -', ch.id, ch.name, ch.importance));
  }

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('Scheduled notifications:', scheduled.length);

  const presented = await Notifications.getPresentedNotificationsAsync();
  console.log('Presented notifications:', presented.length);

  const badge = await Notifications.getBadgeCountAsync();
  console.log('Badge count:', badge);

  console.log('--- End Diagnostic ---');
}
```

### Lifecycle Logging

```typescript
export function setupNotificationLogging(): () => void {
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('[HANDLER]', notification.request.content.title);
      return {
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
    handleSuccess: (id) => console.log('[SUCCESS]', id),
    handleError: (id, error) => console.error('[ERROR]', id, error),
  });

  const s1 = Notifications.addNotificationReceivedListener((n) => {
    console.log('[RECEIVED]', n.request.content.title);
  });

  const s2 = Notifications.addNotificationResponseReceivedListener((r) => {
    console.log('[RESPONSE]', r.actionIdentifier);
  });

  const s3 = Notifications.addPushTokenListener((t) => {
    console.log('[TOKEN]', t.data);
  });

  const s4 = Notifications.addNotificationsDroppedListener(() => {
    console.log('[DROPPED] Notifications were dropped');
  });

  return () => {
    s1.remove();
    s2.remove();
    s3.remove();
    s4.remove();
  };
}
```

---

## Testing Checklist

- [ ] Using physical device (not emulator/simulator for push)
- [ ] Using development build (not Expo Go for push on Android)
- [ ] Notification handler configured at app startup
- [ ] Android: channel created before requesting permissions
- [ ] Push token successfully obtained
- [ ] Token sent to backend server
- [ ] App has notification permissions granted
- [ ] Sound files are valid .wav format
- [ ] Sound files declared in config plugin (not root `notification` field)
- [ ] Android icon is 96x96 all-white PNG
- [ ] Tested local notification first
- [ ] Tested foreground, background, and terminated states
- [ ] Listener cleanup in useEffect return functions
- [ ] iOS: checked device notification settings
- [ ] Android: checked app channel settings
- [ ] Background tasks defined at module scope

---

## Known Limitations

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| No push in Expo Go (Android) | Throws error in SDK 55 | Use development build |
| Simulator no push | Cannot test push on simulator | Use physical device |
| Handler 3s timeout | handleNotification must return quickly | Keep handler lightweight |
| Android channel immutable | Cannot change importance after creation | Delete and recreate |
| Background task 30s limit | Long-running tasks terminated | Split into smaller tasks |
| Scheduled limit 64-128 | OS limits scheduled notifications | Clean up old schedules |
| Android badge manual | Not all launchers support badges | Manage badge manually |
| Android splash screen ~70% failure | Debug build launches from notification | Test in release mode |
| iOS repeating interval min 60s | TIME_INTERVAL repeats must be >= 60s | Use DAILY or CALENDAR for shorter |

---

**Version:** Expo SDK 55 (~55.0.14) | **Source:** https://docs.expo.dev/versions/latest/sdk/notifications/
