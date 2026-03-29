# Keyboard Controller: Extensions & Views

**OverKeyboardView, KeyboardExtender, KeyboardBackgroundView, KeyboardGestureArea**

---

## OverKeyboardView

Display content above the keyboard without dismissing it. Useful for autocomplete suggestions, emoji pickers, or custom overlays.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `visible` | `boolean` | -- | Controls visibility. `true` shows the view, `false` hides it. |

**Note:** This component intentionally has minimal props. Use `react-native-reanimated` and `react-native-safe-area-context` for custom animations and styling.

### Example

```typescript
import React, { useState } from 'react';
import { OverKeyboardView } from 'react-native-keyboard-controller';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

function AutocompleteSuggestions() {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestions = ['React Native', 'React', 'Redux'];

  return (
    <>
      <TextInput
        placeholder="Search..."
        onChangeText={(text) => setShowSuggestions(text.length > 0)}
      />

      <OverKeyboardView visible={showSuggestions}>
        <View style={styles.suggestions}>
          {suggestions.map((item) => (
            <TouchableOpacity key={item} style={styles.suggestion}>
              <Text>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </OverKeyboardView>
    </>
  );
}

const styles = StyleSheet.create({
  suggestions: { backgroundColor: '#fff', padding: 8, borderTopWidth: 1, borderColor: '#ddd' },
  suggestion: { padding: 12 },
});
```

---

## KeyboardExtender

Render custom content **inside** the keyboard area. The content appears as part of the keyboard itself.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | When `true`, attaches content to keyboard. When `false`, detaches. |

### Example

```typescript
import { KeyboardExtender } from 'react-native-keyboard-controller';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

function QuickActions() {
  return (
    <KeyboardExtender enabled={true}>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.action}>
          <Text>Bold</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Text>Italic</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.action}>
          <Text>Link</Text>
        </TouchableOpacity>
      </View>
    </KeyboardExtender>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  action: { marginHorizontal: 8, padding: 8 },
});
```

---

## KeyboardBackgroundView

Matches the keyboard background color for seamless UI. Wraps around KeyboardStickyView or other content.

### Example

```typescript
import {
  KeyboardBackgroundView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

function SeamlessToolbar() {
  return (
    <KeyboardBackgroundView>
      <KeyboardStickyView>
        <TouchableOpacity style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </KeyboardStickyView>
    </KeyboardBackgroundView>
  );
}

const styles = StyleSheet.create({
  sendButton: { padding: 12, alignItems: 'center' },
  sendText: { color: '#007AFF', fontWeight: '600' },
});
```

---

## KeyboardGestureArea

Enable interactive keyboard dismiss via swipe gestures. **Android 11+ only** -- renders as empty fragment on older versions.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `offset` | `number` | `0` | Extra distance to the keyboard |
| `interpolator` | `'linear' \| 'ios'` | -- | `'ios'` mimics iOS dismissal behavior; `'linear'` maps gesture directly to keyboard position |
| `showOnSwipeUp` | `boolean` | `false` | Allow showing keyboard by swiping up (when already closed) |
| `enableSwipeToDismiss` | `boolean` | `true` | When `false`, gestures do not affect keyboard position when visible |
| `textInputNativeID` | `string` | -- | Link to specific TextInput(s) via matching `nativeID`. Required on iOS for offset behavior. |

### Example

```typescript
import { KeyboardGestureArea } from 'react-native-keyboard-controller';
import { FlatList, TextInput, View, StyleSheet } from 'react-native';

function ChatScreen() {
  return (
    <View style={styles.container}>
      <KeyboardGestureArea
        interpolator="ios"
        style={styles.gestureArea}
      >
        <FlatList
          data={messages}
          renderItem={({ item }) => <MessageBubble message={item} />}
          inverted
        />
      </KeyboardGestureArea>

      <TextInput
        placeholder="Type a message..."
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gestureArea: { flex: 1 },
  input: { padding: 12, borderTopWidth: 1, borderTopColor: '#ddd' },
});
```

---

## Combining Extensions for Chat UI

```typescript
import React from 'react';
import { FlatList, TextInput, View, StyleSheet } from 'react-native';
import {
  KeyboardProvider,
  KeyboardStickyView,
  KeyboardBackgroundView,
  KeyboardGestureArea,
  useReanimatedKeyboardAnimation,
} from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

function ChatScreen() {
  const { height } = useReanimatedKeyboardAnimation();

  const listStyle = useAnimatedStyle(() => ({
    marginBottom: height.value * -1,
  }));

  return (
    <View style={styles.container}>
      <KeyboardGestureArea interpolator="ios" style={styles.flex}>
        <Animated.FlatList
          data={messages}
          renderItem={renderMessage}
          inverted
          style={[styles.flex, listStyle]}
        />
      </KeyboardGestureArea>

      <KeyboardBackgroundView>
        <KeyboardStickyView offset={{ opened: 0, closed: 0 }}>
          <View style={styles.inputRow}>
            <TextInput placeholder="Message..." style={styles.input} />
          </View>
        </KeyboardStickyView>
      </KeyboardBackgroundView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  flex: { flex: 1 },
  inputRow: { flexDirection: 'row', padding: 8, alignItems: 'center' },
  input: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 20 },
});
```

---

**Version:** 1.21.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/views/
