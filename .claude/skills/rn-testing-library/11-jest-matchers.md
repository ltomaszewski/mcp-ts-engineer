# Built-in Jest Matchers - React Native Testing Library

Complete reference for all built-in Jest matchers available since v12.4+. No additional packages required.

**Version:** 13.x | **Source:** https://oss.callstack.com/react-native-testing-library/docs/api/jest-matchers

---

## Setup

Built-in matchers are automatically available when using `@testing-library/react-native` v12.4+. No import or configuration needed.

The deprecated `@testing-library/jest-native` package is no longer required. Remove it from your dependencies.

---

## Element Existence

### toBeOnTheScreen()

Asserts the element is attached to the element tree (rendered and not unmounted).

```typescript
import { render, screen } from '@testing-library/react-native';

test('element is rendered', () => {
  render(<Text>Hello</Text>);

  expect(screen.getByText('Hello')).toBeOnTheScreen();
});

test('element is not rendered', () => {
  render(<View />);

  expect(screen.queryByText('Hello')).not.toBeOnTheScreen();
});
```

---

## Visibility

### toBeVisible()

Asserts the element is visible to the user. Fails when:
- `display` is `'none'` on the element or any ancestor
- `opacity` is `0` on the element or any ancestor
- Element is hidden from accessibility (`accessibilityElementsHidden`, `importantForAccessibility: 'no-hide-descendants'`)

```typescript
test('element is visible', () => {
  render(<Text>Visible</Text>);

  expect(screen.getByText('Visible')).toBeVisible();
});

test('element is hidden with display none', () => {
  render(<Text style={{ display: 'none' }}>Hidden</Text>);

  expect(screen.getByText('Hidden')).not.toBeVisible();
});

test('element is hidden with opacity 0', () => {
  render(<Text style={{ opacity: 0 }}>Transparent</Text>);

  expect(screen.getByText('Transparent')).not.toBeVisible();
});
```

---

## Element State

### toBeEnabled() / toBeDisabled()

Asserts the element is enabled or disabled based on `aria-disabled` or `accessibilityState.disabled`.

```typescript
import { render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

test('button is enabled', () => {
  render(
    <Pressable accessibilityRole="button">
      <Text>Submit</Text>
    </Pressable>,
  );

  expect(screen.getByRole('button')).toBeEnabled();
});

test('button is disabled', () => {
  render(
    <Pressable accessibilityRole="button" aria-disabled={true}>
      <Text>Submit</Text>
    </Pressable>,
  );

  expect(screen.getByRole('button')).toBeDisabled();
});
```

### toBeSelected()

Asserts the element is selected based on `aria-selected` or `accessibilityState.selected`.

```typescript
test('tab is selected', () => {
  render(
    <Pressable accessibilityRole="tab" aria-selected={true}>
      <Text>Home</Text>
    </Pressable>,
  );

  expect(screen.getByRole('tab')).toBeSelected();
});
```

### toBeChecked() / toBePartiallyChecked()

Asserts the element is checked or partially checked based on `aria-checked` or `accessibilityState.checked`.

```typescript
test('checkbox is checked', () => {
  render(
    <Pressable accessibilityRole="checkbox" aria-checked={true}>
      <Text>Accept terms</Text>
    </Pressable>,
  );

  expect(screen.getByRole('checkbox')).toBeChecked();
});

test('checkbox is partially checked', () => {
  render(
    <Pressable accessibilityRole="checkbox" aria-checked="mixed">
      <Text>Select all</Text>
    </Pressable>,
  );

  expect(screen.getByRole('checkbox')).toBePartiallyChecked();
});
```

### toBeExpanded() / toBeCollapsed()

Asserts the element is expanded or collapsed based on `aria-expanded` or `accessibilityState.expanded`.

```typescript
test('accordion is expanded', () => {
  render(
    <Pressable aria-expanded={true}>
      <Text>Section Details</Text>
    </Pressable>,
  );

  expect(screen.getByText('Section Details')).toBeExpanded();
});

test('accordion is collapsed', () => {
  render(
    <Pressable aria-expanded={false}>
      <Text>Section Details</Text>
    </Pressable>,
  );

  expect(screen.getByText('Section Details')).toBeCollapsed();
});
```

### toBeBusy()

Asserts the element is in a busy state based on `aria-busy` or `accessibilityState.busy`.

```typescript
test('loading indicator is busy', () => {
  render(
    <View aria-busy={true} accessibilityRole="progressbar">
      <Text>Loading...</Text>
    </View>,
  );

  expect(screen.getByRole('progressbar')).toBeBusy();
});
```

---

## Text Content

### toHaveTextContent()

Asserts the element has the specified text content. Accepts string or RegExp.

```typescript
import { render, screen } from '@testing-library/react-native';
import { Text, View } from 'react-native';

test('element has text content', () => {
  render(<Text>Hello World</Text>);

  expect(screen.getByText('Hello World')).toHaveTextContent('Hello World');
  expect(screen.getByText('Hello World')).toHaveTextContent(/Hello/);
});

test('element has nested text content', () => {
  render(
    <Text>
      Hello <Text>World</Text>
    </Text>,
  );

  // toHaveTextContent concatenates all nested text
  expect(screen.getByText(/Hello/)).toHaveTextContent('Hello World');
});

// Options
expect(element).toHaveTextContent('Hello', { exact: false }); // substring match
expect(element).toHaveTextContent('hello', { normalizer: (s) => s.toLowerCase() });
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `text` | string \| RegExp | Expected text content |
| `options.exact` | boolean | Require exact match (default: `true`) |
| `options.normalizer` | function | Custom text normalizer |

---

## Input Values

### toHaveDisplayValue()

Asserts a TextInput has the specified display value.

```typescript
import { render, screen } from '@testing-library/react-native';
import { TextInput } from 'react-native';

