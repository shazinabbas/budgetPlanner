# Budget Planner - Technical Architecture

## Storage Architecture

### Current Implementation: **Hybrid IndexedDB + Memory Cache**

```
┌─────────────────────────────────────────────┐
│         React Components                    │
│  (Dashboard, ExpenseForm, IncomeForm, etc.) │
└──────────────┬──────────────────────────────┘
               │ Synchronous API
               ▼
┌─────────────────────────────────────────────┐
│      CacheStore Service                     │
│  • getExpenses(), addExpense(), etc.        │
│  • Synchronous getters (instant response)   │
│  • Reactive listeners (notify on changes)   │
└──────┬──────────────────────┬───────────────┘
       │                      │
       ▼                      ▼
┌──────────────┐      ┌──────────────────┐
│ Memory Cache │      │   IndexedDB      │
│  (Runtime)   │◄────►│  (Persistent)    │
│  - Fast      │ Sync │  - 50MB+ storage │
│  - Instant   │      │  - Survives      │
│              │      │    refresh       │
└──────────────┘      └──────────────────┘
                              │
                              │ (Future)
                              ▼
                      ┌──────────────────┐
                      │  Cloud Sync      │
                      │  Queue & Hooks   │
                      │  (Ready, not     │
                      │   implemented)   │
                      └────────┬─────────┘
                               │
                               ▼
                      ┌──────────────────┐
                      │  Firebase or     │
                      │  Supabase        │
                      │  (Phase 1)       │
                      └──────────────────┘
```

---

## How It Works

### 1. **Synchronous API for Components**
Components call methods like normal JavaScript:
```javascript
const expenses = cacheStore.getExpenses(); // Instant, no await
cacheStore.addExpense(newExpense); // Returns immediately
```

### 2. **Memory Cache (Fast)**
- All data lives in memory for instant access
- `cache.expenses`, `cache.categories`, `cache.income`, etc.
- Updated immediately when data changes

### 3. **IndexedDB (Persistent)**
- Data automatically saved to browser's IndexedDB in background
- Survives page refresh, browser restart
- Loaded into memory on app startup
- Async operations don't block UI

### 4. **Reactive Updates**
Components subscribe to data changes:
```javascript
useEffect(() => {
  const unsubscribe = cacheStore.subscribe('expenses', (data) => {
    setExpenses(data); // Auto-update when expenses change
  });
  return () => unsubscribe();
}, []);
```

---

## Data Flow Examples

### Adding an Expense
```
1. User clicks "Save" in ExpenseForm
2. cacheStore.addExpense(data) called
3. Memory cache updated instantly ⚡
4. UI re-renders immediately (via subscription)
5. IndexedDB updated in background 💾
6. Sync queue updated (for future cloud sync) ☁️
```

### Loading on App Start
```
1. App starts → CacheStore constructor runs
2. initializeDB() called
3. IndexedDB opened/created
4. loadFromDB() pulls all data into memory
5. Components render with loaded data
```

---

## Future-Proof Design

### Ready for Cloud Sync (Phase 1)

When you're ready to add Firebase/Supabase:

**Step 1**: Install cloud service
```bash
npm install firebase
# OR
npm install @supabase/supabase-js
```

**Step 2**: Enable sync in cache.js
```javascript
// In cache.js, uncomment and implement:
async enableCloudSync(config) {
  this.cloudClient = initializeApp(config);
  this.syncEnabled = true;
  await this.syncFromCloud(); // Initial pull
  this.startRealtimeListener(); // Listen for changes
}
```

**Step 3**: No component changes needed! ✅

### Conflict Resolution (Built-in)

Each record has:
- `lastModified`: Timestamp for version tracking
- `syncStatus`: 'pending' | 'synced' | 'conflict'
- `id`: Unique identifier

When conflicts occur (same data modified offline + online):
- Last-write-wins by default
- Can implement custom merge logic
- User can resolve manually in UI

---

## Data Models

### Expense
```javascript
{
  id: "exp_1234567890_abc123",
  amount: 1500,
  description: "Grocery Shopping",
  category: "needs",
  subcategory: "groceries",
  paymentMethod: "cash",
  date: "2026-01-15",
  createdAt: "2026-01-15T10:30:00.000Z",
  lastModified: "2026-01-15T10:30:00.000Z",
  syncStatus: "pending"
}
```

### Settings (Categories, Income, Budget Limits)
```javascript
// Stored in IndexedDB 'settings' store
{
  key: "income",
  value: {
    id: "1",
    source: "Primary Job",
    amount: 50000,
    currency: "INR",
    date: "2026-01-01"
  }
}
```

---

## Storage Limits

| Storage Type | Capacity | Persistence |
|--------------|----------|-------------|
| Memory Cache | ~2-5MB (runtime only) | Lost on refresh |
| IndexedDB | 50MB+ (browser dependent) | Permanent |
| Firebase/Supabase | Unlimited (with quota) | Cloud backup |

**Estimated Usage**:
- 1,000 expenses: ~200 KB
- 10 years of data: ~2 MB

IndexedDB is more than enough!

---

## Performance

### Read Operations
- **Memory Cache**: <1ms (instant)
- **IndexedDB**: 5-20ms (not used during runtime)
- **Cloud Sync**: 100-500ms (future, background only)

### Write Operations
- **UI Update**: <1ms (immediate)
- **IndexedDB Save**: 10-50ms (background)
- **Cloud Sync**: 200-1000ms (future, background)

---

## Offline Support

✅ **Current**: Works 100% offline (IndexedDB)
✅ **Future**: Offline-first with sync when online

When offline:
1. All operations work normally
2. Changes queued for sync
3. When online, queue syncs automatically
4. Conflicts resolved automatically or manually

---

## Security & Privacy

### Current
- Data stored locally in browser
- No server, no transmission
- User controls data (can clear via browser settings)

### Future (with cloud sync)
- End-to-end encryption option
- Firebase/Supabase security rules
- User authentication required
- Data isolated per user

---

## Migration Path

### Phase 0 (Current) ✅
- IndexedDB + Memory Cache
- Sync hooks ready but not implemented
- 100% offline

### Phase 1 (Weeks 1-2)
- Add Firebase/Supabase config
- Implement sync methods
- Enable real-time listeners
- Add authentication

### Phase 2 (Weeks 3-4)
- Conflict resolution UI
- Offline queue management
- Multi-device testing

---

## Code Organization

```
src/
├── services/
│   └── cache.js          # Storage service (IndexedDB + sync hooks)
├── components/
│   ├── Dashboard.jsx     # Uses cacheStore
│   ├── ExpenseForm.jsx   # Uses cacheStore
│   └── ...
└── utils/
    └── mockData.js       # Default data structures
```

---

## Benefits of This Architecture

✅ **Simple API**: Components don't deal with async storage
✅ **Fast**: Memory cache = instant responses
✅ **Persistent**: IndexedDB survives refresh
✅ **Scalable**: Ready for cloud sync without refactoring
✅ **Offline-first**: Works without internet
✅ **Reactive**: Auto-updates on data changes
✅ **Future-proof**: Cloud sync hooks already in place

---

## Next Steps

1. ✅ IndexedDB implementation (DONE)
2. ⏳ Test offline functionality
3. ⏳ Add proper routing with React Router
4. ⏳ Implement cloud sync (Firebase/Supabase)
5. ⏳ Add authentication
6. ⏳ Multi-device sync

---

## Questions?

Check [ROADMAP.md](./ROADMAP.md) for feature priorities and timeline.
