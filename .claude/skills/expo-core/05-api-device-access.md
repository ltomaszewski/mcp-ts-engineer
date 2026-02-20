# 05 — API Reference: Device Access & Hardware

**Module Summary**: Device capability APIs: Camera and ImagePicker for photography, Location for geolocation, Maps for displaying locations, Permissions for requesting user consent, and Sensors for device hardware (accelerometer, gyroscope, compass). Includes typed parameters and production patterns.

---

## Overview

Expo SDK modules for accessing device hardware:

| Module | Capability | Platforms | Use Case |
|--------|-----------|-----------|----------|
| **Camera** | Photo/video capture | iOS, Android | In-app camera |
| **ImagePicker** | Select from library | iOS, Android, Web | User uploads |
| **Location** | GPS coordinates, geocoding | iOS, Android, Web | Maps, navigation |
| **Maps** | Display maps (Google/Apple) | iOS, Android | Location display |
| **Permissions** | Request user consent | iOS, Android | All sensitive access |
| **Sensors** | Accelerometer, gyroscope, compass | iOS, Android | Motion detection |

All device access requires **explicit user permission**.

**Source**: https://docs.expo.dev/versions/latest/sdk/

---

## Permissions

### Installation

```bash
npx expo install expo-permissions
```

### Key Methods

#### Method: `requestPermissionsAsync(types: PermissionType[])`

**Description**: Request one or more permissions from user.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `types` | PermissionType[] | Array of permissions (e.g., `[Permissions.CAMERA, Permissions.LOCATION]`) |

**Return Type**: `Promise<PermissionResponse>` — User's response for each permission

**Code Example**:

```typescript
import { requestPermissionsAsync, CAMERA, LOCATION } from 'expo-permissions';

const result = await requestPermissionsAsync([CAMERA, LOCATION]);
// Result: { status: 'granted' | 'denied' | 'undetermined' }

if (result.status !== 'granted') {
  alert('Permission denied');
}
```

#### Method: `getPermissionsAsync(type: PermissionType)`

**Description**: Check current permission status without requesting.

**Return Type**: `Promise<PermissionResponse>`

**Code Example**:

```typescript
const { status } = await getPermissionsAsync(CAMERA);
if (status === 'granted') {
  // User has permission
} else if (status === 'denied') {
  // User rejected
} else {
  // Never asked
}
```

### Common Permissions

```typescript
import * as Permissions from 'expo-permissions';

// Check and request camera
const { status } = await Permissions.requestPermissionsAsync(
  Permissions.CAMERA
);

// Audio recording
await Permissions.requestPermissionsAsync(Permissions.AUDIO_RECORDING);

// Location
await Permissions.requestPermissionsAsync(Permissions.LOCATION);

// Photos
await Permissions.requestPermissionsAsync(Permissions.MEDIA_LIBRARY);

// Calendar
await Permissions.requestPermissionsAsync(Permissions.CALENDAR);

// Contacts
await Permissions.requestPermissionsAsync(Permissions.CONTACTS);
```

**See**: app.json plugins for declarative permission configuration.

**Source**: https://docs.expo.dev/versions/latest/sdk/permissions/

---

## Camera & ImagePicker

### Installation

```bash
npx expo install expo-camera expo-image-picker
```

### Camera API

#### Method: `useCameraPermissions()`

**Description**: React hook for camera permission management.

**Return Type**: `[status, requestPermission]`

**Code Example**:

```typescript
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Button, View } from 'react-native';

export function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [photo, setPhoto] = useState<string | null>(null);
  const cameraRef = useRef(null);

  if (!permission) {
    return <View />;
  }

  if (!permission.granted) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Button 
          onPress={requestPermission} 
          title="Grant camera access" 
        />
      </View>
    );
  }

  const takePhoto = async () => {
    if (cameraRef.current) {
      const photoData = await cameraRef.current.takePictureAsync({
        quality: 1,
        base64: true,
        exif: false,
      });
      setPhoto(photoData.uri);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      <CameraView 
        ref={cameraRef} 
        style={{ flex: 1 }} 
        facing="back"
      />
      <Button title="Take Photo" onPress={takePhoto} />
    </View>
  );
}
```

### ImagePicker API

#### Method: `launchImageLibraryAsync(options?: ImagePickerOptions)`

