# Basic Validation Decorators

## Common Validation Decorators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsDefined()` | `ValidationOptions?` | Not `undefined`, not `null`. Only decorator that ignores `skipMissingProperties` |
| `@IsOptional()` | `ValidationOptions?` | Skip ALL validators if value is `null` or `undefined` |
| `@Equals(comparison)` | `comparison: any` | Strict equality (`===`) with comparison |
| `@NotEquals(comparison)` | `comparison: any` | Strict inequality (`!==`) with comparison |
| `@IsEmpty()` | `ValidationOptions?` | Is `''`, `null`, or `undefined` |
| `@IsNotEmpty()` | `ValidationOptions?` | Not `''`, `null`, `undefined` |
| `@IsIn(values)` | `values: any[]` | Value is in allowed list |
| `@IsNotIn(values)` | `values: any[]` | Value is NOT in list |
| `@Allow()` | — | Prevents property stripping when no other constraint exists (whitelist mode) |

## Type Validation Decorators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsBoolean()` | `ValidationOptions?` | Boolean value |
| `@IsDate()` | `ValidationOptions?` | Date instance |
| `@IsString()` | `ValidationOptions?` | String value |
| `@IsNumber(options?)` | `IsNumberOptions?` | Any number (int or float) |
| `@IsInt()` | `ValidationOptions?` | Integer only |
| `@IsArray()` | `ValidationOptions?` | Array value |
| `@IsEnum(entity)` | `entity: object` | Value is member of enum |
| `@IsObject()` | `ValidationOptions?` | Non-null object (arrays and functions return false) |
| `@IsNotEmptyObject(options?)` | `{ nullable?: boolean }` | Object with at least one key |
| `@IsInstance(target)` | `target: any` | Value is instance of target class |

## Number Validation Decorators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsDivisibleBy(num)` | `num: number` | Divisible by num |
| `@IsPositive()` | `ValidationOptions?` | Positive number (> 0) |
| `@IsNegative()` | `ValidationOptions?` | Negative number (< 0) |
| `@Min(min)` | `min: number` | Value >= min |
| `@Max(max)` | `max: number` | Value <= max |

## Date Validation Decorators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@MinDate(date)` | `date: Date \| (() => Date)` | Date is after specified date |
| `@MaxDate(date)` | `date: Date \| (() => Date)` | Date is before specified date |

## String-Type Check Decorators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsBooleanString()` | `ValidationOptions?` | String is `"true"`, `"false"`, `"1"`, or `"0"` |
| `@IsDateString()` | `ValidationOptions?` | Alias for `@IsISO8601()` |
| `@IsNumberString(options?)` | `IsNumericOptions?` | String is a number |

## String Validation Decorators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@Contains(seed)` | `seed: string` | String contains seed |
| `@NotContains(seed)` | `seed: string` | String does NOT contain seed |
| `@IsAlpha()` | `locale?: string` | Only letters |
| `@IsAlphanumeric()` | `locale?: string` | Only letters and numbers |
| `@IsDecimal(options?)` | `IsDecimalOptions?` | Valid decimal string |
| `@IsAscii()` | — | Only ASCII characters |
| `@IsBase32()` | — | Valid Base32 string |
| `@IsBase58()` | — | Valid Base58 string |
| `@IsBase64(options?)` | `IsBase64Options?` | Valid Base64 string **(options added 0.14.1)** |
| `@IsByteLength(min, max?)` | `min: number, max?: number` | String byte length in range |
| `@IsFullWidth()` | — | Contains full-width chars |
| `@IsHalfWidth()` | — | Contains half-width chars |
| `@IsVariableWidth()` | — | Mix of full and half-width chars |
| `@IsHexColor()` | — | Hex color code |
| `@IsHSL()` | — | HSL color (CSS Colors Level 4) |
| `@IsRgbColor(options?)` | `IsRgbOptions?` | RGB or RGBA color |
| `@IsHexadecimal()` | — | Hexadecimal number |
| `@IsOctal()` | — | Octal number |
| `@IsJSON()` | — | Valid JSON string |
| `@IsJWT()` | — | Valid JWT string |
| `@IsLowercase()` | — | Lowercase string |
| `@IsUppercase()` | — | Uppercase string |
| `@IsLocale()` | — | Valid locale string |
| `@Length(min, max?)` | `min: number, max?: number` | String length in range |
| `@MinLength(min)` | `min: number` | String length >= min |
| `@MaxLength(max)` | `max: number` | String length <= max |
| `@Matches(pattern)` | `pattern: RegExp, modifiers?: string` | Matches regex pattern |
| `@IsMultibyte()` | — | Contains multibyte chars |
| `@IsSurrogatePair()` | — | Contains surrogate pair chars |
| `@IsMilitaryTime()` | — | HH:MM format |
| `@IsTimeZone()` | — | Valid IANA timezone |
| `@IsHash(algorithm)` | `algorithm: string` | Valid hash (md4, md5, sha1, sha256, etc.) |
| `@IsMimeType()` | — | Valid MIME type format |
| `@IsSemVer()` | — | Valid Semantic Version |
| `@IsStrongPassword(options?)` | `IsStrongPasswordOptions?` | Strong password check |

