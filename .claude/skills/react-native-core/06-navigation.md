# React Native 0.83.4 -- Navigation & Routing

React Navigation patterns: Stack, Tab, Drawer, Deep Linking, and Auth flows.

---

## Installation

```bash
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
```

For tabs:
```bash
npm install @react-navigation/bottom-tabs
```

For drawer:
```bash
npm install @react-navigation/drawer react-native-gesture-handler react-native-reanimated
```

---

## Root Setup

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App(): React.ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Type-Safe Navigation

### Define Param Lists

```typescript
// navigation/types.ts
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';

export type RootStackParamList = {
  Home: undefined;
  Details: { id: string; title: string };
  Settings: undefined;
  Tabs: NavigatorScreenParams<TabParamList>;
};

export type TabParamList = {
  Feed: undefined;
  Search: { query?: string };
  Profile: { userId: string };
};

// Screen prop types
export type HomeScreenProps = NativeStackScreenProps<RootStackParamList, 'Home'>;
export type DetailsScreenProps = NativeStackScreenProps<RootStackParamList, 'Details'>;

// Composite types for nested navigators
export type FeedScreenProps = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'Feed'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Global type registration (enables useNavigation typing)
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
```

---

## Stack Navigation

### Implementation

```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList, HomeScreenProps, DetailsScreenProps } from './navigation/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

function HomeScreen({ navigation }: HomeScreenProps): React.ReactElement {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Pressable onPress={() => navigation.navigate('Details', { id: '123', title: 'Item' })}>
        <Text>Go to Details</Text>
      </Pressable>
    </View>
  );
}

function DetailsScreen({ route, navigation }: DetailsScreenProps): React.ReactElement {
  const { id, title } = route.params;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Details for {title} (ID: {id})</Text>
      <Pressable onPress={() => navigation.goBack()}>
        <Text>Go Back</Text>
      </Pressable>
    </View>
  );
}

function RootNavigator(): React.ReactElement {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: '#007AFF' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Stack.Screen
        name="Details"
        component={DetailsScreen}
        options={({ route }) => ({ title: route.params.title })}
      />
    </Stack.Navigator>
  );
}
```

### Navigation Methods

| Method | Description | Example |
|--------|-------------|---------|
| `navigate(name, params?)` | Go to screen (no duplicate if already in stack) | `navigation.navigate('Details', { id: '1' })` |
| `push(name, params?)` | Push new instance (allows duplicates) | `navigation.push('Details', { id: '2' })` |
| `goBack()` | Go back one screen | `navigation.goBack()` |
| `pop(count?)` | Pop N screens | `navigation.pop(2)` |
| `popToTop()` | Go to first screen | `navigation.popToTop()` |
| `replace(name, params?)` | Replace current screen | `navigation.replace('Home')` |
| `reset(state)` | Reset navigation state | `navigation.reset({ index: 0, routes: [{ name: 'Home' }] })` |
| `setOptions(opts)` | Update screen options | `navigation.setOptions({ title: 'New Title' })` |

---

## Tab Navigation

```typescript
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { TabParamList } from './navigation/types';

const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarIcon: ({ color, size }) => {
          // Return icon component based on route.name
          return <IconComponent name={route.name} color={color} size={size} />;
        },
      })}
    >
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
```

### Tab Screen Options

| Option | Type | Description |
|--------|------|-------------|
| `tabBarIcon` | `({ focused, color, size }) => ReactElement` | Tab icon |
| `tabBarLabel` | `string \| ({ focused, color }) => ReactElement` | Tab label |
| `tabBarBadge` | `string \| number` | Badge on tab |
| `tabBarActiveTintColor` | `string` | Active icon/label color |
| `tabBarInactiveTintColor` | `string` | Inactive icon/label color |
| `tabBarStyle` | `StyleProp<ViewStyle>` | Tab bar container style |
| `tabBarHideOnKeyboard` | `boolean` | Hide when keyboard open |

---

## Combined Stack + Tab

```typescript
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

function TabNavigator(): React.ReactElement {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Feed" component={FeedScreen} />
      <Tab.Screen name="Search" component={SearchScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App(): React.ReactElement {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Tabs" component={TabNavigator} options={{ headerShown: false }} />
        <Stack.Screen name="Details" component={DetailsScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

---

## Deep Linking

### Configuration

```typescript
const linking = {
  prefixes: ['myapp://', 'https://myapp.com'],
  config: {
    screens: {
      Tabs: {
        screens: {
          Feed: 'feed',
          Search: 'search/:query?',
          Profile: 'profile/:userId',
        },
      },
      Details: 'details/:id',
      Settings: 'settings',
    },
  },
};

export default function App(): React.ReactElement {
  return (
    <NavigationContainer linking={linking} fallback={<ActivityIndicator />}>
      {/* navigators */}
    </NavigationContainer>
  );
}
```

### Resulting URLs

| URL | Screen | Params |
|-----|--------|--------|
| `myapp://feed` | Tabs > Feed | -- |
| `myapp://search/react` | Tabs > Search | `{ query: 'react' }` |
| `myapp://profile/123` | Tabs > Profile | `{ userId: '123' }` |
| `myapp://details/456` | Details | `{ id: '456' }` |

---

## Auth Flow Pattern

Conditional navigation based on authentication state.

```typescript
import { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator();

export default function App(): React.ReactElement {
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    // Check stored token on mount
    checkAuthToken().then((hasToken) => setIsSignedIn(hasToken));
  }, []);

  if (isSignedIn === null) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
          <Stack.Group>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Details" component={DetailsScreen} />
          </Stack.Group>
        ) : (
          <Stack.Group screenOptions={{ animation: 'fade' }}>
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

## Useful Hooks

| Hook | Import | Description |
|------|--------|-------------|
| `useNavigation()` | `@react-navigation/native` | Access navigation object |
| `useRoute()` | `@react-navigation/native` | Access route params |
| `useFocusEffect(callback)` | `@react-navigation/native` | Run effect on screen focus |
| `useIsFocused()` | `@react-navigation/native` | Boolean: is screen focused |
| `useNavigationState(selector)` | `@react-navigation/native` | Select from nav state |

### useFocusEffect

```typescript
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

function ProfileScreen(): React.ReactElement {
  useFocusEffect(
    useCallback(() => {
      // Runs when screen is focused
      refreshData();

      return () => {
        // Cleanup when screen loses focus
      };
    }, []),
  );

  return <View />;
}
```

---

**Version:** React Native 0.83.4 | React Navigation 7.x
**Source:** https://reactnavigation.org/docs/getting-started
