# React Native Reanimated 4.x Knowledge Base

**Version:** react-native-reanimated ^4.2.2 | react-native-worklets ^0.7.x
**Architecture:** React Native New Architecture (Fabric) required
**Official Docs:** https://docs.swmansion.com/react-native-reanimated/

---

## Module Directory

### [SKILL.md](SKILL.md) -- Entry Point
Quick reference with critical rules, core patterns, anti-patterns, and API table. Start here for any Reanimated task.

### [01-setup-installation.md](01-setup-installation.md) -- Setup and Installation
Installation for Expo and CLI projects, Babel plugin configuration, version compatibility matrix, and complete v3-to-v4 migration guide including renamed/removed APIs.

### [02-core-shared-values.md](02-core-shared-values.md) -- Shared Values
`useSharedValue`, `.value`, `.get()`, `.set()`, `.modify()`, `useDerivedValue`, thread safety rules, closure capture, and React Compiler compatibility.

### [03-core-animated-style.md](03-core-animated-style.md) -- Animated Style and Props
`useAnimatedStyle`, `useAnimatedProps`, `useAnimatedRef`, `useAnimatedReaction`, `measure()`, `scrollTo()`, `interpolate()`, `interpolateColor()`, and Animated components.

### [04-animations-timing-spring.md](04-animations-timing-spring.md) -- Timing and Spring Animations
`withTiming` with all Easing functions (linear, quad, cubic, bezier, bounce, elastic, etc.), `withSpring` with physics-based and duration-based config, `cancelAnimation()`, and v4 default changes.

### [05-animations-modifiers.md](05-animations-modifiers.md) -- Animation Modifiers
`withSequence`, `withRepeat`, `withDelay`, `withDecay` with rubber band effect. Common patterns: shake, pulse, shimmer, staggered entrance.

### [06-worklets-guide.md](06-worklets-guide.md) -- Worklets and Threading
`'worklet'` directive, automatic workletization, `scheduleOnUI` (was `runOnUI`), `scheduleOnRN` (was `runOnJS`), `useFrameCallback`, closure capture rules, custom runtimes, web behavior.

### [07-gestures-events.md](07-gestures-events.md) -- Gesture Integration
Gesture Handler v2 API (Pan, Tap, Pinch, combined gestures), `useAnimatedScrollHandler`, `useScrollOffset`, swipe-to-dismiss, pan-with-decay, and migration from removed `useAnimatedGestureHandler`.

### [08-layout-animations.md](08-layout-animations.md) -- Layout Animations
All entering animations (Fade, Slide, Zoom, Bounce, Flip, LightSpeed, Pinwheel, Roll, Rotate, Stretch), all exiting animations, modifier methods, layout transitions (Linear, Sequenced, Fading, Jumping, Curved, EntryExit), `LayoutAnimationConfig`, custom animations, shared element transitions.

### [09-best-practices.md](09-best-practices.md) -- Best Practices
Performance optimization, accessibility (`useReducedMotion`, `ReduceMotion`, `ReducedMotionConfig`), animation choice guidelines, duration/easing recommendations, code organization patterns, web considerations.

### [10-troubleshooting-faq.md](10-troubleshooting-faq.md) -- Troubleshooting
Build issues, animation bugs, thread errors, gesture problems, layout animation gotchas, web-specific issues, and debug checklist.

---

## Quick Decision Matrix

| Task | Primary File | Also Read |
|---|---|---|
| Setting up a new project | 01-setup-installation | 02-core-shared-values |
| Migrating from Reanimated 3 | 01-setup-installation | 10-troubleshooting-faq |
| Creating a basic animation | 04-animations-timing-spring | 03-core-animated-style |
| Chaining/repeating animations | 05-animations-modifiers | 04-animations-timing-spring |
| Handling user gestures | 07-gestures-events | 05-animations-modifiers |
| List item enter/exit animations | 08-layout-animations | 09-best-practices |
| Animating layout changes | 08-layout-animations | 04-animations-timing-spring |
| Screen-to-screen transitions | 08-layout-animations (shared element) | 01-setup-installation |
| Scroll-driven animations | 07-gestures-events | 03-core-animated-style |
| Understanding worklets/threading | 06-worklets-guide | 02-core-shared-values |
| Performance optimization | 09-best-practices | 06-worklets-guide |
| Debugging animation issues | 10-troubleshooting-faq | 09-best-practices |

---

## Key Concepts

**Shared Values:** Mutable state accessible from both JS and UI threads. Use `.value` or `.get()`/`.set()` (React Compiler compatible).

**Worklets:** Functions marked with `'worklet'` that execute on the UI thread for smooth 60/120 fps animations.

**Animated Components:** `Animated.View`, `Animated.Text`, `Animated.ScrollView`, etc. Required to accept animated styles.

**Animation Functions:** `withTiming` (duration-based), `withSpring` (physics-based), `withDecay` (momentum). Combine with `withSequence`, `withRepeat`, `withDelay`.

**Layout Animations:** Declarative entering/exiting/layout props on `Animated.View` for mount/unmount and reorder animations.

---

## API by Hook

| Hook/Function | File |
|---|---|
| `useSharedValue` | 02-core-shared-values |
| `useDerivedValue` | 02-core-shared-values |
| `useAnimatedStyle` | 03-core-animated-style |
| `useAnimatedProps` | 03-core-animated-style |
| `useAnimatedRef` | 03-core-animated-style |
| `useAnimatedReaction` | 03-core-animated-style |
| `useFrameCallback` | 06-worklets-guide |
| `useAnimatedScrollHandler` | 07-gestures-events |
| `useScrollOffset` | 07-gestures-events |
| `useReducedMotion` | 09-best-practices |
| `withTiming` | 04-animations-timing-spring |
| `withSpring` | 04-animations-timing-spring |
| `withDecay` | 05-animations-modifiers |
| `withSequence` | 05-animations-modifiers |
| `withRepeat` | 05-animations-modifiers |
| `withDelay` | 05-animations-modifiers |
| `cancelAnimation` | 04-animations-timing-spring |
| `interpolate` | 03-core-animated-style |
| `interpolateColor` | 03-core-animated-style |
| `measure` | 03-core-animated-style |
| `scrollTo` | 03-core-animated-style |
| `scheduleOnUI` | 06-worklets-guide |
| `scheduleOnRN` | 06-worklets-guide |
| `FadeIn` / `FadeOut` / etc. | 08-layout-animations |
| `LinearTransition` / etc. | 08-layout-animations |
| `SharedTransition` | 08-layout-animations |

---

**Last Updated:** February 2026
**All content sourced from:** https://docs.swmansion.com/react-native-reanimated/
