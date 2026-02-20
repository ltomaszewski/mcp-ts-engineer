# React Native 0.83 - Testing & DevTools

**Debugging tools, unit tests, and integration testing**

---

## 🛠️ React Native DevTools

### Open DevTools

**iOS (Simulator):**
```bash
Cmd + D
```

**Android (Emulator/Device):**
```bash
Cmd + M (emulator) or Ctrl + M (Windows)
```

Or shake device and tap "Open Debugger"

### DevTools Features

- **Component tree inspection** — View component hierarchy
- **Props & state viewing** — Debug component data
- **Element highlighting** — Tap to identify components
- **Performance profiling** — Monitor FPS and rendering
- **Network requests** — Inspect API calls
- **Redux DevTools** — State management inspection (if used)

---

## 🐛 Console Logging

### Setup Logger

```typescript
// utils/Logger.ts
const isProduction = !__DEV__;

export const logger = {
  debug: (message: string, data?: any) => {
    if (!isProduction) {
      console.log(`[DEBUG] ${message}`, data);
    }
  },

  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data);
  },

  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data);
  },

  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error);
  },
};
```

### Usage

```typescript
import { logger } from './utils/Logger';

logger.debug('Component mounted', { userId: '123' });
logger.info('User logged in');
logger.warn('API request slow', { duration: 5000 });
logger.error('Network failure', error);
```

### Disable Logs in Production

```typescript
if (!__DEV__) {
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
}
```

---

## 🧪 Jest Unit Tests

### Setup

Jest is included by default. Create test file:

```bash
touch App.test.tsx
```

### Basic Test

```typescript
// App.test.tsx
import renderer from 'react-test-renderer';
import App from './App';

describe('App', () => {
  test('renders correctly', () => {
    const instance = renderer.create(<App />).root;
    expect(instance.findByType(Text)).toBeDefined();
  });
});
```

### Testing Components

```typescript
import { render, screen, fireEvent } from '@testing-library/react-native';
import MyButton from './MyButton';

describe('MyButton', () => {
  test('renders with title', () => {
    render(<MyButton title="Click me" onPress={() => {}} />);
    expect(screen.getByText('Click me')).toBeTruthy();
  });

  test('calls onPress when pressed', () => {
    const mockOnPress = jest.fn();
    render(<MyButton title="Click" onPress={mockOnPress} />);

    const button = screen.getByRole('button');
    fireEvent.press(button);

    expect(mockOnPress).toHaveBeenCalled();
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react-native';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  test('increments counter', () => {
    const { result } = renderHook(() => useCounter());

    expect(result.current.count).toBe(0);

    act(() => {
      result.current.increment();
    });

    expect(result.current.count).toBe(1);
  });
});
```

### Testing Async Code

```typescript
import { renderHook, waitFor } from '@testing-library/react-native';
import { useFetchUser } from './useFetchUser';

describe('useFetchUser', () => {
  test('fetches user data', async () => {
    const { result } = renderHook(() => useFetchUser('123'));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.user).toEqual({ id: '123', name: 'John' });
  });
});
```

### Run Tests

```bash
# Run all tests
npm test

# Run in watch mode
npm test -- --watch

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test App.test.tsx
```

---

## 🎯 Integration Testing with Detox

### Installation

```bash
npm install detox-cli --global
npm install detox @react-native/detox-utils --save-dev
```

### Configuration

Create `e2e/config.json`:

```json
{
  "testRunner": "jest",
  "apps": {
    "ios": {
      "type": "ios.app",
      "binaryPath": "ios/build/Build/Products/Release-iphonesimulator/MyApp.app",
      "build": "xcodebuild -workspace ios/MyApp.xcworkspace -scheme MyApp -configuration Release -sdk iphonesimulator -derivedDataPath ios/build"
    }
  },
  "devices": {
    "simulator": {
      "type": "iOS.simulator",
      "device": { "type": "iPhone 14" }
    }
  },
  "configurations": {
    "ios": {
      "device": "simulator",
      "app": "ios"
    }
  }
}
```

### Test Example

```typescript
// e2e/firstTest.e2e.ts
describe('Login Flow', () => {
  beforeAll(async () => {
    await device.launchApp();
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  test('should login successfully', async () => {
    // Enter email
    await element(by.id('email-input')).typeText('test@example.com');

    // Enter password
    await element(by.id('password-input')).typeText('password123');

    // Tap login button
    await element(by.text('Sign In')).multiTap();

    // Wait for dashboard
    await waitFor(element(by.text('Dashboard')))
      .toBeVisible()
      .withTimeout(5000);

    // Verify logged in
    expect(element(by.text('Welcome'))).toBeVisible();
  });

  test('should show error for invalid email', async () => {
    await element(by.id('email-input')).typeText('invalid');
    await element(by.text('Sign In')).multiTap();

    await expect(element(by.text('Invalid email'))).toBeVisible();
  });
});
```

### Run Integration Tests

```bash
# Build app for testing
detox build-framework-cache
detox build-app -c ios

# Run tests
detox test -c ios

# Run specific test
detox test e2e/firstTest.e2e.ts -c ios
```

---

## 🔍 Debugging Strategies

### Add Logging Points

```typescript
const MyComponent = () => {
  useEffect(() => {
    logger.debug('Component mounted');
    return () => logger.debug('Component unmounted');
  }, []);

  const handlePress = () => {
    logger.debug('Button pressed', { timestamp: Date.now() });
    // ...
  };

  return <Pressable onPress={handlePress}><Text>Press</Text></Pressable>;
};
```

### Use Breakpoints

1. Open DevTools (`Cmd+D` or `Cmd+M`)
2. Tap "Debugger"
3. Set breakpoint by clicking line number
4. Reload app (`r` key)
5. Step through code

### Inspect Network Requests

1. Open DevTools
2. Go to Network tab
3. See all HTTP requests
4. Inspect headers, payload, response
5. Check response time and size

### React DevTools

```bash
npm install --save-dev @react-native-community/hooks
```

Inspector mode:
- Open DevTools
- Toggle inspector (magnifying glass icon)
- Tap component to inspect
- View props and state

---

## 📊 Performance Monitoring

### Measure Component Render

```typescript
import { PerformanceObserver, performance } from 'react-native';

const MyComponent = () => {
  const startMark = performance.now();

  useEffect(() => {
    const endMark = performance.now();
    console.log(`Render time: ${endMark - startMark}ms`);
  });

  return <View><Text>Content</Text></View>;
};
```

### Monitor Frame Rate

```typescript
import { PerformanceObserver } from 'react-native';

const observer = new PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    if (entry.name === 'RNRenderingComplete') {
      console.log(`Frame took ${entry.duration}ms`);
    }
  }
});

observer.observe({ entryTypes: ['measure'] });
```

---

## ✅ Testing Checklist

Before production:

- [ ] Unit tests for business logic (80%+ coverage)
- [ ] Integration tests for critical flows
- [ ] Manual testing on iOS and Android
- [ ] Manual testing on various device sizes
- [ ] Performance profiling completed
- [ ] Memory leaks checked
- [ ] Network error handling tested
- [ ] Offline mode tested
- [ ] Accessibility testing completed
- [ ] Error scenarios tested

---

**Source**: https://reactnative.dev/docs/testing-overview
**Version**: React Native 0.83
**Last Updated**: December 2025
