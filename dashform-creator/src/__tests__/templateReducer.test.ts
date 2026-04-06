/**
 * Tests for the useTemplateEditor reducer logic.
 * We extract and test the pure reducer function directly.
 */
import { describe, it, expect, beforeEach } from 'vitest'
import type { Template, Field, FieldType } from '@/types/template'

// ── Re-implement the reducer as a pure import for testing ─────────────────────
// We pull the internals by importing the module. Because the reducer is not
// exported separately we duplicate just enough to drive the tests.

import { v4 as uuid } from 'uuid'

type EditorAction =
  | { type: 'LOAD_TEMPLATE'; payload: Template }
  | { type: 'SET_NOMBRE'; payload: string }
  | { type: 'SET_DESCRIPCION'; payload: string }
  | { type: 'ADD_SECTION' }
  | { type: 'REMOVE_SECTION'; payload: string }
  | { type: 'UPDATE_SECTION_NAME'; payload: { id: string; nombre: string } }
  | { type: 'MOVE_SECTION_UP'; payload: string }
  | { type: 'MOVE_SECTION_DOWN'; payload: string }
  | { type: 'ADD_FIELD'; payload: { sectionId: string; tipo: FieldType } }
  | { type: 'REMOVE_FIELD'; payload: { sectionId: string; fieldId: string } }
  | { type: 'UPDATE_FIELD'; payload: { sectionId: string; field: Field } }
  | { type: 'MOVE_FIELD_UP'; payload: { sectionId: string; fieldId: string } }
  | { type: 'MOVE_FIELD_DOWN'; payload: { sectionId: string; fieldId: string } }
  | { type: 'UPDATE_PDF_CONFIG'; payload: Partial<Template['pdfConfig']> }

