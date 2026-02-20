# API Reference: register() & Controller

> Field registration API, inline validation rules, and Controller component for UI libraries.

**Source:** [https://react-hook-form.com/api/useform/register](https://react-hook-form.com/api/useform/register)

---

## register() Function

### Basic Registration

**Description:** Connect HTML inputs to form state using the spread operator.

```typescript
const { register } = useForm();

// Text input
<input {...register('email')} />

// Password input
<input {...register('password')} type="password" />

// Textarea
<textarea {...register('message')} />

// Select dropdown
<select {...register('category')}>
  <option value="">Select...</option>
  <option value="sports">Sports</option>
  <option value="music">Music</option>
</select>

// Checkbox
<input {...register('agreeToTerms')} type="checkbox" />

// Radio buttons
<label>
  <input {...register('gender')} type="radio" value="male" />
  Male
</label>
<label>
  <input {...register('gender')} type="radio" value="female" />
  Female
</label>
```

---

## Inline Validation Rules

### Overview

Pass validation rules as the second argument to `register()`. See `05-validation-rules.md` for detailed rule reference.

### required

**Description:** Field must have a value.

```typescript
// With custom message
<input {...register('email', { required: 'Email is required' })} />

// Boolean (generic error)
<input {...register('email', { required: true })} />
```

---

### min & max

**Description:** Numeric bounds validation.

```typescript
<input
  type="number"
  {...register('age', {
    min: { value: 18, message: 'Must be 18 or older' }
  })}
/>

<input
  type="number"
  {...register('rating', {
    max: { value: 5, message: 'Max rating is 5' }
  })}
/>
```

---

### minLength & maxLength

**Description:** String length validation.

```typescript
<input
  {...register('password', {
    minLength: { value: 8, message: 'Minimum 8 characters' }
  })}
  type="password"
/>

<input
  {...register('username', {
    maxLength: { value: 20, message: 'Maximum 20 characters' }
  })}
/>
```

---

### pattern

**Description:** Regex pattern matching.

```typescript
{/* Email */}
<input
  {...register('email', {
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email format'
    }
  })}
/>

{/* Phone (10 digits) */}
<input
  {...register('phone', {
    pattern: {
      value: /^\d{10}$/,
      message: 'Phone must be 10 digits'
    }
  })}
/>

{/* Alphanumeric only */}
<input
  {...register('username', {
    pattern: {
      value: /^[a-zA-Z0-9]+$/,
      message: 'Only letters and numbers allowed'
    }
  })}
/>
```

---

### validate

**Description:** Custom validation function.

```typescript
{/* Single validation */}
<input
  {...register('password', {
    validate: (value) =>
      value.length >= 8 || 'Password must be 8+ characters'
  })}
/>

{/* Async validation (e.g., check email availability) */}
<input
  {...register('email', {
    validate: async (value) => {
      const response = await fetch(`/api/check-email?email=${value}`);
      const { available } = await response.json();
      return available || 'Email already taken';
    }
  })}
/>

{/* Multiple validations */}
<input
  {...register('username', {
    validate: {
      minLength: (v) => v.length >= 3 || 'Min 3 characters',
      unique: async (v) => !(await checkUserExists(v)) || 'Username taken',
      pattern: (v) => /^[a-z0-9_]+$/.test(v) || 'Invalid format'
    }
  })}
/>
```

---

### disabled

**Description:** Disable field input.

```typescript
// Always disabled
<input {...register('readonly', { disabled: true })} />

// Conditionally disabled
const isAdmin = user?.role === 'admin';
<input {...register('role', { disabled: !isAdmin })} />
```

**Important:** Disabled fields are NOT included in form submission.

---

### Value Transformations

### valueAsNumber

**Description:** Convert string input to number automatically.

```typescript
<input
  type="text"
  {...register('age', { valueAsNumber: true })}
/>
{/* Input "25" becomes number 25 */}
```

---

### valueAsDate

**Description:** Convert to Date object automatically.

```typescript
<input
  type="date"
  {...register('birthDate', { valueAsDate: true })}
/>
{/* Selected date becomes Date object */}
```

---

### setValueAs

**Description:** Custom value transformation function.

```typescript
{/* Trim whitespace */}
<input
  {...register('name', {
    setValueAs: (value) => value.trim()
  })}
/>

{/* Convert to lowercase */}
<input
  {...register('email', {
    setValueAs: (value) => value.toLowerCase()
  })}
/>

{/* Parse JSON */}
<input
  {...register('metadata', {
    setValueAs: (value) => JSON.parse(value)
  })}
/>
```

---

## Controller Component

**Description:** Use Controller for UI component libraries that don't expose a ref (Material-UI, Chakra UI, React Select).

### Basic Usage

```typescript
import { useForm, Controller } from 'react-hook-form';
import { TextField } from '@mui/material';

const { control, handleSubmit } = useForm();

<form onSubmit={handleSubmit((data) => console.log(data))}>
  <Controller
    name="email"
    control={control}
    rules={{ required: 'Email required' }}
    render={({ field, fieldState: { error } }) => (
      <TextField
        {...field}
        label="Email"
        error={!!error}
        helperText={error?.message}
      />
    )}
  />
</form>
```

---

### Controller Props

| Prop | Type | Description |
|---|---|---|
| `name` | string | Field name |
| `control` | Control | Form control object (from useForm) |
| `rules` | object | Validation rules (same as register) |
| `render` | function | Render function receiving field and state |
| `defaultValue` | any | Override form's defaultValue for this field |
| `shouldUnregister` | boolean | Unregister field on unmount |

---

### Complete Example with Material-UI

```typescript
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import {
  TextField,
  Button,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';

interface FormData {
  email: string;
  category: string;
  agreeToTerms: boolean;
}

export function MyForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      category: '',
      agreeToTerms: false
    }
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Text field with validation */}
      <Controller
        name="email"
        control={control}
        rules={{
          required: 'Email required',
          pattern: {
            value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Invalid email'
          }
        }}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            label="Email"
            type="email"
            error={!!error}
            helperText={error?.message}
            fullWidth
            margin="normal"
          />
        )}
      />

      {/* Select field */}
      <Controller
        name="category"
        control={control}
        rules={{ required: 'Category required' }}
        render={({ field, fieldState: { error } }) => (
          <Select
            {...field}
            label="Category"
            error={!!error}
            fullWidth
            margin="normal"
          >
            <MenuItem value="">Select a category</MenuItem>
            <MenuItem value="sports">Sports</MenuItem>
            <MenuItem value="music">Music</MenuItem>
            <MenuItem value="tech">Technology</MenuItem>
          </Select>
        )}
      />

      {/* Checkbox */}
      <Controller
        name="agreeToTerms"
        control={control}
        rules={{ required: 'You must agree to terms' }}
        render={({ field, fieldState: { error } }) => (
          <FormControlLabel
            {...field}
            control={<Checkbox />}
            label="I agree to terms and conditions"
          />
        )}
      />

      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        fullWidth
        sx={{ mt: 2 }}
      >
        {isSubmitting ? 'Submitting...' : 'Submit'}
      </Button>
    </form>
  );
}
```

---

### Controller with Custom Date Picker

```typescript
import { useForm, Controller } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface FormData {
  startDate: Date;
  endDate: Date;
}

export function DateRangeForm() {
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: {
      startDate: new Date(),
      endDate: new Date()
    }
  });

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <Controller
        name="startDate"
        control={control}
        rules={{ required: 'Start date required' }}
        render={({ field }) => (
          <DatePicker
            selected={field.value}
            onChange={(date) => field.onChange(date)}
            onBlur={field.onBlur}
            dateFormat="yyyy-MM-dd"
          />
        )}
      />

      <Controller
        name="endDate"
        control={control}
        rules={{ required: 'End date required' }}
        render={({ field }) => (
          <DatePicker
            selected={field.value}
            onChange={(date) => field.onChange(date)}
            onBlur={field.onBlur}
            dateFormat="yyyy-MM-dd"
          />
        )}
      />

      <button type="submit">Submit</button>
    </form>
  );
}
```

---

## Patterns & Best Practices

### Combining register() and Controller

Use `register()` for native HTML elements, `Controller` for UI library components:

```typescript
const { register, control, handleSubmit } = useForm();

<form onSubmit={handleSubmit((data) => console.log(data))}>
  {/* Native input - use register */}
  <input {...register('name', { required: true })} />

  {/* Material-UI - use Controller */}
  <Controller
    name="email"
    control={control}
    rules={{ required: true }}
    render={({ field }) => <TextField {...field} />}
  />
</form>
```

### Reusable Validated Components

```typescript
// Custom TextInput component
interface TextInputProps {
  label: string;
  error?: string;
  [key: string]: any;
}

function TextInput({ label, error, ...props }: TextInputProps) {
  return (
    <div>
      <label>{label}</label>
      <input {...props} />
      {error && <p className="error">{error}</p>}
    </div>
  );
}

// Use in form
const { register, formState: { errors } } = useForm();

<TextInput
  label="Email"
  error={errors.email?.message}
  {...register('email', { required: 'Email required' })}
/>
```

---

## Cross-References

- **Validation rules:** See `05-validation-rules.md`
- **Advanced methods:** See `04-api-advanced-methods.md`
- **Custom hooks & context:** See `07-custom-hooks-context.md`
- **Patterns:** See `08-patterns-implementation.md`
- **Best practices:** See `09-best-practices.md`

---

**Source:** https://react-hook-form.com/api/useform/register
