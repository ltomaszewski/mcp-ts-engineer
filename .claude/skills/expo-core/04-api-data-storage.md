# 04 -- API Reference: Data & Assets (FileSystem, SecureStore, Asset, Font)

File I/O with the new OOP API, encrypted key-value storage, asset management, and font loading for Expo SDK 54.

---

## FileSystem (New OOP API)

SDK 54 promotes the formerly `/next` object-oriented API to the default import. The legacy string-based API is available at `expo-file-system/legacy`.

### Installation

```bash
npx expo install expo-file-system
```

### Import

```typescript
import { File, Directory, Paths } from 'expo-file-system';
```

### Paths Utility

| Property | Type | Description |
|----------|------|-------------|
| `Paths.cache` | `Directory` | Temp storage; system may delete when device runs low |
| `Paths.document` | `Directory` | Persistent storage; safe from system deletion |
| `Paths.bundle` | `Directory` | Assets bundled into the native app binary (read-only) |
| `Paths.availableDiskSpace` | `number` | Free storage in bytes |
| `Paths.totalDiskSpace` | `number` | Total storage in bytes |
| `Paths.appleSharedContainers` | `object` | iOS App Group shared containers |

**Path manipulation methods:**

| Method | Description |
|--------|-------------|
| `Paths.join(...paths)` | Combine path segments |
| `Paths.basename(path, ext?)` | Filename from path |
| `Paths.dirname(path)` | Directory from path |
| `Paths.extname(path)` | File extension |
| `Paths.parse(path)` | Object with `root`, `dir`, `name`, `ext`, `base` |
| `Paths.relative(from, to)` | Relative path between two paths |
| `Paths.isAbsolute(path)` | Check if path is absolute |
| `Paths.normalize(path)` | Standardize path format |

### File Class

**Constructor:** `new File(directory: Directory | string, name: string)`

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `uri` | `string` (readonly) | File URI path |
| `name` | `string` | Filename with extension |
| `extension` | `string` | File extension |
| `type` | `string` | MIME type |
| `exists` | `boolean` | Whether file exists on disk |
| `size` | `number` | File size in bytes |
| `md5` | `string \| null` | MD5 hash of file contents |
| `creationTime` | `number \| null` | Creation timestamp (ms) |
| `modificationTime` | `number \| null` | Modification timestamp (ms) |

**Methods:**

| Method | Return | Description |
|--------|--------|-------------|
| `create(options?)` | `void` | Create file; `{ overwrite: true }` to replace |
| `write(content)` | `void` | Write `string` or `Uint8Array` |
| `text()` | `Promise<string>` | Read as string (async) |
| `textSync()` | `string` | Read as string (sync) |
| `bytes()` | `Promise<Uint8Array>` | Read as bytes (async) |
| `bytesSync()` | `Uint8Array` | Read as bytes (sync) |
| `base64()` | `Promise<string>` | Read as base64 (async) |
| `base64Sync()` | `string` | Read as base64 (sync) |
| `copy(destination)` | `void` | Copy file to destination |
| `move(destination)` | `void` | Move file (updates URI) |
| `delete()` | `void` | Remove file from disk |
| `open()` | `FileHandle` | Open for stream operations |
| `readableStream()` | `ReadableStream` | Web Streams API readable |
| `writableStream()` | `WritableStream` | Web Streams API writable |

**Static Methods:**

| Method | Return | Description |
|--------|--------|-------------|
| `File.downloadFileAsync(url, destination, options?)` | `Promise<File>` | Download from network |
| `File.pickFileAsync(initialUri?, mimeType?)` | `Promise<File \| null>` | Open system file picker |

### Directory Class

**Constructor:** `new Directory(parent: Directory | string, name: string)`

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `uri` | `string` (readonly) | Directory URI path |
| `name` | `string` | Directory name |
| `exists` | `boolean` | Whether directory exists |
| `size` | `number \| null` | Total size in bytes (recursive) |
| `parentDirectory` | `Directory` | Parent directory instance |

