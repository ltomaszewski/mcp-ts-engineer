# Core API Reference - React Native Testing Library

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/render

**Version:** 13.3.x

---

## render()

### Description

Synchronously renders a React component for testing. Returns the rendered tree with bound query methods and utilities. This is the primary function for component testing.

> **v13 note:** Concurrent rendering is enabled by default. Pass `concurrentRoot: false` in render options as an escape hatch if needed.

### Signature

```typescript
function render<Q extends Queries = typeof queries>(
  element: React.ReactElement<any>,
  options?: RenderOptions<Q>
): RenderResult<Q>
```

### RenderOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `wrapper` | `React.ComponentType<any>` | `undefined` | Wrapper component (providers) |
| `concurrentRoot` | `boolean` | `true` | Enable/disable concurrent rendering |
| `createNodeMock` | `(element: React.ReactElement) => any` | `undefined` | Custom mock ref factory |
| `unstable_validateStringsRenderedWithinText` | `boolean` | `false` | Replicate RN's string-in-Text requirement |

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
import { render as rtlRender, RenderOptions } from '@testing-library/react-native';
import { AllProviders } from '@/context';

export function render(
  component: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) {
  return rtlRender(component, {
    wrapper: AllProviders,
    ...options,
  });
}

export * from '@testing-library/react-native';
```

---

## renderAsync() (v13.3.0+)

### Description

Asynchronously renders a component using async `act` internally. Designed for React 19, React Suspense, and `React.use()`. Returns promise resolving to RenderResult.

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/render

### Signature

```typescript
async function renderAsync<Q extends Queries = typeof queries>(
  element: React.ReactElement<any>,
  options?: RenderOptions<Q>
): Promise<RenderResult<Q>>
```

### Code Examples

#### Suspense Component Rendering

```typescript
import { renderAsync, screen } from '@testing-library/react-native';
import { Suspense } from 'react';
import { DataList } from '@/components/DataList';

test('renders Suspense component with data', async () => {
  await renderAsync(
    <Suspense fallback={<Text>Loading...</Text>}>
      <DataList url="https://api.example.com/data" />
    </Suspense>,
  );

  expect(screen.getByText(/Item 1/)).toBeOnTheScreen();
});
```

#### React.use() Component

```typescript
import { renderAsync, screen } from '@testing-library/react-native';

function UserName({ userPromise }: { userPromise: Promise<User> }) {
  const user = React.use(userPromise);
  return <Text>{user.name}</Text>;
}

test('renders component using React.use()', async () => {
  const userPromise = Promise.resolve({ name: 'Alice' });

  await renderAsync(
    <Suspense fallback={<Text>Loading...</Text>}>
      <UserName userPromise={userPromise} />
    </Suspense>,
  );

  expect(screen.getByText('Alice')).toBeOnTheScreen();
});
```

---

## screen Object

### Description

The modern, recommended way to access queries and utilities. Provides all query methods bound to the most recent render's root.

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/screen

### Properties and Methods

| Property/Method | Type | Description |
|-----------------|------|-------------|
| `getBy*` / `getAllBy*` | Query | Find elements (throws if not found) |
| `queryBy*` / `queryAllBy*` | Query | Find elements (returns null/empty array) |
| `findBy*` / `findAllBy*` | Query | Async find (waits for element) |
| `rerender(element)` | Function | Synchronous rerender |
| `rerenderAsync(element)` | Function | Async rerender (v13.3.0+) |
| `unmount()` | Function | Synchronous unmount |
| `unmountAsync()` | Function | Async unmount (v13.3.0+) |
| `debug(options?)` | Function | Pretty-print rendered tree |
| `toJSON()` | Function | JSON representation for snapshots |
| `root` | ReactTestInstance | Root host element |
| `UNSAFE_root` | ReactTestInstance | Composite root element (discouraged) |

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

> **v13 note:** `debug.shallow` has been removed. Only `screen.debug()` (full tree) is available.

```typescript
test('debug rendered tree', () => {
  render(
    <View>
      <Text>Hello</Text>
      <Text>World</Text>
    </View>,
  );

  // Full tree debug
  screen.debug();

  // With options
  screen.debug({ message: 'After render' });
});
```

#### rerender() and rerenderAsync()

```typescript
test('updates component on prop change', () => {
  const { rerender } = render(<Counter initialCount={0} />);

  expect(screen.getByText('Count: 0')).toBeOnTheScreen();

  rerender(<Counter initialCount={5} />);

  expect(screen.getByText('Count: 5')).toBeOnTheScreen();
});

