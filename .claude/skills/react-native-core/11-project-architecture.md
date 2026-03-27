# React Native 0.83.4 -- Project Architecture

Monorepo mobile app architecture patterns: feature modules, state management, styling, and file organization.

---

## Stack Reference

| Category | Technology | Version |
|----------|------------|---------|
| Framework | Expo | ~55.x |
| Language | TypeScript | ^5.9.x |
| State | Zustand | ^5.x |
| Server State | TanStack Query | ^5.x |
| API Client | graphql-request | ^7.x |
| Styling | NativeWind + Tailwind CSS v4 | ^5.x / ^4.x |
| Forms | React Hook Form + Zod | ^7.x / ^4.x |
| Storage | MMKV | ^4.x |
| Animations | Reanimated | ^4.2.x |
| Navigation | Expo Router | ^7.x |
| Testing | Jest + Testing Library + Maestro | -- |
| Linting | Biome | -- |

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
├── global.css                # Tailwind entry (CSS-first, v4 syntax)
└── package.json
```

---

## Route Files

Route files in `app/` are thin wrappers. No business logic belongs here.

### Screen Re-export

```typescript
// app/(main)/home.tsx
import { HomeScreen } from '@/features/home';

export default HomeScreen;
```

### Root Layout with Providers

```typescript
// app/_layout.tsx
import '../global.css';
import { Slot, useRouter, useSegments } from 'expo-router';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { queryClient } from '@/api/query-client';
import { useAuthStore } from '@/stores/auth.store';

export default function RootLayout(): React.ReactElement {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AuthGuard>
            <Slot />
          </AuthGuard>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

---

## Feature Modules

Each feature is a self-contained module with its own screens, components, hooks, API calls, schemas, and types.

### Feature Public Exports

```typescript
// src/features/auth/index.ts
// Screens
export { LoginScreen } from './screens/LoginScreen';
export { SignupScreen } from './screens/SignupScreen';

// API hooks
export { useLogin, useSignup, useLogout } from './api/hooks';

// Schemas
export { loginSchema, signupSchema } from './schemas/auth.schemas';
export type { LoginFormData, SignupFormData } from './schemas/auth.schemas';
```

### One Hook Per Screen Pattern

Every screen delegates all logic to a dedicated hook. The screen component only renders UI.

```typescript
// src/features/auth/hooks/useLoginScreen.ts
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { useLogin } from '../api/hooks';
import type { LoginFormData } from '../schemas/auth.schemas';

interface UseLoginScreenReturn {
  isLoading: boolean;
  error: string | null;
  handleSubmit: (data: LoginFormData) => Promise<void>;
}

export function useLoginScreen(): UseLoginScreenReturn {
  const router = useRouter();
  const loginMutation = useLogin();
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(data: LoginFormData): Promise<void> {
    setError(null);
    try {
      await loginMutation.mutateAsync(data);
      router.replace('/(main)/home');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    }
  }

  return {
    isLoading: loginMutation.isPending,
    error,
    handleSubmit,
  };
}
```

```typescript
// src/features/auth/screens/LoginScreen.tsx
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLoginScreen } from '../hooks/useLoginScreen';
import { LoginForm } from '../components/LoginForm';

export function LoginScreen(): React.ReactElement {
  const { isLoading, error, handleSubmit } = useLoginScreen();

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 px-6 pt-12">
        <Text className="text-3xl font-bold text-gray-900">Sign In</Text>
        {error && <Text className="mt-2 text-red-500">{error}</Text>}
        <LoginForm onSubmit={handleSubmit} isLoading={isLoading} />
      </View>
    </SafeAreaView>
  );
}
```

---

## State Management

### Zustand Store with MMKV Persistence

```typescript
// src/stores/auth.store.ts
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from '@/shared/utils/storage';

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

interface AuthActions {
  setAuth: (params: { accessToken: string; user: User }) => Promise<void>;
  clearAuth: () => Promise<void>;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set) => ({
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
    },
  ),
);
```

### State Categories

| Type | Solution | Location |
|------|----------|----------|
| Server state (cached API data) | TanStack Query | Feature `api/hooks.ts` |
| Client state (global) | Zustand | `src/stores/` |
| Form state | React Hook Form | Feature `components/` |
| UI state (local) | useState/useReducer | Component-level |
| Persisted state | Zustand + MMKV | `src/stores/` |

---

## API Layer

### TanStack Query Hooks

```typescript
// src/features/auth/api/hooks.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoginDocument } from '@app/server-client';
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
        user: data.user,
      });
    },
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: ['currentUser'],
    queryFn: async () => {
      const result = await executeGraphQL(CurrentUserDocument);
      return result.currentUser;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
```

---

## Form Validation

### Zod Schemas

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

export const signupSchema = loginSchema.extend({
  name: z.string().min(1, 'Name is required').max(100),
  confirmPassword: z.string().min(1, 'Confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type SignupFormData = z.infer<typeof signupSchema>;
```

---

## UI Components with NativeWind

### Button Component

```typescript
// src/shared/components/ui/Button.tsx
import { Pressable, ActivityIndicator } from 'react-native';
import { cn } from '@/shared/utils/cn';
import { Text } from './Text';

export interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  disabled?: boolean;
  className?: string;
  onPress?: () => void;
}

export function Button({
  title,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled,
  className,
  onPress,
}: ButtonProps): React.ReactElement {
  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-lg',
        variant === 'primary' && 'bg-primary-500 active:bg-primary-600',
        variant === 'secondary' && 'bg-gray-200 active:bg-gray-300',
        variant === 'outline' && 'border border-gray-300 active:bg-gray-50',
        size === 'sm' && 'px-3 py-2',
        size === 'md' && 'px-4 py-3',
        size === 'lg' && 'px-6 py-4',
        (disabled || isLoading) && 'opacity-50',
        className,
      )}
      disabled={disabled || isLoading}
      onPress={onPress}
    >
      {isLoading ? <ActivityIndicator /> : <Text>{title}</Text>}
    </Pressable>
  );
}
```

### className Merger Utility

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

```typescript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      ['module-resolver', { root: ['./'], alias: { '@': './src' } }],
    ],
  };
};
// NativeWind v5: no nativewind/babel preset, no jsxImportSource
// react-native-reanimated/plugin is auto-included by babel-preset-expo@55
```

### global.css

```css
/* NativeWind v5 + Tailwind v4 CSS-first imports */
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";