**Methods:**

| Method | Return | Description |
|--------|--------|-------------|
| `create(options?)` | `void` | Create directory; `{ intermediates: true }` for nested |
| `createFile(name, mimeType?)` | `File` | Create child file |
| `createDirectory(name)` | `Directory` | Create child directory |
| `list()` | `(File \| Directory)[]` | List contents |
| `copy(destination)` | `void` | Copy directory recursively |
| `move(destination)` | `void` | Move directory |
| `rename(newName)` | `void` | Rename directory |
| `delete()` | `void` | Remove directory and all contents |

**Static Methods:**

| Method | Return | Description |
|--------|--------|-------------|
| `Directory.pickDirectoryAsync(initialUri?)` | `Promise<Directory \| null>` | Open system directory picker |

### FileHandle Class

Returned by `file.open()` for stream-based operations.

| Property/Method | Type/Return | Description |
|----------------|-------------|-------------|
| `offset` | `number \| null` | Current byte position |
| `size` | `number \| null` | File size |
| `readBytes(length)` | `Uint8Array` | Read specified byte count |
| `writeBytes(bytes)` | `void` | Write byte array |
| `close()` | `void` | Close handle (required before other file ops) |

### Usage Examples

```typescript
import { File, Directory, Paths } from 'expo-file-system';

// Write and read a text file
const file = new File(Paths.document, 'notes.txt');
file.create();
file.write('Hello, Expo SDK 54!');
console.log(file.textSync()); // "Hello, Expo SDK 54!"
console.log(file.size);       // 19

// Write JSON data
const config = new File(Paths.document, 'config.json');
config.create();
config.write(JSON.stringify({ theme: 'dark', lang: 'en' }));
const data = JSON.parse(config.textSync());

// Download a file from the network
const downloads = new Directory(Paths.cache, 'downloads');
downloads.create();
const pdf = await File.downloadFileAsync(
  'https://example.com/doc.pdf',
  downloads
);
console.log(`Downloaded: ${pdf.name}, ${pdf.size} bytes`);

// List directory contents
const items = new Directory(Paths.document).list();
for (const item of items) {
  if (item instanceof Directory) {
    console.log(`Dir: ${item.name}`);
  } else {
    console.log(`File: ${item.name} (${item.size} bytes)`);
  }
}

// Upload a file with fetch
const uploadFile = new File(Paths.cache, 'upload.txt');
uploadFile.create();
uploadFile.write('upload content');
await fetch('https://api.example.com/upload', {
  method: 'POST',
  body: uploadFile,
});

// Check available disk space
const freeGB = Paths.availableDiskSpace / (1024 ** 3);
console.log(`Free space: ${freeGB.toFixed(1)} GB`);
```

**Source:** https://docs.expo.dev/versions/latest/sdk/filesystem/

---

## SecureStore

Encrypted key-value storage backed by iOS Keychain and Android Keystore. Each Expo project has a separate storage system.

### Installation

```bash
npx expo install expo-secure-store
```

### Methods

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `setItemAsync(key, value, options?)` | `string, string, SecureStoreOptions?` | `Promise<void>` | Store encrypted key-value pair |
| `setItem(key, value, options?)` | `string, string, SecureStoreOptions?` | `void` | Synchronous store (blocks JS thread) |
| `getItemAsync(key, options?)` | `string, SecureStoreOptions?` | `Promise<string \| null>` | Retrieve value; `null` if not found or invalidated |
| `getItem(key, options?)` | `string, SecureStoreOptions?` | `string \| null` | Synchronous retrieve (blocks JS thread) |
| `deleteItemAsync(key, options?)` | `string, SecureStoreOptions?` | `Promise<void>` | Remove stored value |
| `isAvailableAsync()` | -- | `Promise<boolean>` | Check platform support (`true` on iOS/Android/tvOS) |
| `canUseBiometricAuthentication()` | -- | `boolean` | Check if biometric auth is available |

