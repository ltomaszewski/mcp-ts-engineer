# API Reference: Advanced Methods

> Advanced form methods for state management, dynamic fields, and programmatic control.

**Source:** [https://react-hook-form.com/api](https://react-hook-form.com/api)

---

## useFieldArray Hook

### Overview

**Description:** Manage dynamic form fields (arrays of inputs).

```typescript
import { useForm, useFieldArray } from 'react-hook-form';

interface FormData {
  addresses: { street: string; city: string }[];
}

export function DynamicForm() {
  const { register, control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      addresses: [{ street: '', city: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'addresses'
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      {fields.map((field, index) => (
        <div key={field.id}>
          <input {...register(`addresses.${index}.street`)} placeholder="Street" />
          <input {...register(`addresses.${index}.city`)} placeholder="City" />
          <button type="button" onClick={() => remove(index)}>
            Remove
          </button>
        </div>
      ))}

      <button type="button" onClick={() => append({ street: '', city: '' })}>
        + Add Address
      </button>

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

### useFieldArray Methods

#### append()

**Description:** Add field to end of array.

```typescript
const { fields, append } = useFieldArray({ control, name: 'items' });

// Add single item
append({ name: '', value: '' });

// Add multiple items at once
append([
  { name: 'Item 1', value: '' },
  { name: 'Item 2', value: '' }
]);

// With focus on new field
append({ name: '', value: '' }, { shouldFocus: true });
```

---

#### prepend()

**Description:** Add field to start of array.

```typescript
const { prepend } = useFieldArray({ control, name: 'items' });

prepend({ name: '', value: '' });
```

---

#### insert()

**Description:** Insert field at specific index.

```typescript
const { insert } = useFieldArray({ control, name: 'items' });

// Insert at index 2
insert(2, { name: '', value: '' });

// Insert multiple at index 1
insert(1, [
  { name: 'Item A', value: '' },
  { name: 'Item B', value: '' }
]);
```

---

#### remove()

**Description:** Remove field by index or indices.

```typescript
const { remove } = useFieldArray({ control, name: 'items' });

// Remove single
remove(0);

// Remove multiple
remove([0, 2]);

// Remove all
remove();
```

---

#### move()

**Description:** Move field from one index to another.

```typescript
const { move } = useFieldArray({ control, name: 'items' });

// Move from index 0 to index 2
move(0, 2);
```

---

#### swap()

**Description:** Swap positions of two fields.

```typescript
const { swap } = useFieldArray({ control, name: 'items' });

// Swap indexes 0 and 1
swap(0, 1);
```

---

#### update()

**Description:** Update field at specific index without removing/re-adding.

```typescript
const { update } = useFieldArray({ control, name: 'items' });

// Update item at index 1
update(1, { name: 'Updated Item', value: 'new-value' });
```

**Note:** `update` replaces the entire field object at the given index. Unlike `setValue`, it preserves the field's `id` for stable rendering.

---

#### replace()

**Description:** Replace entire array.

```typescript
const { replace } = useFieldArray({ control, name: 'items' });

replace([
  { name: 'Item 1', value: '' },
  { name: 'Item 2', value: '' }
]);
```

---

### useFieldArray Methods Summary

| Method | Signature | Description |
|--------|-----------|-------------|
| `fields` | `FieldArrayWithId[]` | Array of field objects with unique `id` |
| `append` | `(obj \| obj[], opts?) => void` | Add to end |
| `prepend` | `(obj \| obj[], opts?) => void` | Add to start |
| `insert` | `(index, obj \| obj[], opts?) => void` | Insert at index |
| `remove` | `(index?) => void` | Remove by index (or all) |
| `move` | `(from, to) => void` | Move field position |
| `swap` | `(indexA, indexB) => void` | Swap two fields |
| `update` | `(index, obj) => void` | Update field at index |
| `replace` | `(obj[]) => void` | Replace entire array |

---

## useWatch Hook

### Overview

**Description:** Subscribe to specific fields efficiently (better than `watch()`).

```typescript
import { useWatch } from 'react-hook-form';

const { control } = useForm();

// Watch single field
const email = useWatch({ control, name: 'email' });

// Watch multiple fields
const { email, password } = useWatch({
  control,
  name: ['email', 'password']
});

// Watch with default value
const name = useWatch({
  control,
  name: 'name',
  defaultValue: 'John'
});
```

**Performance Note:** `useWatch` only re-renders on watched field changes, unlike `watch()`.

---

## resetField()

**Description:** Reset single field to default value.

```typescript
import { useForm } from 'react-hook-form';

const { resetField } = useForm({
  defaultValues: { email: 'john@example.com' }
});

// Reset to original default
resetField('email');

// Reset with new default
resetField('email', { defaultValue: 'jane@example.com' });

// Reset specific aspects
resetField('email', { keepError: true }); // Keep validation errors
resetField('email', { keepDirty: true }); // Keep dirty state
```

---

## getFieldState()

**Description:** Get metadata for specific field.

```typescript
import { useForm } from 'react-hook-form';

const { getFieldState } = useForm();

const emailState = getFieldState('email');
// Returns: { invalid, isDirty, isTouched, error }

const {
  invalid,      // boolean - field has error
  isDirty,      // boolean - field changed
  isTouched,    // boolean - field touched by user
  error         // error object or undefined
} = emailState;

if (emailState.isTouched && emailState.invalid) {
  console.log('Show error to user');
}
```

---

## useFormContext()

**Description:** Access form state from nested components without prop drilling.

```typescript
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

// Child component
function EmailField() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div>
      <input {...register('email', { required: 'Required' })} />
      {errors.email && <p>{errors.email.message}</p>}
    </div>
  );
}

