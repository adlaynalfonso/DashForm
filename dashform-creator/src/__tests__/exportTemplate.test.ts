import { describe, it, expect, vi, beforeEach } from 'vitest'
import { validateTemplateForExport, exportTemplate } from '@/utils/exportTemplate'
import type { Template, Field, Section } from '@/types/template'

// ── Mock file-saver ───────────────────────────────────────────────────────────

vi.mock('file-saver', () => ({
  saveAs: vi.fn(),
}))

import { saveAs } from 'file-saver'
const saveAsMock = vi.mocked(saveAs)

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeField(id: string, label = `Campo ${id}`): Field {
  return { id, tipo: 'texto', label, obligatorio: false }
}

function makeSection(id: string, campos: Field[] = []): Section {
  return { id, nombre: `Sección ${id}`, campos }
}

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'tpl-1',
    nombre: 'Mi Formulario',
    descripcion: 'Desc',
    version: '1.0.0',
    schemaVersion: 1,
    pdfConfig: { template: 'default', colorTema: '#3b82f6' },
    secciones: [makeSection('s1', [makeField('f1'), makeField('f2')])],
    ...overrides,
  }
}

// ── validateTemplateForExport ─────────────────────────────────────────────────

describe('validateTemplateForExport', () => {
  it('passes a fully valid template', () => {
    const result = validateTemplateForExport(makeTemplate())
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('fails when nombre is empty', () => {
    const result = validateTemplateForExport(makeTemplate({ nombre: '' }))
    expect(result.valid).toBe(false)
    expect(result.errors).toContain('La plantilla debe tener un nombre.')
  })

  it('fails when nombre is whitespace only', () => {
    const result = validateTemplateForExport(makeTemplate({ nombre: '   ' }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('nombre'))).toBe(true)
  })

  it('fails when there are no sections', () => {
    const result = validateTemplateForExport(makeTemplate({ secciones: [] }))
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('sección'))).toBe(true)
  })

  it('fails when a section has no fields', () => {
    const result = validateTemplateForExport(
      makeTemplate({ secciones: [makeSection('s1', [])] }),
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('campo'))).toBe(true)
  })

  it('includes section name in the empty-fields error', () => {
    const result = validateTemplateForExport(
      makeTemplate({ secciones: [makeSection('s1', [])] }),
    )
    expect(result.errors.some((e) => e.includes('Sección s1'))).toBe(true)
  })

  it('fails when a field has no label', () => {
    const result = validateTemplateForExport(
      makeTemplate({ secciones: [makeSection('s1', [makeField('f1', '')])] }),
    )
    expect(result.valid).toBe(false)
    expect(result.errors.some((e) => e.includes('etiqueta'))).toBe(true)
  })

  it('fails when a field label is whitespace only', () => {
    const result = validateTemplateForExport(
      makeTemplate({ secciones: [makeSection('s1', [makeField('f1', '   ')])] }),
    )
    expect(result.valid).toBe(false)
  })

  it('accumulates multiple errors', () => {
    const result = validateTemplateForExport({
      ...makeTemplate({ nombre: '' }),
      secciones: [makeSection('s1', [makeField('f1', '')])],
    })
    expect(result.errors.length).toBeGreaterThanOrEqual(2)
  })
})

// ── exportTemplate ────────────────────────────────────────────────────────────

describe('exportTemplate', () => {
  beforeEach(() => {
    saveAsMock.mockClear()
    // Provide minimal URL API in jsdom
    Object.defineProperty(globalThis, 'URL', {
      value: { createObjectURL: vi.fn(() => 'blob:mock'), revokeObjectURL: vi.fn() },
      writable: true,
    })
  })

  it('calls saveAs once', () => {
    exportTemplate(makeTemplate())
    expect(saveAsMock).toHaveBeenCalledTimes(1)
  })

  it('filename contains sanitised template name and _plantilla.json', () => {
    exportTemplate(makeTemplate({ nombre: 'Mi Formulario' }))
    const [, filename] = saveAsMock.mock.calls[0] as [Blob, string]
    expect(filename).toMatch(/Mi_Formulario_plantilla\.json/)
  })

  it('filename falls back to template id when nombre is empty', () => {
    exportTemplate(makeTemplate({ nombre: '' }))
    const [, filename] = saveAsMock.mock.calls[0] as [Blob, string]
    expect(filename).toContain('tpl-1')
  })

  it('payload Blob contains correct type header', () => {
    exportTemplate(makeTemplate())
    const [blob] = saveAsMock.mock.calls[0] as [Blob, string]
    expect(blob.type).toContain('application/json')
  })

  it('exported JSON has type dashform-template', async () => {
    exportTemplate(makeTemplate())
    const [blob] = saveAsMock.mock.calls[0] as [Blob, string]
    const text = await blob.text()
    const parsed = JSON.parse(text)
    expect(parsed.type).toBe('dashform-template')
  })

  it('exported JSON has schemaVersion 1', async () => {
    exportTemplate(makeTemplate())
    const [blob] = saveAsMock.mock.calls[0] as [Blob, string]
    const parsed = JSON.parse(await blob.text())
    expect(parsed.schemaVersion).toBe(1)
  })

  it('exported JSON contains full template data', async () => {
    const tpl = makeTemplate()
    exportTemplate(tpl)
    const [blob] = saveAsMock.mock.calls[0] as [Blob, string]
    const parsed = JSON.parse(await blob.text())
    expect(parsed.template.id).toBe(tpl.id)
    expect(parsed.template.nombre).toBe(tpl.nombre)
    expect(parsed.template.secciones).toHaveLength(1)
  })

  it('exported JSON includes exportedAt timestamp', async () => {
    exportTemplate(makeTemplate())
    const [blob] = saveAsMock.mock.calls[0] as [Blob, string]
    const parsed = JSON.parse(await blob.text())
    expect(typeof parsed.exportedAt).toBe('string')
    expect(() => new Date(parsed.exportedAt)).not.toThrow()
  })

  it('strips special chars from filename', () => {
    exportTemplate(makeTemplate({ nombre: 'Form/Test:2025' }))
    const [, filename] = saveAsMock.mock.calls[0] as [Blob, string]
    expect(filename).not.toContain('/')
    expect(filename).not.toContain(':')
  })
})