// Async version for React 19/Suspense
test('async rerender', async () => {
  await renderAsync(<SuspenseComponent data={initialData} />);

  await screen.rerenderAsync(<SuspenseComponent data={newData} />);

  expect(screen.getByText('Updated')).toBeOnTheScreen();
});
```

#### root Property

```typescript
test('access root element', () => {
  render(<MyComponent />);

  // Access the root host element
  const root = screen.root;
  expect(root.type).toBe('View');
});
```

---

## renderHook()

### Description

Renders a React Hook in isolation for testing hook logic without wrapping components.

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/misc/render-hook

### Signature

```typescript
function renderHook<Result, Props = undefined>(
  renderCallback: (initialProps?: Props) => Result,
  options?: RenderHookOptions<Props>
): RenderHookResult<Result, Props>

interface RenderHookOptions<Props = undefined> {
  initialProps?: Props;
  wrapper?: React.ComponentType<any>;
  concurrentRoot?: boolean;
}

interface RenderHookResult<Result, Props = undefined> {
  result: { current: Result };
  rerender: (props?: Props) => void;
  unmount: () => void;
}
```

### Code Examples

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

---

## renderHookAsync() (v13.3.0+)

### Description

Async version of renderHook for React 19 and Suspense. Uses async `act` internally.

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/misc/render-hook

### Signature

```typescript
async function renderHookAsync<Result, Props = undefined>(
  renderCallback: (initialProps?: Props) => Result,
  options?: RenderHookOptions<Props>
): Promise<RenderHookAsyncResult<Result, Props>>

interface RenderHookAsyncResult<Result, Props = undefined> {
  result: { current: Result };
  rerenderAsync: (props?: Props) => Promise<void>;
  unmountAsync: () => Promise<void>;
}
```

### Code Examples

```typescript
import { renderHookAsync } from '@testing-library/react-native';

test('async hook with Suspense', async () => {
  const { result } = await renderHookAsync(() => useSuspenseData());

  expect(result.current.data).toBeDefined();

  await result.current.refetch();
});
```

---

## cleanup()

### Description

Removes all rendered components from the test environment. Automatically called after each test when using Jest.

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/misc/cleanup

### Signature

```typescript
function cleanup(): void
```

### Code Examples

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

> **v13 note:** Uses React's own `act()` instead of React Test Renderer's `act()`.

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/misc/act

### Signature

```typescript
function act<T>(callback: () => T | Promise<T>): T | Promise<T>
```

### Code Examples

```typescript
import { act, render, screen } from '@testing-library/react-native';

test('handles state updates', () => {
  render(<ToggleButton />);

  const button = screen.getByRole('button');

  act(() => {
    button.props.onPress();
  });

  expect(screen.getByText('ON')).toBeOnTheScreen();
});

// Async version
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

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/misc/within

### Signature

```typescript
function within(element: ReactTestInstance): Queries
```

### Code Examples

```typescript
import { render, screen, within } from '@testing-library/react-native';

test('queries within specific element', () => {
  render(
    <FlatList
      data={[{ id: '1', name: 'Item 1' }, { id: '2', name: 'Item 2' }]}
      renderItem={({ item }) => (
        <View testID={`item-${item.id}`}>
          <Text>{item.name}</Text>
          <Pressable accessibilityRole="button"><Text>Delete</Text></Pressable>
        </View>
      )}
    />,
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

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/misc/config

### Signature

```typescript
interface ConfigOptions {
  asyncUtilTimeout: number;
  defaultHidden: boolean;
  defaultDebugOptions: Partial<DebugOptions>;
  concurrentRoot: boolean;
}

function configure(options: Partial<ConfigOptions>): void
```

### Config Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `asyncUtilTimeout` | `number` | `1000` | Timeout for `waitFor`, `waitForElementToBeRemoved`, `findBy*` (ms) |
| `defaultHidden` | `boolean` | `false` | Whether queries match elements hidden from accessibility |
| `defaultDebugOptions` | `Partial<DebugOptions>` | `{}` | Default options for `debug()` calls |
| `concurrentRoot` | `boolean` | `true` | Enable/disable concurrent rendering globally |

### Code Examples

```typescript
import { configure } from '@testing-library/react-native';

// In jest.setup.ts
configure({
  asyncUtilTimeout: 3000,
  concurrentRoot: true,
});
```

---

## resetToDefaults()

### Description

Resets all global configuration options to their default values.

```typescript
import { configure, resetToDefaults } from '@testing-library/react-native';

afterEach(() => {
  resetToDefaults();
});
```

---

## API Quick Reference

| Function | Sync | Returns | Since |
|----------|------|---------|-------|
| `render()` | Yes | `RenderResult` | v1 |
| `renderAsync()` | No | `Promise<RenderResult>` | v13.3.0 |
| `renderHook()` | Yes | `RenderHookResult` | v12 |
| `renderHookAsync()` | No | `Promise<RenderHookAsyncResult>` | v13.3.0 |
| `cleanup()` | Yes | `void` | v1 |
| `act()` | Both | Value or Promise | v1 |
| `within()` | Yes | `Queries` | v1 |
| `configure()` | Yes | `void` | v1 |
| `resetToDefaults()` | Yes | `void` | v1 |

---

**Next:** [Query Methods](./03-query-methods.md)

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/render
