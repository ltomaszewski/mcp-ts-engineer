# Keyboard Controller: UI Components

**KeyboardToolbar, KeyboardAwareScrollView, and more**

---

## Component Comparison

| Component | Sticks to Keyboard | Manages Layout | Use Case |
|-----------|-------------------|-----------------|----------|
| **KeyboardToolbar** | Yes | Yes | Multi-input forms |
| **KeyboardAwareScrollView** | No | Yes | Long forms |
| **KeyboardStickyView** | Yes | No | Custom accessories |
| **KeyboardAvoidingView** | No | Yes | Avoid overlap |
| **OverKeyboardView** | Yes | No | Suggestions |

---

## KeyboardToolbar (v1.19)

Sticky toolbar above keyboard with navigation and done buttons.

### Compound API
```typescript
<KeyboardToolbar>
  <KeyboardToolbar.Previous />
  <KeyboardToolbar.Next />
  <KeyboardToolbar.Done onPress={handleDone} />
</KeyboardToolbar>
```

### Props
| Prop | Type | Description |
|------|------|-------------|
| `children` | `ReactNode` | Toolbar buttons |
| `style` | `ViewStyle` | Container style |
| `backgroundColor` | `string` | Background color |
| `onDone` | `() => void` | Done callback |

### Example
```typescript
import {
  KeyboardToolbar,
  KeyboardAwareScrollView,
} from 'react-native-keyboard-controller';

function FormScreen() {
  return (
    <>
      <KeyboardAwareScrollView bottomOffset={62}>
        <TextInput placeholder="First name" />
        <TextInput placeholder="Last name" />
        <TextInput placeholder="Email" />
      </KeyboardAwareScrollView>

      <KeyboardToolbar>
        <KeyboardToolbar.Previous />
        <KeyboardToolbar.Next />
        <KeyboardToolbar.Done label="Done" />
      </KeyboardToolbar>
    </>
  );
}
```

---

## KeyboardAwareScrollView

Auto-scrolls to keep focused input visible.

### Props
```typescript
interface KeyboardAwareScrollViewProps extends ScrollViewProps {
  bottomOffset?: number;    // Gap between keyboard and caret
  ScrollViewComponent?: typeof ScrollView;
  disableScrollOnKeyboardHide?: boolean;
  enabled?: boolean;
  extraKeyboardSpace?: number;
}
```

### Example
```typescript
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';

function Form() {
  return (
    <KeyboardAwareScrollView
      bottomOffset={50}
      contentContainerStyle={{ padding: 16 }}
    >
      {[...Array(10)].map((_, i) => (
        <TextInput
          key={i}
          placeholder={`Field ${i + 1}`}
          style={styles.input}
        />
      ))}
    </KeyboardAwareScrollView>
  );
}
```

---

## KeyboardStickyView

Positions content to stick to keyboard.

### Props
```typescript
interface KeyboardStickyViewProps extends ViewProps {
  offset?: number;
  visible?: boolean;
}
```

### Example
```typescript
import { KeyboardStickyView } from 'react-native-keyboard-controller';

function StickyButton() {
  return (
    <KeyboardStickyView offset={10}>
      <TouchableOpacity style={styles.button}>
        <Text>Send</Text>
      </TouchableOpacity>
    </KeyboardStickyView>
  );
}
```

---

## OverKeyboardView

Displays content above keyboard without dismissing it.

### Props
```typescript
interface OverKeyboardViewProps extends ViewProps {
  offset?: number;
  hideWhenKeyboardHides?: boolean;
}
```

### Example
```typescript
import { OverKeyboardView } from 'react-native-keyboard-controller';

function AutocompleteInput() {
  const [text, setText] = useState('');
  const suggestions = ['Apple', 'Banana', 'Cherry'];

  return (
    <>
      <TextInput value={text} onChangeText={setText} />

      {text.length > 0 && (
        <OverKeyboardView offset={10}>
          <ScrollView>
            {suggestions.map((item) => (
              <TouchableOpacity key={item} onPress={() => setText(item)}>
                <Text>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </OverKeyboardView>
      )}
    </>
  );
}
```

---

## KeyboardAvoidingView

Avoids keyboard overlap with padding/height/position behavior.

### Props
```typescript
interface KeyboardAvoidingViewProps extends ViewProps {
  behavior?: 'padding' | 'height' | 'position';
  keyboardVerticalOffset?: number;
  enabled?: boolean;
}
```

---

**See Also**: [Extensions](05-extensions.md) | [Implementation Guides](06-implementation-guides.md)
