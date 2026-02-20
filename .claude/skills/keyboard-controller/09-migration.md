# Keyboard Controller: Migration Guides

**Upgrading from other keyboard libraries**

---

## From react-native-reanimated

### useAnimatedKeyboard → useReanimatedKeyboardAnimation

Nearly identical API:

#### Before (Reanimated)
```typescript
import { useAnimatedKeyboard } from 'react-native-reanimated';

function OldComponent() {
  const { height, state } = useAnimatedKeyboard();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
  }));

  return <Animated.View style={animatedStyle} />;
}
```

#### After (Keyboard Controller)
```typescript
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

function NewComponent() {
  const { height } = useReanimatedKeyboardAnimation();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
  }));

  return <Animated.View style={animatedStyle} />;
}
```

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
| `onKeyboardWillShow` | — | Use `useKeyboardHandler` |

---

## Library Comparison

| Feature | keyboard-controller | reanimated | keyboard-aware-scroll-view |
|---------|-------------------|------------|--------------------------|
| iOS | ✅ | ✅ | ✅ |
| Android | ✅ | ✅ | ✅ |
| Maintained | ✅ Active | ✅ Active | ❌ Unmaintained |
| Animated.Value | ✅ | ❌ | ✅ |
| Reanimated | ✅ | ✅ | ❌ |
| ScrollView | ✅ | ❌ | ✅ |
| Interactive Dismiss | ✅ | ✅ | ❌ |
| Fabric | ✅ | ✅ | ❌ |

---

## Migration Checklist

- [ ] Install `react-native-keyboard-controller`
- [ ] Add `KeyboardProvider` at root
- [ ] Replace old imports
- [ ] Update prop names
- [ ] Remove old package
- [ ] Run pod install
- [ ] Test all forms

---

**See Also**: [Setup](01-setup.md) | [Core API](02-core-api.md)
