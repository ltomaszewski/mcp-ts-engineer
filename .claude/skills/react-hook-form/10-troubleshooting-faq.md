# Troubleshooting & FAQ

> Common issues, debugging strategies, and solutions.

---

## Common Issues & Solutions

### Issue 1: Values Not Updating

**Symptoms:** Form values don't change when you type, or `getValues()` returns old data.

**Solution 1: Check defaultValues**
```typescript
// ❌ Bad - no defaultValues
const { register } = useForm();

// ✅ Good - always provide defaultValues
const { register } = useForm({
  defaultValues: { email: '', password: '' }
});
```

**Solution 2: Use setValue Correctly**
```typescript
const { setValue } = useForm();

// ❌ May not trigger update immediately
setValue('email', 'new@example.com');

// ✅ Ensure update and validation
setValue('email', 'new@example.com', {
  shouldValidate: true,
  shouldDirty: true
});
```

**Solution 3: Check mode Setting**
```typescript
// If mode: 'onChange', watch for real-time updates
const { register, watch } = useForm({ mode: 'onChange' });
const values = watch();
```

---

### Issue 2: Validation Not Running

**Symptoms:** Validation rules are defined but errors don't appear.

**Cause 1: Wrong validation mode**
```typescript
// ❌ Default mode: 'onSubmit' - only validates on submit
const { register } = useForm();

// ✅ If you want real-time validation
const { register } = useForm({ mode: 'onChange' });
```

**Cause 2: Validator returns wrong type**
```typescript
// ❌ Wrong - doesn't return value
validate: (value) => {
  checkValue(value); // Missing return!
}

// ✅ Correct - returns boolean or error message
validate: (value) => value.length > 0 || 'Required'
```

**Cause 3: Async validator not handled**
```typescript
// ❌ Validation may timeout
validate: async (value) => {
  const response = await fetch('/api/check');
  return response.ok;
}

// ✅ Add timeout and error handling
validate: async (value) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('/api/check', { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok || 'Validation failed';
  } catch {
    return 'Error checking value';
  }
}
```

---

### Issue 3: useFieldArray Not Updating UI

**Symptoms:** Fields are added/removed but UI doesn't update.

**Solution 1: Use field.id as key**
```typescript
// ❌ Bad - index as key
{fields.map((field, index) => (
  <div key={index}>{/* May not re-render properly */}</div>
))}

// ✅ Good - use field.id
{fields.map((field, index) => (
  <div key={field.id}>{/* Re-renders correctly */}</div>
))}
```

**Solution 2: Ensure control is passed**
```typescript
// ❌ May not work without control
const { useFieldArray } = useForm();

// ✅ Always pass control
const { control } = useForm();
const { fields, append, remove } = useFieldArray({ control, name: 'items' });
```

---

### Issue 4: Controller Not Updating

**Symptoms:** Controller component doesn't update, onChange not called.

**Solution 1: Ensure onChange is called**
```typescript
// ❌ May not work with all components
<Controller
  name="date"
  control={control}
  render={({ field }) => (
    <DatePicker {...field} />
  )}
/>

// ✅ Explicitly call onChange
<Controller
  name="date"
  control={control}
  render={({ field }) => (
    <DatePicker
      selected={field.value}
      onChange={(date) => field.onChange(date)}
      onBlur={field.onBlur}
    />
  )}
/>
```

**Solution 2: Check component compatibility**
```typescript
// Some components require specific prop names
<Controller
  name="file"
  control={control}
  render={({ field: { onChange } }) => (
    <input
      type="file"
      onChange={(e) => onChange(e.target.files?.[0])}
    />
  )}
/>
```

---

### Issue 5: Form Resets Unexpectedly

**Symptoms:** Form clears after submit, values reset randomly.

**Solution: Control reset behavior**
```typescript
const { handleSubmit, reset, getValues } = useForm();

const onSubmit = async (data) => {
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (response.ok) {
      // Only reset on success
      reset();
    }
  } catch (error) {
    // Don't reset on error - keep data for correction
  }
};

<form onSubmit={handleSubmit(onSubmit)}>{/* ... */}</form>
```

---

### Issue 6: Disabled Fields Not Excluded

**Symptoms:** Disabled fields appear in form submission.

**Solution: Verify disabled state**
```typescript
// ❌ This might not work
const isDisabled = user?.role !== 'admin';
<input {...register('adminPanel', { disabled: isDisabled })} />

// ✅ Ensure boolean is true to disable
const isDisabled = user?.role !== 'admin'; // true = disabled
const { register } = useForm();
<input {...register('adminPanel', { disabled: isDisabled })} />

// Disabled fields are excluded from submission
const onSubmit = (data) => {
  console.log(data); // adminPanel not included
};
```

---

### Issue 7: Type Errors with TypeScript

**Symptoms:** Type errors when using form methods.

**Solution 1: Type useForm with interface**
```typescript
interface FormData {
  email: string;
  password: string;
}

// ❌ No type safety
const { register } = useForm();

// ✅ Full type safety
const { register } = useForm<FormData>();
```

