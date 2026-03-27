# React Native 0.83.4 -- Turbo Native Modules

Type-safe native integration via JSI, Codegen, and platform implementations.

---

## Overview

Turbo Native Modules are the New Architecture replacement for legacy Native Modules. They provide:
- **Type-safe contracts** -- TypeScript/Flow specs generate native interfaces via Codegen
- **JSI-based calls** -- Direct C++ communication, no JSON serialization bridge
- **Lazy loading** -- Modules instantiated on first use, not at startup
- **Synchronous support** -- Sync and async methods via JSI host objects

---

## Step 1: Define the JavaScript Spec

Create a TypeScript specification file. The filename must start with `Native`.

```typescript
// specs/NativeDeviceInfo.ts
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  // Synchronous method
  getDeviceName(): string;

  // Asynchronous method
  getBatteryLevel(): Promise<number>;

  // Methods with parameters
  multiply(a: number, b: number): number;

  // Methods returning objects
  getDeviceInfo(): Promise<{
    model: string;
    osVersion: string;
    batteryLevel: number;
  }>;

  // Optional callback pattern
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

// getEnforcing throws if module unavailable; use get() for optional modules
export default TurboModuleRegistry.getEnforcing<Spec>('DeviceInfo');
```

### Supported Spec Types

| JS Type | Android (Java/Kotlin) | iOS (Obj-C) | C++ |
|---------|----------------------|-------------|-----|
| `string` | `String` | `NSString` | `std::string` |
| `number` | `double` | `double` | `double` |
| `boolean` | `boolean` | `BOOL` | `bool` |
| `Object` (`{}`) | `ReadableMap` | `NSDictionary` | `jsi::Object` |
| `Array` (`[]`) | `ReadableArray` | `NSArray` | `jsi::Array` |
| `Promise<T>` | `Promise` | `resolve/reject blocks` | `AsyncCallback` |
| `null \| T` | `@Nullable T` | `nullable T` | `std::optional<T>` |

### TurboModuleRegistry Methods

| Method | Behavior |
|--------|----------|
| `TurboModuleRegistry.getEnforcing<Spec>(name)` | Returns module or throws if unavailable |
| `TurboModuleRegistry.get<Spec>(name)` | Returns module or `null` if unavailable |

---

## Step 2: Run Codegen

Codegen generates native interfaces from your spec. It runs automatically during build, but you can trigger it manually:

**Android:**
```bash
cd android && ./gradlew generateCodegenArtifactsFromSchema
```

**iOS:**
Codegen runs during `pod install`:
```bash
cd ios && pod install
```

---

## Step 3: Android Implementation (Kotlin)

### Module Implementation

```kotlin
// android/app/src/main/java/com/myapp/DeviceInfoModule.kt
package com.myapp

import android.os.Build
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.WritableNativeMap
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = DeviceInfoModule.NAME)
class DeviceInfoModule(reactContext: ReactApplicationContext) :
    NativeDeviceInfoSpec(reactContext) {

    companion object {
        const val NAME = "DeviceInfo"
    }

    override fun getName(): String = NAME

    override fun getDeviceName(): String {
        return Build.MODEL
    }

    override fun getBatteryLevel(promise: Promise) {
        try {
            // Implementation using BatteryManager
            promise.resolve(0.85)
        } catch (e: Exception) {
            promise.reject("BATTERY_ERROR", e.message)
        }
    }

    override fun multiply(a: Double, b: Double): Double {
        return a * b
    }

    override fun getDeviceInfo(promise: Promise) {
        try {
            val info = WritableNativeMap().apply {
                putString("model", Build.MODEL)
                putString("osVersion", Build.VERSION.RELEASE)
                putDouble("batteryLevel", 0.85)
            }
            promise.resolve(info)
        } catch (e: Exception) {
            promise.reject("DEVICE_INFO_ERROR", e.message)
        }
    }
}
```

### Package Registration

```kotlin
// android/app/src/main/java/com/myapp/DeviceInfoPackage.kt
package com.myapp

import com.facebook.react.TurboReactPackage
import com.facebook.react.bridge.NativeModule
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.module.model.ReactModuleInfoProvider
import com.facebook.react.module.model.ReactModuleInfo

class DeviceInfoPackage : TurboReactPackage() {
    override fun getModule(name: String, reactContext: ReactApplicationContext): NativeModule? {
        return if (name == DeviceInfoModule.NAME) {
            DeviceInfoModule(reactContext)
        } else null
    }

    override fun getReactModuleInfoProvider(): ReactModuleInfoProvider {
        return ReactModuleInfoProvider {
            mapOf(
                DeviceInfoModule.NAME to ReactModuleInfo(
                    DeviceInfoModule.NAME,
                    DeviceInfoModule.NAME,
                    false, // canOverrideExistingModule
                    false, // needsEagerInit
                    true,  // isCxxModule
                    true   // isTurboModule
                )
            )
        }
    }
}
```

