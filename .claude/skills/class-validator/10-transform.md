# Data Transformation (class-transformer)

## Core Functions

| Function | Description |
|----------|-------------|
| `plainToInstance(cls, plain, options?)` | Plain object to class instance |
| `instanceToPlain(instance, options?)` | Class instance to plain object |
| `instanceToInstance(instance, options?)` | Deep clone class instance |
| `plainToClassFromExist(existing, plain)` | Merge plain into existing instance |
| `serialize(instance)` | Instance to JSON string |
| `deserialize(cls, json)` | JSON string to class instance |

## plainToInstance

```typescript
import { plainToInstance } from 'class-transformer';
import { IsString, IsEmail, IsInt, Min } from 'class-validator';

class UserDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsInt()
  @Min(0)
  age: number;
}

// Single object
const user = plainToInstance(UserDto, {
  name: 'John',
  email: 'john@example.com',
  age: 25,
});

// Array of objects
const users = plainToInstance(UserDto, [
  { name: 'John', email: 'john@test.com', age: 25 },
  { name: 'Jane', email: 'jane@test.com', age: 30 },
]);

// With options
const strict = plainToInstance(UserDto, plain, {
  excludeExtraneousValues: true,  // Only @Expose() properties
  enableImplicitConversion: true, // Auto type conversion
  exposeDefaultValues: true,      // Include default values
});
```

## ClassTransformOptions

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `excludeExtraneousValues` | `boolean` | `false` | Only include `@Expose()` properties |
| `enableImplicitConversion` | `boolean` | `false` | Auto type conversion |
| `exposeDefaultValues` | `boolean` | `false` | Include properties with defaults |
| `groups` | `string[]` | `undefined` | Transformation groups |
| `strategy` | `'excludeAll' \| 'exposeAll'` | `'exposeAll'` | Default expose strategy |
| `excludePrefixes` | `string[]` | `undefined` | Exclude properties starting with prefix |
| `version` | `number` | `undefined` | Versioned serialization |

## @Expose and @Exclude

```typescript
import { Expose, Exclude } from 'class-transformer';

export class UserResponseDto {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  // Rename in output
  @Expose({ name: 'full_name' })
  fullName: string;

  // Conditional: only in specific groups
  @Expose({ groups: ['admin'] })
  internalNotes: string;

  // Version-based: only after version 2
  @Expose({ since: 2 })
  newField: string;

  // Version-based: removed after version 3
  @Expose({ until: 3 })
  deprecatedField: string;
}
```

## @Transform Patterns

### String Transformations

```typescript
import { Transform } from 'class-transformer';
import { IsString, IsEmail } from 'class-validator';

export class InputDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  name: string;

  @Transform(({ value }) => value?.toLowerCase())
  @IsEmail()
  email: string;

  @Transform(({ value }) => value?.toUpperCase())
  @IsString()
  countryCode: string;
}
```

### Number / Boolean / Date Transformations

```typescript
import { Transform, Type } from 'class-transformer';
import { IsNumber, IsBoolean, IsDate } from 'class-validator';

export class QueryDto {
  @Transform(({ value }) => parseFloat(value))
  @IsNumber()
  price: number;

  @Transform(({ value }) => {
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    return value;
  })
  @IsBoolean()
  isActive: boolean;

  @Type(() => Date)
  @IsDate()
  startDate: Date;
}
```

### Context-Aware Transformations

```typescript
import { Transform } from 'class-transformer';
import { IsNumber } from 'class-validator';

export class InvoiceDto {
  subtotal: number;
  taxRate: number;

  // Access sibling properties via `obj`
  @Transform(({ obj }) => obj.subtotal * (1 + obj.taxRate))
  @IsNumber()
  total: number;
}
```

### Array Transformations

```typescript
import { Transform } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export class FilterDto {
  // Comma-separated string to array
  @Transform(({ value }) =>
    typeof value === 'string' ? value.split(',').map((s) => s.trim()) : value,
  )
  @IsArray()
  @IsString({ each: true })
  tags: string[];
}
```

## toClassOnly / toPlainOnly

Control when transforms apply:

```typescript
import { Transform } from 'class-transformer';

export class UserDto {
  // Only when converting plain -> class (e.g., from request body)
  @Transform(({ value }) => value?.toLowerCase(), { toClassOnly: true })
  email: string;

  // Only when converting class -> plain (e.g., for response)
  @Transform(({ value }) => value?.toUpperCase(), { toPlainOnly: true })
  displayName: string;
}
```

---

**Version:** class-transformer 0.5.x, class-validator 0.15.1 | **Source:** https://github.com/typestack/class-transformer
