# Accessibility & Configuration - React Native Testing Library

**Document URL:** https://oss.callstack.com/react-native-testing-library/docs/api/accessibility

**Version:** 13.3.3

---

## Accessibility Overview

### Accessibility as a Testing Strategy

React Native Testing Library emphasizes accessibility through:

1. **Semantic Queries** - Use `getByRole()` first (encourages accessible components)
2. **ARIA Attributes** - `accessibilityRole`, `accessibilityLabel`, `accessibilityHint`
3. **Visibility Queries** - Test what's actually visible to users
4. **Inclusive Testing** - Benefits all users, not just those with assistive tech

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/accessibility](https://oss.callstack.com/react-native-testing-library/docs/api/accessibility)

### Why Accessibility Matters

| Benefit | Impact |
|---------|--------|
| **Semantic Tests** | Tests resemble user interactions |
| **Inclusive** | Works for all users (screen readers, etc.) |
| **Maintainable** | Tests less brittle to refactoring |
| **Documentation** | Tests serve as accessibility spec |
| **Coverage** | Catches accessibility issues early |

---

## isHiddenFromAccessibility()

### Description

Checks if an element is hidden from accessibility tree (assistive technologies).

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/accessibility#ishiddenfromaccessibility](https://oss.callstack.com/react-native-testing-library/docs/api/accessibility#ishiddenfromaccessibility)

### Signature

```typescript
function isHiddenFromAccessibility(element: ReactTestInstance): boolean
```

### Code Examples

#### Visible Element

```typescript
import { render, screen } from '@testing-library/react-native';
import { isHiddenFromAccessibility } from '@testing-library/react-native';
import { Text } from 'react-native';

test('visible element is not hidden', () => {
  render(
    <Text>Hello World</Text>
  );
  
  const element = screen.getByText('Hello World');
  
  expect(isHiddenFromAccessibility(element)).toBe(false);
});
```

#### Hidden Element with accessibilityElementsHidden

```typescript
test('element with accessibilityElementsHidden is hidden', () => {
  render(
    <View accessibilityElementsHidden={true}>
      <Text>Hidden Text</Text>
    </View>
  );
  
  const element = screen.getByText('Hidden Text');
  
  expect(isHiddenFromAccessibility(element)).toBe(true);
});
```

#### Hidden Element with display: none

```typescript
test('element with display none is hidden', () => {
  render(
    <Text style={{ display: 'none' }}>Hidden Text</Text>
  );
  
  const element = screen.getByText('Hidden Text', { includeHiddenElements: true });
  
  expect(isHiddenFromAccessibility(element)).toBe(true);
});
```

#### Including Hidden Elements in Queries

```typescript
test('query options for hidden elements', () => {
  render(
    <View>
      <Text style={{ display: 'none' }}>Hidden from accessibility</Text>
      <Text>Visible to accessibility</Text>
    </View>
  );
  
  // By default, doesn't find hidden elements
  expect(screen.queryByText('Hidden from accessibility')).toBeNull();
  
  // With option, finds hidden elements
  const hidden = screen.getByText('Hidden from accessibility', { includeHiddenElements: true });
  expect(isHiddenFromAccessibility(hidden)).toBe(true);
  
  // Visible elements always findable
  const visible = screen.getByText('Visible to accessibility');
  expect(isHiddenFromAccessibility(visible)).toBe(false);
});
```

---

## within() for Scoped Queries

### Overview

`within()` scopes all queries to a specific element subtree. Critical for testing isolated sections, lists, and complex nested components.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/within](https://oss.callstack.com/react-native-testing-library/docs/api/within)

### Signature

```typescript
function within<Q extends Queries = typeof queries>(
  element: ReactTestInstance
): Queries
```

### Code Examples

#### Basic within() Usage

```typescript
test('within() scopes queries', () => {
  render(
    <View>
      <View testID="section-1">
        <Text>Item 1</Text>
      </View>
      <View testID="section-2">
        <Text>Item 2</Text>
      </View>
    </View>
  );
  
  const section1 = screen.getByTestId('section-1');
  
  // Query only within section1
  const item1 = within(section1).getByText('Item 1');
  expect(item1).toBeOnTheScreen();
  
  // Item 2 not in section1
  expect(within(section1).queryByText('Item 2')).toBeNull();
});
```

#### List Item Testing

```typescript
test('within() for list items', () => {
  const items = [
    { id: 1, name: 'Apple', price: '$1.00' },
    { id: 2, name: 'Banana', price: '$0.50' },
    { id: 3, name: 'Orange', price: '$1.50' },
  ];
  
  render(
    <FlatList
      data={items}
      renderItem={({ item }) => (
        <View testID={`item-${item.id}`}>
          <Text>{item.name}</Text>
          <Text>{item.price}</Text>
        </View>
      )}
    />
  );
  
  // Find specific item
  const bananaItem = screen.getByTestId('item-2');
  
  // Query within that item
  const name = within(bananaItem).getByText('Banana');
  const price = within(bananaItem).getByText('$0.50');
  
  expect(name).toBeOnTheScreen();
  expect(price).toBeOnTheScreen();
  
  // Other items not in this scope
  expect(within(bananaItem).queryByText('Apple')).toBeNull();
  expect(within(bananaItem).queryByText('Orange')).toBeNull();
});
```

---

## Accessibility Attributes

### Essential Accessibility Props

```typescript
interface AccessibilityProps {
  // Role (button, checkbox, link, etc.)
  accessibilityRole?: AccessibilityRole;
  
  // Label for element
  accessibilityLabel?: string;
  
  // Additional hint text
  accessibilityHint?: string;
  
  // State information
  accessibilityState?: {
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  };
  
  // Value information
  accessibilityValue?: {
    min?: number;
    max?: number;
    now?: number;
    text?: string;
  };
  
  // Hide from accessibility tree
  accessibilityElementsHidden?: boolean;
  
  // Test ID
  testID?: string;
}
```

### Using accessibilityLabel

```typescript
test('accessible button with label', () => {
  render(
    <Pressable accessibilityRole="button" accessibilityLabel="Submit Form">
      <Text>Submit</Text>
    </Pressable>
  );
  
  const button = screen.getByRole('button', { name: 'Submit Form' });
  expect(button).toBeOnTheScreen();
});
```

### Using accessibilityState

```typescript
test('accessible checkbox with state', () => {
  const [checked, setChecked] = useState(false);
  
  render(
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel="Accept terms"
      accessibilityState={{ checked }}
      onPress={() => setChecked(!checked)}
    >
      <Text>I accept the terms</Text>
    </Pressable>
  );
  
  const checkbox = screen.getByRole('checkbox', { checked: false });
  expect(checkbox).toBeOnTheScreen();
});
```

### Using accessibilityValue

```typescript
test('slider with accessibility value', () => {
  render(
    <Slider
      accessibilityRole="slider"
      accessibilityLabel="Volume"
      accessibilityValue={{ min: 0, max: 100, now: 50 }}
    />
  );
  
  const slider = screen.getByRole('slider', { name: 'Volume' });
  expect(slider.props.accessibilityValue).toEqual({
    min: 0,
    max: 100,
    now: 50,
  });
});
```

---

## configure() Settings

### Global Configuration

```typescript
import { configure } from '@testing-library/react-native';

// Set global defaults
configure({
  testIdAttribute: 'testID', // Default attribute for testID queries
  asyncUtilTimeout: 1000,    // Timeout for async queries
});
```

---

## Query Priority

### Recommended Order

```
1. getByRole()           ← Most semantic, most accessible
2. getByLabelText()      ← Form inputs with labels
3. getByPlaceholderText() ← Form inputs with placeholders
4. getByText()           ← Generic content
5. getByTestId()         ← Last resort, implementation detail
```

---

## Accessibility Best Practices

### ✅ DO: Use Semantic Queries

```typescript
// ✅ GOOD: Semantic queries
const button = screen.getByRole('button', { name: 'Click me' });
const input = screen.getByLabelText('Email');
const checkbox = screen.getByRole('checkbox', { name: 'Terms' });

// ✅ Also good
const text = screen.getByText(/pattern/);

// ❌ AVOID: Last resort only
const element = screen.getByTestId('some-id');
```

### ✅ DO: Provide Accessibility Labels

```typescript
// ✅ GOOD: Clear accessible labels
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Delete Item"
  accessibilityHint="This action cannot be undone"
>
  <Icon name="trash" />
</Pressable>

// ❌ POOR: No accessible label
<Pressable>
  <Icon name="trash" />
</Pressable>
```

### ✅ DO: Test Accessibility States

```typescript
test('checkbox state', () => {
  const { rerender } = render(
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel="Enabled"
      accessibilityState={{ checked: false }}
    />
  );
  
  expect(
    screen.getByRole('checkbox', { checked: false })
  ).toBeOnTheScreen();
  
  // Verify state can change
  rerender(
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel="Enabled"
      accessibilityState={{ checked: true }}
    />
  );
  
  expect(
    screen.getByRole('checkbox', { checked: true })
  ).toBeOnTheScreen();
});
```

---

**Next:** [Advanced Patterns →](./08-advanced-patterns.md)