### SecureStoreOptions

| Option | Type | Platform | Description |
|--------|------|----------|-------------|
| `requireAuthentication` | `boolean` | iOS, Android | Require biometric/passcode before access |
| `authenticationPrompt` | `string` | All | Custom prompt message for authentication dialog |
| `keychainAccessible` | `KeychainAccessibilityConstant` | iOS | When data is accessible (default: `WHEN_UNLOCKED`) |
| `keychainService` | `string` | iOS, Android | Service identifier; must match for retrieval if set |
| `accessGroup` | `string` | iOS | Keychain access group for app-to-app sharing |

### Keychain Accessibility Constants

| Constant | Description |
|----------|-------------|
| `SecureStore.WHEN_UNLOCKED` | Available only while device is unlocked (default) |
| `SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY` | Same, but not included in backups |
| `SecureStore.AFTER_FIRST_UNLOCK` | Available after first unlock until restart |
| `SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY` | Same, but not included in backups |
| `SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY` | Only when passcode is set; invalidated if removed |

### Key Constraints

- Keys: alphanumeric, `.`, `-`, `_` characters only
- Values: must be strings (use `JSON.stringify` for objects)
- Keys are invalidated when biometrics change (new fingerprint, face profile)

### Usage Example

```typescript
import * as SecureStore from 'expo-secure-store';

// Basic CRUD
await SecureStore.setItemAsync('authToken', 'eyJhbGci...');
const token = await SecureStore.getItemAsync('authToken');
await SecureStore.deleteItemAsync('authToken');

// Synchronous variants (use sparingly)
SecureStore.setItem('sessionId', 'abc123');
const sessionId = SecureStore.getItem('sessionId');

// Biometric-protected storage
await SecureStore.setItemAsync('bankPin', '1234', {
  requireAuthentication: true,
  authenticationPrompt: 'Authenticate to access your PIN',
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
});

// Store complex objects as JSON
const credentials = { email: 'user@example.com', refreshToken: 'rt_...' };
await SecureStore.setItemAsync('credentials', JSON.stringify(credentials));
const stored = await SecureStore.getItemAsync('credentials');
const parsed = stored ? JSON.parse(stored) : null;

// Check platform support
const isAvailable = await SecureStore.isAvailableAsync();
const hasBiometrics = SecureStore.canUseBiometricAuthentication();
```

**Source:** https://docs.expo.dev/versions/latest/sdk/securestore/

---

## Asset

Download and cache bundled or remote assets for use at runtime.

### Installation

```bash
npx expo install expo-asset
```

### Hook: useAssets

```typescript
import { useAssets } from 'expo-asset';

const [assets, error] = useAssets([
  require('./assets/logo.png'),
  require('./assets/splash.png'),
]);
// assets: Asset[] | undefined
// error: Error | undefined
```

### Asset Class

**Static Methods:**

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `Asset.fromModule(moduleId)` | `number \| string` | `Asset` | Create from `require()` or URL |
| `Asset.fromURI(uri)` | `string` | `Asset` | Create from URI string |
| `Asset.loadAsync(moduleId)` | `number \| number[]` | `Promise<Asset[]>` | Load and download to cache |

**Instance Methods:**

| Method | Return | Description |
|--------|--------|-------------|
| `downloadAsync()` | `Promise<Asset>` | Download to device cache |

**Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `localUri` | `string \| null` | Local file URI (set after `downloadAsync()`) |
| `uri` | `string` | Remote or bundled URI |
| `name` | `string` | Filename without extension |
| `type` | `string` | File extension |
| `hash` | `string \| null` | MD5 hash of asset data |
| `width` | `number \| null` | Image width (divided by scale factor) |
| `height` | `number \| null` | Image height (divided by scale factor) |
| `downloaded` | `boolean` | Whether download is complete |

### Usage Example

