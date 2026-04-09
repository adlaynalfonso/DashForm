import type { Field } from '@/types/template'

// ── Value formatter ───────────────────────────────────────────────────────────

export function formatFieldValue(field: Field, value: unknown): string {
  if (value === null || value === undefined || value === '') return '—'

  switch (field.tipo) {
    case 'checkbox':
      // Visual checkbox rendered separately — return empty
      return ''

    case 'texto-checkbox': {
      // Return only the text portion; checkbox mark rendered separately
      if (typeof value === 'object' && value !== null && 'text' in value) {
        return String((value as { text: unknown }).text) || '—'
      }
      return '—'
    }

    case 'fecha': {
      try {
        return new Date(value as string).toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        })
      } catch {
        return String(value)
      }
    }

    // Signatures are rendered specially — return empty so callers check isBase64Signature
    case 'firma-digital':
    case 'firma-texto':
      return ''

    // Tabla is rendered specially — return empty so callers check isTablaField
    case 'tabla':
      return ''

    // Encabezado has no value
    case 'encabezado':
      return ''

    default:
      return String(value)
  }
}

// ── Type guards ───────────────────────────────────────────────────────────────

/** True when the field holds a canvas-drawn signature (base64 PNG data URL). */
export function isBase64Signature(field: Field, value: unknown): value is string {
  return (
    field.tipo === 'firma-digital' &&
    typeof value === 'string' &&
    value.startsWith('data:image/')
  )
}

/** True when the field is a typed/text signature. */
export function isTextSignature(field: Field): boolean {
  return field.tipo === 'firma-texto'
}

/** True when the field needs full-column width (signatures, long text, tables, encabezados). */
export function needsFullWidth(field: Field): boolean {
  return (
    field.tipo === 'firma-digital' ||
    field.tipo === 'firma-texto' ||
    field.tipo === 'texto-expandible' ||
    field.tipo === 'tabla' ||
    field.tipo === 'encabezado'
  )
}

// ── Date helper ───────────────────────────────────────────────────────────────

export function todayLabel(): string {
  return new Date().toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}
