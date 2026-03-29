# MODULE 3: CORE CONCEPTS

## Flows: The Foundation

A **Flow** is a YAML file containing a sequence of test steps representing a user journey.

### Flow Anatomy

```yaml
# Header: app config, env vars, hooks
appId: com.example.app
name: "Login Flow"
tags:
  - auth
  - smoke
env:
  USERNAME: testuser
  PASSWORD: ${TEST_PASSWORD}
onFlowStart:
  - runFlow: helpers/setup.yaml
onFlowComplete:
  - runFlow: helpers/teardown.yaml

# Separator (required)
---

# Body: sequential array of commands
- launchApp:
    clearState: true
- tapOn: "Login"
- inputText: ${USERNAME}
- assertVisible: "Welcome"
```

### Flow Configuration Properties

| Property | Type | Description |
|----------|------|-------------|
| `appId` | string | Package name (Android) or bundle ID (iOS) |
| `url` | string | URL for web flows (v2.0+ -- replaces URL in appId) |
| `name` | string | Custom name for the flow (used in reports) |
| `tags` | string[] | Tags for filtering with `--include-tags` / `--exclude-tags` |
| `env` | object | Key-value environment variables scoped to this flow |
| `onFlowStart` | command[] | Commands executed before the flow starts |
| `onFlowComplete` | command[] | Commands executed after flow finishes (pass or fail) |

### Minimal Valid Flow

```yaml
appId: com.example.app
---
- launchApp
```

### Web Flow (v2.0+)

```yaml
url: https://example.com
---
- launchApp
- tapOn: "Login"
- assertVisible: "Dashboard"
```

### Complete User Journey Flow

```yaml
appId: com.banking.app
env:
  EMAIL: ${TEST_EMAIL}
  PASS: ${TEST_PASSWORD}
---
# 1. Launch app
- launchApp:
    clearState: true
- assertVisible: "Login Screen"

# 2. Perform login
- tapOn:
    id: "email-input"
- inputText: ${EMAIL}
- tapOn:
    id: "password-input"
- inputText: ${PASS}
- tapOn:
    id: "sign-in-btn"
- assertVisible: "Dashboard"

# 3. Navigate to transfers
- tapOn: "Transfers"
- assertVisible: "Send Money"

# 4. Initiate transfer
- tapOn: "New Transfer"
- inputText: "1000"
- tapOn: "Continue"

# 5. Verify completion
- assertVisible: "Transfer Complete"
- assertNotVisible: "Error Message"
```

## Commands: Core Actions

### Action Commands (User Interactions)

| Command | Purpose | Example |
|---------|---------|---------|
| `launchApp` | Start application | `- launchApp` |
| `tapOn` | Click/tap UI element | `- tapOn: "Button"` |
| `doubleTapOn` | Double-tap element | `- doubleTapOn: { id: "img" }` |
| `longPressOn` | Long press element | `- longPressOn: { id: "item" }` |
| `inputText` | Type text into field | `- inputText: "hello"` |
| `eraseText` | Delete characters | `- eraseText: 10` |
| `pressKey` | Press device key | `- pressKey: Enter` |
| `swipe` | Perform swipe gesture | `- swipe: { direction: LEFT }` |
| `scroll` | Scroll container | `- scroll` |
| `scrollUntilVisible` | Scroll to element | See YAML reference |
| `back` | Navigate back | `- back` |
| `openLink` | Open URL/deep link | `- openLink: "myapp://route"` |
| `hideKeyboard` | Dismiss keyboard | `- hideKeyboard` |
| `copyTextFrom` | Copy element text | `- copyTextFrom: { id: "x" }` |
| `pasteText` | Paste clipboard | `- pasteText` |
| `setClipboard` | Set clipboard directly (v2.1+) | `- setClipboard: "text"` |
| `setOrientation` | Set device orientation (v2.0+) | `- setOrientation: LANDSCAPE` |
| `setPermissions` | Set app permissions (v2.1+) | `- setPermissions: { ... }` |
| `setLocation` | Set GPS coordinates | `- setLocation: { lat, lng }` |
| `addMedia` | Add to device gallery | `- addMedia: "photo.jpg"` |

### Assertion Commands (Verification)

| Command | Purpose | Example |
|---------|---------|---------|
| `assertVisible` | Element is visible | `- assertVisible: "Success"` |
| `assertNotVisible` | Element is hidden | `- assertNotVisible: "Error"` |
| `assertTrue` | JS expression is true | `- assertTrue: ${VAR > 0}` |
| `assertWithAI` | AI visual assertion | `- assertWithAI: "login form shown"` |
| `assertNoDefectsWithAi` | AI defect detection | `- assertNoDefectsWithAi` |
| `assertScreenshot` | Visual regression (v2.2+) | `- assertScreenshot: "login"` |

### Flow Control Commands

| Command | Purpose | Example |
|---------|---------|---------|
| `runFlow` | Execute sub-flow | `- runFlow: login.yaml` |
| `repeat` | Loop commands | See YAML reference |
| `retry` | Retry on failure | `- retry: { maxRetries: 3 }` |
| `extendedWaitUntil` | Wait for condition | See YAML reference |
| `waitForAnimationToEnd` | Wait for animations | `- waitForAnimationToEnd` |
| `evalScript` | Run inline JavaScript | `- evalScript: ${...}` |
| `runScript` | Run external JS file | `- runScript: setup.js` |

