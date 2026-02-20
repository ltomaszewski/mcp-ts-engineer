# Setup & Installation - React Native Testing Library

**Document URL:** https://oss.callstack.com/react-native-testing-library/docs/start/installation

**Version:** 13.3.3

---

## Prerequisites

- **Node.js:** v14 or higher
- **React Native:** v0.63 or higher
- **React:** v17 or higher
- **Jest:** v26 or higher (typically included with React Native)

---

## Installation Steps

### Step 1: Install React Native Testing Library

```bash
npm install --save-dev @testing-library/react-native
```

Or with Yarn:
```bash
yarn add --dev @testing-library/react-native
```

Or with Expo:
```bash
npx expo install @testing-library/react-native
```

### Step 2: Install React Test Renderer

**CRITICAL:** Match your React version exactly. Check your `package.json` for React version.

```bash
# Example: If using React 18.2.0
npm install --save-dev react-test-renderer@18.2.0
```

### Step 3: Verify Installation

Add this to your `package.json` to verify all dependencies:

```json
{
  "devDependencies": {
    "@testing-library/react-native": "^13.3.3",
    "jest": "^29.0.0",
    "react-test-renderer": "^18.2.0"
  }
}
```

---

## Jest Configuration

### Create jest.config.js

```javascript
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.js', '**/?(*.)+(spec|test).js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-async-storage|@react-native-community)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.{js,ts}',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

### Create jest.setup.js

```javascript
// Enable @testing-library/jest-native matchers
import '@testing-library/jest-native/extend-expect';

// Optional: Suppress act() warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === 'string' &&
      args[0].includes('Warning: ReactDOM.render')
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
```

---

## Expo Setup

### For Expo Projects (Easiest)

```bash
# Create new Expo project
npx create-expo-app MyApp
cd MyApp

# Install dependencies
npx expo install --save-dev @testing-library/react-native
npx expo install --save-dev jest
npx expo install --save-dev jest-expo
npx expo install --save-dev react-test-renderer
```

### Jest Config for Expo

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'jest-expo',
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testMatch: ['**/__tests__/**/*.{js,ts}', '**/?(*.)+(spec|test).{js,ts}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

### Update package.json Scripts

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

---

## Bare React Native Setup

### Installation

```bash
npm install --save-dev @testing-library/react-native jest react-test-renderer
```

### Jest Configuration

Create `jest.config.js`:

```javascript
module.exports = {
  preset: 'react-native',
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  testMatch: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(spec|test).[jt]s?(x)'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-navigation|@react-native-async-storage|react-native-gesture-handler)/)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
};
```

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

---

## Smoke Test

### Create a Simple Component

Create `src/Hello.tsx`:

```typescript
import React from 'react';
import { Text, View } from 'react-native';

interface HelloProps {
  name: string;
}

export const Hello: React.FC<HelloProps> = ({ name }) => (
  <View>
    <Text testID="greeting">Hello, {name}!</Text>
  </View>
);
```

### Create a Test File

Create `src/__tests__/Hello.test.tsx`:

```typescript
import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Hello } from '../Hello';

describe('Hello Component', () => {
  it('renders correct greeting message', () => {
    render(<Hello name="World" />);
    
    expect(screen.getByText('Hello, World!')).toBeOnTheScreen();
  });

  it('renders with custom name', () => {
    render(<Hello name="Alice" />);
    
    const greeting = screen.getByTestId('greeting');
    expect(greeting.props.children).toEqual(['Hello, ', 'Alice', '!']);
  });
});
```

### Run the Test

```bash
npm test
```

**Expected Output:**

```
 PASS  src/__tests__/Hello.test.tsx
  Hello Component
    ✓ renders correct greeting message (15 ms)
    ✓ renders with custom name (8 ms)

Tests:       2 passed, 2 total
Time:        2.345s
```

---

## Troubleshooting Setup

### Issue: "Cannot find module 'react-test-renderer'"

```bash
# Check your React version
npm list react

# Install matching react-test-renderer
npm install --save-dev react-test-renderer@<your-react-version>
```

### Issue: "ReferenceError: regeneratorRuntime is not defined"

Create or update `.babelrc`:

```json
{
  "presets": ["module:metro-react-native-babel-preset"]
}
```

### Issue: "Timeout - Async callback was not invoked"

Increase timeout in `jest.setup.js`:

```javascript
jest.setTimeout(10000); // 10 seconds
```

---

## Verification Checklist

After setup, verify:

- [ ] Jest runs without errors: `npm test`
- [ ] Smoke test passes
- [ ] Watch mode works: `npm test -- --watch`
- [ ] Coverage works: `npm test -- --coverage`
- [ ] TypeScript compiles (if used): `tsc --noEmit`
- [ ] No missing peer dependencies in output

---

**Next:** [Core API Reference →](./02-core-api.md)
