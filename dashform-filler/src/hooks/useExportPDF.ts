import { useState, useCallback } from 'react'
import type { Template } from '@/types/template'
import type { PdfTemplateName } from '@/utils/pdfGenerator'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseExportPDFReturn {
  generar: (
    template: Template,
    datos: Record<string, unknown>,
    pdfTemplate?: PdfTemplateName,
  ) => Promise<void>
  loading: boolean
  error: string | null
  clearError: () => void
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useExportPDF(): UseExportPDFReturn {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const generar = useCallback(
    async (
      template: Template,
      datos: Record<string, unknown>,
      pdfTemplate: PdfTemplateName = 'modern',
    ) => {
      setLoading(true)
      setError(null)
      try {
        // Dynamic import keeps @react-pdf/renderer out of the main bundle
        const { generatePDF } = await import('@/utils/pdfGenerator')
        await generatePDF(template, datos, pdfTemplate)
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : 'Error inesperado al generar el PDF. Inténtalo de nuevo.',
        )
      } finally {
        setLoading(false)
      }
    },
    [],
  )

  return { generar, loading, error, clearError }
}
