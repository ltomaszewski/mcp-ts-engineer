# User Interactions - React Native Testing Library

Complete reference for userEvent (recommended) and fireEvent (legacy) APIs.

**Version:** 13.x | **Source:** https://oss.callstack.com/react-native-testing-library/docs/api/events/user-event

---

## userEvent API (Recommended)

The `userEvent` API simulates realistic user interactions by dispatching multiple events in sequence. Preferred over `fireEvent` for all new tests since v12.2+.

### setup()

Creates a User Event instance.

```typescript
import { userEvent } from '@testing-library/react-native';

const user = userEvent.setup();

// With options
const user = userEvent.setup({
  delay: 50,                // ms between events (default: 0)
  advanceTimers: jest.advanceTimersByTime,  // for fake timers
});
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `delay` | number | 0 | Interval between subsequent events (ms) |
| `advanceTimers` | `(delay: number) => Promise<void> \| void` | auto-detected | Timer advancement function for fake timers |

---

## press()

Simulates pressing a pressable element. Fires the full event sequence: `pressIn` -> `pressOut` -> `press`.

```typescript
async function press(element: ReactTestInstance): Promise<void>
```

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

test('press button triggers handler', async () => {
  const handlePress = jest.fn();
  const user = userEvent.setup();

  render(
    <Pressable onPress={handlePress} accessibilityRole="button">
      <Text>Submit</Text>
    </Pressable>,
  );

  await user.press(screen.getByRole('button', { name: 'Submit' }));

  expect(handlePress).toHaveBeenCalledTimes(1);
});
```

**Note:** Minimum 130 ms execution time. Consider fake timers for faster tests.

---

## longPress()

Simulates an extended press. Fires `longPress` event when duration exceeds the threshold.

```typescript
async function longPress(
  element: ReactTestInstance,
  options?: { duration?: number },
): Promise<void>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | number | 500 | Press duration in milliseconds |

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

test('long press triggers context menu', async () => {
  const handleLongPress = jest.fn();
  const user = userEvent.setup();

  render(
    <Pressable onLongPress={handleLongPress} accessibilityRole="button">
      <Text>Hold Me</Text>
    </Pressable>,
  );

  await user.longPress(screen.getByRole('button', { name: 'Hold Me' }), {
    duration: 1000,
  });

  expect(handleLongPress).toHaveBeenCalledTimes(1);
});
```

---

## type()

Simulates text input character by character. Focuses the element, types each character, then blurs.

```typescript
async function type(
  element: ReactTestInstance,
  text: string,
  options?: {
    skipPress?: boolean;
    skipBlur?: boolean;
    submitEditing?: boolean;
  },
): Promise<void>
```

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `skipPress` | boolean | `false` | Skip initial pressIn/pressOut events |
| `skipBlur` | boolean | `false` | Skip endEditing/blur events after typing |
| `submitEditing` | boolean | `false` | Fire submitEditing event after typing |

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';
import { TextInput } from 'react-native';

test('type text into input', async () => {
  const handleChange = jest.fn();
  const user = userEvent.setup();

  render(
    <TextInput
      placeholder="Enter name"
      onChangeText={handleChange}
      accessibilityLabel="Name"
    />,
  );

  await user.type(screen.getByLabelText('Name'), 'Alice');

  expect(handleChange).toHaveBeenLastCalledWith('Alice');
});
```

### Type with Submit

```typescript
test('type and submit with enter key', async () => {
  const handleSubmit = jest.fn();
  const user = userEvent.setup();

  render(
    <TextInput
      placeholder="Search"
      onSubmitEditing={handleSubmit}
      accessibilityLabel="Search"
    />,
  );

  await user.type(screen.getByLabelText('Search'), 'query', {
    submitEditing: true,
  });

  expect(handleSubmit).toHaveBeenCalled();
});
```

### Type Appends to Existing Content

`type()` appends text to existing content in the TextInput. To replace content, call `clear()` first.

```typescript
test('type appends to existing text', async () => {
  const user = userEvent.setup();

  render(
    <TextInput defaultValue="Hello" accessibilityLabel="Greeting" />,
  );

  const input = screen.getByLabelText('Greeting');
  await user.type(input, ' World');

  expect(input).toHaveDisplayValue('Hello World');
});
```

---

## clear()

Simulates clearing all text content from a TextInput.

```typescript
async function clear(element: ReactTestInstance): Promise<void>
```

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';
import { TextInput } from 'react-native';

test('clear input content', async () => {
  const handleChange = jest.fn();
  const user = userEvent.setup();

  render(
    <TextInput
      defaultValue="existing text"
      onChangeText={handleChange}
      accessibilityLabel="Input"
    />,
  );

  const input = screen.getByLabelText('Input');
  expect(input).toHaveDisplayValue('existing text');

  await user.clear(input);

  expect(input).toHaveDisplayValue('');
  expect(handleChange).toHaveBeenLastCalledWith('');
});
```

### Clear Then Type (Replace Content)

```typescript
test('replace input content', async () => {
  const user = userEvent.setup();

  render(
    <TextInput defaultValue="old value" accessibilityLabel="Field" />,
  );

  const input = screen.getByLabelText('Field');

  await user.clear(input);
  await user.type(input, 'new value');

  expect(input).toHaveDisplayValue('new value');
});
```

