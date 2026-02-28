# shadcn/ui Component Reference

> Key component APIs, props, and usage patterns for the most-used shadcn/ui components.

---

## Button

```bash
npx shadcn@latest add button
```

| Prop | Type | Default |
|------|------|---------|
| `variant` | `"default" \| "outline" \| "secondary" \| "ghost" \| "destructive" \| "link"` | `"default"` |
| `size` | `"default" \| "xs" \| "sm" \| "lg" \| "icon"` | `"default"` |
| `asChild` | `boolean` | `false` |

```tsx
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Mail, Loader2 } from "lucide-react"

<Button>Default</Button>
<Button variant="outline">Outline</Button>
<Button variant="destructive">Delete</Button>
<Button size="sm">Small</Button>
<Button size="icon"><Mail className="size-4" /></Button>

// Render as Next.js Link
<Button asChild><Link href="/dashboard">Dashboard</Link></Button>

// With icon (use data-icon for spacing)
<Button><Mail data-icon="inline-start" />Send</Button>

// Loading
<Button disabled><Loader2 className="animate-spin" data-icon="inline-start" />Wait</Button>
```

---

## Card

```bash
npx shadcn@latest add card
```

Subcomponents: `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`

```tsx
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

<Card>
  <CardHeader>
    <CardTitle>Project Alpha</CardTitle>
    <CardDescription>Last updated 2 hours ago</CardDescription>
    <CardAction><Badge>Active</Badge></CardAction>
  </CardHeader>
  <CardContent><p>Progress at 75%</p></CardContent>
  <CardFooter>
    <Button variant="outline">Cancel</Button>
    <Button>Deploy</Button>
  </CardFooter>
</Card>
```

Use `<Card size="sm">` for compact layouts.

---

## Dialog

```bash
npx shadcn@latest add dialog
```

Subcomponents: `Dialog`, `DialogTrigger`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `DialogClose`

```tsx
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"

<Dialog>
  <DialogTrigger asChild><Button variant="outline">Edit Profile</Button></DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Edit profile</DialogTitle>
      <DialogDescription>Make changes here.</DialogDescription>
    </DialogHeader>
    <div className="grid gap-4 py-4">{/* form fields */}</div>
    <DialogFooter><Button type="submit">Save</Button></DialogFooter>
  </DialogContent>
</Dialog>
```

Controlled: `<Dialog open={open} onOpenChange={setOpen}>`. Hide X: `<DialogContent showCloseButton={false}>`.

---

## DropdownMenu

```bash
npx shadcn@latest add dropdown-menu
```

```tsx
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

<DropdownMenu>
  <DropdownMenuTrigger asChild><Button variant="outline">Account</Button></DropdownMenuTrigger>
  <DropdownMenuContent className="w-56">
    <DropdownMenuLabel>My Account</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuGroup>
      <DropdownMenuItem>Profile</DropdownMenuItem>
      <DropdownMenuItem>Settings</DropdownMenuItem>
    </DropdownMenuGroup>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Log out</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

Also: `DropdownMenuShortcut`, `DropdownMenuCheckboxItem`, `DropdownMenuRadioGroup`/`DropdownMenuRadioItem`, `DropdownMenuSub`.

---

## Form (Field + react-hook-form)

```bash
npx shadcn@latest add field input label
npm install react-hook-form @hookform/resolvers zod
```

```tsx
"use client"
import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"

const schema = z.object({ title: z.string().min(5).max(100) })
type FormValues = z.infer<typeof schema>

export function BugReportForm() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "" },
  })
  return (
    <form onSubmit={form.handleSubmit((data) => console.log(data))} className="space-y-6">
      <Controller name="title" control={form.control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name}>Bug Title</FieldLabel>
            <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
            <FieldDescription>Concise summary</FieldDescription>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )} />
      <Button type="submit" disabled={form.formState.isSubmitting}>Submit</Button>
    </form>
  )
}
```

### Select in Forms

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

<Controller name="priority" control={form.control}
  render={({ field, fieldState }) => (
    <Field data-invalid={fieldState.invalid}>
      <FieldLabel htmlFor="priority">Priority</FieldLabel>
      <Select name={field.name} value={field.value} onValueChange={field.onChange}>
        <SelectTrigger id="priority" aria-invalid={fieldState.invalid}>
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="low">Low</SelectItem>
          <SelectItem value="high">High</SelectItem>
        </SelectContent>
      </Select>
      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
    </Field>
  )} />
```

---

## Input

```bash
npx shadcn@latest add input
```

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

