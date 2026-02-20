# Animations: withTiming & withSpring

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/customizing-animation/  
**Version:** 4.2.1  
**Category:** Animation Functions | Core Hooks

---

## 📋 Overview

Reanimated provides two fundamental animation functions:

1. **`withTiming`** — Duration-based animations (frame-rate independent, easing-driven)
2. **`withSpring`** — Physics-based animations (natural spring motion)

Both support configuration objects and can be combined with `withSequence`, `withRepeat`, and callbacks.

---

## ⏱️ withTiming Animation

### API Reference

**Signature:**
```typescript
function withTiming(
  targetValue: number,
  config?: WithTimingConfig,
  callback?: (finished: boolean) => void
): AnimationObject;

interface WithTimingConfig {
  duration?: number;        // milliseconds (default: 300)
  easing?: EasingFn;       // easing function (default: inOut(quad))
}
```

**Description:** Animates a shared value to a target over a specified duration using an easing function.

---

### Configuration: Duration

Controls animation length in **milliseconds**.

**Parameters:**

| Property | Type | Default | Range | Description |
|---|---|---|---|---|
| `duration` | `number` | `300` | 0 - ∞ | Animation duration in milliseconds |

**Example:**

```javascript
import { withTiming, useSharedValue } from 'react-native-reanimated';

const opacity = useSharedValue(1);

// Animate over 500ms
opacity.value = withTiming(0, { duration: 500 });

// Quick animation (200ms)
opacity.value = withTiming(1, { duration: 200 });

// Slow animation (2 seconds)
opacity.value = withTiming(0.5, { duration: 2000 });
```

---

### Configuration: Easing Functions

Easing functions define **velocity curve** over time. Reanimated provides a built-in `Easing` module.

**Default:** `Easing.inOut(Easing.quad)` — smooth start, middle speed, smooth end

#### Common Easing Functions

| Function | Behavior | Use Case |
|---|---|---|
| `linear` | Constant velocity | Rotations, looping animations |
| `quad` | Quadratic curve | General purpose (default) |
| `cubic` | Cubic curve | Smoother than quad |
| `sin` | Sine wave | Natural, organic motion |
| `exp` | Exponential | Fast acceleration |

#### Easing Modifiers

| Modifier | Effect |
|---|---|
| `in()` | Slow start, fast finish |
| `out()` | Fast start, slow finish |
| `inOut()` | Slow start, slow finish (default) |

**Example:**

```javascript
import { Easing, withTiming, useSharedValue } from 'react-native-reanimated';

const rotation = useSharedValue(0);

// Linear rotation (constant speed)
rotation.value = withTiming(360, {
  duration: 1000,
  easing: Easing.linear,
});

// Smooth cubic easing (in-out)
rotation.value = withTiming(360, {
  duration: 1000,
  easing: Easing.inOut(Easing.cubic),
});

// Fast start, slow finish (out)
rotation.value = withTiming(100, {
  duration: 500,
  easing: Easing.out(Easing.exp),
});

// Sine wave (organic motion)
rotation.value = withTiming(180, {
  duration: 800,
  easing: Easing.sin,
});
```

#### Pre-defined Easing Shortcuts

```javascript
Easing.linear        // Linear motion
Easing.quad          // Quadratic (default base)
Easing.cubic         // Cubic (smoother)
Easing.sin           // Sine (natural)
Easing.exp           // Exponential (dramatic)

// With modifiers
Easing.in(Easing.quad)     // Slow start
Easing.out(Easing.quad)    // Slow finish
Easing.inOut(Easing.quad)  // Default
```

---

### Callbacks

Execute a function when animation completes.

**Signature:**
```typescript
withTiming(
  targetValue,
  config,
  (finished: boolean) => void  // finished = true when animation completes naturally
)
```

**Example:**

```javascript
const opacity = useSharedValue(1);

opacity.value = withTiming(0, { duration: 500 }, (finished) => {
  if (finished) {
    console.log('Animation completed!');
    // Trigger side effects: update React state, log analytics, etc.
  }
});
```

---

## 🎯 withSpring Animation

### API Reference

**Signature:**
```typescript
function withSpring(
  targetValue: number,
  config?: WithSpringConfig,
  callback?: (finished: boolean) => void
): AnimationObject;

interface WithSpringConfig {
  mass?: number;                    // default: 1
  damping?: number;                 // default: 10
  stiffness?: number;               // default: 100
  overshootClamping?: boolean;      // default: false
  restSpeedThreshold?: number;      // default: 10
  restDisplacementThreshold?: number; // default: 10
}
```

**Description:** Physics-based animation simulating a real spring. Creates natural, bouncy motion.

---

### Configuration: Mass

Controls **inertia** — how hard it is to move and stop the object.

| Property | Type | Default | Effect |
|---|---|---|---|
| `mass` | `number` | `1` | Higher = sluggish, bouncy; Lower = responsive |

**Visual Effect:**
```javascript
withSpring(targetValue, { mass: 0.5 })  // Lightweight, quick response
withSpring(targetValue, { mass: 1 })    // Normal (default)
withSpring(targetValue, { mass: 2 })    // Heavy, slow to move/stop
```

**Example:**

```javascript
import { withSpring, useSharedValue } from 'react-native-reanimated';

const scale = useSharedValue(1);

// Light spring (responsive)
scale.value = withSpring(1.2, { mass: 0.5 });

// Heavy spring (sluggish)
scale.value = withSpring(1.2, { mass: 3 });
```

---

### Configuration: Stiffness (Tension)

Controls **bounciness** — how much the spring oscillates.

| Property | Type | Default | Effect |
|---|---|---|---|
| `stiffness` | `number` | `100` | Higher = tighter spring; Lower = loose spring |

