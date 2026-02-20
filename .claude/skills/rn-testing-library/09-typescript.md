# TypeScript Integration - React Native Testing Library

**Document URL:** https://oss.callstack.com/react-native-testing-library/docs/typescript

**Version:** 13.3.3

---

## TypeScript Setup

### Installation

```bash
npm install --save-dev typescript @types/jest @testing-library/react-native
```

### tsconfig.json Configuration

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "types": ["jest", "@testing-library/react-native"]
  },
  "include": ["src", "**/*.test.ts", "**/*.test.tsx"],
  "exclude": ["node_modules", "dist"]
}
```

### Jest Configuration for TypeScript

```javascript
// jest.config.js
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: [
    '**/__tests__/**/*.(ts|tsx|js)',
    '**/?(*.)+(spec|test).(ts|tsx|js)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

---

## Component Type Definitions

### Typed Functional Component

```typescript
import React from 'react';
import { View, Text } from 'react-native';

interface GreetingProps {
  name: string;
  greeting?: string;
}

export const Greeting: React.FC<GreetingProps> = ({
  name,
  greeting = 'Hello',
}) => (
  <View>
    <Text>{greeting}, {name}!</Text>
  </View>
);
```

### Component with Children

```typescript
interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => (
  <View>
    <Text>{title}</Text>
    {children}
  </View>
);

// Usage
<Card title="My Card">
  <Text>Card content</Text>
</Card>
```

### Generic Component

```typescript
interface ListProps<T> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  keyExtractor: (item: T) => string;
}

export function List<T>({
  items,
  renderItem,
  keyExtractor,
}: ListProps<T>): React.ReactElement {
  return (
    <FlatList
      data={items}
      renderItem={({ item }) => renderItem(item)}
      keyExtractor={item => keyExtractor(item)}
    />
  );
}
```

---

## Hook Type Definitions

### Custom Hook with TypeScript

```typescript
interface CounterResult {
  count: number;
  increment: () => void;
  decrement: () => void;
}

export function useCounter(initialValue = 0): CounterResult {
  const [count, setCount] = useState(initialValue);

  return {
    count,
    increment: () => setCount(c => c + 1),
    decrement: () => setCount(c => c - 1),
  };
}
```

### Generic Hook

```typescript
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>(
    'idle'
  );
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as E);
      setStatus('error');
    }
  }, [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { status, data, error, execute };
}
```

---

## Generic Render Function

### Basic Typed Render

```typescript
import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import { ReactElement } from 'react';
import AllProviders from '@/context/AllProviders';

const render = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) =>
  rtlRender(ui, { wrapper: AllProviders, ...options });

export * from '@testing-library/react-native';
export { render };
```

### Render with Provider Options

```typescript
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: 'light' | 'dark';
  user?: { id: string; name: string } | null;
}

function render(
  ui: ReactElement,
  {
    theme = 'light',
    user = null,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  const Wrapper: React.FC<{ children: React.ReactNode }> = ({
    children,
  }) => (
    <ThemeProvider initialTheme={theme}>
      <AuthProvider initialUser={user}>
        {children}
      </AuthProvider>
    </ThemeProvider>
  );

  return rtlRender(ui, { wrapper: Wrapper, ...renderOptions });
}
```

---

## Query Type Definitions

### Typed Query Results

```typescript
import { render, screen, ReactTestInstance } from '@testing-library/react-native';

test('typed query results', () => {
  render(<MyComponent />);

  // Type-safe queries
  const element: ReactTestInstance = screen.getByText('text');
  const elements: ReactTestInstance[] = screen.getAllByText('text');

  // These are typed as promises
  const asyncElement = screen.findByText('text'); // Promise<ReactTestInstance>
  const asyncElements = screen.findAllByText('text'); // Promise<ReactTestInstance[]>
});
```

---

## Advanced TypeScript Patterns

### Typed renderHook

```typescript
import { renderHook } from '@testing-library/react-native';

interface UseCounterResult {
  count: number;
  increment: () => void;
}

test('typed renderHook', () => {
  const { result } = renderHook<UseCounterResult>(() => useCounter());

  // result.current is now typed as UseCounterResult
  expect(result.current.count).toBe(0);
  result.current.increment();
});
```

### Typed Mock Functions

```typescript
import { render, screen, userEvent } from '@testing-library/react-native';

interface MockCallbacks {
  onSubmit: (data: { email: string; password: string }) => void;
  onCancel: () => void;
}

test('typed mock functions', async () => {
  const mocks: MockCallbacks = {
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
  };

  const user = userEvent.setup();
  render(<LoginForm onSubmit={mocks.onSubmit} onCancel={mocks.onCancel} />);

  await user.press(screen.getByRole('button', { name: 'Submit' }));

  // Type-safe assertion
  expect(mocks.onSubmit).toHaveBeenCalledWith({
    email: expect.any(String),
    password: expect.any(String),
  });
});
```

### Type-Safe Test Setup

```typescript
interface TestComponent<P = {}> {
  component: React.ComponentType<P>;
  defaultProps?: Partial<P>;
}

function createTest<P extends Record<string, any>>(
  { component: Component, defaultProps = {} }: TestComponent<P>,
  testName: string,
  testFn: (props: P) => void
) {
  test(testName, () => {
    const props = { ...defaultProps } as P;
    render(<Component {...props} />);
    testFn(props);
  });
}

// Usage
createTest(
  { component: Button, defaultProps: { title: 'Click' } },
  'button renders',
  (props) => {
    expect(screen.getByText(props.title)).toBeOnTheScreen();
  }
);
```

### Generic Component Testing

```typescript
function testGenericComponent<T extends { id: string; name: string }>(
  component: React.ComponentType<{ item: T }>,
  testItem: T
) {
  test(`renders item ${testItem.id}`, () => {
    render(React.createElement(component, { item: testItem }));

    expect(screen.getByText(testItem.name)).toBeOnTheScreen();
  });
}

// Usage
const mockUser = { id: '1', name: 'Alice' };
testGenericComponent(UserCard, mockUser);
```

### Typed Test Factory

```typescript
function createComponentTest<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  baseProps: P
) {
  return {
    render: (overrides?: Partial<P>) => {
      const props = { ...baseProps, ...overrides } as P;
      return render(<Component {...props} />);
    },

    renderWithProviders: (overrides?: Partial<P>) => {
      const props = { ...baseProps, ...overrides } as P;
      return render(<Component {...props} />, { wrapper: AllProviders });
    },
  };
}

// Usage
const form = createComponentTest(LoginForm, {
  onSubmit: jest.fn(),
});

test('renders form', () => {
  form.render();
  expect(screen.getByLabelText('Email')).toBeOnTheScreen();
});

test('renders with providers', () => {
  form.renderWithProviders({ onSubmit: jest.fn() });
  expect(screen.getByText('Content')).toBeOnTheScreen();
});
```

---

## Type Safety Checklist

- [ ] tsconfig.json has `strict: true`
- [ ] All component props typed with interfaces
- [ ] All hooks have return types
- [ ] All mock functions typed
- [ ] Custom render function typed
- [ ] renderHook calls typed with generic
- [ ] Test data typed with interfaces
- [ ] No `any` types used carelessly

---

**Next:** [Troubleshooting & FAQ →](./10-troubleshooting.md)
