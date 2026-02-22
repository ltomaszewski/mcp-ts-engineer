# Testing with MongoDB

## MongoMemoryServer Setup

```bash
npm install --save-dev mongodb-memory-server
```

### Test Helper Module

```typescript
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export function rootMongooseTestModule(): ReturnType<typeof MongooseModule.forRootAsync> {
  return MongooseModule.forRootAsync({
    useFactory: async () => {
      mongod = await MongoMemoryServer.create();
      return { uri: mongod.getUri() };
    },
  });
}

export async function closeMongoConnection(): Promise<void> {
  if (mongod) {
    await mongod.stop();
  }
}
```

## Integration Test

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MongooseModule } from '@nestjs/mongoose';
import { rootMongooseTestModule, closeMongoConnection } from '../test-utils';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';

describe('UsersService (Integration)', () => {
  let service: UsersService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([
          { name: User.name, schema: UserSchema },
        ]),
      ],
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterAll(async () => {
    await module.close();
    await closeMongoConnection();
  });

  it('should create a user', async () => {
    const user = await service.create({
      email: 'test@example.com',
      name: 'Test User',
      password: 'hashedPassword123',
    });

    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
  });

  it('should find user by email', async () => {
    const user = await service.findByEmail('test@example.com');
    expect(user).toBeDefined();
    expect(user?.email).toBe('test@example.com');
  });

  it('should return null for non-existent email', async () => {
    const user = await service.findByEmail('nonexistent@example.com');
    expect(user).toBeNull();
  });

  it('should update a user', async () => {
    const created = await service.create({
      email: 'update@example.com',
      name: 'Original',
      password: 'password',
    });

    const updated = await service.update(created._id.toString(), {
      name: 'Updated Name',
    });

    expect(updated.name).toBe('Updated Name');
  });

  it('should delete a user', async () => {
    const created = await service.create({
      email: 'delete@example.com',
      name: 'To Delete',
      password: 'password',
    });

    await service.delete(created._id.toString());
    const found = await service.findByEmail('delete@example.com');
    expect(found).toBeNull();
  });
});
```

## Unit Test with Mocked Model

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UsersService } from './users.service';
import { User, UserDocument } from './schemas/user.schema';

describe('UsersService (Unit)', () => {
  let service: UsersService;
  let model: Model<UserDocument>;

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'Test User',
    save: vi.fn().mockResolvedValue(this),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getModelToken(User.name),
          useValue: {
            new: vi.fn().mockResolvedValue(mockUser),
            constructor: vi.fn().mockResolvedValue(mockUser),
            find: vi.fn(),
            findOne: vi.fn(),
            findById: vi.fn(),
            findByIdAndUpdate: vi.fn(),
            findByIdAndDelete: vi.fn(),
            create: vi.fn(),
            countDocuments: vi.fn(),
            exec: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    model = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  it('should find user by email', async () => {
    vi.spyOn(model, 'findOne').mockReturnValue({
      exec: vi.fn().mockResolvedValue(mockUser),
    } as any);

    const result = await service.findByEmail('test@example.com');
    expect(result).toEqual(mockUser);
    expect(model.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
  });
});
```

## Key Test Patterns

| Pattern | When | Setup |
|---------|------|-------|
| MongoMemoryServer | Integration tests | Real in-memory MongoDB |
| Mock Model | Unit tests | `getModelToken()` + vi.fn() |
| Seeded data | Complex queries | `beforeEach` with `model.create()` |

---

**Version:** @nestjs/mongoose 11.x, Mongoose 8.x | **Source:** https://docs.nestjs.com/techniques/mongodb
