# Authentication and Protected Routes -- Expo Router v7 (~55.0.7)

Implementing secure authentication flows with Stack.Protected guards.

---

## Authentication Architecture

```
Root Layout (_layout.tsx)
  |
SessionProvider (Auth Context)
  |
Stack with Protected Guards
  |-- Auth Routes (login, signup)  [if !session]
  |-- App Routes (home, profile)   [if session]
```

---

## Step 1: Create Auth Context

```typescript
// ctx/auth.tsx
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';

type AuthState = {
  isLoading: boolean;
  isSignout: boolean;
  userToken: string | null;
};

type AuthContextType = {
  state: AuthState;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signUp: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthAction =
  | { type: 'RESTORE_TOKEN'; payload: string | null }
  | { type: 'SIGN_IN'; payload: string }
  | { type: 'SIGN_OUT' };

function authReducer(prevState: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'RESTORE_TOKEN':
      return { ...prevState, userToken: action.payload, isLoading: false };
    case 'SIGN_IN':
      return { ...prevState, isSignout: false, userToken: action.payload };
    case 'SIGN_OUT':
      return { ...prevState, isSignout: true, userToken: null };
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, {
    isLoading: true,
    isSignout: false,
    userToken: null,
  });

  useEffect(() => {
    const restoreToken = async () => {
      let userToken: string | null = null;
      try {
        userToken = await SecureStore.getItemAsync('userToken');
      } catch (e) {
        // Token restoration failed
      }
      dispatch({ type: 'RESTORE_TOKEN', payload: userToken });
    };
    restoreToken();
  }, []);

  const authContext: AuthContextType = {
    state,
    signIn: async (credentials) => {
      const response = await fetch('https://api.example.com/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error('Invalid credentials');
      const { token } = await response.json();
      await SecureStore.setItemAsync('userToken', token);
      dispatch({ type: 'SIGN_IN', payload: token });
    },
    signUp: async (credentials) => {
      const response = await fetch('https://api.example.com/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });
      if (!response.ok) throw new Error('Signup failed');
      const { token } = await response.json();
      await SecureStore.setItemAsync('userToken', token);
      dispatch({ type: 'SIGN_IN', payload: token });
    },
    signOut: async () => {
      await SecureStore.deleteItemAsync('userToken');
      dispatch({ type: 'SIGN_OUT' });
    },
  };

  return (
    <AuthContext.Provider value={authContext}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Step 2: Root Layout with Stack.Protected

```typescript
// app/_layout.tsx
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../ctx/auth';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { state } = useAuth();
  const { isLoading, userToken } = state;

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!userToken}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!userToken}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
```

---

## Step 3: Auth Routes

```typescript
// app/(auth)/_layout.tsx
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
```

```typescript
// app/(auth)/login.tsx
import { useState } from 'react';
import { useAuth } from '../../ctx/auth';
import { useRouter } from 'expo-router';
import { View, TextInput, Pressable, Text, Alert, ActivityIndicator } from 'react-native';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    setLoading(true);
    try {
      await signIn({ email, password });
      // Navigation happens automatically via Stack.Protected guard change
    } catch (error) {
      Alert.alert('Login Failed', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>Sign In</Text>
      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 8 }}
      />
      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{ borderWidth: 1, padding: 10, marginBottom: 10, borderRadius: 8 }}
      />
      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={{ backgroundColor: '#0a7ea4', padding: 12, borderRadius: 8 }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>Sign In</Text>
        )}
      </Pressable>
      <Pressable onPress={() => router.push('/signup')}>
        <Text style={{ color: '#0a7ea4', textAlign: 'center', marginTop: 16 }}>
          Don't have an account? Sign Up
        </Text>
      </Pressable>
    </View>
  );
}
```

---

## Step 4: Protected App Routes

```typescript
// app/(app)/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from '../../ctx/auth';
import { Pressable, Text } from 'react-native';

export default function AppLayout() {
  const { signOut } = useAuth();
  return (
    <Stack
      screenOptions={{
        headerRight: () => (
          <Pressable onPress={signOut} style={{ marginRight: 10 }}>
            <Text style={{ color: '#0a7ea4' }}>Logout</Text>
          </Pressable>
        ),
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ title: 'Profile' }} />
    </Stack>
  );
}
```

```typescript
// app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="explore" options={{ title: 'Explore' }} />
      <Tabs.Screen name="saved" options={{ title: 'Saved' }} />
    </Tabs>
  );
}
```

---

## Role-Based Access Control

```typescript
// app/_layout.tsx
function RootNavigator() {
  const { state } = useAuth();
  const { userToken, user } = state;
  const isAdmin = user?.role === 'admin';

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!userToken}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!userToken}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!!userToken && isAdmin}>
        <Stack.Screen name="(admin)" />
      </Stack.Protected>
    </Stack>
  );
}
```

---

## Security Best Practices

**DO:**
- Store tokens in SecureStore (encrypted)
- Use HTTPS for all API calls
- Validate token on app launch
- Implement token refresh logic
- Clear token on logout
- Use Stack.Protected for route guards

**DO NOT:**
- Store tokens in AsyncStorage (plain text)
- Log tokens in console
- Pass sensitive data in URL params
- Trust client-side auth alone (verify server-side)
- Keep expired tokens cached

---

## Troubleshooting

### Stack.Protected not redirecting

- Verify `guard` prop is a boolean expression
- Ensure Auth context wraps the entire app
- Check that Stack has both auth and app screen groups

### Deep link redirects to login unexpectedly

- Verify token is properly stored and restored on launch
- Check `isLoading` state prevents premature guard evaluation
- Ensure SplashScreen stays visible until auth state resolves

---

**Version:** v7 (~55.0.7, SDK 55) | **Source:** https://docs.expo.dev/router/advanced/authentication/
