# Testing DTOs

## Basic DTO Testing Pattern

```typescript
import { validate, ValidationError } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  function createDto(partial: Partial<CreateUserDto>): CreateUserDto {
    return plainToInstance(CreateUserDto, {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
      ...partial,
    });
  }

  it('should pass with valid data', async () => {
    const dto = createDto({});
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('should fail with invalid email', async () => {
    const dto = createDto({ email: 'not-an-email' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });

  it('should fail when name is too short', async () => {
    const dto = createDto({ name: 'A' });
    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('name');
  });

  it('should fail when age is below minimum', async () => {
    const dto = createDto({ age: 16 });
    const errors = await validate(dto);
    const ageError = errors.find((e) => e.property === 'age');
    expect(ageError).toBeDefined();
    expect(ageError?.constraints).toHaveProperty('min');
  });

  it('should pass when optional field is omitted', async () => {
    const dto = createDto({ bio: undefined });
    const errors = await validate(dto);
    expect(errors).toHaveLength(0);
  });
});
```

## Testing Nested Objects

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateOrderDto } from './create-order.dto';

describe('CreateOrderDto (nested)', () => {
  it('should fail on invalid nested address', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      shippingAddress: { street: '', city: 'NYC', country: 'US' },
      items: [{ productId: 'abc', quantity: 1 }],
    });

    const errors = await validate(dto);
    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('shippingAddress');
    expect(errors[0].children?.[0]?.property).toBe('street');
  });

  it('should fail on invalid array item', async () => {
    const dto = plainToInstance(CreateOrderDto, {
      shippingAddress: { street: '123 Main', city: 'NYC', country: 'US' },
      items: [{ productId: '', quantity: -1 }],
    });

    const errors = await validate(dto);
    const itemsError = errors.find((e) => e.property === 'items');
    expect(itemsError).toBeDefined();
  });
});
```

## Testing Validation Groups

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { UserDto } from './user.dto';

describe('UserDto (groups)', () => {
  it('should validate registration group only', async () => {
    const dto = plainToInstance(UserDto, {
      username: 'john',
      age: 16,  // Below @Min(18) in 'registration' group
    });

    const errors = await validate(dto, { groups: ['registration'] });
    expect(errors.some((e) => e.property === 'age')).toBe(true);
  });

  it('should skip age in admin group', async () => {
    const dto = plainToInstance(UserDto, {
      username: 'john',
      age: 16,
      role: 'admin',
    });

    const errors = await validate(dto, { groups: ['admin'] });
    expect(errors.some((e) => e.property === 'age')).toBe(false);
  });
});
```

## Testing Transformations

```typescript
import { plainToInstance } from 'class-transformer';
import { SearchQueryDto } from './search-query.dto';

describe('SearchQueryDto (transform)', () => {
  it('should trim whitespace', () => {
    const dto = plainToInstance(SearchQueryDto, { search: '  hello  ' });
    expect(dto.search).toBe('hello');
  });

  it('should lowercase email', () => {
    const dto = plainToInstance(SearchQueryDto, { email: 'John@Example.COM' });
    expect(dto.email).toBe('john@example.com');
  });

  it('should split comma-separated tags', () => {
    const dto = plainToInstance(SearchQueryDto, { tags: 'a, b, c' });
    expect(dto.tags).toEqual(['a', 'b', 'c']);
  });

  it('should convert string to Date', () => {
    const dto = plainToInstance(SearchQueryDto, { startDate: '2025-01-15' });
    expect(dto.startDate).toBeInstanceOf(Date);
  });
});
```

## Testing Custom Error Messages

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

describe('Custom error messages', () => {
  it('should return custom message for short name', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'A',
      email: 'john@example.com',
    });

    const errors = await validate(dto);
    const nameError = errors.find((e) => e.property === 'name');
    const message = Object.values(nameError?.constraints ?? {})[0];
    expect(message).toContain('between');
  });
});
```

## Synchronous Validation

```typescript
import { validateSync } from 'class-validator';
import { plainToInstance } from 'class-transformer';

// Use validateSync only if you have NO async validators
const dto = plainToInstance(CreateUserDto, data);
const errors = validateSync(dto);
expect(errors).toHaveLength(0);
```

**Warning:** `validateSync` silently ignores async validators (e.g., database-checking custom validators). Always use `validate()` if async validators exist.

## Testing Per-Decorator validateIf (0.15+)

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { IsNotEmpty, IsNumber, Min } from 'class-validator';

class ShippingDto {
  type: 'standard' | 'pickup';

  @IsNotEmpty()
  @IsNumber()
  @Min(0, { validateIf: (o) => o.type !== 'pickup' })
  weight: number;
}

describe('ShippingDto (validateIf)', () => {
  it('should enforce Min when type is standard', async () => {
    const dto = plainToInstance(ShippingDto, {
      type: 'standard',
      weight: -1,
    });
    const errors = await validate(dto);
    expect(errors.some((e) => e.property === 'weight')).toBe(true);
  });

  it('should skip Min when type is pickup', async () => {
    const dto = plainToInstance(ShippingDto, {
      type: 'pickup',
      weight: -1,
    });
    const errors = await validate(dto);
    // @Min is skipped, but @IsNotEmpty and @IsNumber still run
    const weightError = errors.find((e) => e.property === 'weight');
    expect(weightError?.constraints).not.toHaveProperty('min');
  });
});
```

---

**Version:** class-validator 0.15.1 | **Source:** https://github.com/typestack/class-validator
