# Discriminators

Schema inheritance for polymorphic data in same collection.

## Setup

```typescript
@Schema({ discriminatorKey: '__type' })
export class Event {
  @Prop({ required: true }) title: string;
  @Prop({ required: true }) timestamp: Date;
}

@Schema()
export class ClickEvent extends Event {
  @Prop({ required: true }) elementId: string;
}

@Schema()
export class PurchaseEvent extends Event {
  @Prop({ required: true }) amount: number;
}
```

## Module Config

```typescript
MongooseModule.forFeature([
  {
    name: Event.name,
    schema: EventSchema,
    discriminators: [
      { name: ClickEvent.name, schema: ClickEventSchema },
      { name: PurchaseEvent.name, schema: PurchaseEventSchema },
    ],
  },
])
```

## Usage

```typescript
@Injectable()
export class EventService {
  constructor(
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(ClickEvent.name) private clickModel: Model<ClickEvent>,
  ) {}

  findAll() { return this.eventModel.find(); }
  findClicks() { return this.clickModel.find(); }
}
```
