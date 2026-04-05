import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileDown,
  Cloud,
  CloudOff,
  Share2,
} from 'lucide-react'
import { useFormFiller, hasErrors } from '@/hooks/useFormFiller'
import { useAutoSave } from '@/hooks/useAutoSave'
import { useExportEditable } from '@/hooks/useExportEditable'
import { useExportPDF } from '@/hooks/useExportPDF'
import { SectionTabs } from '@/components/filler/SectionTabs'
import { FormRenderer } from '@/components/filler/FormRenderer'
import { ValidationFeedback } from '@/components/filler/ValidationFeedback'
import type { FilledForm } from '@/types/filledForm'

export default function FillPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { state, dispatch, save, markComplete } = useFormFiller(id)
  const {
    formId,
    fechaCreacion,
    plantilla,
    datos,
    erroresValidacion,
    seccionActual,
    loading,
    saving,
    error,
  } = state

  // ── Autosave ───────────────────────────────────────────────────────────────
  // Rebuild the FilledForm object only when datos changes so useAutoSave
  // can detect the reference change and debounce the write.
  const autoSaveForm = useMemo<FilledForm | null>(() => {
    if (!formId) return null
    return {
      id: formId,
      templateId: plantilla.id,
      templateVersion: plantilla.version,
      schemaVersion: 1,
      plantilla,
      datos,
      estado: 'borrador',
      fechaCreacion,
      fechaModificacion: new Date().toISOString(),
    }
  }, [formId, plantilla, datos, fechaCreacion])

  const { status: saveStatus } = useAutoSave(autoSaveForm)
  const { exportar, error: exportError, clearError: clearExportError } = useExportEditable()
  const { generar: generarPDF, loading: pdfLoading } = useExportPDF()

  // ── Derived ────────────────────────────────────────────────────────────────
  const secciones = plantilla.secciones
  const activeSection = secciones[seccionActual]
  const isFirst = seccionActual === 0
  const isLast = seccionActual === secciones.length - 1
  const hasValidationErrors = hasErrors(erroresValidacion)

  // ── Complete handler ───────────────────────────────────────────────────────
  async function handleComplete() {
    const ok = await markComplete()
    if (ok) navigate(`/export/${formId}`)
  }

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="max-w-sm text-sm text-gray-700">{error}</p>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-2xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => {
              save()
              navigate('/')
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-gray-900">
              {plantilla.nombre}
            </h1>
            {plantilla.descripcion && (
              <p className="truncate text-xs text-gray-400">{plantilla.descripcion}</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Autosave status indicator */}
            {saveStatus === 'saving' && (
              <span className="hidden items-center gap-1 text-xs text-gray-400 sm:flex">
                <Loader2 className="h-3 w-3 animate-spin" />
                Guardando…
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="hidden items-center gap-1 text-xs text-green-600 sm:flex">
                <Cloud className="h-3 w-3" />
                Guardado
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="hidden items-center gap-1 text-xs text-red-500 sm:flex">
                <CloudOff className="h-3 w-3" />
                Error al guardar
              </span>
            )}

            <button
              onClick={() => { if (autoSaveForm) exportar(autoSaveForm) }}
              disabled={!autoSaveForm}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Exportar formulario editable (.json)"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Editable</span>
            </button>
            <button
              onClick={() => save()}
              disabled={saving}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
              title="Guardar borrador"
            >
              <Save className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Guardar</span>
            </button>
          </div>
        </div>

        {/* Section tabs — only shown when more than one section */}
        {secciones.length > 1 && (
          <SectionTabs
            secciones={secciones}
            seccionActual={seccionActual}
            datos={datos}
            onSelect={(idx) => dispatch({ type: 'SET_SECTION', index: idx })}
          />
        )}
      </header>

      {/* ── Form content ─────────────────────────────────────────────────── */}
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6 sm:px-6">
        {/* Export error banner */}
        {exportError && (
          <div className="mb-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
            <p className="flex-1">{exportError}</p>
            <button onClick={clearExportError} className="shrink-0 text-red-400 hover:text-red-600">✕</button>
          </div>
        )}

        {/* Validation error summary */}
        {hasValidationErrors && (
          <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <div>
              <p className="font-medium">Hay campos con errores</p>
              <p className="mt-0.5 text-xs text-amber-700">
                Revisa los campos marcados en rojo antes de continuar.
              </p>
            </div>
          </div>
        )}

        {/* Section header — shown when only one section */}
        {secciones.length === 1 && activeSection && (
          <h2 className="mb-5 text-base font-semibold text-gray-900">
            {activeSection.nombre}
          </h2>
        )}

        {activeSection ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
            <FormRenderer
              section={activeSection}
              datos={datos}
              errores={erroresValidacion}
              dispatch={dispatch}
            />
          </div>
        ) : (
          <p className="py-20 text-center text-sm text-gray-400">
            Esta plantilla no tiene secciones.
          </p>
        )}
      </main>

      {/* ── Footer navigation ─────────────────────────────────────────────── */}
      <footer className="sticky bottom-0 border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-3">
          {/* Prev */}
          <button
            onClick={() => dispatch({ type: 'SET_SECTION', index: seccionActual - 1 })}
            disabled={isFirst}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:invisible transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          {/* Progress dots */}
          {secciones.length > 1 && (
            <div className="flex items-center gap-1.5">
              {secciones.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => dispatch({ type: 'SET_SECTION', index: idx })}
                  className={`h-2 w-2 rounded-full transition-all ${
                    idx === seccionActual
                      ? 'w-4 bg-blue-600'
                      : 'bg-gray-300 hover:bg-gray-400'
                  }`}
                  aria-label={`Sección ${idx + 1}`}
                />
              ))}
            </div>
          )}

          {/* Next / Complete */}
          {isLast ? (
            <div className="flex items-center gap-2">
              <ValidationFeedback errores={erroresValidacion} showWhenValid={false} />
              <button
                onClick={handleComplete}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Completar
              </button>
            </div>
          ) : (
            <button
              onClick={() => dispatch({ type: 'SET_SECTION', index: seccionActual + 1 })}
              className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* PDF shortcuts */}
        {formId && (
          <div className="mt-2 flex items-center justify-center gap-4">
            <button
              onClick={() => {
                if (autoSaveForm) {
                  const cfg = autoSaveForm.plantilla.pdfConfig?.template
                  const tpl =
                    cfg === 'corporate' || cfg === 'compact' ? cfg : 'modern'
                  generarPDF(autoSaveForm.plantilla, autoSaveForm.datos, tpl)
                }
              }}
              disabled={!autoSaveForm || pdfLoading}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 disabled:opacity-50 transition-colors"
            >
              {pdfLoading ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <FileDown className="h-3 w-3" />
              )}
              Descargar PDF
            </button>

            <span className="text-gray-200">|</span>
            <button
              onClick={() => navigate(`/export/${formId}`)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FileDown className="h-3 w-3" />
              Vista previa PDF
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}
