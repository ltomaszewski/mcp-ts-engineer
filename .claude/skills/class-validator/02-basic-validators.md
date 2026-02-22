# Basic Validation Decorators

## String Validators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsString()` | `ValidationOptions?` | Checks if value is a string |
| `@IsNotEmpty()` | `ValidationOptions?` | Checks string is not `''`, `null`, `undefined` |
| `@Length(min, max)` | `min: number, max: number` | String length between min and max |
| `@MinLength(min)` | `min: number` | String length >= min |
| `@MaxLength(max)` | `max: number` | String length <= max |
| `@Contains(seed)` | `seed: string` | Checks if string contains seed |
| `@NotContains(seed)` | `seed: string` | Checks if string does NOT contain seed |
| `@Matches(pattern)` | `pattern: RegExp, modifiers?: string` | Matches regex pattern |
| `@IsAlpha()` | `locale?: string` | Only letters |
| `@IsAlphanumeric()` | `locale?: string` | Only letters and numbers |
| `@IsAscii()` | — | Only ASCII characters |
| `@IsBase64()` | — | Valid Base64 string |
| `@IsHexColor()` | — | Hex color code |
| `@IsHexadecimal()` | — | Hexadecimal number |
| `@IsJSON()` | — | Valid JSON string |
| `@IsJWT()` | — | Valid JWT string |
| `@IsLowercase()` | — | Lowercase string |
| `@IsUppercase()` | — | Uppercase string |
| `@IsLocale()` | — | Valid locale string |

## Number Validators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsNumber(options?)` | `IsNumberOptions?` | Any number (int or float) |
| `@IsInt()` | `ValidationOptions?` | Integer only |
| `@IsPositive()` | `ValidationOptions?` | Positive number |
| `@IsNegative()` | `ValidationOptions?` | Negative number |
| `@Min(min)` | `min: number` | Value >= min |
| `@Max(max)` | `max: number` | Value <= max |
| `@IsDivisibleBy(num)` | `num: number` | Divisible by num |

## Boolean / Date / Type

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsBoolean()` | `ValidationOptions?` | Boolean value |
| `@IsDate()` | `ValidationOptions?` | Date instance |
| `@IsEnum(entity)` | `entity: object` | Value is member of enum |
| `@IsObject()` | `ValidationOptions?` | Non-null object |
| `@IsNotEmptyObject()` | `options?: { nullable?: boolean }` | Object with at least one key |

## Identity / Format

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsEmail(options?)` | `IsEmailOptions?` | Valid email |
| `@IsUrl(options?)` | `IsURLOptions?` | Valid URL |
| `@IsUUID(version?)` | `version?: UUIDVersion` | Valid UUID (3, 4, 5, or all) |
| `@IsIP(version?)` | `version?: "4" \| "6"` | Valid IP address |
| `@IsPhoneNumber(region?)` | `region?: string` | Valid phone number |
| `@IsCreditCard()` | — | Valid credit card number |
| `@IsISBN(version?)` | `version?: "10" \| "13"` | Valid ISBN |
| `@IsISIN()` | — | Valid ISIN |
| `@IsMACAddress()` | — | Valid MAC address |
| `@IsPort()` | — | Valid port number |
| `@IsMilitaryTime()` | — | HH:MM format |
| `@IsISO8601()` | — | Valid ISO 8601 date string |
| `@IsMongoId()` | — | Valid MongoDB ObjectId |
| `@IsCurrency(options?)` | `IsCurrencyOptions?` | Valid currency string |
| `@IsISO4217CurrencyCode()` | — | Valid ISO 4217 currency code |
| `@IsStrongPassword(options?)` | `IsStrongPasswordOptions?` | Strong password check |
| `@IsTimeZone()` | — | Valid IANA timezone |
| `@IsTaxId(locale?)` | `locale?: string` | Valid tax ID for locale |

## Existence / Optional

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsDefined()` | `ValidationOptions?` | Not `undefined` (ignores `null`) |
| `@IsOptional()` | `ValidationOptions?` | Skip validation if `null` or `undefined` |
| `@IsNotEmpty()` | `ValidationOptions?` | Not `''`, `null`, `undefined` |
| `@IsEmpty()` | `ValidationOptions?` | Is `''`, `null`, `undefined` |
| `@IsIn(values)` | `values: any[]` | Value is in allowed list |
| `@IsNotIn(values)` | `values: any[]` | Value is NOT in list |

## Key Differences

- **`@IsOptional()`**: Skips ALL validators if value is `null` or `undefined`
- **`@IsNotEmpty()`**: Fails on `''`, `null`, `undefined`
- **`@IsDefined()`**: Only fails on `undefined` (allows `null`)
- **`@IsNumber()`**: Accepts int and float
- **`@IsInt()`**: Only integers

## Complete DTO Example

```typescript
import {
  IsString, IsEmail, IsOptional, IsNotEmpty, IsInt,
  Min, Max, Length, Matches, IsEnum, IsUrl, IsBoolean,
  IsDate, IsUUID, IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';

enum UserRole {
  Admin = 'admin',
  User = 'user',
  Guest = 'guest',
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  bio?: string;

  @IsInt()
  @Min(18)
  @Max(120)
  age: number;

  @IsBoolean()
  isActive: boolean;

  @IsEnum(UserRole)
  role: UserRole;

  @IsOptional()
  @IsUrl()
  website?: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, underscores',
  })
  username: string;

  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;

  @IsOptional()
  @IsUUID('4')
  referralCode?: string;

  @IsIn(['free', 'pro', 'enterprise'])
  plan: string;
}
```

---

**Version:** class-validator 0.14.x | **Source:** https://github.com/typestack/class-validator
