# Transactions

**Note:** Requires MongoDB replica set.

## Manual Transaction

```typescript
async createOrder(data: CreateOrderDto) {
  const session = await this.connection.startSession();
  session.startTransaction();

  try {
    const order = await this.orderModel.create([data], { session });
    await this.productModel.updateOne(
      { _id: data.productId },
      { $inc: { stock: -1 } },
      { session }
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
```

## Using transaction() Helper

```typescript
async transfer(fromId: string, toId: string, amount: number) {
  return this.connection.transaction(async (session) => {
    await this.accountModel.updateOne(
      { _id: fromId },
      { $inc: { balance: -amount } }
    ).session(session);

    await this.accountModel.updateOne(
      { _id: toId },
      { $inc: { balance: amount } }
    ).session(session);
  });
}
```

## AsyncLocalStorage (Mongoose 8.4+)

```typescript
// Enable globally
mongoose.set('transactionAsyncLocalStorage', true);

// No need to pass session - automatic!
async createOrder(data: CreateOrderDto) {
  return this.connection.transaction(async () => {
    await this.orderModel.create(data);
    await this.productModel.updateOne({ _id: data.productId }, { $inc: { stock: -1 } });
  });
}
```
