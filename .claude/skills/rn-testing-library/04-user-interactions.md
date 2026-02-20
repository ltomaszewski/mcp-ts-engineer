# User Interactions - React Native Testing Library

**Document URL:** https://oss.callstack.com/react-native-testing-library/docs/api/user-event

**Version:** 13.3.3

---

## userEvent API (Recommended)

### Overview

**Recommended approach (v12.2+).** The `userEvent` API simulates realistic user interactions by dispatching multiple events in sequence. More reliable and maintainable than fireEvent.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/user-event](https://oss.callstack.com/react-native-testing-library/docs/api/user-event)

### Initialization

```typescript
import { userEvent } from '@testing-library/react-native';

test('setup user event instance', async () => {
  const user = userEvent.setup();
  
  render(<MyComponent />);
  
  // Use user instance in test
});
```

---

## userEvent Methods

### press()

Simulates pressing a pressable element (button, link, custom pressable).

#### Signature

```typescript
async function press(element: ReactTestInstance): Promise<void>
```

#### Code Examples

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

test('press a button', async () => {
  const handlePress = jest.fn();
  const user = userEvent.setup();
  
  render(
    <Pressable onPress={handlePress}>
      <Text>Click Me</Text>
    </Pressable>
  );
  
  const button = screen.getByRole('button', { name: 'Click Me' });
  await user.press(button);
  
  expect(handlePress).toHaveBeenCalledTimes(1);
});
```

#### Multiple Presses

```typescript
test('multiple presses on same element', async () => {
  const handlePress = jest.fn();
  const user = userEvent.setup();
  
  render(
    <Pressable onPress={handlePress}>
      <Text>Counter Button</Text>
    </Pressable>
  );
  
  const button = screen.getByRole('button');
  
  await user.press(button);
  await user.press(button);
  await user.press(button);
  
  expect(handlePress).toHaveBeenCalledTimes(3);
});
```

---

### type()

Simulates text input into a TextInput element. Dispatches events for each character.

#### Signature

```typescript
async function type(
  element: ReactTestInstance,
  text: string,
  options?: TypeOptions
): Promise<void>
```

#### Code Examples

```typescript
test('type text into input', async () => {
  const handleChange = jest.fn();
  const user = userEvent.setup();
  
  render(
    <TextInput
      placeholder="Enter name"
      onChangeText={handleChange}
    />
  );
  
  const input = screen.getByPlaceholderText('Enter name');
  await user.type(input, 'Alice');
  
  expect(handleChange).toHaveBeenCalledWith('Alice');
});
```

#### Type with Delay

```typescript
test('type with delay between characters', async () => {
  const user = userEvent.setup({ delay: 50 });
  
  render(
    <TextInput placeholder="Enter text" />
  );
  
  const input = screen.getByPlaceholderText('Enter text');
  
  const startTime = Date.now();
  await user.type(input, 'Hello');
  const elapsed = Date.now() - startTime;
  
  expect(elapsed).toBeGreaterThanOrEqual(200);
});
```

---

### selectValue()

Simulates selecting an option in a Picker component.

#### Signature

```typescript
async function selectValue(
  element: ReactTestInstance,
  value: string | number
): Promise<void>
```

#### Code Examples

```typescript
test('select value from picker', async () => {
  const handleValueChange = jest.fn();
  const user = userEvent.setup();
  
  render(
    <Picker onValueChange={handleValueChange}>
      <Picker.Item label="Option 1" value={1} />
      <Picker.Item label="Option 2" value={2} />
      <Picker.Item label="Option 3" value={3} />
    </Picker>
  );
  
  const picker = screen.getByRole('combobox');
  await user.selectValue(picker, 2);
  
  expect(handleValueChange).toHaveBeenCalledWith(2);
});
```

---

## fireEvent API (Legacy)

### Overview

**Legacy approach.** Direct event firing without realistic event sequences. Still supported but `userEvent` recommended for new tests.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/fire-event](https://oss.callstack.com/react-native-testing-library/docs/api/fire-event)

### fireEvent.press()

```typescript
test('fireEvent.press (legacy)', () => {
  const handlePress = jest.fn();
  
  render(
    <Pressable onPress={handlePress}>
      <Text>Button</Text>
    </Pressable>
  );
  
  fireEvent.press(screen.getByText('Button'));
  
  expect(handlePress).toHaveBeenCalled();
});
```

### fireEvent.changeText()

```typescript
test('fireEvent.changeText (legacy)', () => {
  const handleChangeText = jest.fn();
  
  render(
    <TextInput onChangeText={handleChangeText} />
  );
  
  fireEvent.changeText(
    screen.getByRole('textbox'),
    'typed text'
  );
  
  expect(handleChangeText).toHaveBeenCalledWith('typed text');
});
```

---

## Complete Form Submission

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';

test('submit form with user interactions', async () => {
  const handleSubmit = jest.fn();
  const user = userEvent.setup();
  
  render(
    <View>
      <TextInput
        placeholder="Email"
        accessibilityLabel="Email Input"
      />
      <TextInput
        placeholder="Password"
        accessibilityLabel="Password Input"
        secureTextEntry
      />
      <Pressable onPress={handleSubmit}>
        <Text>Submit</Text>
      </Pressable>
    </View>
  );
  
  const emailInput = screen.getByLabelText('Email Input');
  const passwordInput = screen.getByLabelText('Password Input');
  const submitButton = screen.getByRole('button', { name: 'Submit' });
  
  await user.type(emailInput, 'user@example.com');
  await user.type(passwordInput, 'SecurePass123');
  await user.press(submitButton);
  
  expect(handleSubmit).toHaveBeenCalledTimes(1);
});
```

---

## Best Practices

### ✅ DO

```typescript
// Use userEvent for realistic interactions
const user = userEvent.setup();
await user.press(button);
await user.type(input, 'text');

// Async/await for proper sequencing
await user.press(elem1);
await user.press(elem2);

// Query semantically
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')

// Test user behavior, not implementation
expect(onSubmit).toHaveBeenCalled()
```

### ❌ DON'T

```typescript
// Don't use fireEvent for new tests
fireEvent.press(button);
fireEvent.changeText(input, 'text');

// Don't mix async and sync
user.press(button);  // Missing await
fireEvent.press(button2); // Don't mix APIs

// Don't query by testID first
screen.getByTestId('submit-btn')  // Use role instead

// Don't test implementation
expect(component.state.clicked).toBe(true)  // Test behavior instead
```

---

**Next:** [Async Testing & Waiting →](./05-async-testing.md)
