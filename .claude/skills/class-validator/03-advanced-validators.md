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

| Option | Type | Description |
|--------|------|-------------|
| `each` | `boolean` | Validate each item in array/Set/Map |
| `message` | `string` | Custom error message |
| `groups` | `string[]` | Validation groups |
| `always` | `boolean` | Validate regardless of group |
| `context` | `object` | Custom context data |

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

**Version:** class-validator 0.14.x, class-transformer 0.5.x | **Source:** https://github.com/typestack/class-validator
