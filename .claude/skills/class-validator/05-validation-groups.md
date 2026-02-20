# Validation Groups

## Basic Usage

```typescript
export class User {
  @Min(12, { groups: ['registration'] })
  age: number;

  @Length(2, 20, { groups: ['registration', 'admin'] })
  name: string;

  @IsEmail({}, { groups: ['registration'] })
  email: string;

  @IsString({ groups: ['admin'] })
  role: string;
}

// Validate with specific group
await validate(user, { groups: ['registration'] });
await validate(user, { groups: ['admin'] });

// Validates all properties regardless of groups
await validate(user, { groups: undefined });
```

## Always Validate Regardless of Group

```typescript
export class User {
  @IsString({ always: true })
  @IsNotEmpty({ always: true })
  username: string;

  @Min(18, { groups: ['registration'] })
  age: number;
}
```

## Using Groups with ValidationPipe

```typescript
@Post('register')
async register(
  @Body(new ValidationPipe({ groups: ['registration'] }))
  createUserDto: CreateUserDto,
) {
  return this.userService.create(createUserDto);
}

@Put('admin/update')
async adminUpdate(
  @Body(new ValidationPipe({ groups: ['admin'] }))
  updateUserDto: UpdateUserDto,
) {
  return this.userService.update(updateUserDto);
}
```

## Common Use Cases

- **registration**: New user signup validation
- **update**: Partial update validation
- **admin**: Administrative operations
- **public**: Public-facing validation
