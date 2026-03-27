# React Native 0.83.4 -- Testing & DevTools

React Native DevTools, Jest, React Native Testing Library, Detox E2E, and debugging.

---

## React Native DevTools

### Opening DevTools

| Platform | Action |
|----------|--------|
| iOS Simulator | Cmd+D or shake device |
| Android Emulator | Cmd+M (macOS) / Ctrl+M (Windows) |
| Physical device | Shake device |
| Metro terminal | Press `d` |

### DevTools Features (RN 0.83)

- **Component Inspector** -- view component tree, props, state
- **Performance Profiler** -- measure render times, identify bottlenecks
- **Network Inspector** -- inspect API requests/responses
- **Console** -- view logs from JS runtime
- **Error display** -- original message, stack trace, Owner Stack, and error cause

### Improved Error Reporting (0.81+)

RN 0.81+ DevTools shows:
- Original error message and stack trace
- Error's `cause` property if present
- Owner Stack for component errors (traces which component rendered the error)

---

## Jest + React Native Testing Library

### Setup

React Native projects come with Jest preconfigured. Add RNTL:

```bash
npm install --save-dev @testing-library/react-native @testing-library/jest-native
```

### Testing a Component

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react-native';
import { Button } from './Button';

describe('Button', () => {
  it('renders with title', () => {
    render(<Button title="Submit" onPress={() => {}} />);
    expect(screen.getByText('Submit')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    render(<Button title="Submit" onPress={onPress} />);

    fireEvent.press(screen.getByText('Submit'));

    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows disabled state', () => {
    render(<Button title="Submit" onPress={() => {}} disabled />);
    expect(screen.getByText('Submit')).toBeDisabled();
  });
});
```

### Query Methods

| Query | Returns | Throws if missing |
|-------|---------|-------------------|
| `getByText(text)` | Element | Yes |
| `queryByText(text)` | Element or null | No |
| `findByText(text)` | Promise<Element> | Yes (async) |
| `getAllByText(text)` | Element[] | Yes if empty |
| `getByTestId(id)` | Element | Yes |
| `getByRole(role)` | Element | Yes |
| `getByPlaceholderText(text)` | Element | Yes |
| `getByDisplayValue(value)` | Element | Yes |

### Testing Hooks

```typescript
// useCounter.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('starts at 0', () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });

  it('increments', () => {
    const { result } = renderHook(() => useCounter());

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Testing Async Behavior

```typescript
import { render, screen, waitFor } from '@testing-library/react-native';
import { UserProfile } from './UserProfile';

// Mock API
jest.mock('../api', () => ({
  fetchUser: jest.fn().mockResolvedValue({ name: 'John', email: 'john@test.com' }),
}));

describe('UserProfile', () => {
  it('loads and displays user data', async () => {
    render(<UserProfile userId="123" />);

    // Wait for async data
    await waitFor(() => {
      expect(screen.getByText('John')).toBeTruthy();
    });

    expect(screen.getByText('john@test.com')).toBeTruthy();
  });
});
```

### User Events (Recommended over fireEvent)

```typescript
import { render, screen } from '@testing-library/react-native';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  it('submits with entered values', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn();
    render(<LoginForm onSubmit={onSubmit} />);

    await user.type(screen.getByPlaceholderText('Email'), 'test@example.com');
    await user.type(screen.getByPlaceholderText('Password'), 'password123');
    await user.press(screen.getByText('Sign In'));

    expect(onSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });
});
```

---

## Mocking Patterns

### Mock Native Modules

```typescript
// jest.setup.ts or __mocks__
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
  SafeAreaView: ({ children }: { children: React.ReactNode }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}));
```

### Mock Navigation

```typescript
const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: () => ({
    params: { id: '123' },
  }),
}));
```

---

## Detox E2E Testing

### Installation

```bash
npm install --save-dev detox @types/detox
```

### Configuration (.detoxrc.js)

```typescript
module.exports = {
  testRunner: {
    args: { config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120000 },
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/MyApp.app',
      build: 'xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release && cd ..',
    },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 16' } },
    emulator: { type: 'android.emulator', device: { avdName: 'Pixel_7' } },
  },
  configurations: {
    'ios.release': { device: 'simulator', app: 'ios.release' },
    'android.release': { device: 'emulator', app: 'android.release' },
  },
};
```

### E2E Test Example

```typescript
// e2e/login.test.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  it('should login successfully', async () => {
    await element(by.id('email-input')).typeText('user@test.com');
    await element(by.id('password-input')).typeText('password123');
    await element(by.id('login-button')).tap();

    await waitFor(element(by.text('Welcome')))
      .toBeVisible()
      .withTimeout(5000);
  });

  it('shows error for invalid credentials', async () => {
    await element(by.id('email-input')).typeText('wrong@test.com');
    await element(by.id('password-input')).typeText('wrong');
    await element(by.id('login-button')).tap();

    await expect(element(by.text('Invalid credentials'))).toBeVisible();
  });
});
```

### Run E2E Tests

```bash
# Build
npx detox build --configuration ios.release

# Test
npx detox test --configuration ios.release
```

---

## Debugging Strategies

### Console Logging (Development Only)

```typescript
if (__DEV__) {
  console.log('Debug info:', data);
}
```

### Breakpoints

1. Open DevTools (Cmd+D / Cmd+M)
2. Open debugger (press `j` in Metro)
3. Set breakpoints in Chrome/VS Code
4. Step through code

### Network Debugging

```typescript
// Inspect all fetch calls in development
if (__DEV__) {
  const originalFetch = global.fetch;
  global.fetch = async (...args) => {
    console.log('Fetch:', args[0]);
    const response = await originalFetch(...args);
    console.log('Response:', response.status);
    return response;
  };
}
```

### React Profiler

```typescript
import { Profiler } from 'react';

function onRender(
  id: string,
  phase: 'mount' | 'update',
  actualDuration: number,
): void {
  if (__DEV__) {
    console.log(`${id} ${phase}: ${actualDuration.toFixed(1)}ms`);
  }
}

<Profiler id="FeedList" onRender={onRender}>
  <FeedList />
</Profiler>
```

---

## Test Commands

```bash
# Run all tests
npm test

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage

# Single file
npm test -- --testPathPattern="Button.test"

# Update snapshots
npm test -- -u
```

---

## Test File Conventions

| Type | Naming | Location |
|------|--------|----------|
| Unit test | `*.test.ts` or `*.test.tsx` | `__tests__/` next to source |
| Integration test | `*.integration.test.ts` | `__tests__/` next to source |
| E2E test | `*.e2e.ts` | `e2e/` directory |
| Mock | `__mocks__/module-name.ts` | `__mocks__/` at project root |

---

**Version:** React Native 0.83.4 | Jest | @testing-library/react-native | Detox
**Source:** https://reactnative.dev/docs/testing-overview
