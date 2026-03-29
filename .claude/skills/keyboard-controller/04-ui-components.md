# Keyboard Controller: UI Components

**KeyboardToolbar, KeyboardAwareScrollView, KeyboardStickyView, KeyboardAvoidingView**

---

## Component Overview

| Component | Sticks to Keyboard | Manages Scroll | Use Case |
|-----------|-------------------|----------------|----------|
| **KeyboardToolbar** | Yes | No | Multi-input form navigation |
| **KeyboardAwareScrollView** | No | Yes | Long scrollable forms |
| **KeyboardStickyView** | Yes | No | Custom sticky accessories |
| **KeyboardAvoidingView** | No | Yes | Simple keyboard avoidance |

---

## KeyboardToolbar

Sticky toolbar above keyboard with prev/next field navigation and done button. Uses compound component pattern.

### Props (Main Component)

Inherits `View` props and `KeyboardStickyView` props, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `insets` | `{ left: number; right: number }` | -- | Padding to prevent overlap with system UI |
| `opacity` | `string` (hex) | `"FF"` | Container opacity in hex (e.g., `"80"` for 50%) |
| `theme` | `object` | `DefaultKeyboardToolbarTheme` | Brand colors for dark/light modes |

### Compound Components

#### `KeyboardToolbar.Prev` / `KeyboardToolbar.Next`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `button` | `React.ComponentType` | Built-in | Custom touchable component |
| `icon` | `React.ComponentType` | Built-in | Custom icon renderer |
| `onPress` | `(e: GestureResponderEvent) => void` | -- | Callback; call `e.preventDefault()` to block default navigation |

#### `KeyboardToolbar.Done`

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `button` | `React.ComponentType` | Built-in | Custom touchable component |
| `text` | `string` | `"Done"` | Custom button label |
| `onPress` | `(e: GestureResponderEvent) => void` | -- | Callback; call `e.preventDefault()` to block keyboard dismissal |

#### `KeyboardToolbar.Content`

Renders custom content in the middle of the toolbar.

#### `KeyboardToolbar.Background`

Renders a custom background (e.g., blur effect) that overlays the entire toolbar.

### Example

```typescript
import React from 'react';
import { TextInput, View, StyleSheet } from 'react-native';
import {
  KeyboardToolbar,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-controller';

export function FormWithToolbar() {
  return (
    <>
      <KeyboardAwareScrollView bottomOffset={62}>
        <View style={styles.container}>
          <TextInput placeholder="First name" style={styles.input} />
          <TextInput placeholder="Last name" style={styles.input} />
          <TextInput placeholder="Email" style={styles.input} keyboardType="email-address" />
          <TextInput placeholder="Phone" style={styles.input} keyboardType="phone-pad" />
        </View>
      </KeyboardAwareScrollView>

      <KeyboardToolbar>
        <KeyboardToolbar.Prev />
        <KeyboardToolbar.Next />
        <KeyboardToolbar.Done text="Submit" />
      </KeyboardToolbar>
    </>
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

### Custom Toolbar Content

```typescript
<KeyboardToolbar>
  <KeyboardToolbar.Prev />
  <KeyboardToolbar.Content>
    <Text style={{ textAlign: 'center' }}>Step 2 of 5</Text>
  </KeyboardToolbar.Content>
  <KeyboardToolbar.Done text="Next" />
</KeyboardToolbar>
```

---

## KeyboardAwareScrollView

Auto-scrolls to keep focused input visible above the keyboard. Drop-in replacement for ScrollView.

### Props

Inherits all `ScrollView` props, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `bottomOffset` | `number` | `0` | Gap between keyboard top and text caret (equivalent to `extraHeight` in older libraries) |
| `disableScrollOnKeyboardHide` | `boolean` | `false` | Prevents automatic scroll-back when keyboard hides, maintaining current position |
| `enabled` | `boolean` | `true` | Enable/disable keyboard awareness |
| `extraKeyboardSpace` | `number` | `0` | Extra bottom spacing. Negative for elements between scroll and screen edge, positive for sticky elements |
| `ScrollViewComponent` | `typeof ScrollView` | `ScrollView` | Custom ScrollView component (e.g., from gesture-handler) |

### Methods

| Method | Added | Description |
|--------|-------|-------------|
| `assureFocusedInputVisible()` | v1.20.0 | Programmatically ensure the focused input is visible. Useful after dynamic layout changes (e.g., validation errors appearing). Provides pixel-perfect accuracy across all configurations including accessibility settings. |

### Using assureFocusedInputVisible (v1.20.0+)

```typescript
import React, { useRef } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { TextInput, View, Text, StyleSheet } from 'react-native';

function FormWithValidation() {
  const scrollRef = useRef<KeyboardAwareScrollView>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleValidation = (text: string) => {
    if (text.length < 3) {
      setError('Must be at least 3 characters');
      // After error message changes layout, ensure input stays visible
      scrollRef.current?.assureFocusedInputVisible();
    } else {
      setError(null);
    }
  };

  return (
    <KeyboardAwareScrollView ref={scrollRef} bottomOffset={50}>
      <View style={styles.container}>
        <TextInput
          placeholder="Username"
          style={styles.input}
          onChangeText={handleValidation}
        />
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  input: { padding: 12, borderWidth: 1, borderColor: '#ccc', borderRadius: 8 },
  error: { color: 'red', fontSize: 12, marginTop: 4 },
});
```

### Example

```typescript
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { TextInput, View, StyleSheet } from 'react-native';

