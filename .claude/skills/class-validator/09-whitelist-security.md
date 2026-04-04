# Whitelist & Security

## The Mass-Assignment Problem

Without whitelist protection, attackers can inject arbitrary properties into DTOs:

```typescript
// Request body: { name: "John", email: "john@test.com", isAdmin: true, role: "superadmin" }
// Without whitelist: ALL properties pass through to the service layer
```

## Solution: Whitelist Configuration

```typescript
import { ValidationPipe, BadRequestException } from '@nestjs/common';

app.useGlobalPipes(new ValidationPipe({
  // Security
  whitelist: true,              // Strip properties without decorators
  forbidNonWhitelisted: true,   // Throw error for unexpected properties

  // Type safety
  transform: true,
  transformOptions: { enableImplicitConversion: true },

  // Performance
  stopAtFirstError: true,

  // Production hardening
  disableErrorMessages: process.env.NODE_ENV === 'production',

  // Custom error formatting
  exceptionFactory: (errors) => {
    const messages = errors.map((error) => ({
      field: error.property,
      errors: Object.values(error.constraints ?? {}),
    }));
    return new BadRequestException({
      statusCode: 400,
      message: 'Validation failed',
      errors: messages,
    });
  },
}));
```

## Behavior Comparison

| Config | `{ name: "John", isAdmin: true }` | Result |
|--------|----------------------------------|--------|
| No options | `{ name: "John", isAdmin: true }` | **isAdmin passes through** |
| `whitelist: true` | `{ name: "John" }` | isAdmin silently stripped |
| `whitelist + forbidNonWhitelisted` | **400 Bad Request** | Error: "property isAdmin should not exist" |

## forbidUnknownValues (Default: true)

Rejects validation of unknown (non-class) objects. **Keep this enabled:**

```typescript
import { validate } from 'class-validator';

// This FAILS with forbidUnknownValues: true (default)
const errors = await validate({ random: 'object' });
// Error: unknown object passed to validation

// This WORKS — proper class instance
import { plainToInstance } from 'class-transformer';
const dto = plainToInstance(CreateUserDto, { name: 'John' });
const errors = await validate(dto);
```

## Security Best Practices

1. **Always** enable `whitelist: true` and `forbidNonWhitelisted: true` in production
2. **Define explicit DTOs** for every endpoint -- never reuse entity classes as DTOs
3. **Use `@IsOptional()`** for optional fields instead of omitting decorators
4. **Enable `transform: true`** for type safety (string "1" becomes number 1)
5. **Use `stopAtFirstError: true`** to fail fast and reduce error info leakage
6. **Set `disableErrorMessages`** in production to avoid exposing validation logic
7. **Never use `forbidUnknownValues: false`** -- unknown objects bypass all validation

## Separate Create vs Update DTOs

```typescript
import { IsString, IsNotEmpty, IsEmail, IsOptional } from 'class-validator';
import { PartialType, OmitType } from '@nestjs/mapped-types';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

// All fields become optional, keeps all validators
export class UpdateUserDto extends PartialType(CreateUserDto) {}

// Removes password field entirely
export class UpdateProfileDto extends PartialType(
  OmitType(CreateUserDto, ['password'] as const),
) {}
```

---

**Version:** class-validator 0.15.1 | **Source:** https://github.com/typestack/class-validator
