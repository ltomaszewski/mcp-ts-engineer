# Custom Validators

## Method 1: @ValidatorConstraint with @Validate

```typescript
import {
  ValidatorConstraint, ValidatorConstraintInterface,
  ValidationArguments, Validate,
} from 'class-validator';

@ValidatorConstraint({ name: 'customText', async: false })
export class CustomTextLength implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    return text.length > 1 && text.length < 10;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Text ($value) is too short or too long!';
  }
}

// Usage
export class Post {
  @Validate(CustomTextLength)
  title: string;
}
```

## Method 2: registerDecorator (Recommended)

```typescript
import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsLongerThan(property: string, validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isLongerThan',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [property],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          const relatedValue = (args.object as any)[relatedPropertyName];
          return typeof value === 'string' &&
            typeof relatedValue === 'string' &&
            value.length > relatedValue.length;
        },
        defaultMessage(args: ValidationArguments) {
          const [relatedPropertyName] = args.constraints;
          return `$property must be longer than ${relatedPropertyName}`;
        },
      },
    });
  };
}

// Usage
export class Post {
  @IsString()
  title: string;

  @IsString()
  @IsLongerThan('title')
  text: string;
}
```

## Async Custom Validator (Database)

```typescript
@ValidatorConstraint({ name: 'IsUserAlreadyExist', async: true })
@Injectable()
export class IsUserAlreadyExistConstraint implements ValidatorConstraintInterface {
  constructor(private readonly userRepository: UserRepository) {}

  async validate(email: string) {
    const user = await this.userRepository.findByEmail(email);
    return !user;
  }

  defaultMessage() {
    return 'User with email $value already exists';
  }
}

// Create decorator wrapper
export function IsUserAlreadyExist(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsUserAlreadyExistConstraint,
    });
  };
}
```

**Enable DI in main.ts:**
```typescript
useContainer(app.select(AppModule), { fallbackOnErrors: true });
```