function RegistrationForm() {
  return (
    <KeyboardAwareScrollView
      bottomOffset={50}
      disableScrollOnKeyboardHide={false}
      contentContainerStyle={{ padding: 16 }}
      keyboardShouldPersistTaps="handled"
    >
      <TextInput placeholder="Name" style={styles.input} />
      <TextInput placeholder="Email" style={styles.input} keyboardType="email-address" />
      <TextInput placeholder="Password" style={styles.input} secureTextEntry />
      <TextInput placeholder="Confirm Password" style={styles.input} secureTextEntry />
      <TextInput placeholder="Address" style={styles.input} />
      <TextInput placeholder="City" style={styles.input} />
      <TextInput placeholder="Zip Code" style={styles.input} keyboardType="number-pad" />
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  input: {
    marginBottom: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
  },
});
```

---

## KeyboardChatScrollView (v1.21.0+)

Purpose-built scroll view for chat interfaces. Solves layout thrashing during keyboard animations by using cross-platform `contentInset` behavior. Dramatically simplifies building messenger and AI chat layouts.

### Props

Inherits all `ScrollView` props, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `extraContentPadding` | `number` | `0` | Extra padding below content. Useful for spacing between last message and input bar. |
| `blankSpace` | `number` | `0` | Blank space at the bottom of the scroll view. Useful for visual padding in short message lists. |

### Example

```typescript
import { KeyboardChatScrollView } from 'react-native-keyboard-controller';
import { FlatList, TextInput, View, StyleSheet } from 'react-native';

function ChatScreen() {
  return (
    <KeyboardChatScrollView extraContentPadding={16} blankSpace={100}>
      <FlatList
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        inverted
      />
      <View style={styles.inputRow}>
        <TextInput placeholder="Type a message..." style={styles.input} />
      </View>
    </KeyboardChatScrollView>
  );
}

const styles = StyleSheet.create({
  inputRow: { flexDirection: 'row', padding: 8 },
  input: { flex: 1, padding: 10, borderWidth: 1, borderColor: '#ddd', borderRadius: 20 },
});
```

---

## KeyboardToolbar.Group (v1.21.0+)

Groups toolbar items together within the `KeyboardToolbar` compound component. Useful for visually separating navigation controls from action buttons.

### Example

```typescript
import { KeyboardToolbar } from 'react-native-keyboard-controller';

function ToolbarWithGroups() {
  return (
    <KeyboardToolbar>
      <KeyboardToolbar.Group>
        <KeyboardToolbar.Prev />
        <KeyboardToolbar.Next />
      </KeyboardToolbar.Group>
      <KeyboardToolbar.Content>
        <Text>Step 2 of 5</Text>
      </KeyboardToolbar.Content>
      <KeyboardToolbar.Done text="Submit" />
    </KeyboardToolbar>
  );
}
```

---

## KeyboardStickyView

Sticks content to the keyboard -- follows keyboard position as it animates.

### Props

Inherits `View` props, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | When disabled, view returns to initial position and stops responding to keyboard |
| `offset` | `{ closed?: number; opened?: number }` | `{ closed: 0, opened: 0 }` | Extra spacing when keyboard is hidden (`closed`) or visible (`opened`) |

### Example

```typescript
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

function StickyButton() {
  return (
    <KeyboardStickyView offset={{ opened: 10, closed: 0 }}>
      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Send Message</Text>
      </TouchableOpacity>
    </KeyboardStickyView>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#007AFF',
    padding: 14,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: '600' },
});
```

---

## KeyboardAvoidingView

Adjusts layout to avoid keyboard overlap. Provides four behavior modes.

### Props

Inherits `View` props, plus:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `behavior` | `'translate-with-padding' \| 'padding' \| 'height' \| 'position'` | -- | How the view responds to keyboard |
| `keyboardVerticalOffset` | `number` | `0` | Extra offset for headers/navigation bars above the view |
| `automaticOffset` | `boolean` | `false` | Automatically detect and account for headers and modals, eliminating the need for manual `keyboardVerticalOffset` calculation (v1.21.0+) |
| `enabled` | `boolean` | `true` | Enable/disable avoidance |
| `contentContainerStyle` | `ViewStyle` | -- | Style for content container when `behavior="position"` |

### Behavior Modes

| Mode | Description | Best For |
|------|-------------|----------|
| `translate-with-padding` | Translates + adds paddingTop | Chat apps (best performance) |
| `padding` | Adds paddingBottom | ScrollView-based layouts |
| `height` | Shrinks entire view | Fixed-height layouts |
| `position` | Shifts view upward | Fixed bottom buttons |

### Example

```typescript
import { KeyboardAvoidingView } from 'react-native-keyboard-controller';
import { Platform, TextInput, StyleSheet } from 'react-native';

function SimpleForm() {
  return (
    <KeyboardAvoidingView
      behavior="padding"
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
      style={styles.container}
    >
      <TextInput placeholder="Message" style={styles.input} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end' },
  input: { padding: 12, borderWidth: 1, borderColor: '#ccc', margin: 16 },
});
```

---

**Version:** 1.21.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/components/
