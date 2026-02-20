# React Native 0.83 - Best Practices

**Performance, Security, Accessibility, and Common Pitfalls**

---

## 🏗️ One Hook Per Screen Pattern (MANDATORY)

> **⚠️ CRITICAL: This pattern is AUDIT ENFORCED in the project. Violations block merges.**

Every screen must have a single custom hook containing **ALL business logic**. Screens must be pure JSX rendering only.

### Pattern Structure

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

### Why This Pattern

- ✅ **Testable**: Test hook logic without rendering components
- ✅ **Reusable**: Hook can be used in multiple screens if needed
- ✅ **Maintainable**: Clear separation = easier changes
- ✅ **Readable**: Screen file shows what it renders, hook shows how it works

### ❌ BAD Pattern (DO NOT USE)

```typescript
// Screen with all business logic mixed in - AVOID THIS
export function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }
    try {
      const response = await apiCall({ email, password });
      updateAuthStore(response.token);
      router.replace('/(tabs)');
    } catch (err) {
      setFormError(err.message);
    }
  };

  return (
    <ScrollView>
      {/* 50+ lines of JSX mixed with logic */}
    </ScrollView>
  );
}
```

### ✅ GOOD Pattern (USE THIS)

**1. Create custom hook for screen:**

```typescript
// src/features/auth/hooks/useLoginScreen.ts
export function useLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const { mutateAsync: login, isPending } = useLogin();

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
      setFormError('Login failed. Please try again.');
    }
  };

  return {
    email,
    setEmail,
    password,
    setPassword,
    formError,
    isLoading: isPending,
    handleLogin,
  };
}
```

**2. Screen becomes pure rendering (30-40 lines):**

```typescript
// src/features/auth/screens/LoginScreen.tsx
import { useLoginScreen } from '../hooks/useLoginScreen';
import { Button, Input } from '@/shared/components/ui';
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
  } = useLoginScreen();

  return (
    <ScrollView className="flex-1 bg-white">
      <View className="flex-1 justify-center px-6 py-12">
        {formError && (
          <View className="mb-4 p-3 bg-red-100 rounded-lg">
            <Text className="text-red-700">{formError}</Text>
          </View>
        )}

        <Input
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          editable={!isLoading}
        />

        <Input
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          editable={!isLoading}
        />

        <Button
          title={isLoading ? 'Signing In...' : 'Sign In'}
          onPress={handleLogin}
          disabled={isLoading}
        />
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

jest.mock('../../api/hooks');

describe('useLoginScreen', () => {
  it('validates email is required', async () => {
    const { result } = renderHook(() => useLoginScreen());

    act(() => {
      result.current.handleLogin();
    });

    expect(result.current.formError).toBe('Email is required');
  });
});
```

### File Structure

```
src/features/auth/
├── hooks/
│   ├── useLoginScreen.ts        ← All logic for login screen
│   ├── useSignupScreen.ts       ← All logic for signup screen
│   ├── useLogin.ts              ← API mutation (shared)
│   └── __tests__/
│       └── useLoginScreen.test.ts
├── screens/
│   ├── LoginScreen.tsx          ← ~40 lines pure JSX
│   ├── SignupScreen.tsx         ← ~40 lines pure JSX
│   └── __tests__/
│       └── LoginScreen.test.tsx
└── index.ts
```

---

## ⚡ Performance Optimization

### FlatList Tuning

```typescript
import { FlatList, memo, useCallback } from 'react-native';

const ListItem = memo(({ item, onPress }: any) => (
  <View onPress={() => onPress(item.id)}>
    <Text>{item.title}</Text>
  </View>
));

<FlatList
  // DATA
  data={largeList}
  keyExtractor={(item) => item.id}

  // RENDERING
  renderItem={({ item }) => <ListItem item={item} onPress={handlePress} />}
  initialNumToRender={10}         // Initial count
  maxToRenderPerBatch={10}        // Per batch
  updateCellsBatchingPeriod={50}  // Batch interval (ms)
  windowSize={5}                   // Ahead/behind items

  // PERFORMANCE
  removeClippedSubviews={true}    // Android: remove off-screen
  scrollEventThrottle={16}        // 60fps throttle (16ms)

  // PAGINATION
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}     // 50% from end
/>
```

