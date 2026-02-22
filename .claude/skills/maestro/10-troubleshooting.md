# MODULE 10: TROUBLESHOOTING & DEBUGGING

## Issue 1: "Element Not Found"

**Error:**
```
Error: Could not find element with text "Login"
```

**Possible Causes:**
1. Text doesn't match exactly (case-sensitive)
2. Element not visible (scrolled out)
3. Wrong testID
4. Element hasn't loaded yet
5. **testID hidden by parent accessibility aggregation** (see Issue 1a below)

**Solutions:**

```yaml
# ✅ Solution 1: Match exact text
- tapOn: "Login"  # Not "login" or "LOGIN"

# ✅ Solution 2: Use testID
- tapOn:
    id: "login_button"

# ✅ Solution 3: Scroll first
- scroll:
    direction: "down"
    amount: 3
- tapOn: "Element"

# ✅ Solution 4: Use regex text matching
- tapOn:
    text: "Log.*"
```

**Debug Steps:**
```bash
# Show view hierarchy
maestro hierarchy

# Enable detailed logs
maestro test flow.yaml --debug-output ./debug

# Use Studio to inspect
maestro studio
```

---

## Issue 1a: testID Hidden by Accessibility Aggregation (React Native)

**Error:**
```
Unable to find element with id: "email_input"
```

**Symptom:** testID exists in code but Maestro can't find it. When you inspect the hierarchy, you see testIDs merged into parent's accessibilityText:
```json
"accessibilityText": "Continue with Apple, email_input, password_input, Login"
```

**Cause:** Container components (`Pressable`, `TouchableOpacity`, `View`) with `accessible={true}` (default for touchables) aggregate all child accessibility info into a single element.

**Solution:**
```jsx
// ❌ BROKEN - testIDs hidden
<Pressable onPress={Keyboard.dismiss}>
  <TextInput testID="email_input" />
</Pressable>

// ✅ FIXED - testIDs exposed
<Pressable onPress={Keyboard.dismiss} accessible={false}>
  <TextInput testID="email_input" accessible={true} />
</Pressable>
```

**Debug Steps:**
```bash
# Inspect view hierarchy to see if testIDs are aggregated
maestro studio

# Look for accessibilityText containing multiple testIDs
# If you see: "text1, testID1, testID2, text2"
# → Parent is aggregating children, add accessible={false}
```

**See:** [07-react-native-integration.md](07-react-native-integration.md) for full details.

---

## Issue 2: "Timed Out Waiting"

**Error:**
```
Timed out waiting for element (timeout: 30s)
```

**Causes:**
1. App is slow
2. Element on different screen
3. Network request taking too long
4. Animation not complete

**Solutions:**

```bash
# Check device status
maestro devices

# Run with detailed output
maestro test flow.yaml --debug-output

# Verify app installed
adb shell pm list packages | grep your.app
```

---

## Issue 3: "Works Locally, Fails in CI"

**Causes:**
1. Different emulator/simulator
2. Network differences
3. Environment variables not set
4. Device state not reset

**Solutions:**

```yaml
# ✅ Use text, not coordinates
- tapOn: "Login"    # ✓ Good
- tapOn: [150, 200] # ✗ Bad

# ✅ Use testID
- tapOn:
    id: "login_button"

# ✅ Wait for state
- assertVisible: "Loading"
- assertVisible: "Results"
```

---

## Issue 4: App Failed to Start (Screenshot Shows Home Screen)

**Symptom:** Test fails and the screenshot shows the iOS home screen or device wallpaper instead of your app.

**Cause:** The app crashed on launch or failed to start. Common reasons:
1. Native code crash (check Xcode logs)
2. JavaScript bundle error
3. Missing native module
4. Configuration error in app.json
5. Reanimated callback not wrapped with `runOnJS`

**Solutions:**
1. Check native logs: `xcrun simctl spawn booted log stream --predicate 'subsystem contains "com.yourapp"'`
2. Rebuild with clean: `npx expo prebuild --clean && npm run dev:ios`
3. Check Metro bundler for JS errors
4. Review recent changes to native config (app.json, plugins)

**Important:** If screenshot doesn't show your app at all, the problem is app startup - not the test itself.

---

## Issue 5: Splash Screen Cannot Be Tested

**Symptom:** Tests asserting splash screen elements (`splash-container`, `splash-icon`) always fail.

**Cause:** Splash screens are too fast for Maestro to catch. By the time Maestro launches the app and starts asserting, the splash animation has already completed.

**Reality:**
- Native splash: Controlled by OS, not testable
- Custom splash: Typically 500-1000ms, too fast for Maestro's assertion timing
- Maestro takes ~1-2s just to launch app and begin assertions

**Solution:** Don't write tests that assert splash screen visibility. Instead:
1. Test the result (intro screen appears)
2. Use `extendedWaitUntil` to wait for post-splash content
3. Visual verification during development is sufficient for splash screens

```yaml
# ❌ Will fail - splash is gone before assertion runs
- assertVisible:
    id: splash-container

# ✅ Test the outcome instead
- extendedWaitUntil:
    visible:
      id: intro_container
    timeout: 5000
```

---

## Issue 6: Flaky Tests

**Symptoms:**
- Test passes 9/10 times
- Random failures

**Solutions:**

```yaml
# ❌ Problem: Race condition
- tapOn: "Button"
- tapOn: "Next"  # Too fast

# ✅ Solution: Force wait
- tapOn: "Button"
- assertVisible: "Next Button"
- tapOn: "Next"
```

---

## Debugging Checklist

- [ ] Run `maestro doctor` to verify environment
- [ ] Check `maestro devices` for connected devices
- [ ] Run with `--debug-output` to see step details
- [ ] Use `maestro hierarchy` to inspect elements
- [ ] Check element text is exact match
- [ ] Verify testID exists in component
- [ ] Ensure proper scrolling before tapping
- [ ] Review logs with `maestro logs`
- [ ] Try in Maestro Studio to inspect visually

---

## Reference Tables

### All YAML Commands Summary

| Command | Purpose | Returns |
|---------|---------|---------|
| `launchApp` | Start app | void |
| `tapOn: "text"` | Tap element | void |
| `inputText: "text"` | Type text | void |
| `scroll: {...}` | Scroll view | void |
| `swipe: {...}` | Swipe gesture | void |
| `pressKey: "KEY"` | Press key | void |
| `assertVisible: "text"` | Verify visible | pass/fail |
| `assertNotVisible: "text"` | Verify hidden | pass/fail |
| `runFlow: "file.yaml"` | Execute flow | nested result |
| `setVar: V = "v"` | Set variable | void |
| `assertTrue: ${V}` | Assert true | pass/fail |

### All CLI Commands Summary

| Command | Purpose | Returns |
|---------|---------|---------|
| `maestro --version` | Show version | version string |
| `maestro test` | Run tests | exit code 0/1 |
| `maestro init` | Initialize project | creates files |
| `maestro devices` | List devices | device list |
| `maestro doctor` | Check environment | status report |
| `maestro logs` | Show logs | log output |
| `maestro record` | Record test | YAML file |
| `maestro studio` | Open Studio | GUI |

---

**Version:** 2.x (2.2.0) | **Source:** https://docs.maestro.dev/
