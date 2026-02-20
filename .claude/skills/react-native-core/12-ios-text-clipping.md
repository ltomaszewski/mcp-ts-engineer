# iOS TextInput Text Clipping Prevention

**Critical Issue**: Text descenders (bottom of letters like y, g, p, q) get clipped on iOS when using certain styling approaches.

---

## The Problem

When using NativeWind/Tailwind text size classes (`text-sm`, `text-base`, `text-lg`, etc.) on `TextInput` components, iOS clips the bottom of text characters.

```tsx
// ❌ WRONG - Causes text clipping on iOS
<TextInput className="text-lg text-white" />
<TextInput className="text-base text-gray-900" />
```

**Root Cause**: NativeWind's text classes set BOTH `fontSize` AND `lineHeight`. When `lineHeight` is explicitly set, iOS doesn't have room for descenders.

---

## The Solution

Use explicit `fontSize` via the `style` prop WITHOUT setting `lineHeight`:

```tsx
// ✅ CORRECT - No text clipping
<TextInput
  className="text-white font-gotham"
  style={{ fontSize: 18 }}  // fontSize only, no lineHeight
/>
```

---

## Complete Pattern

```tsx
import { forwardRef, useState } from 'react';
import { Platform, TextInput, type TextInputProps, View } from 'react-native';

export const Input = forwardRef<TextInput, InputProps>(
  ({ onFocus, onBlur, ...props }, ref) => {
    const [isFocused, setIsFocused] = useState(false);

    // Android-specific props for text rendering
    const androidProps =
      Platform.OS === 'android'
        ? {
            textAlignVertical: 'center' as const,
            includeFontPadding: false,
          }
        : {};

    return (
      <View
        className={cn(
          'bg-dark-input rounded-lg border-2 p-2',
          isFocused ? 'border-primary-500' : 'border-gray-300'
        )}
      >
        <TextInput
          ref={ref}
          // ✅ No text-* classes - use style instead
          className="text-white font-gotham py-1.5"
          style={{ fontSize: 18 }}  // ✅ Explicit fontSize, no lineHeight
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...androidProps}
          {...props}
        />
      </View>
    );
  }
);
```

---

## Key Rules

### DO ✅

1. Use `style={{ fontSize: X }}` for TextInput font size
2. Let iOS calculate lineHeight naturally (don't set it)
3. Use `textAlignVertical: 'center'` on Android
4. Use `includeFontPadding: false` on Android
5. Test on both iOS and Android

### DON'T ❌

1. Use `text-sm`, `text-base`, `text-lg` on TextInput
2. Set explicit `lineHeight` on TextInput
3. Assume Text and TextInput behave the same

---

## Why This Happens

| Class | What it sets | Problem |
|-------|-------------|---------|
| `text-base` | `fontSize: 16, lineHeight: 24` | lineHeight clips descenders |
| `text-lg` | `fontSize: 18, lineHeight: 28` | lineHeight clips descenders |
| `style={{ fontSize: 18 }}` | `fontSize: 18` only | iOS calculates lineHeight |

When you don't set `lineHeight`, iOS calculates the optimal value based on the font metrics, ensuring descenders have enough space.

---

## Testing for This Issue

Characters with descenders to test:
- Lowercase: `g`, `j`, `p`, `q`, `y`
- Test string: `"gyp jpq yqg"`

If the bottom of these letters is cut off, you have the clipping issue.

---

## Related Issues

- [React Native #41240](https://github.com/facebook/react-native/issues/41240) - TextInput text clipping
- NativeWind sets lineHeight via Tailwind's typography scale

---

## Affected Components

When creating or modifying these components, apply the fix:

- `TextInput` (any usage)
- Custom input components
- Form fields
- Search bars
- Chat input boxes

---

## Summary

```tsx
// ❌ CAUSES CLIPPING
<TextInput className="text-lg" />

// ✅ PREVENTS CLIPPING
<TextInput style={{ fontSize: 18 }} />
```

**Remember**: `Text` components can use NativeWind text classes safely. Only `TextInput` has this issue.