```typescript
import { Asset } from 'expo-asset';

// Preload assets during splash screen
async function loadAssets(): Promise<void> {
  await Asset.loadAsync([
    require('./assets/images/logo.png'),
    require('./assets/images/background.png'),
  ]);
}

// Get local URI for a bundled asset
const asset = Asset.fromModule(require('./assets/data.json'));
await asset.downloadAsync();
console.log(asset.localUri); // file:///...data.json

// Use in components with useAssets hook
import { useAssets } from 'expo-asset';
import { Image } from 'react-native';

function Logo() {
  const [assets] = useAssets([require('./assets/logo.png')]);
  if (!assets) return null;
  return <Image source={{ uri: assets[0].localUri! }} style={{ width: 100, height: 100 }} />;
}
```

**Source:** https://docs.expo.dev/versions/latest/sdk/asset/

---

## Font

Load custom fonts at runtime or via config plugin for build-time embedding.

### Installation

```bash
npx expo install expo-font
```

### Hook: useFonts

```typescript
import { useFonts } from 'expo-font';

const [loaded, error] = useFonts({
  'Inter-Regular': require('./assets/fonts/Inter-Regular.otf'),
  'Inter-Bold': require('./assets/fonts/Inter-Bold.otf'),
});
// loaded: boolean -- true when all fonts are loaded
// error: Error | null -- loading error if any
```

### Methods

| Method | Parameters | Return | Description |
|--------|-----------|--------|-------------|
| `Font.loadAsync(fontMap)` | `Record<string, FontSource>` | `Promise<void>` | Load fonts imperatively |
| `Font.loadAsync(name, source)` | `string, FontSource` | `Promise<void>` | Load single font |
| `Font.isLoaded(fontFamily)` | `string` | `boolean` | Check if font is loaded (sync) |
| `Font.isLoading(fontFamily)` | `string` | `boolean` | Check if font is loading (sync) |
| `Font.getLoadedFonts()` | -- | `string[]` | List all loaded font families |

### FontSource Type

```typescript
type FontSource = string | number | Asset | FontResource;

interface FontResource {
  uri?: string | number;
  display?: FontDisplay; // Web only
  default?: string;
}
```

### Error Codes

| Code | Description |
|------|-------------|
| `ERR_FONT_API` | Font API not available on platform |
| `ERR_FONT_SOURCE` | Invalid font source |
| `ERR_DOWNLOAD` | Font download failed |
| `ERR_FONT_FAMILY` | Invalid font family name |
| `ERR_UNLOAD` | Font unload failed |

### Usage Example

```typescript
import { useCallback, useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';

SplashScreen.preventAutoHideAsync();

export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': require('./assets/fonts/Inter-Regular.otf'),
    'Inter-Bold': require('./assets/fonts/Inter-Bold.otf'),
    'Mono': require('./assets/fonts/SpaceMono-Regular.ttf'),
  });

  const onLayoutRootView = useCallback(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hide();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <View style={{ flex: 1 }} onLayout={onLayoutRootView}>
      <Text style={{ fontFamily: 'Inter-Bold', fontSize: 24 }}>
        Custom Font Heading
      </Text>
      <Text style={{ fontFamily: 'Inter-Regular', fontSize: 16 }}>
        Body text with Inter Regular
      </Text>
    </View>
  );
}
```

### Config Plugin (Build-Time Embedding)

Fonts can be embedded at build time via the config plugin in app.json, eliminating runtime download latency:

```json
{
  "plugins": [
    ["expo-font", {
      "fonts": ["./assets/fonts/Inter-Regular.otf", "./assets/fonts/Inter-Bold.otf"]
    }]
  ]
}
```

**Source:** https://docs.expo.dev/versions/latest/sdk/font/

---

**Version:** Expo SDK 54 (~54.0.33) | React Native 0.81.5 | React 19.1.0 | **Source:** https://docs.expo.dev/versions/latest/sdk/filesystem/, https://docs.expo.dev/versions/latest/sdk/securestore/, https://docs.expo.dev/versions/latest/sdk/asset/, https://docs.expo.dev/versions/latest/sdk/font/
