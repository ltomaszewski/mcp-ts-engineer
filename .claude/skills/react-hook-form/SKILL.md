---
name: react-hook-form
description: React Hook Form - useForm, Controller, validation, Zod integration. Use when building forms, handling validation, or managing form state in React Native.
---

# React Hook Form

> Performant form handling with minimal re-renders and great developer experience.

**Package:** `react-hook-form`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Building forms in React Native
- Implementing form validation (inline or schema-based)
- Integrating with Zod for type-safe validation
- Managing complex form state (multi-step, dynamic fields)
- Optimizing form performance

---

## Critical Rules

**ALWAYS:**
1. Use `Controller` for React Native inputs — `register` only works with web inputs
2. Integrate Zod with `zodResolver` — single source of truth for types and validation
3. Destructure `formState: { errors }` — access errors reactively
4. Use `handleSubmit` wrapper — handles validation before calling your function

**NEVER:**
1. Use `register` directly with TextInput — won't work in React Native
2. Call `watch()` excessively — causes re-renders on every watched field change
3. Forget to pass `control` to Controller — required prop, won't work without it
4. Mix controlled and uncontrolled patterns — pick one approach per form

---

## Core Patterns

### Basic Form with Zod Validation

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, TextInput, Text, Button } from 'react-native';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});

type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    await loginUser(data);
  };

  return (
    <View>
      <Controller
        control={control}
        name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.email && <Text style={styles.error}>{errors.email.message}</Text>}

      <Controller
        control={control}
        name="password"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput
            placeholder="Password"
            secureTextEntry
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />
      {errors.password && <Text style={styles.error}>{errors.password.message}</Text>}

      <Button
        title={isSubmitting ? 'Loading...' : 'Login'}
        onPress={handleSubmit(onSubmit)}
        disabled={isSubmitting}
      />
    </View>
  );
}
```

### Reusable Form Input Component

```typescript
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';

interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  placeholder,
  secureTextEntry,
}: FormInputProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View>
          <Text>{label}</Text>
          <TextInput
            placeholder={placeholder}
            secureTextEntry={secureTextEntry}
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
          {error && <Text style={styles.error}>{error.message}</Text>}
        </View>
      )}
    />
  );
}

// Usage
<FormInput control={control} name="email" label="Email" placeholder="Enter email" />
```

### Form with Nested Fields (useFieldArray)

```typescript
import { useForm, useFieldArray, Controller } from 'react-hook-form';

interface FormData {
  users: { name: string; email: string }[];
}

export function DynamicForm() {
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: { users: [{ name: '', email: '' }] },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'users',
  });

  return (
    <View>
      {fields.map((field, index) => (
        <View key={field.id}>
          <Controller
            control={control}
            name={`users.${index}.name`}
            render={({ field: { onChange, value } }) => (
              <TextInput placeholder="Name" onChangeText={onChange} value={value} />
            )}
          />
          <Button title="Remove" onPress={() => remove(index)} />
        </View>
      ))}
      <Button title="Add User" onPress={() => append({ name: '', email: '' })} />
    </View>
  );
}
```

### FormProvider for Nested Components

```typescript
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';

// Parent component
export function CheckoutForm() {
  const methods = useForm<CheckoutData>();

  return (
    <FormProvider {...methods}>
      <ShippingSection />
      <PaymentSection />
      <Button title="Submit" onPress={methods.handleSubmit(onSubmit)} />
    </FormProvider>
  );
}

// Child component - no need to pass control prop
function ShippingSection() {
  const { control } = useFormContext<CheckoutData>();

  return (
    <Controller
      control={control}
      name="shipping.address"
      render={({ field }) => <TextInput {...field} onChangeText={field.onChange} />}
    />
  );
}
```

---

## Anti-Patterns

**BAD** — Using register with React Native:
```typescript
<TextInput {...register('email')} /> // Won't work in RN!
```

**GOOD** — Use Controller:
```typescript
<Controller
  control={control}
  name="email"
  render={({ field: { onChange, onBlur, value } }) => (
    <TextInput onBlur={onBlur} onChangeText={onChange} value={value} />
  )}
/>
```

**BAD** — Watching entire form:
```typescript
const formValues = watch(); // Re-renders on ANY change
```

**GOOD** — Watch specific fields:
```typescript
const email = watch('email'); // Only re-renders when email changes
// Or use useWatch for better performance
const email = useWatch({ control, name: 'email' });
```

**BAD** — Missing defaultValues:
```typescript
const { control } = useForm<FormData>(); // Uncontrolled to controlled warning
```

**GOOD** — Always provide defaultValues:
```typescript
const { control } = useForm<FormData>({
  defaultValues: { email: '', password: '' },
});
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Create form | `useForm()` | `const { control, handleSubmit } = useForm()` |
| Zod validation | `zodResolver()` | `resolver: zodResolver(schema)` |
| Wrap RN input | `Controller` | `<Controller control={control} name="x" render={...} />` |
| Submit form | `handleSubmit()` | `onPress={handleSubmit(onSubmit)}` |
| Get errors | `formState.errors` | `const { formState: { errors } } = useForm()` |
| Watch field | `watch()` / `useWatch()` | `const val = watch('name')` |
| Set value | `setValue()` | `setValue('email', 'test@example.com')` |
| Reset form | `reset()` | `reset({ email: '', password: '' })` |
| Dynamic fields | `useFieldArray()` | `const { fields, append } = useFieldArray()` |
| Nested forms | `FormProvider` | `<FormProvider {...methods}>` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and setup | [01-setup-installation.md](01-setup-installation.md) |
| useForm configuration | [02-api-useform.md](02-api-useform.md) |
| Controller and register | [03-api-register.md](03-api-register.md) |
| watch, setValue, reset | [04-api-advanced-methods.md](04-api-advanced-methods.md) |
| Built-in validation rules | [05-validation-rules.md](05-validation-rules.md) |
| Zod schema integration | [06-validation-schemas.md](06-validation-schemas.md) |
| useFormContext, custom hooks | [07-custom-hooks-context.md](07-custom-hooks-context.md) |
| Multi-step, conditional fields | [08-patterns-implementation.md](08-patterns-implementation.md) |
| Performance optimization | [09-best-practices.md](09-best-practices.md) |
| Debugging common issues | [10-troubleshooting-faq.md](10-troubleshooting-faq.md) |

---

**Version:** 7.x | **Source:** https://react-hook-form.com/
