# Query Methods - React Native Testing Library

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/queries

**Version:** 13.3.x

---

## Query Variants

### Variant Types

| Variant | Throws | Returns | Async | Use Case |
|---------|--------|---------|-------|----------|
| `getBy*()` | Yes | Element | No | Single element, must exist |
| `getAllBy*()` | Yes | Element[] | No | Multiple elements, must exist |
| `queryBy*()` | No | Element \| null | No | Single element, may not exist |
| `queryAllBy*()` | No | Element[] | No | Multiple elements, may not exist |
| `findBy*()` | Yes | Promise\<Element\> | Yes | Single element, wait for it |
| `findAllBy*()` | Yes | Promise\<Element[]\> | Yes | Multiple elements, wait for them |

### v13 Removed Queries

The following query methods were **removed in v13**:

| Removed Query | Migration |
|---------------|-----------|
| `*ByA11yState()` | Use `*ByRole()` with state options (`{ checked, disabled, selected, busy, expanded }`) or matchers like `toBeChecked()` |
| `*ByA11yValue()` | Use `*ByRole()` with `value` option or `toHaveAccessibilityValue()` matcher |

```typescript
// v12 (REMOVED):
screen.getByA11yState({ checked: true });
screen.getByA11yValue({ min: 0, max: 100, now: 50 });

// v13 (CORRECT):
screen.getByRole('checkbox', { checked: true });
screen.getByRole('adjustable', { value: { min: 0, max: 100, now: 50 } });
expect(slider).toHaveAccessibilityValue({ min: 0, max: 100, now: 50 });
```

---

## Common Query Options

All text-based queries accept these options:

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `exact` | `boolean` | `true` | Require exact match (false = substring) |
| `normalizer` | `(text: string) => string` | default normalizer | Custom text normalization |
| `includeHiddenElements` | `boolean` | `false` | Include accessibility-hidden elements |

---

## getByRole()

### Description

