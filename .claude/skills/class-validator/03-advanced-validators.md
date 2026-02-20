# Advanced Validators

## @ValidateNested - Nested Objects

**MUST combine with @Type():**

```typescript
import { ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class Address {
  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class CreateUserDto {
  @ValidateNested()
  @Type(() => Address)
  address: Address;
}
```

## Arrays of Nested Objects

```typescript
class Photo {
  @IsString()
  url: string;
}

export class CreateAlbumDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Photo)
  photos: Photo[];
}
```

## @Transform - Data Transformation

```typescript
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  name: string;

  @IsString()
  @Transform(({ value }) => value.toUpperCase())
  code: string;

  @IsNumber()
  @Transform(({ value }) => parseFloat(value))
  price: number;

  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => value.split(',').map(s => s.trim()))
  tags: string[];
}
```

## Transform Arguments

- `value`: Property value before transformation
- `key`: Name of the property
- `obj`: The transformation source object
- `type`: Transformation type (toClassOnly, toPlainOnly)

## Discriminator Pattern (Polymorphic Types)

```typescript
@Type(() => Object, {
  discriminator: {
    property: '__type',
    subTypes: [
      { value: Landscape, name: 'landscape' },
      { value: Portrait, name: 'portrait' },
    ],
  },
  keepDiscriminatorProperty: true,
})
topPhoto: Landscape | Portrait;
```
