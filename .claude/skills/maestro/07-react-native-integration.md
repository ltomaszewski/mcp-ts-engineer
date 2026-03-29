# MODULE 7: REACT NATIVE INTEGRATION

## React Native Setup Prerequisites

### Create New React Native Project

```bash
# Using npx (recommended)
npx react-native init MyTestApp

# Navigate to project
cd MyTestApp

# Install dependencies
npm install

# Start development server
npm start
```

**Project Structure:**
```
MyTestApp/
├── App.js                    # Main component
├── android/                  # Android native code
├── ios/                      # iOS native code
├── node_modules/
├── package.json
└── maestro/                  # Create this directory
    ├── flows/
    │   ├── login.yaml
    │   ├── signup.yaml
    │   └── settings.yaml
    └── maestro.yaml
```

## Enabling testID in React Native

### testID Prop

React Native components support `testID` for element identification:

```jsx
import React from 'react';
import { Button, TextInput, View } from 'react-native';

export default function LoginScreen() {
  return (
    <View testID="login_screen">
      <TextInput
        testID="email_input"
        placeholder="Email"
      />
      
      <TextInput
        testID="password_input"
        placeholder="Password"
        secureTextEntry={true}
      />
      
      <Button
        testID="login_button"
        title="Sign In"
        onPress={() => {/* handle login */}}
      />
    </View>
  );
}
```

**Supported Components:**
```jsx
<Button testID="button_id" />
<TextInput testID="input_id" />
<View testID="view_id" />
<Text testID="text_id" />
<ScrollView testID="scroll_id" />
<FlatList testID="list_id" />
<TouchableOpacity testID="touchable_id" />
```

## ⚠️ CRITICAL: testID Accessibility Aggregation Issue

### Problem

Container components like `Pressable`, `TouchableOpacity`, and `View` with `accessible={true}` (default) **aggregate all child accessibility info** into a single element. This hides individual `testID`s from Maestro.

**Symptom:** Maestro can't find `testID` elements nested inside Pressable or other container components.

**Evidence in Maestro hierarchy:**
```json
"accessibilityText": "Continue with Apple, or log in with your email, email_input, password_input, Login"
```
The testIDs are merged into the parent's accessibilityText instead of being separate elements.

### Solution

Add `accessible={false}` to container components that wrap elements with `testID`:

```jsx
// ❌ BROKEN - Pressable aggregates child testIDs
<Pressable onPress={Keyboard.dismiss}>
  <TextInput testID="email_input" />
  <TextInput testID="password_input" />
</Pressable>

// ✅ FIXED - accessible={false} exposes child testIDs
<Pressable onPress={Keyboard.dismiss} accessible={false}>
  <TextInput testID="email_input" />
  <TextInput testID="password_input" />
</Pressable>
```

### Components That Need `accessible={false}`

When wrapping form elements with `testID`:

| Component | Default `accessible` | Fix |
|-----------|---------------------|-----|
| `Pressable` | `true` | Add `accessible={false}` |
| `TouchableOpacity` | `true` | Add `accessible={false}` |
| `TouchableWithoutFeedback` | `true` | Add `accessible={false}` |
| `View` (wrapper) | `false` | Usually OK, but add if issues |

### Best Practice Pattern

```jsx
// Form with keyboard dismissal - correct pattern
<KeyboardAwareScrollView>
  <Pressable onPress={Keyboard.dismiss} accessible={false}>
    <View accessible={false}>
      <TextInput
        testID="email_input"
        accessible={true}
        accessibilityLabel="email_input"
      />
      <TextInput
        testID="password_input"
        accessible={true}
        accessibilityLabel="password_input"
      />
      <Button testID="submit_button" />
    </View>
  </Pressable>
</KeyboardAwareScrollView>
```

**Key Points:**
- Container components: `accessible={false}`
- Interactive elements (TextInput, Button): `accessible={true}` with `testID`
- This ensures Maestro can find each testID individually

---

## Interacting with React Native Components

### TextInput

**Component:**
```jsx
<TextInput
  testID="search_field"
  placeholder="Search products..."
  editable={true}
/>
```

**Maestro Flow:**
```yaml
- tapOn:
    id: "search_field"
- inputText: "laptop"
```

### Button

**Component:**
```jsx
<Button
  testID="submit_btn"
  title="Submit Order"
  onPress={handleSubmit}
/>
```

**Maestro Flow:**
```yaml
- tapOn:
    id: "submit_btn"
```

### ScrollView

**Component:**
```jsx
<ScrollView testID="product_list">
  <Text>Item 1</Text>
  <Text>Item 2</Text>
  <Text>Item 3</Text>
</ScrollView>
```

**Maestro Flow:**
```yaml
- scroll:
    direction: "down"
    amount: 3
```

### FlatList

**Component:**
```jsx
<FlatList
  testID="items_list"
  data={items}
  renderItem={({ item }) => (
    <View testID={`item_${item.id}`}>
      <Text>{item.name}</Text>
    </View>
  )}
/>
```

**Maestro Flow:**
```yaml
# Tap specific item
- tapOn:
    id: "item_123"

# Scroll for more items
- scroll:
    direction: "down"
    amount: 5
```

---

**Version:** 2.x (2.3.1) | **Source:** https://docs.maestro.dev/platform-support/react-native
