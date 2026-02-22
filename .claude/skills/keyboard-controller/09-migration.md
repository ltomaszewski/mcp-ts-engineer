# Keyboard Controller: Migration Guides

**Upgrading from other keyboard libraries.**

---

## From react-native-reanimated useAnimatedKeyboard

Starting from `react-native-reanimated@4.2.0`, the Reanimated team deprecated `useAnimatedKeyboard` and recommends migrating to `react-native-keyboard-controller` instead.

### Option A: Drop-In Replacement (v1.20.0+ -- Easiest)

The library provides a compatibility `useAnimatedKeyboard` hook with the same API. Just change the import:

```typescript
// Before (deprecated in reanimated 4.2.0)
import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

function OldComponent() {
  const { height, state } = useAnimatedKeyboard();

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
  }));

  return <Animated.View style={style} />;
}

// After (v1.20.0+ -- just change the import)
import { useAnimatedKeyboard } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

function NewComponent() {
  const { height, state } = useAnimatedKeyboard();

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
  }));

  return <Animated.View style={style} />;
}
```

**Note:** Requires `KeyboardProvider` at app root. The API is identical -- `height` and `state` work the same way.

### Option B: Use useReanimatedKeyboardAnimation (Recommended for New Code)

For new code, prefer `useReanimatedKeyboardAnimation` which returns `progress` (0-1) instead of `state` enum:

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

**Key differences from reanimated's useAnimatedKeyboard:**
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

**Version:** 1.20.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/
