# Module Organization & Encapsulation

## Three-Layer Module Architecture

Organize NestJS modules into three distinct layers with clear boundaries:

```
src/nest/
├── core/                    # Infrastructure (app-wide singletons)
│   ├── database/            # Database connections, migrations
│   ├── config/              # ConfigModule, env validation
│   └── logging/             # Logger providers
│
├── common/                  # Shared utilities (reusable, no business logic)
│   ├── decorators/          # Custom decorators (@CurrentUser, @Public)
│   ├── guards/              # Generic guards (GqlAuthGuard, ThrottleGuard)
│   ├── pipes/               # Validation pipes
│   ├── filters/             # Exception filters
│   ├── interceptors/        # Generic interceptors
│   ├── types/               # Shared TypeScript types/interfaces
│   └── utils/               # Pure utility functions
│
└── modules/                 # Feature modules (business logic)
    ├── auth/
    ├── user/
    ├── schedule/
    └── notification/
```

### Layer Rules

| Layer | Contains | Can Import From | Exported To |
|-------|----------|-----------------|-------------|
| Core | Infrastructure services | External packages only | AppModule |
| Common | Generic utilities | Core, external packages | Any module |
| Feature | Business logic | Core, Common, other Features | Other Features |

## @Module Decorator Options

| Property | Type | Description |
|----------|------|-------------|
| `imports` | `Module[]` | Modules whose exported providers are needed |
| `providers` | `Provider[]` | Services instantiated by the NestJS injector |
| `controllers` | `Controller[]` | REST controllers (not used with GraphQL-only) |
| `exports` | `(Provider \| Module)[]` | Providers available to importing modules |

## Feature Module Internal Structure

```
modules/user/
├── dto/                     # Input/Output types
│   ├── create-user.input.ts
│   ├── user.output.ts
│   └── index.ts             # Barrel export
│
├── services/                # Internal services (NOT exported)
│   ├── user-validation.service.ts
│   ├── user-score.service.ts
│   └── index.ts
│
├── user.service.ts          # Public facade service (EXPORTED)
├── user.resolver.ts         # GraphQL resolver
├── user.module.ts           # Module definition
└── index.ts                 # Public API barrel
```

## Encapsulation: Public vs Internal Services

### The Facade Pattern

Each module exposes ONE public service (facade) and hides internal implementation:

```typescript
import { Module } from '@nestjs/common';
import { SchemasModule } from '../../core/database/schemas.module';
import { UserValidationService } from './services/user-validation.service';
import { UserScoreService } from './services/user-score.service';
import { UserService } from './user.service';
import { UserResolver } from './user.resolver';

@Module({
  imports: [SchemasModule],
  providers: [
    // INTERNAL -- not exported, only used within this module
    UserValidationService,
    UserScoreService,
    // PUBLIC -- exported facade
    UserService,
    // Resolver -- never export
    UserResolver,
  ],
  exports: [UserService], // ONLY export the facade service
})
export class UserModule {}
```

### Internal Service Pattern

**CRITICAL:** Always use explicit `@Inject()` -- esbuild/tsx does not emit decorator metadata.

```typescript
// services/user-validation.service.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class UserValidationService {
  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

// user.service.ts (Facade)
import { Injectable, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './user.schema';
import { UserValidationService } from './services/user-validation.service';
import { UserScoreService } from './services/user-score.service';
import { CreateUserInput } from './dto';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @Inject(UserValidationService) private readonly validationService: UserValidationService,
    @Inject(UserScoreService) private readonly scoreService: UserScoreService,
  ) {}

  async createUser(input: CreateUserInput): Promise<User> {
    this.validationService.validateEmail(input.email);
    return this.userModel.create(input);
  }
}
```

## Dynamic Modules

### forRoot / forRootAsync

```typescript
import { Module, DynamicModule } from '@nestjs/common';

@Module({})
export class DatabaseModule {
  static forRoot(uri: string): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [
        { provide: 'DATABASE_URI', useValue: uri },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }

  static forRootAsync(options: { inject: any[]; useFactory: (...args: any[]) => any }): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      imports: options.imports || [],
      providers: [
        {
          provide: 'DATABASE_URI',
          useFactory: options.useFactory,
          inject: options.inject,
        },
        DatabaseService,
      ],
      exports: [DatabaseService],
    };
  }
}
```

### @Global Decorator

```typescript
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [LoggerService],
  exports: [LoggerService],
})
export class LoggerModule {}
// LoggerService is now available everywhere without importing LoggerModule
```

## Barrel Files (index.ts)

### Module-Level Barrel (Public API)

```typescript
// modules/user/index.ts
export { UserService } from './user.service';
export { CreateUserInput, UserOutput } from './dto';
export type { UserRole } from './types';

// NEVER export: internal services, resolvers, module class
```

### DTO Barrel

```typescript
// modules/user/dto/index.ts
export { CreateUserInput } from './create-user.input';
export { UpdateUserInput } from './update-user.input';
export { UserOutput } from './user.output';
```

## Schema Registration Best Practices

### Dedicated Schema Module (Recommended for Shared Schemas)

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../../models/user.schema';
import { Kid, KidSchema } from '../../models/kid.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Kid.name, schema: KidSchema },
    ]),
  ],
  exports: [MongooseModule],
})
export class SchemasModule {}
```

## Module Import Order Convention

```typescript
@Module({
  imports: [
    // 1. Core/Infrastructure modules
    ConfigModule,
    // 2. Database/Schema modules
    SchemasModule,
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
  exports: [FeatureService],
})
export class FeatureModule {}
```

## Anti-Patterns to Avoid

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| `exports: [ServiceA, ServiceB, ServiceC]` | Leaks internal implementation | Export only facade service |
| Resolver in exports | Resolvers should never be exported | Remove from exports |
| Same schema in multiple modules | Duplicate registrations cause conflicts | Use centralized SchemasModule |
| Missing `@Inject()` on constructor params | Breaks with esbuild/tsx | Always add explicit `@Inject()` |
| Service in `common/` but only one module uses it | Misleading location | Move to feature module's `services/` |
| Deep `../../../` imports | Code likely in wrong location | Restructure or use path aliases |

## Module Creation Checklist

- [ ] Module is in correct layer (core/common/modules)
- [ ] Internal services are in `services/` subfolder
- [ ] Only facade service is exported
- [ ] Resolver is NOT exported
- [ ] DTOs have barrel file `dto/index.ts`
- [ ] Module has barrel file `index.ts` with public API
- [ ] Schemas registered in SchemasModule or module-specific
- [ ] All constructor params have explicit `@Inject()`
- [ ] No circular imports (use forwardRef if needed)
- [ ] File naming follows `<feature>.<type>.ts` convention

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/modules
