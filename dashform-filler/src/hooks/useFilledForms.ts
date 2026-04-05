import { useState, useEffect, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import {
  getAllFilledForms,
  saveFilledForm,
  deleteFilledForm,
  type LibraryTemplate,
} from '@/utils/db'
import type { FilledForm } from '@/types/filledForm'
import type { Template } from '@/types/template'
import { validateImportedFile, type ValidatedEditable } from '@/utils/schemaValidator'
import { migrateToCurrentVersion } from '@/utils/schemaMigration'

// ── Progress helper ───────────────────────────────────────────────────────────

export function calcProgress(form: FilledForm): number {
  const total = form.plantilla.secciones.flatMap((s) => s.campos).length
  if (total === 0) return 100
  const filled = Object.values(form.datos).filter(
    (v) => v !== null && v !== undefined && v !== '',
  ).length
  return Math.min(100, Math.round((filled / total) * 100))
}

// ── Hook ──────────────────────────────────────────────────────────────────────

interface UseFilledFormsReturn {
  drafts: FilledForm[]
  completed: FilledForm[]
  loading: boolean
  createForm: (template: LibraryTemplate) => Promise<string>
  importEditable: (file: File) => Promise<{ success: boolean; errors?: string[]; formId?: string }>
  deleteForm: (id: string) => Promise<void>
  refresh: () => Promise<void>
}

export function useFilledForms(): UseFilledFormsReturn {
  const [drafts, setDrafts] = useState<FilledForm[]>([])
  const [completed, setCompleted] = useState<FilledForm[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const all = await getAllFilledForms()
    const sorted = all.sort((a, b) => b.fechaModificacion.localeCompare(a.fechaModificacion))
    setDrafts(sorted.filter((f) => f.estado === 'borrador'))
    setCompleted(sorted.filter((f) => f.estado === 'completado'))
  }, [])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const createForm = useCallback(
    async (template: LibraryTemplate): Promise<string> => {
      const now = new Date().toISOString()
      const form: FilledForm = {
        id: uuid(),
        templateId: template.id,
        templateVersion: template.version,
        schemaVersion: 1,
        plantilla: template as Template,
        datos: {},
        estado: 'borrador',
        fechaCreacion: now,
        fechaModificacion: now,
      }
      await saveFilledForm(form)
      await refresh()
      return form.id
    },
    [refresh],
  )

  const importEditable = useCallback(
    async (file: File): Promise<{ success: boolean; errors?: string[]; formId?: string }> => {
      try {
        const text = await file.text()
        const result = validateImportedFile(text)

        if (!result.valid) {
          return { success: false, errors: result.errors }
        }

        if (result.type !== 'editable') {
          return {
            success: false,
            errors: ['El archivo es una plantilla, no un formulario editable. Usa "Importar Plantilla" en su lugar.'],
          }
        }

        const fileVersion = result.data.schemaVersion
        const migration = migrateToCurrentVersion(result.data)
        if (!migration.success || !migration.data) {
          return { success: false, errors: migration.errors }
        }
        if (migration.warnings.length > 0) {
          console.warn('[DashForm] Advertencias de migración:', migration.warnings)
        }
        const migratedEditable = (fileVersion === 1 ? result.data : migration.data) as ValidatedEditable
        const form = migratedEditable.form as unknown as FilledForm
        await saveFilledForm({ ...form, fechaModificacion: new Date().toISOString() })
        await refresh()
        return { success: true, formId: form.id }
      } catch {
        return { success: false, errors: ['Error inesperado al importar el formulario.'] }
      }
    },
    [refresh],
  )

  const deleteForm = useCallback(
    async (id: string) => {
      await deleteFilledForm(id)
      await refresh()
    },
    [refresh],
  )

  return { drafts, completed, loading, createForm, importEditable, deleteForm, refresh }
}
