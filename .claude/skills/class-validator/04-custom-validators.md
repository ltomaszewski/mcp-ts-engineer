# Custom Validators

## Method 1: @ValidatorConstraint with @Validate

```typescript
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  IsString,
} from 'class-validator';

@ValidatorConstraint({ name: 'isSlug', async: false })
export class IsSlugConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments): boolean {
    return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(text);
  }

  defaultMessage(args: ValidationArguments): string {
    return `"${args.value}" is not a valid URL slug (lowercase, hyphens only)`;
  }
}

export class CreatePostDto {
  @IsString()
  title: string;

  @Validate(IsSlugConstraint)
  slug: string;
}
```

## @ValidatorConstraint Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | class name | Validator identifier |
| `async` | `boolean` | `false` | Set `true` if `validate()` returns Promise |

## Method 2: registerDecorator (Recommended)

Creates reusable decorator functions that look like built-in decorators.

```typescript
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  IsString,
  IsInt,
} from 'class-validator';

export function IsLongerThan(
  property: string,
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isLongerThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as Record<string, unknown>)[relatedPropertyName];
          return (
            typeof value === 'string' &&
            typeof relatedValue === 'string' &&
            value.length > relatedValue.length
          );
        },
        defaultMessage(args: ValidationArguments): string {
          const [relatedPropertyName] = args.constraints;
          return `${args.property} must be longer than ${relatedPropertyName}`;
        },
      },
    });
  };
}

export class CreateArticleDto {
  @IsString()
  title: string;

  @IsString()
  @IsLongerThan('title', { message: 'Body must be longer than the title' })
  body: string;
}
```

## registerDecorator Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `string` | Unique validator name |
| `target` | `Function` | Target class constructor |
| `propertyName` | `string` | Property being validated |
| `constraints` | `any[]` | Arguments passed to validator |
| `options` | `ValidationOptions` | Standard validation options |
| `validator` | `ValidatorConstraintInterface \| Function` | Validator class or inline object |

## Async Custom Validator (Database Lookup)

```typescript
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.schema';

@ValidatorConstraint({ name: 'IsUniqueEmail', async: true })
@Injectable()
export class IsUniqueEmailConstraint implements ValidatorConstraintInterface {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
  ) {}

  async validate(email: string): Promise<boolean> {
    const user = await this.userModel.findOne({ email }).exec();
    return !user;
  }

  defaultMessage(): string {
    return 'Email $value is already registered';
  }
}

export function IsUniqueEmail(
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUniqueEmailConstraint,
    });
  };
}
```

**Required:** Enable DI in `main.ts`:

```typescript
import { useContainer } from 'class-validator';

// After NestFactory.create(AppModule)
useContainer(app.select(AppModule), { fallbackOnErrors: true });
```

## ValidationArguments Interface

| Property | Type | Description |
|----------|------|-------------|
| `value` | `any` | The value being validated |
| `constraints` | `any[]` | Constraints passed to decorator |
| `targetName` | `string` | Name of the target class |
| `object` | `object` | The object being validated |
| `property` | `string` | Property name being validated |

---

**Version:** class-validator 0.14.x | **Source:** https://github.com/typestack/class-validator
