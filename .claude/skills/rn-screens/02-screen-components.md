# Screen Components

Screen, ScreenContainer, ScreenStack, ScreenStackItem, ScreenStackHeaderConfig, SearchBar, and FullWindowOverlay component APIs.

---

## Screen

Base container for a single navigation screen. Extends React Native `View` props.

### Key Props

| Prop | Type | Default | Platform | Description |
|------|------|---------|----------|-------------|
| `active` | `0 \| 1` | -- | All | Binary active/inactive state |
| `activityState` | `0 \| 1 \| 2` | -- | All | `0` = detached, `1` = attached no touch (iOS), `2` = fully active |
| `enabled` | `boolean` | `true` | All | Enable native rendering for this screen |
| `shouldFreeze` | `boolean` | -- | All | Override global freeze for this screen |
| `freezeOnBlur` | `boolean` | `false` | All | Freeze when screen loses focus |
| `stackPresentation` | `StackPresentationTypes` | `'push'` | All | How the screen is presented |
| `stackAnimation` | `StackAnimationTypes` | `'default'` | All | Transition animation type |
| `replaceAnimation` | `'push' \| 'pop'` | `'pop'` | All | Animation when replacing a screen |
| `gestureEnabled` | `boolean` | `true` | iOS | Enable swipe-back gesture |
| `fullScreenSwipeEnabled` | `boolean` | varies | iOS | Enable full-screen swipe gesture |
| `customAnimationOnSwipe` | `boolean` | `false` | iOS | Use stackAnimation during swipe dismiss |
| `preventNativeDismiss` | `boolean` | `false` | iOS | Prevent gesture/native dismissal |
| `screenOrientation` | `ScreenOrientationTypes` | `'default'` | All | Lock screen to orientation |
| `contentStyle` | `ViewStyle` | -- | All | Style for screen content container |

### Stack Presentation Types

```typescript
type StackPresentationTypes =
  | 'push'                       // Default stack push
  | 'modal'                      // Modal presentation
  | 'transparentModal'           // Modal with transparent background
  | 'containedModal'             // Contained modal (Android)
  | 'containedTransparentModal'  // Contained transparent modal
  | 'fullScreenModal'            // Full-screen modal
  | 'formSheet'                  // Sheet presentation with detents
  | 'pageSheet';                 // Page sheet (iOS)
```

### Stack Animation Types

```typescript
type StackAnimationTypes =
  | 'default'           // Platform default
  | 'fade'              // Cross-fade
  | 'fade_from_bottom'  // Fade sliding from bottom
  | 'flip'              // Card flip (iOS, requires modal)
  | 'none'              // No animation
  | 'simple_push'       // Push without header animation (iOS)
  | 'slide_from_bottom' // Slide up from bottom
  | 'slide_from_right'  // Slide in from right
  | 'slide_from_left'   // Slide in from left
  | 'ios_from_right'    // iOS-style push from right (Android)
  | 'ios_from_left';    // iOS-style push from left (Android)
```

---

## ScreenContainer

Manages multiple `Screen` children. Controls which screens are attached to the native view hierarchy based on `activityState`. Best suited for tab-style navigation where one screen is active at a time.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable native container behavior |
| `hasTwoStates` | `boolean` | -- | Optimize for two-state containers |
| `children` | `React.ReactNode` | -- | Must be `Screen` components |

### Usage Pattern (Tab Navigator)

```typescript
import { ScreenContainer, Screen } from 'react-native-screens';
import { View } from 'react-native';

function TabNavigator({ activeTab }: { activeTab: number }) {
  return (
    <ScreenContainer style={{ flex: 1 }}>
      <Screen activityState={activeTab === 0 ? 2 : 0}>
        <HomeTab />
      </Screen>
      <Screen activityState={activeTab === 1 ? 2 : 0}>
        <ProfileTab />
      </Screen>
      <Screen activityState={activeTab === 2 ? 2 : 0}>
        <SettingsTab />
      </Screen>
    </ScreenContainer>
  );
}
```

### activityState Values

| Value | Meaning | Touch Response | Native Hierarchy |
|-------|---------|----------------|-----------------|
| `0` | Detached | No | Removed from native view tree |
| `1` | Attached, no touch | No (iOS) | In native tree, non-interactive |
| `2` | Fully active | Yes | In native tree, fully interactive |

> Use `activityState={1}` during transitions to briefly show a screen without allowing interaction. Return to `0` or `2` after transition completes.

---

## ScreenStack