### Memoization Pattern

```typescript
import { memo, useCallback, useMemo } from 'react';

// Memoize expensive component
const UserCard = memo(({ user, onPress }: any) => (
  <Pressable onPress={onPress}>
    <Text>{user.name}</Text>
  </Pressable>
), (prevProps, nextProps) => {
  // Custom comparison (return true if equal, false if different)
  return prevProps.user.id === nextProps.user.id;
});

// Parent component
const UserList = ({ users }: any) => {
  // Memoize callback
  const handleUserPress = useCallback((userId: string) => {
    console.log('Pressed:', userId);
  }, []);

  // Memoize expensive computation
  const sortedUsers = useMemo(() => {
    return users.slice().sort((a, b) => a.name.localeCompare(b.name));
  }, [users]);

  return (
    <FlatList
      data={sortedUsers}
      renderItem={({ item }) => (
        <UserCard user={item} onPress={() => handleUserPress(item.id)} />
      )}
    />
  );
};
```

### Image Optimization

```typescript
import { Image } from 'react-native';

// ✅ CORRECT - Explicit dimensions
<Image
  source={{ uri: 'https://...' }}
  style={{ width: 200, height: 200 }}
  resizeMode="contain"
/>

// ❌ WRONG - No dimensions
<Image source={{ uri: 'https://...' }} />

// ✅ Cache strategies
<Image
  source={{ uri: 'https://...', cache: 'force-cache' }}
  style={{ width: 200, height: 200 }}
/>
```

---

## 🔐 Security Best Practices

### API Key Management

```typescript
// ❌ WRONG - Hardcoded
const API_KEY = 'sk_live_123456789';

// ✅ CORRECT - Environment variable
import { API_KEY } from '@env';

// Setup:
// Create .env file with:
// API_KEY=sk_live_123456789
// npm install react-native-dotenv
// In metro.config.js, add dotenv configuration
```

### Secure Network Communication

