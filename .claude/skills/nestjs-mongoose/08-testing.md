# Testing

## MongoMemoryServer Setup

```bash
npm install --save-dev mongodb-memory-server
```

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongod: MongoMemoryServer;

export const rootMongooseTestModule = () =>
  MongooseModule.forRootAsync({
    useFactory: async () => {
      mongod = await MongoMemoryServer.create();
      return { uri: mongod.getUri() };
    },
  });

export const closeMongoConnection = async () => {
  if (mongod) await mongod.stop();
};
```

## Integration Test

```typescript
describe('UserService', () => {
  let service: UserService;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        rootMongooseTestModule(),
        MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
      ],
      providers: [UserService],
    }).compile();

    service = module.get(UserService);
  });

  afterAll(async () => {
    await module.close();
    await closeMongoConnection();
  });

  it('should create user', async () => {
    const user = await service.create({ email: 'test@test.com' });
    expect(user.email).toBe('test@test.com');
  });
});
```

## Mock Model

```typescript
{
  provide: getModelToken(User.name),
  useValue: {
    find: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
  },
}
```