Platform-native stack container. Maps to `UINavigationController` on iOS and Fragment container on Android. Manages `ScreenStackItem` children and renders the last child as the active screen.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onFinishTransitioning` | `(e) => void` | -- | Called when stack transition completes |
| `children` | `React.ReactNode` | -- | Must be `ScreenStackItem` components |
| `goBackGesture` | `GoBackGesture` | -- | Custom back gesture direction |
| `screenEdgeGesture` | `boolean` | -- | Restrict gesture to screen edge |

### GoBackGesture Types

```typescript
type GoBackGesture =
  | 'swipeRight'          // Swipe from left edge
  | 'swipeLeft'           // Swipe from right edge
  | 'swipeUp'             // Swipe from bottom
  | 'swipeDown'           // Swipe from top
  | 'verticalSwipe'       // Up or down
  | 'horizontalSwipe'     // Left or right
  | 'twoDimensionalSwipe'; // Any direction
```

### Key Behaviors

- Ignores `activityState` -- always renders the last child as active
- Uses platform-default transition animations (customizable per screen)
- Manages native header lifecycle automatically
- Accepts all update types when exchanging the top element

### Usage Pattern (Stack Navigator)

```typescript
import { ScreenStack, ScreenStackItem } from 'react-native-screens';

function StackNavigator({ screens }: { screens: Screen[] }) {
  return (
    <ScreenStack style={{ flex: 1 }}>
      {screens.map((screen) => (
        <ScreenStackItem
          key={screen.key}
          stackAnimation="slide_from_right"
          onDismissed={() => handleDismiss(screen.key)}
        >
          {screen.component}
        </ScreenStackItem>
      ))}
    </ScreenStack>
  );
}
```

---

## ScreenStackItem

Convenience wrapper around `Screen` for use as direct children of `ScreenStack`. Handles header display, LogBox, and modal integration. Always use `ScreenStackItem` instead of raw `Screen` inside `ScreenStack`.

### Additional Props (beyond Screen props)

| Prop | Type | Default | Platform | Description |
|------|------|---------|----------|-------------|
| `onAppear` | `(e) => void` | -- | All | Screen appeared (transition complete) |
| `onDisappear` | `(e) => void` | -- | All | Screen disappeared |
| `onWillAppear` | `(e) => void` | -- | All | Transition to appear started |
| `onWillDisappear` | `(e) => void` | -- | All | Transition to disappear started |
| `onDismissed` | `(e) => void` | -- | All | Dismissed by gesture or hardware back |
| `onHeaderBackButtonClicked` | `() => void` | -- | Android | Native header back button pressed |
| `onNativeDismissCancelled` | `(e) => void` | -- | iOS | Dismissed then prevented |
| `onSheetDetentChanged` | `(e) => void` | -- | All | Sheet resting point changed |
| `onHeaderHeightChange` | `(e) => void` | -- | All | Header height changed |
| `onTransitionProgress` | `(e) => void` | -- | All | Transition progress updated |

### FormSheet Props (stackPresentation = 'formSheet')

| Prop | Type | Default | Platform | Description |
|------|------|---------|----------|-------------|
| `sheetAllowedDetents` | `number[] \| 'fitToContents' \| 'medium' \| 'large' \| 'all'` | `[1.0]` | All | Heights where sheet rests (fraction 0-1) |
| `sheetCornerRadius` | `number` | System default | iOS | Corner radius for sheet |
| `sheetGrabberVisible` | `boolean` | `false` | iOS | Show drag handle at top |
| `sheetExpandsWhenScrolledToEdge` | `boolean` | `true` | iOS | Expand sheet when scroll hits edge |
| `sheetLargestUndimmedDetentIndex` | `number \| 'none' \| 'last'` | `'none'` | All | Largest detent without background dimming |
| `sheetInitialDetentIndex` | `number \| 'last'` | -- | All | Starting detent index |
| `sheetElevation` | `number` | -- | Android | Sheet elevation shadow |
| `sheetShouldOverflowTopInset` | `boolean` | `false` | Android | Render behind status bar |
| `sheetDefaultResizeAnimationEnabled` | `boolean` | `true` | Android | Animate size changes |

### Gesture Props

| Prop | Type | Default | Platform | Description |
|------|------|---------|----------|-------------|
| `gestureEnabled` | `boolean` | `true` | iOS | Enable back swipe gesture |
| `fullScreenSwipeEnabled` | `boolean` | varies | iOS | Full-screen swipe (vs edge-only) |
| `fullScreenSwipeShadowEnabled` | `boolean` | `true` | iOS | Shadow during full-screen swipe |
| `gestureResponseDistance` | `GestureResponseDistanceType` | -- | iOS | Restrict gesture activation area |
| `hideKeyboardOnSwipe` | `boolean` | `false` | iOS | Dismiss keyboard during swipe |
| `nativeBackButtonDismissalEnabled` | `boolean` | `false` | Android | Let native handle back button |

### GestureResponseDistance

```typescript
type GestureResponseDistanceType = {
  start?: number;   // Distance from left edge (LTR)
  end?: number;     // Distance from right edge (LTR)
  top?: number;     // Distance from top edge
  bottom?: number;  // Distance from bottom edge
};
```

### Status Bar Props

| Prop | Type | Default | Platform | Description |
|------|------|---------|----------|-------------|
| `statusBarStyle` | `'light' \| 'dark' \| 'auto' \| 'inverted'` | -- | All | Status bar text color |
| `statusBarHidden` | `boolean` | `false` | All | Hide status bar |
| `statusBarAnimation` | `'none' \| 'fade' \| 'slide'` | -- | All | Status bar show/hide animation |
| `statusBarColor` | `ColorValue` | -- | Android | Status bar background (deprecated SDK 35+) |
| `statusBarTranslucent` | `boolean` | -- | Android | Translucent status bar (deprecated SDK 35+) |

### Navigation Bar Props (Android)

| Prop | Type | Default | Platform | Description |
|------|------|---------|----------|-------------|
| `navigationBarColor` | `ColorValue` | -- | Android | Nav bar background (deprecated SDK 35+) |
| `navigationBarHidden` | `boolean` | `false` | Android | Hide navigation bar |
| `navigationBarTranslucent` | `boolean` | -- | Android | Translucent nav bar (deprecated SDK 35+) |

---

## ScreenStackHeaderConfig

Configures the native header appearance for a screen in `ScreenStack`.

### Props

| Prop | Type | Default | Platform | Description |
|------|------|---------|----------|-------------|
| `title` | `string` | -- | All | Header title text |
| `titleColor` | `ColorValue` | -- | All | Title text color |
| `titleFontFamily` | `string` | -- | All | Title font family |
| `titleFontSize` | `number` | -- | All | Title font size |
| `titleFontWeight` | `string` | -- | All | Title font weight |
| `backgroundColor` | `ColorValue` | -- | All | Header background color |
| `color` | `ColorValue` | -- | All | Default tint color |
| `hidden` | `boolean` | `false` | All | Hide header entirely |
| `hideBackButton` | `boolean` | `false` | All | Hide back navigation button |
| `hideShadow` | `boolean` | `false` | All | Remove header bottom shadow |
| `translucent` | `boolean` | -- | All | Make header translucent |
| `largeTitle` | `boolean` | `false` | iOS | Enable large title (iOS 11+) |
| `largeTitleColor` | `ColorValue` | -- | iOS | Large title text color |
| `largeTitleFontFamily` | `string` | -- | iOS | Large title font family |
| `largeTitleFontSize` | `number` | -- | iOS | Large title font size |
| `largeTitleFontWeight` | `string` | -- | iOS | Large title font weight |
| `largeTitleBackgroundColor` | `ColorValue` | -- | All | Large title area background |
| `largeTitleHideShadow` | `boolean` | -- | All | Hide shadow below large title |
| `backTitle` | `string` | -- | iOS | Back button text |
| `backTitleFontFamily` | `string` | -- | iOS | Back button font family |
| `backTitleFontSize` | `number` | -- | iOS | Back button font size |
| `backTitleVisible` | `boolean` | -- | iOS | Show/hide back button text |
| `backButtonDisplayMode` | `'default' \| 'generic' \| 'minimal'` | -- | iOS | Back button display mode |
| `disableBackButtonMenu` | `boolean` | -- | iOS | Disable long-press back menu |
| `blurEffect` | `BlurEffectTypes` | -- | iOS | Header blur effect |
| `direction` | `'rtl' \| 'ltr'` | -- | All | Layout direction |
| `backButtonInCustomView` | `boolean` | -- | All | Back button inside custom view |

### Header Subview Components

Custom content in specific header positions:

```typescript
import {
  ScreenStackHeaderLeftView,
  ScreenStackHeaderCenterView,
  ScreenStackHeaderRightView,
  ScreenStackHeaderBackButtonImage,
  ScreenStackHeaderSearchBarView,
} from 'react-native-screens';
```

### Header Bar Button Items (iOS)

iOS supports rich header buttons with menus and badges:

```typescript
import type { HeaderBarButtonItem } from 'react-native-screens';

