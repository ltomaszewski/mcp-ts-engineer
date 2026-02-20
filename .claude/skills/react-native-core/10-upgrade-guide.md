# React Native 0.83 - Upgrade Guide

**Version upgrades, breaking changes, and compatibility**

---

## 🎉 React Native 0.82 → 0.83

### Good News

**Zero user-facing breaking changes!**

React Native 0.83 is the first major release with:
- Complete backward compatibility
- Gradual feature adoption
- No forced refactoring required

---

## 📦 Upgrade Process

### Step 1: Update package.json

```bash
npm install react@19.2.0 react-native@0.83.0

# or with Yarn
yarn upgrade react@19.2.0 react-native@0.83.0
```

Check latest versions:
```bash
npm view react-native versions | tail -20
npm view react versions | tail -10
```

### Step 2: Clear Cache and Reinstall

```bash
# Remove node_modules and lock files
rm -rf node_modules package-lock.json

# Reinstall fresh dependencies
npm install
```

### Step 3: Clean Native Builds

```bash
# Android clean
cd android
./gradlew clean
cd ..

# iOS clean
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Step 4: Reset Metro Bundler

```bash
npm start -- --reset-cache
```

### Step 5: Test on Device

**Android:**
```bash
npm run android
```

**iOS (macOS):**
```bash
npm run ios
```

---

## ✅ Upgrade Verification

After upgrade, verify:

### 1. App Launches

```bash
# Should load without errors
npm start
npm run android  # or ios
```

### 2. Console Check

- No deprecation warnings
- No type errors
- No runtime errors

### 3. Functionality Test

- Navigation works
- Screens render correctly
- Network requests succeed
- Storage reads/writes work
- Permissions granted

### 4. Type Checking

```bash
npx tsc --noEmit
```

---

## 📋 Common Version Mismatches

### React Version Mismatch

```
Error: React is not defined
```

**Solution:** Ensure React is installed:
```bash
npm install react@19.2.0
```

### Native Module Version Mismatch

```
Error: Native module MyModule not found
```

**Solution:**
1. Remove old pods/node_modules
2. Reinstall
3. Rebuild native code

```bash
rm -rf node_modules ios/Pods
npm install
npm start -- --reset-cache
npm run ios  # or android
```

### Hermes vs V8 Mismatch

```
Error: Hermes expected but V8 present
```

**Solution:** Ensure Hermes configuration matches:

```gradle
// android/app/build.gradle
project.ext.react = [
    enableHermes: true,  // Ensure consistent
]
```

---

## 🔄 Dependency Update Strategy

### Check for Updates

```bash
npm outdated
```

Output shows:
- Current version
- Wanted (compatible update)
- Latest (may have breaking changes)

### Update Strategy

**Safety-first (Recommended):**
```bash
# Update within compatible versions
npm update

# Test everything
npm test
npm run android && npm run ios
```

**Latest versions:**
```bash
# Update to latest (may have breaking changes)
npm install react@latest react-native@latest

# Test thoroughly before committing
npm test
npm run build
```

### Update One at a Time

```bash
# Update one package
npm install react@19.2.0

# Test
npm test

# Then update next package
npm install @react-navigation/native@latest

# Test again
```

---

## 📚 React 19.2 New Features (Optional)

These are available but not required:

### Enhanced Hooks

```typescript
// New Hook: useFormStatus (form submissions)
import { useFormStatus } from 'react';

const SubmitButton = () => {
  const { pending } = useFormStatus();

  return (
    <button disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
};
```

### useActionState Hook

```typescript
import { useActionState } from 'react';

const [state, formAction, pending] = useActionState(async (prevState, formData) => {
  const result = await submitForm(formData);
  return result;
}, initialState);
```

### Use Hook for Async

```typescript
import { use } from 'react';

const Component = ({ promiseData }) => {
  const data = use(promiseData);
  return <Text>{data}</Text>;
};
```

---

## 🚀 Gradual Adoption

You don't need to use new features immediately:

### Keep Existing Code

```typescript
// Still works (React 18 patterns)
import { useState, useEffect } from 'react';

const MyComponent = () => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  return <Text>{data}</Text>;
};
```

### Adopt Gradually

```typescript
// Can use new hooks in new components
import { use } from 'react';

const NewComponent = ({ promise }) => {
  const data = use(promise);
  return <Text>{data}</Text>;
};

// Mix old and new freely
export const App = () => (
  <View>
    <MyComponent />  {/* React 18 style */}
    <NewComponent promise={fetchData()} />  {/* React 19 style */}
  </View>
);
```

---

## 🔍 Compatibility Checklist

Before committing upgrade:

### Code Quality
- [ ] TypeScript compiles without errors (`npx tsc --noEmit`)
- [ ] ESLint passes (`npm run lint`)
- [ ] All tests pass (`npm test`)

### Functionality
- [ ] App launches without crashes
- [ ] All screens navigate correctly
- [ ] Network requests work
- [ ] Data persistence works
- [ ] Permissions work correctly

### Testing
- [ ] Android app runs and functions
- [ ] iOS app runs and functions (macOS)
- [ ] No console warnings
- [ ] Tested on physical devices
- [ ] Tested on different device sizes

### Dependencies
- [ ] All node_modules installed
- [ ] No version conflicts
- [ ] No peer dependency warnings
- [ ] Native modules rebuilt

---

## 📖 Helpful Resources

**Official Upgrade Guide:**
- https://reactnative.dev/docs/upgrading

**React 19 Features:**
- https://react.dev/blog/2024/12/19/react-19

**React Native Changelog:**
- https://github.com/facebook/react-native/releases

**Community Discord:**
- https://discord.gg/react-native

---

## ⏮️ Rollback (If Issues)

If upgrade causes problems:

### Revert to Previous Version

```bash
# Revert in package.json
npm install react@19.1.0 react-native@0.82.0

# Clear cache
rm -rf node_modules package-lock.json
npm install

# Clean native
cd android && ./gradlew clean && cd ..
cd ios && rm -rf Pods && pod install && cd ..

# Reset Metro and test
npm start -- --reset-cache
npm run android
```

### Keep git clean

```bash
# If upgrade commit already made
git revert <commit-hash>

# Then apply fixes one by one
git add .
git commit -m "fix: resolve upgrade issues"
```

---

## 🎯 Post-Upgrade Optimization

Once upgraded successfully:

### 1. Enable New Features (Optional)

```typescript
// Try new React 19 features
import { use } from 'react';

// Refactor async code
const MyComponent = ({ dataPromise }) => {
  const data = use(dataPromise);
  return <Text>{data}</Text>;
};
```

### 2. Update Dependencies

```bash
# Check for compatible updates
npm outdated

# Update libraries that support React 19
npm install @react-navigation/native@latest
```

### 3. Review Performance

```bash
# Profile your app
npm run android -- --profile

# Check bundle size
npm run build && ls -lh dist/
```

---

**Source**: https://reactnative.dev/docs/upgrading
**Version**: React Native 0.83
**Last Updated**: December 2025
