---
name: agent-browser
description: >
  Use this skill for browser testing, screenshot capture, visual regression,
  page navigation, a11y diff, browser smoke tests, and responsive viewport testing
  in AI-agent contexts using the agent-browser tool.
triggers:
  - browser test
  - browser testing
  - screenshot
  - visual regression
  - page navigation
  - a11y diff
  - accessibility diff
  - browser smoke
---

# agent-browser

Real browser testing for AI agents via the `agent-browser` CLI tool. Enables snapshot-based DOM interaction, screenshot capture, accessibility diffing, and visual regression checks without Playwright or browser driver setup.

---

## When to Use

**LOAD THIS SKILL** when the task involves:
1. **Browser smoke tests** — Verify a page renders, contains expected text, or returns HTTP 200
2. **Screenshot capture** — Take and compare screenshots across builds or viewports
3. **Visual regression** — Diff screenshots between baseline and current build
4. **Accessibility diffing** — Check a11y tree changes after code modifications
5. **Responsive viewport tests** — Validate layout at mobile, tablet, and desktop widths
6. **Form interaction tests** — Type, click, submit and assert on real browser state
7. **Page navigation tests** — Follow links, verify URLs, check redirect behavior

---

## Decision Guide

| Scenario | agent-browser | Vitest | Playwright |
|----------|:-------------:|:------:|:----------:|
| Real browser rendering (CSS, JS hydration) | YES | NO | YES |
| Component isolation / unit logic | NO | YES | NO |
| CI headless mode (no display needed) | YES | YES | YES |
| Form interaction on live server | YES | NO | YES |
| Visual diff / screenshot comparison | YES | NO | YES |
| Fast unit test loop (<100 ms per test) | NO | YES | NO |
| AI agent driving the browser via CLI | YES | NO | NO |
| Mobile/tablet responsive layout check | YES | NO | YES |
| a11y tree inspection and diff | YES | NO | YES |

**Rule of thumb**: Use agent-browser for live-server, real-rendering, or visual tests. Use Vitest for pure logic and component isolation.

---

## Critical Rules

**ALWAYS:**
1. Set viewport dimensions before taking any snapshot — default size produces inconsistent results
2. Use `networkidle` wait strategy, not `load` — ensures dynamic content and hydration complete
3. Re-snapshot after every interaction — DOM state changes invalidate previous refs
4. Close the browser session after each test — leaked sessions cause port conflicts and resource leaks
5. Verify exit code (`$?`) after every agent-browser command — non-zero means failure
6. Use a fresh snapshot ref for every assertion — never read from a ref captured before the last interaction
7. Start the dev/production server before opening a browser session — agent-browser connects to an existing server

**NEVER:**
1. Reuse a snapshot ref after any `click`, `type`, `submit`, or navigation command
2. Skip wait strategy after navigation — asserting before `networkidle` produces flaky results
3. Run browser tests without setting viewport dimensions
4. Open multiple sessions to the same URL without closing the previous one
5. Hardcode absolute pixel positions for interactions — use element selectors instead

---

## Core Patterns

### 1. Basic Smoke Test

```bash
# Start server first (separate terminal or background)
# npm run start -w apps/portfolio-web &

SESSION=$(agent-browser open http://localhost:3001 --viewport 1280x800 --wait networkidle)
SNAP=$(agent-browser snapshot "$SESSION")
echo "$SNAP" | grep -q "Portfolio" && echo "PASS: title found" || echo "FAIL: title missing"
agent-browser close "$SESSION"
echo "Exit: $?"
```

### 2. Screenshot Capture

```bash
SESSION=$(agent-browser open http://localhost:3001 --viewport 1280x800 --wait networkidle)
agent-browser screenshot "$SESSION" --output /tmp/homepage-desktop.png
agent-browser close "$SESSION"
[ -f /tmp/homepage-desktop.png ] && echo "PASS: screenshot saved" || echo "FAIL: no file"
```

### 3. Accessibility Diff

```bash
SESSION=$(agent-browser open http://localhost:3001 --viewport 1280x800 --wait networkidle)
SNAP_BEFORE=$(agent-browser snapshot "$SESSION" --a11y)
# ... deploy change ...
agent-browser navigate "$SESSION" http://localhost:3001 --wait networkidle
SNAP_AFTER=$(agent-browser snapshot "$SESSION" --a11y)
agent-browser close "$SESSION"
diff <(echo "$SNAP_BEFORE") <(echo "$SNAP_AFTER") && echo "PASS: no a11y changes" || echo "WARN: a11y diff detected"
```

### 4. Form Interaction