@theme {
  --color-primary-50: #EEF2FF;
  --color-primary-500: #6366F1;
  --color-primary-600: #4F46E5;
}
```

---

## File Placement Decision Tree

```
Need to add new code?
│
├─ Is it a route/screen?
│   └─ YES -> Create in app/, import screen from src/features/
│
├─ Is it feature-specific?
│   └─ YES -> Place in src/features/<feature>/
│       ├─ Component -> components/
│       ├─ Hook -> hooks/
│       ├─ API hook -> api/hooks.ts
│       ├─ Schema -> schemas/
│       └─ Type -> types/
│
├─ Is it used by 3+ features?
│   └─ YES -> Place in src/shared/
│       ├─ UI primitive -> components/ui/
│       ├─ Layout -> components/layout/
│       ├─ Hook -> hooks/
│       └─ Utility -> utils/
│
├─ Is it global client state?
│   └─ YES -> Place in src/stores/
│
└─ Is it API configuration?
    └─ YES -> Place in src/api/
```

---

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Component | PascalCase | `LoginForm.tsx` |
| Screen | PascalCase + Screen | `LoginScreen.tsx` |
| Hook | camelCase + use | `useLogin.ts` |
| Screen Hook | camelCase + useScreen | `useLoginScreen.ts` |
| Store | camelCase + .store | `auth.store.ts` |
| Schema | camelCase + .schemas | `auth.schemas.ts` |
| Test | same name + .test | `LoginForm.test.tsx` |
| Utility | camelCase | `cn.ts`, `error.ts` |
| Constants | UPPER_SNAKE_CASE | `const MS_PER_SECOND = 1000` |

---

## Rules

### ALWAYS

- Keep route files thin -- re-export screens from features
- Use the One Hook Per Screen pattern for all screens
- Co-locate related code inside feature modules
- Use NativeWind for all styling (never `StyleSheet.create`)
- Use Zustand for global client state, TanStack Query for server state
- Use MMKV for persistent storage (never AsyncStorage)
- Use `react-native-safe-area-context` (never `SafeAreaView` from `react-native`)
- Write tests alongside components in `__tests__/` directories
- Use Zod schemas for all form validation

### NEVER

- Put business logic in route files (`app/`)
- Put `useState`, `useMutation`, `useQuery`, or event handlers directly in screen components
- Create components over 150 lines
- Put feature-specific code in `shared/`
- Use Redux for state management
- Use AsyncStorage for persistence
- Skip tests for new features

---

## Peer Dependencies

```bash
# react-native-reanimated v4.x requires:
npm install react-native-worklets react-native-worklets-core

# react-native-mmkv v4.x requires:
npm install react-native-nitro-modules
```

---

**Version:** React Native 0.83.4 | Expo ~55.x | NativeWind ^5.x | Zustand ^5.x | TanStack Query ^5.x
**Source:** Project monorepo architecture standards
