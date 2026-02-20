# React Native 0.83 - Navigation & Routing

**React Navigation patterns: Stack, Tab, and Deep Linking**

---

## 📦 Installation & Setup

### Install Dependencies

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
```

### Root App Setup

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        {/* Screens here */}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🗂️ Stack Navigation

Basic multi-screen navigation with history.

### TypeScript Setup

```typescript
export type RootStackParamList = {
  Home: undefined;
  Details: { id: string };
  NotFound: undefined;
};

declare global {
  namespace RootNavigation {
    function navigate(name: 'Home'): void;
    function navigate(name: 'Details', params: { id: string }): void;
  }
}
```

### Implementation

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, Text, Button, NativeStackScreenProps } from 'react-native';

type RootStackParamList = {
  Home: undefined;
  Details: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

// Home Screen
type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;

const HomeScreen = ({ navigation }: HomeScreenProps) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Home Screen</Text>
    <Button
      title="Go to Details"
      onPress={() => navigation.navigate('Details', { id: '123' })}
    />
  </View>
);

// Details Screen
type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>;

const DetailsScreen = ({ route, navigation }: DetailsScreenProps) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Details - ID: {route.params.id}</Text>
    <Button title="Go Back" onPress={() => navigation.goBack()} />
  </View>
);

// App Navigator
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: true,
          headerStyle: { backgroundColor: '#007AFF' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={({ route }) => ({
            title: `Details ${route.params.id}`,
          })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Navigation Methods

```typescript
// Navigate to screen
navigation.navigate('Details', { id: '123' });

// Replace current screen
navigation.replace('Details', { id: '123' });

// Go back
navigation.goBack();

// Go back to specific screen
navigation.pop(2); // Go back 2 screens

// Clear history and go to
navigation.reset({
  index: 0,
  routes: [{ name: 'Home' }],
});
```

---

## 📱 Tab Navigation

Bottom tab bar for multiple sections.

### Installation

```bash
npm install @react-navigation/bottom-tabs
```

### Implementation

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text } from 'react-native';

const Tab = createBottomTabNavigator();

const HomeScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Home Tab</Text>
  </View>
);

const SearchScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Search Tab</Text>
  </View>
);

const ProfileScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>Profile Tab</Text>
  </View>
);

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarLabel: route.name,
          tabBarIcon: ({ focused, color, size }) => {
            let icon = '📱';
            if (route.name === 'Search') icon = '🔍';
            if (route.name === 'Profile') icon = '👤';
            return <Text style={{ fontSize: size, color }}>{icon}</Text>;
          },
          tabBarActiveTintColor: '#007AFF',
          tabBarInactiveTintColor: '#999',
          headerShown: true,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Search" component={SearchScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🔗 Deep Linking

Navigate to specific screens via URLs.

### Configuration

```typescript
const linking = {
  prefixes: ['myapp://', 'https://myapp.com', 'https://www.myapp.com'],
  config: {
    screens: {
      Home: 'home',
      Details: 'details/:id',
      NotFound: '*',
    },
  },
};

export default function App() {
  return (
    <NavigationContainer linking={linking}>
      {/* Navigator */}
    </NavigationContainer>
  );
}
```

### Generated URLs

```
myapp://home
myapp://details/123
https://myapp.com/home
https://myapp.com/details/456
```

### Complete Deep Linking Example

```typescript
import * as Linking from 'expo-linking';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const prefix = Linking.createURL('/');

const linking = {
  prefixes: [prefix, 'myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Home: 'home',
      Details: 'details/:id',
      Profile: 'profile/:userId',
      NotFound: '*',
    },
  },
};

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer linking={linking} fallback={<LoadingScreen />}>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Profile" component={ProfileScreen} />
        <Stack.Screen name="NotFound" component={NotFoundScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 🔐 Auth Navigation Pattern

Conditional rendering based on auth state.

### Implementation

```typescript
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';

const Stack = createNativeStackNavigator();

// Auth Screens
const LoginScreen = ({ navigation }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Button
      title="Sign In"
      onPress={async () => {
        // Authenticate and save token
        await SecureStore.setItemAsync('auth_token', 'token_here');
        // Navigation happens automatically
      }}
    />
  </View>
);

// App Screens
const HomeScreen = ({ navigation }: any) => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Button
      title="Sign Out"
      onPress={async () => {
        await SecureStore.deleteItemAsync('auth_token');
        // Navigation happens automatically
      }}
    />
  </View>
);

// Root Navigator
export default function App() {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check if user is signed in on app start
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        setIsSignedIn(!!token);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuthStatus();
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
          // App screens (authenticated)
          <Stack.Group>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Details" component={DetailsScreen} />
          </Stack.Group>
        ) : (
          // Auth screens (unauthenticated)
          <Stack.Group screenOptions={{ animationEnabled: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 📊 Combined Stack + Tab Navigation

Tabs inside stack (or vice versa).

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// Stack Navigator
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen
          name="MainTabs"
          component={TabNavigator}
          options={{ headerShown: false }}
        />
        <Stack.Screen name="Details" component={DetailsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## 💾 Navigation State Persistence

Save and restore navigation state.

```typescript
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';

export default function App() {
  const [initialRoute, setInitialRoute] = useState<string | undefined>();
  const [state, dispatch] = useState();

  const onStateChange = async (state: any) => {
    try {
      await AsyncStorage.setItem('@navigation_state', JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save navigation state:', e);
    }
  };

  useEffect(() => {
    const getInitialState = async () => {
      try {
        const initialUrl = await Linking.getInitialURL();
        if (initialUrl != null && initialUrl !== '') {
          setInitialRoute(initialUrl);
        }

        // Restore navigation state
        const savedState = await AsyncStorage.getItem('@navigation_state');
        if (savedState !== null) {
          dispatch(JSON.parse(savedState));
        }
      } finally {
        // Prevent splash screen from auto hiding
      }
    };

    getInitialState();
  }, []);

  return (
    <NavigationContainer onStateChange={onStateChange} initialState={state}>
      {/* Navigator */}
    </NavigationContainer>
  );
}
```

---

## ✅ Navigation Patterns Checklist

- [ ] Root NavigationContainer wraps app
- [ ] Type-safe navigation with TypeScript
- [ ] Stack navigator for main navigation
- [ ] Tab navigator for section switching
- [ ] Deep linking configured
- [ ] Auth state determines visible screens
- [ ] Navigation state can be persisted
- [ ] Back button/gesture handled correctly
- [ ] Headers configured consistently
- [ ] Loading state shown during initialization

---

**Source**: https://reactnavigation.org/
**Version**: React Native 0.83
**Last Updated**: December 2025
