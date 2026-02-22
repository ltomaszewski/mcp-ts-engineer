# Repository Pattern

## Generic Base Repository

```typescript
import { Document, Model, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { NotFoundException } from '@nestjs/common';

export abstract class BaseRepository<T extends Document> {
  constructor(protected readonly model: Model<T>) {}

  async create(data: Partial<T>): Promise<T> {
    return new this.model(data).save();
  }

  async findAll(
    filter: FilterQuery<T> = {},
    options: { sort?: Record<string, 1 | -1>; skip?: number; limit?: number } = {},
  ): Promise<T[]> {
    return this.model
      .find(filter)
      .sort(options.sort ?? { createdAt: -1 })
      .skip(options.skip ?? 0)
      .limit(options.limit ?? 20)
      .exec();
  }

  async findById(id: string): Promise<T> {
    const doc = await this.model.findById(id).exec();
    if (!doc) {
      throw new NotFoundException(`${this.model.modelName} ${id} not found`);
    }
    return doc;
  }

  async findOne(filter: FilterQuery<T>): Promise<T | null> {
    return this.model.findOne(filter).exec();
  }

  async update(id: string, data: UpdateQuery<T>): Promise<T> {
    const doc = await this.model
      .findByIdAndUpdate(id, data, { new: true, runValidators: true })
      .exec();
    if (!doc) {
      throw new NotFoundException(`${this.model.modelName} ${id} not found`);
    }
    return doc;
  }

  async delete(id: string): Promise<void> {
    const result = await this.model.findByIdAndDelete(id).exec();
    if (!result) {
      throw new NotFoundException(`${this.model.modelName} ${id} not found`);
    }
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    return (await this.model.exists(filter)) !== null;
  }
}
```

## Concrete Repository

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserRepository extends BaseRepository<UserDocument> {
  constructor(
    @InjectModel(User.name) userModel: Model<UserDocument>,
  ) {
    super(userModel);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email }).exec();
  }

  async findByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.model.findOne({ email }).select('+password').exec();
  }

  async findActiveUsers(page: number, limit: number): Promise<UserDocument[]> {
    return this.findAll(
      { isActive: true },
      { sort: { createdAt: -1 }, skip: (page - 1) * limit, limit },
    );
  }

  async deactivate(id: string): Promise<UserDocument> {
    return this.update(id, { $set: { isActive: false } });
  }
}
```

## Service Layer Using Repository

```typescript
import { Injectable } from '@nestjs/common';
import { UserRepository } from './user.repository';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(private readonly userRepository: UserRepository) {}

  async create(dto: CreateUserDto): Promise<User> {
    return this.userRepository.create(dto);
  }

  async findById(id: string): Promise<User> {
    return this.userRepository.findById(id);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findByEmail(email);
  }

  async update(id: string, dto: UpdateUserDto): Promise<User> {
    return this.userRepository.update(id, { $set: dto });
  }

  async delete(id: string): Promise<void> {
    return this.userRepository.delete(id);
  }
}
```

## Module Registration

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './schemas/user.schema';
import { UserRepository } from './user.repository';
import { UsersService } from './users.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
  ],
  providers: [UserRepository, UsersService],
  exports: [UsersService],
})
export class UsersModule {}
```

## Pagination Helper

```typescript
interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  pages: number;
}

async paginate(
  filter: FilterQuery<T>,
  page: number,
  limit: number,
): Promise<PaginatedResult<T>> {
  const [data, total] = await Promise.all([
    this.model
      .find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .exec(),
    this.model.countDocuments(filter).exec(),
  ]);

  return {
    data,
    total,
    page,
    limit,
    pages: Math.ceil(total / limit),
  };
}
```

---

**Version:** @nestjs/mongoose 11.x, Mongoose 8.x | **Source:** https://docs.nestjs.com/techniques/mongodb