// Parent form
export function MyForm() {
  const methods = useForm();

  const onSubmit = (data) => console.log(data);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <EmailField />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}
```

---

## useFormState()

**Description:** Selectively subscribe to form state properties (performance optimization).

```typescript
import { useFormState } from 'react-hook-form';

const { control } = useForm();

const { isDirty, isValid, errors } = useFormState({ control });

// Only re-renders when isDirty, isValid, or errors change
```

**Use when:** You only need specific formState properties and want to prevent unnecessary re-renders.

---

## useController()

**Description:** Lower-level API for building custom controlled inputs.

```typescript
import { useController, Control } from 'react-hook-form';

interface CustomInputProps {
  control: Control;
  name: string;
  label: string;
}

function CustomInput({ control, name, label }: CustomInputProps) {
  const { field, fieldState: { error } } = useController({
    name,
    control,
    rules: { required: 'This field is required' }
  });

  return (
    <div>
      <label>{label}</label>
      <input
        {...field}
        placeholder={label}
        className={error ? 'error' : ''}
      />
      {error && <p className="error-message">{error.message}</p>}
    </div>
  );
}

// Usage
const { control } = useForm();
<CustomInput control={control} name="email" label="Email" />
```

---

## setFocus()

**Description:** Programmatically focus a registered field.

```typescript
const { setFocus } = useForm();

// Focus email field
setFocus('email');

// Focus and select text
setFocus('email', { shouldSelect: true });

// Focus first field on mount
useEffect(() => {
  setFocus('firstName');
}, [setFocus]);
```

---

## unregister()

**Description:** Unregister a field or fields from the form.

```typescript
const { unregister } = useForm();

unregister('email');                 // single field
unregister(['email', 'password']);   // multiple fields
unregister('email', { keepValue: true }); // keep value in form state
```

---

## Advanced Patterns

### Conditional Validation with watch()

```typescript
const { register, watch, formState: { errors } } = useForm();
const userType = watch('userType');

<form>
  <select {...register('userType')}>
    <option value="individual">Individual</option>
    <option value="business">Business</option>
  </select>

  {userType === 'business' && (
    <input
      {...register('companyName', {
        required: 'Company name required'
      })}
      placeholder="Company name"
    />
  )}

  {errors.companyName && <p>{errors.companyName.message}</p>}
</form>
```

---

### Dependent Field Validation

```typescript
const { register, watch, formState: { errors } } = useForm();
const password = watch('password');

<div>
  <input {...register('password', { required: true })} type="password" />

  <input
    {...register('confirmPassword', {
      validate: (value) =>
        value === password || 'Passwords do not match'
    })}
    type="password"
  />

  {errors.confirmPassword && (
    <p>{errors.confirmPassword.message}</p>
  )}
</div>
```

---

### Dynamic Validation Rules

```typescript
const { register, watch, formState: { errors } } = useForm();
const isAdult = watch('isAdult');

<div>
  <label>
    <input {...register('isAdult')} type="checkbox" />
    I'm 18 or older
  </label>

  {isAdult && (
    <input
      {...register('drivingLicense', {
        required: 'License required for adults'
      })}
    />
  )}

  {errors.drivingLicense && <p>{errors.drivingLicense.message}</p>}
</div>
```

---

### Form Submission with Server Validation

```typescript
const { register, handleSubmit, setError, formState: { isSubmitting } } = useForm();

const onSubmit = async (data) => {
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errors = await response.json();
      // Set server-side errors
      Object.entries(errors).forEach(([field, message]) => {
        setError(field, { type: 'server', message });
      });
      return;
    }

    // Success
  } catch (error) {
    setError('root.serverError', {
      type: 'server',
      message: 'Something went wrong'
    });
  }
};

<form onSubmit={handleSubmit(onSubmit)}>
  {/* fields */}
</form>
```

---

## Complete Dynamic Form Example

```typescript
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';

interface PhoneNumber {
  type: 'home' | 'work' | 'mobile';
  number: string;
}

interface ContactForm {
  name: string;
  email: string;
  phones: PhoneNumber[];
}

export function ContactForm() {
  const { register, control, handleSubmit, formState: { errors } } = useForm<ContactForm>({
    defaultValues: {
      name: '',
      email: '',
      phones: [{ type: 'mobile', number: '' }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'phones'
  });

  const onSubmit: SubmitHandler<ContactForm> = (data) => {
    console.log('Form data:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Name</label>
        <input
          {...register('name', { required: 'Name required' })}
          placeholder="Full name"
        />
        {errors.name && <p className="error">{errors.name.message}</p>}
      </div>

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
          placeholder="email@example.com"
        />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>

      <fieldset>
        <legend>Phone Numbers</legend>
        {fields.map((field, index) => (
          <div key={field.id} className="phone-field">
            <select {...register(`phones.${index}.type`)}>
              <option value="mobile">Mobile</option>
              <option value="home">Home</option>
              <option value="work">Work</option>
            </select>

            <input
              {...register(`phones.${index}.number`, {
                required: 'Phone number required',
                pattern: {
                  value: /^\d{10}$/,
                  message: 'Must be 10 digits'
                }
              })}
              placeholder="1234567890"
            />

            <button type="button" onClick={() => remove(index)}>
              Remove
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={() => append({ type: 'mobile', number: '' })}
        >
          + Add Phone
        </button>
      </fieldset>

      <button type="submit">Save Contact</button>
    </form>
  );
}
```

---

## Cross-References

- **useForm hook:** See `02-api-useform.md`
- **Validation rules:** See `05-validation-rules.md`
- **Custom hooks:** See `07-custom-hooks-context.md`
- **Patterns:** See `08-patterns-implementation.md`
- **Best practices:** See `09-best-practices.md`

---

**Version:** 7.71.2 | **Source:** https://react-hook-form.com/api
