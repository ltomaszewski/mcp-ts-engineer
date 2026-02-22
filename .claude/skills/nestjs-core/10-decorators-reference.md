# Decorators Reference

Complete reference of all NestJS decorators from `@nestjs/common` and `@nestjs/core`.

## Class Decorators

| Decorator | Import | Target | Description |
|-----------|--------|--------|-------------|
| `@Module(metadata)` | `@nestjs/common` | Class | Define a module with imports, providers, controllers, exports |
| `@Controller(prefix?)` | `@nestjs/common` | Class | Define a REST controller with optional route prefix |
| `@Injectable(options?)` | `@nestjs/common` | Class | Mark class as injectable provider |
| `@Global()` | `@nestjs/common` | Class | Make module's providers globally available |
| `@Catch(...exceptions)` | `@nestjs/common` | Class | Mark class as exception filter for specified exceptions |

### @Module Options

| Property | Type | Description |
|----------|------|-------------|
| `imports` | `Module[]` | Modules whose exported providers are needed |
| `controllers` | `Controller[]` | REST controllers to instantiate |
| `providers` | `Provider[]` | Services to instantiate and share within this module |
| `exports` | `(Provider \| Module)[]` | Subset of providers available to importing modules |

### @Injectable Options

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `scope` | `Scope` | `Scope.DEFAULT` | Injection scope (`DEFAULT`, `REQUEST`, `TRANSIENT`) |

### @Controller Options

```typescript
// String prefix
@Controller('users')

// Route options object
@Controller({ path: 'users', host: 'admin.example.com', version: '1' })
```

## HTTP Method Decorators

| Decorator | HTTP Method | Description |
|-----------|-------------|-------------|
| `@Get(path?)` | GET | Handle GET requests |
| `@Post(path?)` | POST | Handle POST requests |
| `@Put(path?)` | PUT | Handle PUT requests |
| `@Delete(path?)` | DELETE | Handle DELETE requests |
| `@Patch(path?)` | PATCH | Handle PATCH requests |
| `@Options(path?)` | OPTIONS | Handle OPTIONS requests |
| `@Head(path?)` | HEAD | Handle HEAD requests |
| `@All(path?)` | ALL | Handle all HTTP methods |

```typescript
import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';

@Controller('users')
export class UsersController {
  @Get()
  findAll() {}

  @Get(':id')
  findOne(@Param('id') id: string) {}

  @Post()
  create(@Body() dto: CreateUserDto) {}

  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateUserDto) {}

  @Delete(':id')
  remove(@Param('id') id: string) {}
}
```

## Parameter Decorators

| Decorator | Source | Description |
|-----------|--------|-------------|
| `@Body(key?)` | Request body | Extract full body or specific property |
| `@Param(key?)` | Route params | Extract route parameters |
| `@Query(key?)` | Query string | Extract query parameters |
| `@Headers(name?)` | Request headers | Extract headers |
| `@Req()` / `@Request()` | Express Request | Full request object |
| `@Res()` / `@Response()` | Express Response | Full response object (disables auto-response) |
| `@Next()` | Express NextFunction | Next middleware function |
| `@Ip()` | Request IP | Client IP address |
| `@Session()` | Request session | Session object |
| `@HostParam(key?)` | Host params | Extract host parameters |

```typescript
@Get(':id')
findOne(
  @Param('id') id: string,
  @Query('include') include: string,
  @Headers('authorization') auth: string,
) {}

@Post()
create(
  @Body() dto: CreateDto,
  @Body('email') email: string,  // Extract specific property
  @Ip() ip: string,
) {}
```

## Dependency Injection Decorators

| Decorator | Import | Description |
|-----------|--------|-------------|
| `@Inject(token)` | `@nestjs/common` | Inject provider by token (class, string, or symbol) |
| `@Optional()` | `@nestjs/common` | Mark dependency as optional (no error if unresolved) |
| `@InjectModel(name)` | `@nestjs/mongoose` | Inject Mongoose model |
| `@InjectConnection(name?)` | `@nestjs/mongoose` | Inject Mongoose connection |

**CRITICAL:** Always use explicit `@Inject()` on every constructor service parameter -- esbuild/tsx does not emit decorator metadata.

```typescript
import { Injectable, Inject, Optional } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import { Model, Connection } from 'mongoose';
import { User, UserDocument } from './user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectConnection() private readonly connection: Connection,
    @Inject(ConfigService) private readonly configService: ConfigService,
    @Optional() @Inject('ANALYTICS') private readonly analytics?: AnalyticsService,
  ) {}
}
```

## Route Handler Decorators

| Decorator | Import | Description |
|-----------|--------|-------------|
| `@HttpCode(code)` | `@nestjs/common` | Set response HTTP status code |
| `@Header(name, value)` | `@nestjs/common` | Set response header |
| `@Redirect(url, statusCode?)` | `@nestjs/common` | Redirect to URL |
| `@Render(template)` | `@nestjs/common` | Render view template |
| `@Sse(path?, options?)` | `@nestjs/common` | Server-Sent Events endpoint |

