# Common Patterns

Reusable patterns for TypeScript development.

---

## Service Pattern

```typescript
// Service encapsulates business logic
export class SessionService {
  constructor(
    private readonly store: SessionStore,
    private readonly logger: Logger,
  ) {}

  async findById(id: string): Promise<Session | null> {
    return this.store.get(id)
  }

  async create(input: CreateSessionInput): Promise<Session> {
    const session = new Session(input)
    await this.store.save(session)
    this.logger.info('Session created', { id: session.id })
    return session
  }
}
```

---

## Custom Hook Pattern (React)

```typescript
export function useResource() {
  const [data, setData] = useState<Resource | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const result = await api.getResource()
      setData(result)
    } catch (err) {
      setError(err as Error)
    } finally {
      setLoading(false)
    }
  }, [])

  return { data, loading, error, fetch }
}
```

---

## Race Condition Prevention

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

---

## Store Pattern (Zustand)

```typescript
interface AppStore {
  session: Session | null
  history: Session[]
  setSession: (session: Session | null) => void
  addToHistory: (session: Session) => void
}

export const useAppStore = create<AppStore>()(
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
    { name: 'app-storage' }
  )
)
```

---

## Error Handling Pattern

### Service Layer

```typescript
async findById(id: string): Promise<Resource> {
  const resource = await this.store.get(id)
  if (!resource) {
    throw new NotFoundException(`Resource ${id} not found`)
  }
  return resource
}
```

### API Layer

```typescript
async function fetchResource(id: string): Promise<Resource> {
  const result = await client.query({ id })

  if (result.error) {
    throw new ApiError(result.error.message)
  }

  return result.data
}
```

---

## Validation Pattern (Zod)

```typescript
const sessionSchema = z.object({
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => !data.endTime || data.endTime > data.startTime,
  { message: 'End time must be after start time' }
)

type SessionInput = z.infer<typeof sessionSchema>
```

---

## Testing Patterns

### Unit Test

```typescript
describe('SessionService', () => {
  let service: SessionService
  let mockStore: Mocked<SessionStore>

  beforeEach(() => {
    mockStore = {
      get: vi.fn(),
      save: vi.fn(),
      delete: vi.fn(),
    }
    service = new SessionService(mockStore, mockLogger)
  })

  describe('findById', () => {
    it('returns session when found', async () => {
      mockStore.get.mockResolvedValue(mockSession)
      const result = await service.findById('123')
      expect(result).toEqual(mockSession)
    })

    it('returns null when not found', async () => {
      mockStore.get.mockResolvedValue(null)
      const result = await service.findById('invalid')
      expect(result).toBeNull()
    })
  })
})
```
