import type { Template } from './template'

export interface FilledForm {
  id: string
  templateId: string
  templateVersion: string
  schemaVersion: number
  plantilla: Template
  datos: Record<string, unknown>
  estado: 'borrador' | 'completado'
  fechaCreacion: string
  fechaModificacion: string
}