```typescript
@Post()
@HttpCode(201)
@Header('Cache-Control', 'none')
create(@Body() dto: CreateDto) {}

@Get('docs')
@Redirect('https://docs.example.com', 301)
getDocs() {}

// Server-Sent Events (v11.1.9+: supports method options parameter)
@Sse('events')
events(): Observable<MessageEvent> {
  return interval(1000).pipe(map(() => ({ data: { timestamp: Date.now() } })));
}
```

## Guard, Interceptor, Pipe, Filter Decorators

| Decorator | Target | Description |
|-----------|--------|-------------|
| `@UseGuards(...guards)` | Class/Method | Apply guards |
| `@UseInterceptors(...interceptors)` | Class/Method | Apply interceptors |
| `@UsePipes(...pipes)` | Class/Method | Apply pipes |
| `@UseFilters(...filters)` | Class/Method | Apply exception filters |
| `@SetMetadata(key, value)` | Method | Attach metadata to handler |

```typescript
import { Controller, Get, UseGuards, UseInterceptors, UsePipes, SetMetadata } from '@nestjs/common';

@Controller('users')
@UseGuards(AuthGuard)
@UseInterceptors(LoggingInterceptor)
export class UsersController {

  @Get('admin')
  @UseGuards(RolesGuard)
  @SetMetadata('roles', ['admin'])
  getAdmin() {}

  @Post()
  @UsePipes(new ValidationPipe({ whitelist: true }))
  create(@Body() dto: CreateDto) {}
}
```

## GraphQL-Specific Decorators

From `@nestjs/graphql`:

| Decorator | Target | Description |
|-----------|--------|-------------|
| `@Resolver(of?)` | Class | GraphQL resolver class |
| `@Query(returns?, options?)` | Method | GraphQL query |
| `@Mutation(returns?, options?)` | Method | GraphQL mutation |
| `@Subscription(returns?, options?)` | Method | GraphQL subscription |
| `@ResolveField(returns?, options?)` | Method | Field resolver |
| `@Args(name?, options?)` | Parameter | GraphQL argument |
| `@Parent()` | Parameter | Parent object in field resolver |
| `@Context(key?)` | Parameter | GraphQL context |
| `@Info()` | Parameter | GraphQL resolve info |
| `@ObjectType(options?)` | Class | GraphQL object type |
| `@InputType(options?)` | Class | GraphQL input type |
| `@ArgsType()` | Class | GraphQL args type |
| `@Field(type?, options?)` | Property | GraphQL field |
| `@Int` / `@Float` / `@ID` | — | GraphQL scalar type helpers |

**CRITICAL:** Always use explicit type function with `@Field(() => Type)` -- esbuild/tsx does not emit decorator metadata.

```typescript
import { Resolver, Query, Mutation, Args, Field, ObjectType, InputType, Int } from '@nestjs/graphql';

@ObjectType()
export class UserType {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  email: string;

  @Field(() => Int)
  age: number;

  @Field(() => String, { nullable: true })
  bio?: string;
}
```

## Mongoose Schema Decorators

From `@nestjs/mongoose`:

| Decorator | Target | Description |
|-----------|--------|-------------|
| `@Schema(options?)` | Class | Define Mongoose schema |
| `@Prop(options?)` | Property | Define schema property |

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true })
  name: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
```

## Validation Decorators (class-validator)

Common validators from `class-validator` used with NestJS `ValidationPipe`:

| Decorator | Validation |
|-----------|------------|
| `@IsString()` | Must be string |
| `@IsNumber()` | Must be number |
| `@IsBoolean()` | Must be boolean |
| `@IsEmail()` | Must be valid email |
| `@IsNotEmpty()` | Must not be empty |
| `@IsOptional()` | Allow undefined/null |
| `@MinLength(n)` | Minimum string length |
| `@MaxLength(n)` | Maximum string length |
| `@Min(n)` | Minimum number value |
| `@Max(n)` | Maximum number value |
| `@IsEnum(enum)` | Must be enum value |
| `@IsArray()` | Must be array |
| `@IsDate()` | Must be Date |
| `@IsUUID()` | Must be UUID |
| `@Matches(regex)` | Must match regex pattern |
| `@ValidateNested()` | Validate nested objects |
| `@Type(() => Class)` | Transform to class (class-transformer) |

```typescript
import { IsEmail, IsNotEmpty, IsOptional, MinLength } from 'class-validator';
import { InputType, Field } from '@nestjs/graphql';

@InputType()
export class CreateUserInput {
  @Field(() => String)
  @IsEmail()
  email: string;

  @Field(() => String)
  @IsNotEmpty()
  @MinLength(2)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  bio?: string;
}
```

## Custom Decorator Creation

### Parameter Decorator

```typescript
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);

// Usage
@Get()
findOne(@CurrentUser() user: UserPayload, @CurrentUser('id') userId: string) {}
```

### Composed Decorator

```typescript
import { applyDecorators, UseGuards, SetMetadata } from '@nestjs/common';

export function Auth(...roles: string[]) {
  return applyDecorators(
    SetMetadata('roles', roles),
    UseGuards(AuthGuard, RolesGuard),
  );
}

// Usage
@Get('admin')
@Auth('admin')
getAdmin() {}
```

---

**Version:** NestJS 11.x (^11.1.14) | **Source:** https://docs.nestjs.com/custom-decorators
