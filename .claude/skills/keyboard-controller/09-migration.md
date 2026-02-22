# Keyboard Controller: Migration Guides

**Upgrading from other keyboard libraries.**

---

## From react-native-reanimated useAnimatedKeyboard

### Before (Reanimated)

```typescript
import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

function OldComponent() {
  const { height, state } = useAnimatedKeyboard();

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
  }));

  return <Animated.View style={style} />;
}
```

### After (Keyboard Controller)

```typescript
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

function NewComponent() {
  const { height, progress } = useReanimatedKeyboardAnimation();

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
  }));

  return <Animated.View style={style} />;
}
```

**Key differences:**
- Returns `progress` (0-1) instead of `state` enum
- Requires `KeyboardProvider` at root
- Provides additional hooks (`useKeyboardHandler`) for lifecycle events
- Includes prebuilt components (Toolbar, AwareScrollView)

---

## From react-native-keyboard-aware-scroll-view

### Before (Unmaintained)

```typescript
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';

function OldForm() {
  return (
    <KeyboardAwareScrollView
      enableOnAndroid={true}
      extraHeight={100}
    >
      <TextInput placeholder="Field 1" />
      <TextInput placeholder="Field 2" />
    </KeyboardAwareScrollView>
  );
}
```

### After (keyboard-controller)

```typescript
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

function NewForm() {
  return (
    <KeyboardAwareScrollView bottomOffset={100}>
      <TextInput placeholder="Field 1" />
      <TextInput placeholder="Field 2" />
    </KeyboardAwareScrollView>
  );
}
```

### Property Mapping

| Old Prop | New Prop | Notes |
|----------|----------|-------|
| `extraHeight` | `bottomOffset` | Same functionality |
| `enableOnAndroid` | `enabled` | Now cross-platform |
| `onKeyboardWillShow` | -- | Use `useKeyboardHandler` or `KeyboardEvents` |
| `onKeyboardWillHide` | -- | Use `useKeyboardHandler` or `KeyboardEvents` |
| `ScrollViewComponent` | `ScrollViewComponent` | Same name |

---

## Library Comparison

| Feature | keyboard-controller | reanimated | keyboard-aware-scroll-view |
|---------|-------------------|------------|--------------------------|
| iOS | Yes | Yes | Yes |
| Android | Yes | Yes | Yes |
| Maintained | Active | Active | Unmaintained |
| Animated.Value | Yes | No | Yes |
| Reanimated SharedValue | Yes | Yes | No |
| ScrollView component | Yes | No | Yes |
| Interactive Dismiss | Yes | Yes | No |
| Fabric support | Yes | Yes | No |
| Toolbar | Yes | No | No |
| Lifecycle hooks | Yes | No | No |

---

## Migration Checklist

- [ ] Install `react-native-keyboard-controller` and `react-native-reanimated`
- [ ] Add `KeyboardProvider` at app root
- [ ] Replace old imports with keyboard-controller equivalents
- [ ] Update prop names (see mapping table)
- [ ] Remove old package (`npm uninstall react-native-keyboard-aware-scroll-view`)
- [ ] Run `pod install` on iOS
- [ ] Test all forms on both platforms

---

**Version:** 1.19.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/