## Selectors: Identifying Elements

Maestro supports multiple element identification strategies. All text fields in selectors support **regular expressions**.

### 1. By Visible Text (Most Common)

```yaml
- tapOn: "Login"
- tapOn: "Submit Order"
- tapOn: "Cancel.*"  # regex match
```

**Advantages:** Doesn't require app modifications, works cross-platform, human-readable.
**Limitations:** Case-sensitive, text might change, i18n complicates things.

### 2. By testID / Accessibility ID (Recommended)

```yaml
- tapOn:
    id: "login_button"
- tapOn:
    id: "email.*"  # regex match
```

**Advantages:** Stable across UI changes, not affected by text changes.
**Implementation (React Native):** `<Button testID="login_button" />`

### 3. By Relative Position

```yaml
# Element below another
- tapOn:
    below:
      text: "Username"

# Element above another
- tapOn:
    above:
      id: "footer"

# Element left/right of another
- tapOn:
    leftOf:
      text: "Price"

- tapOn:
    rightOf:
      id: "label"

# Parent containing a specific child
- tapOn:
    containsChild:
      text: "Submit"

# Child of a specific parent
- tapOn:
    childOf:
      id: "form-container"
    text: "Submit"

# Parent containing all listed descendants
- tapOn:
    containsDescendants:
      - text: "Title"
      - id: "subtitle"
```

### 4. By Element State

```yaml
- tapOn:
    text: "Submit"
    enabled: true

- assertVisible:
    id: "checkbox"
    checked: true

- tapOn:
    id: "field"
    focused: true
```

### 5. By Index (Disambiguation)

```yaml
# First element matching "Item"
- tapOn:
    text: "Item"
    index: 0

# Negative index for last element (v2.0.6+)
- tapOn:
    text: "Item"
    index: -1
```

### 6. By Point / Coordinates (Last Resort)

```yaml
# Relative (percentage-based)
- tapOn:
    point: "50%,50%"

# Absolute pixels
- tapOn:
    point: "100,200"
```

### Combining Selectors

Selectors can be combined for precise targeting:

```yaml
- tapOn:
    text: "Submit"
    enabled: true
    index: 0
```

## Variables and JavaScript

### Environment Variables

```yaml
appId: com.example.app
env:
  EMAIL: test@example.com
  PASSWORD: ${TEST_PASSWORD}  # from CLI or system env
---
- inputText: ${EMAIL}
- inputText: ${PASSWORD}
```

```bash
# Pass from CLI
maestro test flow.yaml --env EMAIL=test@x.com --env PASSWORD=secret

# Or from system environment
export TEST_PASSWORD=secret
maestro test flow.yaml
```

### JavaScript with GraalJS (v2.0+)

The default JavaScript engine is **GraalJS** (Rhino is deprecated).

```yaml
# evalScript -- inline JS using output object
- evalScript: ${output.timestamp = Date.now()}
- evalScript: ${output.name = "User " + Math.floor(Math.random() * 1000)}
- inputText: ${output.name}

# DataFaker for random test data (v2.0+)
- evalScript: ${output.email = faker.internet().emailAddress()}
- inputText: ${output.email}

# runScript -- external JS file
- runScript: scripts/setup-data.js
```

### Conditions

Four condition types available with `when` or `while`:

| Condition | Description | Example |
|-----------|-------------|---------|
| `visible` | Element is visible | `visible: "Dismiss"` |
| `notVisible` | Element is not visible | `notVisible: "Loading"` |
| `platform` | Current platform matches | `platform: Android` |
| `true` | JS expression is true | `true: ${output.count < 10}` |

Conditions can be combined (AND logic):

```yaml
- runFlow:
    when:
      platform: Android
      visible: "Allow Notifications"
    file: dismiss-notification.yaml
```

## Execution Model

### Sequential Execution

Maestro executes steps top to bottom. If any step fails, execution stops immediately.

### Automatic Waiting

Maestro intelligently waits for:
- UI elements to appear
- Animations to complete
- Network responses
- Content to load

```yaml
# No manual delays needed
- tapOn: "Search"
- inputText: "products"
- tapOn: "Submit"
- assertVisible: "Results"  # Waits for results to load
```

### Error Handling

When a step fails:
1. Execution stops
2. Error logged with step name
3. Screenshot captured
4. Debug info printed
5. Exit code `1` returned

### Hooks (v2.0+)

Hooks run commands before/after every flow:

```yaml
onFlowStart:
  - runFlow: helpers/login.yaml
  - runScript: setup.js
onFlowComplete:
  - runFlow: helpers/teardown.yaml
```

**Hook behavior:**
- `onFlowStart` failure: Flow marked Failed, body skipped, but `onFlowComplete` still runs
- `onFlowComplete` failure: Flow marked Failed regardless of body result

---

**See Also:** [06-yaml-syntax.md](06-yaml-syntax.md) for complete command reference with all parameters.

**Version:** 2.x (2.3.1) | **Source:** https://docs.maestro.dev/
