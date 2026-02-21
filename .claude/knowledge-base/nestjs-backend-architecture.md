# NestJS Backend Architecture Guide

Comprehensive NestJS backend development guide - project setup, module architecture, GraphQL APIs, MongoDB integration, authentication, and deployment.

## Tech Stack Reference

| Category | Technology | Version |
|----------|------------|---------|
| Framework | NestJS | ^11.x |
| API | GraphQL (Yoga) | ^5.x |
| Database | MongoDB (Mongoose) | ^8.x |
| Authentication | Passport.js + JWT | ^10.x |
| Validation | class-validator + class-transformer | ^0.14.x |
| Configuration | @nestjs/config | ^4.x |
| Testing | Vitest + @nestjs/testing | ^4.x |
| Linting | Biome | ^2.x |
| Dev Runner | tsx (esbuild) | ^4.x |

---

## CRITICAL: Explicit Dependency Injection

Dev mode uses `tsx` (esbuild) which does **not** support `emitDecoratorMetadata`. All NestJS code **must** use explicit decorators for DI and GraphQL types. This ensures code works across all environments (tsx, SWC, tsc).

### Rules

1. **Always use `@Inject(ServiceName)`** on every constructor service parameter
2. **Always use `@Field(() => Type)`** with explicit type functions on GraphQL fields
3. **`@InjectModel()`, `@InjectConnection()`** are already explicit — no change needed

### Examples

```typescript
// CORRECT — works everywhere (tsx, SWC, tsc)
@Controller("users")
export class UserController {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
    @Inject(AuthService) private readonly authService: AuthService,
  ) {}
}

// WRONG — breaks with tsx/esbuild (no decorator metadata emitted)
@Controller("users")
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
  ) {}
}
```

```typescript
// CORRECT — explicit GraphQL field types
@ObjectType()
export class UserOutput {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => Float)
  score!: number;

  @Field(() => Boolean)
  isActive!: boolean;

  @Field(() => Date)
  createdAt!: Date;
}

// WRONG — relies on metadata for type inference
@ObjectType()
export class UserOutput {
  @Field()
  name!: string;
}
```

---

## Project Structure

```
src/
├── core/                    # Infrastructure (app-wide singletons)
│   ├── database/            # Database connections, schemas module
│   │   └── schemas.module.ts
│   ├── config/              # Environment validation, namespaced config
│   └── logging/             # Custom logger providers
│
├── common/                  # Shared utilities (reusable, no business logic)
│   ├── decorators/          # Custom decorators (@CurrentUser, @Public)
│   ├── guards/              # Generic guards (GqlAuthGuard, ThrottleGuard)
│   ├── pipes/               # Validation pipes
│   ├── filters/             # Exception filters
│   ├── interceptors/        # Generic interceptors
│   ├── strategies/          # Passport strategies (jwt.strategy.ts)
│   ├── modules/             # Shared domain modules (SleepDataModule)
│   ├── services/            # Pure utility services (no domain knowledge)
│   ├── types/               # Shared TypeScript types/interfaces
│   └── utils/               # Pure utility functions
│
├── models/                  # Mongoose schemas (shared across modules)
│   ├── user.schema.ts
│   └── *.schema.ts
│
├── modules/                 # Feature modules (business logic)
│   ├── auth/
│   │   ├── dto/             # Input/Output types
│   │   │   ├── login.input.ts
│   │   │   ├── auth-response.type.ts
│   │   │   └── index.ts     # Barrel export
│   │   ├── services/        # Internal services (NOT exported)
│   │   │   ├── auth-token.service.ts
│   │   │   └── index.ts
│   │   ├── tests/           # Unit and integration tests
│   │   │   └── auth.service.test.ts
│   │   ├── types/           # Module-specific types
│   │   ├── constants/       # Module constants
│   │   ├── auth.service.ts  # Public facade service (EXPORTED)
│   │   ├── auth.resolver.ts # GraphQL resolver (never export)
│   │   ├── auth.module.ts   # Module definition
│   │   └── index.ts         # Public API barrel
│   ├── user/
│   ├── health/
│   └── <feature>/
│
├── generated/               # Auto-generated files (GraphQL schema)
│   └── schema.graphql
│
├── app.module.ts            # Root module
└── main.ts                  # Bootstrap
```

---

## Layer Rules

