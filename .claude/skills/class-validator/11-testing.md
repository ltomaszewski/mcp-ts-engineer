# Testing DTOs

## Basic DTO Testing

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateUserDto } from './create-user.dto';

describe('CreateUserDto', () => {
  it('should pass validation with valid data', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'John Doe',
      email: 'john@example.com',
      age: 25,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('should fail validation with invalid email', async () => {
    const dto = plainToInstance(CreateUserDto, {
      name: 'John Doe',
      email: 'invalid-email',
      age: 25,
    });

    const errors = await validate(dto);
    expect(errors.length).toBe(1);
    expect(errors[0].property).toBe('email');
    expect(errors[0].constraints).toHaveProperty('isEmail');
  });
});
```

## Synchronous Testing

```typescript
import { validateSync } from 'class-validator';

const errors = validateSync(dto);
expect(errors.length).toBe(0);
```

**Note:** `validateSync` ignores async validators.

## Testing Nested Objects

```typescript
it('should fail on invalid nested address', async () => {
  const dto = plainToInstance(CreateUserDto, {
    name: 'John',
    email: 'john@example.com',
    address: { city: '', country: 'USA' },
  });

  const errors = await validate(dto);
  expect(errors.length).toBe(1);
  expect(errors[0].property).toBe('address');
  expect(errors[0].children[0].property).toBe('city');
});
```

## Testing with Validation Groups

```typescript
it('should validate only registration group', async () => {
  const dto = plainToInstance(CreateUserDto, {
    name: 'John',
    email: 'john@example.com',
    age: 16, // Below minimum for registration
  });

  const errors = await validate(dto, { groups: ['registration'] });
  expect(errors.length).toBeGreaterThan(0);
});
```

## Testing Transformation

```typescript
it('should transform and trim whitespace', () => {
  const dto = plainToInstance(CreateUserDto, {
    name: '  John Doe  ',
    email: 'john@example.com',
  });

  expect(dto.name).toBe('John Doe');
});

it('should convert string to number', () => {
  const dto = plainToInstance(CreateProductDto, {
    name: 'Product',
    price: '99.99',
  }, { enableImplicitConversion: true });

  expect(typeof dto.price).toBe('number');
});
```

## Testing Error Messages

```typescript
it('should return custom error message', async () => {
  const dto = plainToInstance(CreateUserDto, {
    name: 'A', // Too short
    email: 'john@example.com',
  });

  const errors = await validate(dto);
  expect(errors[0].constraints.length).toContain('Name must be between 2 and 30 characters');
});
```
