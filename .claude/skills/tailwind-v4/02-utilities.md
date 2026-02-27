# Tailwind CSS v4 Utility Classes

Core utility classes organized by category. All support responsive (`md:`), state (`hover:`), and dark mode (`dark:`) variants.

---

## Layout

### Display

| Class | CSS | Class | CSS |
|-------|-----|-------|-----|
| `block` | `display: block` | `hidden` | `display: none` |
| `flex` | `display: flex` | `inline-flex` | `display: inline-flex` |
| `grid` | `display: grid` | `inline-grid` | `display: inline-grid` |
| `inline-block` | `display: inline-block` | `contents` | `display: contents` |
| `sr-only` | Visually hidden | `not-sr-only` | Undo sr-only |

### Position

```html
<div class="relative">
  <div class="absolute top-0 right-0">Top right</div>
  <div class="absolute inset-0">Fill parent</div>
</div>
<div class="fixed top-0 inset-x-0 z-50">Fixed header</div>
<div class="sticky top-0">Sticky element</div>
```

### Overflow and Z-Index

```html
<div class="overflow-auto">Scrollable</div>
<div class="overflow-hidden">Clipped</div>
<div class="overflow-x-auto">Horizontal scroll</div>
<div class="z-10">z-index: 10</div>
<div class="z-50">z-index: 50</div>
<div class="z-[100]">z-index: 100 (arbitrary)</div>
```

---

## Flexbox

```html
<!-- Direction -->
<div class="flex flex-row gap-4">Row (default)</div>
<div class="flex flex-col gap-4">Column</div>
<div class="flex flex-wrap gap-4">Wrapping</div>

<!-- Alignment -->
<div class="flex items-center justify-center">Centered</div>
<div class="flex items-center justify-between">Space between</div>
<div class="flex items-start justify-end">Top right</div>
```

| Class | Effect |
|-------|--------|
| `items-start/center/end/stretch/baseline` | Cross-axis alignment |
| `justify-start/center/end/between/around/evenly` | Main-axis alignment |
| `flex-1` | Grow/shrink, ignore initial size |
| `flex-auto` | Grow/shrink, respect initial size |
| `flex-initial` | Shrink only |
| `flex-none` | Fixed size |
| `grow` / `grow-0` | Allow/prevent growing |
| `shrink-0` | Prevent shrinking |

### Common patterns

```html
<!-- Sidebar layout -->
<div class="flex">
  <aside class="w-64 shrink-0">Sidebar</aside>
  <main class="flex-1">Content</main>
</div>

<!-- Full-screen center -->
<div class="flex items-center justify-center h-screen">
  <p>Centered</p>
</div>
```

---

## Grid

```html
<div class="grid grid-cols-3 gap-4">3 columns</div>
<div class="grid grid-cols-12 gap-4">12-column grid</div>
<div class="grid grid-cols-[200px_1fr_100px]">Custom columns</div>
<div class="grid grid-rows-[auto_1fr_auto] min-h-screen">Header/content/footer</div>
```

### Spanning

```html
<div class="col-span-2">Span 2 columns</div>
<div class="col-span-full">Span all columns</div>
<div class="col-start-2 col-end-4">Columns 2-3</div>
<div class="row-span-2">Span 2 rows</div>
```

### Responsive card grid

```html
<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <div class="p-4 rounded-lg bg-white shadow">Card</div>
</div>
```

---

## Spacing

v4 uses a base `--spacing` variable (default: `0.25rem`). Any integer works: `p-17`, `m-29`.

| Value | Size | Pixels | Value | Size | Pixels |
|-------|------|--------|-------|------|--------|
| `0` | `0` | 0px | `6` | `1.5rem` | 24px |
| `px` | `1px` | 1px | `8` | `2rem` | 32px |
| `1` | `0.25rem` | 4px | `10` | `2.5rem` | 40px |
| `2` | `0.5rem` | 8px | `12` | `3rem` | 48px |
| `3` | `0.75rem` | 12px | `16` | `4rem` | 64px |
| `4` | `1rem` | 16px | `20` | `5rem` | 80px |
| `5` | `1.25rem` | 20px | `24` | `6rem` | 96px |

### Padding and Margin

```html
<div class="p-4">All sides</div>
<div class="px-4 py-2">Horizontal + vertical</div>
<div class="pt-4 pb-2">Top + bottom</div>
<div class="ps-4 pe-4">Inline start/end (RTL-aware)</div>
<div class="mx-auto">Horizontal center</div>
<div class="ml-auto">Push right</div>
<div class="-mt-4">Negative margin</div>
```

### Gap

```html
<div class="flex gap-4">Uniform gap</div>
<div class="flex gap-x-4 gap-y-2">Different axes</div>
<div class="grid grid-cols-3 gap-6">Grid gap</div>
```

---

## Sizing

### Width

```html
<div class="w-64">16rem (256px)</div>
<div class="w-full">100%</div>
<div class="w-screen">100vw</div>
<div class="w-dvw">100dvw (dynamic viewport)</div>
<div class="w-1/2">50%</div>
<div class="w-1/3">33.333%</div>
<div class="w-min">min-content</div>
<div class="w-max">max-content</div>
<div class="w-fit">fit-content</div>
```

### Max-width (container scale)

```html
<div class="max-w-sm">24rem</div>
<div class="max-w-md">28rem</div>
<div class="max-w-lg">32rem</div>
<div class="max-w-xl">36rem</div>
<div class="max-w-2xl">42rem</div>
<div class="max-w-7xl">80rem</div>
```

### Height and Size