**Description**: Open device photo library for user selection.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `mediaTypes` | `MediaTypeOptions` | `IMAGES`, `VIDEOS`, or `ALL` |
| `allowsEditing` | boolean | Show crop/rotate interface |
| `aspect` | [width, height] | Aspect ratio for crop (e.g., `[4, 3]`) |
| `quality` | 0-1 | Compression quality |
| `base64` | boolean | Include base64-encoded image |
| `exif` | boolean | Include EXIF metadata |

**Return Type**: `Promise<ImagePickerResult>`

**Code Example**:

```typescript
import * as ImagePicker from 'expo-image-picker';

const result = await ImagePicker.launchImageLibraryAsync({
  mediaTypes: ImagePicker.MediaTypeOptions.IMAGES,
  allowsEditing: true,
  aspect: [4, 3],
  quality: 0.9,
  base64: false,
});

if (!result.canceled) {
  const { uri, width, height, base64 } = result.assets[0];
  console.log('Selected image:', uri);
  // Upload or process image
}
```

#### Method: `launchCameraAsync(options?: ImagePickerOptions)`

**Description**: Open camera for direct photo capture.

**Return Type**: `Promise<ImagePickerResult>`

**Code Example**:

```typescript
const result = await ImagePicker.launchCameraAsync({
  allowsEditing: true,
  quality: 0.8,
});

if (!result.canceled) {
  // Process captured photo
}
```

---

## Location & Geolocation

### Installation

```bash
npx expo install expo-location
```

### Core Methods

#### Method: `getCurrentPositionAsync(options?: LocationOptions)`

**Description**: Get current device location once.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `accuracy` | Accuracy enum | `High`, `Balanced`, `Low`, `Lowest` |
| `timeout` | number | Max milliseconds to wait |
| `distanceInterval` | number | Min distance change to trigger update (meters) |

**Return Type**: `Promise<LocationObject>`

**Code Example**:

```typescript
import * as Location from 'expo-location';

const location = await Location.getCurrentPositionAsync({
  accuracy: Location.Accuracy.High,
});

// Returns:
// {
//   coords: {
//     latitude: 40.7128,
//     longitude: -74.0060,
//     altitude: 10.5,
//     accuracy: 5.0,
//     heading: 45,
//     speed: 0
//   },
//   timestamp: 1234567890000
// }

const { latitude, longitude } = location.coords;
```

#### Method: `watchPositionAsync(options: LocationOptions, callback: LocationCallback)`

**Description**: Subscribe to continuous location updates.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `options` | LocationOptions | Same as `getCurrentPositionAsync` |
| `callback` | (location: LocationObject) => void | Called on each location update |

**Return Type**: `Promise<LocationSubscription>` (call `.remove()` to unsubscribe)

**Code Example**:

```typescript
useEffect(() => {
  (async () => {
    let subscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        timeInterval: 1000,
        distanceInterval: 10,
      },
      (location) => {
        const { latitude, longitude } = location.coords;
        console.log(`Location: ${latitude}, ${longitude}`);
        setUserLocation({ latitude, longitude });
      }
    );

    return () => subscription?.remove();
  })();
}, []);
```

### Geocoding

#### Method: `geocodeAsync(address: string)`

**Description**: Convert address string to coordinates.

**Parameters**:

| Parameter | Type | Description |
|-----------|------|-------------|
| `address` | string | Address (e.g., "1 Apple Park Way, Cupertino") |

**Return Type**: `Promise<GeocodeResult[]>` — Array of matching locations

**Code Example**:

```typescript
const results = await Location.geocodeAsync('1 Apple Park Way, Cupertino');
// Returns:
// [
//   {
//     latitude: 37.3349,
//     longitude: -122.0090,
//     altitude: 0,
//     accuracy: null,
//   }
// ]

if (results.length > 0) {
  const { latitude, longitude } = results[0];
}
```

#### Method: `reverseGeocodeAsync(coordinates: {latitude, longitude})`

**Description**: Convert coordinates to address.

**Code Example**:

```typescript
const addresses = await Location.reverseGeocodeAsync({
  latitude: 40.7128,
  longitude: -74.0060,
});

// Returns address strings:
// [{
//   city: "New York",
//   street: "Broadway",
//   region: "NY",
//   country: "United States",
//   postalCode: "10001"
// }]
```

