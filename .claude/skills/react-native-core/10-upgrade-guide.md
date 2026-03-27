# React Native 0.83.4 -- Upgrade Guide

Upgrading from 0.81 to 0.83, breaking changes, and React 19.2 features.

---

## What Changed in 0.83

### Highlights

| Change | Impact | Action Required |
|--------|--------|-----------------|
| New Architecture mandatory | No more legacy bridge | Remove any `newArchEnabled=false` or bridge workarounds |
| Improved Bridgeless mode | Better JSI performance | No action needed (automatic) |
| Performance improvements in Fabric | Faster UI updates | No action needed |
| Better TypeScript support | Improved type definitions | Review typings if you use custom types |
| expo-system-ui standard dependency | Root view background config | Add `expo-system-ui` to project deps |
| react-native-screens ~4.23.0 | Required for native stack | Update peer dependency |
| react-native-gesture-handler ~2.30.0 | Updated gesture APIs | Update peer dependency |

### From 0.81 Breaking Changes (if upgrading from 0.80)

| Change | Impact | Action Required |
|--------|--------|-----------------|
| SafeAreaView removed from react-native | Build error | Use `react-native-safe-area-context` |
| JSC removed | Not available | Use Hermes (default) or install community JSC |
| Android 16 (API 36) targeting | Apps target API 36 by default | Update compileSdkVersion if needed |

---

## Upgrade Steps

### Step 1: Update Dependencies

```bash
npm install react-native@0.83.4 react@19.2.0
npx expo install expo-system-ui
```

### Step 2: Update Native Projects

Use the React Native Upgrade Helper to diff changes:
https://react-native-community.github.io/upgrade-helper/

Key native file changes:
- `android/build.gradle`: Update compileSdkVersion to 36
- `android/app/build.gradle`: Update targetSdkVersion to 36
- `ios/Podfile`: Verify minimum iOS deployment target
- `android/gradle.properties`: Remove any `newArchEnabled=false` line

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

### Step 4: Remove Legacy Architecture Workarounds

New Architecture is now mandatory. Remove any lingering legacy arch code:

```properties
# android/gradle.properties
# REMOVE this line if present:
# newArchEnabled=false
```

If your app had custom bridge modules (not TurboModules), migrate to TurboModules. See `04-native-modules.md`.

### Step 5: Add expo-system-ui

Configure root view background color via `expo-system-ui`:

```bash
npx expo install expo-system-ui
```

In `app.json`:

```json
{
  "expo": {
    "userInterfaceStyle": "automatic"
  }
}
```

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

## React 19.2.0 Features (Available, Optional)

RN 0.83.4 ships with React 19.2.0. This is a minor update from 19.1 (mostly bug fixes). Features from React 19.1 are still available.

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
| `react-navigation` | 7.x | Works with RN 0.83 |
| `react-native-screens` | ~4.23.0 | Required for native stack |
| `react-native-safe-area-context` | 5.x | Required (SafeAreaView removed in 0.83) |
| `react-native-gesture-handler` | ~2.30.0 | For drawer/gesture navigation |
| `react-native-reanimated` | 4.x | Check peer deps |
| `expo-system-ui` | ~55.0.10 | Root view background config (new standard dep) |

---

## Rollback (If Issues)

```bash
# Revert to previous version
npm install react-native@0.81.5 react@19.1.0

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

**Version:** React Native 0.83.4 | React 19.2.0
**Source:** https://reactnative.dev/docs/upgrading
