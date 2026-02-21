# /create-app

Scaffold a new app in the monorepo from a template.

$ARGUMENTS

---

<context>
- Templates: `packages/mcp-ts-engineer/templates/apps/`
- Script: `packages/mcp-ts-engineer/scripts/create-app.sh`
- Target: `apps/<name>/`
- Registry: `packages/mcp-ts-engineer/templates/apps/registry.json`
</context>

<rules>
ALWAYS: Ask for app type and name if not provided via $ARGUMENTS
ALWAYS: Validate name is lowercase-kebab-case before running
ALWAYS: Confirm the selection before executing the script
NEVER: Run the script without user confirmation
NEVER: Create an app if `apps/<name>/` already exists
</rules>

## Arguments

`$ARGUMENTS` = `<type> <name>` | `<name>` | empty

| Format | Example | Handling |
|--------|---------|----------|
| Full | `expo-app my-mobile` | Use directly |
| Name only | `my-mobile` | Ask for type |
| Empty | — | Ask for both type and name |

## Workflow

### Step 1: Read Available App Types

Read `packages/mcp-ts-engineer/templates/apps/registry.json` to get
the current list of app types with their labels and descriptions.

### Step 2: Determine App Type

IF type provided in `$ARGUMENTS` and exists in registry → use it.

OTHERWISE → Use `AskUserQuestion` with options built from registry:

Question: "What type of app do you want to create?"
Options: One per registry entry, using `label` as the option label
and `description` as the option description.

### Step 3: Determine App Name

IF name provided in `$ARGUMENTS` → validate it.

OTHERWISE → Use `AskUserQuestion`:

Question: "What should the app be named? (lowercase-kebab-case, e.g. my-app)"

**Validation**: Name must match `/^[a-z][a-z0-9-]*$/`.
If invalid → ask again with: "Name must be lowercase-kebab-case
(letters, numbers, hyphens). Example: my-cool-app"

### Step 4: Check Conflicts

```bash
ls -d apps/<name> 2>/dev/null
```

IF exists → STOP: "`apps/<name>` already exists. Choose a different name."

### Step 5: Confirm

Display summary and ask for confirmation:

```
App Type: <label> (<type>)
Name:     <name>
Package:  @<repo>/<name>
Path:     apps/<name>/

Create this app?
```

### Step 6: Execute

```bash
bash packages/mcp-ts-engineer/scripts/create-app.sh \
  --type <type> --name <name>
```

### Step 7: Report

```
Created: apps/<name>/
Package: @<repo>/<name>

Next steps:
  cd apps/<name>
  npm run dev
```

<errors>
| Condition | Action |
|-----------|--------|
| No arguments | Ask type + name interactively |
| Invalid name format | Show format requirement, ask again |
| App already exists | Stop with error |
| Script fails | Show error output |
| Registry not found | Stop: "Run bootstrap.sh first" |
</errors>