The most recommended query method. Finds elements by their accessibility role. Encourages semantic, accessible component structure.

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
    value?: {
      min?: number;
      max?: number;
      now?: number;
      text?: string | RegExp;
    };
    includeHiddenElements?: boolean;
  }
): ReactTestInstance
```

### Role Options

| Option | Type | Description |
|--------|------|-------------|
| `name` | `TextMatch` | Filter by accessible name |
| `disabled` | `boolean` | Filter by disabled state |
| `selected` | `boolean` | Filter by selected state |
| `checked` | `boolean \| 'mixed'` | Filter by checked state |
| `busy` | `boolean` | Filter by busy state |
| `expanded` | `boolean` | Filter by expanded state |
| `value` | `object` | Filter by accessibility value (`min`, `max`, `now`, `text`) |

### Code Examples

#### Find Button by Role

```typescript
import { render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

test('find button by role', () => {
  render(
    <Pressable accessibilityRole="button">
      <Text>Submit</Text>
    </Pressable>,
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
    </View>,
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
    </View>,
  );

  const unchecked = screen.getByRole('checkbox', { checked: false });
  const checked = screen.getByRole('checkbox', { checked: true });

  expect(unchecked).toBeOnTheScreen();
  expect(checked).toBeOnTheScreen();
});
```

#### Find Slider with Value

```typescript
test('find slider by role and value', () => {
  render(
    <View
      accessibilityRole="adjustable"
      accessibilityValue={{ min: 0, max: 100, now: 50 }}
    />,
  );

  const slider = screen.getByRole('adjustable', {
    value: { now: 50 },
  });

  expect(slider).toBeOnTheScreen();
});
```

---

## getByLabelText()

### Description

Finds form elements by their label. Looks for `accessibilityLabel`, `aria-label`, or elements referenced by `aria-labelledby`/`accessibilityLabelledBy`.

### Signature

```typescript
function getByLabelText(
  labelText: TextMatch,
  options?: {
    exact?: boolean;
    normalizer?: (text: string) => string;
    includeHiddenElements?: boolean;
  }
): ReactTestInstance
```

### Code Examples

```typescript
test('find input by accessibility label', () => {
  render(
    <View>
      <TextInput accessibilityLabel="Username" placeholder="Enter username" />
      <TextInput accessibilityLabel="Password" secureTextEntry />
    </View>,
  );

  const usernameInput = screen.getByLabelText('Username');
  const passwordInput = screen.getByLabelText('Password');

  expect(usernameInput).toBeOnTheScreen();
  expect(passwordInput).toBeOnTheScreen();
});

// Case-insensitive match
test('label text with regex', () => {
  render(<TextInput accessibilityLabel="Email Address" />);

  const input = screen.getByLabelText(/email/i);
  expect(input).toBeOnTheScreen();
});
```

---

## getByText()

### Description

Finds elements by their text content. Joins `<Text>` siblings to find matches.

### Code Examples

```typescript
test('find element by exact text', () => {
  render(
    <View>
      <Text>Hello World</Text>
    </View>,
  );

  const element = screen.getByText('Hello World');
  expect(element).toBeOnTheScreen();
});

test('find element by regex', () => {
  render(<Text>Welcome to React Native</Text>);

  const element = screen.getByText(/react/i);
  expect(element).toBeOnTheScreen();
});

// Substring match
test('partial text match', () => {
  render(<Text>Hello World</Text>);

  const element = screen.getByText('Hello', { exact: false });
  expect(element).toBeOnTheScreen();
});
```

---

## getByPlaceholderText()

### Description

Finds TextInput elements by their placeholder text.

```typescript
test('find input by placeholder text', () => {
  render(
    <View>
      <TextInput placeholder="Enter your email" />
      <TextInput placeholder="Enter your password" secureTextEntry />
    </View>,
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

Finds TextInput elements by their current display value.

```typescript
test('find input by display value', () => {
  render(
    <TextInput value="alice@example.com" editable={false} />,
  );

  const emailDisplay = screen.getByDisplayValue('alice@example.com');
  expect(emailDisplay).toBeOnTheScreen();
});
```

---

## getByHintText()

### Description

Finds elements by `accessibilityHint` prop. Aliases: `ByA11yHint`, `ByAccessibilityHint`.

```typescript
test('find element by hint text', () => {
  render(
    <Pressable
      accessibilityRole="button"
      accessibilityHint="Navigates to the home screen"
    >
      <Text>Home</Text>
    </Pressable>,
  );

  const button = screen.getByHintText('Navigates to the home screen');
  expect(button).toBeOnTheScreen();
});
```

---

## getByTestId()

### Description

Finds elements by their `testID` prop. Not semantic but guaranteed unique. Use as last resort.

```typescript
test('find element by testID', () => {
  render(
    <View testID="unique-container">
      <Text>Content</Text>
    </View>,
  );

  const container = screen.getByTestId('unique-container');
  expect(container).toBeOnTheScreen();
});

test('find with testID pattern', () => {
  render(
    <View>
      <View testID="user-card-1" />
      <View testID="user-card-2" />
      <View testID="user-card-3" />
    </View>,
  );

  const cards = screen.getAllByTestId(/user-card/);
  expect(cards).toHaveLength(3);
});
```

---

## Query Selection Strategy

### Priority Order (Recommended)

1. **getByRole()** - Most semantic, accessible. First choice
2. **getByLabelText()** - Semantic for form inputs. Second choice
3. **getByPlaceholderText()** - Form inputs without labels. Third choice
4. **getByText()** - Generic content. Fourth choice
5. **getByHintText()** - Accessibility hint. Fifth choice
6. **getByTestId()** - Last resort, implementation detail

### Decision Tree

```
Is it a button/checkbox/radio/switch/slider?
  -> YES: Use getByRole('button', { name: 'Label' })

Is it a form input with label?
  -> YES: Use getByLabelText('Label text')

Is it a TextInput with placeholder?
  -> YES: Use getByPlaceholderText('Placeholder')

Is it a Text element?
  -> YES: Use getByText('Text content')

Has an accessibilityHint?
  -> YES: Use getByHintText('Hint text')

No semantic identifier available?
  -> Use getByTestId('unique-id') as fallback
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
getByHintText('Hint')            // Accessibility hint
getByTestId('submit-btn')        // Last resort

// Multiple elements
getAllByRole('button')
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

**Next:** [User Interactions](./04-user-interactions.md)

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/queries
