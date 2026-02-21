# React Native Mobile Architecture Guide

**Version**: 1.0
**Last Updated**: 2025-12-28
**Applies To**: All React Native/Expo mobile apps in the monorepo

---

## Quick Reference

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Expo | ~54.x |
| Language | TypeScript | ~5.9.x |
| State | Zustand | ^5.x |
| Server State | TanStack Query | ^5.x |
| API Client | graphql-request | ^7.x |
| Styling | NativeWind + Tailwind CSS v3 | ^4.2.x / ^3.4.x |
| Forms | React Hook Form + Zod | ^7.x / ^3.x |
| Storage | MMKV | ^4.x |
| Animations | Reanimated | ~4.1.x |
| Navigation | Expo Router | ^6.x |
| Testing | Jest + Testing Library + Maestro | - |
| Linting | Biome | - |

---

## Directory Structure

```
apps/<app-name>/
├── app/                      # Expo Router (routing ONLY)
│   ├── _layout.tsx           # Root layout with providers
│   ├── index.tsx             # Entry redirect
│   ├── (auth)/               # Auth route group
│   │   ├── _layout.tsx
│   │   ├── intro.tsx
│   │   ├── login.tsx
│   │   └── signup.tsx
│   └── (main)/               # Main app route group
│       ├── _layout.tsx
│       └── home.tsx
│
├── src/
│   ├── api/                  # Global API configuration
│   │   ├── graphql-client.ts # GraphQL client setup
│   │   ├── query-client.ts   # TanStack Query client
│   │   └── index.ts
│   │
│   ├── features/             # Feature modules (PRIMARY)
│   │   └── <feature>/
│   │       ├── api/          # Feature-specific API hooks
│   │       │   └── hooks.ts
│   │       ├── components/   # Feature-specific components
│   │       │   ├── __tests__/
│   │       │   └── Component.tsx
│   │       ├── screens/      # Feature screens
│   │       │   ├── __tests__/
│   │       │   └── Screen.tsx
│   │       ├── schemas/      # Zod validation schemas
│   │       │   ├── __tests__/
│   │       │   └── feature.schemas.ts
│   │       ├── hooks/        # Feature-specific hooks
│   │       ├── types/        # Feature-specific types
│   │       └── index.ts      # Public exports
│   │
│   ├── shared/               # Shared across 3+ features
│   │   ├── components/
│   │   │   ├── layout/       # Layout components
│   │   │   │   └── ScreenContainer.tsx
│   │   │   └── ui/           # UI primitives
│   │   │       ├── __tests__/
│   │   │       ├── Button.tsx
│   │   │       ├── Input.tsx
│   │   │       ├── Text.tsx
│   │   │       └── index.ts
│   │   ├── config/           # Environment configuration
│   │   │   └── env.ts
│   │   ├── hooks/            # Shared hooks
│   │   └── utils/            # Utility functions
│   │       ├── __tests__/
│   │       ├── cn.ts         # className merger
│   │       ├── error.ts      # Error extraction
│   │       ├── storage.ts    # MMKV storage
│   │       └── secure-storage.ts
│   │
│   └── stores/               # Zustand global stores
│       ├── __tests__/
│       ├── auth.store.ts
│       └── index.ts
│
├── .maestro/                 # E2E test flows
├── assets/                   # Static assets
├── global.css                # Tailwind entry
├── tailwind.config.js        # Tailwind configuration
├── metro.config.js           # Metro bundler config
├── babel.config.js           # Babel config
├── jest.config.js            # Jest configuration
├── jest.setup.js             # Jest setup
├── app.json                  # Expo configuration
├── tsconfig.json             # TypeScript config
└── package.json
```

---

## Core Patterns

### 1. Route Files (app/)

**Route files are thin wrappers - no business logic.**

```typescript
// app/(main)/home.tsx
import { HomeScreen } from '@/features/home';
export default HomeScreen;
```

