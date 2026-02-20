# Testing GraphQL Resolvers

## Unit Testing Resolvers

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let service: UsersService;

  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(resolver).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const mockUsers = [
        { id: 1, name: 'John', email: 'john@example.com' },
        { id: 2, name: 'Jane', email: 'jane@example.com' },
      ];

      mockUsersService.findAll.mockResolvedValue(mockUsers);

      const result = await resolver.findAll();

      expect(result).toEqual(mockUsers);
      expect(mockUsersService.findAll).toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const input = { name: 'Bob', email: 'bob@example.com' };
      const mockUser = { id: 3, ...input };

      mockUsersService.create.mockResolvedValue(mockUser);

      const result = await resolver.create(input);

      expect(result).toEqual(mockUser);
      expect(mockUsersService.create).toHaveBeenCalledWith(input);
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });
});
```

## E2E Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GraphQL (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('users query', () => {
    it('should return all users', () => {
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            query {
              users {
                id
                name
                email
              }
            }
          `,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.users).toBeDefined();
          expect(Array.isArray(res.body.data.users)).toBe(true);
        });
    });
  });

  describe('createUser mutation', () => {
    it('should create a new user', () => {
      const input = {
        name: 'Test User',
        email: 'test@example.com',
      };

      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateUser($input: CreateUserInput!) {
              createUser(input: $input) {
                id
                name
                email
              }
            }
          `,
          variables: { input },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createUser).toBeDefined();
          expect(res.body.data.createUser.name).toBe(input.name);
        });
    });
  });
});
```

## Testing with Authentication

```typescript
describe('authenticated queries', () => {
  let authToken: string;

  beforeAll(async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation {
            login(email: "test@example.com", password: "password") {
              token
            }
          }
        `,
      });

    authToken = loginResponse.body.data.login.token;
  });

  it('should return current user when authenticated', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        query: `
          query {
            me {
              id
              email
            }
          }
        `,
      })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.me).toBeDefined();
      });
  });
});
```

## Testing Subscriptions

```typescript
import { WebSocket } from 'ws';

describe('GraphQL Subscriptions', () => {
  let ws: WebSocket;

  beforeAll(() => {
    ws = new WebSocket('ws://localhost:3000/graphql', 'graphql-ws');
  });

  afterAll(() => {
    ws.close();
  });

  it('should receive notification updates', (done) => {
    ws.on('open', () => {
      ws.send(JSON.stringify({
        type: 'subscribe',
        id: '1',
        payload: {
          query: `subscription { notificationAdded }`,
        },
      }));

      // Trigger notification
      request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `mutation { addNotification(message: "Test") }`,
        });
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      if (message.type === 'next') {
        expect(message.payload.data.notificationAdded).toBe('Test');
        done();
      }
    });
  });
});
```

## Best Practices

1. **Mock Dependencies** - Use `jest.fn()` to mock services
2. **Test Data Management** - Set up/tear down test data
3. **Error Scenarios** - Test various error cases
4. **Bottom-Up Testing** - Test services first, then resolvers
5. **Use Testing Database** - Keep test data separate
6. **Clear Mock History** - Use `jest.clearAllMocks()` in `afterEach`
7. **Test Field Resolvers** - Include tests for computed fields
8. **Validate Response Structure** - Check GraphQL response format