**Source**: https://docs.expo.dev/versions/latest/sdk/location/

---

## Maps

### Installation

```bash
npx expo install expo-maps
```

### Configuration

Add to app.json:

```json
{
  "plugins": [
    [
      "expo-maps",
      {
        "mapsApiKey": "YOUR_GOOGLE_MAPS_API_KEY"
      }
    ]
  ]
}
```

### MapView Component

**Description**: Display interactive map with markers.

**Code Example**:

```typescript
import { ExpoMapsView } from 'expo-maps';
import { useEffect, useRef } from 'react';
import { View } from 'react-native';

export function MapScreen() {
  const mapRef = useRef(null);

  const handleMarkerPress = (marker: Marker) => {
    console.log('Marker pressed:', marker);
  };

  return (
    <View style={{ flex: 1 }}>
      <ExpoMapsView
        ref={mapRef}
        style={{ flex: 1 }}
        initialCamera={{
          center: { latitude: 40.7128, longitude: -74.0060 },
          zoom: 12,
        }}
        onMarkerPress={handleMarkerPress}
      />
    </View>
  );
}
```

**Source**: https://docs.expo.dev/versions/latest/sdk/maps/

---

## Sensors (Accelerometer, Gyroscope, Magnetometer)

### Installation

```bash
npx expo install expo-sensors
```

### Motion Tracking Example

```typescript
import { Accelerometer, Gyroscope, Magnetometer } from 'expo-sensors';
import { useEffect, useState } from 'react';

export function SensorScreen() {
  const [accelData, setAccelData] = useState({ x: 0, y: 0, z: 0 });

  useEffect(() => {
    // Subscribe to accelerometer
    const subscription = Accelerometer.addListener((data) => {
      setAccelData(data);
    });

    // Set update interval
    Accelerometer.setUpdateInterval(500);

    return () => subscription.remove();
  }, []);

  return (
    <View>
      <Text>X: {accelData.x.toFixed(2)}</Text>
      <Text>Y: {accelData.y.toFixed(2)}</Text>
      <Text>Z: {accelData.z.toFixed(2)}</Text>
    </View>
  );
}
```

---

## Complete Example: Photo + Location

```typescript
import { useState, useRef } from 'react';
import {
  View,
  Button,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';

export function PhotoLocationScreen() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(
    null
  );
  const [loading, setLoading] = useState(false);

  const capturePhotoWithLocation = async () => {
    setLoading(true);

    try {
      // Request permissions
      const cameraPermission = 
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      const locationPermission = 
        await Location.requestForegroundPermissionsAsync();

      if (!cameraPermission.granted || !locationPermission.granted) {
        alert('Permissions required');
        return;
      }

      // Capture photo
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        allowsEditing: true,
      });

      if (!result.canceled) {
        setPhoto(result.assets[0].uri);

        // Get location
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(loc);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ flex: 1, justifyContent: 'center' }}>
      <Button 
        title="Capture Photo with Location" 
        onPress={capturePhotoWithLocation} 
      />

      {photo && (
        <>
          <Image source={{ uri: photo }} style={{ width: 200, height: 200 }} />
          {location && (
            <Text>
              {location.coords.latitude}, {location.coords.longitude}
            </Text>
          )}
        </>
      )}
    </View>
  );
}
```

---

## Best Practices

### ✅ Do's

- **Request permission before access** — Always check and ask
- **Use appropriate accuracy** — Reduce battery: `Balanced` or `Low` for background
- **Unsubscribe from listeners** — Prevent memory leaks and battery drain
- **Handle errors gracefully** — GPS unavailable, permission denied, etc.
- **Show loading states** — Async operations take time

### ❌ Don'ts

- **Don't access without permission** — Will crash or fail silently
- **Don't request excessive location** — Battery drain; use `watchPositionAsync` with intervals
- **Don't assume device has sensors** — Check availability first
- **Don't store raw location indefinitely** — Privacy and storage concerns

---

## Cross-References

- **Setup**: [02-quickstart-setup.md](02-quickstart-setup.md) — Configure plugins in app.json
- **Permissions**: Full permission API details above
- **Performance**: [14-best-practices-performance.md](14-best-practices-performance.md) — Battery and memory optimization

---

**Source Attribution**: https://docs.expo.dev/versions/latest/sdk/  
**Last Updated**: December 2024