```bash
SESSION=$(agent-browser open http://localhost:3001/contact --viewport 1280x800 --wait networkidle)
SNAP=$(agent-browser snapshot "$SESSION")
agent-browser type "$SESSION" --selector "input[name=email]" --text "test@example.com"
agent-browser click "$SESSION" --selector "button[type=submit]"
agent-browser wait "$SESSION" --strategy networkidle
SNAP2=$(agent-browser snapshot "$SESSION")
echo "$SNAP2" | grep -q "Thank you" && echo "PASS: form submitted" || echo "FAIL: submission not confirmed"
agent-browser close "$SESSION"
```

### 5. Responsive Viewport Test

```bash
for VIEWPORT in "375x812" "768x1024" "1280x800" "1920x1080"; do
  SESSION=$(agent-browser open http://localhost:3001 --viewport "$VIEWPORT" --wait networkidle)
  agent-browser screenshot "$SESSION" --output "/tmp/homepage-${VIEWPORT}.png"
  SNAP=$(agent-browser snapshot "$SESSION")
  echo "$SNAP" | grep -q "Portfolio" && echo "PASS [$VIEWPORT]" || echo "FAIL [$VIEWPORT]"
  agent-browser close "$SESSION"
done
```

---

## Command Reference

### Navigation Commands

| Command | Description |
|---------|-------------|
| `agent-browser open <url> --viewport <WxH> --wait networkidle` | Open URL in new browser session |
| `agent-browser navigate <session> <url> --wait networkidle` | Navigate existing session to new URL |
| `agent-browser back <session>` | Navigate back in history |
| `agent-browser reload <session> --wait networkidle` | Reload current page |

### Snapshot Commands

| Command | Description |
|---------|-------------|
| `agent-browser snapshot <session>` | Capture DOM snapshot, returns ref string |
| `agent-browser snapshot <session> --a11y` | Capture accessibility tree snapshot |
| `agent-browser snapshot <session> --selector <css>` | Scope snapshot to element subtree |

### Interaction Commands

| Command | Description |
|---------|-------------|
| `agent-browser click <session> --selector <css>` | Click element matching CSS selector |
| `agent-browser type <session> --selector <css> --text <str>` | Type text into input |
| `agent-browser submit <session> --selector <css>` | Submit form |
| `agent-browser scroll <session> --direction down --amount 500` | Scroll page |
| `agent-browser hover <session> --selector <css>` | Hover over element |

### Wait Commands

| Command | Description |
|---------|-------------|
| `agent-browser wait <session> --strategy networkidle` | Wait for network to be idle |
| `agent-browser wait <session> --strategy selector --selector <css>` | Wait for element to appear |
| `agent-browser wait <session> --ms 500` | Wait fixed milliseconds (avoid if possible) |

### Extraction Commands

| Command | Description |
|---------|-------------|
| `agent-browser get-text <session> --selector <css>` | Extract text content of element |
| `agent-browser get-attr <session> --selector <css> --attr <name>` | Extract attribute value |
| `agent-browser get-url <session>` | Get current page URL |
| `agent-browser get-title <session>` | Get page `<title>` text |

### Screenshot Commands

| Command | Description |
|---------|-------------|
| `agent-browser screenshot <session> --output <path>` | Full-page screenshot to file |
| `agent-browser screenshot <session> --selector <css> --output <path>` | Element screenshot |
| `agent-browser screenshot <session> --clip 0,0,800,600 --output <path>` | Clipped screenshot |

### Session Management Commands

| Command | Description |
|---------|-------------|
| `agent-browser open <url>` | Open session, prints session ID to stdout |
| `agent-browser close <session>` | Close session and free resources |
| `agent-browser list` | List all active sessions |
| `agent-browser kill-all` | Kill all active sessions (use in cleanup) |

---

## Assertion Patterns

### 1. Exit-Code Check

```bash
agent-browser click "$SESSION" --selector "a[href='/about']"
agent-browser wait "$SESSION" --strategy networkidle
if [ $? -ne 0 ]; then
  echo "FAIL: navigation failed"
  agent-browser close "$SESSION"
  exit 1
fi
echo "PASS"
```

### 2. Text Matching (grep)

```bash
SNAP=$(agent-browser snapshot "$SESSION")
echo "$SNAP" | grep -q "Expected Heading" \
  && echo "PASS: text found" \
  || echo "FAIL: text not found"
```

### 3. Element Existence Check (non-zero output)

```bash
TEXT=$(agent-browser get-text "$SESSION" --selector "h1")
[ -n "$TEXT" ] && echo "PASS: h1 exists: $TEXT" || echo "FAIL: h1 not found"
```

### 4. URL Verification

```bash
agent-browser click "$SESSION" --selector "a[href='/projects']"
agent-browser wait "$SESSION" --strategy networkidle
CURRENT_URL=$(agent-browser get-url "$SESSION")
[ "$CURRENT_URL" = "http://localhost:3001/projects" ] \
  && echo "PASS: correct URL" \
  || echo "FAIL: expected /projects, got $CURRENT_URL"
```

