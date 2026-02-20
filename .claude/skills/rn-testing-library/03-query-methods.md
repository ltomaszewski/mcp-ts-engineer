# Query Methods - React Native Testing Library

**Document URL:** https://oss.callstack.com/react-native-testing-library/docs/api/queries

**Version:** 13.3.3

---

## Query Variants

### Variant Types

| Variant | Throws | Returns | Async | Use Case |
|---------|--------|---------|-------|----------|
| `getBy*()` | Yes | Element | No | Single element, must exist |
| `getAllBy*()` | Yes | Element[] | No | Multiple elements, must exist |
| `queryBy*()` | No | Element \| null | No | Single element, may not exist |
| `queryAllBy*()` | No | Element[] | No | Multiple elements, may not exist |
| `findBy*()` | Yes | Promise<Element> | Yes | Single element, wait for it |
| `findAllBy*()` | Yes | Promise<Element[]> | Yes | Multiple elements, wait for them |

---

## getByRole()

### Description

The most recommended query method. Finds elements by their accessibility role. Encourages semantic, accessible component structure.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbyrole](https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbyrole)

### Signature

```typescript
function getByRole(
  role: TextMatch,
  options?: {
    name?: TextMatch;
    disabled?: boolean;
    selected?: boolean;
    checked?: boolean | 'mixed';
    busy?: boolean;
    expanded?: boolean;
  }
): ReactTestInstance
```

### Code Examples

#### Find Button by Role

```typescript
import { render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

test('find button by role', () => {
  render(
    <Pressable accessibilityRole="button">
      <Text>Submit</Text>
    </Pressable>
  );
  
  const button = screen.getByRole('button');
  expect(button).toBeOnTheScreen();
});
```

#### Find Button with Name

```typescript
test('find button by role and name', () => {
  render(
    <View>
      <Pressable accessibilityRole="button">
        <Text>Cancel</Text>
      </Pressable>
      <Pressable accessibilityRole="button">
        <Text>Submit</Text>
      </Pressable>
    </View>
  );
  
  const submitBtn = screen.getByRole('button', { name: 'Submit' });
  const cancelBtn = screen.getByRole('button', { name: /Cancel/i });
  
  expect(submitBtn).toBeOnTheScreen();
  expect(cancelBtn).toBeOnTheScreen();
});
```

#### Find Checkbox with State

```typescript
test('find checkbox by role and checked state', () => {
  render(
    <View>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: false }}
      >
        <Text>Unchecked Option</Text>
      </Pressable>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: true }}
      >
        <Text>Checked Option</Text>
      </Pressable>
    </View>
  );
  
  const unchecked = screen.getByRole('checkbox', { checked: false });
  const checked = screen.getByRole('checkbox', { checked: true });
  
  expect(unchecked).toBeOnTheScreen();
  expect(checked).toBeOnTheScreen();
});
```

---

## getByLabelText()

### Description

Finds form elements by their label. Looks for `accessibilityLabel` properties. Semantic and accessible.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbylabeltext](https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbylabeltext)

### Signature

```typescript
function getByLabelText(
  labelText: TextMatch,
  options?: {
    exact?: boolean;
    normalizer?: (text: string) => string;
  }
): ReactTestInstance
```

### Code Examples

#### TextInput with accessibilityLabel

```typescript
test('find input by accessibility label', () => {
  render(
    <View>
      <TextInput
        accessibilityLabel="Username"
        placeholder="Enter username"
      />
      <TextInput
        accessibilityLabel="Password"
        placeholder="Enter password"
        secureTextEntry
      />
    </View>
  );
  
  const usernameInput = screen.getByLabelText('Username');
  const passwordInput = screen.getByLabelText('Password');
  
  expect(usernameInput).toBeOnTheScreen();
  expect(passwordInput).toBeOnTheScreen();
});
```

#### Case-Insensitive Match

```typescript
test('label text with case insensitivity', () => {
  render(
    <TextInput accessibilityLabel="Email Address" />
  );
  
  const input = screen.getByLabelText(/email/i);
  expect(input).toBeOnTheScreen();
});
```

---

## getByPlaceholderText()

### Description

Finds TextInput elements by their placeholder text. Useful for form inputs without explicit labels.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbyplaceholdertext](https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbyplaceholdertext)

### Signature

```typescript
function getByPlaceholderText(
  placeholderText: TextMatch,
  options?: {
    exact?: boolean;
    normalizer?: (text: string) => string;
  }
): ReactTestInstance
```

### Code Examples