<Input type="email" placeholder="Email" />
<Input disabled placeholder="Disabled" />
<Input type="file" />

// With label
<div className="grid w-full max-w-sm gap-1.5">
  <Label htmlFor="email">Email</Label>
  <Input type="email" id="email" placeholder="you@example.com" />
</div>
```

---

## Select

```bash
npx shadcn@latest add select
```

```tsx
import {
  Select, SelectContent, SelectGroup, SelectItem,
  SelectLabel, SelectTrigger, SelectValue,
} from "@/components/ui/select"

<Select>
  <SelectTrigger className="w-[280px]">
    <SelectValue placeholder="Select timezone" />
  </SelectTrigger>
  <SelectContent>
    <SelectGroup>
      <SelectLabel>North America</SelectLabel>
      <SelectItem value="est">Eastern (UTC-5)</SelectItem>
      <SelectItem value="pst">Pacific (UTC-8)</SelectItem>
    </SelectGroup>
  </SelectContent>
</Select>
```

Additional subcomponents: `SelectSeparator`, `SelectScrollUpButton`, `SelectScrollDownButton`.

---

## Sheet

```bash
npx shadcn@latest add sheet
```

Slides in from screen edge. Subcomponents: `Sheet`, `SheetTrigger`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `SheetFooter`, `SheetClose`

```tsx
import {
  Sheet, SheetClose, SheetContent, SheetDescription,
  SheetFooter, SheetHeader, SheetTitle, SheetTrigger,
} from "@/components/ui/sheet"

<Sheet>
  <SheetTrigger asChild><Button variant="outline">Menu</Button></SheetTrigger>
  <SheetContent side="left">
    <SheetHeader>
      <SheetTitle>Navigation</SheetTitle>
      <SheetDescription>Browse sections</SheetDescription>
    </SheetHeader>
    <nav className="flex flex-col gap-2 py-4">...</nav>
  </SheetContent>
</Sheet>
```

Side prop: `"top"`, `"right"` (default), `"bottom"`, `"left"`

---

## Table

```bash
npx shadcn@latest add table
```

```tsx
import {
  Table, TableBody, TableCaption, TableCell,
  TableFooter, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"

<Table>
  <TableCaption>Recent invoices</TableCaption>
  <TableHeader>
    <TableRow>
      <TableHead>Invoice</TableHead>
      <TableHead>Status</TableHead>
      <TableHead className="text-right">Amount</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {invoices.map((inv) => (
      <TableRow key={inv.id}>
        <TableCell className="font-medium">{inv.id}</TableCell>
        <TableCell>{inv.status}</TableCell>
        <TableCell className="text-right">{inv.amount}</TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

Subcomponents: `Table`, `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`. For sorting/filtering, combine with `@tanstack/react-table`.

---

## Tabs

```bash
npx shadcn@latest add tabs
```

```tsx
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

<Tabs defaultValue="general" className="w-full">
  <TabsList>
    <TabsTrigger value="general">General</TabsTrigger>
    <TabsTrigger value="security">Security</TabsTrigger>
  </TabsList>
  <TabsContent value="general">General settings content</TabsContent>
  <TabsContent value="security">Security settings content</TabsContent>
</Tabs>

// Line variant
<TabsList variant="line">...</TabsList>

// Vertical
<Tabs orientation="vertical">
  <TabsList className="flex-col">...</TabsList>
</Tabs>
```

---

## Sonner (Toast)

Replaces deprecated Toast component.

```bash
npx shadcn@latest add sonner
```

**Setup:** Add `<Toaster />` to root layout:

```tsx
import { Toaster } from "@/components/ui/sonner"
// In layout.tsx body: <Toaster />
```

**Usage:**

```tsx
import { toast } from "sonner"

toast("Default")                                      // neutral
toast.success("Saved!")                                // green
toast.error("Failed")                                  // red
toast.warning("Unsaved changes")                       // yellow
toast.info("Update available")                         // blue
toast("Created", { description: "For tomorrow" })      // with description
toast("Deleted", { action: { label: "Undo", onClick: () => {} } })  // with action
toast.promise(fetchData(), { loading: "...", success: "Done!", error: "Failed" })
```

---

## Label

```bash
npx shadcn@latest add label
```

```tsx
import { Label } from "@/components/ui/label"

<Label htmlFor="email">Email address</Label>
```

Always pair with `htmlFor` matching the input's `id` for accessibility.

---

**Version:** latest (2025) | **Source:** https://ui.shadcn.com/docs
