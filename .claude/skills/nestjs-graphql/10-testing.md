# Testing GraphQL Resolvers

Testing patterns for resolvers, guards, and end-to-end GraphQL queries with Vitest.

## Unit Testing Resolvers

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let usersService: {
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersService = {
      findAll: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersResolver,
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    resolver = module.get<UsersResolver>(UsersResolver);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const mockUsers = [
        { id: '1', name: 'John', email: 'john@example.com' },
        { id: '2', name: 'Jane', email: 'jane@example.com' },
      ];
      usersService.findAll.mockResolvedValue(mockUsers);

      const result = await resolver.findAll();

      expect(result).toEqual(mockUsers);
      expect(usersService.findAll).toHaveBeenCalledOnce();
    });
  });

  describe('createUser', () => {
    it('should create and return a new user', async () => {
      const input = { name: 'Bob', email: 'bob@example.com' };
      const mockUser = { id: '3', ...input };
      usersService.create.mockResolvedValue(mockUser);

      const result = await resolver.createUser(input);

      expect(result).toEqual(mockUser);
      expect(usersService.create).toHaveBeenCalledWith(input);
    });
  });
});
```

## Testing Field Resolvers with DataLoader

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { PostsResolver } from './posts.resolver';
import { UsersLoader } from '../users/users.loader';

describe('PostsResolver', () => {
  let resolver: PostsResolver;
  let usersLoader: { batchUsers: { load: ReturnType<typeof vi.fn> } };

  beforeEach(async () => {
    usersLoader = {
      batchUsers: { load: vi.fn() },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsResolver,
        { provide: UsersLoader, useValue: usersLoader },
      ],
    }).compile();

    resolver = module.get<PostsResolver>(PostsResolver);
  });

  describe('author field resolver', () => {
    it('should load author via DataLoader', async () => {
      const mockUser = { id: '1', name: 'John' };
      usersLoader.batchUsers.load.mockResolvedValue(mockUser);

      const post = { id: 'p1', title: 'Test', authorId: '1' };
      const result = await resolver.author(post);

      expect(result).toEqual(mockUser);
      expect(usersLoader.batchUsers.load).toHaveBeenCalledWith('1');
    });
  });
});
```

## E2E Testing GraphQL Queries

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('GraphQL (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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
          query: `query { users { id name email } }`,
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
      return request(app.getHttpServer())
        .post('/graphql')
        .send({
          query: `
            mutation CreateUser($input: CreateUserInput!) {
              createUser(input: $input) { id name email }
            }
          `,
          variables: { input: { name: 'Test', email: 'test@example.com' } },
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.data.createUser).toBeDefined();
          expect(res.body.data.createUser.name).toBe('Test');
        });
    });
  });
});
```

## Testing with Authentication

```typescript
describe('Authenticated GraphQL queries', () => {
  let authToken: string;

  beforeAll(async () => {
    const res = await request(app.getHttpServer())
      .post('/graphql')
      .send({
        query: `
          mutation { login(email: "admin@test.com", password: "pass") { accessToken } }
        `,
      });
    authToken = res.body.data.login.accessToken;
  });

  it('should return current user', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ query: `query { me { id email roles } }` })
      .expect(200)
      .expect((res) => {
        expect(res.body.data.me).toBeDefined();
        expect(res.body.data.me.email).toBe('admin@test.com');
      });
  });

  it('should reject unauthenticated request', () => {
    return request(app.getHttpServer())
      .post('/graphql')
      .send({ query: `query { me { id email } }` })
      .expect(200)
      .expect((res) => {
        expect(res.body.errors).toBeDefined();
        expect(res.body.errors[0].extensions.code).toBe('UNAUTHENTICATED');
      });
  });
});
```

## Testing Validation

```typescript
it('should reject invalid email in mutation', () => {
  return request(app.getHttpServer())
    .post('/graphql')
    .send({
      query: `
        mutation { createUser(input: { name: "A", email: "invalid" }) { id } }
      `,
    })
    .expect(200)
    .expect((res) => {
      expect(res.body.errors).toBeDefined();
    });
});
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Mock services, not resolvers | Test resolver logic, not service implementation |
| Mock DataLoader `.load()` | Avoid actual batching in unit tests |
| Use `vi.clearAllMocks()` in `afterEach` | Prevent test pollution |
| Test error scenarios | Verify error codes and messages |
| Test auth + roles | Verify guard behavior |
| Use `supertest` for e2e | Standard HTTP testing for GraphQL |

---

**Version:** @nestjs/graphql 13.x + vitest 4.x | **Source:** https://docs.nestjs.com/fundamentals/testing
