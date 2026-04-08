import { useState, useCallback } from 'react'
import { importTemplate } from '@/utils/importTemplate'

interface UseImportTemplateReturn {
  importFromFile: (file: File) => Promise<{ success: boolean; templateId?: string; errors?: string[] }>
  loading: boolean
  errors: string[]
  clearErrors: () => void
}

export function useImportTemplate(onSuccess?: () => void): UseImportTemplateReturn {
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<string[]>([])

  const importFromFile = useCallback(async (file: File) => {
    setLoading(true)
    setErrors([])
    try {
      const result = await importTemplate(file)
      if (result.success) {
        onSuccess?.()
        return { success: true, templateId: result.template.id }
      }
      setErrors(result.errors)
      return { success: false, errors: result.errors }
    } finally {
      setLoading(false)
    }
  }, [onSuccess])

  const clearErrors = useCallback(() => setErrors([]), [])

  return { importFromFile, loading, errors, clearErrors }
}
