import { useReducer, useEffect, useCallback, useRef } from 'react'
import { v4 as uuid } from 'uuid'
import type { Template, Field } from '@/types/template'
import type { FilledForm } from '@/types/filledForm'
import { getFilledForm, saveFilledForm, getTemplateFromLibrary } from '@/utils/db'
import { validateField, validateAllFields } from '@/hooks/useValidation'

// ── State ─────────────────────────────────────────────────────────────────────

export interface FillerState {
  formId: string
  fechaCreacion: string
  plantilla: Template
  datos: Record<string, unknown>
  estado: FilledForm['estado']
  erroresValidacion: Record<string, string>
  seccionActual: number
  loading: boolean
  saving: boolean
  error: string | null
}

// ── Actions ───────────────────────────────────────────────────────────────────

export type FillerAction =
  | { type: 'SET_FIELD_VALUE'; fieldId: string; value: unknown }
  | { type: 'SET_SECTION'; index: number }
  | { type: 'VALIDATE_FIELD'; field: Field }
  | { type: 'VALIDATE_ALL' }
  | { type: 'LOAD_DATA'; form: FilledForm }
  | { type: 'SET_LOADING'; loading: boolean }
  | { type: 'SET_SAVING'; saving: boolean }
  | { type: 'SET_ERROR'; error: string | null }
  | { type: 'SET_ESTADO'; estado: FilledForm['estado'] }

// ── Reducer ───────────────────────────────────────────────────────────────────

export function reducer(state: FillerState, action: FillerAction): FillerState {
  switch (action.type) {
    case 'LOAD_DATA':
      return {
        ...state,
        formId: action.form.id,
        fechaCreacion: action.form.fechaCreacion,
        plantilla: action.form.plantilla,
        datos: action.form.datos,
        estado: action.form.estado,
        erroresValidacion: {},
        seccionActual: 0,
        loading: false,
        error: null,
      }

    case 'SET_FIELD_VALUE': {
      const newDatos = { ...state.datos, [action.fieldId]: action.value }
      // Clear validation error for this field on change
      const newErrors = { ...state.erroresValidacion }
      delete newErrors[action.fieldId]
      return { ...state, datos: newDatos, erroresValidacion: newErrors }
    }

    case 'SET_SECTION':
      return { ...state, seccionActual: action.index }

    case 'VALIDATE_FIELD': {
      const msg = validateField(action.field, state.datos[action.field.id])
      if (msg !== null) {
        return {
          ...state,
          erroresValidacion: { ...state.erroresValidacion, [action.field.id]: msg },
        }
      }
      const cleared = { ...state.erroresValidacion }
      delete cleared[action.field.id]
      return { ...state, erroresValidacion: cleared }
    }

    case 'VALIDATE_ALL':
      return {
        ...state,
        erroresValidacion: validateAllFields(state.plantilla, state.datos),
      }

    case 'SET_LOADING':
      return { ...state, loading: action.loading }

    case 'SET_SAVING':
      return { ...state, saving: action.saving }

    case 'SET_ERROR':
      return { ...state, error: action.error, loading: false }

    case 'SET_ESTADO':
      return { ...state, estado: action.estado }

    default:
      return state
  }
}

// ── Default state factory ─────────────────────────────────────────────────────

function makeInitialState(): FillerState {
  return {
    formId: '',
    fechaCreacion: new Date().toISOString(),
    plantilla: {
      id: '',
      nombre: '',
      descripcion: '',
      version: '1.0.0',
      schemaVersion: 1,
      pdfConfig: { template: 'default', colorTema: '#3b82f6' },
      secciones: [],
    },
    datos: {},
    estado: 'borrador',
    erroresValidacion: {},
    seccionActual: 0,
    loading: true,
    saving: false,
    error: null,
  }
}

// ── Derived helpers (exported for use in components) ──────────────────────────

/** Returns true if all obligatory fields in a section are filled. */
export function isSectionComplete(
  section: Template['secciones'][number],
  datos: Record<string, unknown>,
): boolean {
  return section.campos
    .filter((f) => f.obligatorio && f.tipo !== 'encabezado')
    .every((f) => {
      const v = datos[f.id]
      if (f.tipo === 'texto-checkbox') {
        const tc = v as { checked?: boolean; texto?: string } | undefined | null
        return !!tc && !!tc.checked && !!tc.texto && tc.texto.trim() !== ''
      }
      return v !== null && v !== undefined && v !== '' && v !== false
    })
}

/** Returns true if the erroresValidacion map has at least one entry. */
export function hasErrors(erroresValidacion: Record<string, string>): boolean {
  return Object.values(erroresValidacion).some(Boolean)
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export interface UseFormFillerReturn {
  state: FillerState
  dispatch: React.Dispatch<FillerAction>
  save: (estado?: FilledForm['estado']) => Promise<void>
  markComplete: () => Promise<boolean>
}

export function useFormFiller(formId?: string, templateId?: string): UseFormFillerReturn {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)
  const stateRef = useRef(state)
  stateRef.current = state

  // ── Load on mount ──────────────────────────────────────────────────────────
  useEffect(() => {
    async function load() {
      dispatch({ type: 'SET_LOADING', loading: true })
      try {
        if (formId) {
          const existing = await getFilledForm(formId)
          if (existing) {
            dispatch({ type: 'LOAD_DATA', form: existing })
            return
          }
        }

        if (templateId) {
          const tpl = await getTemplateFromLibrary(templateId)
          if (!tpl) {
            dispatch({ type: 'SET_ERROR', error: 'No se encontró la plantilla en la biblioteca.' })
            return
          }
          const now = new Date().toISOString()
          const newForm: FilledForm = {
            id: formId ?? uuid(),
            templateId: tpl.id,
            templateVersion: tpl.version,
            schemaVersion: 1,
            plantilla: tpl,
            datos: {},
            estado: 'borrador',
            fechaCreacion: now,
            fechaModificacion: now,
          }
          await saveFilledForm(newForm)
          dispatch({ type: 'LOAD_DATA', form: newForm })
          return
        }

        dispatch({ type: 'SET_ERROR', error: 'No se especificó un formulario ni una plantilla.' })
      } catch {
        dispatch({ type: 'SET_ERROR', error: 'Error al cargar el formulario.' })
      }
    }

    load()
  }, [formId, templateId])

  // ── Manual save (for explicit "Guardar" button and markComplete) ───────────
  const save = useCallback(async (estado?: FilledForm['estado']) => {
    const { formId: id, fechaCreacion, plantilla, datos } = stateRef.current
    if (!id) return
    dispatch({ type: 'SET_SAVING', saving: true })
    try {
      await saveFilledForm({
        id,
        templateId: plantilla.id,
        templateVersion: plantilla.version,
        schemaVersion: 1,
        plantilla,
        datos,
        estado: estado ?? 'borrador',
        fechaCreacion,
        fechaModificacion: new Date().toISOString(),
      })
    } finally {
      dispatch({ type: 'SET_SAVING', saving: false })
    }
  }, [])

  // ── Mark complete: validate all → save as completado ─────────────────────
  const markComplete = useCallback(async (): Promise<boolean> => {
    dispatch({ type: 'VALIDATE_ALL' })
    const errors = validateAllFields(stateRef.current.plantilla, stateRef.current.datos)
    if (Object.keys(errors).length > 0) return false
    await save('completado')
    dispatch({ type: 'SET_ESTADO', estado: 'completado' })
    return true
  }, [save])

  return { state, dispatch, save, markComplete }
}