| Layer | Contains | Can Import From | Exported To |
|-------|----------|-----------------|-------------|
| Core | Infrastructure services | External packages only | AppModule |
| Common | Generic utilities | Core, external packages | Any module |
| Feature | Business logic | Core, Common, other Features | Other Features |

---

## Module Architecture

### Feature Module Structure

Each feature module follows the **Facade Pattern** - exposes ONE public service, hides internal implementation:

```typescript
// modules/auth/auth.module.ts
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '60m' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
    ]),
    forwardRef(() => NotificationModule), // Circular dep handling
  ],
  providers: [
    // Infrastructure
    JwtStrategy,
    // Internal services (NOT exported)
    AuthAppleService,
    AuthTokenService,
    // Public facade service
    AuthService,
    // Resolver (NEVER export)
    AuthResolver,
  ],
  exports: [
    PassportModule,
    JwtModule,
    AuthService, // ONLY export facade
  ],
})
export class AuthModule {}
```

### Barrel Files (index.ts)

Define PUBLIC API explicitly:

```typescript
// modules/auth/index.ts
// Only export what OTHER modules need

// Public service facade
export { AuthService } from './auth.service';

// Public DTOs for typing
export {
  AuthResponse,
  LoginInput,
  SignupInput,
} from './dto';

// NEVER export:
// - Internal services (auth-apple.service, auth-token.service)
// - Resolvers
// - Module class itself
```

---

## GraphQL Setup

### App Module Configuration

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
        maxPoolSize: 50,
        minPoolSize: 5,
        serverSelectionTimeoutMS: 30000,
        socketTimeoutMS: 45000,
        heartbeatFrequencyMS: 30000,
        maxIdleTimeMS: 120000,
        retryWrites: true,
        retryReads: true,
      }),
      inject: [ConfigService],
    }),
    GraphQLModule.forRoot<YogaDriverConfig>({
      driver: YogaDriver,
      autoSchemaFile: true,
    }),
    // Feature modules
    AuthModule,
    UserModule,
    HealthModule,
  ],
})
export class AppModule {}
```

### Resolver Pattern

```typescript
// modules/user/user.resolver.ts
@Resolver(() => UserOutput)
export class UserResolver {
  constructor(
    @Inject(UserService) private readonly userService: UserService,
  ) {}

  @Query(() => UserOutput, { description: 'Get current user profile' })
  @UseGuards(GqlAuthGuard)
  async me(@CurrentUser() user: UserDocument): Promise<UserOutput> {
    return this.userService.findById(user._id);
  }

  @Mutation(() => UserOutput, { description: 'Update user profile' })
  @UseGuards(GqlAuthGuard)
  async updateUser(
    @Args('input') input: UpdateUserInput,
    @CurrentUser() user: UserDocument,
  ): Promise<UserOutput> {
    return this.userService.update(user._id, input);
  }
}
```

### DTO Patterns

```typescript
// modules/user/dto/create-user.input.ts
@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String)
  @IsEmail()
  email!: string;

  @Field(() => String)
  @MinLength(8)
  password!: string;
}

// modules/user/dto/user.output.ts
@ObjectType()
export class UserOutput {
  @Field(() => ID)
  id!: string;

  @Field(() => String)
  name!: string;

  @Field(() => String)
  email!: string;

  @Field(() => Date)
  createdAt!: Date;
}
```

---

## Authentication

### JWT Strategy

```typescript
// common/strategies/jwt.strategy.ts
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload): Promise<UserDocument> {
    const user = await this.userModel.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }
}
```

### Auth Guard for GraphQL

```typescript
// common/guards/gql-auth.guard.ts
@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  getRequest(context: ExecutionContext): Request {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }
}
```

### Current User Decorator

```typescript
// common/decorators/current-user.decorator.ts
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): UserDocument => {
    const context = GqlExecutionContext.create(ctx);
    return context.getContext().req.user;
  },
);
```

### Public Decorator (Skip Auth)

```typescript
// common/decorators/public.decorator.ts
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

---

## MongoDB with Mongoose

### Schema Definition

```typescript
// models/user.schema.ts
@Schema({
  timestamps: true,
  toJSON: {
    virtuals: true,
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
      delete ret.password;
      return ret;
    },
  },
})
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: [String], default: [] })
  pushTokens: string[];

  @Prop({ type: [RefreshTokenSchema], default: [] })
  refreshTokens: RefreshToken[];
}

export type UserDocument = HydratedDocument<User>;
export const UserSchema = SchemaFactory.createForClass(User);
```

