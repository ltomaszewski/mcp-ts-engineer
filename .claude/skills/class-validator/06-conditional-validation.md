# Conditional Validation

## @ValidateIf Decorator

```typescript
import { ValidateIf, IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDto {
  @IsString()
  type: string;

  // Only validate if type is 'published'
  @ValidateIf(o => o.type === 'published')
  @IsNotEmpty()
  @IsString()
  publishedBy: string;

  // Only validate if type is 'draft'
  @ValidateIf(o => o.type === 'draft')
  @IsNotEmpty()
  @IsString()
  draftAuthor: string;
}
```

## Complex Conditional Logic

```typescript
export class PaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentMethod: string;

  // Credit card fields
  @ValidateIf(o => o.paymentMethod === 'credit_card')
  @IsString()
  @Length(16, 16)
  cardNumber: string;

  @ValidateIf(o => o.paymentMethod === 'credit_card')
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
  expiryDate: string;

  // Bank transfer fields
  @ValidateIf(o => o.paymentMethod === 'bank_transfer')
  @IsString()
  @IsNotEmpty()
  bankAccountNumber: string;
}
```

## Mutually Exclusive Properties

```typescript
export function IsNotSiblingOf(properties: string[], validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotSiblingOf',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const [properties] = args.constraints;
          const obj = args.object as any;
          return !properties.some(prop => obj[prop] !== undefined);
        },
        defaultMessage(args: ValidationArguments) {
          const [properties] = args.constraints;
          return `$property cannot be used with: ${properties.join(', ')}`;
        },
      },
    });
  };
}

// Usage
export class UpdateDto {
  @IsString()
  @IsNotSiblingOf(['deleted'])
  @ValidateIf(o => !o.deleted)
  status?: string;

  @IsBoolean()
  @IsNotSiblingOf(['status'])
  @ValidateIf(o => !o.status)
  deleted?: boolean;
}
```
