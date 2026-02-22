# Custom Hooks & Context Pattern

> Using useFormContext, FormProvider, and component composition for large forms.

**Source:** [https://react-hook-form.com/api/useformcontext](https://react-hook-form.com/api/useformcontext)

---

## FormProvider & useFormContext

### Problem Solved

Passing form context through multiple nested components without prop drilling:

```typescript
// ❌ Without FormProvider - prop drilling nightmare
<Form>
  <PersonalInfo register={register} errors={errors} />
    <AddressInfo register={register} errors={errors} />
      <ContactInfo register={register} errors={errors} />
</Form>

// ✅ With FormProvider - clean access anywhere
<FormProvider {...methods}>
  <Form>
    <PersonalInfo />
      <AddressInfo />
        <ContactInfo />
  </Form>
</FormProvider>
```

---

### Basic Setup

```typescript
import { FormProvider, useForm, useFormContext } from 'react-hook-form';

// Parent component
export function MyForm() {
  const methods = useForm({
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      address: {
        street: '',
        city: ''
      }
    }
  });

  const onSubmit = (data) => console.log(data);

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <PersonalSection />
        <AddressSection />
        <SubmitButton />
      </form>
    </FormProvider>
  );
}

// Child component (no props needed!)
function PersonalSection() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div>
      <input {...register('firstName', { required: true })} />
      {errors.firstName && <p>Required</p>}

      <input {...register('lastName', { required: true })} />
      {errors.lastName && <p>Required</p>}
    </div>
  );
}

function AddressSection() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <div>
      <input {...register('address.street', { required: true })} />
      {errors.address?.street && <p>Required</p>}

      <input {...register('address.city', { required: true })} />
      {errors.address?.city && <p>Required</p>}
    </div>
  );
}

function SubmitButton() {
  const { formState: { isSubmitting, isValid } } = useFormContext();

  return (
    <button type="submit" disabled={isSubmitting || !isValid}>
      {isSubmitting ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

---

## useController Hook

### When to Use

For building custom input components that integrate with React Hook Form:

```typescript
import { useController, Control } from 'react-hook-form';

interface CustomInputProps {
  control: Control;
  name: string;
  label: string;
  rules?: object;
}

export function CustomInput({
  control,
  name,
  label,
  rules
}: CustomInputProps) {
  const { field, fieldState: { error } } = useController({
    name,
    control,
    rules
  });

  return (
    <div className="field">
      <label>{label}</label>
      <input
        {...field}
        className={error ? 'error' : ''}
        placeholder={label}
      />
      {error && <p className="error-text">{error.message}</p>}
    </div>
  );
}

// Usage
const { control } = useForm();
<CustomInput control={control} name="email" label="Email" />
```

---

### useController Props

| Prop | Type | Description |
|---|---|---|
| `name` | string | Field name |
| `control` | Control | Form control object |
| `rules` | object | Validation rules |
| `defaultValue` | any | Override form defaultValue |
| `disabled` | boolean | Disable field |
| `shouldUnregister` | boolean | Unregister on unmount |

---

### Complete Custom Component Example

```typescript
import { useController, Control, FieldValues, Path } from 'react-hook-form';

interface SelectInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: { value: string; label: string }[];
  rules?: object;
}

export function SelectInput<T extends FieldValues>({
  control,
  name,
  label,
  options,
  rules
}: SelectInputProps<T>) {
  const {
    field: { value, onChange, onBlur },
    fieldState: { error }
  } = useController({
    name,
    control,
    rules
  });

  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <select
        id={name}
        value={value || ''}
        onChange={onChange}
        onBlur={onBlur}
        className={error ? 'is-invalid' : ''}
      >
        <option value="">Select {label}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <span className="error">{error.message}</span>}
    </div>
  );
}

// Usage
const { control } = useForm();
<SelectInput
  control={control}
  name="category"
  label="Category"
  options={[
    { value: 'tech', label: 'Technology' },
    { value: 'sports', label: 'Sports' }
  ]}
  rules={{ required: 'Category required' }}
/>
```

---

## useFormState Hook

**Description:** Subscribe to specific formState properties without re-rendering on other changes.

```typescript
import { useFormState } from 'react-hook-form';

// With watch hook - causes full re-render
const { watch } = useForm();
const values = watch();

// With useFormState - only re-renders on specific changes
const { control } = useForm();
const { isDirty, isValid, errors } = useFormState({ control });
```

**Use when:** You only need specific formState properties and want to prevent unnecessary re-renders.

---

## Pattern: Form Sections with Nested Components

```typescript
// Parent form with multiple sections
export function AccountForm() {
  const methods = useForm({
    defaultValues: {
      profile: { firstName: '', lastName: '' },
      settings: { notifications: true, privacy: 'public' }
    }
  });

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <ProfileSection />
        <SettingsSection />
        <button type="submit">Save</button>
      </form>
    </FormProvider>
  );
}

