# Refresh Tokens

Complete refresh token implementation with rotation, hashing, and revocation.

## Token Generation

```typescript
import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @Inject(JwtService) private jwtService: JwtService,
    @Inject(ConfigService) private configService: ConfigService,
    @Inject(UsersService) private usersService: UsersService,
  ) {}

  async generateTokens(userId: string, email: string, roles: string[]) {
    const payload = { sub: userId, email, roles };

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

    // Hash before storing
    const hashedToken = await bcrypt.hash(refreshToken, 10);
    await this.usersService.addRefreshToken(userId, hashedToken);

    return { accessToken, refreshToken };
  }
}
```

## Refresh Token Strategy

Separate Passport strategy for refresh token validation:

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(@Inject(ConfigService) private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get<string>('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: { sub: string; email: string; roles: string[] }) {
    const refreshToken = req.get('Authorization')?.replace('Bearer ', '').trim();
    return { ...payload, id: payload.sub, refreshToken };
  }
}
```

## Token Rotation

Issue new token pair on each refresh; invalidate the old refresh token:

```typescript
async refreshTokens(userId: string, refreshToken: string) {
  const user = await this.usersService.findById(userId);
  if (!user || user.deleted) {
    throw new UnauthorizedException('User not found');
  }

  // Verify the refresh token against stored hashes
  const tokenMatches = await Promise.all(
    user.refreshTokens.map((hash: string) => bcrypt.compare(refreshToken, hash)),
  );

  const matchIndex = tokenMatches.findIndex((match) => match);
  if (matchIndex === -1) {
    // Potential token reuse attack -- revoke all tokens
    await this.usersService.clearAllRefreshTokens(userId);
    throw new UnauthorizedException('Invalid refresh token');
  }

  // Generate new token pair
  const tokens = await this.generateTokens(user.id, user.email, user.roles);

  // Remove old hashed token (rotation)
  await this.usersService.removeRefreshTokenByIndex(userId, matchIndex);

  return tokens;
}
```

## Storing Hashed Tokens

```typescript
// In UsersService
async addRefreshToken(userId: string, hashedToken: string): Promise<void> {
  const user = await this.userModel.findById(userId);
  if (!user) throw new NotFoundException(`User ${userId} not found`);

  // Limit concurrent sessions (e.g., 5 devices)
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens.shift(); // Remove oldest
  }

  user.refreshTokens.push(hashedToken);
  await user.save();
}

async removeRefreshToken(userId: string, refreshToken: string): Promise<void> {
  const user = await this.userModel.findById(userId);
  if (!user) return;

  // Find and remove matching token
  const tokenPromises = user.refreshTokens.map((hash: string) =>
    bcrypt.compare(refreshToken, hash),
  );
  const matches = await Promise.all(tokenPromises);
  const matchIndex = matches.findIndex((m) => m);

  if (matchIndex !== -1) {
    user.refreshTokens.splice(matchIndex, 1);
    await user.save();
  }
}

async clearAllRefreshTokens(userId: string): Promise<void> {
  await this.userModel.findByIdAndUpdate(userId, { refreshTokens: [] });
}
```

## Mongoose Schema for Refresh Tokens

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email!: string;

  @Prop({ required: true })
  password!: string;

  @Prop({ type: [String], default: [] })
  refreshTokens!: string[];

  @Prop({ default: false })
  deleted!: boolean;

  @Prop({ type: [String], default: ['user'] })
  roles!: string[];
}

export const UserSchema = SchemaFactory.createForClass(User);
```

## Logout (Token Revocation)

```typescript
async logout(userId: string, refreshToken: string): Promise<void> {
  await this.usersService.removeRefreshToken(userId, refreshToken);
}

async logoutAllDevices(userId: string): Promise<void> {
  await this.usersService.clearAllRefreshTokens(userId);
}
```

## Token Reuse Detection

If a previously rotated (invalidated) refresh token is used, it indicates a potential attack. Revoke all tokens for that user:

```typescript
if (matchIndex === -1) {
  // No matching hash found -- token was already rotated or forged
  await this.usersService.clearAllRefreshTokens(userId);
  throw new UnauthorizedException('Refresh token reuse detected');
}
```

## Best Practices

| Practice | Rationale |
|----------|-----------|
| Hash before storage | Database breach doesn't expose tokens |
| Token rotation | New refresh token on each use |
| Device limit (5) | Cap concurrent sessions |
| Invalidate on logout | Remove refresh token from store |
| Detect reuse | Clear all tokens on suspicious activity |
| Separate secrets | Compromised access token can't refresh |
| HTTP-only cookies | Prevents XSS token theft (when applicable) |

---

**Version:** NestJS 11.x + @nestjs/jwt 11.x | **Source:** https://docs.nestjs.com/security/authentication
