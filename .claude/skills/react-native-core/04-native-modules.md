# React Native 0.83 - Native Modules (Turbo Modules)

**Type-safe native integration with direct C++ communication**

---

## 🎯 Turbo Modules Overview

Turbo Modules enable JavaScript-to-native communication with:
- **Type-safe calls** — TypeScript/Flow type checking
- **Direct C++ communication** — Faster than the bridge
- **Lazy loading** — Modules load on demand
- **Synchronous calls** — When needed for performance

---

## 📋 Module Specification (TypeScript)

Define your module's interface in TypeScript:

```typescript
// NativeMyModule.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Synchronous method (returns immediately)
  getString(id: string): string;

  // Asynchronous method (returns Promise)
  getStringAsync(id: string): Promise<string>;

  // Multiple parameters
  add(a: number, b: number): number;

  // Return objects
  getUserData(id: string): Promise<{
    id: string;
    name: string;
    email: string;
  }>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MyModule');
```

---

## 🔧 Android Implementation (Java)

### Generate Native Code

First, Turbo Modules generates a Java spec from TypeScript:

```bash
cd android && ./gradlew generateCodegenArtifactsFromSchema && cd ..
```

### Implement the Module

Create `MyModule.java`:

```java
package com.myapp;

import com.facebook.react.bridge.Promise;
import com.facebook.react.module.annotations.ReactModule;
import com.facebook.react.turbomodule.core.TurboModule;

@ReactModule(name = "MyModule")
public class MyModule extends NativeMyModuleSpec {
    public static final String NAME = "MyModule";

    MyModule(ReactContext context) {
        super(context);
    }

    // Synchronous method
    @Override
    public String getString(String id) {
        return "Hello from Android: " + id;
    }

    // Asynchronous method
    @Override
    public void getStringAsync(String id, Promise promise) {
        try {
            String result = "Async result: " + id;
            promise.resolve(result);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }

    // Multiple parameters
    @Override
    public double add(double a, double b) {
        return a + b;
    }

    // Return objects
    @Override
    public void getUserData(String id, Promise promise) {
        try {
            WritableMap userData = Arguments.createMap();
            userData.putString("id", id);
            userData.putString("name", "John Doe");
            userData.putString("email", "john@example.com");
            promise.resolve(userData);
        } catch (Exception e) {
            promise.reject("ERROR", e.getMessage());
        }
    }
}
```

### Register Module

Create `MyModulePackage.java`:

```java
package com.myapp;

import com.facebook.react.TurboReactPackage;
import com.facebook.react.bridge.NativeModule;
import com.facebook.react.bridge.ReactApplicationContext;
import java.util.ArrayList;
import java.util.List;

public class MyModulePackage extends TurboReactPackage {
    @Override
    public List<NativeModule> createNativeModules(ReactApplicationContext reactContext) {
        List<NativeModule> nativeModules = new ArrayList<>();
        nativeModules.add(new MyModule(reactContext));
        return nativeModules;
    }
}
```

Register in `MainApplication.java`:

```java
public class MainApplication extends Application implements ReactApplication {
  private final ReactNativeHost mReactNativeHost =
      new ReactNativeHost(this) {
        @Override
        protected List<ReactPackage> getPackages() {
          List<ReactPackage> packages = new PackageList(this).getPackages();
          packages.add(new MyModulePackage());  // Add your package
          return packages;
        }
      };
}
```

---

## 🍎 iOS Implementation (Swift)

### Implement the Module

Create `MyModule.swift`:

```swift
import Foundation

@objc(MyModule)
class MyModule: NSObject, RCTBridgeModule {
    static func moduleName() -> String! {
        return "MyModule"
    }

    // Synchronous method
    @objc
    func getString(_ id: String) -> String {
        return "Hello from iOS: \(id)"
    }

    // Asynchronous method
    @objc
    func getStringAsync(
        _ id: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        DispatchQueue.main.async {
            let result = "Async: \(id)"
            resolve(result)
        }
    }

    // Multiple parameters
    @objc
    func add(_ a: NSNumber, _ b: NSNumber) -> NSNumber {
        return NSNumber(value: a.doubleValue + b.doubleValue)
    }

    // Return objects
    @objc
    func getUserData(
        _ id: String,
        resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        let userData: [String: Any] = [
            "id": id,
            "name": "John Doe",
            "email": "john@example.com"
        ]
        resolve(userData)
    }
}
```

### Bridge Header

Create `MyModule-Bridging-Header.h`:

```swift
//
//  MyModule-Bridging-Header.h
//

#ifndef MyModule_Bridging_Header_h
#define MyModule_Bridging_Header_h

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

#endif /* MyModule_Bridging_Header_h */
```

---

## 📱 Usage in JavaScript

Import and call your native module:

```typescript
import MyModule from './NativeMyModule';

// Synchronous call
const result = MyModule.getString('test-id');
console.log(result); // "Hello from Android: test-id" or iOS equivalent

// Asynchronous call
MyModule.getStringAsync('test-id')
  .then(result => console.log(result))
  .catch(error => console.error(error));

// Multiple parameters
const sum = MyModule.add(5, 3);
console.log(sum); // 8

// Return objects
MyModule.getUserData('user-123')
  .then(userData => {
    console.log(userData.name); // "John Doe"
  })
  .catch(error => console.error(error));
```

