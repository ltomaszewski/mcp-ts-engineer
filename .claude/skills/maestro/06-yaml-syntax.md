# YAML Command Reference - Maestro

Complete reference for all Maestro YAML commands: actions, assertions, gestures, flow control, and device management.

---

## Flow File Structure

```yaml
# Header: app identifier and environment variables
appId: com.example.app
env:
  USERNAME: testuser
  PASSWORD: ${TEST_PASSWORD}

# Separator (required)
---

# Steps: sequential list of commands
- launchApp
- tapOn: "Login"
- inputText: ${USERNAME}
- assertVisible: "Welcome"
```

**YAML Rules:**
- 2-space indentation (never tabs)
- Strings in quotes only if containing special characters
- Comments start with `#`
- Array items start with `-`

---

## Selectors

Most action and assertion commands accept a selector to target UI elements.

| Selector | Syntax | Description |
|----------|--------|-------------|
| `text` | `text: "Submit"` | Match visible text or accessibility label (regex) |
| `id` | `id: "submit-btn"` | Match accessibility identifier / testID (regex) |
| `index` | `index: 0` | 0-based index among matching elements |
| `point` | `point: "50%,50%"` | Relative (%) or absolute (px) coordinates |
| `width` | `width: 200` | Match element width |
| `height` | `height: 48` | Match element height |
| `tolerance` | `tolerance: 10` | Pixel tolerance for width/height matching |
| `enabled` | `enabled: true` | Match enabled state |
| `checked` | `checked: true` | Match checked state |
| `focused` | `focused: true` | Match keyboard focus state |
| `selected` | `selected: true` | Match selected state |

Selectors can be combined:

```yaml
- tapOn:
    text: "Submit"
    enabled: true
    index: 0
```

### Shorthand Selectors

```yaml
# Text shorthand
- tapOn: "Login"

# ID shorthand
- tapOn:
    id: "login-btn"
```

---

## App Lifecycle Commands

### launchApp

Start the app. Kills previous instance and clears state by default.

```yaml
# Basic launch (clears state)
- launchApp

# Launch with options
- launchApp:
    clearState: true
    clearKeychain: true

# Launch specific app
- launchApp:
    appId: "com.other.app"

# Resume without restart
- launchApp:
    stopApp: false

# Launch with arguments
- launchApp:
    appId: "com.example.app"
    arguments:
      debugMode: true
      apiUrl: "https://staging.api.com"

# Launch with permissions
- launchApp:
    permissions:
      notifications: allow
      location: deny
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `appId` | string | flow header | Package name (Android) or bundle ID (iOS) |
| `clearState` | boolean | `true` | Clear app data before launch |
| `clearKeychain` | boolean | `false` | Clear iOS keychain |
| `stopApp` | boolean | `true` | Stop app before relaunch |
| `permissions` | object | all allowed | Permission grants (`allow` / `deny`) |
| `arguments` | object | -- | Key-value args passed to app |

### stopApp

Stop the running app without clearing state.

```yaml
- stopApp
- stopApp:
    appId: "com.example.app"
```

### killApp

Force-kill the app process.

```yaml
- killApp
- killApp:
    appId: "com.example.app"
```

### clearState

Clear app data without relaunching.

```yaml
- clearState
- clearState:
    appId: "com.example.app"
```

### clearKeychain

Clear the entire iOS keychain.

```yaml
- clearKeychain
```

---

## Tap Commands

### tapOn

Tap on a UI element.

```yaml
# By text
- tapOn: "Login"

# By ID
- tapOn:
    id: "login-btn"

# By point (relative)
- tapOn:
    point: "50%,50%"

# With repeat
- tapOn:
    id: "increment"
    repeat: 5
    delay: 200

# Disable retry on no change
- tapOn:
    id: "toggle"
    retryTapIfNoChange: false
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `text` | string | -- | Match visible text (regex) |
| `id` | string | -- | Match accessibility ID (regex) |
| `point` | string | -- | Coordinates (`"50%,50%"` or `"100,200"`) |
| `index` | integer | 0 | Index among matching elements |
| `repeat` | integer | 1 | Number of taps |
| `delay` | integer | 100 | Milliseconds between repeated taps |
| `retryTapIfNoChange` | boolean | `false` | Retry if hierarchy unchanged |
| `waitToSettleTimeoutMs` | integer | -- | Max wait for UI to settle |
| `optional` | boolean | `false` | Skip without failing if not found |
| `label` | string | -- | Custom step label for reports |

### doubleTapOn

Double-tap on a UI element. Same selector options as `tapOn`.

```yaml
- doubleTapOn: "Like"
- doubleTapOn:
    id: "image-preview"
```

### longPressOn

Long press on a UI element. Same selector options as `tapOn`.

```yaml
- longPressOn: "Message"
- longPressOn:
    id: "list-item"
```

---

## Text Input Commands

### inputText

Type text into the currently focused input field.

