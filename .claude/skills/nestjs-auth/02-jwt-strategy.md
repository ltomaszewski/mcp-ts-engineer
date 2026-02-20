# JWT Strategy

```typescript
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

export interface JwtPayload {
  sub: string;
  email: string;
  roles?: string[];
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(payload: JwtPayload) {
    // JWT signature already verified by passport-jwt
    const user = await this.usersService.findById(payload.sub);

    if (!user || user.deleted) {
      throw new UnauthorizedException('User not found or deleted');
    }

    // Returned object becomes request.user
    return {
      id: payload.sub,
      email: payload.email,
      roles: payload.roles || [],
      ...user,
    };
  }
}
```

## JWT Best Practices

1. **Short expiration** - 15 minutes for access tokens
2. **Use environment variables** - Never hardcode secrets
3. **Specify algorithm** - Always set `algorithm: 'HS256'`
4. **Minimal payload** - Only include necessary claims
5. **Validate user on each request** - Check if account still active

## Environment Variables

```env
JWT_SECRET=your-32-char-secret-minimum
JWT_EXPIRATION=15m
JWT_REFRESH_SECRET=different-secret-for-refresh
JWT_REFRESH_EXPIRATION=7d
```