```typescript
// app/_layout.tsx
import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { queryClient } from '@/api/query-client';
import { useAuthStore } from '@/stores/auth.store';

function AuthGuard({ children }: { children: React.ReactNode }): React.ReactElement {
  const router = useRouter();
  const segments = useSegments();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(auth)';

    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/intro');
    } else if (isAuthenticated && inAuthGroup) {
      router.replace('/(main)/home');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) return <LoadingSpinner />;
  return <>{children}</>;
}

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <AuthGuard>
          <Slot />
        </AuthGuard>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
```

### 2. Feature Modules

**Self-contained, co-located code per domain.**

```typescript
// src/features/auth/index.ts
// Screens
export { LoginScreen } from './screens/LoginScreen';
export { SignupScreen } from './screens/SignupScreen';
export { IntroScreen } from './screens/IntroScreen';

// API hooks
export { useLogin, useSignup, useLogout } from './api/hooks';

// Schemas
export { loginSchema, signupSchema } from './schemas/auth.schemas';
export type { LoginFormData, SignupFormData } from './schemas/auth.schemas';
```

### 3. One Hook Per Screen Pattern (MANDATORY - AUDIT ENFORCED)

**⚠️ CRITICAL RULE - ENFORCED BY AUDIT COMMAND**

Every screen must have a single custom hook containing **ALL business logic**. Screens must be pure JSX rendering only.

**Violation = Build fails. Non-negotiable.**

**Pattern Structure:**
```
Screen file (40-60 lines MAX):
  ✓ Import statements
  ✓ Single useScreenHook() call
  ✓ Pure JSX rendering
  ✗ NO useState, NO handlers, NO useEffect, NO logic

Hook file (useScreenName.ts, 100-200 lines):
  ✓ State management (useState)
  ✓ Validation logic
  ✓ Event handlers (const handleX = async () => { ... })
  ✓ API calls (useMutation, useQuery)
  ✓ Navigation logic (useRouter hooks)
  ✓ Error handling (try/catch)
```

**Why:**
- ✅ Testable: Test hook logic without rendering components
- ✅ Reusable: Hook can be used in multiple screens if needed
- ✅ Maintainable: Clear separation = easier changes
- ✅ Readable: Screen file shows what it renders, hook shows how it works

