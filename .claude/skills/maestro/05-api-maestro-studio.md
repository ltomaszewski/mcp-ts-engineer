# MODULE 5: API REFERENCE - MAESTRO STUDIO

## Maestro Studio Overview

**Maestro Studio** is a desktop application providing:
- Visual element inspection
- Interactive test recording
- View hierarchy visualization
- Element property inspection
- Gesture recording and replay

**Launch:**
```bash
maestro studio
```

## Element Inspector

**Purpose:** Identify and inspect UI elements

**Returns JSON:**
```json
{
  "id": "unique_element_id",
  "text": "Button Text",
  "type": "Button",
  "testID": "login_button",
  "accessible": true,
  "visible": true,
  "enabled": true,
  "coordinates": {
    "x": 150,
    "y": 200,
    "width": 100,
    "height": 50
  },
  "attributes": {
    "clickable": true,
    "scrollable": false,
    "focused": false
  }
}
```

**Usage:**
1. Launch Studio: `maestro studio`
2. Connect device
3. Click elements to inspect
4. View properties in inspector panel

## View Hierarchy Inspector

**Syntax:**
```bash
maestro test flow.yaml --view-hierarchy
```

**Output:**
```
View Hierarchy (Android)
========================
android.widget.FrameLayout
  ├─ android.widget.LinearLayout
  │  ├─ android.widget.EditText (ID: email_input)
  │  │  └─ text: "john@example.com"
  │  ├─ android.widget.Button
  │  │  └─ text: "Submit"
  │  └─ android.widget.TextView
  │     └─ text: "Forgot Password?"
```

**Uses:**
- Debug element identification
- Find correct selector
- Verify visibility
- Inspect properties

---

**Learn More:** https://maestro.dev