// Section component
function ProfileSection() {
  const { register, formState: { errors } } = useFormContext();

  return (
    <fieldset>
      <legend>Profile Information</legend>
      <input {...register('profile.firstName', { required: true })} />
      {errors.profile?.firstName && <p>Required</p>}

      <input {...register('profile.lastName', { required: true })} />
      {errors.profile?.lastName && <p>Required</p>}
    </fieldset>
  );
}

function SettingsSection() {
  const { register, watch } = useFormContext();
  const privacy = watch('settings.privacy');

  return (
    <fieldset>
      <legend>Settings</legend>
      <label>
        <input {...register('settings.notifications')} type="checkbox" />
        Enable notifications
      </label>

      <select {...register('settings.privacy')}>
        <option value="public">Public</option>
        <option value="private">Private</option>
        <option value="friends">Friends Only</option>
      </select>

      {privacy === 'private' && (
        <p>Your profile will not be visible to others</p>
      )}
    </fieldset>
  );
}
```

---

## Pattern: Reusable Field Components

```typescript
// Generic TextInput wrapper
interface TextInputProps {
  label: string;
  placeholder?: string;
  type?: string;
  [key: string]: any;
}

export function TextInput({
  label,
  placeholder,
  type = 'text',
  ...props
}: TextInputProps) {
  // Access form context implicitly
  return (
    <div className="form-field">
      <label>{label}</label>
      <input
        type={type}
        placeholder={placeholder || label}
        {...props}
      />
    </div>
  );
}

// Usage with FormProvider
export function MyForm() {
  const methods = useForm();
  const { register } = methods;

  return (
    <FormProvider {...methods}>
      <form>
        <TextInput {...register('email')} label="Email" type="email" />
        <TextInput {...register('password')} label="Password" type="password" />
      </form>
    </FormProvider>
  );
}
```

---

## Pattern: Multi-Field Error Display

```typescript
import { useFormContext } from 'react-hook-form';

export function ErrorSummary() {
  const { formState: { errors } } = useFormContext();

  const errorList = Object.entries(errors).map(([field, error]) => ({
    field,
    message: error?.message || 'Invalid field'
  }));

  if (errorList.length === 0) return null;

  return (
    <div className="error-summary">
      <h3>Please fix the following errors:</h3>
      <ul>
        {errorList.map(({ field, message }) => (
          <li key={field}>{message}</li>
        ))}
      </ul>
    </div>
  );
}

// Use in form
<FormProvider {...methods}>
  <form>
    <ErrorSummary />
    {/* rest of form */}
  </form>
</FormProvider>
```

---

## Pattern: Conditional Rendering with Context

```typescript
export function ConditionalFieldsForm() {
  const methods = useForm({
    defaultValues: { userType: 'individual', businessName: '' }
  });

  return (
    <FormProvider {...methods}>
      <form>
        <UserTypeSelect />
        <ConditionalBusinessFields />
        <button type="submit">Submit</button>
      </form>
    </FormProvider>
  );
}

function UserTypeSelect() {
  const { register } = useFormContext();

  return (
    <select {...register('userType')}>
      <option value="individual">Individual</option>
      <option value="business">Business</option>
    </select>
  );
}

function ConditionalBusinessFields() {
  const { register, watch } = useFormContext();
  const userType = watch('userType');

  if (userType !== 'business') return null;

  return (
    <div>
      <input
        {...register('businessName', { required: 'Business name required' })}
        placeholder="Business name"
      />
      <input
        {...register('taxId', { required: 'Tax ID required' })}
        placeholder="Tax ID"
      />
    </div>
  );
}
```

---

## Best Practices

✅ **DO:**
- Use FormProvider for large forms
- Create reusable field components
- Use useFormContext in deeply nested components
- Leverage useFormState for performance
- Group related fields into sections

❌ **DON'T:**
- Pass entire form state as props
- Create custom hooks that return multiple form methods
- Overuse useWatch (causes re-renders)
- Forget to wrap with FormProvider before using useFormContext

---

## Cross-References

- **Advanced methods:** See `04-api-advanced-methods.md`
- **Patterns:** See `08-patterns-implementation.md`
- **Performance:** See `09-best-practices.md`

---

**Version:** 7.71.2 | **Source:** https://react-hook-form.com/api/useformcontext