```typescript
import * as SecureStore from 'expo-secure-store';

const secureAPI = async (endpoint: string) => {
  try {
    // Get token securely
    const token = await SecureStore.getItemAsync('auth_token');

    const response = await fetch(`https://api.example.com${endpoint}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired, refresh and retry
        await refreshToken();
        return secureAPI(endpoint);
      }
      throw new Error(`HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Request failed:', error);
    throw error;
  }
};
```

### Sensitive Data Handling

```typescript
// ✅ Store tokens securely
import * as SecureStore from 'expo-secure-store';

const saveAuthToken = async (token: string) => {
  await SecureStore.setItemAsync('auth_token', token);
};

const getAuthToken = async () => {
  return await SecureStore.getItemAsync('auth_token');
};

const clearAuthToken = async () => {
  await SecureStore.deleteItemAsync('auth_token');
};
```

### Input Validation

```typescript
// ✅ CORRECT - Validate user input
const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

const handleLogin = (email: string, password: string) => {
  if (!validateEmail(email)) {
    setError('Invalid email');
    return;
  }

  if (password.length < 8) {
    setError('Password too short');
    return;
  }

  // Proceed with login
};
```

---

## ♿ Accessibility (WCAG 2.1)

### Color Contrast

```typescript
import { Text, View } from 'react-native';

// ✅ GOOD: Dark on white = 21:1 contrast
<Text style={{ color: '#000000', backgroundColor: '#FFFFFF' }}>
  Accessible Text
</Text>

// ❌ BAD: Gray on white = 2.5:1 contrast (below 4.5:1 minimum)
<Text style={{ color: '#CCCCCC', backgroundColor: '#FFFFFF' }}>
  Hard to Read
</Text>

// Check contrast: https://webaim.org/resources/contrastchecker/
```

### Accessibility Labels

```typescript
import { Pressable, Text } from 'react-native';

<Pressable
  accessible={true}
  accessibilityLabel="Add to favorites"
  accessibilityRole="button"
  accessibilityState={{ disabled: false }}
  onPress={() => toggleFavorite()}
>
  <Text>❤️</Text>
</Pressable>
```

### Keyboard Navigation

```typescript
<Pressable
  onFocus={() => setFocused(true)}
  onBlur={() => setFocused(false)}
  style={({ focused }) => ({
    borderWidth: focused ? 2 : 1,
    borderColor: focused ? '#007AFF' : '#CCCCCC',
  })}
  accessibilityRole="button"
>
  <Text>Focusable Element</Text>
</Pressable>
```

### Screen Reader Support

```typescript
import { View, Text, AccessibilityInfo } from 'react-native';

<View
  accessible={true}
  accessibilityLabel="User profile card for John Doe"
  accessibilityHint="Double tap to open profile details"
>
  <Text>John Doe</Text>
  <Text>john@example.com</Text>
</View>
```

---

## ⚠️ Common Pitfalls & Solutions

### Pitfall 1: Unnecessary Re-renders

```typescript
// ❌ WRONG
const MyList = () => {
  const handlePress = (id: string) => { console.log(id); }; // New function every render

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <ListItem item={item} onPress={handlePress} />
      )}
    />
  );
};

// ✅ CORRECT
const MyList = () => {
  const handlePress = useCallback((id: string) => {
    console.log(id);
  }, []); // Memoized, recreated only if dependencies change

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => (
        <ListItem item={item} onPress={handlePress} />
      )}
    />
  );
};
```

### Pitfall 2: Memory Leaks

```typescript
// ❌ WRONG
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    console.log('Screen focused');
  });
  // Never unsubscribed!
}, []);

// ✅ CORRECT
useEffect(() => {
  const unsubscribe = navigation.addListener('focus', () => {
    console.log('Screen focused');
  });

  return () => unsubscribe(); // Cleanup on unmount
}, [navigation]);
```

### Pitfall 3: Async State Updates After Unmount

```typescript
// ❌ WRONG
useEffect(() => {
  const fetchData = async () => {
    const data = await api.fetch();
    setData(data); // May warn if component unmounted
  };

  fetchData();
}, []);

// ✅ CORRECT
useEffect(() => {
  let isMounted = true;

  const fetchData = async () => {
    const data = await api.fetch();
    if (isMounted) {
      setData(data);
    }
  };

  fetchData();

  return () => {
    isMounted = false;
  };
}, []);
```

### Pitfall 4: Missing Keys in Lists

```typescript
// ❌ WRONG - Using index as key
<FlatList
  data={users}
  keyExtractor={(item, index) => index.toString()} // Wrong!
  renderItem={({ item }) => <UserCard user={item} />}
/>

// ✅ CORRECT - Using unique identifier
<FlatList
  data={users}
  keyExtractor={(item) => item.id} // Unique per item
  renderItem={({ item }) => <UserCard user={item} />}
/>
```

### Pitfall 5: Blocking UI Thread

```typescript
// ❌ WRONG
const expensiveOperation = () => {
  let sum = 0;
  for (let i = 0; i < 1000000000; i++) {
    sum += i; // Blocks UI for seconds
  }
  return sum;
};

// ✅ CORRECT - Use InteractionManager
import { InteractionManager } from 'react-native';

InteractionManager.runAfterInteractions(() => {
  let sum = 0;
  for (let i = 0; i < 1000000000; i++) {
    sum += i; // Runs after interactions complete
  }
});
```

---

## 📋 Pre-Production Checklist

**Performance:**
- [ ] FlatList optimized (initialNumToRender, maxToRenderPerBatch)
- [ ] Components memoized appropriately
- [ ] No inline functions in list renders
- [ ] Images have explicit dimensions
- [ ] Navigation listeners cleaned up
- [ ] No console.logs in production

**Security:**
- [ ] No API keys hardcoded
- [ ] Tokens stored in SecureStore
- [ ] HTTPS only for network requests
- [ ] Sensitive data encrypted
- [ ] Input validation implemented
- [ ] Error messages don't leak info

**Accessibility:**
- [ ] Color contrast 4.5:1 minimum
- [ ] All buttons have accessibilityLabel
- [ ] Screen reader support added
- [ ] Keyboard navigation works
- [ ] Touch targets 44x44 minimum

**Testing:**
- [ ] Unit tests for business logic
- [ ] Integration tests for flows
- [ ] Manual testing on real devices
- [ ] All platforms tested (iOS/Android)
- [ ] Error scenarios tested

---

**Source**: https://reactnative.dev/docs/performance
**Version**: React Native 0.83
**Last Updated**: December 2025
