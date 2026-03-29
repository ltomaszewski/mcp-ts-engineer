# Keyboard Controller: iOS Configuration

**Pod setup, ProMotion 120Hz, safe area integration, interactive dismiss.**

---

## Pod Installation

After installing the npm package:

```bash
cd ios
pod install
cd ..
```

If pods fail:

```bash
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ..
```

---

## ProMotion (120 FPS) Support

Enable 120Hz animations on iPhone 13 Pro and later with ProMotion displays.

### Info.plist

```xml
<!-- ios/YourApp/Info.plist -->
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```

### Impact
- **Without:** Smooth 60 FPS
- **With:** 120 FPS on ProMotion devices
- **Performance cost:** Minimal -- recommended for all apps

---

## Safe Area Integration

### With Keyboard Animation

```typescript
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

function SafeBottomContent() {
  const { height } = useReanimatedKeyboardAnimation();
  const insets = useSafeAreaInsets();

  const style = useAnimatedStyle(() => ({
    paddingBottom: Math.max(height.value, insets.bottom),
  }));

  return (
    <Animated.View style={style}>
      <TextInput placeholder="Message..." />
    </Animated.View>
  );
}
```

### With KeyboardStickyView

```typescript
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function SafeStickyInput() {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardStickyView offset={{ closed: insets.bottom, opened: 0 }}>
      <TextInput placeholder="Message..." style={{ padding: 12 }} />
    </KeyboardStickyView>
  );
}
```

---

## Interactive Dismiss

iOS supports native swipe-to-dismiss with ScrollView:

```typescript
<ScrollView keyboardDismissMode="interactive">
  {/* Content -- swipe down to interactively dismiss */}
</ScrollView>
```

This works with `useKeyboardHandler`'s `onInteractive` callback to track the dismiss gesture.

---

## Platform Requirements

- **Minimum iOS:** 12.4+
- **Xcode:** Latest stable
- **CocoaPods:** Required
- **Fabric:** Supported (default in RN 0.81+)

---

**Version:** 1.21.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/docs/installation
