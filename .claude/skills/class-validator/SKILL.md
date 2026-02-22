---
name: class-validator
version: "0.14.x"
description: Data validation and transformation with class-validator and class-transformer - DTOs, ValidationPipe, custom validators, nested validation. Use when creating DTOs, adding input validation, or transforming data.
---

# class-validator

> Type-safe input validation and data transformation for NestJS using decorators and DTOs.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating or modifying DTOs for API endpoints
- Setting up ValidationPipe configuration
- Adding validation decorators to class properties
- Implementing nested object or array validation
- Creating custom validators
- Transforming input data with @Transform or @Type

---

## Critical Rules

**ALWAYS:**
1. Enable `whitelist: true` and `forbidNonWhitelisted: true` globally — prevents mass-assignment attacks
2. Use `@Type(() => NestedDto)` with `@ValidateNested()` — nested validation won't work without @Type
3. Add `transform: true` to ValidationPipe — enables automatic type conversion
4. Combine `@IsOptional()` with other validators — order matters: @IsOptional first
5. Use `{ each: true }` for array element validation — validates each item individually

**NEVER:**
1. Skip whitelist in production — attackers can inject arbitrary properties
2. Use `@ValidateNested()` without `@Type()` — nested objects won't validate
3. Forget `@IsArray()` before array validators — array must be validated first
4. Use `enableImplicitConversion` without understanding — can cause unexpected coercions

---

## Core Patterns

### Global ValidationPipe Setup

```typescript
// main.ts
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: true },
  stopAtFirstError: true,
  exceptionFactory: (errors) => {
    const messages = errors.map(error => ({
      field: error.property,
      errors: Object.values(error.constraints || {}),
    }));
    return new BadRequestException({ message: 'Validation failed', errors: messages });
  },
}));
```

### Basic DTO with Common Validators

```typescript
import {
  IsString, IsEmail, IsOptional, IsNotEmpty,
  IsInt, Min, Max, Length, Matches, IsEnum,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(18)
  @Max(120)
  age: number;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  bio?: string;

  @IsEnum(UserRole)
  role: UserRole;

  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, underscores',
  })
  username: string;
}
```

### Nested Object Validation

```typescript
import { ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  street: string;

  @IsString()
  city: string;
}

export class CreateOrderDto {
  // Single nested object
  @ValidateNested()
  @Type(() => AddressDto)
  shippingAddress: AddressDto;

  // Array of nested objects
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Array of primitives
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
```

### Data Transformation

```typescript
import { Transform, Type } from 'class-transformer';

export class QueryDto {
  // Trim whitespace
  @Transform(({ value }) => value?.trim())
  @IsString()
  search: string;

  // Lowercase email
  @Transform(({ value }) => value?.toLowerCase())
  @IsEmail()
  email: string;

  // Parse date
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  // Comma-separated to array
  @Transform(({ value }) => typeof value === 'string' ? value.split(',') : value)
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}
```

---

## Anti-Patterns

**BAD** — No whitelist protection:
```typescript
app.useGlobalPipes(new ValidationPipe({
  transform: true,
  // Missing whitelist - attackers can inject isAdmin: true
}));
```

**GOOD** — Secure configuration:
```typescript
app.useGlobalPipes(new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
}));
```

**BAD** — Missing @Type for nested validation:
```typescript
@ValidateNested()
address: AddressDto; // Won't validate - address is plain object
```

**GOOD** — Include @Type decorator:
```typescript
@ValidateNested()
@Type(() => AddressDto)
address: AddressDto;
```

**BAD** — Wrong decorator order:
```typescript
@IsString()
@IsOptional() // Wrong - validation runs before optional check
bio?: string;
```

**GOOD** — @IsOptional first:
```typescript
@IsOptional()
@IsString()
bio?: string;
```

---

## Quick Reference

| Task | Decorator | Example |
|------|-----------|---------|
| Required string | `@IsString() @IsNotEmpty()` | `name: string` |
| Optional field | `@IsOptional()` | `@IsOptional() @IsString() bio?: string` |
| Email | `@IsEmail()` | `email: string` |
| Integer range | `@IsInt() @Min() @Max()` | `@IsInt() @Min(1) @Max(100) age: number` |
| String length | `@Length(min, max)` | `@Length(2, 50) name: string` |
| Regex | `@Matches()` | `@Matches(/^[a-z]+$/) slug: string` |
| Enum | `@IsEnum()` | `@IsEnum(Status) status: Status` |
| Nested object | `@ValidateNested() @Type()` | `@Type(() => Dto) child: Dto` |
| Array of objects | `@IsArray() @ValidateNested({ each: true }) @Type()` | `items: ItemDto[]` |
| Array of strings | `@IsArray() @IsString({ each: true })` | `tags: string[]` |
| Trim input | `@Transform(({ value }) => value?.trim())` | Removes whitespace |
| Parse date | `@Type(() => Date)` | Converts string to Date |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| ValidationPipe setup options | [01-setup.md](01-setup.md) |
| Basic validator decorators | [02-basic-validators.md](02-basic-validators.md) |
| Advanced validators (UUID, URL, etc.) | [03-advanced-validators.md](03-advanced-validators.md) |
| Custom validator creation | [04-custom-validators.md](04-custom-validators.md) |
| Validation groups | [05-validation-groups.md](05-validation-groups.md) |
| Conditional validation | [06-conditional-validation.md](06-conditional-validation.md) |
| Array validation patterns | [07-array-validation.md](07-array-validation.md) |
| Custom error messages | [08-error-messages.md](08-error-messages.md) |
| Whitelist security | [09-whitelist-security.md](09-whitelist-security.md) |
| Data transformation | [10-transform.md](10-transform.md) |
| Testing DTOs | [11-testing.md](11-testing.md) |
| Common pitfalls | [12-common-pitfalls.md](12-common-pitfalls.md) |

---

**Version:** class-validator 0.14.x | **Source:** https://github.com/typestack/class-validator
