---
name: nestjs-mongoose
version: "NestJS 11 + Mongoose 8.x"
description: NestJS Mongoose/MongoDB integration - schemas, models, repository pattern, transactions, virtuals, hooks, discriminators. Use when working with MongoDB, creating schemas, or implementing data access patterns.
---

# NestJS Mongoose

> MongoDB integration for NestJS using Mongoose ODM with decorators, schemas, transactions, and the repository pattern.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating or modifying Mongoose schemas with `@Schema` and `@Prop`
- Implementing services with model injection (`@InjectModel`)
- Working with MongoDB transactions
- Adding virtuals, hooks, or middleware to schemas
- Using discriminators for polymorphic data
- Setting up repository pattern for data access

---

## Critical Rules

**ALWAYS:**
1. Use `forRootAsync` in production — load MongoDB URI from ConfigService
2. Enable `timestamps: true` on schemas — auto-manages createdAt/updatedAt
3. Set `toJSON: { virtuals: true }` if using virtuals — otherwise they won't serialize
4. Use `Connection.transaction()` helper — simpler than manual session management
5. Enable `transactionAsyncLocalStorage` in Mongoose 8.4+ — auto-propagates sessions
6. Hash passwords in pre-save hooks — never store plain text

**NEVER:**
1. Enable `autoIndex` in production — creates indexes at startup, blocks event loop
2. Forget `select: false` on sensitive fields — password, tokens should be excluded
3. Use transactions without replica set — MongoDB requires replica set for transactions
4. Pass sessions manually in Mongoose 8.4+ with AsyncLocalStorage — automatic propagation

---

## Core Patterns

### Schema with Decorators

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  toJSON: { virtuals: true, getters: true },
})
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop({ default: false })
  isActive: boolean;

  @Prop({ type: String, enum: ['user', 'admin'], default: 'user' })
  role: string;

  @Prop([String])
  tags: string[];

  @Prop({ type: Types.ObjectId, ref: 'Organization' })
  organization: Types.ObjectId;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Pre-save hook for password hashing
UserSchema.pre('save', async function(next) {
  if (this.isModified('password')) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});
```

### Service with Model Injection

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectConnection() private connection: Connection,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = new this.userModel(dto);
    return user.save();
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }
}
```

### Transaction with Helper

```typescript
async transfer(fromId: string, toId: string, amount: number): Promise<void> {
  await this.connection.transaction(async (session) => {
    await this.accountModel.updateOne(
      { _id: fromId },
      { $inc: { balance: -amount } }
    ).session(session);

    await this.accountModel.updateOne(
      { _id: toId },
      { $inc: { balance: amount } }
    ).session(session);
  });
}
```

### Module Registration

```typescript
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

---

## Anti-Patterns

**BAD** — Hardcoded connection string:
```typescript
MongooseModule.forRoot('mongodb://localhost/mydb') // WRONG - hardcoded
```

**GOOD** — Async configuration:
```typescript
MongooseModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (config: ConfigService) => ({
    uri: config.get('MONGO_URI'),
  }),
})
```

**BAD** — Manual session management:
```typescript
const session = await this.connection.startSession();
session.startTransaction();
try {
  // operations
  await session.commitTransaction();
} catch {
  await session.abortTransaction();
} finally {
  session.endSession();
}
```

**GOOD** — Transaction helper:
```typescript
await this.connection.transaction(async (session) => {
  // operations - auto commit/abort
});
```

**BAD** — Exposing password field:
```typescript
@Prop({ required: true })
password: string; // WRONG - selected by default
```

**GOOD** — Hidden by default:
```typescript
@Prop({ required: true, select: false })
password: string;
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Define schema | `@Schema()` | `@Schema({ timestamps: true })` |
| Required field | `@Prop({ required: true })` | `email: string` |
| Default value | `@Prop({ default: value })` | `@Prop({ default: false })` |
| Enum field | `@Prop({ enum: [...] })` | `@Prop({ enum: ['a', 'b'] })` |
| Array field | `@Prop([Type])` | `@Prop([String]) tags: string[]` |
| Reference | `@Prop({ type: Types.ObjectId, ref: 'Model' })` | Foreign key |
| Hide field | `@Prop({ select: false })` | Excluded from queries |
| Inject model | `@InjectModel(Name.name)` | `Model<Document>` |
| Inject connection | `@InjectConnection()` | `Connection` |
| Transaction | `connection.transaction()` | Auto commit/abort |
| Pre-save hook | `Schema.pre('save', fn)` | Password hashing |

### Common @Prop Options

| Option | Purpose | Example |
|--------|---------|---------|
| `required` | Validation | `true` |
| `unique` | Index | `true` |
| `default` | Default value | `false`, `Date.now` |
| `select` | Include in queries | `false` for passwords |
| `enum` | Allowed values | `['active', 'inactive']` |
| `minlength/maxlength` | String validation | `3`, `100` |
| `min/max` | Number validation | `0`, `1000` |
| `trim` | Whitespace | `true` |
| `lowercase/uppercase` | Case transform | `true` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Module setup and async config | [01-setup.md](01-setup.md) |
| Schema decorators and options | [02-schema-definitions.md](02-schema-definitions.md) |
| Model injection patterns | [03-model-injection.md](03-model-injection.md) |
| Repository pattern | [04-repository-pattern.md](04-repository-pattern.md) |
| Transactions (manual and helper) | [05-transactions.md](05-transactions.md) |
| Virtuals and hooks | [06-virtuals-hooks.md](06-virtuals-hooks.md) |
| Discriminators for inheritance | [07-discriminators.md](07-discriminators.md) |
| Testing with MongoMemoryServer | [08-testing.md](08-testing.md) |
| Connection options and pooling | [09-connection-options.md](09-connection-options.md) |

---

**Version:** @nestjs/mongoose 11.x + Mongoose 8.x | **Source:** https://docs.nestjs.com/techniques/mongodb
