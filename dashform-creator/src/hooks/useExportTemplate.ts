import { useState, useCallback } from 'react'
import {
  exportTemplate,
  validateTemplateForExport,
  type ValidationResult,
} from '@/utils/exportTemplate'
import type { Template } from '@/types/template'

interface UseExportTemplateReturn {
  loading: boolean
  errors: string[]
  validar: (template: Template) => ValidationResult
  exportar: (template: Template) => Promise<void>
  clearErrors: () => void
}

export function useExportTemplate(): UseExportTemplateReturn {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const validar = useCallback((template: Template): ValidationResult => {
    return validateTemplateForExport(template)
  }, [])

  const exportar = useCallback(async (template: Template): Promise<void> => {
    setLoading(true)
    setErrors([])
    try {
      exportTemplate(template)
    } catch {
      setErrors(['Error inesperado al exportar la plantilla.'])
    } finally {
      setLoading(false)
    }
  }, [])

  const clearErrors = useCallback(() => setErrors([]), [])

  return { loading, errors, validar, exportar, clearErrors }
}
