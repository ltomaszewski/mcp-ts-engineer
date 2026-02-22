# Layout Animations: Entering, Exiting, Transitions, Keyframes

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/ | https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-transitions/

---

## Overview

Reanimated provides declarative layout animations via props on `Animated.View`:
- **`entering`** -- animation when component mounts
- **`exiting`** -- animation when component unmounts
- **`layout`** -- transition when component's layout changes

---

## Entering Animations

All entering animations are imported from `react-native-reanimated`.

### Fade

| Animation | Description |
|---|---|
| `FadeIn` | Fade from transparent |
| `FadeInRight` | Fade + slide from right |
| `FadeInLeft` | Fade + slide from left |
| `FadeInUp` | Fade + slide from above |
| `FadeInDown` | Fade + slide from below |

### Slide

| Animation | Description |
|---|---|
| `SlideInRight` | Slide in from right edge |
| `SlideInLeft` | Slide in from left edge |
| `SlideInUp` | Slide in from top edge |
| `SlideInDown` | Slide in from bottom edge |

### Zoom

| Animation | Description |
|---|---|
| `ZoomIn` | Scale up from center |
| `ZoomInDown` | Zoom + slide from below |
| `ZoomInUp` | Zoom + slide from above |
| `ZoomInLeft` | Zoom + slide from left |
| `ZoomInRight` | Zoom + slide from right |
| `ZoomInEasyDown` | Subtle zoom from below |
| `ZoomInEasyUp` | Subtle zoom from above |
| `ZoomInRotate` | Zoom with rotation |

### Bounce

| Animation | Description |
|---|---|
| `BounceIn` | Bounce scale from center |
| `BounceInRight` | Bounce from right |
| `BounceInLeft` | Bounce from left |
| `BounceInUp` | Bounce from above |
| `BounceInDown` | Bounce from below |

### Flip

| Animation | Description |
|---|---|
| `FlipInEasyX` | Flip on X axis (easy) |
| `FlipInEasyY` | Flip on Y axis (easy) |
| `FlipInXDown` | Flip X + slide down |
| `FlipInXUp` | Flip X + slide up |
| `FlipInYLeft` | Flip Y + slide left |
| `FlipInYRight` | Flip Y + slide right |

### Other

| Animation | Description |
|---|---|
| `LightSpeedInRight` | Fast slide from right with skew |
| `LightSpeedInLeft` | Fast slide from left with skew |
| `PinwheelIn` | Spin + scale in |
| `RollInRight` | Roll in from right |
| `RollInLeft` | Roll in from left |
| `RotateInDownLeft` | Rotate from bottom-left corner |
| `RotateInDownRight` | Rotate from bottom-right corner |
| `RotateInUpLeft` | Rotate from top-left corner |
| `RotateInUpRight` | Rotate from top-right corner |
| `StretchInX` | Stretch horizontally |
| `StretchInY` | Stretch vertically |

---

## Exiting Animations

Each entering animation has a corresponding exiting variant (replace `In` with `Out`):

`FadeOut`, `FadeOutRight`, `FadeOutLeft`, `FadeOutUp`, `FadeOutDown`, `SlideOutRight`, `SlideOutLeft`, `SlideOutUp`, `SlideOutDown`, `ZoomOut`, `ZoomOutDown`, `ZoomOutUp`, `ZoomOutLeft`, `ZoomOutRight`, `ZoomOutEasyDown`, `ZoomOutEasyUp`, `ZoomOutRotate`, `BounceOut`, `BounceOutRight`, `BounceOutLeft`, `BounceOutUp`, `BounceOutDown`, `FlipOutEasyX`, `FlipOutEasyY`, `FlipOutXDown`, `FlipOutXUp`, `FlipOutYLeft`, `FlipOutYRight`, `LightSpeedOutRight`, `LightSpeedOutLeft`, `PinwheelOut`, `RollOutRight`, `RollOutLeft`, `RotateOutDownLeft`, `RotateOutDownRight`, `RotateOutUpLeft`, `RotateOutUpRight`, `StretchOutX`, `StretchOutY`

---

## Modifier Methods

All entering/exiting animations support these chainable modifiers:

### Time-Based Modifiers

