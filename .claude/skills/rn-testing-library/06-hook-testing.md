# Hook Testing - React Native Testing Library

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/misc/render-hook

**Version:** 13.3.x

---

## renderHook Overview

### Description

`renderHook()` renders a React Hook in isolation without requiring a wrapper component. Essential for testing custom hooks, state management, and hook logic independently.

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

---

## renderHookAsync() (v13.3.0+)

### Description

Async version of renderHook for React 19 and Suspense. Uses async `act` internally.

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

### Key Differences from renderHook

| Feature | renderHook | renderHookAsync |
|---------|------------|-----------------|
| Return | Sync result | Promise |
| Rerender | `rerender()` | `rerenderAsync()` |
| Unmount | `unmount()` | `unmountAsync()` |
| React 19/Suspense | May need workarounds | Native support |
| `React.use()` | Not supported | Supported |

---

## Hook Result Object

### Accessing Hook Return Value

```typescript
import { renderHook } from '@testing-library/react-native';
import { useCounter } from '@/hooks/useCounter';

test('access hook return value', () => {
  const { result } = renderHook(() => useCounter());

  // Access current value from hook
  const { count, increment, decrement } = result.current;

  expect(count).toBe(0);
  expect(typeof increment).toBe('function');
  expect(typeof decrement).toBe('function');
});
```

### Updating Hook Value

```typescript
test('hook state updates', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  // Call hook method to update state
  result.current.increment();

  expect(result.current.count).toBe(1);
});
```

---

## Testing Custom Hooks

### Simple State Hook

```typescript
// Hook
export function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);

  return {
    count,
    increment: () => setCount(c => c + 1),
    decrement: () => setCount(c => c - 1),
    reset: () => setCount(initialValue),
  };
}

// Test
test('useCounter hook', () => {
  const { result } = renderHook(() => useCounter());

  expect(result.current.count).toBe(0);

  result.current.increment();
  expect(result.current.count).toBe(1);

  result.current.increment();
  expect(result.current.count).toBe(2);

  result.current.decrement();
  expect(result.current.count).toBe(1);

  result.current.reset();
  expect(result.current.count).toBe(0);
});
```

### Toggle Hook

```typescript
export function useToggle(initialValue = false) {
  const [isOn, setIsOn] = useState(initialValue);

  return {
    isOn,
    toggle: () => setIsOn(v => !v),
    on: () => setIsOn(true),
    off: () => setIsOn(false),
  };
}

// Test
test('useToggle hook', () => {
  const { result } = renderHook(() => useToggle(false));

  expect(result.current.isOn).toBe(false);

  result.current.on();
  expect(result.current.isOn).toBe(true);

  result.current.toggle();
  expect(result.current.isOn).toBe(false);

  result.current.toggle();
  expect(result.current.isOn).toBe(true);

  result.current.off();
  expect(result.current.isOn).toBe(false);
});
```

---

## Hook with Props

### Rerender with Props Changes

```typescript
export function useFavoriteFruit(fruit: string) {
  const [isFavorite, setIsFavorite] = useState(false);

  return {
    fruit,
    isFavorite,
    toggleFavorite: () => setIsFavorite(!isFavorite),
  };
}

// Test
test('hook rerender with props', () => {
  const { result, rerender } = renderHook(
    ({ fruit }: { fruit: string }) => useFavoriteFruit(fruit),
    { initialProps: { fruit: 'apple' } },
  );

  expect(result.current.fruit).toBe('apple');
  expect(result.current.isFavorite).toBe(false);

  // Toggle favorite
  result.current.toggleFavorite();
  expect(result.current.isFavorite).toBe(true);

  // Change fruit prop
  rerender({ fruit: 'banana' });

  expect(result.current.fruit).toBe('banana');
  expect(result.current.isFavorite).toBe(true);
});
```

### Hook with Effect

```typescript
export function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;

    return () => {
      document.title = 'Default';
    };
  }, [title]);

  return { title };
}

// Test
test('useDocumentTitle hook', () => {
  const { result, rerender } = renderHook(
    ({ title }: { title: string }) => useDocumentTitle(title),
    { initialProps: { title: 'Home' } },
  );

  expect(document.title).toBe('Home');

  rerender({ title: 'About' });

  expect(document.title).toBe('About');
});
```

---

## Async Hooks

### Async Data Hook

```typescript
export function useFetch(url: string) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch(url)
      .then(res => res.json())
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [url]);

  return { data, loading, error };
}

// Test
test('useFetch hook async behavior', async () => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      json: () => Promise.resolve({ id: 1, name: 'Test' }),
    }),
  );

  const { result } = renderHook(() => useFetch('/api/data'));

  // Initially loading
  expect(result.current.loading).toBe(true);
  expect(result.current.data).toBeNull();

  // Wait for data to load
  await waitFor(() => {
    expect(result.current.loading).toBe(false);
  });

  expect(result.current.data).toEqual({ id: 1, name: 'Test' });
  expect(result.current.error).toBeNull();
});
```

### Async Hook with renderHookAsync (v13.3.0+)

```typescript
import { renderHookAsync, waitFor } from '@testing-library/react-native';

test('async hook with Suspense', async () => {
  const { result, rerenderAsync } = await renderHookAsync(
    () => useSuspenseQuery('/api/data'),
  );

  expect(result.current.data).toBeDefined();

  // Rerender with new props
  await rerenderAsync();

  expect(result.current.data).toBeDefined();
});
```

---

## Hook with Providers

### Context Hook

```typescript
export function useTheme() {
  const theme = useContext(ThemeContext);

  if (!theme) {
    throw new Error('useTheme must be used within ThemeProvider');
  }

  return theme;
}

// Test
test('useTheme hook with provider', () => {
  const { result } = renderHook(() => useTheme(), {
    wrapper: ThemeProvider,
  });

  expect(result.current.theme).toBe('light');

  result.current.setTheme('dark');

  expect(result.current.theme).toBe('dark');
});
```

### Multiple Providers

```typescript
test('hook with multiple providers', () => {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );

  const { result } = renderHook(
    () => {
      const dispatch = useAppDispatch();
      const theme = useTheme();
      return { dispatch, theme };
    },
    { wrapper: Wrapper },
  );

  expect(typeof result.current.dispatch).toBe('function');
  expect(result.current.theme).toBeDefined();
});
```

---

## Hook Testing Best Practices

**DO:**
- Test hook return values and state changes
- Use `wrapper` option for hooks that require context providers
- Use `waitFor` for async hook state updates
- Use `renderHookAsync` for React 19/Suspense hooks
- Use `rerender` to test prop change reactions

**DO NOT:**
- Test React's built-in hooks (useState, useEffect) directly
- Access internal hook implementation details
- Forget to wrap async assertions in `waitFor`
- Use `renderHook` for hooks that use `React.use()` -- use `renderHookAsync`

---

**Next:** [Accessibility & Configuration](./07-accessibility.md)

**Source:** https://oss.callstack.com/react-native-testing-library/docs/api/misc/render-hook
