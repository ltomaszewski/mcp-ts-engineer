# Virtuals and Hooks (Middleware)

## Virtuals

Virtuals are computed properties not stored in MongoDB. Must enable `toJSON: { virtuals: true }` on the schema.

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
  toObject: { virtuals: true },
})
export class User {
  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop()
  birthDate: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual: fullName
UserSchema.virtual('fullName').get(function (this: UserDocument): string {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual: age (computed from birthDate)
UserSchema.virtual('age').get(function (this: UserDocument): number | undefined {
  if (!this.birthDate) return undefined;
  const diff = Date.now() - this.birthDate.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
});

// Virtual populate (reference without storing ObjectId)
UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'author',
});
```

## Pre Hooks (Middleware)

Execute before the operation. Use `function()` syntax (not arrow functions) to access `this`.

```typescript
import * as bcrypt from 'bcrypt';

// Hash password before save
UserSchema.pre('save', async function (next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Soft delete: auto-filter on find queries
UserSchema.pre(/^find/, function (next) {
  this.find({ deletedAt: { $exists: false } });
  next();
});

// Set updatedBy before update
UserSchema.pre('findOneAndUpdate', function (next) {
  this.set({ updatedAt: new Date() });
  next();
});

// Validate before update
UserSchema.pre('findOneAndUpdate', function (next) {
  this.setOptions({ runValidators: true });
  next();
});
```

## Post Hooks

Execute after the operation completes.

```typescript
// Log after save
UserSchema.post('save', function (doc: UserDocument) {
  console.log(`User ${doc.email} saved successfully`);
});

// Cascade delete related documents
UserSchema.post('findOneAndDelete', async function (doc: UserDocument) {
  if (doc) {
    await this.model('Post').deleteMany({ author: doc._id });
    await this.model('Comment').deleteMany({ user: doc._id });
  }
});

// Handle duplicate key errors
UserSchema.post('save', function (error: any, doc: UserDocument, next: Function) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Duplicate key: email already exists'));
  } else {
    next(error);
  }
});
```

## Available Hook Events

| Event | `this` | Description |
|-------|--------|-------------|
| `'save'` | Document | Before/after document save |
| `'validate'` | Document | Before/after validation |
| `'remove'` | Document | Before/after document remove |
| `'updateOne'` | Query | Before/after updateOne |
| `'deleteOne'` | Query | Before/after deleteOne |
| `'findOneAndUpdate'` | Query | Before/after findOneAndUpdate |
| `'findOneAndDelete'` | Query | Before/after findOneAndDelete |
| `/^find/` | Query | Before/after any find operation |
| `'insertMany'` | Model | Before/after bulk insert |
| `'aggregate'` | Aggregate | Before/after aggregation |

## Important Rules

1. **Define hooks AFTER `SchemaFactory.createForClass()`** -- hooks must be registered on the schema object
2. **Use `function()` not `() =>`** -- arrow functions don't bind `this`
3. **Use `this.isModified(field)`** in save hooks to check what changed
4. **Use `this.isNew`** to check if document is being created (not updated)
5. **Always call `next()`** to proceed to the next middleware
6. **Error hooks** take 3 arguments: `(error, doc, next)`

---

**Version:** @nestjs/mongoose 11.x, Mongoose 8.x | **Source:** https://mongoosejs.com/docs/middleware.html
