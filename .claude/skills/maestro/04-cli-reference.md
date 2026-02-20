# MODULE 4: CLI REFERENCE

## maestro --version

Display installed Maestro CLI version.

**Syntax:**
```bash
maestro --version
maestro -v
```

**Return Values:**
```
Maestro 1.35.0 (2024-12-15)
```

**Return Codes:**
- `0` - Success
- `1` - Error (not installed)

---

## maestro test

Execute test flows on connected devices.

**Syntax:**
```bash
maestro test <flow_file_or_directory> [OPTIONS]
```

**Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `flow_path` | string | ✓ | YAML file or directory of flows |
| `--device` | string | ✗ | Device ID (from `maestro devices`) |
| `--debug-output` | flag | ✗ | Print detailed step-by-step logs |
| `--view-hierarchy` | flag | ✗ | Display view tree during execution |
| `--continue-on-error` | flag | ✗ | Continue if flow fails (for batches) |
| `--output` | string | ✗ | Results directory |
| `--workspace` | string | ✗ | Maestro workspace path |
| `--format` | string | ✗ | Format: json, junit, text |

**Examples:**

```bash
# Run single flow
maestro test login.yaml

# Run all flows in directory
maestro test maestro/flows/

# Run on specific device
maestro test flow.yaml --device emulator-5554

# Enable debug output
maestro test flow.yaml --debug-output

# Generate JSON report
maestro test flow.yaml --format json --output results/

# Run with view hierarchy inspection
maestro test flow.yaml --view-hierarchy

# Continue testing even if one flow fails
maestro test maestro/flows/ --continue-on-error
```

**Return Codes:**
- `0` - All tests passed
- `1` - One or more tests failed
- `2` - Execution error (device not found, etc.)

---

## maestro init

Initialize new Maestro project with template configuration.

**Syntax:**
```bash
maestro init
```

**Creates:**
- `maestro.yaml` - Project configuration
- `flows/` - Directory for flow files
- `flows/example.yaml` - Sample flow template

**Example:**

```bash
cd my_app
maestro init

# Output:
# ✓ Created maestro.yaml
# ✓ Created flows/
# ✓ Created flows/example.yaml
# 
# Next steps:
# 1. Edit flows/example.yaml
# 2. Run: maestro test flows/
```

---

## maestro devices

List all available testing devices.

**Syntax:**
```bash
maestro devices [OPTIONS]
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `--format` | string | Format: `text` (default) or `json` |

**Output (Text):**
```
Available Devices:
1. emulator-5554 (Android 13)
2. iPhone 14 Pro (iOS 16.0)
3. Samsung Galaxy S23 (Android 13) - Physical
```

**Output (JSON):**
```json
{
  "devices": [
    {
      "id": "emulator-5554",
      "type": "emulator",
      "platform": "android",
      "osVersion": "13"
    },
    {
      "id": "iPhone 14 Pro",
      "type": "simulator",
      "platform": "ios",
      "osVersion": "16.0"
    }
  ]
}
```

---

## maestro doctor

Diagnose environment and configuration issues.

**Syntax:**
```bash
maestro doctor
```

**Checks:**
1. Maestro CLI version
2. Java JDK installation
3. Android SDK configuration
4. Android emulator availability
5. iOS Xcode and simulator
6. Device connectivity
7. Network connectivity

**Example Output:**
```
Maestro Doctor Report
=====================

✓ Maestro CLI Version: 1.35.0
✓ Java JDK: 17.0.5 (JAVA_HOME: /Library/Java/JavaVirtualMachines/...)
✓ Android SDK: 33.0.0
✓ Android Emulator: Available (1 emulator found)
✓ iOS Simulator: Available (6 simulators found)
✓ Network: Connected

Recommendations:
  - Update Android SDK (latest: 34, current: 33)
  - Connect an Android device for testing

Status: Ready ✓
```

**Return Codes:**
- `0` - No critical issues
- `1` - Issues found

---

## maestro logs

Display logs from test execution.

**Syntax:**
```bash
maestro logs [OPTIONS]
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `--flow` | string | Show logs for specific flow |
| `--device` | string | Show logs from device |
| `--lines` | integer | Number of lines (default: 100) |
| `--follow` | flag | Follow output in real-time |

---

## maestro record

Record test flow visually using Maestro Studio.

**Syntax:**
```bash
maestro record <output_file> [OPTIONS]
```

**Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `output_file` | string | ✓ | YAML file to save |
| `--device` | string | ✗ | Specific device to record on |
| `--app-id` | string | ✗ | Override app ID |

**Interactive Features:**
- Click elements to generate `tapOn` commands
- Type text to generate `inputText` commands
- Swipe to generate `swipe` commands
- Scroll to generate `scroll` commands
- Live YAML preview
- Undo/redo support

---

**Source:** https://docs.maestro.dev/platform-support/react-native
