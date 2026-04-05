import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Pencil, Download, Loader2, AlertCircle, Eye } from 'lucide-react'
import { getTemplate, type StoredTemplate } from '@/utils/db'
import { FormPreview } from '@/components/preview/FormPreview'
import { useExportTemplate } from '@/hooks/useExportTemplate'
import { ExportValidationModal } from '@/components/common/ExportValidationModal'

export default function PreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const [template, setTemplate] = useState<StoredTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { loading: exportLoading, validar, exportar } = useExportTemplate()
  const [showValidationModal, setShowValidationModal] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  useEffect(() => {
    if (!id) {
      setError('ID de plantilla no especificado')
      setLoading(false)
      return
    }
    getTemplate(id)
      .then((t) => {
        if (t) setTemplate(t)
        else setError('Plantilla no encontrada')
      })
      .catch(() => setError('Error al cargar la plantilla'))
      .finally(() => setLoading(false))
  }, [id])

  function handleExportClick() {
    if (!template) return
    const result = validar(template)
    if (!result.valid) {
      setValidationErrors(result.errors)
      setShowValidationModal(true)
    } else {
      exportar(template)
    }
  }

  function handleConfirmExport() {
    if (template) exportar(template)
    setShowValidationModal(false)
    setValidationErrors([])
  }

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  // ── Error ─────────────────────────────────────────────────────────────────

  if (error || !template) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-gray-700">{error ?? 'Error desconocido'}</p>
        <button
          onClick={() => navigate('/')}
          className="text-sm text-blue-600 hover:underline"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  const totalFields = template.secciones.reduce(
    (acc, s) => acc + s.campos.length,
    0,
  )

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Volver al inicio"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-gray-900">
              {template.nombre}
            </h1>
            {template.descripcion && (
              <p className="truncate text-xs text-gray-400">{template.descripcion}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/editor/${template.id}`)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Volver al Editor</span>
              <span className="sm:hidden">Editar</span>
            </button>

            <button
              onClick={handleExportClick}
              disabled={exportLoading}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {exportLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">Exportar Plantilla</span>
              <span className="sm:hidden">JSON</span>
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-3xl px-4 py-8">

        {/* Preview badge */}
        <div className="mb-5 flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <Eye className="h-3.5 w-3.5" />
            Vista previa — solo lectura
          </span>
          <span className="text-xs text-gray-400">
            {template.secciones.length}{' '}
            {template.secciones.length === 1 ? 'sección' : 'secciones'} ·{' '}
            {totalFields}{' '}
            {totalFields === 1 ? 'campo' : 'campos'}
          </span>
        </div>

        {/* Form preview */}
        <FormPreview template={template} />

        {/* Meta footer */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-5 py-4 text-xs text-gray-400">
          <div className="flex flex-wrap items-center gap-4">
            <span>
              <span className="font-medium text-gray-600">ID:</span>{' '}
              <code className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-500">
                {template.id}
              </code>
            </span>
            <span>
              <span className="font-medium text-gray-600">Versión:</span>{' '}
              {template.version}
            </span>
            <span>
              <span className="font-medium text-gray-600">Schema:</span>{' '}
              v{template.schemaVersion}
            </span>
          </div>
          <span>
            Modificado:{' '}
            {new Date(template.fechaModificacion).toLocaleDateString('es-ES', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      </main>

      {/* Export validation modal */}
      {showValidationModal && (
        <ExportValidationModal
          errors={validationErrors}
          onConfirm={handleConfirmExport}
          onCancel={() => {
            setShowValidationModal(false)
            setValidationErrors([])
          }}
        />
      )}
    </div>
  )
}
