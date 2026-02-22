# 05 -- API Reference: Device Access (Camera, ImagePicker, Location, Sensors)

Camera capture, photo selection, GPS location, geocoding, and motion sensor APIs with per-module permission handling for Expo SDK 54.

---

## Permission Pattern

The standalone `expo-permissions` package is deprecated in SDK 54. Each module provides its own permission hooks and methods.

### Universal Pattern

```typescript
// 1. Check existing permission
const { status: existing } = await Module.getPermissionsAsync();

// 2. Request if not granted
if (existing !== 'granted') {
  const { status } = await Module.requestPermissionsAsync();
  if (status !== 'granted') {
    // Handle denial gracefully
    return null;
  }
}

// 3. Use the feature
const result = await Module.doSomething();
```

### Per-Module Permission Methods

| Module | Check | Request | Hook |
|--------|-------|---------|------|
| `expo-camera` | `getCameraPermissionsAsync()` | `requestCameraPermissionsAsync()` | `useCameraPermissions()` |
| `expo-image-picker` | `getMediaLibraryPermissionsAsync()` | `requestMediaLibraryPermissionsAsync()` | -- |
| `expo-location` | `getForegroundPermissionsAsync()` | `requestForegroundPermissionsAsync()` | -- |
| `expo-location` (bg) | `getBackgroundPermissionsAsync()` | `requestBackgroundPermissionsAsync()` | -- |
| `expo-notifications` | `getPermissionsAsync()` | `requestPermissionsAsync()` | -- |
| `expo-contacts` | `getPermissionsAsync()` | `requestPermissionsAsync()` | -- |
| `expo-calendar` | `getCalendarPermissionsAsync()` | `requestCalendarPermissionsAsync()` | -- |

### Permission Status Values

| Status | Meaning |
|--------|---------|
| `'granted'` | User allowed access |
| `'denied'` | User denied; can request again on Android, cannot on iOS |
| `'undetermined'` | User has not been asked yet |

When denied on iOS, direct user to Settings via `Linking.openSettings()`.

**Source:** https://docs.expo.dev/guides/permissions/

---

## Camera

### Installation

```bash
npx expo install expo-camera
```

### App.json Plugin

```json
{
  "plugins": [
    ["expo-camera", {
      "cameraPermission": "Allow $(PRODUCT_NAME) to access your camera",
      "microphonePermission": "Allow $(PRODUCT_NAME) to access your microphone",
      "recordAudioAndroid": true
    }]
  ]
}
```

### CameraView Component

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRef, useState } from 'react';
import { Button, Image, View } from 'react-native';

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  if (!permission) return <View />;

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Button onPress={requestPermission} title="Grant camera access" />
      </View>
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      const result = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
        exif: false,
      });
      if (result) setPhoto(result.uri);
    }
  };

  if (photo) {
    return (
      <View style={{ flex: 1 }}>
        <Image source={{ uri: photo }} style={{ flex: 1 }} />
        <Button title="Retake" onPress={() => setPhoto(null)} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <CameraView ref={cameraRef} style={{ flex: 1 }} facing="back" />
      <Button title="Take Photo" onPress={takePhoto} />
    </View>
  );
}
```

### CameraView Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `facing` | `'front' \| 'back'` | `'back'` | Camera direction |
| `flash` | `'on' \| 'off' \| 'auto'` | `'off'` | Flash mode |
| `zoom` | `number` | `0` | Zoom level (0-1) |
| `enableTorch` | `boolean` | `false` | Enable flashlight |
| `mode` | `'picture' \| 'video'` | `'picture'` | Capture mode |
| `barcodeScannerSettings` | `object` | -- | Barcode types to scan |
| `onBarcodeScanned` | `function` | -- | Callback when barcode detected |

### takePictureAsync Options

| Option | Type | Description |
|--------|------|-------------|
| `quality` | `0-1` | JPEG compression quality |
| `base64` | `boolean` | Include base64-encoded image |
| `exif` | `boolean` | Include EXIF metadata |
| `skipProcessing` | `boolean` | Skip image processing for speed |

**Source:** https://docs.expo.dev/versions/latest/sdk/camera/

---

## ImagePicker

### Installation

```bash
npx expo install expo-image-picker
```

### Methods

#### `launchImageLibraryAsync(options?)`

Open device photo library for selection.

| Option | Type | Description |
|--------|------|-------------|
| `mediaTypes` | `MediaType[]` | `['images']`, `['videos']`, or `['images', 'videos']` |
| `allowsEditing` | `boolean` | Show crop/rotate interface |
| `aspect` | `[number, number]` | Aspect ratio for crop (e.g., `[4, 3]`) |
| `quality` | `0-1` | Compression quality |
| `base64` | `boolean` | Include base64-encoded image |
| `exif` | `boolean` | Include EXIF metadata |
| `allowsMultipleSelection` | `boolean` | Allow selecting multiple images |
| `selectionLimit` | `number` | Max images when multi-select (0 = unlimited) |

**Return:** `Promise<ImagePickerResult>`

#### `launchCameraAsync(options?)`

Open camera for direct capture. Same options as `launchImageLibraryAsync`.

**Return:** `Promise<ImagePickerResult>`

### ImagePickerResult

```typescript
interface ImagePickerResult {
  canceled: boolean;
  assets: ImagePickerAsset[] | null;
}

