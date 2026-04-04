# Security & Testing

> Input sanitization, CSRF protection, and comprehensive testing patterns.

---

## Security Best Practices

### 1. Input Sanitization

**Prevent XSS attacks by sanitizing user input:**

```typescript
import DOMPurify from 'dompurify';

const onSubmit = (data) => {
  // Sanitize all user input
  const clean = {
    message: DOMPurify.sanitize(data.message),
    title: DOMPurify.sanitize(data.title),
    html: DOMPurify.sanitize(data.html, { ALLOWED_TAGS: ['b', 'i', 'em', 'strong'] })
  };

  // Send sanitized data to API
  fetch('/api/submit', {
    method: 'POST',
    body: JSON.stringify(clean)
  });
};

<form onSubmit={handleSubmit(onSubmit)}>
  <textarea {...register('message')} />
  <button>Submit</button>
</form>
```

**Installation:**
```bash
npm install dompurify
npm install --save-dev @types/dompurify
```

---

### 2. Validate Server-Side

Always validate on the server - never trust client-side validation alone:

```typescript
// Server (Node.js/Express)
import { z } from 'zod';

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

app.post('/api/register', (req, res) => {
  try {
    // Re-validate on server
    const validated = schema.parse(req.body);
    // Process...
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Client
const onSubmit = async (data) => {
  const response = await fetch('/api/register', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  if (!response.ok) {
    const error = await response.json();
    setError('root', { type: 'server', message: error.error });
  }
};
```

---

### 3. Password Field Security

```typescript
<input
  {...register('password')}
  type="password"
  autoComplete="password"
  {...register('password')}
/>

<input
  {...register('confirmPassword')}
  type="password"
  autoComplete="new-password"
/>
```

**Why:** Prevents browser from showing password in plain text, enables password manager integration.

---

### 4. CSRF Protection

Prevent Cross-Site Request Forgery attacks:

```typescript
// Get CSRF token from meta tag or API
const getCsrfToken = () => {
  return document.querySelector('meta[name="csrf-token"]')?.content || '';
};

const onSubmit = async (data) => {
  const response = await fetch('/api/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-Token': getCsrfToken()  // Include CSRF token
    },
    body: JSON.stringify(data)
  });
};

<form onSubmit={handleSubmit(onSubmit)}>
  {/* fields */}
</form>
```

---

### 5. Secure Token Storage

For sensitive tokens (auth tokens, API keys):

```typescript
// ❌ Bad - stores in localStorage (vulnerable to XSS)
localStorage.setItem('token', authToken);

// ✅ Good - use httpOnly cookies (set by server)
// Server sets: Set-Cookie: authToken=...; HttpOnly; Secure; SameSite=Strict

// ✅ Acceptable - in-memory storage (lost on refresh)
const tokenRef = useRef(authToken);

// ✅ Good for mobile - use secure storage
import * as SecureStore from 'expo-secure-store';
SecureStore.setItemAsync('token', authToken);
```

---

### 6. Rate Limiting

Prevent brute force attacks on async validators:

```typescript
// Implement rate limiting for sensitive fields
const createRateLimitedValidator = (fn: Function, delayMs = 1000) => {
  let lastCall = 0;
  return async (value: string) => {
    const now = Date.now();
    if (now - lastCall < delayMs) {
      return 'Too many requests, please wait';
    }
    lastCall = now;
    return fn(value);
  };
};

const checkPassword = createRateLimitedValidator(
  async (password) => {
    // Check password strength
  },
  2000
);

<input
  {...register('password', {
    validate: checkPassword
  })}
/>
```

---

### 7. Sensitive Data Cleanup

Clear sensitive data from memory after submission:

```typescript
const onSubmit = async (data) => {
  try {
    const response = await fetch('/api/submit', {
      method: 'POST',
      body: JSON.stringify(data)
    });

    if (response.ok) {
      // Clear sensitive data
      reset({
        password: '',
        confirmPassword: '',
        creditCard: ''
      });
    }
  } finally {
    // Overwrite data to prevent memory access
    Object.keys(data).forEach(key => {
      data[key] = '';
    });
  }
};
```

---

## Testing

### Setup

```bash
npm install --save-dev @testing-library/react @testing-library/user-event jest
```

### Basic Form Test

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

