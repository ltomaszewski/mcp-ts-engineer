# Model Injection & Query Methods

## Basic Model Injection

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection, Types } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async create(dto: CreateUserDto): Promise<User> {
    const user = new this.userModel(dto);
    return user.save();
  }

  async findAll(page = 1, limit = 20): Promise<User[]> {
    return this.userModel
      .find()
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec();
  }

  async findById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).exec();
  }

  async findWithPassword(email: string): Promise<User | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { $set: dto }, { new: true, runValidators: true })
      .exec();
    if (!user) {
      throw new NotFoundException(`User ${id} not found`);
    }
    return user;
  }

  async delete(id: string): Promise<void> {
    const result = await this.userModel.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`User ${id} not found`);
    }
  }

  async count(filter: Record<string, unknown> = {}): Promise<number> {
    return this.userModel.countDocuments(filter).exec();
  }

  async exists(id: string): Promise<boolean> {
    const result = await this.userModel.exists({ _id: id });
    return result !== null;
  }
}
```

## Common Model Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `find(filter)` | `Query<T[]>` | Find multiple documents |
| `findOne(filter)` | `Query<T \| null>` | Find single document |
| `findById(id)` | `Query<T \| null>` | Find by `_id` |
| `findByIdAndUpdate(id, update, opts)` | `Query<T \| null>` | Find, update, return |
| `findByIdAndDelete(id)` | `Query<T \| null>` | Find and delete |
| `findOneAndUpdate(filter, update, opts)` | `Query<T \| null>` | Find one, update, return |
| `findOneAndDelete(filter)` | `Query<T \| null>` | Find one and delete |
| `create(doc)` | `Promise<T>` | Create document |
| `insertMany(docs)` | `Promise<T[]>` | Bulk insert |
| `updateOne(filter, update)` | `Query<UpdateResult>` | Update first match |
| `updateMany(filter, update)` | `Query<UpdateResult>` | Update all matches |
| `deleteOne(filter)` | `Query<DeleteResult>` | Delete first match |
| `deleteMany(filter)` | `Query<DeleteResult>` | Delete all matches |
| `countDocuments(filter)` | `Query<number>` | Count matching docs |
| `exists(filter)` | `Promise<{ _id } \| null>` | Check existence |
| `distinct(field, filter)` | `Query<any[]>` | Get distinct values |
| `aggregate(pipeline)` | `Aggregate<T[]>` | Aggregation pipeline |

## findByIdAndUpdate Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `new` | `boolean` | `false` | Return updated doc (not original) |
| `runValidators` | `boolean` | `false` | Run schema validators on update |
| `upsert` | `boolean` | `false` | Create if not found |
| `lean` | `boolean` | `false` | Return plain object (faster) |
| `select` | `string` | all | Fields to include/exclude |
| `populate` | `string \| object` | none | Populate references |

## Connection Injection

```typescript
import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Injectable()
export class DatabaseService implements OnModuleInit {
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  onModuleInit(): void {
    this.connection.on('connected', () => {
      console.log('MongoDB connected');
    });
    this.connection.on('error', (err: Error) => {
      console.error('MongoDB error:', err.message);
    });
  }

  getConnectionState(): string {
    const states: Record<number, string> = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    return states[this.connection.readyState] ?? 'unknown';
  }
}
```

## Named Connection Injection

```typescript
// Inject model from named connection
@InjectModel(User.name, 'analytics')
private readonly userModel: Model<UserDocument>

// Inject named connection
@InjectConnection('analytics')
private readonly analyticsConnection: Connection
```

## Populate References

```typescript
async findWithOrganization(id: string): Promise<User> {
  return this.userModel
    .findById(id)
    .populate('organization')        // populate single ref
    .populate('posts', 'title body') // populate with field selection
    .exec();
}

// Deep population
async findWithDetails(id: string): Promise<User> {
  return this.userModel
    .findById(id)
    .populate({
      path: 'organization',
      populate: { path: 'owner', select: 'name email' },
    })
    .exec();
}
```

## Lean Queries (Performance)

```typescript
// Returns plain JS object (no Mongoose document methods)
async findAllLean(): Promise<User[]> {
  return this.userModel.find().lean().exec();
}
```

---

**Version:** @nestjs/mongoose 11.x, Mongoose 8.x | **Source:** https://mongoosejs.com/docs/queries.html
