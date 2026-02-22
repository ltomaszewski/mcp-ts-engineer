---
name: react-hook-form
description: React Hook Form - useForm, Controller, validation, Zod integration. Use when building forms, handling validation, or managing form state in React Native.
---

# React Hook Form

> Performant form handling with minimal re-renders and great developer experience.

**Package:** `react-hook-form` v7.71.2 | **React:** 19.1.0 | **TypeScript:** ^5.9.3

---

## When to Use

**LOAD THIS SKILL** when user is:
- Building forms in React or React Native
- Implementing form validation (inline or schema-based)
- Integrating with Zod for type-safe validation
- Managing complex form state (multi-step, dynamic fields)
- Optimizing form performance

---

## Critical Rules

**ALWAYS:**
1. Use `Controller` for React Native inputs -- `register` only works with web DOM inputs
2. Integrate Zod with `zodResolver` -- single source of truth for types and validation
3. Destructure `formState: { errors }` -- access errors reactively via Proxy
4. Use `handleSubmit` wrapper -- handles validation before calling your function
5. Provide `defaultValues` -- prevents uncontrolled-to-controlled warnings

**NEVER:**
1. Use `register` directly with React Native `TextInput` -- won't work, no ref support
2. Call `watch()` without arguments -- causes re-render on every field change
3. Forget to pass `control` to `Controller` -- required prop
4. Mix controlled and uncontrolled patterns in the same form

---

## Core Patterns

### Basic Form with Zod (React Native)

```typescript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { View, TextInput, Text, Pressable } from 'react-native';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Min 8 characters'),
});
type FormData = z.infer<typeof schema>;

export function LoginForm() {
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const onSubmit = async (data: FormData) => { /* submit */ };

  return (
    <View>
      <Controller control={control} name="email"
        render={({ field: { onChange, onBlur, value } }) => (
          <TextInput onBlur={onBlur} onChangeText={onChange} value={value} />
        )} />
      {errors.email && <Text>{errors.email.message}</Text>}
      <Pressable onPress={handleSubmit(onSubmit)} disabled={isSubmitting}>
        <Text>{isSubmitting ? 'Loading...' : 'Login'}</Text>
      </Pressable>
    </View>
  );
}
```

### Reusable FormInput Component

```typescript
import { Controller, Control, FieldPath, FieldValues } from 'react-hook-form';
import { View, TextInput, Text } from 'react-native';

interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label: string;
  placeholder?: string;
  secureTextEntry?: boolean;
}

export function FormInput<T extends FieldValues>({
  control, name, label, placeholder, secureTextEntry,
}: FormInputProps<T>) {
  return (
    <Controller control={control} name={name}
      render={({ field: { onChange, onBlur, value }, fieldState: { error } }) => (
        <View>
          <Text>{label}</Text>
          <TextInput placeholder={placeholder} secureTextEntry={secureTextEntry}
            onBlur={onBlur} onChangeText={onChange} value={value} />
          {error && <Text>{error.message}</Text>}
        </View>
      )} />
  );
}
```

### Dynamic Fields with useFieldArray

```typescript
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { View, TextInput, Button } from 'react-native';

interface FormData { users: { name: string; email: string }[] }

export function DynamicForm() {
  const { control, handleSubmit } = useForm<FormData>({
    defaultValues: { users: [{ name: '', email: '' }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'users' });

  return (
    <View>
      {fields.map((field, index) => (
        <View key={field.id}>
          <Controller control={control} name={`users.${index}.name`}
            render={({ field: { onChange, value } }) => (
              <TextInput onChangeText={onChange} value={value} />
            )} />
          <Button title="Remove" onPress={() => remove(index)} />
        </View>
      ))}
      <Button title="Add" onPress={() => append({ name: '', email: '' })} />
    </View>
  );
}
```

### FormProvider for Nested Components

```typescript
import { useForm, FormProvider, useFormContext, Controller } from 'react-hook-form';

export function CheckoutForm() {
  const methods = useForm<CheckoutData>({
    defaultValues: { shipping: { address: '' }, payment: { card: '' } },
  });
  return (
    <FormProvider {...methods}>
      <ShippingSection />
      <PaymentSection />
    </FormProvider>
  );
}

function ShippingSection() {
  const { control } = useFormContext<CheckoutData>();
  return (
    <Controller control={control} name="shipping.address"
      render={({ field }) => <TextInput onChangeText={field.onChange} value={field.value} />} />
  );
}
```

---

## Anti-Patterns

**BAD** -- Using register with React Native:
```typescript
<TextInput {...register('email')} /> // Won't work in RN!
```

**GOOD** -- Use Controller:
```typescript
<Controller control={control} name="email"
  render={({ field: { onChange, onBlur, value } }) => (
    <TextInput onBlur={onBlur} onChangeText={onChange} value={value} />
  )} />
```

**BAD** -- Watching entire form:
```typescript
const formValues = watch(); // Re-renders on ANY change
```

**GOOD** -- Watch specific fields or use useWatch:
```typescript
const email = useWatch({ control, name: 'email' });
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Create form | `useForm()` | `const { control, handleSubmit } = useForm()` |
| Zod validation | `zodResolver()` | `resolver: zodResolver(schema)` |
| Wrap RN input | `Controller` | `<Controller control={control} name="x" render={...} />` |
| Submit form | `handleSubmit()` | `onPress={handleSubmit(onSubmit)}` |
| Get errors | `formState.errors` | `formState: { errors }` |
| Watch field | `useWatch()` | `useWatch({ control, name: 'email' })` |
| Set value | `setValue()` | `setValue('email', 'test@test.com', { shouldValidate: true })` |
| Reset form | `reset()` | `reset({ email: '', password: '' })` |
| Dynamic fields | `useFieldArray()` | `const { fields, append, remove } = useFieldArray()` |
| Nested forms | `FormProvider` | `<FormProvider {...methods}>` |
| Manual validate | `trigger()` | `await trigger('email')` |
| Manual error | `setError()` | `setError('email', { message: 'Taken' })` |
| Clear errors | `clearErrors()` | `clearErrors('email')` |
| Set focus | `setFocus()` | `setFocus('email')` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and setup | [01-setup-installation.md](01-setup-installation.md) |
| useForm configuration (ALL options) | [02-api-useform.md](02-api-useform.md) |
| register, Controller (ALL props) | [03-api-register.md](03-api-register.md) |
| watch, setValue, reset, useFieldArray | [04-api-advanced-methods.md](04-api-advanced-methods.md) |
| Built-in validation rules | [05-validation-rules.md](05-validation-rules.md) |
| Zod schema integration | [06-validation-schemas.md](06-validation-schemas.md) |
| useFormContext, useController | [07-custom-hooks-context.md](07-custom-hooks-context.md) |
| Multi-step, conditional fields | [08-patterns-implementation.md](08-patterns-implementation.md) |
| Performance optimization | [09-best-practices.md](09-best-practices.md) |
| Debugging common issues | [10-troubleshooting-faq.md](10-troubleshooting-faq.md) |
| Security and testing | [11-security-testing.md](11-security-testing.md) |

---

**Version:** 7.71.2 | **Source:** https://react-hook-form.com/