**Visual Effect:**
```javascript
withSpring(targetValue, { stiffness: 50 })   // Loose, stretchy spring
withSpring(targetValue, { stiffness: 100 })  // Normal (default)
withSpring(targetValue, { stiffness: 200 })  // Tight steel spring
```

**Analogy:**
- **Low stiffness (50):** Rubber band
- **Normal stiffness (100):** Steel spring
- **High stiffness (200):** Very tight coil

---

### Configuration: Damping (Friction)

Controls **resistance** — how quickly oscillation dampens and the spring comes to rest.

| Property | Type | Default | Effect |
|---|---|---|---|
| `damping` | `number` | `10` | Higher = faster settling; Lower = more bouncing |

**Visual Effect:**
```javascript
withSpring(targetValue, { damping: 5 })   // Low friction, many bounces
withSpring(targetValue, { damping: 10 })  // Normal (default)
withSpring(targetValue, { damping: 20 })  // High friction, quick settle
```

**Real-World Analogy:**
- **Low damping (5):** Spring bouncing in air
- **Normal damping (10):** Spring in normal environment
- **High damping (20):** Spring moving through thick oil

---

### Complete Spring Configuration Example

```javascript
const position = useSharedValue(0);

position.value = withSpring(100, {
  mass: 1,              // Normal weight
  stiffness: 100,       // Typical bounciness
  damping: 10,          // Standard friction
  overshootClamping: false,  // Allow overshoot
  restSpeedThreshold: 10,     // Velocity threshold for "at rest"
  restDisplacementThreshold: 10, // Distance threshold for "at rest"
});
```

---

### Advanced Config: Overshoot Clamping

Prevents the spring from overshooting the target value.

```javascript
// With overshoot (default)
withSpring(100, { overshootClamping: false })  // May exceed 100, bounce back

// Clamped (no overshoot)
withSpring(100, { overshootClamping: true })   // Stops at exactly 100, no bounce
```

---

## 🔗 Combining with withSequence

Chain multiple animations in sequence.

**Example:**

```javascript
import { 
  withTiming, 
  withSpring, 
  withSequence, 
  useSharedValue,
  Easing 
} from 'react-native-reanimated';

function ButtonPress() {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      // First: Scale down quickly
      withTiming(0.9, { duration: 100, easing: Easing.in(Easing.quad) }),
      // Then: Scale back up with spring
      withSpring(1, { stiffness: 150, damping: 10 })
    );
  };

  return null;
}
```

---

## 🔁 Combining with withRepeat

Loop an animation indefinitely or N times.

**Example:**

```javascript
import { 
  withTiming, 
  withRepeat, 
  useSharedValue,
  Easing 
} from 'react-native-reanimated';

function PulseAnimation() {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.5, { duration: 500, easing: Easing.inOut(Easing.quad) }),
      -1,    // -1 = infinite repeat
      true   // reverse = true for pulse effect
    );
  }, []);

  return null;
}
```

---

## 📊 Comparison: withTiming vs withSpring

| Aspect | `withTiming` | `withSpring` |
|---|---|---|
| **Type** | Duration-based | Physics-based |
| **Predictability** | Exact duration | Variable (depends on physics) |
| **Feel** | Mechanical | Natural, organic |
| **Easing** | Full control | Determined by mass/stiffness/damping |
| **Best For** | UI transitions, fades | Button presses, interactions |
| **Performance** | Slightly faster | Slightly slower (physics calc) |
| **Overshoot** | Can't overshoot | Bounces naturally |
| **Config** | `duration`, `easing` | `mass`, `stiffness`, `damping` |

---

## 🎨 Common Patterns

### Fade In/Out

```javascript
const opacity = useSharedValue(0);

// Fade in
opacity.value = withTiming(1, { duration: 300 });

// Fade out
opacity.value = withTiming(0, { duration: 300 });
```

### Scale Animation

```javascript
const scale = useSharedValue(1);

// Pop-in with spring
scale.value = withSpring(1, { stiffness: 150 });

// Smooth scale transition
scale.value = withTiming(0.8, { duration: 400 });
```

### Slide Animation

```javascript
const translateX = useSharedValue(0);

// Slide with timing
translateX.value = withTiming(100, {
  duration: 500,
  easing: Easing.inOut(Easing.cubic),
});

// Slide with spring
translateX.value = withSpring(100);
```

---

## ⚠️ Best Practices

1. **Choose timing for UI:** `withTiming` for fade, scale transitions
2. **Choose spring for interaction:** `withSpring` for button presses, draggable objects
3. **Adjust duration for context:** Shorter (200-300ms) for small elements, longer for modal transitions
4. **Test easing visually:** Use playgrounds, don't rely on numbers alone
5. **Avoid too much damping:** Can make animations feel laggy

---

## 🔗 Cross-References

- **Modifiers:** See [05-animations-modifiers.md](./05-animations-modifiers.md) for `withSequence`, `withRepeat`, `withDecay`
- **useAnimatedStyle:** See [03-core-animated-style.md](./03-core-animated-style.md) to apply animations to styles
- **Gestures:** See [07-gestures-events.md](./07-gestures-events.md) for gesture-driven animations
- **Best Practices:** See [09-best-practices.md](./09-best-practices.md) for performance optimization

---

## 📚 Official Documentation

- **withTiming API:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/
- **withSpring API:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/
- **Easing Module:** https://docs.swmansion.com/react-native-reanimated/docs/animations/easing/
- **Customizing Animations:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/customizing-animation/

---

**Last Updated:** December 2024  
**Verified For:** Reanimated 4.2.1
