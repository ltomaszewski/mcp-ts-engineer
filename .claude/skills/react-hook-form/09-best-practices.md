# Best Practices & Performance

> Optimization strategies, re-render prevention, and production-ready patterns.

---

## Performance Optimization

### 1. Use useWatch Instead of watch()

❌ **Bad - causes full re-render:**
```typescript
const { watch } = useForm();
const allValues = watch(); // Watches ALL fields

// Component re-renders on ANY field change
```

✅ **Good - targeted subscription:**
```typescript
import { useWatch } from 'react-hook-form';

const { control } = useForm();
const email = useWatch({ control, name: 'email' }); // Only watches email
```

**Impact:** Reduces re-renders dramatically for forms with many fields.

---

### 2. Provide defaultValues

```typescript
// ❌ Bad - undefined behavior
const { register } = useForm();

// ✅ Good - predictable form state
const { register } = useForm({
  defaultValues: {
    email: '',
    password: '',
    agreeToTerms: false
  }
});
```

**Why:** Ensures form is properly initialized and controlled.

---

### 3. Type Your Forms

```typescript
// ❌ Bad - no type safety
const { register } = useForm();
<input {...register('nonexistentField')} />

// ✅ Good - full IntelliSense
interface LoginForm {
  email: string;
  password: string;
}

const { register } = useForm<LoginForm>();
<input {...register('email')} /> // Type-safe
```

---

### 4. Choose Correct Validation Mode

```typescript
// Simple form - validate only on submit
useForm({ mode: 'onSubmit' });

// Desktop forms - validate on blur
useForm({ mode: 'onBlur' });

// Real-time feedback - validate on change
useForm({ mode: 'onChange' });
```

**Performance impact:** `onChange` triggers validation on every keystroke.

---

### 5. Debounce Async Validators

```typescript
import { debounce } from 'lodash';

const checkEmailAvailable = async (value: string) => {
  const response = await fetch(`/api/check-email?email=${value}`);
  const { available } = await response.json();
  return available || 'Email already taken';
};

// Debounce to 500ms to avoid excessive API calls
const debouncedCheck = debounce(checkEmailAvailable, 500);

<input
  {...register('email', {
    validate: debouncedCheck
  })}
/>
```

---

### 6. Split Large Forms with FormProvider

❌ **Bad - monolithic form component:**
```typescript
// 200+ lines in single component
export function HugeForm() {
  const { register, control } = useForm();

  return (
    <form>
      {/* 100+ fields */}
    </form>
  );
}
```

✅ **Good - split into sections:**
```typescript
export function LargeForm() {
  const methods = useForm();

  return (
    <FormProvider {...methods}>
      <form>
        <PersonalInfoSection />
        <AddressSection />
        <PaymentSection />
        <SubmitButton />
      </form>
    </FormProvider>
  );
}
```

**Benefit:** Better code organization, easier testing, independent re-renders.

---

### 7. Use useFormState for Selective Subscriptions

```typescript
// ❌ Subscribes to all formState changes
const { formState } = useForm();

// ✅ Subscribe only to needed properties
const { isDirty, isValid } = useFormState({ control });
```

---

### 8. Prefer Form-Level validate for Cross-Field Checks

```typescript
// ❌ Using watch + custom validate on each field
const password = watch('password');
<input {...register('confirm', {
  validate: (v) => v === password || 'Must match',
})} />

// ✅ Form-level validate (7.72.0+) -- cleaner, no watch needed
useForm({
  validate: (data) => {
    const errors: Record<string, { type: string; message: string }> = {};
    if (data.password !== data.confirm) {
      errors.confirm = { type: 'validate', message: 'Must match' };
    }
    return { values: Object.keys(errors).length ? {} : data, errors };
  },
});
```

**Benefit:** Eliminates re-renders from `watch()` and co-locates cross-field logic.

---

## Memory Management

### Unregister Fields on Unmount

```typescript
const { register } = useForm();

// Conditional field that may unmount
{condition && (
  <input {...register('conditionalField', { shouldUnregister: true })} />
)}
```

**Note:** Use `shouldUnregister: true` in Controller for same behavior.

---

### Clean Up Async Validators

```typescript
<input
  {...register('email', {
    validate: async (value) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      try {
        const response = await fetch(
          `/api/check-email?email=${value}`,
          { signal: controller.signal }
        );
        clearTimeout(timeoutId);
        const { available } = await response.json();
        return available || 'Email taken';
      } catch (error) {
        clearTimeout(timeoutId);
        return 'Error checking email';
      }
    }
  })}
/>
```

---

## Best Practices Summary

