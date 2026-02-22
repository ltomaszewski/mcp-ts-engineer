# Testing with Vitest

NestJS testing utilities with Vitest for unit and e2e tests.

## Test Module Setup

Use `Test.createTestingModule()` to create an isolated module for testing. Mock all dependencies.

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { ConfigService } from '@nestjs/config';
import { User } from './user.schema';

describe('UsersService', () => {
  let service: UsersService;
  let mockUserModel: {
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findByIdAndUpdate: ReturnType<typeof vi.fn>;
    findByIdAndDelete: ReturnType<typeof vi.fn>;
  };
  let mockConfigService: { get: ReturnType<typeof vi.fn>; getOrThrow: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockUserModel = {
      find: vi.fn(),
      findOne: vi.fn(),
      findById: vi.fn(),
      create: vi.fn(),
      findByIdAndUpdate: vi.fn(),
      findByIdAndDelete: vi.fn(),
    };

    mockConfigService = {
      get: vi.fn().mockReturnValue('test-value'),
      getOrThrow: vi.fn().mockReturnValue('test-value'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: mockUserModel },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const users = [{ id: '1', email: 'test@example.com' }];
      mockUserModel.find.mockReturnValue({ exec: vi.fn().mockResolvedValue(users) });

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockUserModel.find).toHaveBeenCalledOnce();
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const input = { email: 'new@example.com', name: 'Test' };
      const created = { id: '1', ...input };
      mockUserModel.create.mockResolvedValue(created);

      const result = await service.create(input);

      expect(result).toEqual(created);
      expect(mockUserModel.create).toHaveBeenCalledWith(input);
    });
  });
});
```

## Testing Module Methods

| Method | Purpose |
|--------|---------|
| `Test.createTestingModule({ ... })` | Create test module builder |
| `.compile()` | Compile the module |
| `.overrideProvider(token)` | Override a provider |
| `.overrideGuard(guard)` | Override a guard |
| `.overrideInterceptor(interceptor)` | Override an interceptor |
| `.overridePipe(pipe)` | Override a pipe |
| `.overrideFilter(filter)` | Override an exception filter |
| `module.get<T>(token)` | Get provider instance |
| `module.resolve<T>(token)` | Resolve request-scoped provider |

## Override Patterns

```typescript
const module = await Test.createTestingModule({
  imports: [UsersModule],
})
  .overrideProvider(ConfigService)
  .useValue({ get: vi.fn().mockReturnValue('mock') })
  .overrideGuard(AuthGuard)
  .useValue({ canActivate: () => true })
  .compile();
```

## Mock Factories

```typescript
// test/factories/user.factory.ts
import { User } from '../../src/users/user.schema';

export function createMockUser(overrides?: Partial<User>): User {
  return {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@example.com',
    name: 'John Doe',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
    ...overrides,
  } as User;
}

export function createMockUserList(count: number): User[] {
  return Array.from({ length: count }, (_, i) =>
    createMockUser({ _id: `id-${i}`, email: `user${i}@example.com` }),
  );
}
```

## Testing Guards

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RolesGuard, Reflector],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  const createMockContext = (user: any): ExecutionContext =>
    ({
      switchToHttp: () => ({ getRequest: () => ({ user }) }),
      getHandler: () => ({}),
      getClass: () => ({}),
    }) as unknown as ExecutionContext;

  it('should allow when no roles required', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);
    const context = createMockContext({ roles: ['user'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow when user has required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = createMockContext({ roles: ['admin'] });

    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny when user lacks required role', () => {
    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['admin']);
    const context = createMockContext({ roles: ['user'] });

    expect(guard.canActivate(context)).toBe(false);
  });
});
```

## Testing Interceptors

```typescript
import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();
  });

  it('should return response from handler', (done) => {
    const mockContext = {} as ExecutionContext;
    const mockHandler: CallHandler = {
      handle: () => of({ data: 'test' }),
    };

    interceptor.intercept(mockContext, mockHandler).subscribe((result) => {
      expect(result).toEqual({ data: 'test' });
      done();
    });
  });
});
```

## Testing Exception Filters

```typescript
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockJson: ReturnType<typeof vi.fn>;
  let mockStatus: ReturnType<typeof vi.fn>;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockJson = vi.fn();
    mockStatus = vi.fn().mockReturnValue({ json: mockJson });
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => ({ status: mockStatus }),
        getRequest: () => ({ url: '/test' }),
      }),
    } as unknown as ArgumentsHost;
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Not Found', HttpStatus.NOT_FOUND);
    filter.catch(exception, mockHost);

    expect(mockStatus).toHaveBeenCalledWith(404);
    expect(mockJson).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 404, message: 'Not Found' }),
    );
  });
});
```

## E2E Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('UsersController (e2e)', () => {
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

  it('GET /users should return array', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBe(true);
      });
  });

  it('POST /users should create user', () => {
    return request(app.getHttpServer())
      .post('/users')
      .send({ email: 'test@example.com', name: 'Test' })
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe('test@example.com');
      });
  });
});
```

## Vitest Configuration for NestJS

```typescript
// vitest.config.ts
import swc from 'unplugin-swc';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    root: './',
    include: ['**/*.test.ts'],
    coverage: {
      provider: 'v8',
      thresholds: { lines: 80, functions: 80, statements: 80 },
    },
  },
  plugins: [swc.vite()],
});
```

```typescript
// vitest.setup.ts
import 'reflect-metadata';
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Mock all dependencies in unit tests | Isolate unit under test |
| Use `vi.clearAllMocks()` in `afterEach` | Prevent test pollution |
| Create mock factories for common entities | Reusable, consistent test data |
| Test error paths, not just happy paths | Verify exception handling |
| Use `supertest` for e2e | Standard HTTP testing |
| Use `unplugin-swc` with Vitest | Handles decorators, 3-4x faster than Jest |
| Always `app.close()` in `afterAll` | Prevents port/connection leaks |
| Use `getModelToken(Name)` for Mongoose mocks | Correct injection token |

---

**Version:** NestJS 11.x (^11.1.14) + vitest 4.x | **Source:** https://docs.nestjs.com/fundamentals/testing