const headerRightItems: HeaderBarButtonItem[] = [
  {
    type: 'button',
    title: 'Save',
    variant: 'done',
    onPress: () => handleSave(),
  },
  {
    type: 'menu',
    title: 'More',
    icon: { type: 'sfSymbol', name: 'ellipsis.circle' },
    menu: {
      items: [
        {
          type: 'action',
          title: 'Share',
          icon: { type: 'sfSymbol', name: 'square.and.arrow.up' },
          onPress: () => handleShare(),
        },
        {
          type: 'action',
          title: 'Delete',
          destructive: true,
          onPress: () => handleDelete(),
        },
      ],
    },
  },
];
```

---

## SearchBar

Native search input rendered in the header. Available on iOS and Android.

### Props

| Prop | Type | Default | Platform | Description |
|------|------|---------|----------|-------------|
| `placeholder` | `string` | -- | All | Placeholder text |
| `autoCapitalize` | `'systemDefault' \| 'none' \| 'words' \| 'sentences' \| 'characters'` | `'systemDefault'` | All | Auto-capitalization behavior |
| `autoFocus` | `boolean` | -- | Android | Auto-focus on screen appear |
| `barTintColor` | `ColorValue` | -- | Android | Search field background color |
| `tintColor` | `ColorValue` | -- | iOS | Cursor and cancel button color |
| `cancelButtonText` | `string` | -- | iOS | Custom cancel button text (deprecated iOS 26+) |
| `textColor` | `ColorValue` | -- | All | Input text color |
| `hintTextColor` | `ColorValue` | -- | Android | Hint text color |
| `headerIconColor` | `ColorValue` | -- | Android | Search icon color |
| `hideNavigationBar` | `boolean` | -- | iOS | Hide nav bar while searching |
| `hideWhenScrolling` | `boolean` | -- | iOS | Hide search bar on scroll |
| `obscureBackground` | `boolean` | -- | iOS | Dim background while searching |
| `inputType` | `'text' \| 'phone' \| 'number' \| 'email'` | -- | Android | Keyboard type for search input |
| `disableBackButtonOverride` | `boolean` | -- | Android | Allow back button during search |
| `placement` | `SearchBarPlacement` | `'automatic'` | iOS 16+ | Search bar layout placement |
| `onChangeText` | `(e) => void` | -- | All | Text changed callback |
| `onFocus` | `(e) => void` | -- | All | Search bar focused |
| `onBlur` | `(e) => void` | -- | All | Search bar blurred |
| `onSearchButtonPress` | `(e) => void` | -- | All | Search/submit button pressed |
| `onCancelButtonPress` | `(e) => void` | -- | iOS | Cancel button pressed |
| `onOpen` | `() => void` | -- | Android | Search bar opened |
| `onClose` | `() => void` | -- | Android | Search bar closed |

### SearchBar Commands (Imperative)

```typescript
import { SearchBar } from 'react-native-screens';
import type { SearchBarCommands } from 'react-native-screens';