| Modifier | Default | Description |
|---|---|---|
| `.duration(ms)` | `300` | Animation length in milliseconds |
| `.easing(fn)` | `Easing.inOut(Easing.quad)` | Easing function for timing curve |
| `.delay(ms)` | `0` | Delay before animation starts |
| `.randomDelay()` | -- | Randomize delay between 0 and provided value |

### Spring-Based Modifiers

| Modifier | Default | Description |
|---|---|---|
| `.springify()` | -- | Switch to spring-based animation |
| `.damping(value)` | -- | Spring damping (after `.springify()`) |
| `.mass(value)` | -- | Spring mass (after `.springify()`) |
| `.stiffness(value)` | -- | Spring stiffness (after `.springify()`) |
| `.overshootClamping(bool)` | `false` | Prevent overshoot (after `.springify()`) |
| `.energyThreshold(value)` | -- | Energy threshold for rest (after `.springify()`) |

### Common Modifiers

| Modifier | Description |
|---|---|
| `.withInitialValues(styleProps)` | Override starting style values |
| `.withCallback((finished) => void)` | Fire callback on completion |
| `.reduceMotion(ReduceMotion)` | Accessibility: `System`, `Always`, `Never` |

---

## Basic Usage

```typescript
import Animated, { FadeIn, SlideOutLeft, BounceIn } from 'react-native-reanimated';

function AnimatedItem({ visible }: { visible: boolean }) {
  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(400).delay(200)}
      exiting={SlideOutLeft.duration(300)}
      style={styles.item}
    >
      <Text>Animated content</Text>
    </Animated.View>
  );
}
```

### Spring-Based Entering

```typescript
<Animated.View
  entering={BounceIn.springify().damping(8).stiffness(100)}
  exiting={FadeOut.duration(200)}
/>
```

### With Callback

```typescript
<Animated.View
  entering={ZoomIn.duration(500).withCallback((finished) => {
    'worklet';
    if (finished) {
      // Animation complete
    }
  })}
/>
```

### Staggered List

```typescript
function StaggeredList({ items }: { items: Item[] }) {
  return items.map((item, index) => (
    <Animated.View
      key={item.id}
      entering={FadeInDown.delay(index * 100).duration(400)}
      exiting={FadeOutUp.duration(200)}
    >
      <ItemCard item={item} />
    </Animated.View>
  ));
}
```

---

## Layout Transitions

Animate components when their position or size changes. Apply via the `layout` prop.

### Available Transitions

| Transition | Default Duration | Description |
|---|---|---|
| `LinearTransition` | 300ms | Uniform position + dimension animation |
| `SequencedTransition` | 500ms | Animates X/width first, then Y/height |
| `FadingTransition` | 500ms | Fades opacity during layout change |
| `JumpingTransition` | 300ms | Elements jump to new positions |
| `CurvedTransition` | 300ms | Curved movement with per-axis easing |
| `EntryExitTransition` | varies | Combines entering + exiting animations |

### LinearTransition

```typescript
import Animated, { LinearTransition } from 'react-native-reanimated';

function ReorderableList() {
  return items.map((item) => (
    <Animated.View
      key={item.id}
      layout={LinearTransition.duration(300)}
      style={styles.item}
    >
      <Text>{item.name}</Text>
    </Animated.View>
  ));
}
```

### LinearTransition Modifiers

- `.duration(ms)` -- default 300ms
- `.delay(ms)` -- default 0
- `.easing(fn)` -- default `Easing.inOut(Easing.quad)`
- `.springify()` + spring modifiers
- `.reduceMotion(ReduceMotion)`
- `.withCallback((finished) => void)`

### SequencedTransition

Animates X-position and width first, then Y-position and height.

```typescript
<Animated.View layout={SequencedTransition.duration(500).reverse()} />
```

Additional modifier: `.reverse()` -- animate Y/height first, then X/width.

### FadingTransition

Fades opacity while layout changes.

```typescript
<Animated.View layout={FadingTransition.duration(500)} />
```

### CurvedTransition

Per-axis easing functions for curved movement paths.