**Bad Pattern (❌ DON'T):**
```typescript
// Screen with all business logic mixed in - AVOID THIS
export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async () => {
    // Validation logic
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    // API call
    try {
      const response = await apiCall({ email, password });
      // Store update
      updateAuthStore(response.token);
      // Navigation
      router.replace('/(tabs)');
    } catch (err) {
      setFormError(err.message);
    }
  };

  // 50+ lines of event handlers, state, logic...

  return (
    <ScrollView>
      {/* JSX here */}
    </ScrollView>
  );
}
```

**Good Pattern (✅ DO):**

**1. Create custom hook for screen:**
```typescript
// src/features/auth/hooks/useLoginScreen.ts
export function useLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { login, isLoading, error } = useLogin();
  const { appleLogin, isLoading: isAppleLoading } = useAppleAuth();

  const isLoading = isEmailLoading || isAppleLoading;

  const handleLogin = async () => {
    setFormError(null);

    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!password.trim()) {
      setFormError('Password is required');
      return;
    }

    try {
      await login({ email: email.trim(), password });
      router.replace('/(tabs)');
    } catch {
      setFormError(error || 'Login failed. Please try again.');
    }
  };

  const handleAppleLogin = async () => {
    setFormError(null);
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        await appleLogin({ identityToken: credential.identityToken });
        router.replace('/(tabs)');
      } else {
        setFormError('Apple Sign-In failed. Please try again.');
      }
    } catch (err) {
      if (err instanceof Error && err.message === 'Canceled') return;
      setFormError(err instanceof Error ? err.message : 'Apple Sign-In failed.');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    formError,
    isLoading,
    handleLogin,
    handleAppleLogin,
  };
}
```

**2. Screen becomes pure rendering (30-40 lines):**
```typescript
// app/(auth)/login.tsx
import { LoginScreen } from '@/features/auth';
export default LoginScreen;
```

```typescript
// src/features/auth/screens/LoginScreen.tsx
import { useLoginScreen } from '../hooks/useLoginScreen';
import { Button } from '@/shared/components/ui/Button';
import { Input } from '@/shared/components/ui/Input';
import * as AppleAuthentication from 'expo-apple-authentication';
import { Link } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

export function LoginScreen() {
  const {
    email,
    setEmail,
    password,
    setPassword,
    formError,
    isLoading,
    handleLogin,
    handleAppleLogin,
  } = useLoginScreen();

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6 py-12">
        <View className="mb-8">
          <Text className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</Text>
          <Text className="text-lg text-gray-600">Sign in to your account</Text>
        </View>

        {formError && (
          <View className="mb-4 p-3 bg-red-100 border border-red-300 rounded-lg">
            <Text className="text-red-700">{formError}</Text>
          </View>
        )}

        <View className="mb-4">
          <Text className="text-sm font-medium text-gray-700 mb-2">Email</Text>
          <Input
            testID="email-input"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            editable={!isLoading}
            keyboardType="email-address"
          />
        </View>

        <View className="mb-6">
          <Text className="text-sm font-medium text-gray-700 mb-2">Password</Text>
          <Input
            testID="password-input"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
            secureTextEntry
          />
        </View>

        <Button
          testID="login-button"
          variant="primary"
          size="lg"
          onPress={handleLogin}
          disabled={isLoading}
          className="mb-4"
        >
          {isLoading ? 'Signing In...' : 'Sign In'}
        </Button>

        <View className="flex-row items-center mb-4">
          <View className="flex-1 h-px bg-gray-300" />
          <Text className="mx-3 text-gray-500">or</Text>
          <View className="flex-1 h-px bg-gray-300" />
        </View>

        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={{ height: 50, marginBottom: 16 }}
          onPress={handleAppleLogin}
        />

        <View className="flex-row justify-center">
          <Text className="text-gray-600">Don't have an account? </Text>
          <Link href="/(auth)/signup" asChild>
            <Text className="text-blue-600 font-semibold">Sign Up</Text>
          </Link>
        </View>
      </View>
    </ScrollView>
  );
}
```

**3. Test hook logic independently:**
```typescript
// src/features/auth/hooks/__tests__/useLoginScreen.test.ts
import { renderHook, act } from '@testing-library/react-native';
import { useLoginScreen } from '../useLoginScreen';

jest.mock('../useLogin');
jest.mock('../useAppleAuth');

describe('useLoginScreen', () => {
  it('validates email is required', async () => {
    const { result } = renderHook(() => useLoginScreen());

    act(() => {
      result.current.handleLogin();
    });

    expect(result.current.formError).toBe('Email is required');
  });

  it('calls login with trimmed email', async () => {
    const { result } = renderHook(() => useLoginScreen());

    act(() => {
      result.current.setEmail('  test@example.com  ');
      result.current.setPassword('password123');
    });

    await act(async () => {
      await result.current.handleLogin();
    });

    // Verify login was called with trimmed email
  });
});
```

**File Structure:**
```
src/features/auth/
├── hooks/
│   ├── useLoginScreen.ts        ← All logic for login screen
│   ├── useSignupScreen.ts       ← All logic for signup screen
│   ├── useLogin.ts              ← API mutation (shared)
│   ├── useAppleAuth.ts          ← API mutation (shared)
│   └── __tests__/
│       └── useLoginScreen.test.ts
├── screens/
│   ├── LoginScreen.tsx          ← ~40 lines pure JSX
│   ├── SignupScreen.tsx         ← ~40 lines pure JSX
│   └── __tests__/
│       └── LoginScreen.test.tsx
└── index.ts
```

**Key Points:**
- Screen hook contains: useState, event handlers, validation, API orchestration, navigation
- Shared API hooks (useLogin, useAppleAuth) stay separate - they handle ONLY API calls
- Screen hook USES shared API hooks - it orchestrates them
- Screen component is a pure render function calling the hook

---

### 4. Zustand Store

**Global client state with persistence.**

```typescript
// src/stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (params: AuthParams) => Promise<void>;
  clearAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setAuth: async ({ accessToken, user }) => {
        await saveTokens({ accessToken });
        set({ accessToken, user, isAuthenticated: true, isLoading: false });
      },

      clearAuth: async () => {
        await clearTokens();
        set({ accessToken: null, user: null, isAuthenticated: false, isLoading: false });
      },

      initialize: async () => {
        // Check token expiry, restore state
        set({ isLoading: false });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
```

### 5. API Hooks with TanStack Query

```typescript
// src/features/auth/api/hooks.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoginDocument, SignupDocument } from '@org/server-client';

import { executeGraphQL } from '@/api/graphql-client';
import { useAuthStore } from '@/stores/auth.store';

export function useLogin() {
  const setAuth = useAuthStore((state) => state.setAuth);

  return useMutation({
    mutationFn: async (input: { email: string; password: string }) => {
      const result = await executeGraphQL(LoginDocument, { input });
      return result.login;
    },
    onSuccess: async (data) => {
      await setAuth({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        expiresIn: data.expiresIn,
        user: data.user,
      });
    },
  });
}
```

### 6. Form with Validation

```typescript
// src/features/auth/schemas/auth.schemas.ts
import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email is required')
    .email('Please enter a valid email'),
  password: z
    .string()
    .min(1, 'Password is required')
    .min(8, 'Password must be at least 8 characters'),
});

export type LoginFormData = z.infer<typeof loginSchema>;
```

```typescript
// src/features/auth/components/LoginForm.tsx
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input } from '@/shared/components/ui';
import { loginSchema, type LoginFormData } from '../schemas/auth.schemas';
import { useLogin } from '../api/hooks';

export function LoginForm(): React.ReactElement {
  const { mutate: login, isPending } = useLogin();

  const { control, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormData): void => {
    login({ email: data.email, password: data.password });
  };

  return (
    <View className="gap-4">
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Email"
            value={value}
            onChangeText={onChange}
            onBlur={onBlur}
            error={errors.email?.message}
          />
        )}
      />
      <Button title="Sign In" onPress={handleSubmit(onSubmit)} isLoading={isPending} />
    </View>
  );
}
```

### 7. UI Components with NativeWind

**⚠️ CRITICAL: Use `Pressable` for ALL interactive elements. Never use `TouchableWithoutFeedback`.**

```typescript
// src/shared/components/ui/Button.tsx
import { Pressable, ActivityIndicator } from 'react-native';
import { cn } from '@/shared/utils/cn';
import { Text } from './Text';

export interface ButtonProps extends Omit<PressableProps, 'children'> {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  ...props
}: ButtonProps): React.ReactElement {
  const variantClasses = {
    primary: 'bg-primary-500 active:bg-primary-600',
    secondary: 'bg-gray-200 active:bg-gray-300',
    outline: 'border-2 border-primary-500',
    ghost: 'active:bg-gray-100',
  };

  const sizeClasses = {
    sm: 'px-3 py-2',
    md: 'px-4 py-3',
    lg: 'px-6 py-4',
  };

  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-lg',
        variantClasses[variant],
        sizeClasses[size],
        (disabled || isLoading) && 'opacity-50',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? <ActivityIndicator /> : <Text>{title}</Text>}
    </Pressable>
  );
}
```

**Example: Keyboard Dismissal Pattern**

For dismissing the keyboard by tapping the background, use `Pressable`:

```typescript
// ✅ CORRECT - Use Pressable for keyboard dismissal
import { Keyboard, KeyboardAvoidingView, Pressable, View } from 'react-native';

export function LoginForm() {
  return (
    <KeyboardAvoidingView behavior="padding" className="flex-1">
      <Pressable onPress={Keyboard.dismiss} className="flex-1">
        <View className="flex-1 justify-center px-5">
          {/* Form content */}
        </View>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

// ❌ WRONG - Never use TouchableWithoutFeedback
// import { TouchableWithoutFeedback, Keyboard } from 'react-native';
// <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
//   <View>{/* ... */}</View>
// </TouchableWithoutFeedback>
```

**Why Pressable over TouchableWithoutFeedback:**

| Aspect | Pressable | TouchableWithoutFeedback |
|--------|-----------|-------------------------|
| **Status** | ✅ Modern, recommended | ⚠️ Legacy API |
| **Active State** | ✅ Supported via `Pressed` state | ❌ Limited |
| **Long Press** | ✅ Built-in via `onLongPress` | ❌ Not supported |
| **Hover** | ✅ Supported (Android/web) | ❌ No support |
| **Future-proof** | ✅ React Native is moving toward it | ❌ Being phased out |
| **Consistency** | ✅ One component for all interactions | ⚠️ Separate for no-feedback |

**Note**: For keyboard dismissal, the keyboard disappearing IS the visual feedback, so lack of active state styling is acceptable. But use `Pressable` for consistency and maintainability.

### 8. Utility: className Merger

```typescript
// src/shared/utils/cn.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

---

## Configuration Files

### babel.config.js

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
    plugins: [
      ['module-resolver', { root: ['./'], alias: { '@': './src' } }],
      'react-native-reanimated/plugin', // MUST be last
    ],
  };
};
```

### metro.config.js

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

const config = getDefaultConfig(projectRoot);

// Exclude other apps from bundling
config.resolver.blockList = [
  /apps\/server\/.*/,
  /apps\/other-app\/.*/,
];

config.watchFolders = [monorepoRoot];

module.exports = withNativeWind(config, { input: './global.css' });
```

### tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#EEF2FF',
          500: '#6366F1',
          600: '#4F46E5',
        },
      },
    },
  },
  plugins: [],
};
```

### global.css

```css
/* IMPORTANT: Use Tailwind v3 syntax, NOT v4 */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

### tsconfig.json

```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["**/*.ts", "**/*.tsx", ".expo/types/**/*.ts", "expo-env.d.ts"]
}
```

---

## Testing Patterns

### Unit Tests (Jest + Testing Library)

```typescript
// src/features/auth/components/__tests__/LoginForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { LoginForm } from '../LoginForm';

