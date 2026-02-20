# Transform and Data Transformation

## plainToInstance

```typescript
import { plainToInstance } from 'class-transformer';

// Single object
const user = plainToInstance(User, plainUserObject);

// Array
const users = plainToInstance(User, plainUserArray);

// With options
const user = plainToInstance(User, plainObject, {
  excludeExtraneousValues: true,
  enableImplicitConversion: true,
});
```

## instanceToPlain

```typescript
import { instanceToPlain } from 'class-transformer';

const plainObject = instanceToPlain(userInstance);
```

## @Expose and @Exclude

```typescript
import { Expose, Exclude } from 'class-transformer';

export class User {
  @Expose()
  id: number;

  @Expose()
  email: string;

  @Exclude()
  password: string;

  @Expose({ name: 'full_name' })
  fullName: string;
}
```

## @Transform Patterns

### String Transformations
```typescript
@Transform(({ value }) => value?.trim())
name: string;

@Transform(({ value }) => value?.toLowerCase())
email: string;

@Transform(({ value }) => value?.toUpperCase())
countryCode: string;
```

### Number Transformations
```typescript
@Transform(({ value }) => parseFloat(value))
price: number;

@Transform(({ value }) => Math.round(value * 100) / 100)
rating: number;
```

### Date Transformations
```typescript
@Type(() => Date)
@Transform(({ value }) => value instanceof Date ? value : new Date(value), {
  toClassOnly: true,
})
eventDate: Date;
```

### Array Transformations
```typescript
// Comma-separated string to array
@Transform(({ value }) => {
  if (typeof value === 'string') {
    return value.split(',').map(s => s.trim());
  }
  return value;
})
@IsArray()
@IsString({ each: true })
tags: string[];
```

### Boolean Transformations
```typescript
@Transform(({ value }) => {
  if (value === 'true' || value === '1' || value === 1) return true;
  if (value === 'false' || value === '0' || value === 0) return false;
  return value;
})
@IsBoolean()
isActive: boolean;
```

### Context-Aware Transformations
```typescript
@Transform(({ obj }) => obj.subtotal * (1 + obj.taxRate))
@IsNumber()
total: number;
```
