import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mocks ─────────────────────────────────────────────────────────────────────

vi.mock('@/utils/db', () => ({
  saveTemplate: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('uuid', () => ({
  v4: vi.fn().mockReturnValue('new-uuid-generated'),
}))

import { saveTemplate } from '@/utils/db'
import { importTemplate } from '@/utils/importTemplate'

const saveTemplateMock = vi.mocked(saveTemplate)

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeFile(content: string, name = 'plantilla.json'): File {
  return new File([content], name, { type: 'application/json' })
}

function makeValidPayload(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    type: 'dashform-template',
    schemaVersion: 1,
    exportedAt: '2026-04-08T00:00:00.000Z',
    template: {
      id: 'original-id',
      nombre: 'Mi Formulario',
      descripcion: 'Descripción',
      version: '1.0.0',
      schemaVersion: 1,
      pdfConfig: { template: 'modern', colorTema: '#3b82f6' },
      secciones: [
        {
          id: 's1',
          nombre: 'Sección 1',
          campos: [
            { id: 'f1', tipo: 'texto', label: 'Nombre', obligatorio: false },
          ],
        },
      ],
    },
    ...overrides,
  })
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('importTemplate', () => {
  beforeEach(() => {
    saveTemplateMock.mockClear()
  })

  // ── Parsing errors ─────────────────────────────────────────────────────────

  it('rejects plain text that is not JSON', async () => {
    const result = await importTemplate(makeFile('esto no es JSON'))
    expect(result.success).toBe(false)
    expect(result.errors![0]).toMatch(/json/i)
  })

  it('rejects empty file', async () => {
    const result = await importTemplate(makeFile(''))
    expect(result.success).toBe(false)
    expect(result.errors!.length).toBeGreaterThan(0)
  })

  // ── Type validation ────────────────────────────────────────────────────────

  it('rejects JSON without type field', async () => {
    const result = await importTemplate(
      makeFile(JSON.stringify({ schemaVersion: 1, template: {} })),
    )
    expect(result.success).toBe(false)
    expect(result.errors!.some((e) => e.toLowerCase().includes('tipo'))).toBe(true)
  })

  it('rejects dashform-editable with specific helpful message', async () => {
    const result = await importTemplate(
      makeFile(JSON.stringify({ type: 'dashform-editable', schemaVersion: 1 })),
    )
    expect(result.success).toBe(false)
    expect(result.errors![0]).toMatch(/filler/i)
  })

  it('rejects unknown type with descriptive error', async () => {
    const result = await importTemplate(
      makeFile(JSON.stringify({ type: 'something-else', schemaVersion: 1 })),
    )
    expect(result.success).toBe(false)
    expect(result.errors!.some((e) => e.includes('dashform-template'))).toBe(true)
  })

  // ── Structure validation ───────────────────────────────────────────────────

  it('rejects when template object is missing', async () => {
    const result = await importTemplate(
      makeFile(JSON.stringify({ type: 'dashform-template', schemaVersion: 1 })),
    )
    expect(result.success).toBe(false)
    expect(result.errors!.some((e) => e.toLowerCase().includes('plantilla'))).toBe(true)
  })

  it('rejects when template.nombre is missing', async () => {
    const payload = JSON.parse(makeValidPayload())
    delete payload.template.nombre
    const result = await importTemplate(makeFile(JSON.stringify(payload)))
    expect(result.success).toBe(false)
    expect(result.errors!.some((e) => e.toLowerCase().includes('nombre'))).toBe(true)
  })

  it('rejects when template.nombre is empty string', async () => {
    const payload = JSON.parse(makeValidPayload())
    payload.template.nombre = ''
    const result = await importTemplate(makeFile(JSON.stringify(payload)))
    expect(result.success).toBe(false)
    expect(result.errors!.some((e) => e.toLowerCase().includes('nombre'))).toBe(true)
  })

  it('rejects when template.secciones is not an array', async () => {
    const payload = JSON.parse(makeValidPayload())
    payload.template.secciones = 'no-array'
    const result = await importTemplate(makeFile(JSON.stringify(payload)))
    expect(result.success).toBe(false)
    expect(result.errors!.some((e) => e.toLowerCase().includes('secciones'))).toBe(true)
  })

  it('rejects when a section is missing id', async () => {
    const payload = JSON.parse(makeValidPayload())
    delete payload.template.secciones[0].id
    const result = await importTemplate(makeFile(JSON.stringify(payload)))
    expect(result.success).toBe(false)
    expect(result.errors!.some((e) => e.toLowerCase().includes('sección'))).toBe(true)
  })

  it('rejects when a section.campos is not an array', async () => {
    const payload = JSON.parse(makeValidPayload())
    payload.template.secciones[0].campos = null
    const result = await importTemplate(makeFile(JSON.stringify(payload)))
    expect(result.success).toBe(false)
  })

  it('rejects when a field is missing label', async () => {
    const payload = JSON.parse(makeValidPayload())
    delete payload.template.secciones[0].campos[0].label
    const result = await importTemplate(makeFile(JSON.stringify(payload)))
    expect(result.success).toBe(false)
    expect(result.errors!.some((e) => e.toLowerCase().includes('label') || e.toLowerCase().includes('etiqueta'))).toBe(true)
  })

  it('rejects when a field is missing id', async () => {
    const payload = JSON.parse(makeValidPayload())
    delete payload.template.secciones[0].campos[0].id
    const result = await importTemplate(makeFile(JSON.stringify(payload)))
    expect(result.success).toBe(false)
  })

  // ── Forward-compatibility: unknown field types pass through ────────────────

  it('accepts a field with an unknown tipo (forward-compatibility)', async () => {
    const payload = JSON.parse(makeValidPayload())
    payload.template.secciones[0].campos[0].tipo = 'future-unknown-type'
    const result = await importTemplate(makeFile(JSON.stringify(payload)))
    expect(result.success).toBe(true)
  })

  // ── Happy path ─────────────────────────────────────────────────────────────

  it('returns success for a valid exported template', async () => {
    const result = await importTemplate(makeFile(makeValidPayload()))
    expect(result.success).toBe(true)
  })

  it('saves to IndexedDB on success', async () => {
    await importTemplate(makeFile(makeValidPayload()))
    expect(saveTemplateMock).toHaveBeenCalledTimes(1)
  })

  it('returns the stored template on success', async () => {
    const result = await importTemplate(makeFile(makeValidPayload()))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.template).toBeDefined()
      expect(result.template.nombre).toBe('Mi Formulario')
    }
  })

  // ── ID regeneration ────────────────────────────────────────────────────────

  it('assigns a NEW id instead of the original', async () => {
    const result = await importTemplate(makeFile(makeValidPayload()))
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.template.id).not.toBe('original-id')
      expect(result.template.id).toBe('new-uuid-generated')
    }
  })

  it('saved template has new id, not original', async () => {
    await importTemplate(makeFile(makeValidPayload()))
    const saved = saveTemplateMock.mock.calls[0][0]
    expect(saved.id).toBe('new-uuid-generated')
    expect(saved.id).not.toBe('original-id')
  })

  // ── Dates ──────────────────────────────────────────────────────────────────

  it('sets fechaCreacion to current time', async () => {
    const before = new Date().toISOString()
    const result = await importTemplate(makeFile(makeValidPayload()))
    const after = new Date().toISOString()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.template.fechaCreacion >= before).toBe(true)
      expect(result.template.fechaCreacion <= after).toBe(true)
    }
  })

  it('sets fechaModificacion to current time', async () => {
    const before = new Date().toISOString()
    const result = await importTemplate(makeFile(makeValidPayload()))
    const after = new Date().toISOString()
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.template.fechaModificacion >= before).toBe(true)
      expect(result.template.fechaModificacion <= after).toBe(true)
    }
  })

  // ── Does not save on failure ───────────────────────────────────────────────

  it('does not call saveTemplate when validation fails', async () => {
    await importTemplate(makeFile('texto plano'))
    expect(saveTemplateMock).not.toHaveBeenCalled()
  })
})
