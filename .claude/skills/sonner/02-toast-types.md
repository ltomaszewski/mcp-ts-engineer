# Sonner: Toast Types & API

> All toast variants: default, success, error, warning, info, loading, promise, custom, and headless.

---

## toast() Function

The `toast()` function is the primary API. Import from `"sonner"` and call from any client-side code.

```typescript
import { toast } from "sonner"
```

### Signature

```typescript
// Basic
toast(message: string | ReactNode, options?: ToastOptions): string | number

// Typed variants
toast.success(message: string | ReactNode, options?: ToastOptions): string | number
toast.error(message: string | ReactNode, options?: ToastOptions): string | number
toast.warning(message: string | ReactNode, options?: ToastOptions): string | number
toast.info(message: string | ReactNode, options?: ToastOptions): string | number
toast.loading(message: string | ReactNode, options?: ToastOptions): string | number
toast.promise<T>(promise: Promise<T>, options: PromiseOptions): string | number
toast.custom(jsx: (id: string | number) => ReactNode, options?: ToastOptions): string | number
toast.message(message: string | ReactNode, options?: ToastOptions): string | number
toast.dismiss(id?: string | number): void
```

Every toast function returns an ID that can be used for programmatic updates or dismissal.

---

## Toast Options

### Complete Options Reference

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `description` | `ReactNode` | -- | Secondary text below the title |
| `duration` | `number` | `4000` | Auto-dismiss time in ms; `Infinity` to persist |
| `icon` | `ReactNode` | type-based | Custom icon; `null` to remove |
| `id` | `string \| number` | auto | Custom ID for updates/dismissal |
| `testId` | `string` | -- | Test ID for e2e testing |
| `toasterId` | `string` | -- | Target a specific `<Toaster id>` |
| `closeButton` | `boolean` | `false` | Show close button on this toast |
| `dismissible` | `boolean` | `true` | Allow user to dismiss via swipe/click |
| `invert` | `boolean` | `false` | Invert colors for this toast |
| `position` | `string` | Toaster default | Override position for this toast |
| `action` | `{ label: string, onClick: () => void }` | -- | Primary action button |
| `cancel` | `{ label: string, onClick: () => void }` | -- | Secondary cancel button |
| `onDismiss` | `(toast: Toast) => void` | -- | Callback when dismissed by user |
| `onAutoClose` | `(toast: Toast) => void` | -- | Callback when auto-closed |
| `style` | `CSSProperties` | `{}` | Inline styles |
| `className` | `string` | -- | CSS class on toast container |
| `classNames` | `object` | -- | Per-element CSS classes |
| `unstyled` | `boolean` | `false` | Remove all default styles |
| `actionButtonStyle` | `CSSProperties` | `{}` | Inline styles for action button |
| `cancelButtonStyle` | `CSSProperties` | `{}` | Inline styles for cancel button |

---

## Default Toast

Basic notification with no icon or color styling:

```typescript
import { toast } from "sonner"

// Simple message
toast("Event has been created")

// With description
toast("Event created", {
  description: "Monday, January 3rd at 6:00 PM",
})

// With custom duration
toast("Quick message", { duration: 2000 })

// Persistent (no auto-dismiss)
toast("Important notice", { duration: Infinity, closeButton: true })
```

---

## Success Toast

Renders a green checkmark icon. Use `richColors` on `<Toaster>` for colored background.

```typescript
toast.success("Profile updated successfully")

toast.success("Changes saved", {
  description: "Your preferences have been updated.",
})

toast.success("File uploaded", {
  action: {
    label: "View",
    onClick: () => openFile(),
  },
})
```

---

## Error Toast

Renders a red error icon. Use `richColors` on `<Toaster>` for colored background.

```typescript
toast.error("Something went wrong")

toast.error("Upload failed", {
  description: "The file exceeds the maximum size of 10MB.",
})

toast.error("Connection lost", {
  action: {
    label: "Retry",
    onClick: () => reconnect(),
  },
  duration: Infinity,
  closeButton: true,
})
```

