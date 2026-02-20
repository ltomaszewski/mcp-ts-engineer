# MODULE 3: CORE CONCEPTS

## Flows: The Foundation

A **Flow** is a YAML file containing a sequence of test steps representing a user journey.

### Flow Anatomy

```yaml
# Header: App identifier
appId: com.example.app

# Separator (required)
---

# Body: Array of steps/commands
- launchApp
- tapOn: "Login"
- inputText: "test@example.com"
- assertVisible: "Welcome"
```

### Minimal Valid Flow

```yaml
appId: com.example.app
---
- launchApp
```

This launches the app and verifies it starts without errors.

### Complete User Journey Flow

```yaml
appId: com.banking.app
---

# 1. Launch app
- launchApp
- assertVisible: "Login Screen"

# 2. Perform login
- tapOn: "Email Input"
- inputText: "user@example.com"

- tapOn: "Password Input"  
- inputText: "SecurePassword123"

- tapOn: "Sign In"
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

These commands simulate user interactions:

| Command | Purpose | Example |
|---------|---------|---------|
| `launchApp` | Start application | `- launchApp` |
| `tapOn` | Click/tap UI element | `- tapOn: "Button"` |
| `inputText` | Type text into field | `- inputText: "hello"` |
| `swipe` | Perform swipe gesture | `- swipe: {start: [x,y], end: [x,y]}` |
| `scroll` | Scroll container | `- scroll: {direction: "down"}` |
| `back` | Navigate back | `- back` |
| `openLink` | Open URL | `- openLink: "https://..."` |
| `pressKey` | Press device key | `- pressKey: "ENTER"` |

### Assertion Commands (Verification)

These commands verify application state:

| Command | Purpose | Example |
|---------|---------|---------|
| `assertVisible` | Element is visible | `- assertVisible: "Success"` |
| `assertNotVisible` | Element is hidden | `- assertNotVisible: "Error"` |
| `assertTrue` | Variable is true | `- assertTrue: ${VAR}` |

## Selectors: Identifying Elements

Maestro supports multiple element identification strategies:

### 1. By Visible Text (Most Common)

```yaml
- tapOn: "Login"
- tapOn: "Submit Order"
- tapOn: "Cancel"
```

**Advantages:**
- Doesn't require app modifications
- Works cross-platform
- Human-readable

**Limitations:**
- Case-sensitive
- Text might change
- Multilingual apps complicated

### 2. By testID (React Native)

```yaml
- tapOn:
    id: "login_button"

- inputText:
    id: "email_input"
    text: "user@example.com"
```

**Advantages:**
- Stable across UI changes
- Explicit targeting
- Not affected by text changes

**Implementation (React Native):**
```jsx
<Button testID="login_button" title="Login" />
<TextInput testID="email_input" />
```

### 3. By XPath (Advanced)

```yaml
- tapOn:
    xpath: "//Button[contains(@text, 'Login')]"

- tapOn:
    xpath: "//EditText[@resource-id='password_input']"
```

**Advantages:**
- Powerful matching
- Complex element selection
- Parent/child relationships

**Common XPath Patterns:**
```xpath
//Button[@text='Login']              # Exact text match
//Button[contains(@text, 'Log')]     # Partial text
//View[@resource-id='button_1']      # By resource ID
//*[position()=1]                    # First element
```

### 4. By Coordinates (Last Resort)

```yaml
- tapOn: [150, 200]  # x: 150, y: 200
```

**Disadvantages:**
- Fragile (breaks on layout changes)
- Device-specific
- Hard to maintain

## Variables: Dynamic Test Data

### Declaring Variables

```yaml
appId: com.example.app
---

# Set variable
- setVar: USER_EMAIL = "john@example.com"

# Use variable
- inputText: ${USER_EMAIL}

# Set boolean variable
- setVar: IS_LOGGED_IN = "true"

# Assert variable
- assertTrue: ${IS_LOGGED_IN}
```

### Environment Variables

```bash
# Pass variables from command line
USER_EMAIL=test@example.com \
USER_PASSWORD=password123 \
maestro test flow.yaml
```

**In Flow:**
```yaml
appId: com.example.app
---
- launchApp
- inputText: ${USER_EMAIL}
- inputText: ${USER_PASSWORD}
- tapOn: "Sign In"
```

## Execution Model

### Sequential Execution

Maestro executes steps in order, top to bottom:

```yaml
appId: com.example.app
---
- launchApp              # Step 1 executes
- tapOn: "Menu"          # Step 2 executes after Step 1 completes
- tapOn: "Settings"      # Step 3 executes after Step 2 completes
- assertVisible: "Home"  # Step 4 executes after Step 3 completes
```

If any step fails, execution stops immediately.

### Automatic Waiting

Maestro intelligently waits for:
- UI elements to appear
- Animations to complete
- Network responses
- Content to load

```yaml
# No manual delays needed!
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

```bash
$ maestro test flow.yaml
✓ launchApp
✓ tapOn "Login"
✗ assertVisible "Dashboard"
  Error: Element not found after 30s timeout
  Screenshot: maestro-results/failure.png

✗ Test failed (2/3 steps passed)
```

---

**Next:** See **06-yaml-syntax.md** for complete command reference with all parameters.