const mockLogin = jest.fn();
jest.mock('../../api/hooks', () => ({
  useLogin: () => ({ mutate: mockLogin, isPending: false }),
}));

describe('LoginForm', () => {
  it('validates email format', async () => {
    render(<LoginForm />);

    fireEvent.changeText(screen.getByTestId('email-input'), 'invalid');
    fireEvent.press(screen.getByTestId('sign-in-button'));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email')).toBeTruthy();
    });
  });

  it('calls login with valid data', async () => {
    render(<LoginForm />);

    fireEvent.changeText(screen.getByTestId('email-input'), 'test@example.com');
    fireEvent.changeText(screen.getByTestId('password-input'), 'password123');
    fireEvent.press(screen.getByTestId('sign-in-button'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith(
        { email: 'test@example.com', password: 'password123' },
        expect.any(Object)
      );
    });
  });
});
```

### E2E Tests (Maestro)

```yaml
# .maestro/auth/login-flow.yaml
appId: com.example.app
---
- launchApp
- assertVisible: "Welcome Back"
- tapOn:
    id: "email-input"
- inputText: "test@example.com"
- tapOn:
    id: "password-input"
- inputText: "password123"
- tapOn:
    id: "sign-in-button"
- assertVisible: "Home"
```

---

## Peer Dependencies (CRITICAL)

```bash
# react-native-reanimated v4.x requires:
npm install react-native-worklets react-native-worklets-core

