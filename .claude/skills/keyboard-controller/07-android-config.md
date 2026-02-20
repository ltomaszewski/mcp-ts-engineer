# Keyboard Controller: Android Configuration

**Android manifest, soft input modes, and gestures**

---

## AndroidManifest.xml Setup

### Default Configuration
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity
  android:name=".MainActivity"
  android:label="@string/app_name"
  android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
  android:windowSoftInputMode="adjustResize|stateHidden"
/>
```

**Explanation:**
- `adjustResize` - Resize content when keyboard appears
- `stateHidden` - Start with keyboard hidden

---

## Soft Input Modes

### AndroidSoftInputModes Enum
```typescript
type AndroidSoftInputModes =
  | 'adjustResize'      // Resize content area
  | 'adjustPan'         // Pan view upward
  | 'adjustNothing'     // No automatic adjustment
  | 'adjustUnspecified' // System default
```

### Setting Modes Dynamically
```typescript
import {
  KeyboardController,
  AndroidSoftInputModes,
} from 'react-native-keyboard-controller';
import { useEffect } from 'react';

function FormScreen() {
  useEffect(() => {
    // Set mode for this screen
    KeyboardController.setInputMode(
      AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE
    );

    // Restore default when leaving
    return () => {
      KeyboardController.setDefaultMode();
    };
  }, []);

  return (/* form content */);
}
```

### Mode Comparison

| Mode | Content Resizes | View Pans | Best For |
|------|-----------------|-----------|----------|
| adjustResize | Yes | No | Forms, scrollable content |
| adjustPan | No | Yes | Fixed layouts |
| adjustNothing | No | No | Custom handling |

---

## Android 11+ Interactive Gestures

Enable swipe-to-dismiss on Android 11+:

```typescript
import { KeyboardGestureArea } from 'react-native-keyboard-controller';

function InteractiveScreen() {
  return (
    <KeyboardGestureArea style={{ flex: 1 }}>
      {/* Swipe down to dismiss keyboard */}
    </KeyboardGestureArea>
  );
}
```

**Requirements:** Android 11 (API 30) or higher.

---

## Troubleshooting

### Keyboard Doesn't Appear
1. Ensure `KeyboardProvider` wraps app
2. Check manifest has soft input mode
3. Try `KeyboardController.setInputMode()` explicitly

### Layout Jumping
1. Use `KeyboardAwareScrollView`
2. Set consistent `bottomOffset`
3. Avoid layout changes during animation

### Wrong Input Mode
```typescript
// Reset to manifest default
await KeyboardController.setDefaultMode();
```

---

**See Also**: [Setup](01-setup.md) | [iOS Config](08-ios-config.md)