### DO:

✅ Always provide `defaultValues`
✅ Type your forms with TypeScript
✅ Use `useWatch` instead of `watch()`
✅ Use `getValues()` for reading without subscription
✅ Use `setValue()` for programmatic updates
✅ Debounce async validators
✅ Split large forms with `FormProvider`
✅ Validate only what's necessary
✅ Show errors only after user interaction
✅ Test forms with React Testing Library

---

### DON'T:

❌ Watch all fields at once
❌ Forget `defaultValues`
❌ Mix controlled and uncontrolled logic carelessly
❌ Validate excessively on every keystroke
❌ Store form data in Redux if using React Hook Form
❌ Validate without user feedback
❌ Make disabled fields appear in submission
❌ Overuse async validation
❌ Ignore TypeScript
❌ Create overly complex validation logic

---

## Validation Strategy

### Tier 1: Quick Client-Side (Always)
```typescript
// Fast, local validation
{ required: 'Field required' }
{ minLength: { value: 8 } }
{ pattern: { value: /regex/ } }
```

### Tier 2: Async Server Validation (Selective)
```typescript
// Only for fields that need server verification
validate: async (value) => {
  const available = await checkAvailability(value);
  return available || 'Already taken';
}
```

### Tier 3: Server Validation (On Submit)
```typescript
// Catch business logic errors after submission
try {
  const response = await submitForm(data);
  // Set field-specific errors from response
} catch (error) {
  setError('field', { type: 'server', message: error });
}
```

---

## Error Display Strategy

### Show errors conditionally:

```typescript
const { formState: { errors, isSubmitted, touchedFields } } = useForm();

// Option 1: Show on submit only
{isSubmitted && errors.email && <p>{errors.email.message}</p>}

// Option 2: Show after touch
{touchedFields.email && errors.email && <p>{errors.email.message}</p>}

// Option 3: Show after blur (with mode: 'onBlur')
{errors.email && <p>{errors.email.message}</p>}
```

---

## Testing Strategy

### Unit test form logic:
```typescript
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('displays error when email is invalid', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);

  const emailInput = screen.getByRole('textbox', { name: /email/i });
  await user.type(emailInput, 'invalid-email');
  await user.tab();

  expect(screen.getByText('Invalid email')).toBeInTheDocument();
});
```

See `11-security-testing.md` for complete testing guide.

---

## Common Performance Pitfalls

### Pitfall 1: Creating New Objects in Defaultvalues
```typescript
// ❌ Bad - creates new object on every render
const { register } = useForm({
  defaultValues: {
    user: { name: '', email: '' } // New object each time
  }
});

// ✅ Good - object created once
const defaultUser = useMemo(
  () => ({ user: { name: '', email: '' } }),
  []
);
const { register } = useForm({ defaultValues: defaultUser });
```

---

### Pitfall 2: Watching All Fields
```typescript
// ❌ Bad - full re-render
export function Form() {
  const { watch } = useForm();
  const values = watch(); // Watches everything

  return <p>{JSON.stringify(values)}</p>; // Updates on every field change
}

// ✅ Good - targeted watch
export function Form() {
  const { control } = useForm();
  const email = useWatch({ control, name: 'email' }); // Only email

  return <p>{email}</p>;
}
```

---

### Pitfall 3: Unnecessary Re-renders in Child Components
```typescript
// ❌ Bad - child re-renders with parent
function ParentForm() {
  const { watch, register } = useForm();
  const email = watch('email');

  return (
    <div>
      <ExpensiveComponent value={email} /> {/* Re-renders on every field change */}
    </div>
  );
}

// ✅ Good - memoize child
const MemoizedExpensiveComponent = React.memo(ExpensiveComponent);

function ParentForm() {
  const { watch, register } = useForm();
  const email = watch('email');

  return (
    <div>
      <MemoizedExpensiveComponent value={email} /> {/* Only re-renders when email changes */}
    </div>
  );
}
```

---

## Caching & Reusability

### Create reusable form configuration:

```typescript
// forms/config.ts
export const createFormConfig = (defaultValues: any) => ({
  mode: 'onBlur' as const,
  defaultValues,
  shouldFocusError: true,
  // ... common config
});

// Usage
const { register } = useForm(createFormConfig({
  email: '',
  password: ''
}));
```

---

## Cross-References

- **Patterns:** See `08-patterns-implementation.md`
- **Validation:** See `05-validation-rules.md` and `06-validation-schemas.md`
- **Testing:** See `11-security-testing.md`

---

**Version:** 7.72.1 | **Source:** https://react-hook-form.com/faqs
