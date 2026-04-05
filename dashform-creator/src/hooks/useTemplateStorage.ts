import { useState, useEffect, useCallback } from 'react'
import {
  getAllTemplates,
  deleteTemplate,
  type StoredTemplate,
} from '@/utils/db'

interface UseTemplateStorageReturn {
  templates: StoredTemplate[]
  loading: boolean
  error: string | null
  refresh: () => Promise<void>
  remove: (id: string) => Promise<void>
}

export function useTemplateStorage(): UseTemplateStorageReturn {
  const [templates, setTemplates] = useState<StoredTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await getAllTemplates()
      data.sort(
        (a, b) =>
          new Date(b.fechaModificacion).getTime() -
          new Date(a.fechaModificacion).getTime(),
      )
      setTemplates(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar plantillas')
    } finally {
      setLoading(false)
    }
  }, [])

  const remove = useCallback(
    async (id: string) => {
      await deleteTemplate(id)
      await refresh()
    },
    [refresh],
  )

  useEffect(() => {
    refresh()
  }, [refresh])

  return { templates, loading, error, refresh, remove }
}
