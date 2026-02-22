# NestJS Mongoose: Transactions

**Manual transactions, connection.transaction() helper, AsyncLocalStorage, and best practices.**

**Requirement:** MongoDB replica set (standalone instances do not support transactions).

---

## Manual Transaction

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel, InjectConnection } from '@nestjs/mongoose';
import { Model, Connection } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Product, ProductDocument } from './schemas/product.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<ProductDocument>,
    @InjectConnection() private readonly connection: Connection,
  ) {}

  async createOrder(data: CreateOrderDto): Promise<Order> {
    const session = await this.connection.startSession();
    session.startTransaction();

    try {
      const [order] = await this.orderModel.create([data], { session });

      await this.productModel.updateOne(
        { _id: data.productId },
        { $inc: { stock: -data.quantity } },
        { session },
      );

      await session.commitTransaction();
      return order;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

---

## connection.transaction() Helper (Preferred)

Mongoose's wrapper around `session.withTransaction()`. Automatically commits on success, aborts on error, ends session. Also integrates with Mongoose change tracking — resets document state on abort.

```typescript
async transfer(fromId: string, toId: string, amount: number): Promise<void> {
  await this.connection.transaction(async (session) => {
    await this.accountModel.updateOne(
      { _id: fromId },
      { $inc: { balance: -amount } },
    ).session(session);

    await this.accountModel.updateOne(
      { _id: toId },
      { $inc: { balance: amount } },
    ).session(session);
  });
}
```

---

## AsyncLocalStorage (Mongoose 8.4+, works in 9.x)

Automatically propagates sessions to all queries within the callback. No need to pass `session` manually.

```typescript
import mongoose from 'mongoose';

// Enable globally (once, e.g., in main.ts)
mongoose.set('transactionAsyncLocalStorage', true);

// Usage - session propagation is automatic
async createOrderAutoSession(data: CreateOrderDto): Promise<Order> {
  return this.connection.transaction(async () => {
    // No session parameter needed — auto-propagated
    const order = await this.orderModel.create(data);

    await this.productModel.updateOne(
      { _id: data.productId },
      { $inc: { stock: -data.quantity } },
    );

    return order;
  });
}
```

> **Important:** Nested `connection.transaction()` calls create independent sessions even with AsyncLocalStorage enabled.

---

## Document Session Association

Documents retrieved within a transaction automatically use the session for subsequent `save()` calls:

```typescript
await this.connection.transaction(async (session) => {
  const user = await this.userModel.findById(id).session(session);
  // user.$session() returns the session
  user.name = 'Updated';
  await user.save(); // Automatically uses the session
});
```

You can also manually bind a session to a document:

```typescript
const doc = new this.userModel(data);
doc.$session(session);
await doc.save();
```

---

## Transaction Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `readConcern` | `{ level: string }` | `{ level: 'local' }` | Read concern level |
| `writeConcern` | `object` | `{ w: 'majority' }` | Write concern |
| `readPreference` | `string` | `'primary'` | Read preference |
| `maxCommitTimeMS` | `number` | none | Max time for commit |

```typescript
await this.connection.transaction(async (session) => {
  // operations
}, {
  readConcern: { level: 'snapshot' },
  writeConcern: { w: 'majority', j: true },
});
```

---

## Transaction Best Practices

1. **Keep transactions short** — long transactions increase lock contention
2. **Always use `.session(session)` on every operation** within manual transactions
3. **Use `connection.transaction()` helper** instead of manual session management
4. **Use `transactionAsyncLocalStorage`** for automatic propagation
5. **Use `create([data], { session })` (array form)** when using sessions with `create()`
6. **Handle `TransientTransactionError`** with retry logic in production
7. **No parallel operations** — running operations in parallel within a transaction is not supported; avoid `Promise.all()` inside transactions
8. **Aggregation support** — use `Model.aggregate().session(session)` to run pipelines within transactions

---

## Mongoose 9 Migration: Transaction Changes

- No breaking changes to the transaction API between Mongoose 8 and 9
- `connection.transaction()` and AsyncLocalStorage work the same in Mongoose 9
- Pre hooks in transactions must use `async function` (no `next()` callback)

---

**See Also**: [09-connection-options.md](09-connection-options.md) for replica set configuration
**Source**: https://mongoosejs.com/docs/transactions.html
**Version**: @nestjs/mongoose 11.x, Mongoose 9.x