---

## Warning Toast

Renders a yellow/amber warning icon. Use `richColors` on `<Toaster>` for colored background.

```typescript
toast.warning("Your session will expire in 5 minutes")

toast.warning("Unsaved changes", {
  description: "You have unsaved changes that will be lost.",
  action: {
    label: "Save now",
    onClick: () => saveChanges(),
  },
})
```

---

## Info Toast

Renders a blue info icon. Use `richColors` on `<Toaster>` for colored background.

```typescript
toast.info("A new version is available")

toast.info("Maintenance scheduled", {
  description: "The system will be unavailable on Sunday from 2-4 AM.",
})
```

---

## Loading Toast

Renders a spinner icon. Useful for manual state management (see also promise toast).

```typescript
// Show loading, then update to success/error
const toastId = toast.loading("Saving changes...")

try {
  await saveData()
  toast.success("Changes saved!", { id: toastId })
} catch {
  toast.error("Failed to save", { id: toastId })
}
```

Key pattern: pass the same `id` to replace the loading toast with the result.

---

## Promise Toast

Automatically transitions through loading, success, and error states.

### Basic Usage

```typescript
toast.promise(saveSettings(data), {
  loading: "Saving settings...",
  success: "Settings saved!",
  error: "Failed to save settings",
})
```

### Dynamic Messages

Access the resolved value for dynamic success messages:

```typescript
toast.promise(createUser(formData), {
  loading: "Creating account...",
  success: (user) => `Welcome, ${user.name}!`,
  error: (err) => `Error: ${err.message}`,
})
```

### With Descriptions

Return an object with `message` and `description` for richer feedback:

```typescript
toast.promise(deployApp(), {
  loading: "Deploying...",
  success: (result) => ({
    message: "Deployed successfully!",
    description: `Version ${result.version} is now live.`,
  }),
  error: (err) => ({
    message: "Deployment failed",
    description: err.message,
  }),
})
```

### Promise Toast Options

| Option | Type | Description |
|--------|------|-------------|
| `loading` | `string \| ReactNode` | Message shown during pending state |
| `success` | `string \| ReactNode \| (data: T) => string \| ReactNode \| ToastOptions` | Message on resolve |
| `error` | `string \| ReactNode \| (err: Error) => string \| ReactNode \| ToastOptions` | Message on reject |

---

## Message Toast

Renders a toast with only a title and description, no icon:

```typescript
toast.message("Notice", {
  description: "This is a simple informational message.",
})
```

---

## Custom Toast (with Default Styling)

Pass JSX as the first argument to render custom content while keeping sonner's default wrapper styling:

```tsx
toast(
  <div className="flex items-center gap-2">
    <Avatar src="/user.jpg" />
    <span>John liked your post</span>
  </div>
)
```

---

## Headless / Custom Toast (No Default Styling)

Use `toast.custom()` for fully custom UI with no default styles. Maintains animations and stacking.

```tsx
toast.custom((id) => (
  <div className="flex items-center justify-between gap-4 rounded-lg border bg-card p-4 shadow-lg">
    <div>
      <p className="font-medium">New message</p>
      <p className="text-sm text-muted-foreground">You have a new notification</p>
    </div>
    <div className="flex gap-2">
      <button
        className="rounded-md bg-primary px-3 py-1.5 text-sm text-primary-foreground"
        onClick={() => {
          handleView()
          toast.dismiss(id)
        }}
      >
        View
      </button>
      <button
        className="rounded-md border px-3 py-1.5 text-sm"
        onClick={() => toast.dismiss(id)}
      >
        Close
      </button>
    </div>
  </div>
))
```

The callback receives the toast `id` for programmatic dismissal.

---

## Action & Cancel Buttons

### Action Button (Primary)

```typescript
toast("File moved to trash", {
  action: {
    label: "Undo",
    onClick: () => restoreFile(),
  },
})
```

### Cancel Button (Secondary)

