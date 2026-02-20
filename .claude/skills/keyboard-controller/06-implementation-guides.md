# Keyboard Controller: Implementation Guides

**Step-by-step tutorials and patterns**

---

## First Animation Guide

### Goal
Create animated view that moves up when keyboard appears.

### Step 1: Get Animated Values
```typescript
import { useKeyboardAnimation } from 'react-native-keyboard-controller';

const { height } = useKeyboardAnimation();
```

### Step 2: Apply Animation
```typescript
const animatedStyle = {
  transform: [{ translateY: Animated.multiply(height, -1) }],
};
```

### Complete Example
```typescript
import React from 'react';
import { Animated, StyleSheet, TextInput, SafeAreaView } from 'react-native';
import { KeyboardProvider, useKeyboardAnimation } from 'react-native-keyboard-controller';

function AnimatedContainer() {
  const { height, progress } = useKeyboardAnimation();

  const translateY = Animated.multiply(height, -1);
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View
      style={[
        styles.floatingContainer,
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TextInput placeholder="Message..." style={styles.input} />
    </Animated.View>
  );
}

export function FirstAnimation() {
  return (
    <KeyboardProvider>
      <SafeAreaView style={styles.container}>
        <AnimatedContainer />
      </SafeAreaView>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  floatingContainer: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },
  input: { padding: 12 },
});
```

---

## Interactive Keyboard Dismiss

### iOS Setup
```typescript
<ScrollView keyboardDismissMode="interactive">
  {/* Content */}
</ScrollView>
```

### Android 11+ Setup
```typescript
import { KeyboardGestureArea } from 'react-native-keyboard-controller';

<KeyboardGestureArea style={{ flex: 1 }}>
  {/* Swipe to dismiss */}
</KeyboardGestureArea>
```

### Detect Interactive Dismiss
```typescript
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

function useInteractiveDismiss() {
  const isInteractive = useSharedValue(false);

  useKeyboardHandler({
    onInteractive: () => {
      'worklet';
      isInteractive.value = true;
    },
  }, []);

  return isInteractive;
}
```

---

## Multi-Input Forms

### Complete Form with Toolbar
```typescript
import React, { useRef } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  KeyboardProvider,
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';

const FIELDS = [
  { id: 'email', placeholder: 'Email' },
  { id: 'password', placeholder: 'Password', secureTextEntry: true },
  { id: 'name', placeholder: 'Full Name' },
];

export function CompleteForm() {
  const refs = useRef<Record<string, TextInput | null>>({});

  const handleDone = () => {
    Object.values(refs.current).forEach((ref) => ref?.blur());
  };

  return (
    <KeyboardProvider>
      <>
        <KeyboardAwareScrollView bottomOffset={62}>
          <View style={styles.container}>
            {FIELDS.map((field) => (
              <TextInput
                key={field.id}
                ref={(ref) => { refs.current[field.id] = ref; }}
                placeholder={field.placeholder}
                style={styles.input}
                returnKeyType="next"
                {...field}
              />
            ))}
          </View>
        </KeyboardAwareScrollView>

        <KeyboardToolbar onDone={handleDone}>
          <KeyboardToolbar.Previous />
          <KeyboardToolbar.Next />
          <KeyboardToolbar.Done label="Submit" />
        </KeyboardToolbar>
      </>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
  },
});
```

---

## Animation Performance

### Performance Checklist
- [ ] Use `useKeyboardHandler` with worklets
- [ ] Avoid heavy computation in callbacks
- [ ] Use `React.memo()` for animated components
- [ ] Profile on real devices
- [ ] Monitor frame drops

### Reanimated vs Animated
```typescript
// ❌ Less efficient
const { height } = useKeyboardAnimation();
const style = {
  transform: [{ translateY: Animated.multiply(height, -1) }],
};

// ✅ More efficient
const { height } = useReanimatedKeyboardAnimation();
const style = useAnimatedStyle(() => ({
  transform: [{ translateY: height.value * -1 }],
}));
```

---

**See Also**: [Core API](02-core-api.md) | [Advanced API](03-advanced-api.md) | [Troubleshooting](10-troubleshooting.md)
