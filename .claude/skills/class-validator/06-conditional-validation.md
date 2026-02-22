# Conditional Validation

## @ValidateIf Decorator

Runs validators on a property only when the condition returns `true`. If the condition returns `false`, all validators on that property are skipped.

```typescript
import {
  ValidateIf, IsNotEmpty, IsString, IsEmail, Length, Matches,
} from 'class-validator';

export class CreatePostDto {
  @IsString()
  type: 'published' | 'draft';

  // Only validate if type is 'published'
  @ValidateIf((o) => o.type === 'published')
  @IsNotEmpty()
  @IsString()
  publishedBy: string;

  // Only validate if type is 'draft'
  @ValidateIf((o) => o.type === 'draft')
  @IsNotEmpty()
  @IsString()
  draftAuthor: string;

  // Only validate if type is 'published'
  @ValidateIf((o) => o.type === 'published')
  @IsEmail()
  notificationEmail: string;
}
```

## @ValidateIf Signature

| Parameter | Type | Description |
|-----------|------|-------------|
| `condition` | `(object: any, value: any) => boolean` | Receives full object and property value |
| `validationOptions` | `ValidationOptions` | Standard validation options |

## Complex Payment Form Example

```typescript
import {
  ValidateIf, IsString, IsNotEmpty, Length, Matches, IsIBAN,
} from 'class-validator';

export class PaymentDto {
  @IsString()
  @IsNotEmpty()
  paymentMethod: 'credit_card' | 'bank_transfer' | 'paypal';

  // Credit card fields - only when paymentMethod is 'credit_card'
  @ValidateIf((o) => o.paymentMethod === 'credit_card')
  @IsString()
  @Length(16, 16)
  cardNumber: string;

  @ValidateIf((o) => o.paymentMethod === 'credit_card')
  @Matches(/^(0[1-9]|1[0-2])\/\d{2}$/)
  expiryDate: string;

  @ValidateIf((o) => o.paymentMethod === 'credit_card')
  @IsString()
  @Length(3, 4)
  cvv: string;

  // Bank transfer fields
  @ValidateIf((o) => o.paymentMethod === 'bank_transfer')
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ValidateIf((o) => o.paymentMethod === 'bank_transfer')
  @IsString()
  @IsNotEmpty()
  routingNumber: string;

  // PayPal fields
  @ValidateIf((o) => o.paymentMethod === 'paypal')
  @IsString()
  @IsNotEmpty()
  paypalEmail: string;
}
```

## Mutually Exclusive Properties (Custom Decorator)

```typescript
import {
  registerDecorator, ValidationOptions, ValidationArguments,
  IsString, IsBoolean, ValidateIf,
} from 'class-validator';

export function IsNotSiblingOf(
  properties: string[],
  validationOptions?: ValidationOptions,
): PropertyDecorator {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isNotSiblingOf',
      target: object.constructor,
      propertyName,
      constraints: [properties],
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const [siblings] = args.constraints;
          const obj = args.object as Record<string, unknown>;
          return !siblings.some((prop: string) => obj[prop] !== undefined);
        },
        defaultMessage(args: ValidationArguments): string {
          const [siblings] = args.constraints;
          return `${args.property} cannot be used with: ${siblings.join(', ')}`;
        },
      },
    });
  };
}

export class UpdateResourceDto {
  @IsString()
  @IsNotSiblingOf(['deleted'])
  @ValidateIf((o) => !o.deleted)
  status?: string;

  @IsBoolean()
  @IsNotSiblingOf(['status'])
  @ValidateIf((o) => !o.status)
  deleted?: boolean;
}
```

---

**Version:** class-validator 0.14.x | **Source:** https://github.com/typestack/class-validator
