# Common Patterns

Reusable patterns for TypeScript monorepos.

---

## API Response Pattern (GraphQL)

```typescript
// Server - GraphQL Type
@ObjectType()
export class Item {
  @Field(() => ID)
  id: string

  @Field()
  createdAt: Date

  @Field({ nullable: true })
  updatedAt?: Date

  @Field()
  status: string
}

// Pagination
@ObjectType()
export class PaginatedItems {
  @Field(() => [Item])
  items: Item[]

  @Field()
  total: number

  @Field()
  hasMore: boolean
}
```

---

## Repository Pattern (NestJS/Mongoose)

```typescript
// Service encapsulates data access
@Injectable()
export class ItemService {
  constructor(
    @InjectModel(Item.name)
    private model: Model<Item>,
  ) {}

  async findByUser(userId: string, options: QueryOptions): Promise<Item[]> {
    return this.model
      .find({ userId })
      .sort({ createdAt: -1 })
      .skip(options.offset)
      .limit(options.limit)
      .lean()
      .exec()
  }

  async create(input: CreateItemInput): Promise<Item> {
    return this.model.create(input)
  }
}
```

---

## React Native Patterns

### Custom Hook Pattern

```typescript
export function useItem() {
  const [session, setSession] = useState<Item | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.fetchItem()
      setSession(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  const clear = useCallback(async () => {
    if (!session) return
    setLoading(true)
    try {
      await api.clearItem(session.id)
      setSession(null)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [session])

  return { session, loading, error, fetch, clear }
}
```

### Race Condition Prevention

```typescript
useEffect(() => {
  let cancelled = false
  const controller = new AbortController()

  async function fetchData() {
    try {
      const data = await api.fetch({ signal: controller.signal })
      if (!cancelled) {
        setData(data)
      }
    } catch (err) {
      if (!cancelled && !controller.signal.aborted) {
        setError(err)
      }
    }
  }

  fetchData()

  return () => {
    cancelled = true
    controller.abort()
  }
}, [dependency])
```

### Store Pattern (Zustand)

```typescript
interface ItemStore {
  session: Item | null
  history: Item[]
  setSession: (session: Item | null) => void
  addToHistory: (session: Item) => void
}

export const useItemStore = create<ItemStore>()(
  persist(
    (set) => ({
      session: null,
      history: [],
      setSession: (session) => set({ session }),
      addToHistory: (session) =>
        set((state) => ({
          history: [session, ...state.history].slice(0, 50),
        })),
    }),
    { name: 'item-storage', storage: createJSONStorage(() => mmkvStorage) }
  )
)
```

---

## Error Handling Pattern

### Server

```typescript
// Service layer
async findById(id: string): Promise<User> {
  const user = await this.userModel.findById(id).exec()
  if (!user) {
    throw new NotFoundException(`User ${id} not found`)
  }
  return user
}

// Resolver layer
@Query(() => User)
@UseGuards(JwtAuthGuard)
async user(@Args('id') id: string): Promise<User> {
  try {
    return await this.userService.findById(id)
  } catch (error) {
    this.logger.error(`Failed to fetch user ${id}`, error)
    throw error // Let NestJS exception filter handle
  }
}
```

### Mobile

```typescript
// API layer
async function fetchUser(id: string): Promise<User> {
  const result = await client.query({ query: GET_USER, variables: { id } })

  if (result.error) {
    throw new ApiError(result.error.message, result.error.graphQLErrors)
  }

  return result.data.user
}

// Component layer
function UserProfile({ id }: Props) {
  const { data, loading, error } = useQuery(GET_USER, { variables: { id } })

  if (loading) return <LoadingSkeleton />
  if (error) return <ErrorView error={error} onRetry={refetch} />
  if (!data) return <EmptyState />

  return <ProfileView user={data.user} />
}
```

---

## Validation Pattern

### Server (class-validator)

```typescript
@InputType()
export class CreateItemInput {
  @Field()
  @IsDate()
  createdAt: Date

  @Field({ nullable: true })
  @IsDate()
  @IsOptional()
  @ValidateIf((o) => o.updatedAt !== undefined)
  updatedAt?: Date

  @Field({ nullable: true })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string
}
```

### Mobile (Zod)

```typescript
const itemSchema = z.object({
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => !data.updatedAt || data.updatedAt > data.createdAt,
  { message: 'Updated date must be after created date' }
)

type ItemInput = z.infer<typeof itemSchema>
```

---

## Testing Patterns

### Unit Test

```typescript
describe('ItemService', () => {
  let service: ItemService
  let mockModel: MockModel<Item>

  beforeEach(async () => {
    mockModel = createMockModel()
    const module = await Test.createTestingModule({
      providers: [
        ItemService,
        { provide: getModelToken(Item.name), useValue: mockModel },
      ],
    }).compile()

    service = module.get(ItemService)
  })

  describe('findByUser', () => {
    it('returns sessions sorted by date descending', async () => {
      const sessions = [mockSession('2024-01-02'), mockSession('2024-01-01')]
      mockModel.find.mockReturnValue(createQueryBuilder(sessions))

      const result = await service.findByUser('user-id', { limit: 10 })

      expect(result[0].createdAt).toBeAfter(result[1].createdAt)
    })
  })
})
```

### Integration Test

```typescript
describe('Item Resolver', () => {
  let app: INestApplication

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile()

    app = module.createNestApplication()
    await app.init()
  })

  it('creates a new session', async () => {
    const response = await request(app.getHttpServer())
      .post('/graphql')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        query: `mutation { createSession(input: { createdAt: "2024-01-01T22:00:00Z" }) { id } }`,
      })

    expect(response.body.data.createSession.id).toBeDefined()
  })
})
```

---

## Database-Safe Patterns

**Key rule:** Read-then-write for complex updates instead of aggregation pipelines when database compatibility is a concern.
