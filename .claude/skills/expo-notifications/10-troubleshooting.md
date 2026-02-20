# Troubleshooting & Known Issues

**Module Purpose**: Solutions for common errors, debugging tips, platform-specific issues, and known limitations.

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/

---

## Common Issues & Solutions

### Issue: "Must use physical device for Push Notifications"

**Cause**: Trying to use push notifications on an emulator/simulator.

**Solution**: Use a physical device

```typescript
import * as Device from 'expo-device';

if (!Device.isDevice) {
  console.warn('Push notifications require a physical device');
  return;
}
```

**Workaround for Testing**: Use local notifications instead

```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Test',
    body: 'Local notification works on simulator',
  },
  trigger: null,
});
```

---

### Issue: "Project ID not found" or "Cannot get Expo push token"

**Cause**: `projectId` not configured in app.json or environment.

**Solutions**:

**Option 1: Add to app.json**

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

**Option 2: Get from Constants**

```typescript
import Constants from 'expo-constants';

const projectId = Constants?.expoConfig?.extra?.eas?.projectId || 
                  Constants?.easConfig?.projectId;

if (!projectId) {
  throw new Error('Project ID not configured');
}
```

---

### Issue: Permissions dialog not appearing (Android)

**Cause**: Android 13+ requires notification channel before permission prompt.

**Solution**: Create notification channel FIRST

```typescript
if (Platform.OS === 'android') {
  await Notifications.setNotificationChannelAsync('default', {
    name: 'default',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

// NOW request permissions
const { status } = await Notifications.requestPermissionsAsync();
```

---

### Issue: Notifications not showing in foreground

**Cause**: Notification handler not configured or returning incorrect behavior.

**Solution**: Configure handler properly

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,      // ← Must be true
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
```

---

### Issue: Custom sounds not playing

**Cause**: Sound file not specified in app.json or wrong format.

**Solution**:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "sounds": ["./assets/notification.wav"]
        }
      ]
    ]
  }
}
```

Then use filename only:

```typescript
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Alert',
    sound: 'notification.wav',
  },
  trigger: null,
});
```

---

### Issue: Badge not updating

**Cause**: iOS requires `allowBadge` permission granted.

**Solution**: Request permission with badge enabled

```typescript
const { status } = await Notifications.requestPermissionsAsync({
  ios: {
    allowAlert: true,
    allowBadge: true,  // Required for badge
    allowSound: true,
  },
});

if (status === 'granted') {
  await Notifications.setBadgeCountAsync(5);
}
```

---

## Platform-Specific Issues

### iOS Issues

#### Notification showing but alert/sound not playing

**Check**:
- Device settings: Settings → Notifications → YourApp
- Verify `allowAlert`, `allowSound` permissions granted
- Check `UIBackgroundModes` for background notifications

#### iOS simulator not receiving push notifications

**Limitation**: iOS simulator cannot receive push notifications.

**Workaround**: Test with local notifications

---

### Android Issues

#### Large icon not showing properly

**Cause**: Icon not formatted correctly (must be all-white with transparency).

**Solution**:
- Create 96x96 PNG
- All white (no colors)
- Transparent background
- Use [Android Asset Studio](https://romannurik.github.io/AndroidAssetStudio/)

```json
{
  "expo": {
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/notification_icon.png"
        }
      ]
    ]
  }
}
```

#### Notification appears but immediately disappears

**Solution**: Ensure notification is set to display

```typescript
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowList: true,   // Add this for Android
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
```

---

## Development Build Issues

### Issue: Credentials not found after setting up

**Solution**:

```bash
eas build:cache:clean
eas credentials
eas build --platform android
eas build --platform ios
```

---

### Issue: Notifications work in Expo Go but not in development build

**Solution**: Rebuild with clean cache

```bash
npx expo run:android --clean
npx expo run:ios --clean
```

---

## Debugging Techniques

### Log Notification Lifecycle

```typescript
export function setupNotificationDebugging() {
  console.log('📲 Setting up notification debugging...');
  
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      console.log('🔔 Received notification:', {
        title: notification.request.content.title,
        body: notification.request.content.body,
      });
      
      return {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      };
    },
    handleSuccess: (id) => {
      console.log('✅ Notification displayed:', id);
    },
    handleError: (id, error) => {
      console.error('❌ Notification failed:', id, error);
    },
  });
  
  const receivedSub = Notifications.addNotificationReceivedListener(notif => {
    console.log('📬 Notification received (app running)');
  });
  
  const responseSub = Notifications.addNotificationResponseReceivedListener(response => {
    console.log('👆 User tapped notification');
  });
  
  return () => {
    receivedSub.remove();
    responseSub.remove();
  };
}
```

---

### Diagnostic Check

```typescript
export async function diagnosticCheck() {
  console.log('\n🔍 DIAGNOSTIC CHECK\n');
  
  const isDevice = Device.isDevice;
  console.log(`✓ Physical device: ${isDevice}`);
  
  const perms = await Notifications.getPermissionsAsync();
  console.log(`✓ Notifications granted: ${perms.granted}`);
  
  if (Platform.OS === 'android') {
    const channels = await Notifications.getNotificationChannelsAsync();
    console.log(`✓ Channels created: ${channels?.length || 0}`);
  }
  
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log(`✓ Scheduled notifications: ${scheduled.length}`);
  
  console.log('\n✅ Diagnostic check complete\n');
}
```

---

## Testing Checklist

- [ ] Using physical device (not emulator/simulator)
- [ ] Notification handler configured at app startup
- [ ] Android notification channel created before requesting permissions
- [ ] Push token successfully obtained
- [ ] Token sent to backend server
- [ ] App has notification permissions granted
- [ ] Notification sound file is valid .wav format
- [ ] Notification icon is 96x96 all-white PNG
- [ ] Tested with local notification first
- [ ] Tested with scheduled notification
- [ ] Tested in foreground, background, and terminated states
- [ ] For iOS: checked device Notification settings
- [ ] For Android: checked app notification channel settings

---

## Performance Issues

### Notifications Consuming Memory

**Solutions**:

```typescript
async function cleanupOldNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  
  const now = Date.now();
  for (const notif of scheduled) {
    const trigger = notif.trigger;
    
    if (trigger?.date && new Date(trigger.date).getTime() < now) {
      await Notifications.cancelScheduledNotificationAsync(notif.identifier);
    }
  }
}

setInterval(cleanupOldNotifications, 60 * 60 * 1000);
```

---

## Known Limitations

| Limitation | Impact | Workaround |
|-----------|--------|-----------|
| No push in Expo Go (Android) | Can't test push in Expo Go on Android | Use development build |
| Simulator can't receive push | Can't test on iOS/Android simulator | Use physical device |
| FCM/APNs credentials required | Need backend setup for production | Use Expo Push Service |
| 3-second handler timeout | Handler must respond quickly | Keep handler lightweight |
| Android channel immutable | Can't change importance after creation | Delete and recreate channel |
| Background task limited to 30 seconds | Long-running tasks may timeout | Split into smaller tasks |

---

**Source**: https://docs.expo.dev/versions/latest/sdk/notifications/