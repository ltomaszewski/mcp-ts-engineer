# Testing Auth Flows

Testing authentication with Vitest and NestJS testing utilities.

## Unit Testing AuthService

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: ReturnType<typeof vi.fn>; findById: ReturnType<typeof vi.fn> };
  let jwtService: { signAsync: ReturnType<typeof vi.fn>; verifyAsync: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    usersService = {
      findByEmail: vi.fn(),
      findById: vi.fn(),
      addRefreshToken: vi.fn(),
      removeRefreshToken: vi.fn(),
      clearAllRefreshTokens: vi.fn(),
    };

    jwtService = {
      signAsync: vi.fn(),
      verifyAsync: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: vi.fn((key: string) => `test-${key}`) } },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password on valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      usersService.findByEmail.mockResolvedValue({
        id: '1',
        email: 'test@example.com',
        password: hashedPassword,
        roles: ['user'],
      });

      const result = await authService.validateUser('test@example.com', 'password123');

      expect(result).toEqual({
        id: '1',
        email: 'test@example.com',
        roles: ['user'],
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null on invalid password', async () => {
      usersService.findByEmail.mockResolvedValue({
        password: await bcrypt.hash('correct', 10),
      });

      const result = await authService.validateUser('test@example.com', 'wrong');
      expect(result).toBeNull();
    });

    it('should return null when user not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      const result = await authService.validateUser('nonexistent@example.com', 'password');
      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('should return access and refresh tokens', async () => {
      jwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await authService.login({
        id: '1',
        email: 'test@example.com',
        roles: ['user'],
      });

      expect(result).toHaveProperty('accessToken', 'access-token');
      expect(result).toHaveProperty('refreshToken', 'refresh-token');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });
});
```

## Unit Testing JwtStrategy

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import { JwtStrategy } from './jwt.strategy';
import { UsersService } from '../users/users.service';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let usersService: { findById: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    usersService = { findById: vi.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        { provide: UsersService, useValue: usersService },
        { provide: ConfigService, useValue: { get: () => 'test-jwt-secret' } },
      ],
    }).compile();

    strategy = module.get<JwtStrategy>(JwtStrategy);
  });

  it('should return user payload when user exists', async () => {
    usersService.findById.mockResolvedValue({ id: '1', email: 'test@example.com', deleted: false });

    const result = await strategy.validate({ sub: '1', email: 'test@example.com', roles: ['user'] });

    expect(result).toEqual({ id: '1', email: 'test@example.com', roles: ['user'] });
  });

  it('should throw UnauthorizedException when user not found', async () => {
    usersService.findById.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: '1', email: 'test@example.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('should throw UnauthorizedException when user is deleted', async () => {
    usersService.findById.mockResolvedValue({ id: '1', deleted: true });

    await expect(
      strategy.validate({ sub: '1', email: 'test@example.com' }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
```

## Unit Testing Guards

```typescript
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../enums/role.enum';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  function createMockContext(user: any, roles?: Role[]): ExecutionContext {
    const context = {
      getHandler: vi.fn(),
      getClass: vi.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    } as unknown as ExecutionContext;

    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(roles ?? null);
    return context;
  }

  it('should allow when no roles required', () => {
    const context = createMockContext({ roles: ['user'] });
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should allow when user has required role', () => {
    const context = createMockContext({ roles: ['admin'] }, [Role.ADMIN]);
    expect(guard.canActivate(context)).toBe(true);
  });

  it('should deny when user lacks required role', () => {
    const context = createMockContext({ roles: ['user'] }, [Role.ADMIN]);
    expect(guard.canActivate(context)).toBe(false);
  });

  it('should deny when no user on request', () => {
    const context = createMockContext(null, [Role.ADMIN]);
    expect(guard.canActivate(context)).toBe(false);
  });
});
```

## E2E Testing Auth Flow

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Auth (e2e)', () => {
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

  describe('POST /auth/login', () => {
    it('should return tokens on valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('accessToken');
          expect(res.body).toHaveProperty('refreshToken');
        });
    });

    it('should return 401 on invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'wrong' })
        .expect(401);
    });
  });

  describe('Protected routes', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'test@example.com', password: 'password123' });
      accessToken = res.body.accessToken;
    });

    it('should access protected route with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id');
          expect(res.body).toHaveProperty('email');
        });
    });

    it('should reject access without token', () => {
      return request(app.getHttpServer())
        .get('/auth/profile')
        .expect(401);
    });
  });
});
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Mock bcrypt in unit tests | Hash operations are slow |
| Test both valid and invalid credentials | Cover success and failure paths |
| Test guard execution order | Auth guard must run before roles guard |
| Use `Test.createTestingModule` | Leverage NestJS DI in tests |
| Clear mocks in `afterEach` | Prevent test pollution |
| Test token expiration | Ensure expired tokens are rejected |
| Separate unit from e2e | Unit tests mock deps, e2e tests real app |

---

**Version:** NestJS 11.x + vitest 4.x | **Source:** https://docs.nestjs.com/fundamentals/testing
