# React Native Project Architecture

**Bastion Monorepo Mobile App Standards**

> **Source**: `/.claude/knowledge-base/react-native-mobile-architecture.md`

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

// API hooks
export { useLogin, useSignup, useLogout } from './api/hooks';

// Schemas
export { loginSchema, signupSchema } from './schemas/auth.schemas';
export type { LoginFormData, SignupFormData } from './schemas/auth.schemas';
```

### 3. Zustand Store

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

### 4. API Hooks with TanStack Query

```typescript
// src/features/auth/api/hooks.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { LoginDocument } from '@bastion/server-client';

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

### 5. Form with Validation

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

### 6. UI Components with NativeWind

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
  return (
    <Pressable
      className={cn(
        'items-center justify-center rounded-lg',
        variant === 'primary' && 'bg-primary-500 active:bg-primary-600',
        variant === 'secondary' && 'bg-gray-200 active:bg-gray-300',
        size === 'sm' && 'px-3 py-2',
        size === 'md' && 'px-4 py-3',
        size === 'lg' && 'px-6 py-4',
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

### 7. Utility: className Merger

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

### FORBIDDEN (Build Fails)

- **ANY business logic in screen files** - This is CRITICAL, enforced by audit
  - NO `useState()` in screens
  - NO event handlers in screens
  - NO `useMutation()` / `useQuery()` in screens
  - NO validation logic in screens
  - **ALL logic MUST be in `use*Screen` hook**
  - **Violation = Audit fails and blocks merge**

### DON'T

- Put business logic in route files (`app/`) - use features instead
- Create god components (>150 lines)
- Use `any` type
- Skip tests for new features
- Put feature-specific code in `shared/`
- Use StyleSheet.create (use NativeWind)
- Use Redux (use Zustand + TanStack Query)
- Use AsyncStorage (use MMKV)

### DO

- Keep routes thin (re-export from features)
- Write tests alongside components
- Use TypeScript strictly
- Co-locate related code in features
- Extract to shared only after proven reuse
- Use NativeWind for all styling

---

## Peer Dependencies (CRITICAL)

```bash
# react-native-reanimated v4.x requires:
npm install react-native-worklets react-native-worklets-core

# react-native-mmkv v4.x requires:
npm install react-native-nitro-modules
```

---

**Source**: `/.claude/knowledge-base/react-native-mobile-architecture.md`
**Last Updated**: December 2025
