# Advanced Patterns & Best Practices - React Native Testing Library

**Document URL:** https://oss.callstack.com/react-native-testing-library/docs/advanced

**Version:** 13.3.3

---

## Testing with Providers

### Context Provider Testing

```typescript
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';

test('component with theme provider', () => {
  const testComponent = (
    <ThemeProvider initialTheme="dark">
      <MyComponent />
    </ThemeProvider>
  );
  
  render(testComponent);
  
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
    </Provider>
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
    </Provider>
  );
  
  expect(screen.getByText('Content')).toBeOnTheScreen();
});
```

---

## Custom Render Function

### Creating Custom Render

```typescript
import { render as rtlRender } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';

// Custom render with providers
function render(
  component: React.ReactElement<any>,
  { initialTheme = 'light', ...options } = {}
) {
  return rtlRender(component, {
    wrapper: ({ children }) => (
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
// test-utils.ts
import { render } from './render';
import { screen } from '@testing-library/react-native';

test('uses custom render with providers', () => {
  render(<MyComponent />, { initialTheme: 'dark' });
  
  expect(screen.getByText('Content')).toBeOnTheScreen();
});
```

---

## Snapshot Testing

### Basic Snapshot Test

```typescript
import { render, screen } from '@testing-library/react-native';

test('snapshot test', () => {
  const { toJSON } = render(<MyComponent prop="value" />);
  
  expect(toJSON()).toMatchSnapshot();
});
```

### Snapshot with Screen Object

```typescript
test('snapshot with screen', () => {
  render(<ComplexComponent data={mockData} />);
  
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
    </View>
  );
  
  const content = screen.getByTestId('main-content');
  
  // Only snapshot the content, not header/footer
  expect(content.toJSON()).toMatchSnapshot();
});
```

---

## Testing Async Components

### Component with Data Loading

```typescript
// Component
function DataList() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchData().then(data => {
      setData(data);
      setLoading(false);
    });
  }, []);
  
  if (loading) return <Text>Loading...</Text>;
  
  return (
    <View>
      {data.map(item => (
        <Text key={item.id}>{item.name}</Text>
      ))}
    </View>
  );
}

// Test
test('async data loading', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve([
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ]),
    })
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
// Component
function DataLoader({ url }: { url: string }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError);
  }, [url]);
  
  if (error) return <Text>Error: {error.message}</Text>;
  if (!data) return <Text>Loading...</Text>;
  
  return <Text>{data.content}</Text>;
}

// Test successful load
test('loads data successfully', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ content: 'Success' }),
    })
  );
  
  render(<DataLoader url="/api/data" />);
  
  const content = await screen.findByText('Success');
  expect(content).toBeOnTheScreen();
});

// Test error handling
test('handles fetch error', async () => {
  global.fetch = jest.fn(() =>
    Promise.reject(new Error('Network failed'))
  );
  
  render(<DataLoader url="/api/data" />);
  
  const error = await screen.findByText(/Network failed/);
  expect(error).toBeOnTheScreen();
});
```

---

## Form Testing

### Simple Form Submission

```typescript
// Component
function LoginForm({ onSubmit }: { onSubmit: (creds: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  const handleSubmit = () => {
    onSubmit({ email, password });
  };
  
  return (
    <View>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable onPress={handleSubmit}>
        <Text>Login</Text>
      </Pressable>
    </View>
  );
}

// Test
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
  
  // Fill with valid email
  await user.type(emailInput, 'valid@example.com');
  await user.press(submitButton);
  
  // Error clears
  expect(screen.queryByText(/Invalid email/)).not.toBeOnTheScreen();
});
```

---

## 2024 Recommended Practices

### 1. Update to Latest Version

```bash
npm install @testing-library/react-native@^13.3.3
```

### 2. Use screen Object (Not Destructured)

```typescript
// ❌ OLD
const { getByText, getByRole } = render(<Component />);

// ✅ NEW
render(<Component />);
const element = screen.getByText('text');
```

### 3. Use userEvent Over fireEvent

```typescript
// ❌ OLD
fireEvent.press(button);

// ✅ NEW
const user = userEvent.setup();
await user.press(button);
```

### 4. Prefer Semantic Queries

```typescript
// ✅ BEST
screen.getByRole('button', { name: 'Submit' })
screen.getByLabelText('Email')

// ⚠️ OK
screen.getByText('Submit')

// ❌ AVOID
screen.getByTestId('submit-button')
```

### 5. Use Custom Render with Providers

```typescript
// test-utils.ts
export function render(component: React.ReactElement, options = {}) {
  return rtlRender(component, {
    wrapper: AllProviders,
    ...options,
  });
}

// In tests
import { render, screen } from '@/test-utils';
render(<Component />); // Providers automatically included
```

### 6. Test Behavior, Not Implementation

```typescript
// ❌ BAD
expect(component.state.isOpen).toBe(true);

// ✅ GOOD
expect(screen.getByText('Modal Content')).toBeOnTheScreen();
```

### 7. Keep Tests Isolated and Focused

```typescript
// ❌ BAD: Too much in one test
test('complete user flow', async () => {
  // Signup, Login, Browse, Purchase, Logout all in one test
});

// ✅ GOOD: Focused tests
test('signup form submits', async () => { ... });
test('login validates email', async () => { ... });
```

---

**Next:** [TypeScript Integration →](./09-typescript.md)