---

## paste()

Simulates pasting text into a TextInput element.

```typescript
async function paste(
  element: ReactTestInstance,
  text: string,
): Promise<void>
```

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';
import { TextInput } from 'react-native';

test('paste text into input', async () => {
  const handleChange = jest.fn();
  const user = userEvent.setup();

  render(
    <TextInput
      placeholder="Paste here"
      onChangeText={handleChange}
      accessibilityLabel="Paste input"
    />,
  );

  await user.paste(screen.getByLabelText('Paste input'), 'pasted content');

  expect(handleChange).toHaveBeenCalledWith('pasted content');
});
```

---

## scrollTo()

Simulates scrolling a ScrollView or FlatList component. Supports vertical and horizontal scrolling with optional momentum.

```typescript
async function scrollTo(
  element: ReactTestInstance,
  options: ScrollToOptions,
): Promise<void>

// Vertical scroll options
type ScrollToOptions = {
  y: number;
  momentumY?: number;
  contentSize?: { width: number; height: number };
  layoutMeasurement?: { width: number; height: number };
};

// Horizontal scroll options
type ScrollToOptions = {
  x: number;
  momentumX?: number;
  contentSize?: { width: number; height: number };
  layoutMeasurement?: { width: number; height: number };
};
```

| Option | Type | Description |
|--------|------|-------------|
| `y` / `x` | number | Drag scroll offset (vertical or horizontal) |
| `momentumY` / `momentumX` | number | Optional inertial movement after drag |
| `contentSize` | `{ width, height }` | Total scrollable content size (enables FlatList `onEndReached`) |
| `layoutMeasurement` | `{ width, height }` | Viewport dimensions (enables FlatList `onEndReached`) |

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';
import { FlatList, Text } from 'react-native';

test('scroll triggers onEndReached', async () => {
  const handleEndReached = jest.fn();
  const user = userEvent.setup();

  render(
    <FlatList
      data={Array.from({ length: 20 }, (_, i) => ({ key: String(i) }))}
      renderItem={({ item }) => <Text>{item.key}</Text>}
      onEndReached={handleEndReached}
      accessibilityRole="list"
    />,
  );

  await user.scrollTo(screen.getByRole('list'), {
    y: 500,
    contentSize: { width: 400, height: 2000 },
    layoutMeasurement: { width: 400, height: 800 },
  });

  expect(handleEndReached).toHaveBeenCalled();
});
```

### Horizontal Scroll

```typescript
test('horizontal scroll in carousel', async () => {
  const user = userEvent.setup();

  render(
    <ScrollView horizontal accessibilityRole="scrollbar">
      <Text>Slide 1</Text>
      <Text>Slide 2</Text>
      <Text>Slide 3</Text>
    </ScrollView>,
  );

  await user.scrollTo(screen.getByRole('scrollbar'), { x: 300 });
});
```

### Scroll with Momentum

```typescript
test('scroll with momentum for pull-to-refresh', async () => {
  const user = userEvent.setup();

  render(<ItemList />);

  await user.scrollTo(screen.getByRole('list'), {
    y: 500,
    momentumY: 200,
  });
});
```

---

## fireEvent API (Legacy)

Direct event firing without realistic event sequences. Still supported but `userEvent` is recommended for all new tests.

### fireEvent.press()

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';

test('fireEvent.press (legacy)', () => {
  const handlePress = jest.fn();

  render(
    <Pressable onPress={handlePress}>
      <Text>Button</Text>
    </Pressable>,
  );

  fireEvent.press(screen.getByText('Button'));

  expect(handlePress).toHaveBeenCalled();
});
```

### fireEvent.changeText()

```typescript
test('fireEvent.changeText (legacy)', () => {
  const handleChange = jest.fn();

  render(<TextInput onChangeText={handleChange} />);

  fireEvent.changeText(screen.getByRole('textbox'), 'typed text');

  expect(handleChange).toHaveBeenCalledWith('typed text');
});
```

### fireEvent() (Custom Events)

```typescript
// Fire a custom event
fireEvent(element, 'onLayout', { nativeEvent: { layout: { width: 100 } } });
fireEvent.scroll(scrollView, { nativeEvent: { contentOffset: { y: 200 } } });
```

---

## userEvent vs fireEvent

| Feature | userEvent | fireEvent |
|---------|-----------|-----------|
| Event sequence | Full realistic sequence | Single event dispatch |
| Async | Always async (`await`) | Synchronous |
| Character-by-character typing | Yes (`type()`) | No (full string at once) |
| Focus management | Automatic | Manual |
| Recommended for | All new tests | Legacy code, custom events |

---

## Best Practices

**DO:**
- Use `userEvent.setup()` before rendering
- Await every userEvent call
- Query by accessibility role/label first
- Use `clear()` then `type()` to replace input content

**DO NOT:**
- Mix `userEvent` and `fireEvent` in the same test
- Forget `await` on userEvent methods (causes act warnings)
- Use `fireEvent` for new tests (use `userEvent`)
- Use `fireEvent.changeText()` when `user.type()` is available

---

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/events/user-event
