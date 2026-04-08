import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Plus,
  Upload,
  FileText,
  Pencil,
  Eye,
  Download,
  Trash2,
  Layers,
  AlertTriangle,
  X,
  Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { useTemplateStorage } from '@/hooks/useTemplateStorage'
import { useExportTemplate } from '@/hooks/useExportTemplate'
import { useImportTemplate } from '@/hooks/useImportTemplate'
import { ExportValidationModal } from '@/components/common/ExportValidationModal'
import type { StoredTemplate } from '@/utils/db'
import type { Template } from '@/types/template'

// ── Delete confirmation modal ─────────────────────────────────────────────────

interface DeleteModalProps {
  template: StoredTemplate
  onConfirm: () => void
  onCancel: () => void
}

function DeleteModal({ template, onConfirm, onCancel }: DeleteModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">
              Eliminar plantilla
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              ¿Estás seguro de que deseas eliminar{' '}
              <span className="font-medium text-gray-700">"{template.nombre}"</span>?
              Esta acción no se puede deshacer.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
  template: StoredTemplate
  exportLoading: boolean
  onEdit: () => void
  onPreview: () => void
  onExport: () => void
  onDelete: () => void
}

function TemplateCard({
  template,
  exportLoading,
  onEdit,
  onPreview,
  onExport,
  onDelete,
}: TemplateCardProps) {
  const totalFields = template.secciones.reduce(
    (acc, s) => acc + s.campos.length,
    0,
  )

  const formattedDate = format(
    new Date(template.fechaModificacion),
    "d MMM yyyy, HH:mm",
    { locale: es },
  )

  return (
    <div className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50">
          <FileText className="h-5 w-5 text-blue-600" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-semibold text-gray-900">
            {template.nombre}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
            {template.descripcion || 'Sin descripción'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-4 flex items-center gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" />
          {template.secciones.length}{' '}
          {template.secciones.length === 1 ? 'sección' : 'secciones'}
        </span>
        <span className="flex items-center gap-1">
          <FileText className="h-3.5 w-3.5" />
          {totalFields} {totalFields === 1 ? 'campo' : 'campos'}
        </span>
      </div>

      <p className="mt-1 text-xs text-gray-400">Modificado: {formattedDate}</p>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-gray-100 pt-4">
        <button
          onClick={onEdit}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Pencil className="h-3.5 w-3.5" />
          Editar
        </button>
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          <Eye className="h-3.5 w-3.5" />
          Vista previa
        </button>
        <button
          onClick={onExport}
          disabled={exportLoading}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {exportLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          Exportar
        </button>
        <button
          onClick={onDelete}
          className="ml-auto flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Eliminar
        </button>
      </div>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-100">
        <FileText className="h-10 w-10 text-gray-400" />
      </div>
      <h2 className="mt-5 text-lg font-semibold text-gray-800">
        Aún no tienes plantillas
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500">
        Crea tu primera plantilla para empezar a diseñar formularios y generar
        PDFs personalizados.
      </p>
      <button
        onClick={onCreate}
        className="mt-6 flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        <Plus className="h-4 w-4" />
        Crear primera plantilla
      </button>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const { templates, loading, error, remove, refresh } = useTemplateStorage()
  const { loading: exportLoading, validar, exportar } = useExportTemplate()

  const [toDelete, setToDelete] = useState<StoredTemplate | null>(null)
  const [pendingExport, setPendingExport] = useState<Template | null>(null)
  const [validationErrors, setValidationErrors] = useState<string[]>([])

  const importInputRef = useRef<HTMLInputElement>(null)
  const { importFromFile, loading: importLoading, errors: importErrors, clearErrors } =
    useImportTemplate(refresh)

  function handleExportClick(template: Template) {
    const result = validar(template)
    if (!result.valid) {
      setPendingExport(template)
      setValidationErrors(result.errors)
    } else {
      exportar(template)
    }
  }

  function handleConfirmExport() {
    if (pendingExport) exportar(pendingExport)
    setPendingExport(null)
    setValidationErrors([])
  }

  function handleCancelExport() {
    setPendingExport(null)
    setValidationErrors([])
  }

  async function handleConfirmDelete() {
    if (!toDelete) return
    await remove(toDelete.id)
    setToDelete(null)
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    // Reset input so the same file can be re-imported if needed
    e.target.value = ''
    const result = await importFromFile(file)
    if (result.success && result.templateId) {
      navigate(`/editor/${result.templateId}`)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hidden file input for import */}
      <input
        ref={importInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900">DashForm Creator</h1>
            <p className="text-xs text-gray-500">Diseña plantillas de formulario</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => importInputRef.current?.click()}
              disabled={importLoading}
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {importLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Importar
            </button>
            <button
              onClick={() => navigate('/editor')}
              className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Nueva Plantilla
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-6 py-8">
        {/* Import error banner */}
        {importErrors.length > 0 && (
          <div className="mb-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div className="flex-1">
              {importErrors.length === 1 ? (
                <p>{importErrors[0]}</p>
              ) : (
                <ul className="list-disc pl-4 space-y-0.5">
                  {importErrors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              )}
            </div>
            <button onClick={clearErrors} className="text-red-400 hover:text-red-600" aria-label="Cerrar">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-52 animate-pulse rounded-xl border border-gray-200 bg-white"
              />
            ))}
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            {error}
          </div>
        ) : templates.length === 0 ? (
          <EmptyState onCreate={() => navigate('/editor')} />
        ) : (
          <>
            <p className="mb-5 text-sm text-gray-500">
              {templates.length} {templates.length === 1 ? 'plantilla' : 'plantillas'}
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {templates.map((t) => (
                <TemplateCard
                  key={t.id}
                  template={t}
                  exportLoading={exportLoading && pendingExport?.id === t.id}
                  onEdit={() => navigate(`/editor/${t.id}`)}
                  onPreview={() => navigate(`/preview/${t.id}`)}
                  onExport={() => handleExportClick(t)}
                  onDelete={() => setToDelete(t)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Delete modal */}
      {toDelete && (
        <DeleteModal
          template={toDelete}
          onConfirm={handleConfirmDelete}
          onCancel={() => setToDelete(null)}
        />
      )}

      {/* Export validation modal */}
      {pendingExport && validationErrors.length > 0 && (
        <ExportValidationModal
          errors={validationErrors}
          onConfirm={handleConfirmExport}
          onCancel={handleCancelExport}
        />
      )}
    </div>
  )
}
