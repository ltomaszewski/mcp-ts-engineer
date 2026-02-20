# Setup & Installation

> Installation across multiple frameworks (Next.js, Vite, Create React App, Remix) and TypeScript configuration.

**Source:** [https://react-hook-form.com/form-builder](https://react-hook-form.com/form-builder)

---

## Installation

### NPM
```bash
npm install react-hook-form
```

### Yarn
```bash
yarn add react-hook-form
```

### PNPM
```bash
pnpm add react-hook-form
```

**GitHub Repository:** https://github.com/react-hook-form/react-hook-form
**NPM Package:** https://www.npmjs.com/package/react-hook-form

---

## Framework Setup Guides

### Next.js (App Router)

```typescript
'use client'; // ← CRITICAL: Client component directive

import { useForm, SubmitHandler } from 'react-hook-form';

interface FormData {
  name: string;
  email: string;
}

export default function FormComponent() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name', { required: 'Name required' })} />
      {errors.name && <p>{errors.name.message}</p>}

      <input {...register('email', { required: 'Email required' })} />
      {errors.email && <p>{errors.email.message}</p>}

      <button type="submit">Submit</button>
    </form>
  );
}
```

**Key Point:** Next.js App Router requires `'use client'` directive for client-side form interaction.

**Source:** https://nextjs.org/docs/app/building-your-application/rendering/client-components

---

### Vite + React

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install react-hook-form
npm run dev
```

**Basic component setup:**
```typescript
import { useForm } from 'react-hook-form';

export function MyForm() {
  const { register, handleSubmit } = useForm();

  return (
    <form onSubmit={handleSubmit((data) => console.log(data))}>
      <input {...register('name')} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Source:** https://vite.dev/guide/

---

### Create React App (CRA)

```bash
npx create-react-app my-app
cd my-app
npm install react-hook-form
npm start
```

**Basic component setup:**
```typescript
import { useForm } from 'react-hook-form';

export function MyForm() {
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = (data) => {
    console.log(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('name', { required: 'Required' })} />
      {errors.name && <p>{errors.name.message}</p>}
      <button type="submit">Submit</button>
    </form>
  );
}
```

**Note:** CRA includes all necessary build tools by default.

**Source:** https://create-react-app.dev/

---

### Remix

```bash
npx create-remix@latest my-app
cd my-app
npm install react-hook-form
```

**Form component (Remix routes):**
```typescript
import { useForm, SubmitHandler } from 'react-hook-form';
import { Form } from '@remix-run/react';

interface FormData {
  email: string;
  password: string;
}

export default function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  const onSubmit: SubmitHandler<FormData> = async (data) => {
    // Submit to Remix action
    const response = await fetch('?index', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  return (
    <Form method="post" onSubmit={handleSubmit(onSubmit)}>
      <input {...register('email', { required: 'Email required' })} />
      {errors.email && <p>{errors.email.message}</p>}

      <input {...register('password', { required: 'Password required' })} type="password" />
      {errors.password && <p>{errors.password.message}</p>}

      <button type="submit">Login</button>
    </Form>
  );
}
```

**Key Point:** Remix allows both client-side and server-side form handling. Use `<Form>` for server mutations, `handleSubmit` for client validation.

**Source:** https://remix.run/docs/en/main/start/quickstart

---

## TypeScript Configuration

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "jsx": "react-jsx",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules"]
}
```

### Type Safety Tips

**Always type your forms:**
```typescript
interface LoginForm {
  email: string;
  password: string;
  rememberMe?: boolean;
}

const { register, handleSubmit } = useForm<LoginForm>({
  defaultValues: {
    email: '',
    password: '',
    rememberMe: false
  }
});
```

**Benefit:** Full IntelliSense and type checking for all form operations.

**Type-safe register:**
```typescript
// ✅ Good - TypeScript enforces field names
<input {...register('email')} />

// ❌ Error - Field doesn't exist in interface
<input {...register('nonexistent')} />
```

---

## Dependency Installation Checklist

### Minimal Setup
```bash
npm install react-hook-form
```

### With Schema Validation (choose one)

**Yup + Resolver:**
```bash
npm install yup @hookform/resolvers/yup
```

**Zod + Resolver:**
```bash
npm install zod @hookform/resolvers/zod
```

**AJV + Resolver:**
```bash
npm install ajv @hookform/resolvers/ajv
```

### With UI Library Integration

**Material-UI:**
```bash
npm install react-hook-form @mui/material
```

**Chakra UI:**
```bash
npm install react-hook-form @chakra-ui/react
```

**React Select:**
```bash
npm install react-hook-form react-select
```

---

## Project Structure Best Practices

### Recommended Folder Layout

```
src/
├── components/
│   ├── forms/
│   │   ├── LoginForm.tsx
│   │   ├── ProfileForm.tsx
│   │   └── RegistrationForm.tsx
│   ├── inputs/
│   │   ├── TextInput.tsx
│   │   ├── SelectInput.tsx
│   │   └── CheckboxInput.tsx
│   └── ...
├── hooks/
│   ├── useFormValidation.ts      // Custom form hooks
│   └── useAsync.ts               // Async utilities
├── types/
│   ├── forms.ts                  // Form interfaces
│   └── api.ts                    // API types
├── utils/
│   ├── validation.ts             // Validation helpers
│   └── api.ts                    // API client
├── pages/
│   ├── LoginPage.tsx
│   └── RegisterPage.tsx
└── App.tsx
```

### Custom Input Components

**Reusable text input with validation:**
```typescript
// src/components/inputs/TextInput.tsx
import { Controller, Control, FieldError } from 'react-hook-form';

interface TextInputProps {
  control: Control;
  name: string;
  label: string;
  error?: FieldError;
  rules?: object;
}

export function TextInput({ control, name, label, error, rules }: TextInputProps) {
  return (
    <Controller
      name={name}
      control={control}
      rules={rules}
      render={({ field }) => (
        <div>
          <label>{label}</label>
          <input {...field} />
          {error && <p className="error">{error.message}</p>}
        </div>
      )}
    />
  );
}
```

---

## Environment Variables Setup

### .env.local (Next.js/Vite)

```env
VITE_API_URL=http://localhost:3000/api
VITE_FORM_DEBUG=true
```

### Access in Code

**Vite:**
```typescript
const apiUrl = import.meta.env.VITE_API_URL;
```

**Next.js:**
```typescript
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

**Note:** Always prefix public env vars with `NEXT_PUBLIC_` or `VITE_` for browser access.

---

## Common Workflows After Setup

### Quick Start Checklist

- [ ] Install react-hook-form: `npm install react-hook-form`
- [ ] Create form component with `useForm`
- [ ] Register fields with `register()`
- [ ] Add basic validation rules
- [ ] Handle form submission with `handleSubmit()`
- [ ] Display errors from `formState.errors`
- [ ] Test in browser

### Next Steps

1. **Learn the useForm hook** → See `02-api-useform.md`
2. **Understand field registration** → See `03-api-register.md`
3. **Choose validation approach** → See `05-validation-rules.md` or `06-validation-schemas.md`
4. **Copy a pattern** → See `08-patterns-implementation.md`

---

## Troubleshooting Setup Issues

### "Cannot find module 'react-hook-form'"
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### TypeScript: "Cannot find type definitions"
```bash
# Ensure TypeScript version is 3.5+
npm install typescript@latest --save-dev
```

### Next.js: "Form not responding"
Check that component has `'use client'` directive at top.

### Vite/CRA: "Hot reload not working"
- Ensure form component is in `src/` directory
- Restart dev server: `npm run dev`

---

## Cross-References

- **Next step:** See `02-api-useform.md` to learn the useForm hook
- **TypeScript forms:** See `02-api-useform.md` for type-safe configuration
- **Custom inputs:** See `07-custom-hooks-context.md` for Controller patterns
- **Validation setup:** See `05-validation-rules.md` or `06-validation-schemas.md`

---

**Source:** https://react-hook-form.com/get-started