```typescript
toast("Confirm deletion?", {
  cancel: {
    label: "Cancel",
    onClick: () => abortDeletion(),
  },
  action: {
    label: "Delete",
    onClick: () => confirmDeletion(),
  },
})
```

### Prevent Auto-Dismiss on Action Click

By default, clicking action/cancel closes the toast. To prevent this:

```typescript
toast("Important", {
  action: {
    label: "Process",
    onClick: (event) => {
      event.preventDefault() // Toast stays open
      processItem()
    },
  },
})
```

### Styling Buttons

```typescript
toast("Message", {
  action: {
    label: "Confirm",
    onClick: () => confirm(),
  },
  actionButtonStyle: {
    backgroundColor: "var(--primary)",
    color: "var(--primary-foreground)",
  },
  cancelButtonStyle: {
    backgroundColor: "transparent",
    border: "1px solid var(--border)",
  },
})
```

---

## Dismissal

### Programmatic Dismiss

```typescript
// Dismiss a specific toast by ID
const id = toast("Loading...")
toast.dismiss(id)

// Dismiss all toasts
toast.dismiss()
```

### Prevent User Dismissal

```typescript
// User cannot swipe or click to dismiss
toast("Critical alert", {
  dismissible: false,
  duration: Infinity,
  action: {
    label: "Acknowledge",
    onClick: () => acknowledge(),
  },
})
```

### Dismiss Callbacks

```typescript
toast("Notification", {
  onDismiss: (t) => {
    console.log(`Toast ${t.id} dismissed by user`)
  },
  onAutoClose: (t) => {
    console.log(`Toast ${t.id} auto-closed after duration`)
  },
})
```

---

## Updating Existing Toasts

Pass the same `id` to update a toast in place:

```typescript
// Initial toast
const id = toast.loading("Step 1: Validating...")

// Update message
toast.loading("Step 2: Uploading...", { id })

// Final state
toast.success("Upload complete!", { id })
```

---

## Custom Icons

Override the default icon per-toast:

```tsx
import { Rocket } from "lucide-react"

toast("Deploying...", {
  icon: <Rocket className="h-4 w-4" />,
})

// Remove icon
toast.success("Done", { icon: null })
```

---

## Per-Toast Styling

### Inline Styles

```typescript
toast("Styled toast", {
  style: {
    background: "#1a1a2e",
    color: "#ffffff",
    border: "1px solid #333",
  },
})
```

### Class Names

Target specific elements within the toast:

```typescript
toast("Classified toast", {
  classNames: {
    toast: "border-primary",
    title: "font-bold text-lg",
    description: "!text-muted-foreground",
    actionButton: "!bg-primary !text-primary-foreground",
    cancelButton: "!border-border",
    closeButton: "!bg-background",
  },
})
```

Note: Use `!important` (Tailwind `!` prefix) to override default styles. Alternatively, use `unstyled: true` to avoid needing `!important`.

### Unstyled Mode

Remove all default styles for full custom control:

```typescript
toast("Custom", {
  unstyled: true,
  classNames: {
    toast: "rounded-lg border bg-card p-4 shadow-md",
    title: "font-semibold text-foreground",
    description: "text-sm text-muted-foreground",
  },
})
```

---

## Quick Reference

| Toast Type | Function | Icon | Rich Color |
|------------|----------|------|------------|
| Default | `toast()` | None | No |
| Success | `toast.success()` | Checkmark | Green |
| Error | `toast.error()` | Error | Red |
| Warning | `toast.warning()` | Warning | Amber |
| Info | `toast.info()` | Info | Blue |
| Loading | `toast.loading()` | Spinner | No |
| Promise | `toast.promise()` | Auto | Auto |
| Message | `toast.message()` | None | No |
| Custom (styled) | `toast(<JSX />)` | None | No |
| Custom (headless) | `toast.custom()` | None | No |

---

**Version:** ^2.0.0 | **Source:** https://sonner.emilkowal.ski/toast
