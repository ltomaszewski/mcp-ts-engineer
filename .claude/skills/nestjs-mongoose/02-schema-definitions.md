# Schema Definitions

## Basic Schema with @Schema and @Prop

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ required: true, minlength: 2, maxlength: 50, trim: true })
  name: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ type: String, enum: ['user', 'admin', 'moderator'], default: 'user' })
  role: string;

  @Prop([String])
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organization: Types.ObjectId;

  @Prop({ type: Map, of: String })
  metadata: Map<string, string>;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

## @Schema Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timestamps` | `boolean \| object` | `false` | Auto-manage `createdAt`/`updatedAt` |
| `toJSON` | `object` | `{}` | JSON serialization options |
| `toObject` | `object` | `{}` | Object serialization options |
| `collection` | `string` | auto | Override collection name |
| `versionKey` | `string \| false` | `'__v'` | Version key field |
| `strict` | `boolean` | `true` | Only save schema-defined fields |
| `discriminatorKey` | `string` | `'__t'` | Key for discriminators |
| `autoIndex` | `boolean` | `true` | Auto-create indexes |
| `id` | `boolean` | `true` | Virtual `id` getter |
| `_id` | `boolean` | `true` | Auto-generate `_id` |
| `minimize` | `boolean` | `true` | Remove empty objects |

## @Prop Options (Complete)

| Option | Type | Description |
|--------|------|-------------|
| `required` | `boolean \| [boolean, string]` | Field is required |
| `default` | `any \| () => any` | Default value or factory |
| `unique` | `boolean` | Create unique index |
| `index` | `boolean` | Create index |
| `sparse` | `boolean` | Sparse index |
| `select` | `boolean` | Include in queries by default |
| `type` | `SchemaType` | Explicit Mongoose type |
| `ref` | `string` | Reference to another model |
| `enum` | `string[] \| number[]` | Allowed values |
| `min` | `number \| Date` | Minimum value |
| `max` | `number \| Date` | Maximum value |
| `minlength` | `number` | Minimum string length |
| `maxlength` | `number` | Maximum string length |
| `match` | `RegExp` | Regex pattern |
| `trim` | `boolean` | Trim whitespace |
| `lowercase` | `boolean` | Lowercase string |
| `uppercase` | `boolean` | Uppercase string |
| `validate` | `Function \| object` | Custom validator |
| `get` | `(val) => val` | Getter function |
| `set` | `(val) => val` | Setter function |
| `immutable` | `boolean` | Prevent modification after creation |
| `expires` | `string \| number` | TTL index (e.g., `'7d'`) |

## Common @Prop Patterns

### Array Types

```typescript
// Array of strings
@Prop([String])
tags: string[];

// Array of numbers
@Prop([Number])
scores: number[];

// Array of embedded documents
@Prop({ type: [{ title: String, url: String }] })
links: { title: string; url: string }[];

// Array of ObjectId references
@Prop({ type: [{ type: Types.ObjectId, ref: 'Tag' }] })
tagRefs: Types.ObjectId[];
```

### Nested Schemas (Subdocuments)

```typescript
@Schema({ _id: false })
export class Address {
  @Prop({ required: true })
  street: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  country: string;

  @Prop()
  zipCode: string;
}

export const AddressSchema = SchemaFactory.createForClass(Address);

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ type: AddressSchema })
  address: Address;

  @Prop({ type: [AddressSchema] })
  addresses: Address[];
}
```

### Map Type

```typescript
@Prop({ type: Map, of: String })
metadata: Map<string, string>;

@Prop({ type: Map, of: Number, default: new Map() })
scores: Map<string, number>;
```

### Custom Validators

```typescript
@Prop({
  required: true,
  validate: {
    validator: (v: string): boolean => /^[a-z0-9-]+$/.test(v),
    message: (props: { value: string }): string =>
      `${props.value} is not a valid slug`,
  },
})
slug: string;
```

### TTL Index (Auto-Expiry)

```typescript
@Prop({ expires: '7d' })  // Document expires 7 days after creation
createdAt: Date;

@Prop({ type: Date, expires: 3600 })  // Expires 1 hour after field value
expiresAt: Date;
```

---

**Version:** @nestjs/mongoose 11.x, Mongoose 8.x | **Source:** https://docs.nestjs.com/techniques/mongodb
