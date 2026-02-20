# Virtuals and Hooks

## Virtuals

```typescript
@Schema({ toJSON: { virtuals: true } })
export class User {
  @Prop() firstName: string;
  @Prop() lastName: string;
}

const UserSchema = SchemaFactory.createForClass(User);

UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});
```

## Pre Hooks

```typescript
// Hash password before save
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

// Soft delete filter
UserSchema.pre(/^find/, function(next) {
  this.find({ deleted: { $ne: true } });
  next();
});
```

## Post Hooks

```typescript
UserSchema.post('save', function(doc) {
  console.log(`User ${doc.email} saved`);
});

UserSchema.post('findOneAndDelete', async function(doc) {
  if (doc) {
    await this.model('Post').deleteMany({ author: doc._id });
  }
});
```

## Important Notes

- Add hooks before `SchemaFactory.createForClass()`
- Don't use arrow functions (need `this` binding)
- Use `this.isModified()` and `this.isNew` for conditionals
