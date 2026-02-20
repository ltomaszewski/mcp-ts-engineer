# Keyboard Controller: iOS Configuration

**Podfile, ProMotion, safe area integration**

---

## Podfile Setup

### Basic Configuration
```ruby
# ios/Podfile
platform :ios, '12.4'

target 'YourAppName' do
  pod 'react-native-keyboard-controller', :path => '../node_modules/react-native-keyboard-controller'
end
```

### Installation
```bash
cd ios
pod install
cd ..
```

---

## ProMotion (120 FPS) Support

Enable 120Hz animations on iPhone 13 Pro+.

### Info.plist
```xml
<!-- ios/YourApp/Info.plist -->
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```

### Impact
- Without: Smooth 60 FPS
- With: Double-smooth 120 FPS on ProMotion devices
- Performance cost: Minimal

---

## Safe Area Integration

### With Keyboard Animation
```typescript
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

function SafeBottomContent() {
  const { height } = useReanimatedKeyboardAnimation();
  const insets = useSafeAreaInsets();

  const animatedStyle = useAnimatedStyle(() => ({
    paddingBottom: height.value + insets.bottom,
  }));

  return (
    <Animated.View style={animatedStyle}>
      {/* Content */}
    </Animated.View>
  );
}
```

---

## Interactive Dismiss

iOS supports swipe-to-dismiss with ScrollView:

```typescript
<ScrollView keyboardDismissMode="interactive">
  {/* Content - swipe to dismiss */}
</ScrollView>
```

---

## Keyboard Events

### Detect Keyboard State
```typescript
import { useKeyboardHandler } from 'react-native-keyboard-controller';

function useKeyboardState() {
  const [isVisible, setIsVisible] = useState(false);

  useKeyboardHandler({
    onStart: (e) => {
      'worklet';
      // e.progress === 1 means opening
      runOnJS(setIsVisible)(e.progress === 1);
    },
  }, []);

  return isVisible;
}
```

---

## Platform Requirements

- **Minimum iOS**: 12.4+
- **Xcode**: Latest stable
- **CocoaPods**: Required

---

**See Also**: [Setup](01-setup.md) | [Android Config](07-android-config.md)
