# Form Error Handling Guidelines

> **Purpose**: Unified error handling architecture for all forms in mobile apps.

---

## Debug Logging (MANDATORY)

**Every form error MUST be logged in debug mode** for simulator debugging.

### Why

When an error displays on screen, developers must be able to:
1. Connect to simulator
2. Read console logs
3. See full error context (raw error, parsed error, form state)

### Logger Utility

The codebase has an existing `logApiError` utility:

```typescript
// src/shared/utils/apiLogger.ts
import { logApiError } from '@/shared/utils/apiLogger';

// Already logs in __DEV__ mode only
// Includes: error message, GraphQL errors, status, query, context
logApiError({
  level: 'error',
  operation: 'login',
  error: err,
  context: { email: 'user@example.com' }
});
```

### How It's Used

**`useFormError` hook already calls `logApiError`** - forms using this hook get automatic logging:

```typescript
// In useFormError.ts line 69
const handleError = (error: unknown, form?: UseFormReturn<any>): void => {
  // Log raw error for debugging in development
  logApiError({ level: 'error', operation: 'form', error });
  // ... rest of error handling
};
```

### Required Log Points

| Event | Log Call | Context to Include |
|-------|----------|-------------------|
| Form submit fails (via useFormError) | Automatic via `handleError()` | Auto-logged |
| Custom error handling (no useFormError) | `logApiError({ level: 'error', operation: 'context', error, context })` | Form values (redact passwords) |
| Mutation fails | `logApiError({ level: 'error', operation: 'mutationName', error })` | Error details |

### Implementation Pattern - Forms Using useFormError (Preferred)

```typescript
// Forms using useFormError get automatic logging
const { formError, handleError, clearFormError } = useFormError();

const onSubmit = async (data: FormData) => {
  try {
    await myMutation(data);
  } catch (error) {
    // handleError automatically calls logApiError
    handleError(error, form);
  }
};
```

### Implementation Pattern - Custom Error Handling

```typescript
import { logApiError } from '@/shared/utils/apiLogger';

const handleSave = async (): Promise<void> => {
  try {
    await saveMutation.mutateAsync(data);
  } catch (error) {
    // MANDATORY: Log before setting error state
    logApiError({
      level: 'error',
      operation: 'SleepSessionModal.handleSave',
      error,
      context: {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
        // Never log sensitive data
      },
    });

    setError(error instanceof Error ? error.message : 'Failed to save');
  }
};
```

### Log Output Format

When viewing in simulator console:
```
[API SleepSessionModal.handleSave] Error: Session overlap detected
[API SleepSessionModal.handleSave] GraphQL Errors: [{ message: "Session overlap", code: "CONFLICT" }]
[API SleepSessionModal.handleSave] Context: { startTime: "2026-01-09T14:00:00Z", endTime: "2026-01-09T16:00:00Z" }
```

### Sensitive Data Rules

**NEVER log**:
- Passwords
- Tokens (JWT, refresh tokens)
- Full credit card numbers
- SSN or government IDs

**Redaction pattern**:
```typescript
logApiError({
  level: 'error',
  operation: 'AuthForm.onSubmit',
  error,
  context: {
    email: data.email,
    password: '[REDACTED]',
    token: data.token ? '[PRESENT]' : '[MISSING]',
  },
});
```

---

## Error Dismissal Behavior

FormBanner auto-dismisses in these scenarios:

| Trigger | Action |
|---------|--------|
| User starts typing in any field | Auto-dismiss (watch subscription) |
| User taps X button | Manual dismiss (onDismiss callback) |
| New form submission | Error replaced or cleared |

**Implementation**: The `useEffect` with `form.watch()` subscription clears the error when any field value changes.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR FLOW                               │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  GraphQL/API Error                                          │
│       │                                                     │
│       ├──────────────────────────────────────┐              │
│       ▼                                      ▼              │
│  ┌─────────────────┐                 ┌──────────────┐       │
│  │  parseApiError  │  ← Central      │ debugLogError│       │
│  └────────┬────────┘    parser       │ (__DEV__)    │       │
│           │                          └──────────────┘       │
│           ▼                                 ↑               │
│  ┌─────────────────┐                        │               │
│  │    AppError     │  ← Typed error ────────┘               │
│  └────────┬────────┘    (also logged)                       │
│           │                                                 │
│     ┌─────┴─────┐                                           │
│     ▼           ▼                                           │
│  Field Error  Form Error                                    │
│  (has field)  (no field)                                    │
│     │           │                                           │
│     ▼           ▼                                           │
│  FormError   FormBanner                                     │
│  + Input     Component                                      │
│  state=error                                                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Decision Tree