# react-native-mmkv v4.x requires:
npm install react-native-nitro-modules
```

---

## File Placement Decision Tree

```
Need to add new code?
│
├─ Is it a route/screen?
│   └─ YES → Create in app/, import screen from src/features/
│
├─ Is it feature-specific?
│   └─ YES → Place in src/features/<feature>/
│       ├─ Component → components/
│       ├─ Hook → hooks/
│       ├─ API hook → api/hooks.ts
│       ├─ Schema → schemas/
│       └─ Type → types/
│
├─ Is it used by 3+ features?
│   └─ YES → Place in src/shared/
│       ├─ UI primitive → components/ui/
│       ├─ Layout → components/layout/
│       ├─ Hook → hooks/
│       └─ Utility → utils/
│
├─ Is it global client state?
│   └─ YES → Place in src/stores/
│
└─ Is it API configuration?
    └─ YES → Place in src/api/
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `LoginForm.tsx` |
| Screen | PascalCase + Screen | `LoginScreen.tsx` |
| Hook | camelCase + use | `useLogin.ts` |
| Store | camelCase + .store | `auth.store.ts` |
| Schema | camelCase + .schemas | `auth.schemas.ts` |
| Test | same name + .test | `LoginForm.test.tsx` |
| Utility | camelCase | `cn.ts`, `error.ts` |
| Constants | UPPER_SNAKE_CASE | `const MS_PER_SECOND = 1000` |

