# NestJS Mongoose: Virtuals and Hooks (Middleware)

**Virtual properties, pre/post hooks, error handling middleware, and Mongoose 9 async patterns.**

---

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

---

## Pre Hooks (Middleware)

**Mongoose 9 breaking change:** Pre hooks no longer accept a `next()` callback. Use `async function` or return a promise. Use `function()` syntax (not arrow functions) to access `this`.

```typescript
import * as bcrypt from 'bcrypt';

// Hash password before save (Mongoose 9 — async, no next())
UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

// Soft delete: auto-filter on find queries
UserSchema.pre(/^find/, function () {
  this.find({ deletedAt: { $exists: false } });
});

// Set updatedBy before update
UserSchema.pre('findOneAndUpdate', function () {
  this.set({ updatedAt: new Date() });
});

// Validate before update
UserSchema.pre('findOneAndUpdate', function () {
  this.setOptions({ runValidators: true });
});

// Throw error to prevent operation
UserSchema.pre('save', async function () {
  if (this.role === 'admin' && !this.isNew) {
    throw new Error('Cannot modify admin users');
  }
});
```

---

## Post Hooks

Post hooks execute after the operation completes. Async post hooks with fewer than 2 parameters do not need `next()` — Mongoose waits for the promise to resolve.

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
```

---

## Error Handling Middleware

Error post hooks take 3 parameters: `(error, doc, next)`. The `next()` callback is still used in error middleware.

```typescript
// Handle duplicate key errors
UserSchema.post('save', function (error: any, doc: UserDocument, next: Function) {
  if (error.name === 'MongoServerError' && error.code === 11000) {
    next(new Error('Duplicate key: email already exists'));
  } else {
    next(error);
  }
});
```

---

## Skip Middleware (Mongoose 9.2+)

New in Mongoose 9.2: You can skip user-defined middleware using the `middleware` option. Built-in middleware (validation, timestamps) always runs.

```typescript
// Skip all user-defined hooks
await doc.save({ middleware: false });

// Skip only pre hooks
await doc.save({ middleware: { pre: false } });

// Skip only post hooks
await doc.save({ middleware: { post: false } });
```

---

## Available Hook Events

| Event | `this` | Description |
|-------|--------|-------------|
| `'save'` | Document | Before/after document save |
| `'validate'` | Document | Before/after validation |
| `'updateOne'` | Query | Before/after updateOne |
| `'deleteOne'` | Query | Before/after deleteOne |
| `'findOneAndUpdate'` | Query | Before/after findOneAndUpdate |
| `'findOneAndDelete'` | Query | Before/after findOneAndDelete |
| `/^find/` | Query | Before/after any find operation |
| `'insertMany'` | Model | Before/after bulk insert |
| `'bulkWrite'` | Model | Before/after bulk write |
| `'createCollection'` | Model | Before/after collection creation |
| `'aggregate'` | Aggregate | Before/after aggregation |

> **Mongoose 9:** The `'remove'` document middleware is deprecated. Use `deleteOne` instead.

---

## Middleware Types

| Type | `this` binding | Triggered by |
|------|----------------|--------------|
| Document | Document instance | `save()`, `validate()`, `updateOne()` on doc |
| Query | Query object | `find()`, `findOne()`, `updateOne()` on model |
| Model | Model class | `insertMany()`, `bulkWrite()`, `createCollection()` |
| Aggregate | Aggregation object | `aggregate()` |

---

## Important Rules

1. **Define hooks AFTER `SchemaFactory.createForClass()`** — hooks must be registered on the schema object
2. **Use `function()` not `() =>`** — arrow functions don't bind `this`
3. **Use `this.isModified(field)`** in save hooks to check what changed
4. **Use `this.isNew`** to check if document is being created (not updated)
5. **No `next()` in pre hooks** (Mongoose 9) — use async/await or throw errors
6. **Error hooks** still take 3 arguments: `(error, doc, next)` — the exception to the no-next rule
7. **Define all middleware before `mongoose.model()`** — hooks added after compilation won't work
8. **Define hooks before `discriminator()`** — do not add hooks after creating discriminators

---

## Mongoose 9 Migration: Hook Changes

**Breaking changes:**
- **`next()` removed from pre hooks** — use `async function` instead of `function(next) { next() }`
- **`isAsync` option removed** — legacy `schema.pre('save', true, function(next, done))` not supported
- **Custom method/static hooks require async** — custom methods and statics must be async or return promises
- **`promiseOrCallback` helper removed** — internal helper no longer exists

**New features:**
- **`{ middleware: false }`** option on `save()` to skip user hooks (Mongoose 9.2+)
- **Async stack traces** — better error tracing across async boundaries

**Migration example:**
```typescript
// Mongoose 8 (no longer works in 9)
UserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    bcrypt.hash(this.password, 10, (err, hash) => {
      if (err) return next(err);
      this.password = hash;
      next();
    });
  } else {
    next();
  }
});

// Mongoose 9 (correct)
UserSchema.pre('save', async function () {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});
```

---

**See Also**: [02-schema-definitions.md](02-schema-definitions.md) for schema options
**Source**: https://mongoosejs.com/docs/middleware.html
**Version**: @nestjs/mongoose 11.x, Mongoose 9.x