```
Is it a field-specific error (email, password, etc.)?
├── YES → Use FormError + Input state='error'
└── NO → Is it a form submission error (API error)?
    ├── YES → Use FormBanner (with optional action)
    └── NO → Is it a transient notification?
        ├── YES → Use Toast
        └── NO → Handle silently or log
```

### When to Use Each Component

| Component | Use Case | Example |
|-----------|----------|---------|
| **FormError** | Field validation errors | "Enter a valid email address" |
| **Input state='error'** | Visual indicator on field | Red border on email input |
| **FormBanner** | Form-level API errors | "This email is already registered" |
| **Toast** | Transient notifications | "Changes saved", "Session deleted" |

---

## Error Message Writing Guidelines

### DO

1. **Be specific**: State exactly what went wrong
2. **Be actionable**: Tell user what to do next
3. **Be brief**: One sentence maximum
4. **Be human**: Use plain language

### DON'T

1. **No technical jargon**: "401 Unauthorized" → "Incorrect email or password"
2. **No blame**: "You entered wrong email" → "Email not found"
3. **No vague messages**: "Error occurred" → "Unable to connect"
4. **No JSON/stack traces**: Never expose raw errors

### Examples

| ❌ Bad | ✅ Good |
|--------|---------|
| "Error 401" | "Incorrect email or password" |
| "Invalid input" | "Enter a valid email address" |
| "Request failed" | "Unable to connect. Check your internet." |
| "Forbidden" | "You don't have access to this" |

---

## Implementation Patterns

### Pattern 1: Basic Form with useFormError

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormError } from '@/shared/hooks/useFormError';
import { FormBanner, FormError, Input } from '@/shared/components/ui';
import { debugLogError } from '@/shared/utils/debugLog';

function MyForm() {
  const form = useForm({
    resolver: zodResolver(mySchema),
    mode: 'onSubmit',
  });

  const { formError, handleError, clearFormError } = useFormError();

  const onSubmit = async (data: FormData) => {
    clearFormError();
    try {
      await myMutation(data);
    } catch (error) {
      // MANDATORY: Debug log before handling
      debugLogError('MyForm.onSubmit', error, {
        email: data.email,
        // password: '[REDACTED]' - never log sensitive data
      });

      handleError(error, form);
    }
  };

  return (
    <View>
      {/* Form-level error banner */}
      <FormBanner error={formError} />

      {/* Field with error state */}
      <Controller
        control={form.control}
        name="email"
        render={({ field, fieldState }) => (
          <View>
            <Input
              {...field}
              state={fieldState.error ? 'error' : 'default'}
              onChangeText={field.onChange}
            />
            <FormError message={fieldState.error?.message} />
          </View>
        )}
      />

      <Button onPress={form.handleSubmit(onSubmit)}>Submit</Button>
    </View>
  );
}
```

### Pattern 2: Form with Action Button

```typescript
// When error has an action (e.g., "Log in instead")
<FormBanner
  error={formError}
  onAction={() => {
    if (formError?.action?.route) {
      router.push(formError.action.route);
    }
  }}
/>
```

### Pattern 3: Non-Form Mutations (Toast)

```typescript
import { debugLogError } from '@/shared/utils/debugLog';

// For mutations outside forms (delete, etc.)
const handleDelete = async (itemId: string) => {
  try {
    await deleteMutation();
    showToast({ type: 'success', message: 'Item deleted' });
  } catch (error) {
    // MANDATORY: Debug log before handling
    debugLogError('handleDelete', error, { itemId });

    const parsed = parseApiError(error);
    showToast({ type: 'error', message: parsed.message });
  }
};
```

---

## Adding New Error Mappings

### Step 1: Identify Server Error

Check server logs or GraphQL response for the exact error message:
```json
{
  "errors": [{
    "message": "New error message here"
  }]
}
```

### Step 2: Add to errorMessages.ts

```typescript
// src/shared/errors/errorMessages.ts
export const ERROR_MESSAGES: Record<string, Partial<AppError>> = {
  // ... existing mappings

  'New error message here': {
    type: 'conflict',           // error category
    code: 'NEW_ERROR_CODE',     // unique code
    message: 'User-friendly message',
    field: 'fieldName',         // optional: routes to specific field
    action: {                   // optional: recovery action
      label: 'Action Label',
      route: '/(route)/path',
    },
    retryable: false,
  },
};
```

### Step 3: Add ErrorCode (if new)

```typescript
// src/shared/errors/types.ts
export type ErrorCode =
  | 'EXISTING_CODES'
  | 'NEW_ERROR_CODE';  // Add here
