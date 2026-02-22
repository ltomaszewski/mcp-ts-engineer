# Keyboard Controller: Android Configuration

**Android manifest, soft input modes, runtime mode switching, and gestures.**

---

## AndroidManifest.xml Setup

### Recommended Configuration

```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity
  android:name=".MainActivity"
  android:label="@string/app_name"
  android:configChanges="keyboard|keyboardHidden|orientation|screenSize"
  android:windowSoftInputMode="adjustResize|stateHidden"
/>
```

- `adjustResize` -- resize content area when keyboard appears
- `stateHidden` -- start with keyboard hidden

---

## Soft Input Modes

### AndroidSoftInputModes Enum

| Constant | Value | Description |
|----------|-------|-------------|
| `SOFT_INPUT_ADJUST_RESIZE` | -- | Resize content area to make room for keyboard |
| `SOFT_INPUT_ADJUST_PAN` | -- | Pan the view upward |
| `SOFT_INPUT_ADJUST_NOTHING` | -- | No automatic adjustment |
| `SOFT_INPUT_ADJUST_UNSPECIFIED` | -- | System default behavior |

### Setting Modes at Runtime

```typescript
import {
  KeyboardController,
  AndroidSoftInputModes,
} from 'react-native-keyboard-controller';
import { useEffect } from 'react';

function FormScreen() {
  useEffect(() => {
    KeyboardController.setInputMode(
      AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE
    );
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
| `SOFT_INPUT_ADJUST_RESIZE` | Yes | No | Forms, scrollable content |
| `SOFT_INPUT_ADJUST_PAN` | No | Yes | Fixed layouts |
| `SOFT_INPUT_ADJUST_NOTHING` | No | No | Custom handling with hooks |

---

## Android 11+ Interactive Gestures

Swipe-to-dismiss keyboard is only available on Android 11 (API 30) and higher.

```typescript
import { KeyboardGestureArea } from 'react-native-keyboard-controller';

function ChatScreen() {
  return (
    <KeyboardGestureArea
      interpolator="ios"
      style={{ flex: 1 }}
    >
      {/* Swipe down to dismiss keyboard */}
      <FlatList data={messages} renderItem={renderMessage} inverted />
    </KeyboardGestureArea>
  );
}
```

### Platform Check

On Android < 11, `KeyboardGestureArea` renders as a fragment (no-op). No need for platform checks in your code.

---

## Edge-to-Edge Mode

`KeyboardProvider` enables edge-to-edge mode by default on Android with:
- `statusBarTranslucent={true}`
- `navigationBarTranslucent={true}`

If using `react-native-edge-to-edge`, set `preserveEdgeToEdge={true}` on the provider:

```typescript
<KeyboardProvider preserveEdgeToEdge={true}>
  <YourApp />
</KeyboardProvider>
```

---

## Troubleshooting

### Keyboard Doesn't Appear
1. Ensure `KeyboardProvider` wraps the app
2. Check manifest has correct `windowSoftInputMode`
3. Try `KeyboardController.setInputMode()` explicitly

### Layout Jumping
1. Use `KeyboardAwareScrollView` with consistent `bottomOffset`
2. Avoid layout changes during animation

### Wrong Input Mode
```typescript
// Reset to manifest default
KeyboardController.setDefaultMode();
```

---

**Version:** 1.20.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/docs/installation
