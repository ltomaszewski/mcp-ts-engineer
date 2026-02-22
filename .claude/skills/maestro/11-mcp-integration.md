# MODULE 11: MCP SERVER INTEGRATION

## What is Model Context Protocol (MCP)?

**Model Context Protocol (MCP)** is a standardized protocol that bridges AI models with various data sources and tools. Think of it as the **"USB-C for AI"** — a universal connector that enables seamless communication between large language models (LLMs) and the resources they need.

**Source:** https://docs.maestro.dev/getting-started/maestro-mcp

### Why MCP Matters

MCP solves three critical challenges in AI integration:

| Challenge | Solution |
|-----------|----------|
| **Universal Connectivity** | Single protocol for connecting AI systems to diverse data sources and tools |
| **Vendor Independence** | Switch between LLM providers (Claude, GPT, etc.) without changing integrations |
| **Secure Access** | Implements best practices for safely accessing data within organizational boundaries |

### How MCP Works

MCP uses a simple but powerful architecture:

```
┌─────────────────────────────────────────────────────┐
│ MCP Host                                            │
│ (IDE, AI Assistant, Chat Application)              │
└──────────────────┬──────────────────────────────────┘
                   │ Uses MCP Protocol
┌──────────────────▼──────────────────────────────────┐
│ MCP Client                                          │
│ (Protocol Handler)                                  │
└──────────────────┬──────────────────────────────────┘
                   │ Communicates via
┌──────────────────▼──────────────────────────────────┐
│ MCP Server (Maestro)                                │
│ - Exposes testing capabilities                      │
│ - 47+ automation tools                              │
│ - Flow execution, recording, validation             │
└──────────────────┬──────────────────────────────────┘
                   │ Accesses
┌──────────────────▼──────────────────────────────────┐
│ Data Sources & Services                             │
│ - Local files, flows, configs                       │
│ - Connected devices (Android, iOS)                  │
│ - Maestro Cloud (optional)                          │
└─────────────────────────────────────────────────────┘
```

### MCP Architecture Components

| Component | Role | Purpose |
|-----------|------|---------|
| **MCP Hosts** | Applications needing access | IDEs, chat apps, AI assistants |
| **MCP Clients** | Protocol handlers | Connect hosts to servers |
| **MCP Servers** | Service providers | Expose capabilities via protocol |
| **Data Sources** | Resources | Local files, databases, devices |
| **External Services** | Remote systems | APIs, cloud services |

---

## Installing Maestro MCP

### Pre-Installation Verification

Maestro MCP comes **bundled with the Maestro CLI**. Verify installation:

```bash
# Check Maestro CLI version
maestro --version
# Output: Maestro X.Y.Z

# Verify MCP command is available
maestro mcp --help
# Shows MCP usage and options
```

### System Requirements

| Requirement | Version | Purpose |
|-------------|---------|---------|
| **Node.js** | 18.0.0+ | Runtime for MCP server |
| **Maestro CLI** | 1.30.0+ | MCP server bundled |
| **MCP Client** | Latest | Claude, Cursor, Windsurf, etc. |
| **macOS/Linux/Windows** | Current | Client application |

### Method 1: Quick Start (No Installation Needed)

The MCP server is bundled with Maestro CLI:

```bash
# Run MCP server directly
maestro mcp

# Output shows:
# MCP server listening on stdio
# Ready to handle LLM connections
```

### Method 2: Use with MCP Client

If installed globally via Homebrew:

```bash
# Homebrew installation (Maestro already includes MCP)
brew install maestro

# MCP is ready to use
maestro mcp
```

### Method 3: Global npm Installation (Optional)

For development or standalone use:

```bash
# Install globally via npm
npm install -g maestro

# Or with yarn
yarn global add maestro

# Verify installation
maestro mcp --version
```

**Source:** https://docs.maestro.dev/getting-started/maestro-mcp

---

## Configuring MCP Clients

### Claude Desktop Setup

**Step 1: Locate Configuration File**

The configuration file location varies by operating system:

```bash
# macOS
~/Library/Application Support/Claude/claude_desktop_config.json

# Windows
%APPDATA%\Claude\claude_desktop_config.json

# Linux
~/.config/Claude/claude_desktop_config.json
```

**Step 2: Add Maestro MCP Configuration**

Open the config file and add the Maestro server:

```json
{
  "mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"]
    }
  }
}
```

**Step 3: Restart Claude**

Close and reopen Claude Desktop to activate the MCP server.

**Step 4: Verify Connection**

In Claude, you should see a "Maestro" option in the tool panel at the bottom.

**Full Example Config:**

```json
{
  "mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"]
    },
    "other-server": {
      "command": "npx",
      "args": ["@other-org/mcp-server@latest"]
    }
  }
}
```