interface ImagePickerAsset {
  uri: string;
  width: number;
  height: number;
  type?: 'image' | 'video';
  fileName?: string;
  fileSize?: number;
  base64?: string;
  exif?: Record<string, unknown>;
  duration?: number; // Video duration in ms
}
```

### Usage Example

```typescript
import * as ImagePicker from 'expo-image-picker';

async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Photo library access required');
    return null;
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (!result.canceled && result.assets.length > 0) {
    return result.assets[0].uri;
  }
  return null;
}

// Multiple image selection
async function pickMultipleImages(): Promise<string[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: 5,
    quality: 0.7,
  });

  if (!result.canceled) {
    return result.assets.map((asset) => asset.uri);
  }
  return [];
}
```

**Source:** https://docs.expo.dev/versions/latest/sdk/imagepicker/

---

## Location

### Installation

```bash
npx expo install expo-location
```

### App.json Plugin

```json
{
  "plugins": [
    ["expo-location", {
      "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location",
      "locationAlwaysPermission": "Allow $(PRODUCT_NAME) to use your location in the background",
      "locationWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location"
    }]
  ]
}
```

### Core Methods

#### `getCurrentPositionAsync(options?)`

Get device location once.

| Option | Type | Description |
|--------|------|-------------|
| `accuracy` | `Location.Accuracy` | `Lowest`, `Low`, `Balanced`, `High`, `Highest`, `BestForNavigation` |
| `timeout` | `number` | Max milliseconds to wait |

**Return:** `Promise<LocationObject>`

#### `watchPositionAsync(options, callback)`

Subscribe to continuous location updates.

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | `LocationOptions` | Same as `getCurrentPositionAsync` plus `timeInterval`, `distanceInterval` |
| `callback` | `(location: LocationObject) => void` | Called on each update |

**Return:** `Promise<LocationSubscription>` -- call `.remove()` to unsubscribe

#### `geocodeAsync(address)`

Convert address string to coordinates.

**Return:** `Promise<GeocodedLocation[]>`

#### `reverseGeocodeAsync(location)`

Convert `{ latitude, longitude }` to address.

**Return:** `Promise<LocationGeocodedAddress[]>`

### Types

```typescript
interface LocationObject {
  coords: {
    latitude: number;
    longitude: number;
    altitude: number | null;
    accuracy: number | null;
    heading: number | null;
    speed: number | null;
  };
  timestamp: number;
}

interface LocationGeocodedAddress {
  city: string | null;
  street: string | null;
  region: string | null;
  country: string | null;
  postalCode: string | null;
  name: string | null;
  subregion: string | null;
}

enum Accuracy {
  Lowest = 1,
  Low = 2,
  Balanced = 3,
  High = 4,
  Highest = 5,
  BestForNavigation = 6,
}
```

### Usage Example

```typescript
import * as Location from 'expo-location';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

