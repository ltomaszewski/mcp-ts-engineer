# Patterns & Implementation

> Real-world form patterns: multi-step, conditional fields, auto-save, and dynamic arrays.

---

## Pattern 1: Multi-Step Form

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';
import { useState } from 'react';

interface FormData {
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  city: string;
}

export function MultiStepForm() {
  const [step, setStep] = useState(1);
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    trigger
  } = useForm<FormData>({
    mode: 'onBlur',
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      address: '',
      city: ''
    }
  });

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log('Form complete:', data);
  };

  const nextStep = async () => {
    // Validate current step before moving forward
    let isValid = false;
    if (step === 1) {
      isValid = await trigger(['firstName', 'lastName']);
    } else if (step === 2) {
      isValid = await trigger(['email']);
    } else if (step === 3) {
      isValid = await trigger(['address', 'city']);
    }

    if (isValid) {
      setStep(step + 1);
    }
  };

  const prevStep = () => setStep(step - 1);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {step === 1 && (
        <div>
          <h2>Step 1: Personal Info</h2>
          <input
            {...register('firstName', { required: 'First name required' })}
            placeholder="First name"
          />
          {errors.firstName && <p>{errors.firstName.message}</p>}

          <input
            {...register('lastName', { required: 'Last name required' })}
            placeholder="Last name"
          />
          {errors.lastName && <p>{errors.lastName.message}</p>}

          <button type="button" onClick={nextStep}>
            Next
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <h2>Step 2: Contact</h2>
          <input
            {...register('email', {
              required: 'Email required',
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: 'Invalid email'
              }
            })}
            type="email"
            placeholder="Email"
          />
          {errors.email && <p>{errors.email.message}</p>}

          <button type="button" onClick={prevStep}>
            Back
          </button>
          <button type="button" onClick={nextStep}>
            Next
          </button>
        </div>
      )}

      {step === 3 && (
        <div>
          <h2>Step 3: Address</h2>
          <input
            {...register('address', { required: 'Address required' })}
            placeholder="Street address"
          />
          {errors.address && <p>{errors.address.message}</p>}

          <input
            {...register('city', { required: 'City required' })}
            placeholder="City"
          />
          {errors.city && <p>{errors.city.message}</p>}

          <button type="button" onClick={prevStep}>
            Back
          </button>
          <button type="submit">Submit</button>
        </div>
      )}
    </form>
  );
}
```

---

## Pattern 2: Conditional Fields

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';

interface FormData {
  userType: 'individual' | 'business';
  companyName?: string;
  businessWebsite?: string;
}

export function ConditionalFieldsForm() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<FormData>({
    defaultValues: { userType: 'individual' }
  });

  const userType = watch('userType');

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>User Type</label>
        <select {...register('userType')}>
          <option value="individual">Individual</option>
          <option value="business">Business</option>
        </select>
      </div>

      {userType === 'business' && (
        <div>
          <input
            {...register('companyName', {
              required: 'Company name required'
            })}
            placeholder="Company name"
          />
          {errors.companyName && <p>{errors.companyName.message}</p>}

          <input
            {...register('businessWebsite', {
              required: 'Website required',
              pattern: {
                value: /^https?:\/\/.+/,
                message: 'Must be valid URL'
              }
            })}
            placeholder="https://example.com"
          />
          {errors.businessWebsite && <p>{errors.businessWebsite.message}</p>}
        </div>
      )}

      <button type="submit">Continue</button>
    </form>
  );
}
```

---

## Pattern 3: Auto-Save Form

```typescript
import { useForm, useWatch } from 'react-hook-form';
import { useEffect } from 'react';

interface PostData {
  title: string;
  content: string;
}

export function AutoSaveForm() {
  const {
    register,
    control,
    formState: { isDirty },
    getValues
  } = useForm<PostData>({
    defaultValues: { title: '', content: '' }
  });

  const formValues = useWatch({ control });

  useEffect(() => {
    if (!isDirty) return;

    // Debounce auto-save
    const timer = setTimeout(async () => {
      const values = getValues();
      await fetch('/api/autosave', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });
      console.log('Auto-saved at', new Date().toLocaleTimeString());
    }, 2000);

    return () => clearTimeout(timer);
  }, [formValues, isDirty, getValues]);

  return (
    <form>
      <div>
        <input
          {...register('title', { required: true })}
          placeholder="Post title"
        />
      </div>

      <div>
        <textarea
          {...register('content')}
          placeholder="Post content..."
          rows={10}
        />
      </div>

      {isDirty && <p className="saving">✓ Auto-saving...</p>}
    </form>
  );
}
```

---

## Pattern 4: Dynamic Field Arrays

