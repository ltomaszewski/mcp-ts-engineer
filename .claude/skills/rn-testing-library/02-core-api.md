# Core API Reference - React Native Testing Library

**Document URL:** https://oss.callstack.com/react-native-testing-library/docs/api

**Version:** 13.3.3

---

## render()

### Description

Synchronously renders a React component for testing. Returns the rendered tree with bound query methods and utilities. This is the primary function for component testing.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/render](https://oss.callstack.com/react-native-testing-library/docs/api/render)

### Signature

```typescript
function render<Q extends Queries = typeof queries>(
  element: React.ReactElement<any>,
  options?: RenderOptions<Q>
): RenderResult<Q>
```

### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `element` | `React.ReactElement<any>` | Yes | The component to render |
| `options` | `RenderOptions<Q>` | No | Configuration object |

### RenderOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `container` | `Element` | `null` | Custom container element |
| `wrapper` | `React.ComponentType<any>` | `undefined` | Wrapper component (providers) |
| `initialProps` | `object` | `{}` | Props for wrapper component |

### Code Examples

#### Basic Component Rendering

```typescript
import { render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';

test('renders text component', () => {
  render(<Text>Hello, World!</Text>);
  
  expect(screen.getByText('Hello, World!')).toBeOnTheScreen();
});
```

#### With Wrapper/Provider

```typescript
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/context/ThemeContext';
import { UserProfile } from '@/components/UserProfile';

test('renders with theme provider', () => {
  render(<UserProfile userId={123} />, {
    wrapper: ThemeProvider,
  });
  
  expect(screen.getByText(/Profile/i)).toBeOnTheScreen();
});
```

#### Custom Render Function

```typescript
// test-utils.ts
import { render as rtlRender } from '@testing-library/react-native';
import { AllProviders } from '@/context';

export function render(component: React.ReactElement, options = {}) {
  return rtlRender(component, {
    wrapper: AllProviders,
    ...options,
  });
}

// In tests
import { render, screen } from '@/test-utils';

test('with custom render', () => {
  render(<MyComponent />);
  expect(screen.getByText('content')).toBeOnTheScreen();
});
```

---

## renderAsync()

### Description

Asynchronously renders a component with async/await support. Returns promise resolving to RenderResult.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/render-async](https://oss.callstack.com/react-native-testing-library/docs/api/render-async)

### Signature

```typescript
async function renderAsync<Q extends Queries = typeof queries>(
  element: React.ReactElement<any>,
  options?: RenderOptions<Q>
): Promise<RenderResult<Q>>
```

### Code Examples

#### Async Component Rendering

```typescript
import { renderAsync, screen } from '@testing-library/react-native';
import { DataList } from '@/components/DataList';

test('renders async component with data', async () => {
  await renderAsync(
    <DataList url="https://api.example.com/data" />
  );
  
  expect(await screen.findByText(/Item 1/)).toBeOnTheScreen();
});
```

---

## screen Object

### Description

The modern, recommended way to access queries and utilities. Provides all query methods bound to the most recent render's root.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/screen](https://oss.callstack.com/react-native-testing-library/docs/api/screen)

### Code Examples

#### Using screen Object (Recommended)

```typescript
import { render, screen } from '@testing-library/react-native';
import { LoginForm } from '@/components/LoginForm';

test('renders login form with screen object', () => {
  render(<LoginForm onSubmit={jest.fn()} />);
  
  const emailInput = screen.getByLabelText('Email');
  const submitButton = screen.getByRole('button', { name: 'Submit' });
  
  expect(emailInput).toBeOnTheScreen();
  expect(submitButton).toBeOnTheScreen();
});
```

#### debug() Function

```typescript
test('debug rendered tree', () => {
  render(
    <View>
      <Text>Hello</Text>
      <Text>World</Text>
    </View>
  );
  
  screen.debug();
});
```

#### rerender() Function

```typescript
test('updates component on prop change', () => {
  const { rerender } = render(
    <Counter initialCount={0} />
  );
  
  expect(screen.getByText('Count: 0')).toBeOnTheScreen();
  
  rerender(<Counter initialCount={5} />);
  
  expect(screen.getByText('Count: 5')).toBeOnTheScreen();
});
```

---

## renderHook()

### Description

Renders a React Hook in isolation for testing hook logic without wrapping components.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/render-hook](https://oss.callstack.com/react-native-testing-library/docs/api/render-hook)

### Signature

```typescript
function renderHook<Result, Props = undefined>(
  renderCallback: (initialProps?: Props) => Result,
  options?: RenderHookOptions<Props>
): RenderHookResult<Result, Props>
```

### Code Examples

#### Simple Hook Testing

```typescript
import { renderHook } from '@testing-library/react-native';
import { useCounter } from '@/hooks/useCounter';

test('useCounter hook increments', () => {
  const { result } = renderHook(() => useCounter());
  
  expect(result.current.count).toBe(0);
  
  result.current.increment();
  
  expect(result.current.count).toBe(1);
});
```

#### Hook with Props

```typescript
test('hook with initial props', () => {
  const { result, rerender } = renderHook(
    ({ query }: { query: string }) => useSearch(query),
    { initialProps: { query: 'react' } }
  );
  
  expect(result.current.query).toBe('react');
  
  rerender({ query: 'native' });
  
  expect(result.current.query).toBe('native');
});
```

#### Hook with Wrapper

```typescript
test('useAuth hook with provider', () => {
  const { result } = renderHook(
    () => useAuth(),
    { wrapper: AuthProvider }
  );
  
  expect(result.current.user).toBeDefined();
});
```

---

## cleanup()

### Description

Removes all rendered components from the test environment. Automatically called after each test when using Jest.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/cleanup](https://oss.callstack.com/react-native-testing-library/docs/api/cleanup)

### Signature

```typescript
function cleanup(): void
```

### Code Examples

#### Setup in jest.setup.js

```typescript
import { cleanup } from '@testing-library/react-native';

afterEach(() => {
  cleanup();
});
```

---

## act()

### Description

Wraps updates to React state and effects to ensure they complete before making assertions.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/act](https://oss.callstack.com/react-native-testing-library/docs/api/act)

### Signature

```typescript
function act<T>(callback: () => T | Promise<T>): T | Promise<T>
```

### Code Examples

#### Wrapping State Updates

```typescript
import { act, render, screen } from '@testing-library/react-native';
import { ToggleButton } from '@/components/ToggleButton';

test('handles click and updates state', () => {
  render(<ToggleButton />);
  
  const button = screen.getByRole('button');
  
  act(() => {
    button.props.onPress();
  });
  
  expect(screen.getByText('ON')).toBeOnTheScreen();
});
```

#### Async State Updates

```typescript
test('handles async state updates', async () => {
  render(<DataFetcher />);
  
  await act(async () => {
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  expect(screen.getByText(/Data loaded/)).toBeOnTheScreen();
});
```

---

## within()

### Description

Scopes queries to a specific element subtree instead of the entire render tree.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/within](https://oss.callstack.com/react-native-testing-library/docs/api/within)

### Signature

```typescript
function within<Q extends Queries = typeof queries>(
  element: ReactTestInstance
): Queries
```

### Code Examples

#### Scoping Queries to Element

```typescript
import { render, screen, within } from '@testing-library/react-native';
import { UserCard } from '@/components/UserCard';

test('queries within specific element', () => {
  render(
    <View>
      <UserCard name="Alice" />
      <UserCard name="Bob" />
    </View>
  );
  
  const aliceCard = screen.getByText('Alice').parent?.parent;
  const nameInCard = within(aliceCard).getByText('Alice');
  
  expect(nameInCard).toBeOnTheScreen();
});
```

#### Querying Lists with within()

```typescript
test('within() for list items', () => {
  render(
    <FlatList
      data={[
        { id: '1', name: 'Item 1' },
        { id: '2', name: 'Item 2' },
      ]}
      renderItem={({ item }) => (
        <View testID={`item-${item.id}`}>
          <Text>{item.name}</Text>
          <Button title="Delete" />
        </View>
      )}
    />
  );
  
  const secondItem = screen.getByTestId('item-2');
  const deleteButton = within(secondItem).getByRole('button');
  
  expect(deleteButton).toBeOnTheScreen();
});
```

---

## configure()

### Description

Sets global default options for the RNTL library, affecting behavior across all tests.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/configure](https://oss.callstack.com/react-native-testing-library/docs/api/configure)

### Signature

```typescript
interface ConfigOptions {
  testIdAttribute?: string;
  asyncUtilTimeout?: number;
  getElementError?: (message: string | null, container: Element) => Error;
}

function configure(options: Partial<ConfigOptions>): void
```

### Code Examples

#### Configure Async Timeout Globally

```typescript
import { configure } from '@testing-library/react-native';

// In jest.setup.js
configure({ asyncUtilTimeout: 3000 }); // 3 second global timeout

test('uses configured timeout', async () => {
  render(<SlowComponent />);
  
  await screen.findByText(/Loaded/);
});
```

#### Configure Custom Test ID Attribute

```typescript
configure({ testIdAttribute: 'data-testid' });

test('uses custom test ID attribute', () => {
  render(
    <View data-testid="my-view">
      <Text>Content</Text>
    </View>
  );
  
  expect(screen.getByTestId('my-view')).toBeOnTheScreen();
});
```

---

## resetToDefaults()

### Description

Resets all global configuration options to their default values.

**Source:** [https://oss.callstack.com/react-native-testing-library/docs/api/reset](https://oss.callstack.com/react-native-testing-library/docs/api/reset)

### Signature

```typescript
function resetToDefaults(): void
```

### Code Examples

#### Reset After Test Configuration

```typescript
import { configure, resetToDefaults } from '@testing-library/react-native';

describe('Custom Configuration Tests', () => {
  beforeEach(() => {
    configure({ asyncUtilTimeout: 500 });
  });
  
  afterEach(() => {
    resetToDefaults();
  });
  
  test('uses custom timeout', async () => {
    await screen.findByText(/Content/, {}, { timeout: 500 });
  });
});
```

---

## API Quick Reference

| Function | Synchronous | Returns | Use Case |
|----------|-------------|---------|----------|
| `render()` | Yes | `RenderResult` | Render components |
| `renderAsync()` | No | `Promise<RenderResult>` | Async rendering |
| `renderHook()` | Yes | `RenderHookResult` | Test hooks |
| `cleanup()` | Yes | `void` | Clean up after tests |
| `act()` | Both | Value or Promise | Wrap state updates |
| `within()` | Yes | `Queries` | Scope queries |
| `configure()` | Yes | `void` | Set defaults |
| `resetToDefaults()` | Yes | `void` | Reset configuration |

---

**Next:** [Query Methods →](./03-query-methods.md)
