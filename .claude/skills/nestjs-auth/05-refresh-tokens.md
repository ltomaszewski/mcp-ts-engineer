# Refresh Tokens

## Token Generation

```typescript
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

  return { accessToken, refreshToken };
}
```

## Refresh Token Strategy

```typescript
@Injectable()
export class RefreshTokenStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.get('JWT_REFRESH_SECRET'),
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: any) {
    const refreshToken = req.get('Authorization')?.replace('Bearer', '').trim();
    return { ...payload, refreshToken };
  }
}
```

## Token Rotation

```typescript
async refreshTokens(userId: string, refreshToken: string) {
  const user = await this.usersService.findById(userId);
  if (!user) throw new UnauthorizedException();

  // Verify against stored tokens
  const tokenMatches = await Promise.all(
    user.refreshTokens.map(token => bcrypt.compare(refreshToken, token))
  );

  if (!tokenMatches.some(m => m)) {
    throw new UnauthorizedException('Invalid refresh token');
  }

  // Generate new tokens
  const tokens = await this.generateTokens(user.id, user.email, user.roles);

  // Rotate: remove old, add new
  await this.usersService.rotateRefreshToken(userId, refreshToken, tokens.refreshToken);

  return tokens;
}
```

## Store Hashed Tokens

```typescript
async addRefreshToken(userId: string, refreshToken: string) {
  const hashedToken = await bcrypt.hash(refreshToken, 10);
  const user = await this.userModel.findById(userId);

  // Limit to 5 devices
  if (user.refreshTokens.length >= 5) {
    user.refreshTokens.shift();
  }

  user.refreshTokens.push(hashedToken);
  await user.save();
}
```

## Best Practices

1. **Hash before storage** - Use bcrypt for refresh tokens
2. **Token rotation** - New refresh token on each use
3. **Device limit** - Cap concurrent sessions (5 is common)
4. **Invalidate on logout** - Remove refresh token
5. **HTTP-only cookies** - Store in cookies when possible
