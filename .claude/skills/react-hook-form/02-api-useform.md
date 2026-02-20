# API Reference: useForm Hook

> Complete reference for the useForm hook, its configuration options, and return values.

**Source:** [https://react-hook-form.com/api/useform](https://react-hook-form.com/api/useform)

---

## Overview

The `useForm` hook is the foundation of React Hook Form. It returns methods and properties to manage form state, validation, and submission.

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';

interface FormData {
  email: string;
  password: string;
}

export function MyForm() {
  const { register, handleSubmit, formState } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* form content */}
    </form>
  );
}
```

---

## useForm Configuration Options

### mode: Validation Timing

**Description:** Determines when validation runs.

| Mode | When Validates | Use Case |
|------|---|---|
| `onSubmit` | Form submission only | Default, simple forms, reduce noise |
| `onBlur` | Field loses focus | Desktop forms, progressive validation |
| `onChange` | Every keystroke | Real-time feedback, live validation |
| `onTouched` | After blur, then on change | Balanced UX, show errors after interaction |
| `all` | Every change + submission | Critical validation, strict forms |

**Example:**
```typescript
// Validate on blur (desktop UX)
const { register } = useForm({ mode: 'onBlur' });

// Validate in real-time (live feedback)
const { register } = useForm({ mode: 'onChange' });
```

---

### defaultValues: Initial Form State

**Description:** Set initial values for form fields.

```typescript
// Static defaults
useForm({
  defaultValues: {
    email: 'john@example.com',
    password: '',
    rememberMe: true
  }
});

// Async defaults (from API)
useForm({
  defaultValues: async () => {
    const response = await fetch('/api/user/me');
    return response.json();
  }
});

// Type-safe with interface
interface UserForm {
  email: string;
  firstName: string;
  lastName: string;
}

useForm<UserForm>({
  defaultValues: {
    email: '',
    firstName: 'John',
    lastName: 'Doe'
  }
});
```

**Important:** Always provide defaultValues to ensure form behaves predictably.

---

### resolver: External Validation Library

**Description:** Integrate schema validation libraries (Yup, Zod, AJV).

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `resolver` | function | Validation function from @hookform/resolvers |
| `context` | object | Optional context passed to resolver |

**Yup Example:**
```typescript
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email required'),
  password: yup.string().min(8, 'Min 8 characters').required()
});

const { register } = useForm({
  resolver: yupResolver(schema)
});
```

**Zod Example:**
```typescript
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

const { register } = useForm({
  resolver: zodResolver(schema)
});
```

**Source:** https://github.com/react-hook-form/resolvers

---

### disabled: Disable All Inputs

**Description:** Disable all form fields at once.

```typescript
// Disable while submitting
const { disabled, formState: { isSubmitting } } = useForm();

return (
  <input disabled={isSubmitting} {...register('email')} />
);

// Or use useForm option
const { register } = useForm({ disabled: true });
```

---

## useForm Return Values

### Methods

#### register(name, rules)

**Description:** Connect HTML input to form state.

```typescript
<input {...register('email', { required: 'Email required' })} />
<textarea {...register('message')} />
<select {...register('category')}>
  <option>Select...</option>
</select>
```

See `03-api-register.md` for complete API.

---

#### handleSubmit(onSubmit, onError)

**Description:** Wrap form submission with validation and error handling.

```typescript
const onSubmit = (data) => console.log('Valid:', data);
const onError = (errors) => console.log('Invalid:', errors);

<form onSubmit={handleSubmit(onSubmit, onError)}>
  {/* fields */}
</form>
```

**Returns:** Function to pass to form's `onSubmit` prop.

---

#### watch(fieldNames)

**Description:** Subscribe to field changes. Use `useWatch` for better performance.

```typescript
// Watch all fields (causes re-render)
const allValues = watch();

// Watch specific field
const email = watch('email');

// Watch multiple fields
const [email, password] = watch(['email', 'password']);
```

**⚠️ Performance Note:** Watching all fields causes full re-renders. Use `useWatch` instead for targeted subscriptions.

---

#### control

**Description:** Internal form state object needed for `Controller` and `useFieldArray`.

```typescript
import { Controller } from 'react-hook-form';

const { control } = useForm();

<Controller
  name="email"
  control={control}
  render={({ field }) => <input {...field} />}
/>
```

See `07-custom-hooks-context.md` for detailed patterns.

---

### formState Object

**Description:** Read-only form metadata.

```typescript
const { formState } = useForm();

formState.isDirty        // Form changed from defaults
formState.isValid        // No validation errors
formState.isSubmitted    // Form submitted at least once
formState.isSubmitting   // Currently submitting
formState.errors         // Validation errors object
formState.touchedFields  // Fields touched by user
formState.dirtyFields    // Fields modified by user
formState.isValidating   // Currently validating (async rules)
formState.disabled       // Form disabled state
```

**Common usage:**
```typescript
const { formState: { errors, isDirty, isValid, isSubmitting } } = useForm();

{errors.email && <p className="error">{errors.email.message}</p>}
<button disabled={isSubmitting || !isValid}>Submit</button>
```

---

#### getValues(fieldName?)

**Description:** Read current form values without subscribing to changes.

```typescript
const { getValues } = useForm();

