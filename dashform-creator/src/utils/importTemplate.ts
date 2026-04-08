import { v4 as uuid } from 'uuid'
import { saveTemplate, type StoredTemplate } from '@/utils/db'

// ── Result type ───────────────────────────────────────────────────────────────

export type ImportResult =
  | { success: true; template: StoredTemplate }
  | { success: false; errors: string[] }

// ── Validation helpers ────────────────────────────────────────────────────────

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

function validatePayload(raw: unknown): string[] {
  if (!isObject(raw)) return ['El archivo no contiene un objeto JSON válido.']

  const errors: string[] = []

  // type check
  const type = raw['type']
  if (type === 'dashform-editable') {
    return [
      'Este archivo es un formulario llenado, no una plantilla. ' +
      'Impórtalo en DashForm Filler.',
    ]
  }
  if (type !== 'dashform-template') {
    errors.push(
      `El tipo de archivo no es válido. Se esperaba "dashform-template"` +
      (type ? `, se recibió "${type}".` : ' (campo "type" ausente).'),
    )
    return errors
  }

  // template object
  const tpl = raw['template']
  if (!isObject(tpl)) {
    errors.push('El archivo no contiene un objeto "plantilla" (template) válido.')
    return errors
  }

  if (!tpl['nombre'] || typeof tpl['nombre'] !== 'string' || !(tpl['nombre'] as string).trim()) {
    errors.push('La plantilla debe tener un nombre (template.nombre).')
  }

  if (!Array.isArray(tpl['secciones'])) {
    errors.push('El campo "secciones" debe ser un array.')
    return errors
  }

  const secciones = tpl['secciones'] as unknown[]
  secciones.forEach((sec, si) => {
    if (!isObject(sec)) {
      errors.push(`La sección #${si + 1} no es un objeto válido.`)
      return
    }
    if (!sec['id'] || typeof sec['id'] !== 'string') {
      errors.push(`La sección #${si + 1} no tiene un "id" válido.`)
    }
    if (!Array.isArray(sec['campos'])) {
      errors.push(`La sección "${sec['nombre'] ?? `#${si + 1}`}" no tiene un array de campos.`)
      return
    }
    const campos = sec['campos'] as unknown[]
    campos.forEach((field, fi) => {
      if (!isObject(field)) {
        errors.push(`El campo #${fi + 1} de la sección "${sec['nombre'] ?? `#${si + 1}`}" no es un objeto válido.`)
        return
      }
      if (!field['id'] || typeof field['id'] !== 'string') {
        errors.push(`El campo #${fi + 1} de la sección "${sec['nombre'] ?? `#${si + 1}`}" no tiene un "id" válido.`)
      }
      if (!field['label'] || typeof field['label'] !== 'string') {
        errors.push(`El campo #${fi + 1} de la sección "${sec['nombre'] ?? `#${si + 1}`}" no tiene una etiqueta (label) válida.`)
      }
    })
  })

  return errors
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function importTemplate(file: File): Promise<ImportResult> {
  // 1. Read
  let text: string
  try {
    text = await file.text()
  } catch {
    return { success: false, errors: ['No se pudo leer el archivo.'] }
  }

  // 2. Parse JSON
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { success: false, errors: ['El archivo no es un JSON válido. Comprueba que no esté corrupto.'] }
  }

  // 3. Validate
  const errors = validatePayload(raw)
  if (errors.length > 0) return { success: false, errors }

  // 4. Build StoredTemplate with new id and fresh dates
  const payload = raw as { template: Record<string, unknown> }
  const now = new Date().toISOString()
  const stored: StoredTemplate = {
    ...(payload.template as object),
    id: uuid(),
    fechaCreacion: now,
    fechaModificacion: now,
  } as StoredTemplate

  // 5. Save
  await saveTemplate(stored)

  return { success: true, template: stored }
}
