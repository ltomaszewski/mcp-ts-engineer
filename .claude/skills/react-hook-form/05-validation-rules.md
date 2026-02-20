# Validation: Built-in Rules & Patterns

> Complete reference for inline validation rules and custom validators.

**Source:** [https://react-hook-form.com/get-started#Applyvalidation](https://react-hook-form.com/get-started#Applyvalidation)

---

## Built-in Validation Rules Overview

All rules are passed to `register()` as the second argument:

```typescript
<input {...register('email', {
  required: 'Email required',
  pattern: { value: /^.*@.*$/, message: 'Invalid email' }
})} />
```

---

## Rule Reference

### required

**Description:** Field must have a value (not empty).

```typescript
// With custom message
<input {...register('email', { required: 'Email is required' })} />

// Boolean (generic error)
<input {...register('password', { required: true })} />

// Function message
<input {...register('name', {
  required: (value) =>
    !value ? 'Name is required' : true
})} />
```

**Error Message:** `Error: This field is required`

---

### min

**Description:** Numeric field must be >= minimum value.

```typescript
<input
  type="number"
  {...register('age', {
    min: { value: 18, message: 'Must be 18 or older' }
  })}
/>

// Without message
<input
  type="number"
  {...register('rating', { min: 1 })}
/>
```

**Use Case:** Age verification, minimum quantities, positive numbers.

---

### max

**Description:** Numeric field must be <= maximum value.

```typescript
<input
  type="number"
  {...register('rating', {
    max: { value: 5, message: 'Max rating is 5' }
  })}
/>

<input
  type="number"
  {...register('quantity', { max: 1000 })}
/>
```

**Use Case:** Rating limits, maximum quantities, reasonable bounds.

---

### minLength

**Description:** String must have at least N characters.

```typescript
<input
  {...register('password', {
    minLength: { value: 8, message: 'Minimum 8 characters' }
  })}
  type="password"
/>

<textarea
  {...register('bio', { minLength: 10 })}
  placeholder="Write something about yourself..."
/>
```

**Use Case:** Passwords, usernames, descriptions.

---

### maxLength

**Description:** String must have at most N characters.

```typescript
<input
  {...register('username', {
    maxLength: { value: 20, message: 'Maximum 20 characters' }
  })}
/>

<textarea
  {...register('summary', { maxLength: 500 })}
/>
```

**Use Case:** Username limits, summary fields, character limits.

---

### pattern

**Description:** Value must match a regex pattern.

```typescript
{/* Email pattern */}
<input
  {...register('email', {
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email address'
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
      value: /^[a-zA-Z0-9_]+$/,
      message: 'Only letters, numbers, and underscores'
    }
  })}
/>

{/* URL */}
<input
  {...register('website', {
    pattern: {
      value: /^https?:\/\/.+/,
      message: 'Must be valid URL'
    }
  })}
/>

{/* ZIP code (5 digits) */}
<input
  {...register('zipCode', {
    pattern: {
      value: /^\d{5}$/,
      message: 'ZIP must be 5 digits'
    }
  })}
/>
```

**Common Patterns:**

| Format | Pattern | Example |
|--------|---------|---------|
| Email | `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` | user@example.com |
| URL | `/^https?:\/\/.+/` | https://example.com |
| Phone (10d) | `/^\d{10}$/` | 5551234567 |
| Alphanumeric | `/^[a-zA-Z0-9]+$/` | abc123 |
| Uppercase only | `/^[A-Z]+$/` | ABC |
| Lowercase only | `/^[a-z]+$/` | abc |
| Numbers only | `/^\d+$/` | 12345 |
| ZIP (US) | `/^\d{5}$/` | 90210 |

---

### validate

**Description:** Custom validation function or object of functions.

#### Single Validator

```typescript
{/* Simple validation */}
<input
  {...register('password', {
    validate: (value) =>
      value.length >= 8 || 'Password must be 8+ characters'
  })}
  type="password"
/>

{/* Return true for valid, error message for invalid */}
<input
  {...register('age', {
    validate: (value) => {
      const num = parseInt(value);
      return (num >= 0 && num <= 120) || 'Age must be 0-120';
    }
  })}
/>
```

---

#### Async Validator

```typescript
{/* Check email availability */}
<input
  {...register('email', {
    validate: async (value) => {
      const response = await fetch(`/api/check-email?email=${value}`);
      const { available } = await response.json();
      return available || 'Email already taken';
    }
  })}
/>

{/* Check username uniqueness */}
<input
  {...register('username', {
    validate: async (value) => {
      try {
        const exists = await checkUsernameExists(value);
        return !exists || 'Username already taken';
      } catch {
        return 'Error checking username';
      }
    }
  })}
/>
```

---

#### Multiple Validators (Object)

```typescript
{/* Multiple validation rules */}
<input
  {...register('username', {
    validate: {
      minLength: (v) => v.length >= 3 || 'Min 3 characters',
      maxLength: (v) => v.length <= 20 || 'Max 20 characters',
      pattern: (v) => /^[a-z0-9_]+$/.test(v) || 'Invalid format',
      unique: async (v) => !(await checkExists(v)) || 'Already taken'
    }
  })}
/>
```

---

#### With Form Values (Dependent Validation)

```typescript
{/* Confirm password field */}
<input
  {...register('confirmPassword', {
    validate: (value, formValues) =>
      value === formValues.password || 'Passwords do not match'
  })}
  type="password"
/>
```

---

### disabled

**Description:** Disable field input (not included in submission).

```typescript
{/* Always disabled */}
<input {...register('readonly', { disabled: true })} />

{/* Conditionally disabled */}
const isAdmin = user?.role === 'admin';
<input {...register('privileges', { disabled: !isAdmin })} />

{/* Disabled based on form state */}
const { watch } = useForm();
const country = watch('country');
<input
  {...register('state', {
    disabled: country !== 'US'
  })}
/>
```

**Important:** Disabled fields are excluded from form submission.

---

## Common Validation Combinations

### Strong Password

```typescript
<input
  {...register('password', {
    required: 'Password required',
    minLength: { value: 8, message: 'Min 8 characters' },
    pattern: {
      value: /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[@$!%*?&])/,
      message: 'Must contain uppercase, lowercase, number, and special char'
    }
  })}
  type="password"
/>
```

---

### Email Validation

```typescript
<input
  {...register('email', {
    required: 'Email required',
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: 'Invalid email address'
    },
    validate: async (value) => {
      const response = await fetch(`/api/check-email?email=${value}`);
      const { available } = await response.json();
      return available || 'Email already registered';
    }
  })}
  type="email"
/>
```

---

### Age Verification

```typescript
<input
  {...register('birthDate', {
    required: 'Birth date required',
    validate: (value) => {
      const age = new Date().getFullYear() - new Date(value).getFullYear();
      return age >= 18 || 'Must be 18 or older';
    }
  })}
  type="date"
/>
```

---

### Username Validation

```typescript
<input
  {...register('username', {
    required: 'Username required',
    minLength: { value: 3, message: 'Min 3 characters' },
    maxLength: { value: 20, message: 'Max 20 characters' },
    pattern: {
      value: /^[a-z0-9_]+$/,
      message: 'Lowercase, numbers, underscores only'
    },
    validate: async (value) => {
      const taken = await checkUsernameTaken(value);
      return !taken || 'Username already taken';
    }
  })}
/>
```

---

## Best Practices

✅ **DO:**
- Provide clear, specific error messages
- Combine multiple rules for strength (password)
- Debounce async validators to prevent excessive API calls
- Validate at submission for simple rules, on blur for user-facing
- Use patterns for standard formats (email, phone, ZIP)

❌ **DON'T:**
- Use overly complex regex patterns (use schema validation instead)
- Validate without user feedback
- Block submission without showing errors
- Make every field async validate

---

## Debouncing Async Validators

```typescript
import { debounce } from 'lodash';

const debouncedEmailCheck = debounce(async (value) => {
  const response = await fetch(`/api/check-email?email=${value}`);
  const { available } = await response.json();
  return available || 'Email taken';
}, 500);

<input
  {...register('email', {
    validate: debouncedEmailCheck
  })}
/>
```

---

## Cross-References

- **Schema-based validation:** See `06-validation-schemas.md` for more complex rules
- **Error display:** See `02-api-useform.md` (formState.errors)
- **Form patterns:** See `08-patterns-implementation.md`

---

**Source:** https://react-hook-form.com/api/useform/register
