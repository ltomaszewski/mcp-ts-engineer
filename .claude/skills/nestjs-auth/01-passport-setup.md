# Passport Setup

Complete setup for NestJS authentication with Passport.js, including module configuration, local strategy, and auth service.

## Installation

```bash
npm install @nestjs/passport @nestjs/jwt passport passport-jwt passport-local bcrypt
npm install --save-dev @types/passport-jwt @types/passport-local @types/bcrypt
```

## Package Versions

| Package | Version | Purpose |
|---------|---------|---------|
| `@nestjs/passport` | ^11.0.0 | NestJS Passport integration |
| `@nestjs/jwt` | ^11.0.0 | JWT token signing/verification |
| `passport` | ^0.7.0 | Authentication middleware |
| `passport-jwt` | ^4.0.1 | JWT extraction strategy |
| `passport-local` | ^1.0.0 | Username/password strategy |
| `bcrypt` | ^5.1.1 | Password hashing |

## Auth Module

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    UsersModule,
    PassportModule.register({ defaultStrategy: 'jwt', session: false }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: '15m',
          algorithm: 'HS256',
        },
      }),
    }),
  ],
  providers: [AuthService, JwtStrategy, LocalStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

## PassportModule.register Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultStrategy` | `string` | `undefined` | Default strategy name for AuthGuard |
| `session` | `boolean` | `true` | Enable/disable session support |
| `property` | `string` | `'user'` | Property name on request to attach user |

## JwtModule.registerAsync Options

| Option | Type | Description |
|--------|------|-------------|
| `secret` | `string` | HMAC signing secret |
| `publicKey` | `string` | RSA/ECDSA public key |
| `privateKey` | `string` | RSA/ECDSA private key |
| `signOptions.expiresIn` | `string \| number` | Token expiration (`'15m'`, `'1h'`, `3600`) |
| `signOptions.algorithm` | `string` | Signing algorithm (`'HS256'`, `'RS256'`) |
| `signOptions.issuer` | `string` | Token issuer claim |
| `signOptions.audience` | `string` | Token audience claim |
| `verifyOptions` | `object` | Verification overrides |

## Local Strategy

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from './auth.service';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy, 'local') {
  constructor(@Inject(AuthService) private authService: AuthService) {
    super({ usernameField: 'email', passwordField: 'password' });
  }

  async validate(email: string, password: string) {
    const user = await this.authService.validateUser(email, password);
    if (!user) throw new UnauthorizedException('Invalid credentials');
    return user;
  }
}
```

### passport-local Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `usernameField` | `string` | `'username'` | Request body field for username |
| `passwordField` | `string` | `'password'` | Request body field for password |
| `passReqToCallback` | `boolean` | `false` | Pass request as first arg to `validate` |
| `session` | `boolean` | `true` | Session support |

## Auth Service

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(UsersService) private usersService: UsersService,
    @Inject(JwtService) private jwtService: JwtService,
    @Inject(ConfigService) private configService: ConfigService,
  ) {}

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user || user.deleted) return null;

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return null;

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: { id: string; email: string; roles: string[] }) {
    const payload = { sub: user.id, email: user.email, roles: user.roles };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: '7d',
      }),
    ]);

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.usersService.addRefreshToken(user.id, hashedRefresh);

    return { accessToken, refreshToken };
  }

  async logout(userId: string, refreshToken: string) {
    await this.usersService.removeRefreshToken(userId, refreshToken);
  }
}
```

## Auth Controller

```typescript
import { Controller, Post, UseGuards, Request, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(@Inject(AuthService) private authService: AuthService) {}

  @Public()
  @UseGuards(AuthGuard('local'))
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: { user: { id: string; email: string; roles: string[] } }) {
    return this.authService.login(req.user);
  }

  @Public()
  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser('id') userId: string,
    @Body('refreshToken') refreshToken: string,
  ) {
    return this.authService.logout(userId, refreshToken);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshTokens(refreshToken);
  }
}
```

## Password Hashing

```typescript
import * as bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}
```

## Environment Variables

```env
JWT_SECRET=your-32-char-secret-minimum-here
JWT_REFRESH_SECRET=different-secret-for-refresh-tokens
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d
```

---

**Version:** NestJS 11.x + @nestjs/passport 11.x + passport 0.7.x | **Source:** https://docs.nestjs.com/security/authentication