---

## Anti-Patterns & Hard Rules

### 🚫 FORBIDDEN (Build Fails)

- **ANY business logic in screen files** - This is CRITICAL, enforced by audit
  - ✗ NO `useState()` in screens
  - ✗ NO event handlers in screens
  - ✗ NO `useMutation()` / `useQuery()` in screens
  - ✗ NO validation logic in screens
  - ✗ **ALL logic MUST be in `use*Screen` hook**
  - **Violation = Audit fails and blocks merge**

- **Using `TouchableWithoutFeedback` for ANY interaction** - Use `Pressable` instead
  - ✗ NO `TouchableWithoutFeedback` for buttons, links, or interactive elements
  - ✗ NO `TouchableWithoutFeedback` for keyboard dismissal patterns
  - ✅ ALWAYS use `Pressable` - it's modern, flexible, and future-proof
  - **Why**: `TouchableWithoutFeedback` is legacy. React Native is moving away from it. `Pressable` supports all use cases (with or without visual feedback)

- **Using `SafeAreaView` from `react-native`** - Use `react-native-safe-area-context` instead
  - ✗ NO `import { SafeAreaView } from 'react-native'` - This is the OLD pattern
  - ✅ ALWAYS use `import { SafeAreaView } from 'react-native-safe-area-context'`
  - ✅ OR use `useSafeAreaInsets()` hook for programmatic control
  - **Pattern for layouts**: `<SafeAreaView edges={['top']} className="...">` with explicit edges
  - **Pattern for screens**: Use `useSafeAreaInsets()` hook and apply padding manually
  - **Why**: `react-native-safe-area-context` provides better iOS device support, explicit edge control, and is the Expo-recommended solution

### ⚠️ DON'T

- Put business logic in route files (`app/`) - use features instead
- Create god components (>150 lines)
- Use `any` type
- Skip tests for new features
- Put feature-specific code in `shared/`
- Use StyleSheet.create (use NativeWind)
- Use Redux (use Zustand + TanStack Query)
- Use AsyncStorage (use MMKV)
- Use `SafeAreaView` from `react-native` (use `react-native-safe-area-context`)

### DO

- Keep routes thin (re-export from features)
- Write tests alongside components
- Use TypeScript strictly
- Co-locate related code in features
- Extract to shared only after proven reuse
- Use NativeWind for all styling
- **Use `Pressable` for ALL interactive elements** (buttons, links, dismissal patterns, etc.)
- **Use `SafeAreaView` from `react-native-safe-area-context`** or `useSafeAreaInsets()` hook

---

## Component Duplication Prevention (MANDATORY - AUDIT ENFORCED)

### Overview

