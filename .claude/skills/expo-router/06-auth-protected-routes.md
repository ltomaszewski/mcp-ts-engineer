# Authentication & Protected Routes — Expo Router 6.0.19

Implementing secure authentication flows with protected routes (SDK 53+).

**Module Summary:** SessionProvider pattern, Stack.Protected guards, auth state management, role-based protection, and redirect patterns.

**🔗 Cross-References:**
- Navigation flows → `03-api-navigation.md`
- Components → `05-api-components.md`
- Routing fundamentals → `02-routing-basics.md`

---

## Authentication Architecture

Modern Expo Router apps use a **SessionProvider** pattern with **Stack.Protected** for route guarding.

### Architecture Diagram

```
Root Layout (_layout.tsx)
  ↓
SessionProvider (Auth Context)
  ↓
RootNavigator (checks session)
  ↓
├── Auth Routes (login, signup)  [if !session]
└── App Routes (home, profile)   [if session]
```

**Official Source:** https://docs.expo.dev/router/advanced/authentication/

---

## Step 1: Create Auth Context

Create `ctx/auth.tsx`:

```typescript
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

type AuthContextType = {
  state: {
    isLoading: boolean;
    isSignout: boolean;
    userToken: string | null;
  };
  signIn: (credentials: any) => Promise<void>;
  signUp: (credentials: any) => Promise<void>;
  signOut: () => void;
  signUp: (credentials: any) => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(
    (prevState, action: any) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.payload,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
        case 'SIGN_UP':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.payload,
          };
        default:
          return prevState;
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    }
  );

  // Restore token on mount
  useEffect(() => {
    const bootstrapAsync = async () => {
      let userToken;
      try {
        // Fetch the token from secure storage
        userToken = await SecureStore.getItemAsync('userToken');
      } catch (e) {
        // Restoring token failed
      }

      dispatch({ type: 'RESTORE_TOKEN', payload: userToken });
    };

    bootstrapAsync();
  }, []);

  const authContext: AuthContextType = {
    state,
    signIn: async (credentials) => {
      try {
        const response = await fetch('https://api.example.com/login', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });

        const { token } = await response.json();

        // Store token securely
        await SecureStore.setItemAsync('userToken', token);
        dispatch({ type: 'SIGN_IN', payload: token });
      } catch (error) {
        throw new Error('Invalid credentials');
      }
    },
    signOut: async () => {
      try {
        await SecureStore.deleteItemAsync('userToken');
      } catch (e) {
        console.error(e);
      }
      dispatch({ type: 'SIGN_OUT' });
    },
    signUp: async (credentials) => {
      try {
        const response = await fetch('https://api.example.com/signup', {
          method: 'POST',
          body: JSON.stringify(credentials),
        });

        const { token } = await response.json();
        await SecureStore.setItemAsync('userToken', token);
        dispatch({ type: 'SIGN_UP', payload: token });
      } catch (error) {
        throw new Error('Signup failed');
      }
    },
  };

  return (
    <AuthContext.Provider value={authContext}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
```

---

## Step 2: Setup Root Layout with Protected Routes

Create `app/_layout.tsx`:

```typescript
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '../ctx/auth';

// Keep splash screen visible while loading auth
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

function RootNavigator() {
  const { state, signOut } = useAuth();
  const { isLoading, userToken } = state;

  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync();
    }
  }, [isLoading]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!userToken}>
        {/* Auth stack - shown when NOT logged in */}
        <Stack.Group>
          <Stack.Screen name="(auth)" options={{ animationEnabled: false }} />
        </Stack.Group>
      </Stack.Protected>

      <Stack.Protected guard={!!userToken}>
        {/* App stack - shown when logged in */}
        <Stack.Group>
          <Stack.Screen name="(app)" options={{ animationEnabled: false }} />
        </Stack.Group>
      </Stack.Protected>

      {/* Loading splash */}
      {isLoading && (
        <Stack.Group screenOptions={{ presentation: 'transparentModal' }}>
          <Stack.Screen name="splash" options={{ animationEnabled: false }} />
        </Stack.Group>
      )}
    </Stack>
  );
}
```

---

## Step 3: Create Auth Routes

Create `app/(auth)/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';

export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
```

Create `app/(auth)/login.tsx`:

