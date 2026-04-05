import { useState, useCallback } from 'react'
import { v4 as uuid } from 'uuid'
import type { FilledForm } from '@/types/filledForm'
import { exportEditable, importEditable } from '@/utils/exportEditable'
import { saveFilledForm } from '@/utils/db'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseExportEditableReturn {
  exportar: (form: FilledForm) => void
  importar: (file: File) => Promise<string | null>
  loading: boolean
  error: string | null
  clearError: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useExportEditable(): UseExportEditableReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  // ── exportar ───────────────────────────────────────────────────────────────

  const exportar = useCallback((form: FilledForm) => {
    setError(null)
    try {
      exportEditable(form)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado al exportar el formulario.')
    }
  }, [])

  // ── importar ───────────────────────────────────────────────────────────────
  // Returns the new formId on success, or null on failure (error is set).

  const importar = useCallback(async (file: File): Promise<string | null> => {
    setLoading(true)
    setError(null)
    try {
      const { plantilla, datos, estado } = await importEditable(file)

      const now = new Date().toISOString()
      const form: FilledForm = {
        id: uuid(),
        templateId: plantilla.id,
        templateVersion: plantilla.version,
        schemaVersion: 1,
        plantilla,
        datos,
        estado,
        fechaCreacion: now,
        fechaModificacion: now,
      }

      await saveFilledForm(form)
      return form.id
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error inesperado al importar el formulario.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { exportar, importar, loading, error, clearError }
}