Component duplication is a critical anti-pattern that leads to:
- DRY violations and maintenance burden
- Inconsistent features across components
- Accessibility gaps (some components missing features)
- Harder onboarding for new developers

**Rule**: Before creating ANY new UI component, check if a similar component exists and can be extended with variants.

### UI Component Registry

**Shared UI Components** (`src/shared/components/ui/`):

| Component | Variants | Features | Location |
|-----------|----------|----------|----------|
| `Button` | primary, secondary, ghost, danger | sizes, loading, disabled | `src/shared/components/ui/Button.tsx` |
| `Input` | light, dark | sizes, error state, label, focus visual, ref forwarding | `src/shared/components/ui/Input.tsx` |
| `Text` | default | typography tokens | `src/shared/components/ui/Text.tsx` |
| `Toast` | success, error, warning, info | auto-dismiss, actions | `src/shared/components/ui/Toast.tsx` |

**⚠️ CRITICAL**: If a component exists in this registry, you MUST use it or extend it via variant. Do NOT create a new component.

### Variant-First Pattern (MANDATORY)

**Rule**: Same base behavior + different styling = Add variant, NOT new component.

```typescript
// ❌ WRONG: Two separate components for different themes
<Input />              // Light theme in src/shared/
<CustomTextInput />    // Dark theme in src/features/auth/

// ✅ CORRECT: Single component with variant prop
<Input variant="light" />
<Input variant="dark" />
```

**When to Add Variant vs New Component:**

| Scenario | Action |
|----------|--------|
| Same behavior, different colors/styling | Add `variant` prop |
| Same behavior, different sizes | Add `size` prop |
| Same behavior, different theme (light/dark) | Add `variant` prop |
| Different interaction model | New component (document why) |
| Different behavior entirely | New component (document why) |

### Pre-Creation Checklist (MANDATORY)

**Before creating ANY new component in `src/shared/components/ui/` or `src/features/*/components/`:**

1. [ ] **Registry Check**: Is a similar component already in the UI Component Registry above?
2. [ ] **Shared Search**: Search `src/shared/components/ui/` for similar component names
3. [ ] **Feature Search**: Search `src/features/*/components/` for similar component names
4. [ ] **Variant Possible?**: Can the existing component be extended with a variant?
5. [ ] **Document If New**: If creating new, add to the component registry and document why variant wasn't possible

**Search Commands:**
```bash
# Find all component files
find src -name "*.tsx" -path "*/components/*" | xargs grep -l "export function\|export const"

# Search for Input-like components
grep -r "TextInput\|input" src/shared/components src/features/*/components --include="*.tsx" -l
```

### Feature-to-Shared Promotion Rules

**When to Move Feature Component to Shared:**

1. **Used in 3+ features** - Component is imported by 3+ different feature modules
2. **Stable API** - No breaking changes in past 2+ weeks of development
3. **Variants Documented** - All variants and props are documented
4. **Tests Exist** - Unit tests cover main functionality

**Promotion Process:**
1. Move component to `src/shared/components/ui/`
2. Update all imports in features
3. Add to UI Component Registry above
4. Delete any duplicate/similar components in features
5. Create redirect/deprecation notice if needed

### Known Duplication Issues (Tech Debt)

Track component duplication issues here. These should be resolved:

| Issue | Status | Spec Location |
|-------|--------|---------------|
| `Input.tsx` vs `CustomTextInput.tsx` | TODO | `docs/specs/app/todo/input-component-merge.md` |

**When adding new tech debt:**
1. Create spec in `docs/specs/app/todo/YYYY-MM-DD-description.md`
2. Add row to this table
3. Set status: TODO → IN_PROGRESS → DONE (then remove row)

---

## Related Documentation

- `docs/MELLOW_MOBILE_TECH_STACK_2025.md` - Full tech stack details
- `docs/MOBILE_FILE_ORGANIZATION.md` - Detailed file organization guide
- `.claude/skills/` - Individual technology skill guides
- `docs/specs/app/todo/` - Pending component work and tech debt
