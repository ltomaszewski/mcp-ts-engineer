# Sonner: Integration Patterns

> Next.js App Router, shadcn/ui, Server Actions, styling, theming, and headless mode.

---

## Next.js App Router Integration

### Root Layout Setup

Place `<Toaster />` in the root layout. It can be rendered from a Server Component -- the component itself handles client-side hydration.

```tsx
// app/layout.tsx
import { Toaster } from "sonner"

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  )
}
```

### Client Component Usage

Call `toast()` from client components in event handlers:

```tsx
"use client"

import { toast } from "sonner"

export function CreateButton() {
  async function handleCreate() {
    toast.promise(createItem(), {
      loading: "Creating...",
      success: "Item created!",
      error: "Failed to create item",
    })
  }

  return <button onClick={handleCreate}>Create</button>
}
```

### Server Actions with Toast Feedback

Server Actions run on the server but return to the client. Show toast on the client side after the action completes:

```tsx
// actions.ts
"use server"

export async function createPost(formData: FormData) {
  const title = formData.get("title") as string
  // ... database operation
  return { success: true, id: "123" }
}
```

```tsx
// components/create-post-form.tsx
"use client"

import { toast } from "sonner"
import { createPost } from "@/app/actions"

export function CreatePostForm() {
  async function handleSubmit(formData: FormData) {
    toast.promise(createPost(formData), {
      loading: "Creating post...",
      success: (result) => `Post created (ID: ${result.id})`,
      error: "Failed to create post",
    })
  }

  return (
    <form action={handleSubmit}>
      <input name="title" placeholder="Post title" />
      <button type="submit">Create</button>
    </form>
  )
}
```

### Server Action with Manual State

For more control over the toast lifecycle with Server Actions:

```tsx
"use client"

import { toast } from "sonner"
import { deleteUser } from "@/app/actions"

export function DeleteButton({ userId }: { userId: string }) {
  async function handleDelete() {
    const toastId = toast.loading("Deleting user...")

    try {
      const result = await deleteUser(userId)

      if (result.error) {
        toast.error(result.error, { id: toastId })
        return
      }

      toast.success("User deleted", { id: toastId })
    } catch {
      toast.error("Network error. Please try again.", { id: toastId })
    }
  }

  return (
    <button onClick={handleDelete} className="text-destructive">
      Delete
    </button>
  )
}
```

### useFormStatus Integration

Combine with React's `useFormStatus` for form-aware toasts:

```tsx
"use client"

import { useEffect, useRef } from "react"
import { useFormStatus } from "react-dom"
import { toast } from "sonner"

function SubmitButton() {
  const { pending } = useFormStatus()
  const toastIdRef = useRef<string | number | undefined>()

  useEffect(() => {
    if (pending) {
      toastIdRef.current = toast.loading("Submitting...")
    }
  }, [pending])

  return (
    <button type="submit" disabled={pending}>
      {pending ? "Submitting..." : "Submit"}
    </button>
  )
}
```

---

## shadcn/ui Integration

### Installation

```bash
npx shadcn@latest add sonner
```

This generates `src/components/ui/sonner.tsx`:

```tsx
"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
```

### Usage with shadcn/ui

```tsx
// app/layout.tsx
import { Toaster } from "@/components/ui/sonner"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <main>{children}</main>
        <Toaster />
      </body>
    </html>
  )
}
```

```tsx
// Any client component
"use client"
import { toast } from "sonner"

export function SaveButton() {
  return (
    <button onClick={() => toast.success("Saved successfully!")}>
      Save
    </button>
  )
}
```

The shadcn wrapper maps sonner's styling to your project's CSS variables (`--background`, `--foreground`, `--border`, `--primary`, etc.), so toasts match your theme automatically.

---

## Theming

### CSS Variables Integration

Sonner works with CSS custom properties. The shadcn/ui wrapper does this automatically, but for manual setup:

