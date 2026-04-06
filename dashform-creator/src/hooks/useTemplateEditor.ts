import { useReducer, useEffect, useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import type { Template, Section, Field, FieldType, PdfConfig } from '@/types/template'
import { getTemplate, saveTemplate, type StoredTemplate } from '@/utils/db'
import {
  normalizeLayout,
  removeFromLayout,
  moveFieldToRow,
  extractToSoloRow,
  swapRows,
} from '@/utils/layoutHelpers'

// ── Default creators ──────────────────────────────────────────────────────────

function defaultTemplate(): Template {
  return {
    id: uuid(),
    nombre: 'Nueva Plantilla',
    descripcion: '',
    version: '1.0.0',
    schemaVersion: 1,
    pdfConfig: { template: 'default', colorTema: '#3b82f6' },
    secciones: [],
  }
}

function defaultSection(): Section {
  return { id: uuid(), nombre: 'Nueva Sección', campos: [], layout: [] }
}

const FIELD_LABELS: Record<FieldType, string> = {
  'texto': 'Campo de texto',
  'texto-expandible': 'Texto largo',
  'email': 'Correo electrónico',
  'telefono': 'Teléfono',
  'checkbox': 'Casilla de verificación',
  'radio': 'Opción única',
  'select': 'Lista desplegable',
  'fecha': 'Fecha',
  'firma-digital': 'Firma digital',
  'firma-texto': 'Firma escrita',
  'numero': 'Número',
  'texto-checkbox': 'Texto con checkbox',
  'encabezado': 'Encabezado',
}

function defaultField(tipo: FieldType): Field {
  const base: Field = { id: uuid(), tipo, label: FIELD_LABELS[tipo], obligatorio: false }
  if (tipo === 'radio' || tipo === 'select') {
    return { ...base, opciones: ['Opción 1', 'Opción 2'] }
  }
  if (tipo === 'numero') {
    return { ...base, placeholder: '0' }
  }
  if (tipo === 'texto-checkbox') {
    return { ...base, placeholder: 'Escriba aquí...' }
  }
  if (tipo === 'encabezado') {
    return { ...base, label: 'Encabezado de sección', obligatorio: false, nivelEncabezado: 2 }
  }
  return base
}

function swapAt<T>(arr: T[], i: number, j: number): T[] {
  const next = [...arr]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}

/** Ensure every section in a loaded template has a normalised layout. */
function migrateTemplate(tpl: Template): Template {
  return {
    ...tpl,
    secciones: tpl.secciones.map((s) => ({
      ...s,
      layout: normalizeLayout(s),
    })),
  }
}

// ── Reducer ───────────────────────────────────────────────────────────────────

export type EditorAction =
  | { type: 'LOAD_TEMPLATE'; payload: Template }
  | { type: 'SET_NOMBRE'; payload: string }
  | { type: 'SET_DESCRIPCION'; payload: string }
  | { type: 'ADD_SECTION' }
  | { type: 'REMOVE_SECTION'; payload: string }
  | { type: 'UPDATE_SECTION_NAME'; payload: { id: string; nombre: string } }
  | { type: 'MOVE_SECTION_UP'; payload: string }
  | { type: 'MOVE_SECTION_DOWN'; payload: string }
  // Field actions
  | { type: 'ADD_FIELD'; payload: { sectionId: string; tipo: FieldType; targetRowId?: string } }
  | { type: 'REMOVE_FIELD'; payload: { sectionId: string; fieldId: string } }
  | { type: 'UPDATE_FIELD'; payload: { sectionId: string; field: Field } }
  | { type: 'MOVE_FIELD_UP'; payload: { sectionId: string; fieldId: string } }
  | { type: 'MOVE_FIELD_DOWN'; payload: { sectionId: string; fieldId: string } }
  // Row layout actions
  | { type: 'ADD_ROW'; payload: { sectionId: string } }
  | { type: 'REMOVE_ROW'; payload: { sectionId: string; rowId: string } }
  | { type: 'ADD_FIELD_TO_ROW'; payload: { sectionId: string; rowId: string; fieldId: string } }
  | { type: 'REMOVE_FIELD_FROM_ROW'; payload: { sectionId: string; fieldId: string } }
  | { type: 'MOVE_ROW_UP'; payload: { sectionId: string; rowId: string } }
  | { type: 'MOVE_ROW_DOWN'; payload: { sectionId: string; rowId: string } }
  // PDF config
  | { type: 'UPDATE_PDF_CONFIG'; payload: Partial<PdfConfig> }

function updateSection(
  secciones: Section[],
  id: string,
  fn: (s: Section) => Section,
): Section[] {
  return secciones.map((s) => (s.id === id ? fn(s) : s))
}

function reducer(state: Template, action: EditorAction): Template {
  switch (action.type) {

    case 'LOAD_TEMPLATE':
      return migrateTemplate(action.payload)

    case 'SET_NOMBRE':
      return { ...state, nombre: action.payload }

    case 'SET_DESCRIPCION':
      return { ...state, descripcion: action.payload }

    case 'ADD_SECTION':
      return { ...state, secciones: [...state.secciones, defaultSection()] }

    case 'REMOVE_SECTION':
      return { ...state, secciones: state.secciones.filter((s) => s.id !== action.payload) }

    case 'UPDATE_SECTION_NAME':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.id, (s) => ({
          ...s,
          nombre: action.payload.nombre,
        })),
      }

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

    // ── Field actions ─────────────────────────────────────────────────────────

    case 'ADD_FIELD':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.sectionId, (s) => {
          const newField = defaultField(action.payload.tipo)
          const currentLayout = s.layout ?? normalizeLayout(s)

          let nextLayout
          if (action.payload.targetRowId) {
            // Add to an existing row
            nextLayout = currentLayout.map((row) =>
              row.id === action.payload.targetRowId
                ? { ...row, campos: [...row.campos, newField.id] }
                : row,
            )
          } else {
            // New solo row at the end
            nextLayout = [...currentLayout, { id: uuid(), campos: [newField.id] }]
          }

          return { ...s, campos: [...s.campos, newField], layout: nextLayout }
        }),
      }

    case 'REMOVE_FIELD':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.sectionId, (s) => ({
          ...s,
          campos: s.campos.filter((f) => f.id !== action.payload.fieldId),
          layout: removeFromLayout(s.layout ?? normalizeLayout(s), action.payload.fieldId),
        })),
      }

    case 'UPDATE_FIELD':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.sectionId, (s) => ({
          ...s,
          campos: s.campos.map((f) =>
            f.id === action.payload.field.id ? action.payload.field : f,
          ),
        })),
      }

    // Legacy single-field reorder (kept for backward compat with tests/external use)
    case 'MOVE_FIELD_UP': {
      const { sectionId, fieldId } = action.payload
      return {
        ...state,
        secciones: updateSection(state.secciones, sectionId, (s) => {
          const idx = s.campos.findIndex((f) => f.id === fieldId)
          if (idx <= 0) return s
          return { ...s, campos: swapAt(s.campos, idx - 1, idx) }
        }),
      }
    }

    case 'MOVE_FIELD_DOWN': {
      const { sectionId, fieldId } = action.payload
      return {
        ...state,
        secciones: updateSection(state.secciones, sectionId, (s) => {
          const idx = s.campos.findIndex((f) => f.id === fieldId)
          if (idx === -1 || idx >= s.campos.length - 1) return s
          return { ...s, campos: swapAt(s.campos, idx, idx + 1) }
        }),
      }
    }

    // ── Row layout actions ────────────────────────────────────────────────────

    case 'ADD_ROW':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.sectionId, (s) => ({
          ...s,
          layout: [...(s.layout ?? normalizeLayout(s)), { id: uuid(), campos: [] }],
        })),
      }

    case 'REMOVE_ROW':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.sectionId, (s) => {
          const current = s.layout ?? normalizeLayout(s)
          const row = current.find((r) => r.id === action.payload.rowId)
          if (!row) return s

          // Re-insert each evicted field as its own solo row after the removed row's position
          const rowIdx = current.findIndex((r) => r.id === action.payload.rowId)
          const soloRows = row.campos.map((fid) => ({ id: uuid(), campos: [fid] }))
          const next = current.filter((r) => r.id !== action.payload.rowId)
          next.splice(rowIdx, 0, ...soloRows)
          return { ...s, layout: next }
        }),
      }

    case 'ADD_FIELD_TO_ROW':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.sectionId, (s) => ({
          ...s,
          layout: moveFieldToRow(
            s.layout ?? normalizeLayout(s),
            action.payload.fieldId,
            action.payload.rowId,
          ),
        })),
      }

    case 'REMOVE_FIELD_FROM_ROW':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.sectionId, (s) => ({
          ...s,
          layout: extractToSoloRow(s.layout ?? normalizeLayout(s), action.payload.fieldId),
        })),
      }

    case 'MOVE_ROW_UP':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.sectionId, (s) => {
          const current = s.layout ?? normalizeLayout(s)
          const idx = current.findIndex((r) => r.id === action.payload.rowId)
          if (idx <= 0) return s
          return { ...s, layout: swapRows(current, idx - 1, idx) }
        }),
      }

    case 'MOVE_ROW_DOWN':
      return {
        ...state,
        secciones: updateSection(state.secciones, action.payload.sectionId, (s) => {
          const current = s.layout ?? normalizeLayout(s)
          const idx = current.findIndex((r) => r.id === action.payload.rowId)
          if (idx === -1 || idx >= current.length - 1) return s
          return { ...s, layout: swapRows(current, idx, idx + 1) }
        }),
      }

    case 'UPDATE_PDF_CONFIG':
      return { ...state, pdfConfig: { ...state.pdfConfig, ...action.payload } }

    default:
      return state
  }
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseTemplateEditorReturn {
  template: Template
  dispatch: React.Dispatch<EditorAction>
  loading: boolean
  error: string | null
  save: () => Promise<void>
}

export function useTemplateEditor(id?: string): UseTemplateEditorReturn {
  const [template, dispatch] = useReducer(reducer, undefined, defaultTemplate)
  const [loading, setLoading] = useState(!!id)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    getTemplate(id)
      .then((stored) => {
        if (stored) dispatch({ type: 'LOAD_TEMPLATE', payload: stored })
        else setError('Plantilla no encontrada')
      })
      .catch(() => setError('Error al cargar la plantilla'))
      .finally(() => setLoading(false))
  }, [id])

  const save = useCallback(async () => {
    const now = new Date().toISOString()
    const stored: StoredTemplate = {
      ...template,
      fechaCreacion: now,
      fechaModificacion: now,
    }
    if (id) {
      const existing = await getTemplate(id)
      if (existing) stored.fechaCreacion = existing.fechaCreacion
    }
    await saveTemplate(stored)
  }, [template, id])

  return { template, dispatch, loading, error, save }
}
