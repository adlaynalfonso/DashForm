import { describe, it, expect } from 'vitest'
import { reducer } from '@/hooks/useFormFiller'
import type { FillerState, FillerAction } from '@/hooks/useFormFiller'
import type { Template, Field } from '@/types/template'
import type { FilledForm } from '@/types/filledForm'

// ── Fixtures ──────────────────────────────────────────────────────────────────

function makeTemplate(): Template {
  return {
    id: 'tpl-1',
    nombre: 'Test',
    descripcion: '',
    version: '1.0.0',
    schemaVersion: 1,
    pdfConfig: { template: 'modern', colorTema: '#3b82f6' },
    secciones: [
      {
        id: 'sec-1',
        nombre: 'Sección',
        campos: [
          { id: 'nombre', tipo: 'texto', label: 'Nombre', obligatorio: true },
          { id: 'email', tipo: 'email', label: 'Email', obligatorio: false },
        ],
      },
    ],
  }
}

const BASE_STATE: FillerState = {
  formId: 'form-1',
  fechaCreacion: '2026-04-04T00:00:00.000Z',
  plantilla: makeTemplate(),
  datos: {},
  erroresValidacion: {},
  seccionActual: 0,
  loading: false,
  saving: false,
  error: null,
}

// ── SET_FIELD_VALUE ───────────────────────────────────────────────────────────

describe('reducer – SET_FIELD_VALUE', () => {
  it('añade el valor al mapa de datos', () => {
    const action: FillerAction = { type: 'SET_FIELD_VALUE', fieldId: 'nombre', value: 'Juan' }
    const next = reducer(BASE_STATE, action)
    expect(next.datos['nombre']).toBe('Juan')
  })

  it('actualiza un valor existente sin afectar otros campos', () => {
    const state: FillerState = { ...BASE_STATE, datos: { nombre: 'Antiguo', email: 'a@b.com' } }
    const action: FillerAction = { type: 'SET_FIELD_VALUE', fieldId: 'nombre', value: 'Nuevo' }
    const next = reducer(state, action)
    expect(next.datos['nombre']).toBe('Nuevo')
    expect(next.datos['email']).toBe('a@b.com')
  })

  it('elimina el error de validación del campo modificado', () => {
    const state: FillerState = {
      ...BASE_STATE,
      erroresValidacion: { nombre: 'Este campo es obligatorio.', email: 'Error email' },
    }
    const action: FillerAction = { type: 'SET_FIELD_VALUE', fieldId: 'nombre', value: 'Juan' }
    const next = reducer(state, action)
    expect(next.erroresValidacion['nombre']).toBeUndefined()
    expect(next.erroresValidacion['email']).toBe('Error email')
  })

  it('no modifica otros campos del estado', () => {
    const action: FillerAction = { type: 'SET_FIELD_VALUE', fieldId: 'nombre', value: 'x' }
    const next = reducer(BASE_STATE, action)
    expect(next.seccionActual).toBe(BASE_STATE.seccionActual)
    expect(next.loading).toBe(BASE_STATE.loading)
    expect(next.saving).toBe(BASE_STATE.saving)
  })

  it('acepta valor tipo array para campo tabla y lo almacena tal cual', () => {
    const tablaValue = [
      { cont: true, medication: 'Aspirin 100mg', comments: '' },
      { cont: false, medication: 'Ibuprofeno 400mg', comments: 'Con alimentos' },
    ]
    const action: FillerAction = { type: 'SET_FIELD_VALUE', fieldId: 'tabla1', value: tablaValue }
    const next = reducer(BASE_STATE, action)
    expect(next.datos['tabla1']).toEqual(tablaValue)
    expect(Array.isArray(next.datos['tabla1'])).toBe(true)
  })
})

// ── VALIDATE_FIELD ────────────────────────────────────────────────────────────

describe('reducer – VALIDATE_FIELD', () => {
  const requiredField = makeTemplate().secciones[0].campos[0] as Field

  it('registra un error cuando un campo obligatorio está vacío', () => {
    const action: FillerAction = { type: 'VALIDATE_FIELD', field: requiredField }
    const next = reducer(BASE_STATE, action)
    expect(next.erroresValidacion['nombre']).toBeTruthy()
  })

  it('limpia el error cuando el campo tiene un valor válido', () => {
    const state: FillerState = {
      ...BASE_STATE,
      datos: { nombre: 'María' },
      erroresValidacion: { nombre: 'Error previo' },
    }
    const action: FillerAction = { type: 'VALIDATE_FIELD', field: requiredField }
    const next = reducer(state, action)
    expect(next.erroresValidacion['nombre']).toBeUndefined()
  })

  it('no afecta los errores de otros campos', () => {
    const state: FillerState = {
      ...BASE_STATE,
      erroresValidacion: { email: 'Email inválido' },
    }
    const action: FillerAction = { type: 'VALIDATE_FIELD', field: requiredField }
    const next = reducer(state, action)
    expect(next.erroresValidacion['email']).toBe('Email inválido')
  })
})

// ── LOAD_DATA ─────────────────────────────────────────────────────────────────

describe('reducer – LOAD_DATA', () => {
  const loadedForm: FilledForm = {
    id: 'form-loaded',
    templateId: 'tpl-1',
    templateVersion: '1.0.0',
    schemaVersion: 1,
    plantilla: makeTemplate(),
    datos: { nombre: 'Ana García', email: 'ana@ejemplo.com' },
    estado: 'borrador',
    fechaCreacion: '2026-04-04T00:00:00.000Z',
    fechaModificacion: '2026-04-04T00:00:00.000Z',
  }

  it('carga el formId y los datos del formulario', () => {
    const action: FillerAction = { type: 'LOAD_DATA', form: loadedForm }
    const next = reducer(BASE_STATE, action)
    expect(next.formId).toBe('form-loaded')
    expect(next.datos['nombre']).toBe('Ana García')
    expect(next.datos['email']).toBe('ana@ejemplo.com')
  })

  it('reinicia erroresValidacion a vacío', () => {
    const state: FillerState = { ...BASE_STATE, erroresValidacion: { nombre: 'Error' } }
    const action: FillerAction = { type: 'LOAD_DATA', form: loadedForm }
    const next = reducer(state, action)
    expect(next.erroresValidacion).toEqual({})
  })

  it('pone loading en false y seccionActual en 0', () => {
    const state: FillerState = { ...BASE_STATE, loading: true, seccionActual: 2 }
    const action: FillerAction = { type: 'LOAD_DATA', form: loadedForm }
    const next = reducer(state, action)
    expect(next.loading).toBe(false)
    expect(next.seccionActual).toBe(0)
  })

  it('limpia error y preserva la plantilla cargada', () => {
    const state: FillerState = { ...BASE_STATE, error: 'Error anterior' }
    const action: FillerAction = { type: 'LOAD_DATA', form: loadedForm }
    const next = reducer(state, action)
    expect(next.error).toBeNull()
    expect(next.plantilla.id).toBe('tpl-1')
  })
})
