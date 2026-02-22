# JWT Strategy

Complete JWT strategy configuration for NestJS with passport-jwt.

## JWT Payload Interface

```typescript
export interface JwtPayload {
  sub: string;       // User ID (subject claim)
  email: string;     // User email
  roles?: string[];  // User roles
  iat?: number;      // Issued at (auto-added by jsonwebtoken)
  exp?: number;      // Expiration (auto-added by jsonwebtoken)
}
```

## Access Token Strategy

```typescript
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtPayload } from './types/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(UsersService) private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
      algorithms: ['HS256'],
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user || user.deleted) {
      throw new UnauthorizedException('User not found or deactivated');
    }
    // Returned object becomes request.user
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles ?? [],
    };
  }
}
```

## passport-jwt Strategy Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `jwtFromRequest` | `JwtFromRequestFunction` | required | Extractor function for JWT |
| `secretOrKey` | `string \| Buffer` | -- | HMAC secret or PEM-encoded public key |
| `secretOrKeyProvider` | `function` | -- | Async callback to provide secret |
| `ignoreExpiration` | `boolean` | `false` | If true, expired tokens are accepted |
| `algorithms` | `string[]` | `undefined` | Allowed signature algorithms |
| `issuer` | `string \| string[]` | -- | Valid issuer(s) |
| `audience` | `string \| string[]` | -- | Valid audience(s) |
| `passReqToCallback` | `boolean` | `false` | Pass request as first arg to validate |
| `jsonWebTokenOptions` | `object` | -- | Options passed to jsonwebtoken.verify |

## ExtractJwt Methods

| Method | Extracts From | Example Header |
|--------|--------------|----------------|
| `fromAuthHeaderAsBearerToken()` | `Authorization: Bearer <token>` | Most common |
| `fromAuthHeaderWithScheme(scheme)` | `Authorization: <scheme> <token>` | Custom scheme |
| `fromHeader(name)` | Custom header | `X-JWT-Token: <token>` |
| `fromBodyField(name)` | Request body field | `{ "token": "<token>" }` |
| `fromUrlQueryParameter(name)` | URL query param | `?token=<token>` |
| `fromExtractors([...])` | Multiple sources | Tries each in order |

### Composite Extractor Example

```typescript
super({
  jwtFromRequest: ExtractJwt.fromExtractors([
    ExtractJwt.fromAuthHeaderAsBearerToken(),
    ExtractJwt.fromUrlQueryParameter('token'),
    (req: Request) => req?.cookies?.['jwt'] ?? null,
  ]),
  secretOrKey: configService.get<string>('JWT_SECRET'),
});
```

## Token Signing

```typescript
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(@Inject(JwtService) private jwtService: JwtService) {}

  async signAccessToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '15m',
      algorithm: 'HS256',
    });
  }

  async signRefreshToken(payload: JwtPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: '7d',
      algorithm: 'HS256',
    });
  }

  async verifyToken(token: string, secret: string): Promise<JwtPayload> {
    return this.jwtService.verifyAsync<JwtPayload>(token, { secret });
  }
}
```

## JwtService API

| Method | Returns | Description |
|--------|---------|-------------|
| `sign(payload, options?)` | `string` | Synchronous sign |
| `signAsync(payload, options?)` | `Promise<string>` | Async sign |
| `verify<T>(token, options?)` | `T` | Synchronous verify |
| `verifyAsync<T>(token, options?)` | `Promise<T>` | Async verify |
| `decode(token, options?)` | `object \| null` | Decode without verification |

## Sign Options

| Option | Type | Description |
|--------|------|-------------|
| `secret` | `string` | Override default secret |
| `privateKey` | `string` | Override default private key |
| `expiresIn` | `string \| number` | Token lifetime (`'15m'`, `3600`) |
| `algorithm` | `string` | Signing algorithm |
| `issuer` | `string` | Issuer claim |
| `audience` | `string` | Audience claim |
| `subject` | `string` | Subject claim |
| `jwtid` | `string` | JWT ID claim |
| `notBefore` | `string \| number` | Not before claim |
| `header` | `object` | Custom header fields |

## Best Practices

1. **Short expiration** -- 15 minutes for access tokens
2. **Separate secrets** -- Different keys for access and refresh tokens
3. **Environment variables** -- Never hardcode secrets
4. **Specify algorithm** -- Prevent algorithm confusion attacks
5. **Validate user** -- Check account status on every request
6. **Minimal payload** -- Only `sub`, `email`, `roles` in JWT claims

---

**Version:** @nestjs/jwt 11.x + passport-jwt 4.x | **Source:** https://docs.nestjs.com/security/authentication
