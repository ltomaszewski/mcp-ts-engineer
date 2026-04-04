# Validation Groups

Groups allow different validation rules for different contexts (e.g., registration vs admin update).

## Basic Usage

```typescript
import {
  IsString, IsNotEmpty, IsEmail, IsEnum, Min, Length,
} from 'class-validator';

enum UserRole {
  Admin = 'admin',
  User = 'user',
}

export class UserDto {
  @IsString({ always: true })
  @IsNotEmpty({ always: true })
  username: string;

  @Min(18, { groups: ['registration'] })
  age: number;

  @Length(2, 50, { groups: ['registration', 'admin'] })
  name: string;

  @IsEmail({}, { groups: ['registration'] })
  email: string;

  @IsEnum(UserRole, { groups: ['admin'] })
  role: UserRole;
}
```

## Group Behavior

| Scenario | Validated Properties |
|----------|---------------------|
| `groups: ['registration']` | `username` (always), `age`, `name`, `email` |
| `groups: ['admin']` | `username` (always), `name`, `role` |
| `groups: undefined` | ALL properties regardless of groups |
| `groups: []` | Only properties with no group or `always: true` |

## Standalone validate() with Groups

```typescript
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

const dto = plainToInstance(UserDto, {
  username: 'john',
  age: 16,
  name: 'John',
  email: 'john@example.com',
});

// Validate only registration group
const registrationErrors = await validate(dto, { groups: ['registration'] });
// age fails (16 < 18)

// Validate only admin group
const adminErrors = await validate(dto, { groups: ['admin'] });
// role fails (missing)

// Validate ALL regardless of groups
const allErrors = await validate(dto);
```

## Using Groups with ValidationPipe

```typescript
import { Controller, Post, Put, Body, ValidationPipe } from '@nestjs/common';
import { UserDto } from './dto/user.dto';

@Controller('users')
export class UsersController {
  @Post('register')
  register(
    @Body(new ValidationPipe({ groups: ['registration'] }))
    dto: UserDto,
  ): Promise<User> {
    return this.usersService.create(dto);
  }

  @Put('admin/update')
  adminUpdate(
    @Body(new ValidationPipe({ groups: ['admin'] }))
    dto: UserDto,
  ): Promise<User> {
    return this.usersService.update(dto);
  }
}
```

## `always: true` — Validate Regardless of Group

```typescript
export class UserDto {
  // Validated in EVERY group context
  @IsString({ always: true })
  @IsNotEmpty({ always: true })
  username: string;

  // Only validated when 'registration' group is active
  @Min(18, { groups: ['registration'] })
  age: number;
}
```

## Common Group Names

| Group | Use Case |
|-------|----------|
| `registration` | New user signup |
| `update` | Partial update (PATCH) |
| `admin` | Admin-level operations |
| `public` | Public-facing endpoints |
| `internal` | Internal API calls |

---

**Version:** class-validator 0.15.1 | **Source:** https://github.com/typestack/class-validator