## Identity / Format Decorators

| Decorator | Parameters | Description |
|-----------|-----------|-------------|
| `@IsEmail(options?)` | `IsEmailOptions?` | Valid email |
| `@IsUrl(options?)` | `IsURLOptions?` | Valid URL |
| `@IsFQDN(options?)` | `IsFQDNOptions?` | Fully qualified domain name |
| `@IsUUID(version?)` | `version?: UUIDVersion` | Valid UUID — versions 1-8, `"nil"`, `"max"`, `"all"` **(extended 0.15)** |
| `@IsIP(version?)` | `version?: "4" \| "6"` | Valid IP address |
| `@IsPort()` | — | Valid port number |
| `@IsMACAddress(options?)` | `IsMACAddressOptions?` | Valid MAC address |
| `@IsISBN(version?)` | `version?: "10" \| "13"` | Valid ISBN |
| `@IsEAN()` | — | Valid EAN barcode |
| `@IsISIN()` | — | Valid ISIN (stock identifier) |
| `@IsISO8601(options?)` | `IsISO8601Options?` | Valid ISO 8601 date string |
| `@IsRFC3339()` | — | Valid RFC 3339 date |
| `@IsISRC()` | — | Valid ISRC |
| `@IsISSN(options?)` | `IsISSNOptions?` | Valid ISSN |
| `@IsMongoId()` | — | Valid MongoDB ObjectId |
| `@IsPhoneNumber(region?)` | `region?: string` | Valid phone number (libphonenumber-js) |
| `@IsMobilePhone(locale)` | `locale: string` | Valid mobile phone number |
| `@IsCreditCard()` | — | Valid credit card number |
| `@IsIdentityCard(locale?)` | `locale?: string` | Valid identity card code |
| `@IsPassportNumber(countryCode?)` | `countryCode?: string` | Valid passport number |
| `@IsPostalCode(locale?)` | `locale?: string` | Valid postal code |
| `@IsCurrency(options?)` | `IsCurrencyOptions?` | Valid currency string |
| `@IsISO4217CurrencyCode()` | — | Valid ISO 4217 currency code |
| `@IsISO31661Alpha2()` | — | Valid ISO 3166-1 alpha-2 country code |
| `@IsISO31661Alpha3()` | — | Valid ISO 3166-1 alpha-3 country code |
| `@IsISO31661Numeric()` | — | Valid ISO 3166-1 numeric country code **(0.15+)** |
| `@IsISO6391()` | — | Valid ISO 639-1 language code **(0.15+)** |
| `@IsTaxId(locale?)` | `locale?: string` | Valid tax ID for locale |
| `@IsIBAN(options?)` | `IsIBANOptions?` | Valid IBAN **(options added 0.15)** |
| `@IsBIC()` | — | Valid BIC/SWIFT code |
| `@IsEthereumAddress()` | — | Valid Ethereum address |
| `@IsBtcAddress()` | — | Valid BTC address |
| `@IsDataURI()` | — | Valid data URI |
| `@IsMagnetURI()` | — | Valid magnet URI |
| `@IsLatLong()` | — | Valid latitude-longitude coordinate |
| `@IsLatitude()` | — | Valid latitude coordinate |
| `@IsLongitude()` | — | Valid longitude coordinate |
| `@IsFirebasePushId()` | — | Valid Firebase Push ID |

## Key Differences

- **`@IsOptional()`**: Skips ALL validators if value is `null` or `undefined`
- **`@IsNotEmpty()`**: Fails on `''`, `null`, `undefined`
- **`@IsDefined()`**: Only fails on `undefined` or `null`. The only decorator that ignores `skipMissingProperties`
- **`@IsNumber()`**: Accepts int and float
- **`@IsInt()`**: Only integers
- **`@Allow()`**: Prevents stripping when whitelist is enabled but no validator is needed

## Complete DTO Example

```typescript
import {
  IsString, IsEmail, IsOptional, IsNotEmpty, IsInt,
  Min, Max, Length, MaxLength, Matches, IsEnum, IsUrl, IsBoolean,
  IsDate, IsUUID, IsIn, IsISO6391,
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

  @IsOptional()
  @IsISO6391()
  preferredLanguage?: string;
}
```

---

**Version:** class-validator 0.15.1 | **Source:** https://github.com/typestack/class-validator
