# Advanced Patterns & Best Practices - React Native Testing Library

**Source:** https://oss.callstack.com/react-native-testing-library/docs/guides

**Version:** 13.3.x

---

## Testing with Providers

### Context Provider Testing

```typescript
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';

test('component with theme provider', () => {
  render(
    <ThemeProvider initialTheme="dark">
      <MyComponent />
    </ThemeProvider>,
  );

  expect(screen.getByText(/dark mode/i)).toBeOnTheScreen();
});
```

### Redux Provider Testing

```typescript
import { render, screen } from '@testing-library/react-native';
import { Provider } from 'react-redux';
import { createStore } from 'redux';

test('component with redux', () => {
  const store = createStore(() => ({ user: { name: 'Alice' } }));

  render(
    <Provider store={store}>
      <UserProfile />
    </Provider>,
  );

  expect(screen.getByText('Alice')).toBeOnTheScreen();
});
```

### Multiple Providers

```typescript
test('component with multiple providers', () => {
  render(
    <Provider store={store}>
      <ThemeProvider>
        <AuthProvider>
          <MyComponent />
        </AuthProvider>
      </ThemeProvider>
    </Provider>,
  );

  expect(screen.getByText('Content')).toBeOnTheScreen();
});
```

---

## Custom Render Function

### Creating Custom Render

```typescript
import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialTheme?: 'light' | 'dark';
}

function render(
  component: React.ReactElement<any>,
  { initialTheme = 'light', ...options }: CustomRenderOptions = {},
) {
  return rtlRender(component, {
    wrapper: ({ children }: { children: React.ReactNode }) => (
      <ThemeProvider initialTheme={initialTheme}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    ),
    ...options,
  });
}

export { render };
```

### Using Custom Render in Tests

```typescript
import { render } from './test-utils';
import { screen } from '@testing-library/react-native';

test('uses custom render with providers', () => {
  render(<MyComponent />, { initialTheme: 'dark' });

  expect(screen.getByText('Content')).toBeOnTheScreen();
});
```

### Custom Render with renderAsync (v13.3.0+)

```typescript
import {
  render as rtlRender,
  renderAsync as rtlRenderAsync,
  RenderOptions,
} from '@testing-library/react-native';

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>{children}</AuthProvider>
    </ThemeProvider>
  );
}

export function render(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRender(ui, { wrapper: AllProviders, ...options });
}

export async function renderAsync(ui: React.ReactElement, options?: Omit<RenderOptions, 'wrapper'>) {
  return rtlRenderAsync(ui, { wrapper: AllProviders, ...options });
}

export * from '@testing-library/react-native';
```

---

## Snapshot Testing

### Basic Snapshot Test

```typescript
import { render, screen } from '@testing-library/react-native';

test('snapshot test', () => {
  render(<MyComponent prop="value" />);

  expect(screen.toJSON()).toMatchSnapshot();
});
```

### Partial Snapshot Testing

```typescript
test('snapshot of specific element', () => {
  render(
    <View>
      <Header />
      <Content testID="main-content" />
      <Footer />
    </View>,
  );

  const content = screen.getByTestId('main-content');

  // Only snapshot the content, not header/footer
  expect(content).toMatchSnapshot();
});
```

---

## Testing Async Components

### Component with Data Loading

```typescript
test('async data loading', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]),
    }),
  );

  render(<DataList />);

  // Loading state appears first
  expect(screen.getByText('Loading...')).toBeOnTheScreen();

  // Wait for data to load
  const items = await screen.findAllByText(/Item/);
  expect(items).toHaveLength(2);

  // Loading state disappears
  expect(screen.queryByText('Loading...')).not.toBeOnTheScreen();
});
```

### Component with Error Handling

```typescript
// Test successful load
test('loads data successfully', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ content: 'Success' }),
    }),
  );

  render(<DataLoader url="/api/data" />);

  const content = await screen.findByText('Success');
  expect(content).toBeOnTheScreen();
});

// Test error handling
test('handles fetch error', async () => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('Network failed')),
  );

  render(<DataLoader url="/api/data" />);

  const error = await screen.findByText(/Network failed/);
  expect(error).toBeOnTheScreen();
});
```

