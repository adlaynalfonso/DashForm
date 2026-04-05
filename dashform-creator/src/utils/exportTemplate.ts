import { saveAs } from 'file-saver'
import type { Template } from '@/types/template'

// ── Validation ────────────────────────────────────────────────────────────────

export interface ValidationResult {
  valid: boolean
  errors: string[]
}

export function validateTemplateForExport(template: Template): ValidationResult {
  const errors: string[] = []

  if (!template.nombre.trim()) {
    errors.push('La plantilla debe tener un nombre.')
  }

  if (template.secciones.length === 0) {
    errors.push('La plantilla debe tener al menos una sección.')
  }

  template.secciones.forEach((section, si) => {
    if (section.campos.length === 0) {
      errors.push(
        `La sección "${section.nombre || `#${si + 1}`}" no tiene campos.`,
      )
    }

    section.campos.forEach((field, fi) => {
      if (!field.label.trim()) {
        errors.push(
          `El campo #${fi + 1} de la sección "${section.nombre || `#${si + 1}`}" no tiene etiqueta.`,
        )
      }
    })
  })

  return { valid: errors.length === 0, errors }
}

// ── Export ────────────────────────────────────────────────────────────────────

export interface ExportPayload {
  type: 'dashform-template'
  schemaVersion: 1
  exportedAt: string
  template: Template
}

export function exportTemplate(template: Template): void {
  const payload: ExportPayload = {
    type: 'dashform-template',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    template,
  }

  const json = JSON.stringify(payload, null, 2)
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' })
  const safeName = template.nombre.trim().replace(/[^a-z0-9áéíóúñü\s-]/gi, '').replace(/\s+/g, '_') || template.id
  saveAs(blob, `${safeName}_plantilla.json`)
}
