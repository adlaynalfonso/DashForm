import type { Field, Template } from '@/types/template'

// ── Core validators ───────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PHONE_RE = /^[+\d][\d\s\-().]{5,}$/

function isEmpty(value: unknown): boolean {
  return value === null || value === undefined || value === '' || value === false
}

/**
 * Validates a single field against its value.
 * Returns an error message string, or null if valid.
 */
export function validateField(field: Field, value: unknown): string | null {
  // ── Encabezado is purely visual — never validate ──────────────────────────
  if (field.tipo === 'encabezado') return null

  // ── texto-checkbox: special required logic ────────────────────────────────
  if (field.tipo === 'texto-checkbox') {
    if (!field.obligatorio) return null
    const v = value as { checked?: boolean; texto?: string } | undefined | null
    if (!v || !v.checked) return 'Debes marcar la casilla.'
    if (!v.texto || v.texto.trim() === '') return 'Este campo es obligatorio.'
    return null
  }

  // ── Required ─────────────────────────────────────────────────────────────
  if (field.obligatorio && isEmpty(value)) {
    if (field.tipo === 'checkbox') return 'Debes marcar esta casilla.'
    if (field.tipo === 'radio') return 'Selecciona una opción.'
    if (field.tipo === 'select') return 'Selecciona una opción de la lista.'
    if (field.tipo === 'firma-digital' || field.tipo === 'firma-texto') return 'La firma es obligatoria.'
    return 'Este campo es obligatorio.'
  }

  // ── Skip further checks when empty and not required ───────────────────────
  if (isEmpty(value)) return null

  // ── numero: min/max validation ────────────────────────────────────────────
  if (field.tipo === 'numero') {
    const num = typeof value === 'number' ? value : parseFloat(String(value))
    if (!isNaN(num)) {
      if (field.min !== undefined && num < field.min) {
        return `El valor mínimo es ${field.min}.`
      }
      if (field.max !== undefined && num > field.max) {
        return `El valor máximo es ${field.max}.`
      }
    }
    return null
  }

  const str = typeof value === 'string' ? value : String(value)

  // ── Type-specific ─────────────────────────────────────────────────────────
  if (field.tipo === 'email' && !EMAIL_RE.test(str)) {
    return 'Introduce un correo electrónico válido (ej. nombre@dominio.com).'
  }

  if (field.tipo === 'telefono' && !PHONE_RE.test(str)) {
    return 'Introduce un número de teléfono válido. Solo se permiten dígitos, espacios, +, - y paréntesis.'
  }

  // ── Custom validation rules ───────────────────────────────────────────────
  const v = field.validacion
  if (v) {
    if (v.minLength !== undefined && str.length < v.minLength) {
      return v.mensajeError ?? `Mínimo ${v.minLength} ${v.minLength === 1 ? 'carácter' : 'caracteres'}.`
    }
    if (v.maxLength !== undefined && str.length > v.maxLength) {
      return v.mensajeError ?? `Máximo ${v.maxLength} ${v.maxLength === 1 ? 'carácter' : 'caracteres'}.`
    }
    if (v.pattern) {
      try {
        if (!new RegExp(v.pattern).test(str)) {
          return v.mensajeError ?? 'El valor no cumple el formato requerido.'
        }
      } catch {
        // invalid regex in template — skip silently
      }
    }
  }

  return null
}

/**
 * Validates every field in a template against the current datos.
 * Returns a map of fieldId → errorMessage for every field that fails.
 * Fields that pass have no entry in the map.
 */
export function validateAllFields(
  template: Template,
  datos: Record<string, unknown>,
): Record<string, string> {
  const errors: Record<string, string> = {}
  for (const section of template.secciones) {
    for (const field of section.campos) {
      const msg = validateField(field, datos[field.id])
      if (msg !== null) errors[field.id] = msg
    }
  }
  return errors
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/** Returns stable references to the pure validation functions. */
export function useValidation() {
  return { validateField, validateAllFields }
}