export function LocationScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [address, setAddress] = useState<string>('');

  useEffect(() => {
    let subscription: Location.LocationSubscription | null = null;

    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      // Get initial position
      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(current);

      // Reverse geocode
      const [addr] = await Location.reverseGeocodeAsync({
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      });
      if (addr) {
        setAddress(`${addr.street}, ${addr.city}`);
      }

      // Watch for updates
      subscription = await Location.watchPositionAsync(
        { accuracy: Location.Accuracy.Balanced, distanceInterval: 10 },
        (loc) => setLocation(loc)
      );
    })();

    return () => { subscription?.remove(); };
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {location && (
        <>
          <Text>Lat: {location.coords.latitude.toFixed(6)}</Text>
          <Text>Lon: {location.coords.longitude.toFixed(6)}</Text>
          <Text>Address: {address}</Text>
        </>
      )}
    </View>
  );
}
```

**Source:** https://docs.expo.dev/versions/latest/sdk/location/

---

## Sensors

### Installation

```bash
npx expo install expo-sensors
```

### Available Sensors

| Sensor | Import | Data | Use Case |
|--------|--------|------|----------|
| `Accelerometer` | `expo-sensors` | `{ x, y, z }` | Motion detection, shake |
| `Gyroscope` | `expo-sensors` | `{ x, y, z }` | Rotation rate |
| `Magnetometer` | `expo-sensors` | `{ x, y, z }` | Compass heading |
| `Barometer` | `expo-sensors` | `{ pressure, relativeAltitude }` | Altitude changes |
| `DeviceMotion` | `expo-sensors` | Combined sensor data | Complex motion tracking |
| `Pedometer` | `expo-sensors` | `{ steps }` | Step counting |
| `LightSensor` | `expo-sensors` | `{ illuminance }` | Ambient light (Android) |

### Common Sensor API

Each sensor follows the same interface:

| Method | Description |
|--------|-------------|
| `addListener(callback)` | Subscribe to updates; returns `Subscription` with `.remove()` |
| `setUpdateInterval(ms)` | Set update frequency in milliseconds |
| `isAvailableAsync()` | Check if sensor is available on device |
| `hasListeners()` | Check if any active subscriptions |
| `removeAllListeners()` | Remove all subscriptions |

### Usage Example

```typescript
import { Accelerometer, Gyroscope } from 'expo-sensors';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';

interface SensorData {
  x: number;
  y: number;
  z: number;
}

export function SensorScreen() {
  const [accel, setAccel] = useState<SensorData>({ x: 0, y: 0, z: 0 });
  const [gyro, setGyro] = useState<SensorData>({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    Accelerometer.setUpdateInterval(200);
    Gyroscope.setUpdateInterval(200);

    const accelSub = Accelerometer.addListener(setAccel);
    const gyroSub = Gyroscope.addListener(setGyro);

    return () => {
      accelSub.remove();
      gyroSub.remove();
    };
  }, []);

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontWeight: 'bold' }}>Accelerometer</Text>
      <Text>X: {accel.x.toFixed(3)}</Text>
      <Text>Y: {accel.y.toFixed(3)}</Text>
      <Text>Z: {accel.z.toFixed(3)}</Text>

      <Text style={{ fontWeight: 'bold', marginTop: 20 }}>Gyroscope</Text>
      <Text>X: {gyro.x.toFixed(3)}</Text>
      <Text>Y: {gyro.y.toFixed(3)}</Text>
      <Text>Z: {gyro.z.toFixed(3)}</Text>
    </View>
  );
}
```

**Source:** https://docs.expo.dev/versions/latest/sdk/accelerometer/

---

## Best Practices

**ALWAYS:**
- Request permission before accessing any device feature
- Use appropriate accuracy levels (lower = better battery life)
- Unsubscribe from sensor/location listeners in cleanup functions
- Handle permission denial gracefully with fallback UI
- Show loading states during async operations (GPS lock, photo capture)

**NEVER:**
- Access device features without checking permission status first
- Use `Accuracy.BestForNavigation` unless building a navigation app
- Leave sensor subscriptions running when component unmounts
- Assume all devices have all sensors (check `isAvailableAsync()`)
- Store raw GPS coordinates indefinitely without user consent

---

**Version:** Expo SDK 54 (~54.0.33) | React Native 0.81.5 | React 19.1.0 | **Source:** https://docs.expo.dev/versions/latest/sdk/camera/, https://docs.expo.dev/versions/latest/sdk/imagepicker/, https://docs.expo.dev/versions/latest/sdk/location/, https://docs.expo.dev/versions/latest/sdk/accelerometer/
