# React Native 0.81.5 -- Upgrade Guide

Upgrading from 0.80 to 0.81, breaking changes, and React 19.1 features.

---

## What Changed in 0.81

### Highlights

| Change | Impact | Action Required |
|--------|--------|-----------------|
| Android 16 (API 36) targeting | Apps target API 36 by default | Update compileSdkVersion if needed |
| SafeAreaView deprecated | Built-in SafeAreaView is deprecated | Use `react-native-safe-area-context` |
| JSC removed | Built-in JavaScriptCore removed | Install community package if needed |
| Edge-to-edge display | Android 16 requires edge-to-edge | Use `edgeToEdgeEnabled` gradle property |
| Predictive back gesture | Enabled by default for Android 16 | Test back navigation |
| Precompiled iOS builds | Experimental: up to 10x faster builds | Opt-in via env vars |
| Node.js 20.19.4+ required | Minimum Node.js version raised | Upgrade Node.js if below 20.19.4 |
| Xcode 16.1+ required | Minimum Xcode version raised | Upgrade Xcode |

### No User-Facing Breaking Changes

RN 0.81 maintains backward compatibility for JavaScript APIs. The breaking changes are tooling/platform requirements, not runtime API changes.

---

## Upgrade Steps

### Step 1: Update Dependencies

```bash
npm install react-native@0.81.5 react@19.1.0
```

### Step 2: Update Native Projects

Use the React Native Upgrade Helper to diff changes:
https://react-native-community.github.io/upgrade-helper/

Key native file changes:
- `android/build.gradle`: Update compileSdkVersion to 36
- `android/app/build.gradle`: Update targetSdkVersion to 36
- `ios/Podfile`: Verify minimum iOS deployment target
- `android/gradle.properties`: Check for new properties

### Step 3: Clean and Reinstall

```bash
rm -rf node_modules package-lock.json
npm install

# Android
cd android && ./gradlew clean && cd ..

# iOS
cd ios && rm -rf Pods Podfile.lock build && pod install && cd ..

# Metro cache
npm start -- --reset-cache
```

### Step 4: Address Deprecations

#### Replace SafeAreaView

```typescript
// BEFORE (deprecated)
import { SafeAreaView } from 'react-native';

// AFTER
import { SafeAreaView } from 'react-native-safe-area-context';
// Or use the hook:
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

Install if not already present:

```bash
npm install react-native-safe-area-context
```

#### Replace JSC (if not using Hermes)

If your app opts out of Hermes (not recommended):

```bash
npm install @react-native-community/javascriptcore
```

Most apps use Hermes (default) and are unaffected.

### Step 5: Android 16 Compliance

#### Edge-to-Edge Display

Android 16 requires edge-to-edge display. Enable early for testing:

```properties
# android/gradle.properties
edgeToEdgeEnabled=true
```

Ensure your app handles system bars correctly with `react-native-safe-area-context`.

#### 16 KB Page Size

React Native is already compliant. No action needed.

#### Predictive Back Gesture

Enabled by default. Test that:
- Back navigation works correctly
- No critical UI on swipe-back areas
- Custom back handlers still function

### Step 6: Verify

```bash
# Type check
npx tsc --noEmit

# Run tests
npm test

# Build and run
npm run android
npm run ios
```

---

## React 19.1.0 Features (Available, Optional)

RN 0.81.5 ships with React 19.1.0. These features are available but adoption is optional -- existing React 18 patterns continue to work.

### `use` Hook

Reads values from Promises or Contexts. Can be called conditionally.

```typescript
import { use, Suspense } from 'react';

function UserProfile({ userPromise }: { userPromise: Promise<User> }): React.ReactElement {
  const user = use(userPromise); // Suspends until resolved
  return <Text>{user.name}</Text>;
}

// Usage with Suspense boundary
<Suspense fallback={<ActivityIndicator />}>
  <UserProfile userPromise={fetchUser(id)} />
</Suspense>
```

### `useActionState` Hook

Manages form state with async actions.

```typescript
import { useActionState } from 'react';

function LoginForm(): React.ReactElement {
  const [state, submitAction, isPending] = useActionState(
    async (prevState: FormState, formData: FormData) => {
      const result = await loginAPI(formData);
      if (result.error) return { error: result.error };
      return { success: true };
    },
    { error: null },
  );

  return (
    <View>
      {state.error && <Text style={{ color: 'red' }}>{state.error}</Text>}
      <Pressable onPress={submitAction} disabled={isPending}>
        <Text>{isPending ? 'Signing in...' : 'Sign In'}</Text>
      </Pressable>
    </View>
  );
}
```

### `useOptimistic` Hook

Provides optimistic UI updates during async operations.

```typescript
import { useOptimistic } from 'react';

function TodoList({ todos }: { todos: Todo[] }): React.ReactElement {
  const [optimisticTodos, addOptimisticTodo] = useOptimistic(
    todos,
    (currentTodos, newTodo: Todo) => [...currentTodos, { ...newTodo, pending: true }],
  );

  async function handleAdd(title: string): Promise<void> {
    addOptimisticTodo({ id: 'temp', title, pending: true });
    await createTodoAPI(title); // Server request
  }

  return (
    <FlatList
      data={optimisticTodos}
      renderItem={({ item }) => (
        <Text style={{ opacity: item.pending ? 0.5 : 1 }}>{item.title}</Text>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}
```

---

## Dependency Compatibility

### Check for Updates

```bash
npm outdated
```

### Common Dependencies to Update

| Package | Compatible Version | Notes |
|---------|-------------------|-------|
| `react-navigation` | 7.x | Works with RN 0.81 |
| `react-native-screens` | 4.x | Required for native stack |
| `react-native-safe-area-context` | 5.x | Required (SafeAreaView deprecated) |
| `react-native-gesture-handler` | 2.x | For drawer/gesture navigation |
| `react-native-reanimated` | 4.x | Check peer deps |

---

## Rollback (If Issues)

```bash
# Revert to previous version
npm install react-native@0.80.0 react@19.1.0

# Full clean
rm -rf node_modules package-lock.json
npm install

cd android && ./gradlew clean && cd ..
cd ios && rm -rf Pods Podfile.lock && pod install && cd ..

npm start -- --reset-cache
```

---

## Verification Checklist

- [ ] App launches on Android without errors
- [ ] App launches on iOS without errors
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] All tests pass (`npm test`)
- [ ] Navigation works correctly
- [ ] Back gesture (Android) works
- [ ] Safe areas rendered correctly (notch, home indicator)
- [ ] No deprecation warnings in console
- [ ] Tested on physical device
- [ ] Release build succeeds

---

**Version:** React Native 0.81.5 | React 19.1.0
**Source:** https://reactnative.dev/blog/2025/08/12/react-native-0.81 | https://reactnative.dev/docs/upgrading