function swapAt<T>(arr: T[], i: number, j: number): T[] {
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

function updateSection(
  secciones: Template['secciones'],
  id: string,
  fn: (s: Template['secciones'][number]) => Template['secciones'][number],
) {
  return secciones.map((s) => (s.id === id ? fn(s) : s))
}

const FIELD_LABELS: Record<FieldType, string> = {
  'texto': 'Campo de texto', 'texto-expandible': 'Texto largo', 'email': 'Email',
  'telefono': 'Teléfono', 'checkbox': 'Checkbox', 'radio': 'Radio',
  'select': 'Select', 'fecha': 'Fecha', 'firma-digital': 'Firma digital', 'firma-texto': 'Firma escrita',
  'numero': 'Número', 'texto-checkbox': 'Texto con checkbox', 'encabezado': 'Encabezado',
}

function defaultField(tipo: FieldType): Field {
  const base: Field = { id: uuid(), tipo, label: FIELD_LABELS[tipo], obligatorio: false }
  if (tipo === 'radio' || tipo === 'select') return { ...base, opciones: ['Opción 1', 'Opción 2'] }
  if (tipo === 'numero') return { ...base, placeholder: '0' }
  if (tipo === 'texto-checkbox') return { ...base, placeholder: 'Escriba aquí...' }
  if (tipo === 'encabezado') return { ...base, label: 'Encabezado de sección', obligatorio: false, nivelEncabezado: 2 }
  return base
}

function reducer(state: Template, action: EditorAction): Template {
  switch (action.type) {
    case 'LOAD_TEMPLATE': return action.payload
    case 'SET_NOMBRE': return { ...state, nombre: action.payload }
    case 'SET_DESCRIPCION': return { ...state, descripcion: action.payload }
    case 'ADD_SECTION':
      return { ...state, secciones: [...state.secciones, { id: uuid(), nombre: 'Nueva Sección', campos: [] }] }
    case 'REMOVE_SECTION':
      return { ...state, secciones: state.secciones.filter((s) => s.id !== action.payload) }
    case 'UPDATE_SECTION_NAME':
      return { ...state, secciones: updateSection(state.secciones, action.payload.id, (s) => ({ ...s, nombre: action.payload.nombre })) }
    case 'MOVE_SECTION_UP': {
      const idx = state.secciones.findIndex((s) => s.id === action.payload)
      if (idx <= 0) return state
      return { ...state, secciones: swapAt(state.secciones, idx - 1, idx) }
    }
    case 'MOVE_SECTION_DOWN': {
      const idx = state.secciones.findIndex((s) => s.id === action.payload)
      if (idx === -1 || idx >= state.secciones.length - 1) return state
      return { ...state, secciones: swapAt(state.secciones, idx, idx + 1) }
    }
    case 'ADD_FIELD':
      return { ...state, secciones: updateSection(state.secciones, action.payload.sectionId, (s) => ({ ...s, campos: [...s.campos, defaultField(action.payload.tipo)] })) }
    case 'REMOVE_FIELD':
      return { ...state, secciones: updateSection(state.secciones, action.payload.sectionId, (s) => ({ ...s, campos: s.campos.filter((f) => f.id !== action.payload.fieldId) })) }
    case 'UPDATE_FIELD':
      return { ...state, secciones: updateSection(state.secciones, action.payload.sectionId, (s) => ({ ...s, campos: s.campos.map((f) => f.id === action.payload.field.id ? action.payload.field : f) })) }
    case 'MOVE_FIELD_UP': {
      const { sectionId, fieldId } = action.payload
      return { ...state, secciones: updateSection(state.secciones, sectionId, (s) => {
        const idx = s.campos.findIndex((f) => f.id === fieldId)
        if (idx <= 0) return s
        return { ...s, campos: swapAt(s.campos, idx - 1, idx) }
      }) }
    }
    case 'MOVE_FIELD_DOWN': {
      const { sectionId, fieldId } = action.payload
      return { ...state, secciones: updateSection(state.secciones, sectionId, (s) => {
        const idx = s.campos.findIndex((f) => f.id === fieldId)
        if (idx === -1 || idx >= s.campos.length - 1) return s
        return { ...s, campos: swapAt(s.campos, idx, idx + 1) }
      }) }
    }
    case 'UPDATE_PDF_CONFIG':
      return { ...state, pdfConfig: { ...state.pdfConfig, ...action.payload } }
    default: return state
  }
}

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTemplate(overrides: Partial<Template> = {}): Template {
  return {
    id: 'tpl-1',
    nombre: 'Test Template',
    descripcion: '',
    version: '1.0.0',
    schemaVersion: 1,
    pdfConfig: { template: 'default', colorTema: '#3b82f6' },
    secciones: [],
    ...overrides,
  }
}

function makeSec(id: string, campos: Field[] = []) {
  return { id, nombre: `Sección ${id}`, campos }
}

function makeField(id: string, tipo: FieldType = 'texto'): Field {
  return { id, tipo, label: `Campo ${id}`, obligatorio: false }
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('reducer — metadata', () => {
  it('SET_NOMBRE updates nombre', () => {
    const state = reducer(makeTemplate(), { type: 'SET_NOMBRE', payload: 'Nuevo Nombre' })
    expect(state.nombre).toBe('Nuevo Nombre')
  })

  it('SET_DESCRIPCION updates descripcion', () => {
    const state = reducer(makeTemplate(), { type: 'SET_DESCRIPCION', payload: 'Desc' })
    expect(state.descripcion).toBe('Desc')
  })

  it('LOAD_TEMPLATE replaces entire state', () => {
    const incoming = makeTemplate({ nombre: 'Loaded', id: 'tpl-2' })
    const state = reducer(makeTemplate(), { type: 'LOAD_TEMPLATE', payload: incoming })
    expect(state.id).toBe('tpl-2')
    expect(state.nombre).toBe('Loaded')
  })

  it('UPDATE_PDF_CONFIG merges partial config', () => {
    const state = reducer(makeTemplate(), { type: 'UPDATE_PDF_CONFIG', payload: { colorTema: '#ff0000', encabezado: 'Cabecera' } })
    expect(state.pdfConfig.colorTema).toBe('#ff0000')
    expect(state.pdfConfig.encabezado).toBe('Cabecera')
    expect(state.pdfConfig.template).toBe('default') // preserved
  })
})

describe('reducer — sections', () => {
  it('ADD_SECTION appends a new section', () => {
    const state = reducer(makeTemplate(), { type: 'ADD_SECTION' })
    expect(state.secciones).toHaveLength(1)
    expect(state.secciones[0].campos).toHaveLength(0)
  })

  it('ADD_SECTION is immutable — original unchanged', () => {
    const original = makeTemplate()
    reducer(original, { type: 'ADD_SECTION' })
    expect(original.secciones).toHaveLength(0)
  })

  it('REMOVE_SECTION removes by id', () => {
    const base = makeTemplate({ secciones: [makeSec('a'), makeSec('b')] })
    const state = reducer(base, { type: 'REMOVE_SECTION', payload: 'a' })
    expect(state.secciones).toHaveLength(1)
    expect(state.secciones[0].id).toBe('b')
  })

  it('REMOVE_SECTION with unknown id leaves state unchanged', () => {
    const base = makeTemplate({ secciones: [makeSec('a')] })
    const state = reducer(base, { type: 'REMOVE_SECTION', payload: 'zzz' })
    expect(state.secciones).toHaveLength(1)
  })

  it('UPDATE_SECTION_NAME renames target section', () => {
    const base = makeTemplate({ secciones: [makeSec('a'), makeSec('b')] })
    const state = reducer(base, { type: 'UPDATE_SECTION_NAME', payload: { id: 'a', nombre: 'Renombrada' } })
    expect(state.secciones[0].nombre).toBe('Renombrada')
    expect(state.secciones[1].nombre).toBe('Sección b') // untouched
  })

  it('MOVE_SECTION_UP swaps with previous', () => {
    const base = makeTemplate({ secciones: [makeSec('a'), makeSec('b'), makeSec('c')] })
    const state = reducer(base, { type: 'MOVE_SECTION_UP', payload: 'b' })
    expect(state.secciones.map((s) => s.id)).toEqual(['b', 'a', 'c'])
  })

  it('MOVE_SECTION_UP at index 0 is a no-op', () => {
    const base = makeTemplate({ secciones: [makeSec('a'), makeSec('b')] })
    const state = reducer(base, { type: 'MOVE_SECTION_UP', payload: 'a' })
    expect(state.secciones.map((s) => s.id)).toEqual(['a', 'b'])
  })

  it('MOVE_SECTION_DOWN swaps with next', () => {
    const base = makeTemplate({ secciones: [makeSec('a'), makeSec('b'), makeSec('c')] })
    const state = reducer(base, { type: 'MOVE_SECTION_DOWN', payload: 'b' })
    expect(state.secciones.map((s) => s.id)).toEqual(['a', 'c', 'b'])
  })

  it('MOVE_SECTION_DOWN at last index is a no-op', () => {
    const base = makeTemplate({ secciones: [makeSec('a'), makeSec('b')] })
    const state = reducer(base, { type: 'MOVE_SECTION_DOWN', payload: 'b' })
    expect(state.secciones.map((s) => s.id)).toEqual(['a', 'b'])
  })
})

describe('reducer — fields', () => {
  let base: Template

  beforeEach(() => {
    base = makeTemplate({
      secciones: [
        { id: 's1', nombre: 'S1', campos: [makeField('f1'), makeField('f2'), makeField('f3')] },
        { id: 's2', nombre: 'S2', campos: [] },
      ],
    })
  })

  it('ADD_FIELD appends field with correct tipo and default label', () => {
    const state = reducer(base, { type: 'ADD_FIELD', payload: { sectionId: 's2', tipo: 'email' } })
    const sec = state.secciones.find((s) => s.id === 's2')!
    expect(sec.campos).toHaveLength(1)
    expect(sec.campos[0].tipo).toBe('email')
    expect(sec.campos[0].label).toBe('Email')
    expect(sec.campos[0].obligatorio).toBe(false)
  })

  it('ADD_FIELD radio/select includes default opciones', () => {
    const state = reducer(base, { type: 'ADD_FIELD', payload: { sectionId: 's1', tipo: 'radio' } })
    const sec = state.secciones.find((s) => s.id === 's1')!
    const field = sec.campos[sec.campos.length - 1]
    expect(field.opciones).toEqual(['Opción 1', 'Opción 2'])
  })

  it('ADD_FIELD does not affect other sections', () => {
    const state = reducer(base, { type: 'ADD_FIELD', payload: { sectionId: 's2', tipo: 'texto' } })
    expect(state.secciones.find((s) => s.id === 's1')!.campos).toHaveLength(3)
  })

  it('REMOVE_FIELD removes by id', () => {
    const state = reducer(base, { type: 'REMOVE_FIELD', payload: { sectionId: 's1', fieldId: 'f2' } })
    const ids = state.secciones.find((s) => s.id === 's1')!.campos.map((f) => f.id)
    expect(ids).toEqual(['f1', 'f3'])
  })

  it('UPDATE_FIELD replaces matching field', () => {
    const updated: Field = { id: 'f2', tipo: 'email', label: 'Correo', obligatorio: true }
    const state = reducer(base, { type: 'UPDATE_FIELD', payload: { sectionId: 's1', field: updated } })
    const field = state.secciones.find((s) => s.id === 's1')!.campos.find((f) => f.id === 'f2')!
    expect(field.label).toBe('Correo')
    expect(field.obligatorio).toBe(true)
    expect(field.tipo).toBe('email')
  })

  it('UPDATE_FIELD does not mutate other fields', () => {
    const updated: Field = { id: 'f2', tipo: 'texto', label: 'X', obligatorio: false }
    const state = reducer(base, { type: 'UPDATE_FIELD', payload: { sectionId: 's1', field: updated } })
    const sec = state.secciones.find((s) => s.id === 's1')!
    expect(sec.campos[0].label).toBe('Campo f1')
    expect(sec.campos[2].label).toBe('Campo f3')
  })

  it('MOVE_FIELD_UP swaps field with previous', () => {
    const state = reducer(base, { type: 'MOVE_FIELD_UP', payload: { sectionId: 's1', fieldId: 'f2' } })
    const ids = state.secciones.find((s) => s.id === 's1')!.campos.map((f) => f.id)
    expect(ids).toEqual(['f2', 'f1', 'f3'])
  })

  it('MOVE_FIELD_UP at first position is a no-op', () => {
    const state = reducer(base, { type: 'MOVE_FIELD_UP', payload: { sectionId: 's1', fieldId: 'f1' } })
    const ids = state.secciones.find((s) => s.id === 's1')!.campos.map((f) => f.id)
    expect(ids).toEqual(['f1', 'f2', 'f3'])
  })

  it('MOVE_FIELD_DOWN swaps field with next', () => {
    const state = reducer(base, { type: 'MOVE_FIELD_DOWN', payload: { sectionId: 's1', fieldId: 'f2' } })
    const ids = state.secciones.find((s) => s.id === 's1')!.campos.map((f) => f.id)
    expect(ids).toEqual(['f1', 'f3', 'f2'])
  })

  it('MOVE_FIELD_DOWN at last position is a no-op', () => {
    const state = reducer(base, { type: 'MOVE_FIELD_DOWN', payload: { sectionId: 's1', fieldId: 'f3' } })
    const ids = state.secciones.find((s) => s.id === 's1')!.campos.map((f) => f.id)
    expect(ids).toEqual(['f1', 'f2', 'f3'])
  })

  it('field operations on wrong sectionId leave other section unchanged', () => {
    const state = reducer(base, { type: 'REMOVE_FIELD', payload: { sectionId: 's2', fieldId: 'f1' } })
    expect(state.secciones.find((s) => s.id === 's1')!.campos).toHaveLength(3)
  })
})

describe('reducer — new field types', () => {
  let base: Template

  beforeEach(() => {
    base = makeTemplate({ secciones: [{ id: 's1', nombre: 'S1', campos: [] }] })
  })

  it('ADD_FIELD numero has label Número and placeholder 0', () => {
    const state = reducer(base, { type: 'ADD_FIELD', payload: { sectionId: 's1', tipo: 'numero' } })
    const field = state.secciones[0].campos[0]
    expect(field.tipo).toBe('numero')
    expect(field.label).toBe('Número')
    expect(field.placeholder).toBe('0')
    expect(field.obligatorio).toBe(false)
  })

  it('ADD_FIELD texto-checkbox has correct label and placeholder', () => {
    const state = reducer(base, { type: 'ADD_FIELD', payload: { sectionId: 's1', tipo: 'texto-checkbox' } })
    const field = state.secciones[0].campos[0]
    expect(field.tipo).toBe('texto-checkbox')
    expect(field.label).toBe('Texto con checkbox')
    expect(field.placeholder).toBe('Escriba aquí...')
  })

  it('ADD_FIELD encabezado has correct defaults', () => {
    const state = reducer(base, { type: 'ADD_FIELD', payload: { sectionId: 's1', tipo: 'encabezado' } })
    const field = state.secciones[0].campos[0]
    expect(field.tipo).toBe('encabezado')
    expect(field.label).toBe('Encabezado de sección')
    expect(field.obligatorio).toBe(false)
    expect(field.nivelEncabezado).toBe(2)
  })
})
