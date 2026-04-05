import { describe, it, expect } from 'vitest'
import { validateField, validateAllFields } from '@/hooks/useValidation'
import type { Field, Template } from '@/types/template'

// ── Helper ────────────────────────────────────────────────────────────────────

function makeField(overrides: Partial<Field> = {}): Field {
  return {
    id: 'f1',
    tipo: 'texto',
    label: 'Campo',
    obligatorio: false,
    ...overrides,
  }
}

// ── Campo obligatorio vacío ───────────────────────────────────────────────────

describe('validateField – campo obligatorio', () => {
  it('devuelve error para texto vacío en campo requerido', () => {
    const field = makeField({ obligatorio: true })
    expect(validateField(field, '')).toBe('Este campo es obligatorio.')
  })

  it('devuelve error para null en campo requerido', () => {
    const field = makeField({ obligatorio: true })
    expect(validateField(field, null)).toBe('Este campo es obligatorio.')
  })

  it('devuelve error para undefined en campo requerido', () => {
    const field = makeField({ obligatorio: true })
    expect(validateField(field, undefined)).toBe('Este campo es obligatorio.')
  })

  it('devuelve mensaje específico para checkbox obligatorio', () => {
    const field = makeField({ tipo: 'checkbox', obligatorio: true })
    expect(validateField(field, false)).toBe('Debes marcar esta casilla.')
  })

  it('devuelve mensaje específico para radio obligatorio', () => {
    const field = makeField({ tipo: 'radio', obligatorio: true })
    expect(validateField(field, '')).toBe('Selecciona una opción.')
  })

  it('devuelve null cuando el campo obligatorio tiene valor', () => {
    const field = makeField({ obligatorio: true })
    expect(validateField(field, 'valor')).toBeNull()
  })

  it('devuelve null cuando el campo no es obligatorio y está vacío', () => {
    const field = makeField({ obligatorio: false })
    expect(validateField(field, '')).toBeNull()
  })
})

// ── Email inválido ────────────────────────────────────────────────────────────

describe('validateField – email', () => {
  it('devuelve error para email sin arroba', () => {
    const field = makeField({ tipo: 'email' })
    expect(validateField(field, 'noesunmail')).toBeTruthy()
  })

  it('devuelve error para email sin dominio', () => {
    const field = makeField({ tipo: 'email' })
    expect(validateField(field, 'test@')).toBeTruthy()
  })

  it('devuelve null para email válido simple', () => {
    const field = makeField({ tipo: 'email' })
    expect(validateField(field, 'usuario@dominio.com')).toBeNull()
  })

  it('devuelve null para email válido con subdominio', () => {
    const field = makeField({ tipo: 'email' })
    expect(validateField(field, 'u@sub.dominio.es')).toBeNull()
  })
})

// ── Teléfono inválido ─────────────────────────────────────────────────────────

describe('validateField – teléfono', () => {
  it('devuelve error para cadena de solo letras', () => {
    const field = makeField({ tipo: 'telefono' })
    expect(validateField(field, 'abc')).toBeTruthy()
  })

  it('devuelve error para cadena demasiado corta', () => {
    const field = makeField({ tipo: 'telefono' })
    expect(validateField(field, '123')).toBeTruthy()
  })

  it('devuelve null para número español con prefijo internacional', () => {
    const field = makeField({ tipo: 'telefono' })
    expect(validateField(field, '+34 612 345 678')).toBeNull()
  })

  it('devuelve null para número de dígitos sin espacios', () => {
    const field = makeField({ tipo: 'telefono' })
    expect(validateField(field, '612345678')).toBeNull()
  })
})

// ── minLength / maxLength ─────────────────────────────────────────────────────

describe('validateField – minLength', () => {
  it('devuelve error cuando el valor es más corto que minLength', () => {
    const field = makeField({ validacion: { minLength: 5 } })
    const msg = validateField(field, 'abc')
    expect(msg).toBeTruthy()
    expect(msg).toContain('5')
  })

  it('devuelve null exactamente en el límite de minLength', () => {
    const field = makeField({ validacion: { minLength: 3 } })
    expect(validateField(field, 'abc')).toBeNull()
  })

  it('usa mensajeError personalizado si está definido', () => {
    const field = makeField({ validacion: { minLength: 10, mensajeError: 'Demasiado corto.' } })
    expect(validateField(field, 'corto')).toBe('Demasiado corto.')
  })
})

describe('validateField – maxLength', () => {
  it('devuelve error cuando el valor supera maxLength', () => {
    const field = makeField({ validacion: { maxLength: 3 } })
    const msg = validateField(field, 'demasiado')
    expect(msg).toBeTruthy()
    expect(msg).toContain('3')
  })

  it('devuelve null exactamente en el límite de maxLength', () => {
    const field = makeField({ validacion: { maxLength: 3 } })
    expect(validateField(field, 'abc')).toBeNull()
  })

  it('usa mensajeError personalizado si está definido', () => {
    const field = makeField({ validacion: { maxLength: 2, mensajeError: 'Demasiado largo.' } })
    expect(validateField(field, 'muylargo')).toBe('Demasiado largo.')
  })
})

// ── Regex (pattern) ───────────────────────────────────────────────────────────

describe('validateField – regex', () => {
  it('devuelve error cuando el valor no cumple el patrón', () => {
    const field = makeField({ validacion: { pattern: '^[0-9]+$' } })
    expect(validateField(field, 'abc123')).toBeTruthy()
  })

  it('devuelve null cuando el valor cumple el patrón', () => {
    const field = makeField({ validacion: { pattern: '^[0-9]+$' } })
    expect(validateField(field, '12345')).toBeNull()
  })

  it('usa mensajeError personalizado cuando el patrón falla', () => {
    const field = makeField({ validacion: { pattern: '^[A-Z]+$', mensajeError: 'Solo mayúsculas.' } })
    expect(validateField(field, 'minúsculas')).toBe('Solo mayúsculas.')
  })

  it('no devuelve error para un regex inválido (se ignora silenciosamente)', () => {
    const field = makeField({ validacion: { pattern: '[invalido' } })
    expect(validateField(field, 'cualquiercosa')).toBeNull()
  })
})

// ── validateAllFields ─────────────────────────────────────────────────────────

describe('validateAllFields', () => {
  const template: Template = {
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

  it('devuelve errores para los campos que fallan', () => {
    const errors = validateAllFields(template, {})
    expect(errors['nombre']).toBeTruthy()
    expect(errors['email']).toBeUndefined()
  })

  it('devuelve mapa vacío cuando todos los campos son válidos', () => {
    const errors = validateAllFields(template, { nombre: 'Ana', email: 'ana@test.com' })
    expect(Object.keys(errors)).toHaveLength(0)
  })

  it('incluye error de email si el valor es inválido', () => {
    const errors = validateAllFields(template, { nombre: 'Ana', email: 'no-email' })
    expect(errors['email']).toBeTruthy()
  })
})