**Source:** https://docs.maestro.dev/getting-started/maestro-mcp

---

### Cursor Integration

**Step 1: Open Cursor Settings**

```
Cursor → Settings → Features → MCP
```

**Step 2: Add New MCP Server**

Click "Add new MCP Server" and configure:

```json
{
  "mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"]
    }
  }
}
```

**Step 3: Restart Cursor**

Reload the application to activate.

**Step 4: Use in Composer**

When using Cursor Composer, you can now reference Maestro tools:

```
@maestro Can you create a flow to test login functionality?
```

---

### Windsurf Integration

**Step 1: Locate Config File**

```bash
# Windsurf config location
~/.codeium/windsurf_settings.json
```

**Step 2: Add Maestro Configuration**

```json
{
  "mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"]
    }
  }
}
```

**Step 3: Restart Windsurf**

Close and reopen the application.

---

### VS Code Extension Integration

**Step 1: Install Cline Extension**

In VS Code: Extensions → Search "Cline" → Install

**Step 2: Configure MCP**

In VS Code settings, add:

```json
{
  "cline.mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"]
    }
  }
}
```

**Step 3: Use in Cline Chat**

Open Cline chat and reference Maestro:

```
Create a Maestro test flow for the login feature
```

---

## MCP Tools Available

Maestro MCP exposes **47+ automation tools** for LLMs to use. Tools are organized by category:

### Flow Management Tools

| Tool | Description | Example Usage |
|------|-------------|----------------|
| `maestro_run_flow` | Execute a YAML flow file | Run login flow, verify test passes |
| `maestro_run_flows` | Execute multiple flows in sequence | Run full test suite |
| `maestro_test` | Run flow with test assertions | Validate login functionality |
| `maestro_record` | Record device interactions to YAML | Capture user journey |
| `maestro_validate_flow` | Validate YAML syntax | Check flow correctness |
| `maestro_upload` | Upload flow to Maestro Cloud | Share with team |
| `maestro_download_flow` | Download flow from cloud | Retrieve saved flows |
| `maestro_create_flow` | Create new flow from template | Generate flow scaffold |

### Device Management Tools

| Tool | Description |
|------|-------------|
| `maestro_list_devices` | List connected devices and emulators |
| `maestro_connect_device` | Connect to specific device |
| `maestro_screenshot` | Capture device screenshot |
| `maestro_screen_recording_start` | Start recording interactions |
| `maestro_screen_recording_stop` | Stop and save recording |
| `maestro_hierarchy` | Get UI element tree (view hierarchy) |
| `maestro_device_info` | Get device properties and OS info |

### App Control Tools

| Tool | Description |
|------|-------------|
| `maestro_launch_app` | Launch app by package ID |
| `maestro_stop_app` | Stop running app |
| `maestro_kill_app` | Force kill app process |
| `maestro_clear_state` | Clear app data and cache |
| `maestro_clear_keychain` | Clear iOS keychain (iOS only) |
| `maestro_install_app` | Install APK (Android) or IPA (iOS) |

### User Interaction Tools

| Tool | Description | Example |
|------|-------------|---------|
| `maestro_tap` | Tap on element or coordinates | Tap login button |
| `maestro_double_tap` | Double tap gesture | Double tap to zoom |
| `maestro_long_press` | Long press gesture | Long press menu item |
| `maestro_input_text` | Type text into field | Enter email address |
| `maestro_erase_text` | Clear text from field | Clear password field |
| `maestro_swipe` | Swipe in direction | Swipe to dismiss modal |
| `maestro_scroll` | Scroll until element visible | Scroll to bottom |
| `maestro_press_key` | Press device key | Press Enter/Return |
| `maestro_hide_keyboard` | Hide on-screen keyboard | Dismiss keyboard |
| `maestro_open_link` | Open URL or deep link | Navigate to URL |
| `maestro_set_location` | Set GPS coordinates | Test location features |
| `maestro_travel` | Simulate travel between locations | Test GPS tracking |

### Assertion Tools

| Tool | Description |
|------|-------------|
| `maestro_assert_visible` | Assert element is visible |
| `maestro_assert_not_visible` | Assert element is hidden |
| `maestro_assert_true` | Assert condition is true |
| `maestro_wait_for` | Wait for element to appear |
| `maestro_extract_text` | Extract text from element |
| `maestro_copy_text` | Copy text to clipboard |

### Device Configuration Tools

| Tool | Description |
|------|-------------|
| `maestro_set_orientation` | Set portrait or landscape mode |
| `maestro_toggle_airplane` | Toggle airplane mode |
| `maestro_set_airplane` | Set airplane mode on/off |

### Advanced Tools (AI-Powered)

