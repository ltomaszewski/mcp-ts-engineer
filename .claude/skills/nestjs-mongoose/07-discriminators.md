# NestJS Mongoose: Discriminators

**Schema inheritance for polymorphic data stored in the same MongoDB collection.**

---

## Define Base and Child Schemas

```typescript
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

// Base schema with discriminator key
@Schema({ discriminatorKey: '__type', timestamps: true })
export class Event {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  timestamp: Date;

  @Prop()
  userId: string;
}

export type EventDocument = Event & Document;
export const EventSchema = SchemaFactory.createForClass(Event);

// Child: ClickEvent
@Schema()
export class ClickEvent extends Event {
  @Prop({ required: true })
  elementId: string;

  @Prop({ required: true })
  pageUrl: string;
}

export type ClickEventDocument = ClickEvent & Document;
export const ClickEventSchema = SchemaFactory.createForClass(ClickEvent);

// Child: PurchaseEvent
@Schema()
export class PurchaseEvent extends Event {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  currency: string;

  @Prop()
  productId: string;
}

export type PurchaseEventDocument = PurchaseEvent & Document;
export const PurchaseEventSchema = SchemaFactory.createForClass(PurchaseEvent);
```

---

## Module Registration

```typescript
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Event.name,
        schema: EventSchema,
        discriminators: [
          { name: ClickEvent.name, schema: ClickEventSchema },
          { name: PurchaseEvent.name, schema: PurchaseEventSchema },
        ],
      },
    ]),
  ],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
```

---

## Service Usage

```typescript
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(Event.name) private readonly eventModel: Model<EventDocument>,
    @InjectModel(ClickEvent.name) private readonly clickModel: Model<ClickEventDocument>,
    @InjectModel(PurchaseEvent.name) private readonly purchaseModel: Model<PurchaseEventDocument>,
  ) {}

  // Query all events (all types)
  async findAll(): Promise<Event[]> {
    return this.eventModel.find().sort({ timestamp: -1 }).exec();
  }

  // Query only click events (auto-filtered by discriminator)
  async findClicks(): Promise<ClickEvent[]> {
    return this.clickModel.find().exec();
  }

  // Query only purchase events
  async findPurchases(): Promise<PurchaseEvent[]> {
    return this.purchaseModel.find().exec();
  }

  // Create typed event
  async createClick(data: CreateClickEventDto): Promise<ClickEvent> {
    return this.clickModel.create(data);
  }

  async createPurchase(data: CreatePurchaseEventDto): Promise<PurchaseEvent> {
    return this.purchaseModel.create(data);
  }

  // Aggregate across all event types
  async countByType(): Promise<{ _id: string; count: number }[]> {
    return this.eventModel.aggregate([
      { $group: { _id: '$__type', count: { $sum: 1 } } },
    ]);
  }
}
```

---

## Embedded Array Discriminators

Discriminators can also be applied to subdocument arrays within a single document:

```typescript
@Schema({ discriminatorKey: 'kind' })
export class Activity {
  @Prop({ required: true })
  kind: string;

  @Prop({ required: true })
  timestamp: Date;
}

export const ActivitySchema = SchemaFactory.createForClass(Activity);

@Schema()
export class LoginActivity extends Activity {
  @Prop({ required: true })
  ipAddress: string;
}

export const LoginActivitySchema = SchemaFactory.createForClass(LoginActivity);

@Schema()
export class PurchaseActivity extends Activity {
  @Prop({ required: true })
  amount: number;
}

export const PurchaseActivitySchema = SchemaFactory.createForClass(PurchaseActivity);

// Parent schema with discriminated array
@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ type: [ActivitySchema] })
  activities: Activity[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Register embedded discriminators on the array path
const activitiesPath = UserSchema.path('activities') as any;
activitiesPath.discriminator('LoginActivity', LoginActivitySchema);
activitiesPath.discriminator('PurchaseActivity', PurchaseActivitySchema);
```

---

## Single Nested Discriminators

Schema variants for a single subdocument field:

```typescript
@Schema({ discriminatorKey: 'provider' })
export class PaymentMethod {
  @Prop({ required: true })
  provider: string;
}

export const PaymentMethodSchema = SchemaFactory.createForClass(PaymentMethod);

@Schema()
export class CreditCardPayment extends PaymentMethod {
  @Prop({ required: true })
  cardNumber: string;

  @Prop({ required: true })
  expiryDate: string;
}

export const CreditCardPaymentSchema = SchemaFactory.createForClass(CreditCardPayment);

// Register on a single nested path
const paymentPath = OrderSchema.path('paymentMethod') as any;
paymentPath.discriminator('CreditCard', CreditCardPaymentSchema);
```

---

## @Schema discriminatorKey Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `discriminatorKey` | `string` | `'__t'` | Field name for type discrimination |

---

## How Discriminators Work

- All documents stored in **same collection** (the base schema's collection)
- Each document has a `__type` field (or custom key) identifying its type
- Querying via child model auto-filters by discriminator value
- Querying via base model returns all types
- Child schemas can add their own properties, hooks, and virtuals
- Base schema properties are shared by all children
- The discriminator key **cannot be updated** by default; use `overwriteDiscriminatorKey: true` option in update operations to allow changes

---

## Important Rules

1. **Define hooks before `discriminator()`** — do not call `pre()` or `post()` after creating discriminators
2. **Hooks use async functions** (Mongoose 9) — no `next()` callback
3. **Child schemas inherit base schema validation**
4. **Indexes defined on base schema** apply to all discriminator types

---

**See Also**: [02-schema-definitions.md](02-schema-definitions.md) for schema options
**Source**: https://mongoosejs.com/docs/discriminators.html
**Version**: @nestjs/mongoose 11.x, Mongoose 9.x
