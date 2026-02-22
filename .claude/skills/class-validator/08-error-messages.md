# Custom Error Messages

## Inline Custom Messages

Every decorator accepts a `message` option:

```typescript
import { IsString, IsEmail, Length, Min, Max, Matches, IsNotEmpty } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Name must be a string' })
  @IsNotEmpty({ message: 'Name is required' })
  @Length(2, 30, {
    message: 'Name must be between $constraint1 and $constraint2 characters',
  })
  name: string;

  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @Min(18, { message: 'You must be at least $constraint1 years old' })
  @Max(120, { message: 'Age cannot exceed $constraint1' })
  age: number;

  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: '$property can only contain letters, numbers, and underscores',
  })
  username: string;
}
```

## Message Template Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `$value` | The value being validated | `"abc"` |
| `$property` | Property name | `"username"` |
| `$target` | Target class name | `"CreateUserDto"` |
| `$constraint1` | First constraint value | `2` (from `@Length(2, 30)`) |
| `$constraint2` | Second constraint value | `30` (from `@Length(2, 30)`) |

## Function-Based Messages

```typescript
import { IsString, Length, ValidationArguments } from 'class-validator';

export class CreateProductDto {
  @IsString()
  @Length(3, 100, {
    message: (args: ValidationArguments): string => {
      if (args.value.length < args.constraints[0]) {
        return `${args.property} is too short. Minimum is ${args.constraints[0]} characters, got ${args.value.length}.`;
      }
      return `${args.property} is too long. Maximum is ${args.constraints[1]} characters, got ${args.value.length}.`;
    },
  })
  name: string;
}
```

## ValidationError Structure

```typescript
interface ValidationError {
  target?: object;       // The validated object
  property: string;      // Property that failed
  value?: any;           // Value that failed
  constraints?: {        // Constraint name → error message
    [type: string]: string;
  };
  children?: ValidationError[];  // Nested validation errors
}
```

## Custom exceptionFactory (NestJS)

```typescript
import { ValidationPipe, BadRequestException } from '@nestjs/common';

app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  exceptionFactory: (errors) => {
    const formatErrors = (errs: ValidationError[], parentPath = ''): object[] => {
      return errs.flatMap((error) => {
        const path = parentPath
          ? `${parentPath}.${error.property}`
          : error.property;

        if (error.children?.length) {
          return formatErrors(error.children, path);
        }

        return [{
          field: path,
          messages: Object.values(error.constraints ?? {}),
        }];
      });
    };

    return new BadRequestException({
      statusCode: 400,
      message: 'Validation failed',
      errors: formatErrors(errors),
    });
  },
}));
```

## i18n with nestjs-i18n

```bash
npm install nestjs-i18n
```

```typescript
// app.module.ts
import { I18nModule, AcceptLanguageResolver, QueryResolver } from 'nestjs-i18n';
import * as path from 'path';

@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(__dirname, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang'] },
        AcceptLanguageResolver,
      ],
    }),
  ],
})
export class AppModule {}
```

```json
// src/i18n/en/validation.json
{
  "IS_NOT_EMPTY": "{property} should not be empty",
  "IS_EMAIL": "{property} must be a valid email address",
  "LENGTH": "{property} must be between {constraints.0} and {constraints.1} characters"
}
```

```typescript
// In DTOs
import { i18nValidationMessage } from 'nestjs-i18n';
import { IsNotEmpty, IsEmail } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: i18nValidationMessage('validation.IS_NOT_EMPTY') })
  name: string;

  @IsEmail({}, { message: i18nValidationMessage('validation.IS_EMAIL') })
  email: string;
}
```

---

**Version:** class-validator 0.14.x | **Source:** https://github.com/typestack/class-validator
