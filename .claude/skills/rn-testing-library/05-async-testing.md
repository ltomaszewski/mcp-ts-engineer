# Async Testing & Waiting - React Native Testing Library

**Document URL:** https://oss.callstack.com/react-native-testing-library/docs/api/waitfor

**Version:** 13.3.3

---

## Async Queries (findBy*)

### Overview

The `findBy*` and `findAllBy*` query variants are async, wait for elements, and throw on timeout.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/queries#findby](https://oss.callstack.com/react-native-testing-library/docs/api/queries#findby)

### Signature

```typescript
async function findByX(
  ...args: any[],
  options?: {
    timeout?: number;
    interval?: number;
  }
): Promise<ReactTestInstance>

async function findAllByX(
  ...args: any[],
  options?: {
    timeout?: number;
    interval?: number;
  }
): Promise<ReactTestInstance[]>
```

### Code Examples

#### Basic findBy() Usage

```typescript
test('find element that appears asynchronously', async () => {
  render(<DataLoader />);
  
  // Waits up to 1000ms for element to appear
  const element = await screen.findByText('Data Loaded');
  
  expect(element).toBeOnTheScreen();
});
```

#### With Custom Timeout

```typescript
test('find element with custom timeout', async () => {
  render(<SlowDataLoader />);
  
  // Wait up to 5 seconds for element
  const element = await screen.findByText(
    'Data Loaded',
    {},
    { timeout: 5000 }
  );
  
  expect(element).toBeOnTheScreen();
});
```

#### findAllBy() for Multiple Elements

```typescript
test('find multiple elements', async () => {
  render(<ListLoader />);
  
  // Wait for list items to appear
  const items = await screen.findAllByText(/Item \d+/);
  
  expect(items).toHaveLength(5);
});
```

#### Sequential Async Queries

```typescript
test('sequential async queries', async () => {
  render(
    <List items={[
      { id: 1, title: 'Item 1' },
      { id: 2, title: 'Item 2' },
    ]} />
  );
  
  // Wait for first item
  const firstItem = await screen.findByText('Item 1');
  expect(firstItem).toBeOnTheScreen();
  
  // Second item should also be available
  const secondItem = screen.getByText('Item 2');
  expect(secondItem).toBeOnTheScreen();
});
```

---

## waitFor() Function

### Overview

