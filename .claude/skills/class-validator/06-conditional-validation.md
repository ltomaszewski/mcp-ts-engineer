# Conditional Validation

## Two Approaches

| Approach | Scope | When to Use |
|----------|-------|-------------|
| `@ValidateIf()` decorator | All validators on a property | Toggle an entire property's validation based on a condition |
| `validateIf` option | Single decorator | Toggle one specific validator while others still run **(0.15+)** |

---

## @ValidateIf Decorator (Property-Level)

Runs validators on a property only when the condition returns `true`. If the condition returns `false`, **all** validators on that property are skipped.

```typescript
import {
  ValidateIf, IsNotEmpty, IsString, IsEmail,
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

---

## validateIf Option (Per-Decorator, 0.15+)

More granular than `@ValidateIf` — controls individual decorators independently. Available on every decorator's `ValidationOptions`.

```typescript
import { IsString, IsNotEmpty, Min, Max, IsNumber } from 'class-validator';

export class ShippingDto {
  @IsString()
  type: 'standard' | 'express' | 'pickup';

  // @IsNotEmpty always runs; @Min only runs for non-pickup
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { validateIf: (o) => o.type !== 'pickup' })
  @Max(50, { validateIf: (o) => o.type === 'express' })
  weight: number;
}
```

### Key Difference: @ValidateIf vs validateIf

```typescript
// @ValidateIf — ALL validators skipped when condition is false
@ValidateIf((o) => o.type === 'physical')
@IsNotEmpty()   // skipped when type !== 'physical'
@Min(0)         // skipped when type !== 'physical'
weight: number;

// validateIf — only the specific decorator is skipped
@IsNotEmpty()   // ALWAYS runs
@Min(0, { validateIf: (o) => o.type === 'physical' })  // only this one is conditional
weight: number;
```

---

## Complex Payment Form Example

```typescript
import {
  ValidateIf, IsString, IsNotEmpty, Length, Matches,
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

## Mixing Both Approaches (0.15+)

```typescript
import { ValidateIf, IsString, IsNotEmpty, Min, Max, IsNumber } from 'class-validator';

export class ProductDto {
  @IsString()
  category: 'physical' | 'digital' | 'subscription';

  // Property-level: only validate dimensions for physical products
  @ValidateIf((o) => o.category === 'physical')
  @IsNumber()
  @Min(0)
  weight: number;

  // Per-decorator: price always required, but min differs by category
  @IsNotEmpty()
  @IsNumber()
  @Min(0.99, {
    validateIf: (o) => o.category !== 'subscription',
    message: 'Non-subscription products must cost at least $0.99',
  })
  @Min(4.99, {
    validateIf: (o) => o.category === 'subscription',
    message: 'Subscriptions must cost at least $4.99',
  })
  price: number;
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

**Version:** class-validator 0.15.1 | **Source:** https://github.com/typestack/class-validator