```typescript
import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';

interface PhoneNumber {
  type: 'home' | 'work' | 'mobile';
  number: string;
}

interface ContactData {
  name: string;
  email: string;
  phones: PhoneNumber[];
}

export function DynamicArrayForm() {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors }
  } = useForm<ContactData>({
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

  const onSubmit: SubmitHandler<ContactData> = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <input
          {...register('name', { required: 'Name required' })}
          placeholder="Name"
        />
        {errors.name && <p>{errors.name.message}</p>}
      </div>

      <div>
        <input
          {...register('email', { required: 'Email required' })}
          type="email"
          placeholder="Email"
        />
        {errors.email && <p>{errors.email.message}</p>}
      </div>

      <fieldset>
        <legend>Phone Numbers</legend>
        {fields.map((field, index) => (
          <div key={field.id} className="phone-entry">
            <select {...register(`phones.${index}.type`)}>
              <option value="mobile">Mobile</option>
              <option value="home">Home</option>
              <option value="work">Work</option>
            </select>

            <input
              {...register(`phones.${index}.number`, {
                required: 'Phone required',
                pattern: {
                  value: /^\d{10}$/,
                  message: '10 digits required'
                }
              })}
              placeholder="10-digit number"
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

## Pattern 5: Dependent Field Validation

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';

interface PasswordForm {
  password: string;
  confirmPassword: string;
}

export function DependentFieldForm() {
  const {
    register,
    watch,
    handleSubmit,
    formState: { errors }
  } = useForm<PasswordForm>();

  const password = watch('password');

  const onSubmit: SubmitHandler<PasswordForm> = (data) => {
    console.log('Form valid, passwords match:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Password</label>
        <input
          {...register('password', {
            required: 'Password required',
            minLength: { value: 8, message: 'Min 8 characters' }
          })}
          type="password"
        />
        {errors.password && <p>{errors.password.message}</p>}
      </div>

      <div>
        <label>Confirm Password</label>
        <input
          {...register('confirmPassword', {
            required: 'Confirm password required',
            validate: (value) =>
              value === password || 'Passwords do not match'
          })}
          type="password"
        />
        {errors.confirmPassword && <p>{errors.confirmPassword.message}</p>}
      </div>

      <button type="submit">Set Password</button>
    </form>
  );
}
```

---

## Pattern 6: Server-Side Error Handling

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';

interface LoginForm {
  email: string;
  password: string;
}

export function LoginWithServerErrors() {
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting }
  } = useForm<LoginForm>({
    mode: 'onBlur'
  });

  const onSubmit: SubmitHandler<LoginForm> = async (data) => {
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();

        // Set field-specific errors
        if (error.errors) {
          Object.entries(error.errors).forEach(([field, message]) => {
            setError(field as keyof LoginForm, {
              type: 'server',
              message: message as string
            });
          });
        } else {
          // Set general error
          setError('root', {
            type: 'server',
            message: error.message || 'Login failed'
          });
        }
        return;
      }

      // Success
      console.log('Login successful');
    } catch (err) {
      setError('root', {
        type: 'server',
        message: 'Network error, please try again'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {errors.root && (
        <div className="error-alert">{errors.root.message}</div>
      )}

      <div>
        <input
          {...register('email', { required: 'Email required' })}
          type="email"
          placeholder="Email"
        />
        {errors.email && <p className="error">{errors.email.message}</p>}
      </div>

      <div>
        <input
          {...register('password', { required: 'Password required' })}
          type="password"
          placeholder="Password"
        />
        {errors.password && <p className="error">{errors.password.message}</p>}
      </div>

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

---

## Pattern 7: Form-Level Validation (New in 7.72.0)

```typescript
import { useForm, SubmitHandler } from 'react-hook-form';

interface BookingData {
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export function BookingForm() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BookingData>({
    defaultValues: { checkIn: '', checkOut: '', guests: 1, rooms: 1 },
    validate: (data) => {
      const errs: Record<string, { type: string; message: string }> = {};

      if (data.checkIn && data.checkOut) {
        if (new Date(data.checkOut) <= new Date(data.checkIn)) {
          errs.checkOut = { type: 'validate', message: 'Check-out must be after check-in' };
        }
      }
      if (data.guests > data.rooms * 4) {
        errs.guests = { type: 'validate', message: `Max ${data.rooms * 4} guests for ${data.rooms} rooms` };
      }

      return {
        values: Object.keys(errs).length === 0 ? data : {},
        errors: errs,
      };
    },
  });

  const onSubmit: SubmitHandler<BookingData> = (data) => {
    console.log('Booking:', data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div>
        <label>Check-in</label>
        <input {...register('checkIn', { required: 'Check-in required' })} type="date" />
        {errors.checkIn && <p>{errors.checkIn.message}</p>}
      </div>

      <div>
        <label>Check-out</label>
        <input {...register('checkOut', { required: 'Check-out required' })} type="date" />
        {errors.checkOut && <p>{errors.checkOut.message}</p>}
      </div>

      <div>
        <label>Guests</label>
        <input {...register('guests', { valueAsNumber: true, min: 1 })} type="number" />
        {errors.guests && <p>{errors.guests.message}</p>}
      </div>

      <div>
        <label>Rooms</label>
        <input {...register('rooms', { valueAsNumber: true, min: 1 })} type="number" />
      </div>

      <button type="submit">Book</button>
    </form>
  );
}
```

**When to use form-level `validate` vs `resolver`:**
- Use `validate` for simple cross-field checks without an external library
- Use `resolver` (Zod/Yup) when you need full schema type inference and complex nested validation
- Both can be used together -- `resolver` runs first, then `validate`

---

## Cross-References

- **Multi-step validation:** See `04-api-advanced-methods.md` (trigger)
- **Dynamic fields:** See `04-api-advanced-methods.md` (useFieldArray)
- **Conditional logic:** See `04-api-advanced-methods.md` (watch)
- **Form-level validate API:** See `02-api-useform.md` (validate option)
- **Best practices:** See `09-best-practices.md`
- **Troubleshooting:** See `10-troubleshooting-faq.md`

---

**Version:** 7.72.1 | **Source:** https://react-hook-form.com/form-builder
