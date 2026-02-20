# Connection Options

## Full Configuration

```typescript
MongooseModule.forRootAsync({
  useFactory: () => ({
    uri: process.env.MONGODB_URI,
    maxPoolSize: 100,
    minPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    retryWrites: true,
    retryReads: true,
    family: 4,
    authSource: 'admin',
    readPreference: 'primary',
    w: 'majority',
    appName: 'MyApp',
  }),
})
```

## Pool Sizing

- **Dev:** maxPoolSize: 10, minPoolSize: 2
- **Prod:** maxPoolSize: 100, minPoolSize: 10
- **High Traffic:** maxPoolSize: 200, minPoolSize: 50

## Connection Events

```typescript
@Injectable()
export class DbMonitor implements OnModuleInit {
  constructor(@InjectConnection() private connection: Connection) {}

  onModuleInit() {
    this.connection.on('connected', () => console.log('Connected'));
    this.connection.on('disconnected', () => console.log('Disconnected'));
    this.connection.on('error', (err) => console.error('Error:', err));
  }
}
```

## Multiple Databases

```typescript
MongooseModule.forRoot(uri1, { connectionName: 'db1' }),
MongooseModule.forRoot(uri2, { connectionName: 'db2' }),

// Usage
@InjectModel(User.name, 'db1') private userModel: Model<User>
```
