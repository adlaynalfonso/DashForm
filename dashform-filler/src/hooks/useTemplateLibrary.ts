import { useState, useEffect, useCallback } from 'react'
import {
  getAllLibraryTemplates,
  saveTemplateToLibrary,
  deleteTemplateFromLibrary,
  type LibraryTemplate,
} from '@/utils/db'
import { validateImportedFile, type ValidatedTemplate } from '@/utils/schemaValidator'
import { migrateToCurrentVersion } from '@/utils/schemaMigration'
import type { Template } from '@/types/template'

interface UseTemplateLibraryReturn {
  templates: LibraryTemplate[]
  loading: boolean
  importFromFile: (file: File) => Promise<{ success: boolean; errors?: string[] }>
  deleteTemplate: (id: string) => Promise<void>
}

export function useTemplateLibrary(): UseTemplateLibraryReturn {
  const [templates, setTemplates] = useState<LibraryTemplate[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const all = await getAllLibraryTemplates()
    setTemplates(all.sort((a, b) => b.fechaImportacion.localeCompare(a.fechaImportacion)))
  }, [])

  useEffect(() => {
    setLoading(true)
    refresh().finally(() => setLoading(false))
  }, [refresh])

  const importFromFile = useCallback(
    async (file: File): Promise<{ success: boolean; errors?: string[] }> => {
      try {
        const text = await file.text()
        const result = validateImportedFile(text)

        if (!result.valid) {
          return { success: false, errors: result.errors }
        }

        if (result.type !== 'template') {
          return {
            success: false,
            errors: ['El archivo es un formulario editable, no una plantilla. Usa "Importar Editable" en su lugar.'],
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
        // After migration, template field is guaranteed present (it's a ValidatedTemplate)
        const migratedTemplate = (fileVersion === 1 ? result.data : migration.data) as ValidatedTemplate
        const lib: LibraryTemplate = {
          ...(migratedTemplate.template as unknown as Template),
          fechaImportacion: new Date().toISOString(),
        }
        await saveTemplateToLibrary(lib)
        await refresh()
        return { success: true }
      } catch {
        return { success: false, errors: ['Error inesperado al importar la plantilla.'] }
      }
    },
    [refresh],
  )

  const deleteTemplate = useCallback(
    async (id: string) => {
      await deleteTemplateFromLibrary(id)
      await refresh()
    },
    [refresh],
  )

  return { templates, loading, importFromFile, deleteTemplate }
}