```html
<div class="h-screen">100vh</div>
<div class="h-dvh">100dvh</div>
<div class="min-h-screen">min-height: 100vh</div>
<div class="size-8">32px x 32px (width + height)</div>
<div class="size-full">100% x 100%</div>
```

---

## Typography

### Font size

| Class | Size | Class | Size |
|-------|------|-------|------|
| `text-xs` | 0.75rem | `text-xl` | 1.25rem |
| `text-sm` | 0.875rem | `text-2xl` | 1.5rem |
| `text-base` | 1rem | `text-3xl` | 1.875rem |
| `text-lg` | 1.125rem | `text-4xl`-`text-9xl` | 2.25rem-8rem |

### Font weight and family

```html
<p class="font-light">300</p>
<p class="font-normal">400</p>
<p class="font-medium">500</p>
<p class="font-semibold">600</p>
<p class="font-bold">700</p>
<p class="font-sans">Sans-serif</p>
<p class="font-mono">Monospace</p>
```

### Text utilities

```html
<p class="text-left">Left</p>
<p class="text-center">Center</p>
<p class="text-right">Right</p>
<p class="underline">Underlined</p>
<p class="line-through">Strikethrough</p>
<p class="uppercase">Uppercase</p>
<p class="capitalize">Capitalize</p>
<p class="truncate">Ellipsis (single line)</p>
<p class="line-clamp-3">Clamp to 3 lines</p>
<p class="tracking-tight">Tight letter spacing</p>
<p class="leading-relaxed">Relaxed line height</p>
```

---

## Colors

All colors work with: `bg-`, `text-`, `border-`, `ring-`, `fill-`, `stroke-`, `shadow-`, `accent-`, `caret-`, `decoration-`, `outline-`.

Each color has 11 shades (50, 100-900, 950). Default palette: red, orange, amber, yellow, lime, green, emerald, teal, cyan, sky, blue, indigo, violet, purple, fuchsia, pink, rose, slate, gray, zinc, neutral, stone.

```html
<div class="bg-blue-500 text-white">Blue background</div>
<div class="border-gray-300 text-gray-900">Gray border</div>
<div class="bg-sky-500/50">50% opacity</div>
<div class="bg-black/10">10% black overlay</div>
```

All v4 colors use oklch color space. Custom colors:

```css
@theme {
  --color-brand: oklch(0.72 0.11 178);
}
```

---

## Borders and Radius

```html
<div class="border">1px</div>
<div class="border-2 border-gray-300">2px gray</div>
<div class="border-t border-b-2">Top 1px, bottom 2px</div>
<div class="rounded">0.25rem</div>
<div class="rounded-md">0.375rem</div>
<div class="rounded-lg">0.5rem</div>
<div class="rounded-xl">0.75rem</div>
<div class="rounded-full">Circle</div>
<div class="rounded-t-lg">Top corners only</div>
```

---

## Effects

```html
<!-- Shadows -->
<div class="shadow-sm">Small</div>
<div class="shadow-md">Medium</div>
<div class="shadow-xl">Extra large</div>

<!-- Opacity -->
<div class="opacity-50">50%</div>
<div class="opacity-0">Invisible</div>

<!-- Ring (focus outline) -->
<button class="ring-2 ring-blue-500">Ring</button>
<input class="focus:ring-2 focus:ring-blue-500 focus:outline-none" />
```

---

## Transitions and Animations

```html
<button class="transition hover:bg-blue-600">Default transition</button>
<div class="transition-all duration-300 ease-in-out">All, 300ms</div>
<div class="transition-colors duration-150">Colors only</div>
<div class="transition-transform duration-500">Transform only</div>

<!-- Duration: 75, 100, 150, 200, 300, 500, 700, 1000 -->
<!-- Easing: ease-linear, ease-in, ease-out, ease-in-out -->

<div class="animate-spin">Spinner</div>
<div class="animate-pulse">Skeleton loader</div>
<div class="animate-bounce">Bouncing</div>
<div class="motion-reduce:animate-none">Respects reduced motion</div>
```

---

## Transforms

```html
<div class="scale-95 hover:scale-100 transition">Scale on hover</div>
<div class="hover:-translate-y-1 transition">Lift on hover</div>
<div class="rotate-45">Rotate 45deg</div>
<div class="perspective-distant rotate-x-12 transform-3d">3D (new in v4)</div>
```

---

## Gradients (v4 syntax)

```html
<!-- bg-linear-* replaces bg-gradient-* -->
<div class="bg-linear-to-r from-blue-500 to-purple-500">Left to right</div>
<div class="bg-linear-to-br from-pink-500 via-red-500 to-yellow-500">Diagonal</div>
<div class="bg-linear-45 from-indigo-500 to-teal-400">45deg (new)</div>
<div class="bg-radial-[at_25%_25%] from-white to-zinc-900">Radial (new)</div>
<div class="bg-conic from-red-500 via-yellow-500 to-red-500">Conic (new)</div>
```

---

## Arbitrary Values

Break out of the design system when needed:

```html
<div class="top-[117px]">Arbitrary position</div>
<div class="bg-[#bada55]">Arbitrary color</div>
<div class="grid-cols-[1fr_500px_2fr]">Arbitrary grid</div>
<div class="text-[22px]">Arbitrary font size</div>
<div class="fill-(--my-brand-color)">CSS variable</div>
<div class="[mask-type:luminance]">Arbitrary property</div>
```

Use underscores for spaces: `grid-cols-[1fr_500px_2fr]`

Type hints for ambiguous values: `text-(length:--my-var)` vs `text-(color:--my-var)`

---

**Version:** 4.x | **Source:** https://tailwindcss.com/docs