Waits for a condition (callback) to be true. More flexible than `findBy*` for complex async scenarios.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/waitfor](https://oss.callstack.com/react-native-testing-library/docs/api/waitfor)

### Signature

```typescript
async function waitFor<T>(
  callback: () => T,
  options?: {
    timeout?: number;
    interval?: number;
    onTimeout?: () => void;
  }
): Promise<T>
```

### Code Examples

#### Basic waitFor() Usage

```typescript
test('wait for async state update', async () => {
  render(<AsyncCounter />);
  
  const button = screen.getByRole('button', { name: 'Increment' });
  fireEvent.press(button);
  
  // Wait for count to update
  await waitFor(() => {
    expect(screen.getByText('Count: 1')).toBeOnTheScreen();
  });
});
```

#### Waiting for Mock to Be Called

```typescript
test('wait for callback invocation', async () => {
  const handleComplete = jest.fn();
  
  render(<AsyncTask onComplete={handleComplete} />);
  
  await waitFor(() => {
    expect(handleComplete).toHaveBeenCalled();
  });
});
```

#### Custom Timeout

```typescript
test('wait with extended timeout', async () => {
  render(<SlowDataFetcher />);
  
  // Wait up to 10 seconds
  await waitFor(
    () => {
      expect(screen.getByText('Data loaded')).toBeOnTheScreen();
    },
    { timeout: 10000 }
  );
});
```

#### Complex Condition Waiting

```typescript
test('wait for complex async condition', async () => {
  render(<DataFetcher />);
  
  await waitFor(() => {
    const items = screen.queryAllByText(/Item/);
    const errorElement = screen.queryByText(/Error/);
    
    expect(items.length).toBeGreaterThan(0);
    expect(errorElement).not.toBeOnTheScreen();
  });
});
```

---

## waitForElementToBeRemoved()

### Overview

Waits for an element to be removed from the DOM. Useful for testing disappearing toasts, modals, or conditional renders being unmounted.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/waitfor-element-to-be-removed](https://oss.callstack.com/react-native-testing-library/docs/api/waitfor-element-to-be-removed)

### Signature

```typescript
async function waitForElementToBeRemoved<T extends Element | Function>(
  element: T | (() => T),
  options?: {
    timeout?: number;
    interval?: number;
  }
): Promise<void>
```

### Code Examples

#### Wait for Toast Disappearance

```typescript
test('wait for toast to disappear', async () => {
  render(
    <ToastNotification
      message="Success!"
      duration={2000}
      autoHide={true}
    />
  );
  
  const toast = screen.getByRole('alert');
  expect(toast).toBeOnTheScreen();
  
  // Wait for toast to be removed after 2 seconds
  await waitForElementToBeRemoved(toast);
  
  expect(screen.queryByRole('alert')).not.toBeOnTheScreen();
});
```

#### Wait for Modal to Close

```typescript
test('wait for modal removal', async () => {
  const user = userEvent.setup();
  
  render(
    <ConfirmDialog
      title="Delete Item?"
      onConfirm={() => {}}
      visible={true}
    />
  );
  
  const modal = screen.getByRole('dialog');
  expect(modal).toBeOnTheScreen();
  
  // Click close button
  await user.press(screen.getByRole('button', { name: 'Cancel' }));
  
  // Wait for modal removal
  await waitForElementToBeRemoved(modal);
  
  expect(screen.queryByRole('dialog')).not.toBeOnTheScreen();
});
```

---

## Understanding Timeouts

### Default Timeouts

| Function | Default Timeout | Configurable |
|----------|-----------------|--------------|
| `findBy*` | 1000ms | Yes |
| `waitFor()` | 1000ms | Yes |
| `waitForElementToBeRemoved()` | 1000ms | Yes |

### Timeout Management

```typescript
import { configure } from '@testing-library/react-native';

// Set global default timeout for all async queries
configure({ asyncUtilTimeout: 3000 });

test('uses global timeout setting', async () => {
  // Now all findBy* and waitFor use 3000ms timeout
  const element = await screen.findByText('Text');
});

// Override for specific query
test('override timeout for specific query', async () => {
  const element = await screen.findByText(
    'Slow Element',
    {},
    { timeout: 5000 }
  );
});
```

---

## Async Testing Patterns

### Wait for Data Load

```typescript
test('component loads and displays data', async () => {
  render(<UserProfile userId={123} />);
  
  // Show loading state first
  expect(screen.getByText('Loading...')).toBeOnTheScreen();
  
  // Wait for data to load and display
  const userName = await screen.findByText('John Doe');
  expect(userName).toBeOnTheScreen();
  
  // Loading should be gone
  expect(screen.queryByText('Loading...')).not.toBeOnTheScreen();
});
```

### User Action Triggers Async

```typescript
test('button click triggers async operation', async () => {
  const user = userEvent.setup();
  
  render(<FormWithAsync />);
  
  // Fill form
  await user.type(screen.getByLabelText('Name'), 'Alice');
  
  // Submit
  const submitBtn = screen.getByRole('button', { name: 'Submit' });
  await user.press(submitBtn);
  
  // Wait for success message
  const successMsg = await screen.findByText('Submitted successfully');
  expect(successMsg).toBeOnTheScreen();
});
```

---

## Debugging Async Issues

### Timeout Errors

```typescript
test('debug timeout issue', async () => {
  render(<Component />);
  
  try {
    await screen.findByText('Never appears', {}, {
      timeout: 1000,
      onTimeout: () => {
        screen.debug(); // See what actually rendered
      }
    });
  } catch (error) {
    console.log('Element search failed');
  }
});
```

### Best Practices

```typescript
test('debugging async issues', async () => {
  render(<ComplexComponent />);
  
  // 1. Check initial state
  screen.debug({ message: 'Initial render' });
  
  // 2. Trigger action
  const user = userEvent.setup();
  await user.press(screen.getByRole('button'));
  
  // 3. Wait with debug callback
  try {
    await screen.findByText('Expected Text', {}, {
      timeout: 2000,
      onTimeout: () => {
        screen.debug({ message: 'Timeout debug' });
      }
    });
  } catch (error) {
    console.error('Element not found:', error.message);
  }
});
```

---

**Next:** [Hook Testing →](./06-hook-testing.md)