#### Find Input by Placeholder

```typescript
test('find input by placeholder text', () => {
  render(
    <View>
      <TextInput placeholder="Enter your email" />
      <TextInput placeholder="Enter your password" secureTextEntry />
    </View>
  );
  
  const emailInput = screen.getByPlaceholderText('Enter your email');
  const passwordInput = screen.getByPlaceholderText('Enter your password');
  
  expect(emailInput).toBeOnTheScreen();
  expect(passwordInput).toBeOnTheScreen();
});
```

---

## getByDisplayValue()

### Description

Finds TextInput elements by their current display value. Useful after user input or initialization with values.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbydisplayvalue](https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbydisplayvalue)

### Code Examples

#### Find Input by Current Value

```typescript
test('find input by display value', () => {
  render(
    <View>
      <TextInput value="alice@example.com" editable={false} />
      <TextInput value="Set Username" editable={false} />
    </View>
  );
  
  const emailDisplay = screen.getByDisplayValue('alice@example.com');
  const usernameDisplay = screen.getByDisplayValue('Set Username');
  
  expect(emailDisplay).toBeOnTheScreen();
  expect(usernameDisplay).toBeOnTheScreen();
});
```

---

## getByText()

### Description

Finds elements by their text content. Less semantic than role-based queries but very common.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbytext](https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbytext)

### Code Examples

#### Find Element by Exact Text

```typescript
test('find element by exact text', () => {
  render(
    <View>
      <Text>Hello World</Text>
      <Text>Hello Universe</Text>
    </View>
  );
  
  const element = screen.getByText('Hello World');
  expect(element).toBeOnTheScreen();
});
```

#### Case-Insensitive Text Match with Regex

```typescript
test('find element by regex', () => {
  render(
    <View>
      <Text>Welcome to React Native</Text>
    </View>
  );
  
  const element = screen.getByText(/react/i);
  expect(element).toBeOnTheScreen();
});
```

---

## getByTestId()

### Description

Finds elements by their `testID` prop. Not semantic but guaranteed unique. Use as last resort.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbytestid](https://oss.callstack.com/react-native-testing-library/docs/api/queries#getbytestid)

### Code Examples

#### Find Element by testID

```typescript
test('find element by testID', () => {
  render(
    <View testID="unique-container">
      <Text>Content</Text>
    </View>
  );
  
  const container = screen.getByTestId('unique-container');
  expect(container).toBeOnTheScreen();
});
```

#### testID with Regex

```typescript
test('find with testID pattern', () => {
  render(
    <View>
      <View testID="user-card-1" />
      <View testID="user-card-2" />
      <View testID="user-card-3" />
    </View>
  );
  
  const cards = screen.getAllByTestId(/user-card/);
  expect(cards).toHaveLength(3);
});
```

---

## Query Selection Strategy

### Priority Order (Recommended)

1. **getByRole()** - Most semantic, accessible ✅ First choice
2. **getByLabelText()** - Semantic for form inputs ✅ Second choice
3. **getByPlaceholderText()** - Form inputs without labels ✅ Third choice
4. **getByText()** - Generic content ✅ Fourth choice
5. **getByTestId()** - Last resort, implementation detail ⚠️ Avoid if possible

### Decision Tree

```
Is it a button/checkbox/radio/etc?
→ YES: Use getByRole('button', { name: 'Label' })

Is it a form input with label?
→ YES: Use getByLabelText('Label text')

Is it a TextInput with placeholder?
→ YES: Use getByPlaceholderText('Placeholder')

Is it a Text element?
→ YES: Use getByText('Text content')

No semantic identifier available?
→ Use getByTestId('unique-id') as fallback
```

---

## Query Cheatsheet

```typescript
// Single element queries
getByRole('button')              // Most recommended
getByLabelText('Email')          // Form inputs
getByPlaceholderText('Name')     // TextInput placeholder
getByDisplayValue('current')     // TextInput value
getByText('Click me')            // Text content
getByTestId('submit-btn')        // Last resort

// Multiple elements
getAllByRole('button')
getAllByLabelText('Email')
getAllByPlaceholderText('Name')
getAllByDisplayValue('current')
getAllByText('Item')
getAllByTestId('item')

// Queries that don't throw
queryByRole('button')            // null if not found
queryAllByRole('button')         // [] if none found

// Async queries (return promises)
await findByRole('button')       // Waits for element
await findAllByRole('button')    // Waits for elements
```

---

**Next:** [User Interactions →](./04-user-interactions.md)
