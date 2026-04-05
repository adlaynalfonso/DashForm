import { AlertTriangle, X, Download } from 'lucide-react'

interface ExportValidationModalProps {
  errors: string[]
  onConfirm: () => void
  onCancel: () => void
}

export function ExportValidationModal({
  errors,
  onConfirm,
  onCancel,
}: ExportValidationModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">
        {/* Header */}
        <div className="flex items-start gap-4 p-6 pb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <h3 className="text-base font-semibold text-gray-900">
              La plantilla tiene advertencias
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              Se encontraron los siguientes problemas. Puedes corregirlos o
              exportar igualmente.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Cerrar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error list */}
        <ul className="mx-6 mb-5 space-y-1.5 rounded-lg border border-amber-100 bg-amber-50 px-4 py-3">
          {errors.map((err, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-amber-800">
              <span className="mt-0.5 text-amber-400">•</span>
              {err}
            </li>
          ))}
        </ul>

        {/* Actions */}
        <div className="flex justify-end gap-3 border-t border-gray-100 px-6 py-4">
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Volver y corregir
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download className="h-4 w-4" />
            Exportar igualmente
          </button>
        </div>
      </div>
    </div>
  )
}