---

## 🎯 Complete Real-World Example: Camera Module

### TypeScript Spec

```typescript
// NativeCameraModule.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface CameraPhoto {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

export interface Spec extends TurboModule {
  takePhoto(): Promise<CameraPhoto>;
  hasPermission(): Promise<boolean>;
  requestPermission(): Promise<boolean>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('CameraModule');
```

### Android Implementation

```java
// CameraModule.java
package com.myapp;

import android.Manifest;
import android.content.pm.PackageManager;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.module.annotations.ReactModule;
import androidx.core.app.ActivityCompat;

@ReactModule(name = "CameraModule")
public class CameraModule extends NativeCameraModuleSpec {
    CameraModule(ReactContext context) {
        super(context);
    }

    @Override
    public void takePhoto(Promise promise) {
        try {
            // In production, use Camera2 API or similar
            WritableMap photo = Arguments.createMap();
            photo.putString("uri", "file:///data/photos/photo.jpg");
            photo.putInt("width", 1920);
            photo.putInt("height", 1440);
            promise.resolve(photo);
        } catch (Exception e) {
            promise.reject("CAMERA_ERROR", e.getMessage());
        }
    }

    @Override
    public void hasPermission(Promise promise) {
        int permission = ActivityCompat.checkSelfPermission(
            getReactApplicationContext(),
            Manifest.permission.CAMERA
        );
        promise.resolve(permission == PackageManager.PERMISSION_GRANTED);
    }

    @Override
    public void requestPermission(Promise promise) {
        // Request permission from user
        promise.resolve(false); // Simplified
    }
}
```

### iOS Implementation

```swift
// CameraModule.swift
import AVFoundation

@objc(CameraModule)
class CameraModule: NSObject, RCTBridgeModule {
    static func moduleName() -> String! {
        return "CameraModule"
    }

    @objc
    func takePhoto(
        _ resolve: @escaping RCTPromiseResolveBlock,
        reject: @escaping RCTPromiseRejectBlock
    ) {
        // Use AVFoundation to capture photo
        let photoData: [String: Any] = [
            "uri": "file:///tmp/photo.jpg",
            "width": 1920,
            "height": 1440
        ]
        resolve(photoData)
    }

    @objc
    func hasPermission(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        let status = AVCaptureDevice.authorizationStatus(for: .video)
        resolve(status == .authorized)
    }

    @objc
    func requestPermission(_ resolve: @escaping RCTPromiseResolveBlock, reject: @escaping RCTPromiseRejectBlock) {
        AVCaptureDevice.requestAccess(for: .video) { granted in
            resolve(granted)
        }
    }
}
```

### JavaScript Usage

```typescript
import CameraModule from './NativeCameraModule';
import { useEffect, useState } from 'react';
import { View, Image, Button, Text } from 'react-native';

const CameraScreen = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    checkPermission();
  }, []);

  const checkPermission = async () => {
    try {
      const permitted = await CameraModule.hasPermission();
      setHasPermission(permitted);
      if (!permitted) {
        await CameraModule.requestPermission();
      }
    } catch (error) {
      console.error('Permission check failed:', error);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const photoData = await CameraModule.takePhoto();
      setPhoto(photoData.uri);
    } catch (error) {
      console.error('Failed to take photo:', error);
    }
  };

  return (
    <View style={{ flex: 1 }}>
      {photo && (
        <Image
          source={{ uri: photo }}
          style={{ width: 200, height: 200 }}
        />
      )}
      {hasPermission && (
        <Button title="Take Photo" onPress={handleTakePhoto} />
      )}
      {!hasPermission && (
        <Text>Camera permission denied</Text>
      )}
    </View>
  );
};

export default CameraScreen;
```

---

## 🔒 Best Practices

✅ **DO:**
- Type all parameters and return values
- Handle errors explicitly
- Check permissions before use
- Use async methods for long operations
- Test on real devices (emulator may behave differently)

❌ **DON'T:**
- Block the UI thread in sync methods
- Return mutable objects without copying
- Forget error handling in promises
- Hardcode platform-specific behavior in JS

---

## 📚 Common Issues

### "Module not found" Error
- Verify module is registered (AndroidManifest.xml, iOS Podfile)
- Clean build: `cd android && ./gradlew clean && cd ..`
- Reinstall pods: `cd ios && rm -rf Pods && pod install && cd ..`

### "Method not implemented" Error
- Check TypeScript spec matches Android/iOS implementation
- Ensure method signatures are identical
- Run codegen: `cd android && ./gradlew generateCodegenArtifactsFromSchema && cd ..`

### Type Mismatch
- Use `WritableMap` for objects in Java
- Use dictionaries `[String: Any]` in Swift
- Ensure JSON-serializable types only

---

See **[07-best-practices.md](07-best-practices.md)** for security considerations with native modules.

---

**Source**: https://reactnative.dev/docs/the-new-architecture/turbo-modules-intro
**Version**: React Native 0.83
**Last Updated**: December 2025
