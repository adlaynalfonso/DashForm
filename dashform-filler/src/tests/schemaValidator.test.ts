import { describe, it, expect } from 'vitest'
import { validateImportedFile } from '@/utils/schemaValidator'

// ── Fixture factories ─────────────────────────────────────────────────────────

function makeTemplateJson(templateOverrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    type: 'dashform-template',
    schemaVersion: 1,
    template: {
      id: 'tpl-1',
      nombre: 'Plantilla Test',
      secciones: [
        {
          id: 'sec-1',
          nombre: 'Sección 1',
          campos: [{ id: 'f1', tipo: 'texto', label: 'Campo 1' }],
        },
      ],
      ...templateOverrides,
    },
  })
}

function makeEditableJson(formOverrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    type: 'dashform-editable',
    schemaVersion: 1,
    form: {
      id: 'form-1',
      templateId: 'tpl-1',
      templateVersion: '1.0.0',
      schemaVersion: 1,
      plantilla: {
        id: 'tpl-1',
        nombre: 'Plantilla Test',
        secciones: [
          {
            id: 'sec-1',
            nombre: 'Sección 1',
            campos: [{ id: 'f1', tipo: 'texto', label: 'Campo 1' }],
          },
        ],
      },
      datos: {},
      estado: 'borrador',
      fechaCreacion: '2026-04-04T00:00:00.000Z',
      fechaModificacion: '2026-04-04T00:00:00.000Z',
      ...formOverrides,
    },
  })
}

// ── Plantilla ─────────────────────────────────────────────────────────────────

describe('validateImportedFile – plantilla válida', () => {
  it('acepta una plantilla con estructura completa', () => {
    const result = validateImportedFile(makeTemplateJson())
    expect(result.valid).toBe(true)
    expect(result.type).toBe('template')
    expect(result.errors).toHaveLength(0)
    expect(result.data).not.toBeNull()
  })

  it('aplica valores por defecto (descripcion, version, schemaVersion)', () => {
    const result = validateImportedFile(makeTemplateJson())
    if (!result.valid || result.type !== 'template') throw new Error('Unexpected invalid result')
    expect(result.data.template.descripcion).toBe('')
    expect(result.data.template.version).toBe('1.0.0')
    expect(result.data.template.schemaVersion).toBe(1)
  })
})

describe('validateImportedFile – plantilla sin secciones', () => {
  it('rechaza plantilla con secciones vacías', () => {
    const result = validateImportedFile(makeTemplateJson({ secciones: [] }))
    expect(result.valid).toBe(false)
    expect(result.type).toBe('template')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rechaza plantilla sin campo "nombre"', () => {
    const result = validateImportedFile(makeTemplateJson({ nombre: '' }))
    expect(result.valid).toBe(false)
    expect(result.type).toBe('template')
  })
})

// ── Editable ──────────────────────────────────────────────────────────────────

describe('validateImportedFile – editable válido', () => {
  it('acepta un editable con estructura correcta', () => {
    const result = validateImportedFile(makeEditableJson())
    expect(result.valid).toBe(true)
    expect(result.type).toBe('editable')
    expect(result.errors).toHaveLength(0)
  })

  it('acepta un editable con datos pre-rellenados', () => {
    const result = validateImportedFile(makeEditableJson({ datos: { f1: 'valor' } }))
    expect(result.valid).toBe(true)
    expect(result.type).toBe('editable')
  })
})

describe('validateImportedFile – editable con datos corruptos', () => {
  it('rechaza JSON malformado', () => {
    const result = validateImportedFile('{ "type": "dashform-editable", corrupt ]')
    expect(result.valid).toBe(false)
    expect(result.type).toBeNull()
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rechaza editable con estado inválido', () => {
    const result = validateImportedFile(makeEditableJson({ estado: 'invalido' }))
    expect(result.valid).toBe(false)
    expect(result.type).toBe('editable')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('rechaza editable con fechaCreacion en formato incorrecto', () => {
    const result = validateImportedFile(makeEditableJson({ fechaCreacion: 'no-es-fecha' }))
    expect(result.valid).toBe(false)
    expect(result.type).toBe('editable')
  })
})

// ── Detección automática de tipo ──────────────────────────────────────────────

describe('validateImportedFile – detección automática de tipo', () => {
  it('identifica el tipo "template" por el campo type', () => {
    const result = validateImportedFile(makeTemplateJson())
    expect(result.type).toBe('template')
  })

  it('identifica el tipo "editable" por el campo type', () => {
    const result = validateImportedFile(makeEditableJson())
    expect(result.type).toBe('editable')
  })

  it('devuelve type:null para un tipo desconocido', () => {
    const json = JSON.stringify({ type: 'dashform-desconocido', data: {} })
    const result = validateImportedFile(json)
    expect(result.valid).toBe(false)
    expect(result.type).toBeNull()
  })

  it('devuelve type:null cuando falta el campo type', () => {
    const json = JSON.stringify({ schemaVersion: 1, template: {} })
    const result = validateImportedFile(json)
    expect(result.valid).toBe(false)
    expect(result.type).toBeNull()
  })
})
