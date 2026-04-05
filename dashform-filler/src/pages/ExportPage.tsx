import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { PDFViewer } from '@react-pdf/renderer'
import {
  ArrowLeft,
  Home,
  Loader2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  FileDown,
  Share2,
  ChevronDown,
  ChevronUp,
  Clock,
  Hash,
  Palette,
} from 'lucide-react'
import { getFilledForm } from '@/utils/db'
import type { FilledForm } from '@/types/filledForm'
import type { Template } from '@/types/template'
import { ModernTemplate } from '@/utils/pdfTemplates/ModernTemplate'
import { CorporateTemplate } from '@/utils/pdfTemplates/CorporateTemplate'
import { CompactTemplate } from '@/utils/pdfTemplates/CompactTemplate'
import { resolvePdfTemplate, type PdfTemplateName } from '@/utils/pdfGenerator'
import { useExportPDF } from '@/hooks/useExportPDF'
import { useExportEditable } from '@/hooks/useExportEditable'

// ── Helpers ───────────────────────────────────────────────────────────────────

function isEmpty(v: unknown): boolean {
  return v === null || v === undefined || v === '' || v === false
}

function getMissingRequired(form: FilledForm): { sectionName: string; label: string }[] {
  return form.plantilla.secciones.flatMap((s) =>
    s.campos
      .filter((f) => f.obligatorio && isEmpty(form.datos[f.id]))
      .map((f) => ({ sectionName: s.nombre, label: f.label })),
  )
}

function countFields(form: FilledForm) {
  const all = form.plantilla.secciones.flatMap((s) => s.campos)
  const filled = all.filter((f) => !isEmpty(form.datos[f.id]))
  return { total: all.length, filled: filled.length }
}

function applyColor(template: Template, color: string): Template {
  const base = template.pdfConfig ?? { template: 'default', colorTema: color }
  return {
    ...template,
    pdfConfig: { ...base, colorTema: color },
  }
}

// ── Template card mini-previews ───────────────────────────────────────────────

function ModernMiniPreview({ color }: { color: string }) {
  return (
    <div className="w-full overflow-hidden rounded border border-gray-200 bg-white" style={{ aspectRatio: '0.707' }}>
      <div className="p-2 h-full flex flex-col gap-1.5">
        {/* title */}
        <div className="h-2 w-3/4 rounded-sm bg-gray-300" />
        {/* rule */}
        <div className="h-0.5 w-full rounded-full" style={{ backgroundColor: color }} />
        {/* section heading */}
        <div className="h-1.5 w-1/2 rounded-sm" style={{ backgroundColor: color, opacity: 0.7 }} />
        {/* fields */}
        {[3, 4, 2.5, 3.5].map((w, i) => (
          <div key={i} className="flex flex-col gap-0.5">
            <div className="h-1 rounded-sm bg-gray-200" style={{ width: `${w * 10}%` }} />
            <div className="h-1.5 rounded-sm bg-gray-400" style={{ width: `${w * 16}%` }} />
          </div>
        ))}
        {/* footer */}
        <div className="mt-auto flex justify-between">
          <div className="h-1 w-10 rounded-sm bg-gray-200" />
          <div className="h-1 w-8 rounded-sm bg-gray-200" />
        </div>
      </div>
    </div>
  )
}

function CorporateMiniPreview({ color }: { color: string }) {
  return (
    <div className="w-full overflow-hidden rounded border border-gray-200 bg-white" style={{ aspectRatio: '0.707' }}>
      {/* header band */}
      <div className="flex items-center justify-center px-2 py-2" style={{ backgroundColor: color }}>
        <div className="h-2 w-2/3 rounded-sm bg-white opacity-90" />
      </div>
      <div className="p-1.5 flex flex-col gap-1">
        {/* section bar */}
        <div className="h-2 w-full rounded-sm" style={{ backgroundColor: color, opacity: 0.85 }} />
        {/* two-column cells */}
        <div className="grid grid-cols-2 gap-1">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="rounded-sm border border-gray-200 p-1 flex flex-col gap-0.5">
              <div className="h-1 w-full rounded-sm bg-gray-200" />
              <div className="h-1.5 w-3/4 rounded-sm bg-gray-400" />
            </div>
          ))}
        </div>
        {/* full-width cell */}
        <div className="rounded-sm border border-gray-200 p-1 flex flex-col gap-0.5">
          <div className="h-1 w-1/3 rounded-sm bg-gray-200" />
          <div className="h-1.5 w-1/2 rounded-sm bg-gray-400" />
        </div>
      </div>
    </div>
  )
}

