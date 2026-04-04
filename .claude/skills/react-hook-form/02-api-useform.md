# API Reference: useForm Hook

> Complete reference for the useForm hook -- all configuration options, return values, and formState properties.

**Source:** [https://react-hook-form.com/docs/useform](https://react-hook-form.com/docs/useform)

---

## Overview

The `useForm` hook is the foundation of React Hook Form. It manages form state, validation, and submission with minimal re-renders via a Proxy-based subscription model.

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';

interface FormData {
  email: string;
  password: string;
}

export function MyForm() {
  const { control, handleSubmit, formState: { errors } } = useForm<FormData>({
    defaultValues: { email: '', password: '' },
  });
  const onSubmit: SubmitHandler<FormData> = (data) => console.log(data);

  return <form onSubmit={handleSubmit(onSubmit)}>{/* fields */}</form>;
}
```

---

## useForm Configuration Options

### Complete Options Table

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `mode` | `'onSubmit' \| 'onBlur' \| 'onChange' \| 'onTouched' \| 'all'` | `'onSubmit'` | When validation triggers |
| `reValidateMode` | `'onChange' \| 'onBlur' \| 'onSubmit'` | `'onChange'` | When re-validation triggers after first submit |
| `defaultValues` | `FieldValues \| () => Promise<FieldValues>` | `undefined` | Initial form values (static or async) |
| `values` | `FieldValues` | `undefined` | Reactive values that update form when changed |
| `errors` | `FieldErrors` | `undefined` | Server-side errors to merge into form state |
| `resetOptions` | `KeepStateOptions` | `undefined` | Options for resetting when `values` or `defaultValues` change |
| `context` | `object` | `undefined` | Context object passed to resolver |
| `criteriaMode` | `'firstError' \| 'all'` | `'firstError'` | Display first error or all errors per field |
| `shouldFocusError` | `boolean` | `true` | Focus first field with error on submit |
| `shouldUnregister` | `boolean` | `false` | Unregister fields when they unmount |
| `shouldUseNativeValidation` | `boolean` | `false` | Use browser native validation |
| `delayError` | `number` | `undefined` | Delay error display in ms |
| `disabled` | `boolean` | `false` | Disable all form fields |
| `resolver` | `Resolver` | `undefined` | External validation resolver (Zod, Yup, etc.) |
| `validate` | `(data: TFieldValues) => Promise<{ values: TFieldValues; errors: FieldErrors }> \| { values: TFieldValues; errors: FieldErrors }` | `undefined` | Form-level validation function (new in 7.72.0) |

---

### mode: Validation Timing

| Mode | When Validates | Best For |
|------|---------------|----------|
| `onSubmit` | On form submission only | Default, simple forms |
| `onBlur` | When field loses focus | Desktop forms, progressive validation |
| `onChange` | Every keystroke/change | Real-time feedback |
| `onTouched` | After first blur, then on change | Balanced UX |
| `all` | Every change + submission | Strict validation |

```typescript
const { control } = useForm<FormData>({ mode: 'onBlur' });
const { control } = useForm<FormData>({ mode: 'onChange' });
```

---

### defaultValues: Initial Form State

```typescript
// Static defaults (recommended)
useForm<FormData>({
  defaultValues: { email: '', password: '', rememberMe: false },
});

// Async defaults (fetched from API)
useForm<FormData>({
  defaultValues: async () => {
    const response = await fetch('/api/user/me');
    return response.json();
  },
});
```

**Important:** Always provide `defaultValues` to prevent uncontrolled-to-controlled warnings and enable `isDirty` comparison.

---

### values: Reactive External Values

```typescript
// Form updates automatically when `values` prop changes
const { data } = useQuery({ queryKey: ['user'], queryFn: fetchUser });

const { control } = useForm<FormData>({
  values: data, // form resets when data changes
  resetOptions: { keepDirtyValues: true }, // preserve user edits
});
```

---

### errors: Server-Side Errors

```typescript
// Merge server errors into form state
const [serverErrors, setServerErrors] = useState({});

const { control } = useForm<FormData>({
  errors: serverErrors, // merged into formState.errors
});
```

---

### criteriaMode: All Errors Per Field

```typescript
// Show all validation errors for a field (not just first)
const { control, formState: { errors } } = useForm<FormData>({
  criteriaMode: 'all',
});

// Access all errors via errors.fieldName.types
// errors.password?.types?.minLength
// errors.password?.types?.pattern
```

---

### resolver: Schema Validation

```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const { control } = useForm<z.infer<typeof schema>>({
  resolver: zodResolver(schema),
});
```

---

### validate: Form-Level Validation (New in 7.72.0)

Enables form-level validation directly in `useForm`. The function receives the entire form data and must return an object with `values` and `errors` properties. Errors are merged into `formState.errors`.

```typescript
import { useForm } from 'react-hook-form';

interface CheckoutData {
  startDate: string;
  endDate: string;
  quantity: number;
  maxQuantity: number;
}

const { control, handleSubmit, formState: { errors } } = useForm<CheckoutData>({
  defaultValues: { startDate: '', endDate: '', quantity: 0, maxQuantity: 10 },
  validate: async (data) => {
    const errors: Record<string, { type: string; message: string }> = {};

    if (data.endDate && data.startDate && new Date(data.endDate) <= new Date(data.startDate)) {
      errors.endDate = { type: 'validate', message: 'End date must be after start date' };
    }
    if (data.quantity > data.maxQuantity) {
      errors.quantity = { type: 'validate', message: `Max quantity is ${data.maxQuantity}` };
    }

    return {
      values: Object.keys(errors).length === 0 ? data : {},
      errors,
    };
  },
});

// Access form-level errors via formState.errors
// errors.endDate?.message, errors.quantity?.message
```

**Key behavior:**
- The `validate` function is cached and re-invoked per field during user interaction
- Parent-level error checking is limited to the direct parent level (useful for group checkboxes)
- Returns `{ values, errors }` -- both default to `{}` when empty
- Can be async for server-side cross-field validation
- Works alongside `resolver` (resolver runs first, then `validate`)

---

### delayError: Delayed Error Display

```typescript
// Wait 500ms before showing errors (reduces flicker)
const { control } = useForm<FormData>({
  mode: 'onChange',
  delayError: 500,
});
```

---

### shouldUseNativeValidation: Browser Validation

```typescript
// Use browser's native validation UI (tooltips)
const { register } = useForm({
  shouldUseNativeValidation: true,
});
```

---

## useForm Return Values

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `register` | `(name, rules?) => { onChange, onBlur, ref, name }` | Connect HTML input to form |
| `handleSubmit` | `(onValid, onInvalid?) => (e?) => void` | Wrap submission with validation |
| `watch` | `(name?) => value` | Subscribe to field changes (causes re-renders) |
| `control` | `Control<T>` | Object for Controller, useFieldArray, useWatch |
| `getValues` | `(name?) => value` | Read values without re-rendering |
| `setValue` | `(name, value, opts?) => void` | Set value programmatically |
| `reset` | `(values?, opts?) => void` | Reset form to defaults or new values |
| `trigger` | `(name?) => Promise<boolean>` | Manually trigger validation |
| `setError` | `(name, error, opts?) => void` | Set error manually |
| `clearErrors` | `(name?) => void` | Clear validation errors |
| `setFocus` | `(name, opts?) => void` | Focus a registered field |
| `unregister` | `(name?) => void` | Unregister field(s) |
| `resetField` | `(name, opts?) => void` | Reset a single field |

---

### handleSubmit(onValid, onInvalid?)

```typescript
const onSubmit: SubmitHandler<FormData> = (data) => console.log(data);
const onError: SubmitErrorHandler<FormData> = (errors) => console.log(errors);

<form onSubmit={handleSubmit(onSubmit, onError)}>{/* fields */}</form>

// React Native: use onPress
<Pressable onPress={handleSubmit(onSubmit)}><Text>Submit</Text></Pressable>
```

---

### setValue(name, value, options?)

| Option | Type | Description |
|--------|------|-------------|
| `shouldValidate` | `boolean` | Trigger validation after setting |
| `shouldDirty` | `boolean` | Mark field as dirty |
| `shouldTouch` | `boolean` | Mark field as touched |

```typescript
setValue('email', 'test@example.com', { shouldValidate: true, shouldDirty: true });
```

**7.72.1 fix:** `setValue` with `shouldDirty: true` no longer pollutes unrelated dirty fields. Previously, calling `setValue('fieldA', value, { shouldDirty: true })` could incorrectly mark other fields as dirty.

---

### reset(values?, options?)

| Option | Type | Description |
|--------|------|-------------|
| `keepValues` | `boolean` | Keep current values |
| `keepDefaultValues` | `boolean` | Keep default values reference |
| `keepDirty` | `boolean` | Preserve dirty state |
| `keepDirtyValues` | `boolean` | Keep only dirty field values |
| `keepTouched` | `boolean` | Preserve touched state |
| `keepIsSubmitted` | `boolean` | Keep submitted state |
| `keepIsValid` | `boolean` | Keep valid state |
| `keepErrors` | `boolean` | Keep current errors |
| `keepSubmitCount` | `boolean` | Keep submit count |

```typescript
reset(); // reset to defaultValues
reset({ email: 'new@test.com' }); // reset with new values
reset(undefined, { keepDirtyValues: true }); // keep user edits
```

---

### trigger(name?)

```typescript
const isValid = await trigger('email');           // one field
const isValid = await trigger(['email', 'name']); // multiple
const isValid = await trigger();                  // all fields
```

---

### setError(name, error, options?)

```typescript
setError('email', { type: 'manual', message: 'Email already exists' });
setError('root.serverError', { message: 'Server unavailable' });
```

---

### setFocus(name, options?)

```typescript
setFocus('email'); // focus email field
setFocus('email', { shouldSelect: true }); // focus and select text
```

---

## formState Properties

| Property | Type | Description |
|----------|------|-------------|
| `isDirty` | `boolean` | Any field differs from defaultValues |
| `dirtyFields` | `object` | Object of dirty field names |
| `touchedFields` | `object` | Object of touched field names |
| `defaultValues` | `object` | Default values (readonly) |
| `isSubmitted` | `boolean` | Form has been submitted at least once |
| `isSubmitSuccessful` | `boolean` | Last submit was successful |
| `isSubmitting` | `boolean` | Currently submitting |
| `isLoading` | `boolean` | Async defaultValues still loading |
| `submitCount` | `number` | Number of times form was submitted |
| `isValid` | `boolean` | No validation errors (requires mode or resolver) |
| `isValidating` | `boolean` | Currently running validation |
| `validatingFields` | `object` | Fields currently being validated |
| `errors` | `FieldErrors` | Validation errors object |
| `disabled` | `boolean` | Form disabled state |
| `isReady` | `boolean` | Form is ready (defaultValues loaded) |

```typescript
const {
  formState: {
    errors, isDirty, isValid, isSubmitting, isLoading, isReady,
    touchedFields, dirtyFields, submitCount,
  },
} = useForm<FormData>({
  mode: 'onChange', // isValid requires mode or resolver
  defaultValues: { email: '', password: '' },
});

// Disable submit until valid and not submitting
<button disabled={!isValid || isSubmitting}>Submit</button>

// Show loading while async defaults load
if (isLoading) return <Spinner />;

// Check if form is ready
if (!isReady) return null;
```

---

## Cross-References

- **Field registration and Controller:** See `03-api-register.md`
- **Validation rules:** See `05-validation-rules.md`
- **Schema validation (Zod):** See `06-validation-schemas.md`
- **watch, useFieldArray, resetField:** See `04-api-advanced-methods.md`
- **useFormContext, useController:** See `07-custom-hooks-context.md`
- **Performance optimization:** See `09-best-practices.md`

---

**Version:** 7.72.1 | **Source:** https://react-hook-form.com/docs/useform