// Get all values
const allValues = getValues();

// Get specific field
const email = getValues('email');

// Get multiple fields
const { email, password } = getValues(['email', 'password']);

// Useful in event handlers
const handleSpecialAction = () => {
  const currentValues = getValues();
  console.log(currentValues);
};
```

**Note:** Does NOT cause re-renders. Use when you need current values in event handlers.

---

#### setValue(name, value, options)

**Description:** Set field values programmatically.

```typescript
const { setValue } = useForm();

// Set without validation
setValue('email', 'new@example.com');

// Set with validation
setValue('email', 'new@example.com', { shouldValidate: true });

// Set with dirty flag
setValue('email', 'new@example.com', { shouldDirty: true });

// Set with touch flag
setValue('email', 'new@example.com', { shouldTouch: true });

// Set multiple fields
setValue('email', 'test@example.com');
setValue('password', 'newpass');
```

**Options:**

| Option | Type | Description |
|---|---|---|
| `shouldValidate` | boolean | Trigger validation after setting |
| `shouldDirty` | boolean | Mark field as dirty |
| `shouldTouch` | boolean | Mark field as touched |

---

#### reset(values, options)

**Description:** Reset form to default or custom values.

```typescript
const { reset } = useForm({
  defaultValues: { email: 'john@example.com', password: '' }
});

// Reset to original defaults
reset();

// Reset to custom values
reset({ email: 'jane@example.com', password: '' });

// Reset without validation
reset(undefined, { keepValues: true });

// Keep dirty state
reset(undefined, { keepDirty: true });
```

**Options:**

| Option | Type | Description |
|---|---|---|
| `keepValues` | boolean | Keep form values, reset state only |
| `keepDefaultValues` | boolean | Update default values |
| `keepDirty` | boolean | Keep dirty state |
| `keepTouched` | boolean | Keep touched state |
| `keepIsSubmitted` | boolean | Keep submitted state |
| `keepIsValid` | boolean | Keep valid state |

---

#### trigger(fieldName?)

**Description:** Manually trigger validation on one or more fields.

```typescript
const { trigger } = useForm();

// Validate one field
const isValid = await trigger('email');

// Validate multiple fields
const isValid = await trigger(['email', 'password']);

// Validate all fields
const isValid = await trigger();

// Conditional validation
if (selectedCountry === 'US') {
  await trigger('zipCode');
}
```

**Returns:** Promise<boolean> — true if validation passes.

---

#### setError(name, error, options)

**Description:** Manually set field errors.

```typescript
const { setError } = useForm();

// Set custom error
setError('email', { type: 'manual', message: 'Email already exists' });

// Server-side error handling
try {
  const response = await submitForm(data);
} catch (error) {
  setError('email', { type: 'server', message: error.message });
}
```

---

#### clearErrors(fieldNames)

**Description:** Clear validation errors.

```typescript
const { clearErrors } = useForm();

// Clear one field
clearErrors('email');

// Clear multiple fields
clearErrors(['email', 'password']);

// Clear all errors
clearErrors();
```

---

## useForm Complete Example

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';

interface SignupForm {
  email: string;
  password: string;
  confirmPassword: string;
  agreeToTerms: boolean;
}

export function SignupForm() {
  const {
    register,
    handleSubmit,
    watch,
    getValues,
    setValue,
    reset,
    formState: { errors, isDirty, isSubmitting, isValid }
  } = useForm<SignupForm>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
      agreeToTerms: false
    }
  });

  const password = watch('password');

  const onSubmit: SubmitHandler<SignupForm> = async (data) => {
    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        reset();
      } else {
        throw new Error('Signup failed');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Email</label>
        <input
          {...register('email', {
            required: 'Email required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email'
            }
          })}
          type="email"
        />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>

      <div>
        <label>Password</label>
        <input
          {...register('password', {
            required: 'Password required',
            minLength: { value: 8, message: 'Min 8 characters' }
          })}
          type="password"
        />
        {errors.password && <p className="error">{errors.password.message}</p>}
      </div>

      <div>
        <label>Confirm Password</label>
        <input
          {...register('confirmPassword', {
            validate: (value) =>
              value === password || 'Passwords do not match'
          })}
          type="password"
        />
        {errors.confirmPassword && <p className="error">{errors.confirmPassword.message}</p>}
      </div>

      <div>
        <label>
          <input {...register('agreeToTerms', { required: true })} type="checkbox" />
          I agree to terms
        </label>
      </div>

      <button type="submit" disabled={isSubmitting || !isValid}>
        {isSubmitting ? 'Signing up...' : 'Sign Up'}
      </button>

      {isDirty && <p>You have unsaved changes</p>}
    </form>
  );
}
```

---

## Cross-References

- **Field registration:** See `03-api-register.md`
- **Validation rules:** See `05-validation-rules.md`
- **Schema-based validation:** See `06-validation-schemas.md`
- **Advanced methods:** See `04-api-advanced-methods.md`
- **Performance tips:** See `09-best-practices.md`

---

**Source:** https://react-hook-form.com/api/useform