describe('LoginForm', () => {
  test('renders form fields', () => {
    render(<LoginForm />);

    expect(screen.getByRole('textbox', { name: /email/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
  });

  test('displays error on invalid email', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    const emailInput = screen.getByRole('textbox', { name: /email/i });
    await user.type(emailInput, 'invalid-email');
    await user.tab(); // Trigger blur event

    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    render(<LoginForm />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        '/api/login',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            email: 'user@example.com',
            password: 'password123'
          })
        })
      );
    });
  });

  test('disables submit button while submitting', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn(() => new Promise(resolve => setTimeout(resolve, 100)));

    render(<LoginForm />);

    const submitButton = screen.getByRole('button', { name: /login/i });

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(submitButton);

    expect(submitButton).toBeDisabled();
  });
});
```

---

### Testing with Validation Schema

```typescript
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email required'),
  password: yup.string().min(8, 'Min 8 characters').required('Password required')
});

describe('LoginForm with Yup validation', () => {
  test('shows validation errors from schema', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'invalid');
    await user.type(screen.getByLabelText(/password/i }, 'short');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
      expect(screen.getByText('Min 8 characters')).toBeInTheDocument();
    });
  });
});
```

---

### Testing Dynamic Fields

```typescript
describe('DynamicArrayForm', () => {
  test('adds and removes fields', async () => {
    const user = userEvent.setup();
    render(<DynamicArrayForm />);

    // Initially one phone field
    expect(screen.getAllByPlaceholderText('Phone')).toHaveLength(1);

    // Add another
    await user.click(screen.getByRole('button', { name: /add phone/i }));
    expect(screen.getAllByPlaceholderText('Phone')).toHaveLength(2);

    // Remove first
    const removeButtons = screen.getAllByRole('button', { name: /remove/i });
    await user.click(removeButtons[0]);
    expect(screen.getAllByPlaceholderText('Phone')).toHaveLength(1);
  });

  test('submits with dynamic fields', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    global.fetch = mockFetch;

    render(<DynamicArrayForm />);

    // Fill form
    await user.type(screen.getByRole('textbox', { name: /name/i }), 'John');
    await user.type(screen.getAllByPlaceholderText('Phone')[0], '5551234567');

    // Add another phone
    await user.click(screen.getByRole('button', { name: /add phone/i }));
    await user.type(screen.getAllByPlaceholderText('Phone')[1], '5559876543');

    // Submit
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: JSON.stringify({
            name: 'John',
            phones: [
              { number: '5551234567' },
              { number: '5559876543' }
            ]
          })
        })
      );
    });
  });
});
```

---

### Testing Async Validation

```typescript
describe('Async validation', () => {
  test('checks email availability', async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValue({
      json: async () => ({ available: false })
    });
    global.fetch = mockFetch;

    render(<SignupForm />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'taken@example.com');
    await user.tab(); // Trigger validation

    await waitFor(() => {
      expect(screen.getByText('Email already taken')).toBeInTheDocument();
    });
  });
});
```

---

### Testing Error Handling

```typescript
describe('Server error handling', () => {
  test('displays server errors', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<LoginForm />);

    await user.type(screen.getByRole('textbox', { name: /email/i }), 'user@example.com');
    await user.type(screen.getByLabelText(/password/i }, 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  test('displays field-specific server errors', async () => {
    const user = userEvent.setup();
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        errors: {
          email: 'Email already exists',
          password: 'Password too weak'
        }
      })
    });

    render(<SignupForm />);

    await user.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already exists')).toBeInTheDocument();
      expect(screen.getByText('Password too weak')).toBeInTheDocument();
    });
  });
});
```

---

## Testing Checklist

- [ ] Form renders correctly
- [ ] All fields display
- [ ] Required field validation works
- [ ] Pattern validation works
- [ ] Async validation works
- [ ] Error messages display
- [ ] Form submits with valid data
- [ ] Form doesn't submit with invalid data
- [ ] Submit button disables while submitting
- [ ] Server errors display
- [ ] Form resets after successful submit
- [ ] Dynamic fields add/remove correctly
- [ ] Conditional fields show/hide correctly
- [ ] Dependent field validation works
- [ ] Accessibility (labels, roles, ARIA)

---

## Cross-References

- **Validation:** See `05-validation-rules.md` and `06-validation-schemas.md`
- **Best practices:** See `09-best-practices.md`
- **Troubleshooting:** See `10-troubleshooting-faq.md`

---

**Version:** 7.72.1 | **Source:** https://react-hook-form.com/form-builder
