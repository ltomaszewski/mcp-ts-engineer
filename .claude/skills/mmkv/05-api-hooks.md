# MMKV: React Hooks

**useMMKVString, useMMKVNumber, useMMKVBoolean, useMMKVObject, useMMKVBuffer, useMMKV, useMMKVListener, useMMKVKeys.**

---

## Value Hooks

All value hooks follow the `useState` pattern: `[value, setValue]`. Set to `undefined` to delete the key.

### useMMKVString

```typescript
import { useMMKVString } from 'react-native-mmkv';
import { storage } from './storage';

function NameInput() {
  const [name, setName] = useMMKVString('user.name', storage);

  return (
    <TextInput
      value={name ?? ''}
      onChangeText={setName}
      placeholder="Enter name"
    />
  );
}
```

### useMMKVNumber

```typescript
import { useMMKVNumber } from 'react-native-mmkv';

function Counter() {
  const [count, setCount] = useMMKVNumber('counter');

  return (
    <View>
      <Text>Count: {count ?? 0}</Text>
      <Button title="+" onPress={() => setCount((count ?? 0) + 1)} />
      <Button title="Reset" onPress={() => setCount(undefined)} />
    </View>
  );
}
```

### useMMKVBoolean

```typescript
import { useMMKVBoolean } from 'react-native-mmkv';

function DarkModeToggle() {
  const [isDark, setIsDark] = useMMKVBoolean('settings.darkMode');

  return (
    <Switch
      value={isDark ?? false}
      onValueChange={setIsDark}
    />
  );
}
```

### useMMKVObject<T>

Automatically handles JSON serialization/deserialization.

```typescript
import { useMMKVObject } from 'react-native-mmkv';

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
}

function ProfileEditor() {
  const [profile, setProfile] = useMMKVObject<UserProfile>('user.profile');

  const updateName = (name: string) => {
    setProfile({ ...profile!, name });
  };

  if (!profile) return <Text>No profile</Text>;

  return (
    <View>
      <Text>{profile.name}</Text>
      <TextInput value={profile.name} onChangeText={updateName} />
    </View>
  );
}
```

### useMMKVBuffer

```typescript
import { useMMKVBuffer } from 'react-native-mmkv';

function BinaryDataView() {
  const [buffer, setBuffer] = useMMKVBuffer('binary.data');

  const saveData = () => {
    const ab = new ArrayBuffer(4);
    const view = new Uint8Array(ab);
    view.set([1, 2, 3, 4]);
    setBuffer(ab);
  };

  return <Button title="Save Buffer" onPress={saveData} />;
}
```

---

## Hook Parameters

All value hooks share the same signature:

```typescript
const [value, setValue] = useMMKVString(key: string, instance?: MMKV);
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | `string` | Yes | Storage key to bind |
| `instance` | `MMKV` | No | Specific MMKV instance. Defaults to the default instance. |

### Deleting a Value

Set to `undefined` to remove the key:

```typescript
const [name, setName] = useMMKVString('user.name');
setName(undefined); // Removes the key from storage
```

---

## Instance Hook

### useMMKV

Access an MMKV instance reactively.

```typescript
import { useMMKV } from 'react-native-mmkv';

function StorageInfo() {
  const storage = useMMKV({ id: 'app-storage' });

  return (
    <View>
      <Text>Keys: {storage.getAllKeys().length}</Text>
      <Text>Size: {storage.size} bytes</Text>
      <Button title="Clear" onPress={() => storage.clearAll()} />
    </View>
  );
}
```

### Dynamic User Instance

```typescript
function UserSettings({ userId }: { userId: string }) {
  const storage = useMMKV({ id: `user.${userId}.storage` });
  const [theme, setTheme] = useMMKVString('theme', storage);

  return (
    <View>
      <Text>Theme: {theme ?? 'system'}</Text>
      <Button title="Toggle" onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')} />
    </View>
  );
}
```

---

## Listener Hooks

### useMMKVListener

Listen for value changes on an MMKV instance inside a component.

```typescript
import { useMMKVListener } from 'react-native-mmkv';
import { storage } from './storage';

function ChangeLogger() {
  useMMKVListener((key) => {
    console.log(`Key "${key}" changed!`);
  }, storage);

  return null;
}
```

### useMMKVKeys

Track all keys in an instance reactively.

```typescript
import { useMMKVKeys } from 'react-native-mmkv';

function KeyList() {
  const keys = useMMKVKeys(storage);

  return (
    <FlatList
      data={keys}
      renderItem={({ item }) => <Text>{item}</Text>}
    />
  );
}
```

---

## Complete Form Example

```typescript
import React from 'react';
import { View, TextInput, Switch, Text, StyleSheet } from 'react-native';
import { useMMKVString, useMMKVBoolean, useMMKVNumber } from 'react-native-mmkv';
import { storage } from './storage';

export function SettingsForm() {
  const [name, setName] = useMMKVString('settings.name', storage);
  const [notifications, setNotifications] = useMMKVBoolean('settings.notifications', storage);
  const [fontSize, setFontSize] = useMMKVNumber('settings.fontSize', storage);

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Display Name</Text>
      <TextInput
        value={name ?? ''}
        onChangeText={setName}
        style={styles.input}
      />

      <View style={styles.row}>
        <Text style={styles.label}>Notifications</Text>
        <Switch value={notifications ?? true} onValueChange={setNotifications} />
      </View>

      <Text style={styles.label}>Font Size: {fontSize ?? 16}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 16 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
});
```

---

**Version:** 4.1.x | **Source:** https://github.com/mrousavy/react-native-mmkv