function CompactMiniPreview() {
  return (
    <div className="w-full overflow-hidden rounded border border-gray-200 bg-white" style={{ aspectRatio: '0.707' }}>
      <div className="p-1.5 h-full flex flex-col gap-1">
        {/* title */}
        <div className="flex items-center gap-1 border-b border-gray-800 pb-1">
          <div className="h-2 w-2/3 rounded-sm bg-gray-700" />
        </div>
        {/* section */}
        <div className="h-1 w-1/2 rounded-sm bg-gray-500 border-b border-gray-400" />
        {/* two-col fields */}
        <div className="grid grid-cols-2 gap-x-1 gap-y-1.5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="flex flex-col gap-0.5">
              <div className="h-0.5 w-3/4 rounded-sm bg-gray-300" />
              <div className="h-1 w-full rounded-sm bg-gray-500" />
            </div>
          ))}
        </div>
        {/* footer */}
        <div className="mt-auto flex justify-between">
          <div className="h-0.5 w-8 rounded-sm bg-gray-300" />
          <div className="h-0.5 w-6 rounded-sm bg-gray-300" />
        </div>
      </div>
    </div>
  )
}

// ── Template selector cards ───────────────────────────────────────────────────

const TEMPLATE_META: {
  name: PdfTemplateName
  label: string
  description: string
  preview: (color: string) => React.ReactNode
}[] = [
  {
    name: 'modern',
    label: 'Moderno',
    description: 'Limpio, con acento de color',
    preview: (c) => <ModernMiniPreview color={c} />,
  },
  {
    name: 'corporate',
    label: 'Corporativo',
    description: 'Banda de cabecera, dos columnas',
    preview: (c) => <CorporateMiniPreview color={c} />,
  },
  {
    name: 'compact',
    label: 'Compacto',
    description: 'Márgenes reducidos, máximo contenido',
    preview: () => <CompactMiniPreview />,
  },
]

// ── PDFViewer inner ───────────────────────────────────────────────────────────

function LivePreview({
  template,
  datos,
  selectedTemplate,
}: {
  template: Template
  datos: Record<string, unknown>
  selectedTemplate: PdfTemplateName
}) {
  const props = { template, datos }
  const doc =
    selectedTemplate === 'corporate' ? (
      <CorporateTemplate {...props} />
    ) : selectedTemplate === 'compact' ? (
      <CompactTemplate {...props} />
    ) : (
      <ModernTemplate {...props} />
    )

  return (
    <PDFViewer key={`${selectedTemplate}-${template.pdfConfig?.colorTema}`} width="100%" height="100%" showToolbar={false}>
      {doc}
    </PDFViewer>
  )
}

// ── ExportPage ────────────────────────────────────────────────────────────────

