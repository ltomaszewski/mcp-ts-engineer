---
name: sonner
description: Sonner v2 toast notifications - toast(), Toaster, promise toasts, custom toasts, rich colors, stacking. Use when showing toast notifications, success/error feedback, or async operation status.
---

# Sonner

> Opinionated toast notification library for React -- single `<Toaster />` component, call `toast()` from anywhere, zero hooks or context needed.

**Stack:** sonner ^2.0.0 | React 18+ | TypeScript

---

## When to Use

**LOAD THIS SKILL** when user is:
- Adding toast notifications to a React or Next.js app
- Showing success/error/warning/info feedback after user actions
- Displaying async operation status with promise toasts
- Configuring toast position, duration, rich colors, or theming
- Building custom toast UI with JSX while keeping animations
- Integrating sonner via shadcn/ui (`npx shadcn@latest add sonner`)
- Providing feedback from Server Actions in Next.js App Router

---

## Critical Rules

**ALWAYS:**
1. Render `<Toaster />` once at the root layout -- all toasts render through this single component
2. Import `toast` from `"sonner"` (or `@/components/ui/sonner` for shadcn wrapper) -- no hooks needed
3. Use `toast.promise()` for async operations -- automatically shows loading/success/error states
4. Enable `richColors` on `<Toaster />` for colored success/error/warning/info toasts -- off by default
5. Use `toast.custom()` for fully custom JSX -- maintains animations and stacking without default styles
6. Pass `duration: Infinity` for persistent toasts that require user action -- prevents auto-dismiss
7. Use `toast.dismiss(id)` for programmatic dismissal -- pass the ID returned by `toast()`

**NEVER:**
1. Render multiple `<Toaster />` components without distinct `id` props -- causes duplicate toasts
2. Use `toast()` in Server Components -- it is a client-side function, call from event handlers or `"use client"` modules
3. Forget `closeButton` on persistent toasts -- users cannot dismiss them otherwise
4. Use raw `try/catch` + manual `toast.success`/`toast.error` when `toast.promise()` handles it -- promise toast is more ergonomic

---

## Core Patterns

### Basic Toast

```typescript
import { toast } from "sonner"

// Simple message
toast("Event has been created")

// With description
toast("Event created", {
  description: "Monday, January 3rd at 6:00 PM",
})

// With action button
toast("File deleted", {
  action: {
    label: "Undo",
    onClick: () => restoreFile(),
  },
})
```

### Typed Toasts

```typescript
import { toast } from "sonner"

toast.success("Changes saved successfully")
toast.error("Failed to save changes")
toast.warning("Your session is about to expire")
toast.info("A new update is available")
toast.loading("Uploading file...")
```

### Promise Toast

```typescript
import { toast } from "sonner"

// Automatic loading -> success/error transition
toast.promise(saveSettings(data), {
  loading: "Saving settings...",
  success: "Settings saved!",
  error: "Failed to save settings",
})

// With dynamic messages from resolved data
toast.promise(fetchUser(id), {
  loading: "Loading user...",
  success: (user) => `Welcome back, ${user.name}!`,
  error: (err) => `Error: ${err.message}`,
})
```

### Toaster Configuration

```tsx
import { Toaster } from "sonner"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          duration={4000}
          expand={false}
          visibleToasts={3}
          theme="system"
        />
      </body>
    </html>
  )
}
```

### Custom Toast with JSX

```tsx
import { toast } from "sonner"

// Headless -- full control, keeps animations
toast.custom((id) => (
  <div className="flex items-center gap-3 rounded-lg bg-card p-4 shadow-lg border">
    <span>Custom notification</span>
    <button
      className="text-sm font-medium text-primary"
      onClick={() => toast.dismiss(id)}
    >
      Dismiss
    </button>
  </div>
))
```

### Dismiss Programmatically

```typescript
import { toast } from "sonner"

// Dismiss specific toast
const toastId = toast.loading("Processing...")
// ...later
toast.dismiss(toastId)

// Dismiss all toasts
toast.dismiss()
```

---

## Anti-Patterns

**BAD** -- Manual try/catch when promise toast handles it:
```typescript
try {
  toast.loading("Saving...")
  await saveData()
  toast.success("Saved!")
} catch (err) {
  toast.error("Failed!")
}
```

**GOOD** -- Use `toast.promise()` for automatic state management:
```typescript
toast.promise(saveData(), {
  loading: "Saving...",
  success: "Saved!",
  error: "Failed!",
})
```

**BAD** -- Multiple Toaster components without IDs:
```tsx
<Toaster />         {/* in layout */}
<Toaster />         {/* in another component -- duplicates! */}
```

**GOOD** -- Single Toaster at root, or use distinct IDs:
```tsx
<Toaster />         {/* one instance at root layout */}
```

**BAD** -- Calling toast in Server Component:
```tsx
// app/page.tsx (Server Component)
export default function Page() {
  toast("Hello")  // ERROR: client-side only
}
```

**GOOD** -- Call from client component or Server Action callback:
```tsx
"use client"
import { toast } from "sonner"

export function SaveButton() {
  return <button onClick={() => toast("Saved!")}>Save</button>
}
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Basic toast | `toast()` | `toast("Message")` |
| Success | `toast.success()` | `toast.success("Saved!")` |
| Error | `toast.error()` | `toast.error("Failed")` |
| Warning | `toast.warning()` | `toast.warning("Check input")` |
| Info | `toast.info()` | `toast.info("Update available")` |
| Loading | `toast.loading()` | `toast.loading("Processing...")` |
| Promise | `toast.promise()` | `toast.promise(fn(), { loading, success, error })` |
| Custom JSX | `toast.custom()` | `toast.custom((id) => <MyToast id={id} />)` |
| With description | `description` option | `toast("Title", { description: "Details" })` |
| With action | `action` option | `toast("Done", { action: { label: "Undo", onClick } })` |
| Dismiss one | `toast.dismiss(id)` | `const id = toast("Hi"); toast.dismiss(id)` |
| Dismiss all | `toast.dismiss()` | `toast.dismiss()` |
| Persistent | `duration: Infinity` | `toast("Alert", { duration: Infinity })` |
| Position | `<Toaster position>` | `<Toaster position="top-center" />` |
| Rich colors | `<Toaster richColors>` | `<Toaster richColors />` |
| Close button | `<Toaster closeButton>` | `<Toaster closeButton />` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Installation, Toaster component, global config, positioning, theming | [01-setup-toaster.md](01-setup-toaster.md) |
| toast() API, success/error/warning, promise, loading, custom JSX | [02-toast-types.md](02-toast-types.md) |
| Next.js App Router, shadcn/ui, Server Actions, styling, headless | [03-integration.md](03-integration.md) |

---

**Version:** ^2.0.0 | **Source:** https://sonner.emilkowal.ski
