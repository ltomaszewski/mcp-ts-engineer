# Basic Validators

## Common Decorators

```typescript
import {
  IsString, IsNumber, IsInt, IsEmail, IsOptional,
  IsNotEmpty, IsBoolean, IsDate, IsEnum, IsUrl,
  Length, Min, Max, MinLength, MaxLength, Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 30)
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  bio?: string;

  @IsInt()
  @Min(18)
  @Max(120)
  age: number;

  @IsBoolean()
  isActive: boolean;

  @IsEnum(UserRole)
  role: UserRole;

  @IsUrl()
  @IsOptional()
  website?: string;

  @IsString()
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, underscores',
  })
  username: string;

  @IsDate()
  @Type(() => Date)
  dateOfBirth: Date;
}
```

## Key Differences

- **@IsOptional()**: Skips validation if `null` or `undefined`
- **@IsNotEmpty()**: Not `''`, `null`, or `undefined`
- **@IsDefined()**: Only checks for `undefined`
- **@IsNumber()**: Any number (int or float)
- **@IsInt()**: Only integers