### Centralized Schema Registration

```typescript
// core/database/schemas.module.ts
@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Kid.name, schema: KidSchema },
      { name: SleepSession.name, schema: SleepSessionSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SchemasModule {}

// Feature modules import SchemasModule instead of registering schemas individually
@Module({
  imports: [SchemasModule],
  // ...
})
export class UserModule {}
```

### Model Injection in Services

```typescript
// modules/user/user.service.ts
@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @Inject(KidService) private readonly kidService: KidService,
  ) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async create(input: CreateUserInput): Promise<UserDocument> {
    const user = new this.userModel(input);
    return user.save();
  }
}
```

---

## Validation

### Global Validation Pipe

```typescript
// main.ts
async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,               // Auto-transform payloads to DTO instances
      whitelist: true,               // Strip unknown properties
      forbidNonWhitelisted: true,    // Throw on unknown properties
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.enableCors();

  const port = process.env.PORT || 3001;
  await app.listen(port);
}
```

### DTO Validation Decorators

```typescript
@InputType()
export class CreateKidInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  name!: string;

  @Field(() => String)
  @IsDateString()
  birthDate!: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  timezone?: string;
}
```

---

## Exception Handling

### Custom Exceptions

```typescript
// modules/auth/exceptions/duplicate-email.exception.ts
export class DuplicateEmailException extends BadRequestException {
  constructor(email: string) {
    super(`Email ${email} is already registered`);
  }
}

// modules/user/exceptions/user-not-found.exception.ts
export class UserNotFoundException extends NotFoundException {
  constructor(userId: string) {
    super(`User with ID ${userId} not found`);
  }
}
```

### Usage in Services

```typescript
async createUser(input: CreateUserInput): Promise<UserDocument> {
  const existing = await this.userModel.findOne({ email: input.email });
  if (existing) {
    throw new DuplicateEmailException(input.email);
  }
  // ...
}
```

---

## Testing

### Unit Test Structure

```typescript
// modules/auth/tests/auth.service.test.ts
describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<UserDocument>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        AuthTokenService,
        {
          provide: getModelToken(User.name),
          useValue: {
            findOne: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('test-token'),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<UserDocument>>(getModelToken(User.name));
  });

  describe('login', () => {
    it('should return tokens for valid credentials', async () => {
      const mockUser = { _id: 'user-id', email: 'test@example.com' };
      jest.spyOn(userModel, 'findOne').mockResolvedValue(mockUser);

      const result = await service.login({
        email: 'test@example.com',
        password: 'password',
      });

      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(userModel, 'findOne').mockResolvedValue(null);

      await expect(
        service.login({ email: 'wrong@example.com', password: 'wrong' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
```

### Mock Factories

```typescript
// common/test-utils/mock-factories.ts
export function createMockUser(overrides: Partial<User> = {}): User {
  return {
    _id: new Types.ObjectId().toString(),
    name: 'Test User',
    email: 'test@example.com',
    password: 'hashedpassword',
    pushTokens: [],
    refreshTokens: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function createMockUserModel() {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    updateOne: jest.fn(),
    deleteOne: jest.fn(),
  };
}
```

---

## Configuration

### Environment Variables

```env
# Server
PORT=3001
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/myapp
MONGO_URI_DEV=mongodb://localhost:27017/myapp-dev

# JWT
JWT_SECRET=your-32-character-minimum-secret
JWT_REFRESH_SECRET=different-secret-for-refresh

# External Services
APPLE_ID_CLIENT_ID=com.example.app
```

### Typed Configuration

```typescript
// core/config/database.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('database', () => ({
  uri: process.env.MONGO_URI,
  maxPoolSize: parseInt(process.env.DB_POOL_SIZE || '50', 10),
}));

// Usage
@Injectable()
export class SomeService {
  constructor(
    @Inject(databaseConfig.KEY)
    private dbConfig: ConfigType<typeof databaseConfig>,
  ) {
    console.log(this.dbConfig.uri);
  }
}
```

---

## Health Checks

### Health Module

```typescript
// modules/health/health.module.ts
@Module({
  controllers: [HealthController],
  providers: [HealthService],
})
export class HealthModule {}

// modules/health/health.controller.ts
@Controller('health')
export class HealthController {
  constructor(
    @Inject(HealthService) private readonly healthService: HealthService,
  ) {}

  @Get()
  async check(): Promise<HealthCheckResult> {
    return this.healthService.check();
  }
}
```