| Tool | Description |
|------|-------------|
| `maestro_assert_with_ai` | AI-powered visual assertion using description |
| `maestro_extract_text_ai` | AI-powered text extraction |
| `maestro_assert_no_defects` | AI defect detection in UI |

### JavaScript Execution

| Tool | Description |
|------|-------------|
| `maestro_run_script` | Execute JavaScript in app context |
| `maestro_eval_script` | Evaluate JavaScript expression |

---

## Using Maestro MCP with Claude

### Example 1: Generate a Test Flow

**Prompt:**
```
Create a Maestro flow that:
1. Opens the app (com.example.app)
2. Taps the login button
3. Enters "user@example.com" in the email field
4. Enters "password123" in the password field
5. Taps the submit button
6. Verifies the dashboard appears
```

**Claude Response:**
```yaml
appId: com.example.app
---
- launchApp
- assertVisible: "Login"

- tapOn: "Login Button"
- inputText: 
    id: "email_input"
    text: "user@example.com"

- tapOn: "Password Field"
- inputText:
    id: "password_input"
    text: "password123"

- tapOn: "Submit"
- assertVisible: "Dashboard"
```

Claude generates the complete flow using MCP tools.

### Example 2: Debug a Failing Test

**Prompt:**
```
My checkout test is failing with "Element not found: Confirm Button".
Analyze the issue and suggest fixes.
```

**Claude Analysis:**
Using `maestro_screenshot` and `maestro_hierarchy` tools, Claude:
1. Captures the current screen state
2. Analyzes the UI hierarchy
3. Identifies the button location
4. Suggests selector fixes:
   ```yaml
   # Use testID instead of text
   - tapOn:
       id: "checkout_confirm_button"
   
   # Or scroll to element first
   - scroll:
       direction: "down"
       amount: 3
   - tapOn: "Confirm Order"
   ```

### Example 3: Generate Test Suite from App

**Prompt:**
```
I'm building tests for a todo app. Use maestro_record to record
the following user journey and generate a test flow:
1. Open app
2. Create a new todo
3. Mark it as complete
4. Verify it appears in completed list
```

**Process:**
1. Claude uses `maestro_record` to capture interactions
2. Analyzes the recorded gestures
3. Generates YAML flow automatically

---

## Real-World Use Cases

### Use Case 1: AI-Assisted Test Generation

**Scenario:** QA team wants Claude to generate tests from requirements

```
I have a new payment feature. Create comprehensive Maestro flows
that test:
- Valid payment processing
- Expired card handling  
- Network error recovery
- Receipt generation
```

**Claude MCP Actions:**
- Uses `maestro_create_flow` for each test scenario
- Uses `maestro_validate_flow` to check syntax
- Uses `maestro_upload` to save to team workspace

---

### Use Case 2: Automated Test Debugging

**Scenario:** CI/CD test fails, Claude diagnoses issue

```
This test failed in CI:
Error: "Element not found: Save Button"

Debug why and fix the flow.
```

**Claude MCP Actions:**
1. Runs `maestro_screenshot` to see current state
2. Calls `maestro_hierarchy` to inspect elements
3. Analyzes selectors
4. Suggests fixes with updated flow

---

### Use Case 3: Test Maintenance

**Scenario:** App UI changed, tests are outdated

```
The login screen was redesigned. Update my test flows
to use the new button labels and testIDs.
```

**Claude MCP Actions:**
1. Uses `maestro_download_flow` to get existing flows
2. Records new interaction with `maestro_record`
3. Updates flows with `maestro_validate_flow`
4. Uploads updated version with `maestro_upload`

---

### Use Case 4: Cross-Platform Testing

**Scenario:** Test same flow on iOS and Android

```
Create test flows for both iOS and Android platforms
that test the core login functionality.
```

**Claude MCP Actions:**
- Generates Android flow: `appId: com.example.app`
- Generates iOS flow: `appId: com.example.app.ios`
- Both use platform-agnostic selectors
- Claude manages platform differences

---

## MCP Tools Reference

### maestro_run_flow

**Description:** Execute a Maestro YAML flow file

**Parameters:**
```json
{
  "flowPath": "string",      // Path to YAML flow file
  "device": "string",        // Optional: specific device ID
  "format": "string"         // Optional: json, junit, text
}
```

**Returns:**
```json
{
  "success": true,
  "passedSteps": 7,
  "totalSteps": 7,
  "duration": 12500,        // milliseconds
  "output": "Test passed"
}
```

**Example Usage (Claude):**
```
Use maestro_run_flow to execute login-test.yaml and verify it passes
```

---

### maestro_record

**Description:** Record device interactions to generate YAML flow

**Parameters:**
```json
{
  "outputPath": "string",    // Where to save YAML file
  "device": "string",        // Optional: specific device
  "appId": "string"          // Optional: app package ID
}
```