```yaml
# Into focused field
- inputText: "hello@example.com"

# With variable
- inputText: ${EMAIL}

# Random data (Maestro v2.0+)
- inputText: ${faker.email()}
```

### eraseText

Delete characters from the currently focused field.

```yaml
# Erase default 50 characters
- eraseText

# Erase specific count
- eraseText: 10
```

**iOS workaround** for reliable erase:

```yaml
- longPressOn:
    id: "text-input"
- tapOn: "Select All"
- eraseText
```

### copyTextFrom

Copy text from an element into memory. Access via `maestro.copiedText`.

```yaml
- copyTextFrom:
    id: "price-label"
- tapOn:
    id: "search-field"
- pasteText
```

### pasteText

Paste the last copied text into the focused field.

```yaml
- pasteText
```

### pressKey

Press a special device key.

```yaml
- pressKey: Enter
- pressKey: Backspace
- pressKey: Home
- pressKey: Back
- pressKey: Lock
- pressKey: Volume Up
- pressKey: Volume Down
- pressKey: Power
- pressKey: Tab
```

| Key | Platform | Description |
|-----|----------|-------------|
| `Home` | Both | Home button |
| `Lock` | Both | Lock screen |
| `Enter` | Both | Enter / Return |
| `Backspace` | Both | Delete character |
| `Back` | Android only | Back button |
| `Power` | Android only | Power button |
| `Tab` | Android only | Tab key |
| `Volume Up` | Both | Increase volume |
| `Volume Down` | Both | Decrease volume |

**Android TV remote keys:** `Remote Dpad Up`, `Remote Dpad Down`, `Remote Dpad Left`, `Remote Dpad Right`, `Remote Dpad Center`, `Remote Media Play Pause`, `Remote Media Stop`, `Remote Menu`

### hideKeyboard

Dismiss the on-screen keyboard.

```yaml
- hideKeyboard
```

---

## Gesture Commands

### swipe

Swipe gesture by direction, coordinates, or from an element.

```yaml
# By direction
- swipe:
    direction: LEFT

# By direction with duration
- swipe:
    direction: UP
    duration: 2000

# By relative coordinates
- swipe:
    start: "90%,50%"
    end: "10%,50%"

# From element
- swipe:
    from:
      id: "card-item"
    direction: LEFT
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `direction` | `LEFT` \| `RIGHT` \| `UP` \| `DOWN` | -- | Swipe direction |
| `start` | string | -- | Start coordinates (`"x%,y%"` or `"x,y"`) |
| `end` | string | -- | End coordinates |
| `duration` | integer | 400 | Swipe duration in milliseconds |
| `from` | selector | -- | Element to swipe from |
| `waitToSettleTimeoutMs` | integer | -- | Max wait for UI to settle |

**Direction defaults:**

| Direction | Start | End |
|-----------|-------|-----|
| `LEFT` | 90%,50% | 10%,50% |
| `RIGHT` | 10%,50% | 90%,50% |
| `UP` | 50%,50% | 50%,10% |
| `DOWN` | 50%,20% | 50%,90% |

### scroll

Simple vertical scroll.

```yaml
- scroll
```

### scrollUntilVisible

Scroll in a direction until a target element appears.

```yaml
# Basic
- scrollUntilVisible:
    element:
      id: "target-item"
    direction: DOWN

# With options
- scrollUntilVisible:
    element:
      text: "Settings"
    direction: DOWN
    timeout: 15000
    speed: 60
    centerElement: true
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `element` | selector | -- | Target element to find |
| `direction` | `DOWN` \| `UP` \| `LEFT` \| `RIGHT` | `DOWN` | Scroll direction |
| `timeout` | integer | 20000 | Max search time in ms |
| `speed` | integer | 40 | Scroll velocity (0-100) |
| `visibilityPercentage` | integer | 100 | Required visibility (0-100%) |
| `centerElement` | boolean | `false` | Attempt to center element on screen |

---

## Assertion Commands

### assertVisible

Assert an element is visible on screen. Waits automatically.

```yaml
# By text
- assertVisible: "Welcome"

# By ID
- assertVisible:
    id: "home-screen"

# With state
- assertVisible:
    text: "Submit"
    enabled: true
```

### assertNotVisible

Assert an element is NOT visible.

```yaml
- assertNotVisible: "Loading..."
- assertNotVisible:
    id: "error-banner"
```

### assertTrue

Assert a JavaScript expression evaluates to true.

```yaml
- assertTrue: ${output.count > 0}
- assertTrue: ${MY_VAR == "expected"}
```

### assertWithAI

Use AI vision to assert screen content (requires Maestro Cloud or AI integration).

```yaml
- assertWithAI: "The login form is displayed with email and password fields"
```

### assertNoDefectsWithAi

Use AI to check for visual defects on screen.

```yaml
- assertNoDefectsWithAi
```

---

## Flow Control Commands

### runFlow

Execute another flow file as a sub-flow.

