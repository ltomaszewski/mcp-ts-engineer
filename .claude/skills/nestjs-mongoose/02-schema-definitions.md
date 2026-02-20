# Schema Definitions

## Basic Schema

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ default: false })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

## Property Options

```typescript
@Prop({ required: true, minlength: 3, maxlength: 100, trim: true })
name: string;

@Prop({ type: Number, min: 0, max: 1000, default: 0 })
price: number;

@Prop({ type: String, enum: ['active', 'inactive'], default: 'active' })
status: string;

@Prop([String])
tags: string[];
```

## References

```typescript
import { Types } from 'mongoose';

@Prop({ type: Types.ObjectId, ref: 'User', required: true })
author: User | Types.ObjectId;
```

## Schema Options

```typescript
@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  collection: 'custom_name',
})
```