```typescript
import { CurvedTransition, Easing } from 'react-native-reanimated';

<Animated.View
  layout={CurvedTransition
    .duration(300)
    .easingX(Easing.out(Easing.cubic))
    .easingY(Easing.in(Easing.cubic))
    .easingWidth(Easing.linear)
    .easingHeight(Easing.linear)
  }
/>
```

### EntryExitTransition

Combines entering and exiting animations for layout changes.

```typescript
import { EntryExitTransition, FlipInEasyX, FlipOutEasyY } from 'react-native-reanimated';

<Animated.View
  layout={EntryExitTransition
    .entering(FlipInEasyX)
    .exiting(FlipOutEasyY)
  }
/>
```

Default: `FadeIn` entering, `FadeOut` exiting.

**Platform support:** Android, iOS, Web (all transitions).

---

## LayoutAnimationConfig Component

Selectively disable entering/exiting animations for children.

```typescript
import { LayoutAnimationConfig } from 'react-native-reanimated';

// Skip entering animations on mount
<LayoutAnimationConfig skipEntering>
  {show && <Animated.View entering={FadeIn} />}
</LayoutAnimationConfig>

// Skip both
<LayoutAnimationConfig skipEntering skipExiting>
  {/* children */}
</LayoutAnimationConfig>
```

Props:
- `skipEntering` -- skip children's entering animations
- `skipExiting` -- skip children's exiting animations

Can be nested for granular control. Not supported on web.

### FlatList Integration

```typescript
<Animated.FlatList
  skipEnteringExitingAnimations // Wraps with LayoutAnimationConfig
  data={data}
  renderItem={renderItem}
/>
```

---

## Custom Entering/Exiting Animations

Define fully custom animations using worklet functions.

```typescript
function CustomEntering(targetValues: EntryAnimationsValues) {
  'worklet';
  const animations = {
    opacity: withTiming(1, { duration: 500 }),
    transform: [
      { scale: withSpring(1) },
      { rotate: withTiming('0deg', { duration: 500 }) },
    ],
  };
  const initialValues = {
    opacity: 0,
    transform: [
      { scale: 0.5 },
      { rotate: '45deg' },
    ],
  };
  return { initialValues, animations };
}

<Animated.View entering={CustomEntering} />
```

### Available Values

**Entering (target values):** `targetOriginX`, `targetOriginY`, `targetWidth`, `targetHeight`, `targetBorderRadius`, `targetGlobalOriginX`, `targetGlobalOriginY`

**Exiting (current values):** `currentOriginX`, `currentOriginY`, `currentWidth`, `currentHeight`, `currentBorderRadius`, `currentGlobalOriginX`, `currentGlobalOriginY`

**Custom layout:** Both current and target values.

**Platform support:** Android, iOS. NOT supported on Web.

---

## Shared Element Transitions

Animate components between screens using matching tags.

```typescript
import Animated, { SharedTransition } from 'react-native-reanimated';

// Screen A
<Animated.View
  sharedTransitionTag="hero-image"
  style={styles.thumbnail}
/>

// Screen B
<Animated.View
  sharedTransitionTag="hero-image"
  style={styles.fullImage}
/>
```

### Custom Transition

```typescript
const transition = SharedTransition.duration(550).springify();

<Animated.View
  sharedTransitionTag="hero"
  sharedTransitionStyle={transition}
/>
```

### SharedTransition Methods

- `.duration(ms)` -- animation duration (default 500ms)
- `.springify()` -- spring-based animation
- `.progressAnimation()` -- progress-based (iOS gesture/back support)

### Limitations

- Only native stack navigator supported (no tabs)
- Requires react-native-screens 3.19+
- Not supported on Web
- Animates: width, height, position, transform, backgroundColor, opacity

---

## Cross-References

- **Core animations:** [04-animations-timing-spring.md](04-animations-timing-spring.md)
- **Modifiers (sequence, repeat):** [05-animations-modifiers.md](05-animations-modifiers.md)
- **Gestures:** [07-gestures-events.md](07-gestures-events.md)
- **Best practices:** [09-best-practices.md](09-best-practices.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/entering-exiting-animations/ | https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-transitions/ | https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/custom-animations/ | https://docs.swmansion.com/react-native-reanimated/docs/layout-animations/layout-animation-config/ | https://docs.swmansion.com/react-native-reanimated/docs/shared-element-transitions/overview/