---

## Configuration

### Config File

agent-browser reads `agent-browser.json` at the repository root:

```json
{
  "defaultViewport": { "width": 1280, "height": 800 },
  "defaultWait": "networkidle",
  "screenshotDir": ".agent-browser/screenshots",
  "timeout": 30000
}
```

### Installation Verification

```bash
agent-browser --version
```

Expected output: `agent-browser x.y.z` — if command not found, install globally via npm or check PATH.

### portfolio-web Server

```bash
# Start production server (port 3001, required before browser tests)
npm run start -w apps/portfolio-web

# Or dev server (port 3000 — use for development, not screenshot baselines)
npm run dev -w apps/portfolio-web
```

---

## Anti-Patterns

**BAD — Reusing stale snapshot ref after interaction:**
```bash
SNAP=$(agent-browser snapshot "$SESSION")
agent-browser click "$SESSION" --selector "button"
# WRONG: SNAP is stale after click
echo "$SNAP" | grep -q "Updated"
```

**GOOD — Re-snapshot after every interaction:**
```bash
agent-browser click "$SESSION" --selector "button"
agent-browser wait "$SESSION" --strategy networkidle
SNAP=$(agent-browser snapshot "$SESSION")   # fresh ref
echo "$SNAP" | grep -q "Updated"
```

---

**BAD — Skipping wait after navigation:**
```bash
agent-browser navigate "$SESSION" http://localhost:3001/about
SNAP=$(agent-browser snapshot "$SESSION")   # DOM may not be ready
```

**GOOD — Always wait after navigation:**
```bash
agent-browser navigate "$SESSION" http://localhost:3001/about --wait networkidle
SNAP=$(agent-browser snapshot "$SESSION")
```

---

**BAD — No viewport set, inconsistent screenshots:**
```bash
SESSION=$(agent-browser open http://localhost:3001)
agent-browser screenshot "$SESSION" --output /tmp/snap.png
```

**GOOD — Always set viewport before snapshot/screenshot:**
```bash
SESSION=$(agent-browser open http://localhost:3001 --viewport 1280x800 --wait networkidle)
agent-browser screenshot "$SESSION" --output /tmp/snap.png
```

---

## Troubleshooting

### Daemon Fails to Start

**Symptom**: `agent-browser open` returns error: `daemon not running` or `connection refused`.

**Fix**:
```bash
agent-browser --version          # verify installation
agent-browser kill-all           # clear any crashed state
agent-browser open http://localhost:3001 --viewport 1280x800 --wait networkidle
```
If still failing, check that the target server is running (`curl http://localhost:3001`).

---

### `networkidle` Hangs Indefinitely

**Symptom**: `--wait networkidle` never resolves; command times out after 30s.

**Causes**: Page has long-polling XHR, WebSocket connections, or infinite scroll prefetch.

**Fix**:
```bash
# Use selector wait instead of networkidle
agent-browser wait "$SESSION" --strategy selector --selector "h1"
# Or use a fixed short wait as last resort
agent-browser wait "$SESSION" --ms 2000
```

---

### Screenshots Visually Inconsistent Across Runs

**Symptom**: Screenshots differ between runs despite no code changes (font rendering, animation frames).

**Fixes**:
1. Always set identical `--viewport` dimensions in every run
2. Use `--wait networkidle` to ensure animations complete before capture
3. Disable CSS animations in test environment via a `data-testid="no-animations"` class
4. Use `agent-browser screenshot --clip` to capture only stable regions

---

## Quick Reference

| Task | Command Pattern |
|------|----------------|
| Open page | `SESSION=$(agent-browser open <url> --viewport 1280x800 --wait networkidle)` |
| Take snapshot | `SNAP=$(agent-browser snapshot "$SESSION")` |
| Check text | `echo "$SNAP" \| grep -q "text"` |
| Screenshot | `agent-browser screenshot "$SESSION" --output /tmp/out.png` |
| Click element | `agent-browser click "$SESSION" --selector "css"` |
| Type text | `agent-browser type "$SESSION" --selector "input" --text "value"` |
| Wait after action | `agent-browser wait "$SESSION" --strategy networkidle` |
| Get URL | `agent-browser get-url "$SESSION"` |
| Close session | `agent-browser close "$SESSION"` |
| Verify install | `agent-browser --version` |
| Kill all sessions | `agent-browser kill-all` |

**Snapshot-ref loop (fundamental primitive)**:
```
open → wait(networkidle) → snapshot → interact → wait(networkidle) → snapshot → close
```
Every `interact` step invalidates the previous snapshot. Always re-snapshot before asserting.

---

**Source**: agent-browser CLI tool | **Port**: `localhost:3001` (portfolio-web production)
**Last Updated**: 2026-03-01