**Solution 2: Type register fields**
```typescript
// ❌ Type error not caught
<input {...register('nonexistentField')} />

// ✅ TypeScript error - field not in interface
<input {...register('email')} /> // OK
<input {...register('nonexistent')} /> // TS Error!
```

**Solution 3: Use schema with type inference**
```typescript
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

type FormData = z.infer<typeof schema>; // Auto-inferred!

const { register } = useForm<FormData>({
  resolver: zodResolver(schema)
});
```

---

### Issue 8: Nested Field Errors Not Displayed

**Symptoms:** Can't access nested error messages.

**Solution: Navigate nested errors**
```typescript
const { formState: { errors } } = useForm();

// ❌ Unsafe - may crash
{errors.address.street.message}

// ✅ Safe with optional chaining
{errors.address?.street?.message}

// Or use a helper function
function getFieldError(errors: any, path: string) {
  return path.split('.').reduce((obj, key) => obj?.[key], errors)?.message;
}

{getFieldError(errors, 'address.street')}
```

---

## Debugging Techniques

### Technique 1: Log Form State
```typescript
const { register, formState, watch } = useForm();

// Log formState changes
useEffect(() => {
  console.log('FormState:', formState);
  console.log('Values:', watch());
}, [formState, watch]);
```

### Technique 2: Use React DevTools
1. Install React DevTools extension
2. Inspect form component
3. Check props for form state
4. Use "Highlight when updating" to see re-renders

### Technique 3: Add Console Logs to Validators
```typescript
<input
  {...register('email', {
    validate: (value) => {
      console.log('Validating email:', value);
      const result = value.includes('@') || 'Invalid email';
      console.log('Validation result:', result);
      return result;
    }
  })}
/>
```

---

## FAQ

### Q: What's the difference between watch() and useWatch()?

**A:** `watch()` re-renders the entire form on any field change, while `useWatch()` only re-renders the component subscribing to that specific field. Use `useWatch()` for better performance.

```typescript
// watch() - causes full re-render
const values = watch();

// useWatch() - only re-renders on email change
const email = useWatch({ control, name: 'email' });
```

---

### Q: Can I use React Hook Form with Redux?

**A:** Not recommended. React Hook Form is designed to manage form state independently. If you need Redux for global state, keep form state in React Hook Form only.

```typescript
// ❌ Anti-pattern - mixing state management
const { email } = useSelector(state => state.form);
const { register } = useForm({ defaultValue: { email } });

// ✅ Good - keep form state separate
const { register } = useForm({
  defaultValues: { email: '' }
});
```

---

### Q: How do I validate dependent fields?

**A:** Use the `validate` function with form values:

```typescript
<input
  {...register('password', { required: true })}
  type="password"
/>

<input
  {...register('confirmPassword', {
    validate: (value, formValues) =>
      value === formValues.password || 'Passwords do not match'
  })}
  type="password"
/>
```

---

### Q: How do I handle file uploads?

**A:** Access files from the input event:

```typescript
const { setValue } = useForm();

const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (files?.length) {
    setValue('file', files[0]);
  }
};

<input type="file" onChange={handleFileChange} />
```

---

### Q: How do I submit forms with files?

**A:** Use FormData:

```typescript
const onSubmit = async (data) => {
  const formData = new FormData();
  formData.append('file', data.file);
  formData.append('email', data.email);

  await fetch('/api/upload', {
    method: 'POST',
    body: formData // Don't set Content-Type, browser will set it
  });
};
```

---

### Q: How do I debounce validation?

**A:** Use lodash.debounce:

```typescript
import { debounce } from 'lodash';

const checkEmail = debounce(async (value) => {
  const response = await fetch(`/api/check?email=${value}`);
  const { available } = await response.json();
  return available || 'Email taken';
}, 500);

<input
  {...register('email', { validate: checkEmail })}
/>
```

---

### Q: Can I validate on custom events?

**A:** Use `trigger()` to manually validate:

```typescript
const { trigger, register } = useForm();

const handleCustomEvent = async () => {
  const isValid = await trigger('email');
  if (isValid) {
    // Email is valid
  }
};

<input {...register('email')} />
<button onClick={handleCustomEvent}>Custom Validation</button>
```

---

### Q: How do I access form state outside the form?

**A:** Use a ref:

```typescript
import { useRef } from 'react';

const formRef = useRef(null);
const { register, getValues } = useForm();

const getCurrentValues = () => {
  console.log(getValues()); // Get values without re-render
};

<form ref={formRef}>
  {/* fields */}
</form>

<button onClick={getCurrentValues}>Log Values</button>
```

---

## Cross-References

- **Validation:** See `05-validation-rules.md` and `06-validation-schemas.md`
- **Patterns:** See `08-patterns-implementation.md`
- **Best practices:** See `09-best-practices.md`

---

**Version:** 7.71.2 | **Source:** https://react-hook-form.com/faqs
