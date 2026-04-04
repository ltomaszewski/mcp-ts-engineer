# Advanced Validators & Nested Validation

## @ValidateNested — Nested Objects

**MUST combine with `@Type()` from class-transformer** — without it, the nested object remains a plain JS object and validation decorators are never applied.

```typescript
import { IsString, IsNotEmpty, ValidateNested, IsArray } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class ContactDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsNotEmpty()
  email: string;
}

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  // Single nested object
  @ValidateNested()
  @Type(() => AddressDto)
  address: AddressDto;

  // Array of nested objects
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts: ContactDto[];
}
```

## @ValidateNested Options

All `ValidationOptions` properties apply, including the new `validateIf` (0.15+):

| Option | Type | Description |
|--------|------|-------------|
| `each` | `boolean` | Validate each item in array/Set/Map |
| `message` | `string \| ((args) => string)` | Custom error message |
| `groups` | `string[]` | Validation groups |
| `always` | `boolean` | Validate regardless of group |
| `context` | `any` | Custom context data passed to validation result |
| `validateIf` | `(object, value) => boolean` | Per-decorator conditional **(0.15+)** |

## @IsUUID — Extended Version Support (0.15+)

`@IsUUID` now supports versions 1-8 plus special identifiers:

```typescript
import { IsUUID } from 'class-validator';

export class EntityDto {
  // Specific version
  @IsUUID('4')
  id: string;

  // Accept any valid UUID (versions 1-8)
  @IsUUID('all')
  externalId: string;

  // Nil UUID (all zeros: 00000000-0000-0000-0000-000000000000)
  @IsUUID('nil')
  placeholder: string;

  // Max UUID (all f's: ffffffff-ffff-ffff-ffff-ffffffffffff)
  @IsUUID('max')
  sentinel: string;
}
```

| Version | Description |
|---------|-------------|
| `"1"` - `"8"` | Specific UUID version |
| `"nil"` | Nil UUID (all zeros) **(0.15+)** |
| `"max"` | Max UUID (all f's) **(0.15+)** |
| `"all"` | Any valid UUID format |

## New Validators in 0.15

### @IsISO6391 — Language Codes

```typescript
import { IsISO6391 } from 'class-validator';

export class LocaleSettingsDto {
  @IsISO6391()
  language: string; // "en", "fr", "de", "ja", etc.
}
```

### @IsISO31661Numeric — Country Codes (Numeric)

```typescript
import { IsISO31661Numeric, IsISO31661Alpha2, IsISO31661Alpha3 } from 'class-validator';

export class CountryDto {
  @IsISO31661Alpha2()
  alpha2: string; // "US", "BR", "DE"

  @IsISO31661Alpha3()
  alpha3: string; // "USA", "BRA", "DEU"

  @IsISO31661Numeric()
  numeric: string; // "840", "076", "276" (0.15+)
}
```

### @IsIBAN with Options (0.15+)

```typescript
import { IsIBAN } from 'class-validator';

export class BankAccountDto {
  // Basic usage
  @IsIBAN()
  iban: string;

  // With options (0.15+)
  @IsIBAN({ whitelist: ['DE', 'FR', 'NL'] })
  europeanIban: string;
}
```

## @Transform — Data Transformation

```typescript
import { Transform, Type } from 'class-transformer';
import { IsString, IsNumber, IsArray, IsEmail, IsDate } from 'class-validator';

export class SearchQueryDto {
  // Trim whitespace
  @Transform(({ value }) => value?.trim())
  @IsString()
  search: string;

  // Lowercase email
  @Transform(({ value }) => value?.toLowerCase())
  @IsEmail()
  email: string;

  // Parse numeric string to number
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  price: number;

  // Parse date string
  @Type(() => Date)
  @IsDate()
  startDate: Date;

  // Comma-separated string to array
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((s) => s.trim()) : value,
  )
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
```

## Transform Callback Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `value` | `any` | Property value before transformation |
| `key` | `string` | Property name |
| `obj` | `any` | The entire source object |
| `type` | `TransformationType` | `0` = plainToClass, `1` = classToPlain, `2` = classToClass |
| `options` | `ClassTransformOptions` | Transformation options |

## Discriminator Pattern (Polymorphic Types)

```typescript
import { Type } from 'class-transformer';
import { ValidateNested, IsString, IsNumber } from 'class-validator';

class LandscapePhoto {
  @IsString()
  location: string;

  @IsNumber()
  width: number;
}

class PortraitPhoto {
  @IsString()
  subject: string;

  @IsNumber()
  height: number;
}

export class AlbumDto {
  @IsString()
  name: string;

  @ValidateNested()
  @Type(() => Object, {
    discriminator: {
      property: '__type',
      subTypes: [
        { value: LandscapePhoto, name: 'landscape' },
        { value: PortraitPhoto, name: 'portrait' },
      ],
    },
    keepDiscriminatorProperty: true,
  })
  featuredPhoto: LandscapePhoto | PortraitPhoto;
}
```

## @ValidatePromise — Promise Values

```typescript
import { ValidatePromise, Min } from 'class-validator';

export class AsyncDto {
  @ValidatePromise()
  @Min(0)
  score: Promise<number>;
}
```

---

**Version:** class-validator 0.15.1, class-transformer 0.5.x | **Source:** https://github.com/typestack/class-validator