Register in `MainApplication.kt`:

```kotlin
override fun getPackages(): List<ReactPackage> {
    val packages = PackageList(this).packages.toMutableList()
    packages.add(DeviceInfoPackage())
    return packages
}
```

---

## Step 3 (Alt): iOS Implementation (Objective-C++)

### Module Implementation

```objectivec
// ios/DeviceInfoModule.mm
#import "DeviceInfoModule.h"
#import <UIKit/UIKit.h>

// The spec header is generated by Codegen
#import <NativeDeviceInfoSpec/NativeDeviceInfoSpec.h>

@implementation DeviceInfoModule

RCT_EXPORT_MODULE(DeviceInfo)

- (NSString *)getDeviceName {
    return [[UIDevice currentDevice] model];
}

- (void)getBatteryLevel:(RCTPromiseResolveBlock)resolve
                 reject:(RCTPromiseRejectBlock)reject {
    [UIDevice currentDevice].batteryMonitoringEnabled = YES;
    float level = [UIDevice currentDevice].batteryLevel;
    resolve(@(level));
}

- (NSNumber *)multiply:(double)a b:(double)b {
    return @(a * b);
}

- (void)getDeviceInfo:(RCTPromiseResolveBlock)resolve
               reject:(RCTPromiseRejectBlock)reject {
    UIDevice *device = [UIDevice currentDevice];
    device.batteryMonitoringEnabled = YES;

    resolve(@{
        @"model": device.model,
        @"osVersion": device.systemVersion,
        @"batteryLevel": @(device.batteryLevel)
    });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params {
    return std::make_shared<facebook::react::NativeDeviceInfoSpecJSI>(params);
}

@end
```

### Header File

```objectivec
// ios/DeviceInfoModule.h
#import <React/RCTBridgeModule.h>

@interface DeviceInfoModule : NSObject <RCTBridgeModule>
@end
```

---

## Step 3 (Alt): Cross-Platform C++ Module

For logic shared across both platforms without platform-specific code:

```cpp
// cpp/NativeDeviceInfoModule.h
#pragma once

#include <NativeDeviceInfoSpec.h>

namespace facebook::react {

class NativeDeviceInfoModule : public NativeDeviceInfoCxxSpec<NativeDeviceInfoModule> {
public:
    NativeDeviceInfoModule(std::shared_ptr<CallInvoker> jsInvoker);

    jsi::String getDeviceName(jsi::Runtime &rt);
    double multiply(jsi::Runtime &rt, double a, double b);
};

} // namespace facebook::react
```

---

## Step 4: Use in JavaScript

```typescript
import DeviceInfo from './specs/NativeDeviceInfo';

// Synchronous call
const deviceName: string = DeviceInfo.getDeviceName();

// Asynchronous call
async function loadDeviceInfo(): Promise<void> {
  try {
    const battery = await DeviceInfo.getBatteryLevel();
    console.log('Battery:', battery);

    const info = await DeviceInfo.getDeviceInfo();
    console.log('Model:', info.model);
    console.log('OS:', info.osVersion);
  } catch (error) {
    console.error('Failed to get device info:', error);
  }
}

// Synchronous computation
const result: number = DeviceInfo.multiply(6, 7); // 42
```

---

## Sending Events to JavaScript

TurboModules can emit events to JavaScript:

### Spec with Events

```typescript
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  startObserving(): void;
  stopObserving(): void;
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MyEventEmitter');
```

### Listening to Events

```typescript
import { NativeEventEmitter, NativeModules } from 'react-native';
import { useEffect } from 'react';

const eventEmitter = new NativeEventEmitter(NativeModules.MyEventEmitter);

function useMyEvent(handler: (data: unknown) => void): void {
  useEffect(() => {
    const subscription = eventEmitter.addListener('onDataReceived', handler);
    return () => subscription.remove();
  }, [handler]);
}
```

---

## Best Practices

**DO:**
- Type all parameters and return values in the spec
- Handle errors with try/catch in native and reject promises
- Use `getEnforcing` for required modules, `get` for optional
- Run Codegen after spec changes to verify type alignment
- Test on real devices (emulator behavior may differ)

**DO NOT:**
- Block the UI thread in synchronous methods
- Return mutable objects from native -- copy first
- Hardcode platform behavior in JS -- use Platform.select or file extensions
- Forget to register the package in MainApplication

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| "Module not found" | Verify package registration and module name matches spec |
| "Method not implemented" | Run Codegen, check spec signature matches native |
| Type mismatch | Ensure JS types map to correct native types (see table above) |
| Build failure after spec change | Clean build: `cd android && ./gradlew clean` or `cd ios && pod install` |

---

**Version:** React Native 0.83.4 | New Architecture (mandatory)
**Source:** https://reactnative.dev/docs/turbo-native-modules-introduction
