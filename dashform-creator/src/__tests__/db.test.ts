import { describe, it, expect, beforeEach } from 'vitest'
import { IDBFactory } from 'fake-indexeddb'
import type { StoredTemplate } from '@/utils/db'

// ── Per-test fresh IDB + module reset ─────────────────────────────────────────
// fake-indexeddb's IDBFactory gives us an isolated in-memory store each time.
// vi.resetModules() clears the cached DB singleton inside db.ts.

async function freshDb() {
  // Give this test a brand-new in-memory IDB instance
  globalThis.indexedDB = new IDBFactory()
  vi.resetModules()
  const mod = await import('@/utils/db')
  await mod.initCreatorDB()
  return mod
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeStored(id: string, nombre = `Plantilla ${id}`): StoredTemplate {
  return {
    id,
    nombre,
    descripcion: 'Test',
    version: '1.0.0',
    schemaVersion: 1,
    pdfConfig: { template: 'default', colorTema: '#3b82f6' },
    secciones: [],
    fechaCreacion: new Date().toISOString(),
    fechaModificacion: new Date().toISOString(),
  }
}

// ── saveTemplate / getTemplate ────────────────────────────────────────────────

describe('db — saveTemplate / getTemplate', () => {
  it('persists and retrieves a template by id', async () => {
    const { saveTemplate, getTemplate } = await freshDb()
    await saveTemplate(makeStored('t1'))
    const result = await getTemplate('t1')
    expect(result).toBeDefined()
    expect(result!.id).toBe('t1')
    expect(result!.nombre).toBe('Plantilla t1')
  })

  it('returns undefined for unknown id', async () => {
    const { getTemplate } = await freshDb()
    expect(await getTemplate('does-not-exist')).toBeUndefined()
  })

  it('overwrites existing record on save (upsert)', async () => {
    const { saveTemplate, getTemplate } = await freshDb()
    await saveTemplate(makeStored('t1', 'Original'))
    await saveTemplate(makeStored('t1', 'Updated'))
    expect((await getTemplate('t1'))!.nombre).toBe('Updated')
  })
})

// ── getAllTemplates ────────────────────────────────────────────────────────────

describe('db — getAllTemplates', () => {
  it('returns empty array when no templates', async () => {
    const { getAllTemplates } = await freshDb()
    expect(await getAllTemplates()).toEqual([])
  })

  it('returns all saved templates', async () => {
    const { saveTemplate, getAllTemplates } = await freshDb()
    await saveTemplate(makeStored('a'))
    await saveTemplate(makeStored('b'))
    await saveTemplate(makeStored('c'))
    const all = await getAllTemplates()
    expect(all).toHaveLength(3)
    expect(all.map((t) => t.id).sort()).toEqual(['a', 'b', 'c'])
  })
})

// ── deleteTemplate ────────────────────────────────────────────────────────────

describe('db — deleteTemplate', () => {
  it('removes the template from store', async () => {
    const { saveTemplate, deleteTemplate, getTemplate } = await freshDb()
    await saveTemplate(makeStored('del-me'))
    await deleteTemplate('del-me')
    expect(await getTemplate('del-me')).toBeUndefined()
  })

  it('deleting non-existent id does not throw', async () => {
    const { deleteTemplate } = await freshDb()
    await expect(deleteTemplate('ghost')).resolves.toBeUndefined()
  })

  it('only removes target, not neighbours', async () => {
    const { saveTemplate, deleteTemplate, getAllTemplates } = await freshDb()
    await saveTemplate(makeStored('x1'))
    await saveTemplate(makeStored('x2'))
    await deleteTemplate('x1')
    const all = await getAllTemplates()
    expect(all).toHaveLength(1)
    expect(all[0].id).toBe('x2')
  })
})

// ── updateTemplate ────────────────────────────────────────────────────────────

describe('db — updateTemplate', () => {
  it('updates fechaModificacion to now', async () => {
    const { saveTemplate, updateTemplate, getTemplate } = await freshDb()
    const old = makeStored('u1')
    old.fechaModificacion = '2000-01-01T00:00:00.000Z'
    await saveTemplate(old)

    const before = Date.now()
    await updateTemplate({ ...old, nombre: 'Actualizada' })
    const after = Date.now()

    const result = await getTemplate('u1')
    const ts = new Date(result!.fechaModificacion).getTime()
    expect(ts).toBeGreaterThanOrEqual(before)
    expect(ts).toBeLessThanOrEqual(after)
  })

  it('persists updated fields', async () => {
    const { saveTemplate, updateTemplate, getTemplate } = await freshDb()
    await saveTemplate(makeStored('u2'))
    await updateTemplate({ ...makeStored('u2', 'Nombre nuevo'), descripcion: 'Nueva desc' })
    const result = await getTemplate('u2')
    expect(result!.nombre).toBe('Nombre nuevo')
    expect(result!.descripcion).toBe('Nueva desc')
  })
})