```typescript
import { useState } from 'react';
import { useAuth } from '../../ctx/auth';
import { useRouter } from 'expo-router';
import {
  View,
  TextInput,
  Pressable,
  Text,
  Alert,
  ActivityIndicator,
} from 'react-native';

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
      // Navigation happens automatically via Stack.Protected
    } catch (error) {
      Alert.alert('Login Failed', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 20 }}>
        Sign In
      </Text>

      <TextInput
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 10,
          borderRadius: 8,
        }}
      />

      <TextInput
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          padding: 10,
          marginBottom: 10,
          borderRadius: 8,
        }}
      />

      <Pressable
        onPress={handleLogin}
        disabled={loading}
        style={{
          backgroundColor: '#0a7ea4',
          padding: 12,
          borderRadius: 8,
          marginBottom: 10,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: '#fff', textAlign: 'center', fontWeight: '600' }}>
            Sign In
          </Text>
        )}
      </Pressable>

      <Pressable onPress={() => router.push('/signup')}>
        <Text style={{ color: '#0a7ea4', textAlign: 'center' }}>
          Don't have an account? Sign Up
        </Text>
      </Pressable>
    </View>
  );
}
```

---

## Step 4: Create Protected App Routes

Create `app/(app)/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';
import { useAuth } from '../../ctx/auth';
import { Pressable, Text } from 'react-native';

export default function AppLayout() {
  const { signOut } = useAuth();

  return (
    <Stack
      screenOptions={{
        headerShown: true,
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

Create `app/(app)/(tabs)/_layout.tsx`:

```typescript
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

Extend the auth context to include roles:

```typescript
// Enhanced AuthContext with roles
type AuthContextType = {
  state: {
    isLoading: boolean;
    userToken: string | null;
    user: { id: string; email: string; role: 'user' | 'admin' } | null;
  };
  // ... other methods
};

// In app/_layout.tsx - check roles
function RootNavigator() {
  const { state } = useAuth();
  const { userToken, user } = state;
  const isAdmin = user?.role === 'admin';

  return (
    <Stack>
      <Stack.Protected guard={!!userToken}>
        <Stack.Group>
          {/* Admin panel only for admins */}
          {isAdmin && (
            <Stack.Screen name="(admin)" options={{ animationEnabled: false }} />
          )}
          {/* Regular app screens for all */}
          <Stack.Screen name="(app)" />
        </Stack.Group>
      </Stack.Protected>
    </Stack>
  );
}
```

---

## Deep Linking with Auth

Protected routes automatically redirect on deep links:

```typescript
// If unauthenticated user taps link to /profile
// Route is inaccessible, user redirected to login
// After login, user can see /profile
```

Configure in `+native-intent.tsx` (see `deep-linking.md` for details).

---

## Splash Screen During Auth Check

Create `app/splash.tsx`:

```typescript
import { View, Text } from 'react-native';

export default function SplashScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20 }}>Loading...</Text>
    </View>
  );
}
```

---

## Complete Example: Google Sign-In

```typescript
// In auth.tsx - signIn method with Google
import * as GoogleSignIn from 'expo-google-sign-in';

signIn: async () => {
  try {
    const result = await GoogleSignIn.signInAsync();
    
    // Exchange Google token for your backend token
    const response = await fetch('https://api.example.com/auth/google', {
      method: 'POST',
      body: JSON.stringify({ googleToken: result.authentication.idToken }),
    });
    
    const { token } = await response.json();
    await SecureStore.setItemAsync('userToken', token);
    dispatch({ type: 'SIGN_IN', payload: token });
  } catch (error) {
    throw new Error('Google Sign-In failed');
  }
},
```

---

## Security Best Practices

### ✅ DO:

- ✅ Store tokens in **SecureStore** (encrypted)
- ✅ Use **HTTPS** for all API calls
- ✅ Validate token on app launch
- ✅ Implement token refresh logic
- ✅ Clear token on logout
- ✅ Use **Stack.Protected** for route guards

### ❌ DON'T:

- ❌ Store tokens in AsyncStorage (plain text)
- ❌ Log tokens in console
- ❌ Pass sensitive data in URLs
- ❌ Trust client-side auth alone (always verify server-side)
- ❌ Keep expired tokens cached

---

## Troubleshooting

### Issue: Stack.Protected not redirecting

**Solution:**
- ✅ Verify `guard` prop is boolean
- ✅ Ensure Stack structure has auth and app screens
- ✅ Check that context is wrapping entire app

---

### Issue: Deep link redirects to login but shouldn't

**Verify:**
- ✅ Route requires authentication (it shouldn't)
- ✅ Token is properly stored and restored
- ✅ User is actually authenticated

---

## Key Patterns

| Pattern | Use Case |
|---------|----------|
| SessionProvider | Global auth state |
| Stack.Protected | Route-level guards |
| useAuth hook | Access auth state in components |
| SecureStore | Secure token storage |
| Deep linking | Automatic redirect on auth change |

---

**Source Documentation:** https://docs.expo.dev/router/advanced/authentication/

**Related:** See README.md for complete module navigation and troubleshooting guide.
