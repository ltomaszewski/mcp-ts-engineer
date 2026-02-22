# API Reference: register() & Controller

> Field registration API, all inline validation rules, value transformations, and Controller component for UI libraries and React Native.

**Source:** [https://react-hook-form.com/docs/useform/register](https://react-hook-form.com/docs/useform/register)

---

## register() Function

### Signature

```typescript
function register(
  name: string,
  options?: RegisterOptions
): { onChange, onBlur, ref, name, min?, max?, maxLength?, minLength?, pattern?, required?, disabled? }
```

**Important:** `register` works only with DOM elements that expose a `ref`. For React Native `TextInput` and UI libraries without ref support, use `Controller` instead.

---

### register Options (Complete)

| Option | Type | Description |
|--------|------|-------------|
| `required` | `boolean \| string \| { value: boolean; message: string }` | Field must have a value |
| `min` | `number \| string \| { value: number; message: string }` | Minimum numeric value |
| `max` | `number \| string \| { value: number; message: string }` | Maximum numeric value |
| `minLength` | `number \| { value: number; message: string }` | Minimum string length |
| `maxLength` | `number \| { value: number; message: string }` | Maximum string length |
| `pattern` | `RegExp \| { value: RegExp; message: string }` | Regex pattern match |
| `validate` | `Function \| Record<string, Function>` | Custom sync/async validation |
| `valueAsNumber` | `boolean` | Convert to number (like `parseFloat`) |
| `valueAsDate` | `boolean` | Convert to Date object |
| `setValueAs` | `(value: any) => any` | Custom value transform |
| `disabled` | `boolean` | Disable field (excluded from submission) |
| `onChange` | `(e: SyntheticEvent) => void` | Custom onChange handler (called alongside RHF) |
| `onBlur` | `(e: SyntheticEvent) => void` | Custom onBlur handler (called alongside RHF) |
| `value` | `unknown` | Override field value |
| `shouldUnregister` | `boolean` | Unregister on unmount |
| `deps` | `string \| string[]` | Trigger validation on dependent fields |

---

### Basic Registration

```typescript
import { useForm } from 'react-hook-form';

const { register } = useForm();

<input {...register('email')} />
<input {...register('password')} type="password" />
<textarea {...register('message')} />
<select {...register('category')}>
  <option value="">Select...</option>
  <option value="tech">Technology</option>
</select>
<input {...register('agree')} type="checkbox" />
```

---

### Validation Rules

```typescript
// required
<input {...register('email', { required: 'Email is required' })} />

// min / max
<input type="number" {...register('age', {
  min: { value: 18, message: 'Must be 18+' },
  max: { value: 120, message: 'Invalid age' },
})} />

// minLength / maxLength
<input {...register('password', {
  minLength: { value: 8, message: 'Min 8 chars' },
  maxLength: { value: 64, message: 'Max 64 chars' },
})} />

// pattern
<input {...register('email', {
  pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Invalid email' },
})} />

// validate (single)
<input {...register('username', {
  validate: (value) => value !== 'admin' || 'Reserved username',
})} />

// validate (multiple named)
<input {...register('password', {
  validate: {
    hasUpper: (v) => /[A-Z]/.test(v) || 'Need uppercase',
    hasNumber: (v) => /\d/.test(v) || 'Need number',
    hasSpecial: (v) => /[!@#$%]/.test(v) || 'Need special char',
  },
})} />

// validate (async)
<input {...register('email', {
  validate: async (value) => {
    const res = await fetch(`/api/check-email?email=${value}`);
    const { available } = await res.json();
    return available || 'Email already taken';
  },
})} />
```

---

### Value Transformations

```typescript
// valueAsNumber -- auto-parse to number
<input type="number" {...register('age', { valueAsNumber: true })} />

// valueAsDate -- auto-parse to Date
<input type="date" {...register('birthDate', { valueAsDate: true })} />

// setValueAs -- custom transform
<input {...register('email', {
  setValueAs: (v: string) => v.trim().toLowerCase(),
})} />
```

---

### onChange, onBlur, value, deps

```typescript
// Custom onChange alongside RHF onChange
<input {...register('search', {
  onChange: (e) => debouncedSearch(e.target.value),
})} />

// Custom onBlur alongside RHF onBlur
<input {...register('name', {
  onBlur: (e) => analytics.track('field_blur', { field: 'name' }),
})} />

// Override value
<input {...register('hiddenField', { value: 'fixed-value' })} />

// deps -- trigger validation on dependent field when this changes
<input {...register('password')} />
<input {...register('confirmPassword', {
  deps: ['password'], // re-validate confirmPassword when password changes
  validate: (value, formValues) =>
    value === formValues.password || 'Passwords must match',
})} />
```

---

## Controller Component

**Use Controller for:** React Native inputs, Material UI, Chakra UI, React Select, or any component that does not expose a DOM `ref`.

### Signature

```typescript
<Controller
  name={string}
  control={Control}
  render={({ field, fieldState, formState }) => ReactElement}
  rules?: RegisterOptions
  defaultValue?: unknown
  shouldUnregister?: boolean
  disabled?: boolean
/>
```

### Controller Props (Complete)

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `name` | `string` | Yes | Field name (unique within form) |
| `control` | `Control` | Yes | `control` object from `useForm()` |
| `render` | `({ field, fieldState, formState }) => ReactElement` | Yes | Render function |
| `rules` | `RegisterOptions` | No | Same validation rules as `register` |
| `defaultValue` | `unknown` | No | Override form defaultValue for this field |
| `shouldUnregister` | `boolean` | No | Unregister on unmount |
| `disabled` | `boolean` | No | Disable field |

### render Callback Arguments

**field object:**

| Property | Type | Description |
|----------|------|-------------|
| `onChange` | `(...event: any[]) => void` | Send value to form |
| `onBlur` | `() => void` | Notify form of blur |
| `value` | `unknown` | Current field value |
| `name` | `string` | Field name |
| `ref` | `React.Ref` | Ref for focus management |
| `disabled` | `boolean` | Disabled state |

**fieldState object:**

| Property | Type | Description |
|----------|------|-------------|
| `invalid` | `boolean` | Field has error |
| `isTouched` | `boolean` | Field has been blurred |
| `isDirty` | `boolean` | Value differs from default |
| `error` | `FieldError \| undefined` | Current error |

---

### Controller with React Native

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, TextInput, Text, Pressable } from 'react-native';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});
type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  return (
    <View>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.email && <Text>{errors.email.message}</Text>}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Password"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.password && <Text>{errors.password.message}</Text>}

      <Pressable onPress={handleSubmit((data) => console.log(data))} disabled={isSubmitting}>
        <Text>{isSubmitting ? 'Submitting...' : 'Login'}</Text>
      </Pressable>
    </View>
  );
}
```

---

### Controller with Material UI (Web)

```typescript
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button } from '@mui/material';

interface FormData { email: string; password: string }

export function MuiForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { email: '', password: '' },
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <Controller
        name="email"
        control={control}
        rules={{ required: 'Email required', pattern: {
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Invalid email',
        }}}
        render={({ field, fieldState: { error } }) => (
          <TextField {...field} label="Email" error={!!error} helperText={error?.message} />
        )}
      />
      <Button type="submit">Submit</Button>
    </form>
  );
}
```

---

## Patterns

### Combining register and Controller

Use `register` for native HTML elements (web), `Controller` for UI library components and React Native:

```typescript
const { register, control } = useForm();

// Native input -- use register (web only)
<input {...register('name', { required: true })} />

// Material UI -- use Controller
<Controller name="email" control={control}
  render={({ field }) => <TextField {...field} />} />
```

---

## Cross-References

- **useForm options:** See `02-api-useform.md`
- **Validation rules details:** See `05-validation-rules.md`
- **useController hook:** See `07-custom-hooks-context.md`
- **Advanced methods:** See `04-api-advanced-methods.md`
- **Patterns:** See `08-patterns-implementation.md`

---

**Version:** 7.71.2 | **Source:** https://react-hook-form.com/docs/useform/register