### React 19 Suspense Components (v13.3.0+)

```typescript
import { renderAsync, screen } from '@testing-library/react-native';
import { Suspense } from 'react';

test('Suspense component with data', async () => {
  await renderAsync(
    <Suspense fallback={<Text>Loading...</Text>}>
      <SuspenseDataComponent />
    </Suspense>,
  );

  // Suspense has resolved, data is available
  expect(screen.getByText('Data loaded')).toBeOnTheScreen();
});
```

---

## Form Testing

### Simple Form Submission

```typescript
test('form submission', async () => {
  const handleSubmit = jest.fn();
  const user = userEvent.setup();

  render(<LoginForm onSubmit={handleSubmit} />);

  const emailInput = screen.getByPlaceholderText('Email');
  const passwordInput = screen.getByPlaceholderText('Password');
  const submitButton = screen.getByRole('button');

  // Fill form
  await user.type(emailInput, 'user@example.com');
  await user.type(passwordInput, 'password123');

  // Submit
  await user.press(submitButton);

  // Verify callback
  expect(handleSubmit).toHaveBeenCalledWith({
    email: 'user@example.com',
    password: 'password123',
  });
});
```

### Form Validation Testing

```typescript
test('form validation', async () => {
  const user = userEvent.setup();

  render(<RegistrationForm />);

  const emailInput = screen.getByLabelText('Email');
  const submitButton = screen.getByRole('button', { name: 'Register' });

  // Submit empty form
  await user.press(submitButton);

  // See validation error
  expect(screen.getByText(/Email is required/)).toBeOnTheScreen();

  // Fill with invalid email
  await user.type(emailInput, 'invalid-email');
  await user.press(submitButton);

  expect(screen.getByText(/Invalid email/)).toBeOnTheScreen();

  // Clear and fill with valid email
  await user.clear(emailInput);
  await user.type(emailInput, 'valid@example.com');
  await user.press(submitButton);

  // Error clears
  expect(screen.queryByText(/Invalid email/)).not.toBeOnTheScreen();
});
```

---

## Testing with Fake Timers

```typescript
test('debounced search', async () => {
  jest.useFakeTimers();
  const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

  render(<SearchInput />);

  await user.type(screen.getByLabelText('Search'), 'react');

  // Advance timer past debounce delay
  jest.advanceTimersByTime(500);

  await waitFor(() => {
    expect(screen.getByText('Results for: react')).toBeOnTheScreen();
  });

  jest.useRealTimers();
});
```

---

## Recommended Practices

### 1. Use screen Object (Not Destructured)

```typescript
// OLD
const { getByText, getByRole } = render(<Component />);

// NEW
render(<Component />);
const element = screen.getByText('text');
```

### 2. Use userEvent Over fireEvent

```typescript
// OLD
fireEvent.press(button);

// NEW
const user = userEvent.setup();
await user.press(button);
```

### 3. Prefer Semantic Queries

```typescript
// BEST
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')

// OK
screen.getByText('Submit')

// AVOID
screen.getByTestId('submit-button')
```

### 4. Test Behavior, Not Implementation

```typescript
// BAD
expect(component.state.isOpen).toBe(true);

// GOOD
expect(screen.getByText('Modal Content')).toBeOnTheScreen();
```

### 5. Keep Tests Isolated and Focused

```typescript
// BAD: Too much in one test
test('complete user flow', async () => {
  // Signup, Login, Browse, Purchase, Logout all in one test
});

// GOOD: Focused tests
test('signup form submits', async () => { /* ... */ });
test('login validates email', async () => { /* ... */ });
```

### 6. Use renderAsync for React 19 / Suspense

```typescript
// React 18 (sync)
render(<Component />);

// React 19 / Suspense (async)
await renderAsync(<SuspenseComponent />);
```

---

**Next:** [TypeScript Integration](./09-typescript.md)

**Source:** https://oss.callstack.com/react-native-testing-library/docs/guides
