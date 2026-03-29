# Keyboard Controller: Implementation Guides

**Step-by-step patterns for forms, chat UIs, and keyboard animations.**

---

## First Animation Guide

### Goal

Move a view up when keyboard appears using Reanimated.

```typescript
import React from 'react';
import { StyleSheet, TextInput, SafeAreaView } from 'react-native';
import { KeyboardProvider, useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

function FloatingInput() {
  const { height, progress } = useReanimatedKeyboardAnimation();

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
    opacity: 0.5 + progress.value * 0.5,
  }));

  return (
    <Animated.View style={[styles.floating, style]}>
      <TextInput placeholder="Message..." style={styles.input} />
    </Animated.View>
  );
}

export function FirstAnimation() {
  return (
    <KeyboardProvider>
      <SafeAreaView style={styles.container}>
        <FloatingInput />
      </SafeAreaView>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  floating: { position: 'absolute', bottom: 0, width: '100%' },
  input: { padding: 12, borderTopWidth: 1, borderTopColor: '#ddd' },
});
```

---

## Interactive Keyboard Dismiss

### iOS

```typescript
<ScrollView keyboardDismissMode="interactive">
  {/* Content -- swipe down to dismiss keyboard */}
</ScrollView>
```

### Android 11+

```typescript
import { KeyboardGestureArea } from 'react-native-keyboard-controller';

<KeyboardGestureArea interpolator="ios" style={{ flex: 1 }}>
  {/* Content -- swipe down to dismiss keyboard */}
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
    onEnd: () => {
      'worklet';
      isInteractive.value = false;
    },
  }, []);

  return isInteractive;
}
```

---

## Multi-Input Form with Toolbar

```typescript
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import {
  KeyboardProvider,
  KeyboardAwareScrollView,
  KeyboardToolbar,
} from 'react-native-keyboard-controller';

const FIELDS = [
  { key: 'email', placeholder: 'Email', keyboardType: 'email-address' as const },
  { key: 'password', placeholder: 'Password', secureTextEntry: true },
  { key: 'name', placeholder: 'Full Name' },
  { key: 'phone', placeholder: 'Phone', keyboardType: 'phone-pad' as const },
  { key: 'address', placeholder: 'Address' },
];

export function CompleteForm() {
  return (
    <KeyboardProvider>
      <>
        <KeyboardAwareScrollView
          bottomOffset={62}
          contentContainerStyle={styles.scroll}
        >
          {FIELDS.map((field) => (
            <TextInput
              key={field.key}
              placeholder={field.placeholder}
              style={styles.input}
              returnKeyType="next"
              {...field}
            />
          ))}
        </KeyboardAwareScrollView>

        <KeyboardToolbar>
          <KeyboardToolbar.Prev />
          <KeyboardToolbar.Next />
          <KeyboardToolbar.Done text="Submit" />
        </KeyboardToolbar>
      </>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  scroll: { padding: 16 },
  input: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
  },
});
```

---

## Chat Input with Sticky View

```typescript
import React, { useState } from 'react';
import { FlatList, TextInput, View, Text, StyleSheet } from 'react-native';
import {
  KeyboardProvider,
  KeyboardStickyView,
  KeyboardGestureArea,
} from 'react-native-keyboard-controller';

function ChatScreen() {
  const [message, setMessage] = useState('');

  return (
    <KeyboardProvider>
      <View style={styles.container}>
        <KeyboardGestureArea interpolator="ios" style={styles.flex}>
          <FlatList
            data={messages}
            renderItem={({ item }) => (
              <View style={styles.bubble}>
                <Text>{item.text}</Text>
              </View>
            )}
            inverted
            keyboardDismissMode="interactive"
          />
        </KeyboardGestureArea>

        <KeyboardStickyView offset={{ opened: 0, closed: 0 }}>
          <View style={styles.inputRow}>
            <TextInput
              value={message}
              onChangeText={setMessage}
              placeholder="Type a message..."
              style={styles.input}
            />
          </View>
        </KeyboardStickyView>
      </View>
    </KeyboardProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  bubble: { padding: 10, margin: 4, backgroundColor: '#e8e8e8', borderRadius: 12 },
  inputRow: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderTopColor: '#ddd' },
  input: { flex: 1, padding: 10, fontSize: 16 },
});
```

---

## Dynamic Input Mode per Screen

```typescript
import { KeyboardController, AndroidSoftInputModes } from 'react-native-keyboard-controller';
import { useEffect } from 'react';
import { Platform } from 'react-native';

function useAdjustResize() {
  useEffect(() => {
    if (Platform.OS === 'android') {
      KeyboardController.setInputMode(
        AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE
      );
      return () => {
        KeyboardController.setDefaultMode();
      };
    }
  }, []);
}
```

---

## Performance Checklist

- [ ] Use `useReanimatedKeyboardAnimation` over `useKeyboardAnimation`
- [ ] Add `'worklet'` directive in all `useKeyboardHandler` callbacks
- [ ] Keep worklet callbacks lightweight (no heavy computation)
- [ ] Use `React.memo()` for animated components
- [ ] Enable ProMotion on iOS (Info.plist `CADisableMinimumFrameDurationOnPhone`)
- [ ] Profile on real devices, not simulators
- [ ] Monitor frame drops with Perf Monitor

---

**Version:** 1.21.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/docs/recipes/