```tsx
<Toaster
  toastOptions={{
    style: {
      background: "var(--background)",
      color: "var(--foreground)",
      border: "1px solid var(--border)",
    },
  }}
/>
```

### Dark Mode with next-themes

```tsx
"use client"

import { useTheme } from "next-themes"
import { Toaster } from "sonner"

export function ThemeAwareToaster() {
  const { theme } = useTheme() as { theme: "light" | "dark" | "system" }

  return (
    <Toaster
      theme={theme}
      richColors
      closeButton
    />
  )
}
```

### Dark Mode with shadcn/ui

The shadcn wrapper uses CSS variable classes (via `group-[.toaster]`) that automatically respond to the active theme -- no manual theme prop needed if your project uses next-themes with `attribute="class"`.

---

## Styling Deep Dive

### Global Styling via toastOptions

Apply consistent styles across all toasts:

```tsx
<Toaster
  toastOptions={{
    style: {
      background: "var(--background)",
      border: "1px solid var(--border)",
      color: "var(--foreground)",
    },
    classNames: {
      toast: "rounded-xl shadow-md",
      title: "font-semibold",
      description: "text-sm text-muted-foreground",
      actionButton: "bg-primary text-primary-foreground",
      cancelButton: "bg-muted text-muted-foreground",
      closeButton: "bg-background border-border",
    },
  }}
/>
```

### Per-Toast Styling

Override styles on individual toasts:

```typescript
toast("Custom styled", {
  style: { background: "#0f172a", color: "#f8fafc" },
  className: "my-custom-toast",
})
```

### className Targets

The `classNames` object lets you target specific parts of the toast:

| Key | Targets |
|-----|---------|
| `toast` | Outer toast container |
| `title` | Toast title text |
| `description` | Description text |
| `actionButton` | Primary action button |
| `cancelButton` | Secondary cancel button |
| `closeButton` | Close (X) button |

**Important:** When NOT using `unstyled: true`, you need `!important` (Tailwind `!` prefix) to override default styles:

```typescript
toast("Hello", {
  classNames: {
    description: "!text-red-500",     // needs !important
    title: "!font-bold !text-lg",     // needs !important
  },
})
```

### Unstyled Mode

Remove all default styles for full control without `!important`:

```typescript
toast("Fully custom", {
  unstyled: true,
  classNames: {
    toast: "flex items-center gap-3 rounded-lg border bg-card p-4 shadow-md",
    title: "font-medium text-foreground",
    description: "text-sm text-muted-foreground",
  },
})
```

---

## Headless Mode (toast.custom)

For completely custom toast UI with full control over markup while keeping sonner's animations, stacking, and dismissal:

```tsx
"use client"

import { toast } from "sonner"

export function NotificationToast() {
  function showNotification() {
    toast.custom((id) => (
      <div className="w-[356px] rounded-lg border bg-card p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
            <BellIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium">New comment</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sarah replied to your post
            </p>
          </div>
          <button
            onClick={() => toast.dismiss(id)}
            className="text-muted-foreground hover:text-foreground"
          >
            <XIcon className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button
            className="text-xs text-muted-foreground hover:text-foreground"
            onClick={() => toast.dismiss(id)}
          >
            Dismiss
          </button>
          <button
            className="rounded-md bg-primary px-3 py-1 text-xs text-primary-foreground"
            onClick={() => {
              viewComment()
              toast.dismiss(id)
            }}
          >
            View
          </button>
        </div>
      </div>
    ))
  }

  return <button onClick={showNotification}>Show notification</button>
}
```

---

## Common Integration Patterns

### CRUD Operations

```tsx
"use client"

import { toast } from "sonner"

// Create
async function handleCreate(data: FormData) {
  toast.promise(createItem(data), {
    loading: "Creating...",
    success: "Created successfully!",
    error: "Failed to create",
  })
}

// Update
async function handleUpdate(id: string, data: FormData) {
  toast.promise(updateItem(id, data), {
    loading: "Saving changes...",
    success: "Changes saved!",
    error: "Failed to save changes",
  })
}

// Delete with undo
async function handleDelete(id: string) {
  toast("Item deleted", {
    action: {
      label: "Undo",
      onClick: () => restoreItem(id),
    },
    duration: 5000,
  })
  await deleteItem(id)
}
```

