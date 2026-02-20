# Testing Best Practices

## Unit Testing

### Test Module Setup

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { User } from './user.entity';

describe('UsersService', () => {
  let service: UsersService;
  let mockRepository: any;

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      const users = [{ id: '1', email: 'test@example.com' }];
      mockRepository.find.mockResolvedValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
    });
  });

  describe('create', () => {
    it('should create a new user', async () => {
      const userData = { email: 'new@example.com', password: 'password' };
      const createdUser = { id: '1', ...userData };

      mockRepository.create.mockReturnValue(createdUser);
      mockRepository.save.mockResolvedValue(createdUser);

      const result = await service.create(userData);

      expect(result).toEqual(createdUser);
      expect(mockRepository.create).toHaveBeenCalledWith(userData);
      expect(mockRepository.save).toHaveBeenCalledWith(createdUser);
    });
  });
});
```

### Mock Factories

```typescript
// test/factories/user.factory.ts
import { User } from '../../src/users/user.entity';

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: '1',
  email: 'test@example.com',
  password: 'hashedPassword',
  firstName: 'John',
  lastName: 'Doe',
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true,
  ...overrides,
});
```

## E2E Testing

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('UsersController (e2e)', () => {
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

  it('/users (GET)', () => {
    return request(app.getHttpServer())
      .get('/users')
      .expect(200)
      .expect((res) => {
        expect(Array.isArray(res.body)).toBeTruthy();
      });
  });

  it('/users (POST)', () => {
    const createUserDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    return request(app.getHttpServer())
      .post('/users')
      .send(createUserDto)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('id');
        expect(res.body.email).toBe(createUserDto.email);
      });
  });
});
```

## Best Practices Summary

1. **Organize tests by feature** - Keep `.spec.ts` files next to source files
2. **Use test fixtures** - Create reusable test data factories
3. **Mock external dependencies** - Isolate units under test
4. **Use separate test database** - Never test against production data
5. **Clean up between tests** - Ensure test isolation with `beforeEach`/`afterEach`
6. **Test edge cases** - Include error handling, null values, boundaries
7. **Use descriptive test names** - Clearly state what is being tested
8. **Aim for meaningful coverage** - Prioritize critical paths over 100% coverage
9. **Run tests in CI/CD** - Automate testing in deployment pipeline
10. **Use `createTestingModule`** - Leverage NestJS testing utilities
