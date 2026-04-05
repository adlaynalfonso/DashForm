import { saveAs } from 'file-saver'
import type { Template } from '@/types/template'
import type { FilledForm } from '@/types/filledForm'
import { editableSchema } from './schemaValidator'
import { migrateToCurrentVersion, CURRENT_SCHEMA_VERSION } from './schemaMigration'

// ── exportEditable ────────────────────────────────────────────────────────────

/**
 * Serialises a FilledForm into a self-contained `dashform-editable` JSON
 * envelope and triggers a browser download.
 */
export function exportEditable(form: FilledForm): void {
  const envelope = {
    type: 'dashform-editable',
    schemaVersion: CURRENT_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    form: {
      id: form.id,
      templateId: form.templateId,
      templateVersion: form.templateVersion,
      schemaVersion: CURRENT_SCHEMA_VERSION,
      plantilla: form.plantilla,
      datos: form.datos,
      estado: form.estado,
      fechaCreacion: form.fechaCreacion,
      fechaModificacion: new Date().toISOString(),
    },
  }

  const blob = new Blob([JSON.stringify(envelope, null, 2)], {
    type: 'application/json;charset=utf-8',
  })

  // Sanitise template name for use as a filename
  const safeName = form.plantilla.nombre
    .trim()
    .replace(/[^a-zA-Z0-9áéíóúüñÁÉÍÓÚÜÑ\s_-]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 60) || 'formulario'

  saveAs(blob, `${safeName}_editable.json`)
}

// ── importEditable ────────────────────────────────────────────────────────────

export interface EditablePayload {
  plantilla: Template
  datos: Record<string, unknown>
  estado: FilledForm['estado']
}

/**
 * Reads a File, validates it as a `dashform-editable` JSON, applies any
 * required schema migration, and returns the extracted payload.
 *
 * Throws a descriptive Error on any failure so callers can surface the message.
 */
export async function importEditable(file: File): Promise<EditablePayload> {
  // ── Read ───────────────────────────────────────────────────────────────────
  let text: string
  try {
    text = await file.text()
  } catch {
    throw new Error('No se pudo leer el archivo. Comprueba que el archivo no esté dañado.')
  }

  // ── Parse ──────────────────────────────────────────────────────────────────
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    throw new Error(
      'El archivo no es un JSON válido. Comprueba que no esté corrupto o incompleto.',
    )
  }

  // ── Validate with editableSchema ───────────────────────────────────────────
  const parsed = editableSchema.safeParse(raw)
  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => {
      const path = i.path.length > 0 ? `[${i.path.join(' → ')}]: ` : ''
      return `${path}${i.message}`
    })
    throw new Error(`El archivo no es válido:\n${messages.join('\n')}`)
  }

  // ── Migrate if needed ──────────────────────────────────────────────────────
  let validated = parsed.data
  if (validated.schemaVersion !== CURRENT_SCHEMA_VERSION) {
    const migration = migrateToCurrentVersion(validated)
    if (!migration.success || !migration.data) {
      throw new Error(
        migration.errors.length > 0
          ? migration.errors.join('\n')
          : 'No se pudo migrar el archivo a la versión actual.',
      )
    }
    if (migration.warnings.length > 0) {
      console.warn('[DashForm] Advertencias de migración editable:', migration.warnings)
    }
    validated = migration.data
  }

  return {
    plantilla: validated.form.plantilla as unknown as Template,
    datos: validated.form.datos,
    estado: validated.form.estado,
  }
}