---

## Commands Reference

```bash
# Development
npm run dev                 # Start with hot-reload (tsx watch)
npm run dev:local           # Start with in-memory MongoDB
npm run start               # Start production
npm run build               # Build for production

# Testing
npm test                    # Run all tests (Vitest)
npm run test:watch          # Watch mode
npm run test:coverage       # Coverage report

# Linting & Formatting
npm run lint                # Biome check
npm run format              # Biome format

# Type checking
npm run type-check          # tsc --noEmit
```

---

## File Naming Conventions

```
<feature>.<type>.ts

Types:
- .module.ts       # Module definition
- .service.ts      # Service class
- .resolver.ts     # GraphQL resolver
- .controller.ts   # REST controller
- .guard.ts        # Guard class
- .decorator.ts    # Custom decorator
- .strategy.ts     # Passport strategy
- .input.ts        # GraphQL input type / DTO
- .output.ts       # GraphQL output type
- .type.ts         # Plain TypeScript types
- .types.ts        # Multiple related types
- .constants.ts    # Constants and enums
- .schema.ts       # Mongoose schema
- .test.ts         # Unit tests
- .e2e.test.ts     # E2E tests
```

---

## Import Order Convention

```typescript
// 1. Node.js built-ins
import { join } from 'path';

// 2. External packages (NestJS, third-party)
import { Module, Injectable } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

// 3. Internal absolute imports (from common/, core/)
import { GqlAuthGuard } from '../../common/guards/gql-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

// 4. Relative imports (same module)
import { UserService } from './user.service';
import { CreateUserInput } from './dto';
```

---

## Module Import Order

```typescript
@Module({
  imports: [
    // 1. Core/Infrastructure modules
    ConfigModule,

    // 2. Database/Schema modules
    SchemasModule,
    MongooseModule.forFeature([...]),

    // 3. Common/Shared modules
    SleepDataModule,

    // 4. Feature modules (with forwardRef if circular)
    forwardRef(() => NotificationModule),
  ],
  providers: [
    // 1. Internal services (alphabetical)
    InternalServiceA,
    InternalServiceB,

    // 2. Main/Facade service
    FeatureService,

    // 3. Resolver/Controller
    FeatureResolver,
  ],
  exports: [
    // Only public facade service(s)
    FeatureService,
  ],
})
export class FeatureModule {}
```

---

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|-------------|---------|----------|
| Missing `@Inject()` on constructor params | DI breaks with tsx/esbuild (no metadata) | Always use `@Inject(ServiceName)` |
| Missing `@Field(() => Type)` type function | GraphQL type inference fails with tsx | Always pass explicit type function |
| Exporting everything | Breaks encapsulation | Export only facade service |
| Resolvers in exports | Resolvers are entry points, not dependencies | Never export resolvers |
| Duplicate schema registration | Multiple modules registering same schema | Use centralized SchemasModule |
| Business logic in resolvers | Resolvers become untestable | Keep resolvers thin, delegate to services |
| Internal services in common/ | Misleading location | Place in feature module's services/ folder |
| Services in common/ but only one module uses it | Wrong abstraction level | Move to that module |
| Hardcoded secrets | Security vulnerability | Use ConfigService and .env |

---

## Skills Reference

Use these skills for detailed patterns:

| Skill | Use For |
|-------|---------|
| `nestjs-core` | Modules, DI, lifecycle, exceptions |
| `nestjs-auth` | Passport, JWT, guards, RBAC |
| `nestjs-graphql` | Resolvers, types, subscriptions |
| `nestjs-mongoose` | Schemas, model injection, transactions |
| `class-validator` | DTO validation decorators |
| `typescript-clean-code` | Code style standards |

---

## Checklist: New Feature Module

- [ ] Module is in `modules/<feature>/` folder
- [ ] Internal services are in `services/` subfolder
- [ ] Only facade service is exported
- [ ] Resolver is NOT exported
- [ ] DTOs have barrel file `dto/index.ts`
- [ ] Module has barrel file `index.ts` with public API
- [ ] Schemas registered in SchemasModule or module-specific
- [ ] No circular imports (use forwardRef if needed)
- [ ] File naming follows conventions
- [ ] Import order follows convention
- [ ] Tests in `tests/` folder with `.test.ts` suffix
