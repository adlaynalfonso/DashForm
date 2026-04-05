import { useState } from 'react'
import { PDFViewer } from '@react-pdf/renderer'
import { FileDown, Loader2, AlertCircle } from 'lucide-react'
import type { FilledForm } from '@/types/filledForm'
import { ModernTemplate } from '@/utils/pdfTemplates/ModernTemplate'
import { CorporateTemplate } from '@/utils/pdfTemplates/CorporateTemplate'
import { CompactTemplate } from '@/utils/pdfTemplates/CompactTemplate'
import {
  PDF_TEMPLATE_LABELS,
  resolvePdfTemplate,
  type PdfTemplateName,
} from '@/utils/pdfGenerator'
import { useExportPDF } from '@/hooks/useExportPDF'

// ── Props ─────────────────────────────────────────────────────────────────────

interface PdfPreviewProps {
  form: FilledForm
}

// ── Helper: pick the Document element for PDFViewer ───────────────────────────

function TemplateDocument({
  form,
  selected,
}: {
  form: FilledForm
  selected: PdfTemplateName
}) {
  const props = { template: form.plantilla, datos: form.datos }
  switch (selected) {
    case 'corporate':
      return <CorporateTemplate {...props} />
    case 'compact':
      return <CompactTemplate {...props} />
    default:
      return <ModernTemplate {...props} />
  }
}

// ── Component ─────────────────────────────────────────────────────────────────

const TEMPLATES = Object.entries(PDF_TEMPLATE_LABELS) as [PdfTemplateName, string][]

export function PdfPreview({ form }: PdfPreviewProps) {
  const [selected, setSelected] = useState<PdfTemplateName>(() =>
    resolvePdfTemplate(form.plantilla.pdfConfig?.template),
  )

  const { generar, loading, error, clearError } = useExportPDF()

  function handleDownload() {
    generar(form.plantilla, form.datos, selected)
  }

  return (
    <div className="flex h-full flex-col gap-3">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Template selector */}
        <div className="flex items-center gap-1 rounded-lg border border-gray-200 bg-white p-1">
          {TEMPLATES.map(([name, label]) => (
            <button
              key={name}
              onClick={() => setSelected(name)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                selected === name
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Download button */}
        <button
          onClick={handleDownload}
          disabled={loading}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <FileDown className="h-4 w-4" />
          )}
          {loading ? 'Generando…' : 'Descargar PDF'}
        </button>
      </div>

      {/* ── Error ───────────────────────────────────────────────────────── */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="flex-1">{error}</p>
          <button onClick={clearError} className="shrink-0 text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* ── PDF viewer ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 shadow-inner">
        <PDFViewer
          key={selected}
          width="100%"
          height="100%"
          showToolbar={false}
        >
          <TemplateDocument form={form} selected={selected} />
        </PDFViewer>
      </div>
    </div>
  )
}