const searchRef = useRef<SearchBarCommands>(null);

// Available commands:
searchRef.current?.focus();
searchRef.current?.blur();
searchRef.current?.clearText();
searchRef.current?.setText('query');
searchRef.current?.toggleCancelButton(true);
searchRef.current?.cancelSearch();
```

### SearchBarPlacement Types

```typescript
type SearchBarPlacement =
  | 'automatic'          // System decides
  | 'inline'             // Inline with navigation bar
  | 'stacked'            // Below navigation bar title
  | 'integrated'         // Integrated into toolbar (iOS 26+)
  | 'integratedButton'   // Button that expands (iOS 26+)
  | 'integratedCentered'; // Centered integrated (iOS 26+)
```

---

## FullWindowOverlay

iOS-only component that renders its children directly under the application Window, above all other content including modals and native navigators.

### Usage

```typescript
import { FullWindowOverlay } from 'react-native-screens';
import { View, StyleSheet } from 'react-native';

function ToastOverlay({ message }: { message: string }) {
  return (
    <FullWindowOverlay>
      <View style={styles.toastContainer}>
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </FullWindowOverlay>
  );
}

const styles = StyleSheet.create({
  toastContainer: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 8,
    padding: 16,
  },
  toastText: {
    color: 'white',
    textAlign: 'center',
  },
});
```

### Rules

- iOS only -- renders nothing on Android
- Accepts a single `View` child as the hierarchy root
- Child is rendered at the Window level, above all navigation controllers
- Useful for toasts, tooltips, and custom overlays that must appear above modals
- The child must handle its own positioning (typically with `position: 'absolute'`)

---

## ScreenFooter

Footer component that sticks to the bottom of a screen, remaining visible during sheet presentation and keyboard appearances.

```typescript
import { ScreenFooter } from 'react-native-screens';

function ScreenWithFooter() {
  return (
    <>
      <ScrollView>{/* content */}</ScrollView>
      <ScreenFooter>
        <View style={styles.footer}>
          <Button title="Submit" onPress={handleSubmit} />
        </View>
      </ScreenFooter>
    </>
  );
}
```

---

## ScreenContentWrapper

Wraps the main content area of a screen. Used internally by navigation libraries to properly size content within native screen containers.

```typescript
import { ScreenContentWrapper } from 'react-native-screens';

// Typically used by library authors, not app developers
<ScreenContentWrapper style={{ flex: 1 }}>
  {children}
</ScreenContentWrapper>
```

---

**Source:** https://github.com/software-mansion/react-native-screens | **Version:** 4.x (^4.23.0)