test('input has display value', () => {
  render(
    <TextInput value="test@example.com" accessibilityLabel="Email" />,
  );

  expect(screen.getByLabelText('Email')).toHaveDisplayValue('test@example.com');
  expect(screen.getByLabelText('Email')).toHaveDisplayValue(/example/);
});
```

### toHaveAccessibilityValue()

Asserts the element has specified accessibility value properties.

```typescript
test('slider has accessibility value', () => {
  render(
    <View
      accessibilityRole="adjustable"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={50}
      aria-valuetext="50%"
    />,
  );

  const slider = screen.getByRole('adjustable');

  expect(slider).toHaveAccessibilityValue({ min: 0, max: 100, now: 50 });
  expect(slider).toHaveAccessibilityValue({ text: '50%' });
  expect(slider).toHaveAccessibilityValue({ now: 50 });
});
```

| Property | Type | Description |
|----------|------|-------------|
| `min` | number | Minimum value |
| `max` | number | Maximum value |
| `now` | number | Current value |
| `text` | string \| RegExp | Text description of value |

---

## Style and Props

### toHaveStyle()

Asserts the element has specific style properties.

```typescript
import { render, screen } from '@testing-library/react-native';
import { View } from 'react-native';

test('element has styles', () => {
  render(
    <View
      testID="box"
      style={{ backgroundColor: 'red', width: 100, height: 100 }}
    />,
  );

  expect(screen.getByTestId('box')).toHaveStyle({
    backgroundColor: 'red',
    width: 100,
  });
});

test('element does not have style', () => {
  render(<View testID="box" style={{ backgroundColor: 'blue' }} />);

  expect(screen.getByTestId('box')).not.toHaveStyle({
    backgroundColor: 'red',
  });
});
```

### toHaveProp()

Asserts the element has a specific prop. Use as a last resort -- prefer semantic matchers.

```typescript
import { render, screen } from '@testing-library/react-native';
import { TextInput } from 'react-native';

test('input has prop', () => {
  render(
    <TextInput
      placeholder="Enter email"
      secureTextEntry={true}
      accessibilityLabel="Email"
    />,
  );

  const input = screen.getByLabelText('Email');

  // Check prop exists
  expect(input).toHaveProp('placeholder');

  // Check prop value
  expect(input).toHaveProp('placeholder', 'Enter email');
  expect(input).toHaveProp('secureTextEntry', true);
});
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | string | Prop name to check |
| `value` | any | Optional: expected prop value |

---

## Container Assertions

### toContainElement()

Asserts a container element contains another element.

```typescript
import { render, screen } from '@testing-library/react-native';
import { View, Text } from 'react-native';

test('container contains child element', () => {
  render(
    <View testID="container">
      <Text>Child</Text>
    </View>,
  );

  const container = screen.getByTestId('container');
  const child = screen.getByText('Child');

  expect(container).toContainElement(child);
});
```

### toBeEmptyElement()

Asserts the element has no children or text content.

```typescript
test('element is empty', () => {
  render(<View testID="empty" />);

  expect(screen.getByTestId('empty')).toBeEmptyElement();
});

test('element is not empty', () => {
  render(
    <View testID="parent">
      <Text>Child</Text>
    </View>,
  );

  expect(screen.getByTestId('parent')).not.toBeEmptyElement();
});
```

---

## Accessibility

### toHaveAccessibleName()

Asserts the element has the specified accessible name (derived from label-related props).

```typescript
import { render, screen } from '@testing-library/react-native';
import { Pressable, Text } from 'react-native';

test('button has accessible name', () => {
  render(
    <Pressable accessibilityRole="button" accessibilityLabel="Submit form">
      <Text>Submit</Text>
    </Pressable>,
  );

  expect(screen.getByRole('button')).toHaveAccessibleName('Submit form');
  expect(screen.getByRole('button')).toHaveAccessibleName(/Submit/);
});
```

---

## Matcher Summary

| Matcher | Asserts | Related Props |
|---------|---------|---------------|
| `toBeOnTheScreen()` | Element is in the tree | -- |
| `toBeVisible()` | Element is visible | `display`, `opacity`, accessibility hidden |
| `toBeEnabled()` | Element is enabled | `aria-disabled`, `accessibilityState.disabled` |
| `toBeDisabled()` | Element is disabled | `aria-disabled`, `accessibilityState.disabled` |
| `toBeSelected()` | Element is selected | `aria-selected`, `accessibilityState.selected` |
| `toBeChecked()` | Element is checked | `aria-checked`, `accessibilityState.checked` |
| `toBePartiallyChecked()` | Checkbox is mixed | `aria-checked="mixed"` |
| `toBeExpanded()` | Element is expanded | `aria-expanded` |
| `toBeCollapsed()` | Element is collapsed | `aria-expanded={false}` |
| `toBeBusy()` | Element is busy | `aria-busy`, `accessibilityState.busy` |
| `toHaveTextContent()` | Has text content | Text children |
| `toHaveDisplayValue()` | TextInput value | `value`, `defaultValue` |
| `toHaveAccessibilityValue()` | Accessibility value | `aria-valuemin/max/now/text` |
| `toHaveStyle()` | Has CSS styles | `style` prop |
| `toHaveProp()` | Has a prop (last resort) | Any prop |
| `toContainElement()` | Contains child | Parent-child relationship |
| `toBeEmptyElement()` | Has no children | -- |
| `toHaveAccessibleName()` | Has accessible name | `accessibilityLabel`, `aria-label` |

---

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/jest-matchers
