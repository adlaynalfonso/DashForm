// Install ALL IndexedDB globals (IDBRequest, IDBKeyRange, IDBFactory, etc.)
// fake-indexeddb/auto patches globalThis with the complete IDB API
import 'fake-indexeddb/auto'

// Polyfill structuredClone if missing
if (typeof globalThis.structuredClone === 'undefined') {
  globalThis.structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj))
}

// Silence noisy console.warn in tests
vi.spyOn(console, 'warn').mockImplementation(() => {})