```

---

## Error Types Reference

| Type | Description | Example |
|------|-------------|---------|
| `validation` | Client-side input validation | Invalid email format |
| `auth` | Authentication failures | Invalid credentials |
| `conflict` | Resource conflicts | Email already exists |
| `not_found` | Resource not found | User not found |
| `forbidden` | Permission denied | Account limit reached |
| `network` | Connection issues | Offline |
| `rate_limit` | Too many requests | Throttled |
| `server` | Server errors (5xx) | Internal error |
| `unknown` | Unhandled errors | Fallback |

---

## Server Error Mapping Table

### Auth Errors

| Server Message | User Message | Type | Code |
|----------------|--------------|------|------|
| `Invalid credentials` | Incorrect email or password | auth | INVALID_CREDENTIALS |
| `Email already exists` | This email is already registered | conflict | EMAIL_EXISTS |
| `User not found. Please sign up first.` | No account found | not_found | USER_NOT_FOUND |
| `User already exists` | Apple ID already linked | conflict | APPLE_USER_EXISTS |
| `Maximum number of accounts...` | Account limit reached | forbidden | APPLE_MAX_ACCOUNTS |
| `Invalid Apple identity token` | Apple Sign In failed | auth | INVALID_TOKEN |
| `Invalid or expired refresh token` | Session expired | auth | SESSION_EXPIRED |

### Sleep Session Errors

| Server Message Pattern | User Message | Type | Code |
|------------------------|--------------|------|------|
| `Schedule conflict:...` | This time overlaps with a [SessionType] session. Adjust the start or end time. | conflict | SESSION_OVERLAP |
| `Sleep session not found...` | Session not found. It may have been deleted. | not_found | SESSION_NOT_FOUND |
| `End date...must be after start date` | End time must be after start time. Adjust the times. | validation | INVALID_DATE_ORDER |
| `An in-progress sleep session already exists...` | A session is already in progress. End it first to add a new one. | conflict | IN_PROGRESS_EXISTS |
| `This sleep session has already ended` | This session has already ended. | conflict | SESSION_ALREADY_ENDED |
| `Kid not found` | Child not found. Select a child first. | not_found | KID_NOT_FOUND |
| `You do not have access to this kid` | You don't have access to this child. | forbidden | KID_ACCESS_DENIED |

**Note**: The SESSION_OVERLAP error dynamically extracts the session type (e.g., "Nighttime Sleep", "Nap") from the server message to provide context about which session is conflicting.

### Network/Generic Errors

| Server Message | User Message | Type | Code |
|----------------|--------------|------|------|
| Network/Offline | Unable to connect | network | NETWORK_ERROR |
| Unknown | Something went wrong | unknown | UNKNOWN |

---

## Testing Checklist

When adding a new form or error handling:

### UI/UX
- [ ] Field errors show FormError component
- [ ] Input has `state='error'` when invalid
- [ ] Form-level errors show FormBanner
- [ ] Action buttons work (if applicable)
- [ ] Error clears on new submission attempt
- [ ] testID attributes set for E2E testing
- [ ] No raw JSON/technical errors displayed

### Debug Logging (MANDATORY)
- [ ] Forms using `useFormError` - automatic logging via `handleError()`
- [ ] Custom error handling uses `logApiError()` before setting error state
- [ ] Operation name follows pattern: `'ComponentName.methodName'`
- [ ] Relevant form data included in context
- [ ] Sensitive data redacted (passwords, tokens)
- [ ] Logs visible in simulator console when error occurs

---

## File Locations

```
src/shared/
├── errors/
│   ├── types.ts           # AppError, ErrorType, ErrorCode
│   ├── errorMessages.ts   # Server → user message mappings
│   ├── parseApiError.ts   # Central error parser
│   └── index.ts           # Public exports
├── utils/
│   └── apiLogger.ts       # Debug logging utility (logApiError)
├── components/ui/
│   ├── FormError.tsx      # Field-level error display
│   ├── FormBanner.tsx     # Form-level error display
│   └── Toast.tsx          # Transient notifications
└── hooks/
    └── useFormError.ts    # Form error handling hook (auto-logs via logApiError)
```