export default function ExportPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  // ── Form loading ─────────────────────────────────────────────────────────────
  const [form, setForm] = useState<FilledForm | null>(null)
  const [loadingForm, setLoadingForm] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoadError('ID de formulario no especificado.')
      setLoadingForm(false)
      return
    }
    getFilledForm(id)
      .then((f) => {
        if (!f) setLoadError('No se encontró el formulario. Puede que haya sido eliminado.')
        else setForm(f)
      })
      .catch(() => setLoadError('Error al cargar el formulario.'))
      .finally(() => setLoadingForm(false))
  }, [id])

  // ── Export state ─────────────────────────────────────────────────────────────
  const [selectedTemplate, setSelectedTemplate] = useState<PdfTemplateName>('modern')
  const [inputColor, setInputColor] = useState('#3b82f6')
  const [previewColor, setPreviewColor] = useState('#3b82f6')
  const [missingOpen, setMissingOpen] = useState(false)
  const colorTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Initialise from form once loaded
  useEffect(() => {
    if (!form) return
    setSelectedTemplate(resolvePdfTemplate(form.plantilla.pdfConfig?.template))
    const c = form.plantilla.pdfConfig?.colorTema ?? '#3b82f6'
    setInputColor(c)
    setPreviewColor(c)
  }, [form])

  // Cleanup timer
  useEffect(() => () => clearTimeout(colorTimerRef.current), [])

  const handleColorChange = useCallback((c: string) => {
    setInputColor(c)
    clearTimeout(colorTimerRef.current)
    colorTimerRef.current = setTimeout(() => setPreviewColor(c), 400)
  }, [])

  // ── Derived ─────────────────────────────────────────────────────────────────
  const templateForDownload = useMemo(
    () => (form ? applyColor(form.plantilla, inputColor) : null),
    [form, inputColor],
  )
  const templateForPreview = useMemo(
    () => (form ? applyColor(form.plantilla, previewColor) : null),
    [form, previewColor],
  )
  const missingFields = useMemo(() => (form ? getMissingRequired(form) : []), [form])
  const { total: totalFields, filled: filledCount } = useMemo(
    () => (form ? countFields(form) : { total: 0, filled: 0 }),
    [form],
  )

  // ── Export hooks ─────────────────────────────────────────────────────────────
  const {
    generar: generarPDF,
    loading: pdfLoading,
    error: pdfError,
    clearError: clearPdfError,
  } = useExportPDF()

  const {
    exportar: exportarEditable,
    loading: editableLoading,
    error: editableError,
    clearError: clearEditableError,
  } = useExportEditable()

  function handleDownloadPDF() {
    if (!templateForDownload || !form) return
    generarPDF(templateForDownload, form.datos, selectedTemplate)
  }

  function handleDownloadEditable() {
    if (!form || !templateForDownload) return
    exportarEditable({ ...form, plantilla: templateForDownload })
  }

  // ── Loading / error screens ───────────────────────────────────────────────
  if (loadingForm) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-7 w-7 animate-spin text-blue-400" />
      </div>
    )
  }

  if (loadError || !form || !templateForPreview || !templateForDownload) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 p-8 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="max-w-sm text-sm text-gray-700">
          {loadError ?? 'Formulario no disponible.'}
        </p>
        <button
          onClick={() => navigate('/')}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Volver al inicio
        </button>
      </div>
    )
  }

  const isCompleted = form.estado === 'completado'
  const configHasColor = !!form.plantilla.pdfConfig?.colorTema

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(`/fill/${id}`)}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            title="Volver al formulario"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-semibold text-gray-900">
              {form.plantilla.nombre}
            </h1>
            <p className="truncate text-xs text-gray-400">Exportar</p>
          </div>

          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
          >
            <Home className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Inicio</span>
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-5 sm:px-6">

        {/* ── Summary bar ──────────────────────────────────────────────────── */}
        <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-3.5 shadow-sm">
          {/* Status badge */}
          <span
            className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
              isCompleted
                ? 'bg-green-100 text-green-700'
                : 'bg-amber-100 text-amber-700'
            }`}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {isCompleted ? 'Completado' : 'Borrador'}
          </span>

          {/* Field count */}
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <Hash className="h-4 w-4 text-gray-400" />
            <span>
              <span className="font-semibold text-gray-900">{filledCount}</span>
              <span className="text-gray-400"> / </span>
              <span className="font-semibold text-gray-900">{totalFields}</span>
              {' '}campos rellenados
            </span>
          </div>

          {/* Fill progress bar */}
          <div className="flex flex-1 items-center gap-2 sm:min-w-36">
            <div className="h-1.5 min-w-20 flex-1 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-blue-500 transition-all"
                style={{ width: `${totalFields ? Math.round((filledCount / totalFields) * 100) : 0}%` }}
              />
            </div>
            <span className="shrink-0 text-xs text-gray-400">
              {totalFields ? Math.round((filledCount / totalFields) * 100) : 0}%
            </span>
          </div>
        </div>

        {/* ── Missing required fields warning ──────────────────────────────── */}
        {missingFields.length > 0 && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50">
            <button
              onClick={() => setMissingOpen((v) => !v)}
              className="flex w-full items-center gap-3 px-5 py-3.5 text-left"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-amber-500" />
              <p className="flex-1 text-sm font-medium text-amber-800">
                {missingFields.length === 1
                  ? '1 campo obligatorio sin rellenar'
                  : `${missingFields.length} campos obligatorios sin rellenar`}
                <span className="ml-1 font-normal text-amber-600">
                  — puedes exportar igualmente
                </span>
              </p>
              {missingOpen ? (
                <ChevronUp className="h-4 w-4 text-amber-500" />
              ) : (
                <ChevronDown className="h-4 w-4 text-amber-500" />
              )}
            </button>
            {missingOpen && (
              <div className="border-t border-amber-200 px-5 pb-4 pt-3">
                <ul className="space-y-1.5">
                  {missingFields.map((mf, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-amber-800">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
                      <span className="text-amber-600 text-xs">{mf.sectionName} →</span>
                      <span className="font-medium">{mf.label}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* ── Two-column layout ─────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start">

          {/* ── Left panel: controls ───────────────────────────────────────── */}
          <div className="flex flex-col gap-5 lg:w-80 lg:shrink-0">

            {/* ── PDF export card ──────────────────────────────────────────── */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <FileDown className="h-4 w-4 text-blue-500" />
                Exportar PDF
              </h2>

              {/* Template selector */}
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-gray-400">
                Plantilla visual
              </p>
              <div className="grid grid-cols-3 gap-2 mb-4">
                {TEMPLATE_META.map(({ name, label, description, preview }) => (
                  <button
                    key={name}
                    onClick={() => setSelectedTemplate(name)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border-2 p-2 text-center transition-all ${
                      selectedTemplate === name
                        ? 'border-blue-500 bg-blue-50 shadow-sm'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="w-full">{preview(previewColor)}</div>
                    <span
                      className={`text-xs font-medium leading-tight ${
                        selectedTemplate === name ? 'text-blue-700' : 'text-gray-700'
                      }`}
                    >
                      {label}
                    </span>
                    <span className="text-[10px] leading-tight text-gray-400 hidden sm:block lg:block">
                      {description}
                    </span>
                  </button>
                ))}
              </div>

              {/* Color picker */}
              <div className="mb-5">
                <div className="mb-2 flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-gray-400">
                    <Palette className="h-3.5 w-3.5" />
                    Color del tema
                  </p>
                  {configHasColor && (
                    <span className="text-[10px] text-gray-400">Definido en plantilla</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input
                      type="color"
                      value={inputColor}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="h-9 w-9 cursor-pointer rounded-lg border border-gray-200 p-0.5"
                      title="Seleccionar color"
                    />
                  </div>
                  <div className="flex flex-1 items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                    <div
                      className="h-4 w-4 shrink-0 rounded-full border border-gray-200"
                      style={{ backgroundColor: inputColor }}
                    />
                    <span className="font-mono text-xs text-gray-700">{inputColor.toUpperCase()}</span>
                  </div>
                </div>
              </div>

              {/* PDF errors */}
              {pdfError && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p className="flex-1">{pdfError}</p>
                  <button onClick={clearPdfError} className="shrink-0 text-red-400 hover:text-red-600">✕</button>
                </div>
              )}

              <button
                onClick={handleDownloadPDF}
                disabled={pdfLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
              >
                {pdfLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileDown className="h-4 w-4" />
                )}
                {pdfLoading ? 'Generando…' : 'Descargar PDF'}
              </button>
            </section>

            {/* ── Editable export card ──────────────────────────────────────── */}
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-gray-900">
                <Share2 className="h-4 w-4 text-indigo-500" />
                Exportar Editable
              </h2>
              <p className="mb-4 text-xs text-gray-500 leading-relaxed">
                Genera un archivo <span className="font-medium text-gray-700">.json</span> que
                contiene la plantilla y los datos actuales. Puedes abrirlo en otro dispositivo
                con DashForm Filler para continuar rellenando o corregir respuestas.
              </p>

              {editableError && (
                <div className="mb-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                  <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <p className="flex-1">{editableError}</p>
                  <button onClick={clearEditableError} className="shrink-0 text-red-400 hover:text-red-600">✕</button>
                </div>
              )}

              <button
                onClick={handleDownloadEditable}
                disabled={editableLoading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-100 disabled:opacity-60 transition-colors"
              >
                {editableLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                {editableLoading ? 'Exportando…' : 'Descargar Editable (.json)'}
              </button>
            </section>

          </div>

          {/* ── Right panel: live PDF preview ──────────────────────────────── */}
          <div className="flex flex-1 flex-col gap-2 lg:min-h-[680px]">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-400">
              Vista previa
            </p>
            <div
              className="flex-1 overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-inner"
              style={{ minHeight: 480 }}
            >
              <LivePreview
                template={templateForPreview}
                datos={form.datos}
                selectedTemplate={selectedTemplate}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  )
}
