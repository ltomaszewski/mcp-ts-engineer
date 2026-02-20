# Keyboard Controller: Extensions & Customization

**KeyboardExtender, KeyboardBackgroundView, custom keyboard UI**

---

## KeyboardExtender

Render custom content **inside** the keyboard area.

### Use Cases
- Additional action buttons
- Emoji picker extensions
- Custom input helpers

### Props
```typescript
interface KeyboardExtenderProps extends ViewProps {
  offset?: number;
  visible?: boolean;
}
```

### Example
```typescript
import { KeyboardExtender } from 'react-native-keyboard-controller';

function QuickActions() {
  const actions = [
    { id: '1', icon: '😀', label: 'Emoji' },
    { id: '2', icon: '📎', label: 'Attach' },
    { id: '3', icon: '🔗', label: 'Link' },
  ];

  return (
    <KeyboardExtender style={styles.extension}>
      <View style={styles.actionsContainer}>
        {actions.map((action) => (
          <TouchableOpacity
            key={action.id}
            style={styles.actionButton}
            onPress={() => console.log(action.label)}
          >
            <Text style={styles.icon}>{action.icon}</Text>
            <Text style={styles.label}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </KeyboardExtender>
  );
}

const styles = StyleSheet.create({
  extension: {
    backgroundColor: '#f0f0f0',
    borderTopWidth: 1,
    borderTopColor: '#ddd',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionButton: {
    alignItems: 'center',
    marginHorizontal: 8,
  },
  icon: { fontSize: 24, marginBottom: 4 },
  label: { fontSize: 11, color: '#666' },
});
```

---

## KeyboardBackgroundView

Matches keyboard background color for seamless UI.

### Props
```typescript
interface KeyboardBackgroundViewProps extends ViewProps {
  offset?: number;
}
```

### Example
```typescript
import {
  KeyboardBackgroundView,
  KeyboardStickyView,
} from 'react-native-keyboard-controller';

function SeamlessToolbar() {
  return (
    <KeyboardBackgroundView>
      <KeyboardStickyView>
        <TouchableOpacity style={styles.sendButton}>
          <Text>Send</Text>
        </TouchableOpacity>
      </KeyboardStickyView>
    </KeyboardBackgroundView>
  );
}
```

---

## KeyboardGestureArea

Enable interactive keyboard dismiss gestures (Android 11+).

### Example
```typescript
import { KeyboardGestureArea } from 'react-native-keyboard-controller';

function InteractiveScreen() {
  return (
    <KeyboardGestureArea style={{ flex: 1 }}>
      {/* Swipe to dismiss keyboard */}
      <YourContent />
    </KeyboardGestureArea>
  );
}
```

---

## Combining Extensions

```typescript
function ChatInput() {
  return (
    <>
      <TextInput
        placeholder="Message..."
        style={styles.input}
      />

      <KeyboardBackgroundView>
        <KeyboardStickyView>
          <View style={styles.toolbar}>
            <TouchableOpacity>
              <Text>📷</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text>🎤</Text>
            </TouchableOpacity>
            <TouchableOpacity>
              <Text>Send</Text>
            </TouchableOpacity>
          </View>
        </KeyboardStickyView>
      </KeyboardBackgroundView>

      <KeyboardExtender>
        <View style={styles.quickReplies}>
          <TouchableOpacity><Text>👍</Text></TouchableOpacity>
          <TouchableOpacity><Text>❤️</Text></TouchableOpacity>
          <TouchableOpacity><Text>😂</Text></TouchableOpacity>
        </View>
      </KeyboardExtender>
    </>
  );
}
```

---

**See Also**: [UI Components](04-ui-components.md) | [Implementation Guides](06-implementation-guides.md)