```yaml
# Simple
- runFlow: login.yaml

# With env variables
- runFlow:
    file: login.yaml
    env:
      EMAIL: "test@example.com"
      PASSWORD: "pass123"

# Conditional
- runFlow:
    when:
      visible: "onboarding-screen"
    file: complete-onboarding.yaml

# Inline commands
- runFlow:
    env:
      TEXT: "Hello"
    commands:
      - inputText: ${TEXT}
      - pressKey: Enter
```

### repeat

Loop a set of commands.

```yaml
# Fixed count
- repeat:
    times: 5
    commands:
      - tapOn:
          id: "next"
      - scroll

# While condition
- repeat:
    while:
      notVisible: "End of List"
    commands:
      - scroll

# JavaScript condition
- evalScript: ${output.counter = 0}
- repeat:
    while:
      true: ${output.counter < 10}
    commands:
      - tapOn:
          id: "item"
      - evalScript: ${output.counter = output.counter + 1}

# Combined: max count + condition
- repeat:
    times: 10
    while:
      notVisible: "Target Item"
    commands:
      - scroll
```

### retry

Retry commands on failure.

```yaml
- retry:
    maxRetries: 3
    commands:
      - tapOn:
          id: "flaky-button"
      - assertVisible:
          id: "result"
```

### extendedWaitUntil

Wait for a condition with a timeout.

```yaml
- extendedWaitUntil:
    visible:
      id: "loaded-content"
    timeout: 10000

- extendedWaitUntil:
    notVisible: "Loading..."
    timeout: 5000
```

### waitForAnimationToEnd

Wait for all animations to finish before continuing.

```yaml
- waitForAnimationToEnd
- waitForAnimationToEnd:
    timeout: 5000
```

---

## JavaScript and Variables

### evalScript

Execute inline JavaScript. Use `output` object to store values.

```yaml
- evalScript: ${output.timestamp = Date.now()}
- evalScript: ${output.name = MY_NAME.toUpperCase()}
- inputText: ${output.name}
```

### runScript

Execute an external JavaScript file.

```yaml
- runScript: scripts/setup-data.js
```

### extractTextWithAI

Use AI to extract text from the current screen.

```yaml
- extractTextWithAI:
    query: "What is the total price shown?"
    outputVariable: totalPrice
- assertTrue: ${totalPrice != ""}
```

---

## Device Management Commands

### setLocation

Set device GPS coordinates.

```yaml
- setLocation:
    latitude: 37.7749
    longitude: -122.4194
```

### setOrientation

Set device orientation.

```yaml
- setOrientation: LANDSCAPE
- setOrientation: PORTRAIT
```

### setPermissions

Configure app permissions.

```yaml
- setPermissions:
    notifications: allow
    location: deny
    camera: allow
```

### setClipboard

Set clipboard content.

```yaml
- setClipboard: "Pasted text"
```

### setAirplaneMode

Enable or disable airplane mode.

```yaml
- setAirplaneMode: true
- setAirplaneMode: false
```

### toggleAirplaneMode

Toggle airplane mode on/off.

```yaml
- toggleAirplaneMode
```

### addMedia

Add an image or video to the device gallery.

```yaml
- addMedia: "assets/test-photo.jpg"
```

---

## Navigation Commands

### back

Press the back button (Android). Navigate back on iOS.

```yaml
- back
```

### openLink

Open a URL or deep link.

```yaml
- openLink: "https://example.com"
- openLink: "myapp://profile/123"
```

### travel

Simulate device movement between GPS coordinates over time.

```yaml
- travel:
    points:
      - latitude: 37.7749
        longitude: -122.4194
      - latitude: 37.7849
        longitude: -122.4094
    speed: 5
```

---

## Screenshot and Recording

### takeScreenshot

Capture a screenshot and save with the given name.

```yaml
- takeScreenshot: "after-login"
```

### startRecording

Begin screen recording.

```yaml
- startRecording: "test-flow"
```

### stopRecording

End screen recording.

```yaml
- stopRecording
```

---

## Complete Flow Example

```yaml
appId: com.example.ecommerce
env:
  EMAIL: ${TEST_EMAIL}
  PASSWORD: ${TEST_PASSWORD}
---
# Login
- launchApp:
    clearState: true
- tapOn:
    id: "email-input"
- inputText: ${EMAIL}
- tapOn:
    id: "password-input"
- inputText: ${PASSWORD}
- tapOn:
    id: "login-button"
- assertVisible:
    id: "home-screen"

# Navigate to product
- scrollUntilVisible:
    element:
      id: "product-featured"
    direction: DOWN
    timeout: 10000
- tapOn:
    id: "product-featured"
- assertVisible:
    id: "product-detail"

# Add to cart
- tapOn:
    id: "add-to-cart"
- assertVisible:
    text: "Added to cart"

# Checkout
- tapOn:
    id: "cart-icon"
- assertVisible:
    id: "cart-screen"
- tapOn:
    id: "checkout-button"
- assertVisible:
    id: "payment-screen"

# Take screenshot for verification
- takeScreenshot: "checkout-complete"
```

---

**Source:** https://docs.maestro.dev/api-reference/commands