### Form Submission

```tsx
"use client"

import { toast } from "sonner"
import { useForm } from "react-hook-form"

export function ContactForm() {
  const form = useForm<FormValues>()

  async function onSubmit(data: FormValues) {
    toast.promise(submitContact(data), {
      loading: "Sending message...",
      success: "Message sent! We'll get back to you soon.",
      error: "Failed to send message. Please try again.",
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* form fields */}
    </form>
  )
}
```

### Authentication Feedback

```tsx
"use client"

import { toast } from "sonner"
import { signIn, signOut } from "@/lib/auth-client"

export function LoginButton() {
  async function handleLogin() {
    const toastId = toast.loading("Signing in...")

    const result = await signIn.email({
      email: "user@example.com",
      password: "password",
    })

    if (result.error) {
      toast.error(result.error.message, { id: toastId })
      return
    }

    toast.success("Welcome back!", { id: toastId })
  }

  return <button onClick={handleLogin}>Sign in</button>
}

export function LogoutButton() {
  return (
    <button onClick={() => {
      signOut()
      toast.success("Signed out successfully")
    }}>
      Sign out
    </button>
  )
}
```

### Clipboard Copy

```tsx
"use client"

import { toast } from "sonner"

export function CopyButton({ text }: { text: string }) {
  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Copied to clipboard!")
    } catch {
      toast.error("Failed to copy")
    }
  }

  return <button onClick={handleCopy}>Copy</button>
}
```

### File Upload with Progress

```tsx
"use client"

import { toast } from "sonner"

export function UploadButton() {
  async function handleUpload(file: File) {
    const toastId = toast.loading(`Uploading ${file.name}...`)

    try {
      const result = await uploadFile(file)
      toast.success(`${file.name} uploaded successfully`, {
        id: toastId,
        description: `Size: ${(file.size / 1024).toFixed(1)} KB`,
        action: {
          label: "View",
          onClick: () => window.open(result.url),
        },
      })
    } catch (err) {
      toast.error(`Failed to upload ${file.name}`, {
        id: toastId,
        description: err instanceof Error ? err.message : "Unknown error",
      })
    }
  }

  return (
    <input
      type="file"
      onChange={(e) => {
        const file = e.target.files?.[0]
        if (file) handleUpload(file)
      }}
    />
  )
}
```

---

## Testing

### Test ID for E2E

```typescript
toast("Hello", { testId: "welcome-toast" })
```

Use `testId` in Playwright/Cypress to reliably locate toasts:

```typescript
// Playwright
await page.getByTestId("welcome-toast").waitFor()
```

### Vitest/Testing Library

Toast is a side effect. Test by verifying the function was called or by checking DOM:

```typescript
import { vi } from "vitest"

// Mock sonner
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    promise: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  }),
}))

// In test
import { toast } from "sonner"

it("shows success toast on save", async () => {
  await userEvent.click(screen.getByRole("button", { name: "Save" }))
  expect(toast.success).toHaveBeenCalledWith("Saved!")
})
```

---

## Troubleshooting

| Issue | Cause | Fix |
|-------|-------|-----|
| Toasts not showing | Missing `<Toaster />` | Add to root layout |
| Duplicate toasts | Multiple `<Toaster />` without `id` | Use single instance or distinct `id` |
| Wrong theme | Theme not synced | Use `theme` prop or next-themes integration |
| Styles not applying | Default styles override | Use `!important` or `unstyled: true` |
| Toast in Server Component | `toast()` is client-only | Move to client component or event handler |
| Action button not closing | `event.preventDefault()` called | Remove `preventDefault()` if close desired |

---

**Version:** ^2.0.0 | **Source:** https://sonner.emilkowal.ski
