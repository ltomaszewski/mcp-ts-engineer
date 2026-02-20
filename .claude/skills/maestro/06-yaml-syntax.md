# MODULE 6: YAML SYNTAX REFERENCE

## File Structure

Every flow file follows this pattern:

```yaml
# Line 1-2: Metadata
appId: com.example.app

# Line 3: Separator (required)
---

# Line 4+: Steps array
- step1: value
- step2:
    param: value
    param2: value
```

**YAML Rules:**
- 2-space indentation (never tabs)
- Strings in quotes only if containing special characters
- Comments start with `#`
- Array items start with `-`

## launchApp

**Description:** Start the app in a clean state.

**Syntax:**
```yaml
- launchApp
```

**Parameters:** None

**Behavior:**
- Kills previous app instance
- Clears app state
- Restarts from home screen

---

## tapOn

**Description:** Tap/click on UI element.

**Syntax:**
```yaml
- tapOn: <selector>
```

**Selector Options:**
```yaml
# By visible text
- tapOn: "Login"

# By testID
- tapOn:
    id: "login_button"

# By XPath
- tapOn:
    xpath: "//Button[contains(@text, 'Login')]"

# By coordinates (x, y)
- tapOn: [150, 200]
```

---

## inputText

**Description:** Type text into focused input field.

**Syntax:**
```yaml
- inputText: "<text>"
```

**With Target:**
```yaml
- inputText:
    id: "field_id"
    text: "<text>"
```

---

## scroll

**Description:** Scroll within scrollable container.

**Syntax:**
```yaml
- scroll:
    direction: <up|down|left|right>
    amount: <number>
```

**Parameters:**
| Parameter | Type | Required | Values |
|-----------|------|----------|--------|
| `direction` | string | ✓ | up, down, left, right |
| `amount` | integer | ✗ | scroll steps (default: 1) |

**Examples:**
```yaml
# Scroll down 3 steps
- scroll:
    direction: "down"
    amount: 3

# Scroll up once
- scroll:
    direction: "up"
```

---

## swipe

**Description:** Perform swipe gesture between two points.

**Syntax:**
```yaml
- swipe:
    start: [x1, y1]
    end: [x2, y2]
    duration: <milliseconds>
```

**Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `start` | [int, int] | ✓ | Starting coordinates [x, y] |
| `end` | [int, int] | ✓ | Ending coordinates [x, y] |
| `duration` | integer | ✗ | Swipe duration ms (default: 300) |

---

## assertVisible

**Description:** Assert element is visible on screen.

**Syntax:**
```yaml
- assertVisible: <selector>
```

**Behavior:**
- Test fails if element not found
- Waits up to 30 seconds
- Stops execution on failure

---

## assertNotVisible

**Description:** Assert element is NOT visible.

**Syntax:**
```yaml
- assertNotVisible: <selector>
```

---

## runFlow

**Description:** Execute another flow file.

**Syntax:**
```yaml
- runFlow: <flow_file_path>
```

---

## setVar

**Description:** Set variable for later use.

**Syntax:**
```yaml
- setVar: VARIABLE_NAME = "<value>"
```

---

## assertTrue

**Description:** Assert variable is true.

**Syntax:**
```yaml
- assertTrue: ${VARIABLE_NAME}
```

---

**Source:** https://docs.maestro.dev/platform-support/react-native
