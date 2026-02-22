# Transactions

**Requirement:** MongoDB replica set (standalone instances do not support transactions).

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

## connection.transaction() Helper (Preferred)

Automatically commits on success, aborts on error, ends session.

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

## AsyncLocalStorage (Mongoose 8.4+)

Automatically propagates sessions to all queries within the callback. No need to pass `session` manually.

```typescript
import mongoose from 'mongoose';

// Enable globally (once, e.g., in main.ts)
mongoose.set('transactionAsyncLocalStorage', true);

// Usage - session propagation is automatic
async createOrderAutoSession(data: CreateOrderDto): Promise<Order> {
  return this.connection.transaction(async () => {
    const order = await this.orderModel.create(data);

    await this.productModel.updateOne(
      { _id: data.productId },
      { $inc: { stock: -data.quantity } },
    );

    return order;
  });
}
```

## Transaction Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `readConcern` | `string` | `'local'` | Read concern level |
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

## Transaction Best Practices

1. **Keep transactions short** -- long transactions increase lock contention
2. **Always use `.session(session)` on every operation** within manual transactions
3. **Use `connection.transaction()` helper** instead of manual session management
4. **Use `transactionAsyncLocalStorage` in Mongoose 8.4+** for automatic propagation
5. **Use `create([data], { session })` (array form)** when using sessions with `create()`
6. **Handle `TransientTransactionError`** with retry logic in production

---

**Version:** @nestjs/mongoose 11.x, Mongoose 8.x | **Source:** https://mongoosejs.com/docs/transactions.html