**Returns:**
```json
{
  "success": true,
  "flowPath": "login-recorded.yaml",
  "stepsRecorded": 15,
  "duration": 45000
}
```

---

### maestro_validate_flow

**Description:** Validate YAML flow syntax without running

**Parameters:**
```json
{
  "flowPath": "string"       // Path to YAML file
}
```

**Returns:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": []
}
```

---

### maestro_hierarchy

**Description:** Get UI element tree for current screen

**Parameters:**
```json
{
  "device": "string"         // Optional: specific device ID
}
```

**Returns:**
```json
{
  "hierarchy": [
    {
      "id": "element_id",
      "type": "Button",
      "text": "Login",
      "testID": "login_button",
      "visible": true,
      "coordinates": [150, 200]
    }
  ]
}
```

---

### maestro_assert_with_ai

**Description:** AI-powered visual assertion using natural language

**Parameters:**
```json
{
  "description": "string",   // What to verify (e.g., "login button is red")
  "device": "string"         // Optional: device ID
}
```

**Returns:**
```json
{
  "success": true,
  "message": "Assertion passed - element matches description"
}
```

---

## MCP Server Configuration Examples

### Basic Configuration

```json
{
  "mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"]
    }
  }
}
```

### With Environment Variables

```json
{
  "mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"],
      "env": {
        "MAESTRO_API_KEY": "${MAESTRO_API_KEY}",
        "MAESTRO_CLOUD_WORKSPACE": "my-workspace"
      }
    }
  }
}
```

### Multiple MCP Servers

```json
{
  "mcpServers": {
    "maestro": {
      "command": "maestro",
      "args": ["mcp"]
    },
    "github": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-github"]
    },
    "filesystem": {
      "command": "npx",
      "args": ["@modelcontextprotocol/server-filesystem"]
    }
  }
}
```

---

## Troubleshooting MCP Connection

### Issue: "MCP Server Not Found"

**Error:**
```
Error: MCP server "maestro" not found or failed to start
```

**Solutions:**

```bash
# Verify Maestro is installed
maestro --version

# Test MCP directly
maestro mcp

# Check configuration file syntax (JSON)
cat ~/Library/Application\ Support/Claude/claude_desktop_config.json

# Verify maestro command is in PATH
which maestro
```

---

### Issue: "Connection Timeout"

**Error:**
```
Timeout waiting for MCP server to respond
```

**Solutions:**

1. **Restart the MCP client:**
   ```bash
   # Close and reopen Claude/Cursor
   ```

2. **Verify Maestro CLI version:**
   ```bash
   maestro --version  # Should be 1.30.0+
   ```

3. **Test MCP server directly:**
   ```bash
   maestro mcp --help
   ```

---

### Issue: "Tool Not Available"

**Error:**
```
Tool "maestro_run_flow" is not available
```

**Solutions:**

1. Ensure configuration file has correct syntax
2. Restart MCP client completely
3. Verify Maestro CLI includes MCP support:
   ```bash
   maestro mcp --list-tools
   ```

---

## Best Practices for MCP Usage

### 1. Use Specific Selectors

**❌ Avoid:**
```
"Tap the button at coordinates [150, 200]"
```

**✅ Prefer:**
```
"Tap the button with testID 'login_button'"
```

### 2. Let AI Generate Initial Flows

```
Create a flow for the login feature by recording the interactions
```

This lets Claude:
- Use `maestro_record` to capture accurate steps
- Generate clean YAML
- Validate with `maestro_validate_flow`

### 3. Use AI for Complex Assertions

```
Verify that the error message matches "Invalid email" and is highlighted in red
```

Claude uses `maestro_assert_with_ai` for visual matching.

### 4. Leverage Diff Analysis

```
Compare the old login flow with the new design and update testIDs
```

Claude can:
- Download old flow with `maestro_download_flow`
- Record new interactions
- Show differences
- Generate updated YAML

---

## Integration Examples

### GitHub + Maestro MCP Workflow

```yaml
name: Generate Tests with AI

on:
  pull_request:
    paths:
      - 'src/screens/**'

jobs:
  generate-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Use Claude to generate tests
        run: |
          # Ask Claude to generate tests for changed screens
          echo "Analyzing changes in PR..."
          # Claude with Maestro MCP generates flows
```

---

## Further Resources

- **Official MCP Docs:** https://docs.maestro.dev/getting-started/maestro-mcp
- **Claude Documentation:** https://claude.ai/docs
- **MCP GitHub:** https://github.com/mobile-dev-inc/maestro-mcp
- **Maestro GitHub:** https://github.com/mobile-dev-inc/maestro

---

**Module Status:** ✅ COMPLETE  
**Last Updated:** February 2026  
**MCP Tools Documented:** 47+  
**Supported Clients:** Claude, Cursor, Windsurf, VS Code, Custom

