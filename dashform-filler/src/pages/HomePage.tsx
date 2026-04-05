import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText,
  Upload,
  Trash2,
  Plus,
  Clock,
  CheckCircle2,
  FilePlus2,
  Library,
  FileDown,
  Eye,
  Loader2,
  AlertCircle,
  BookOpen,
} from 'lucide-react'
import { useTemplateLibrary } from '@/hooks/useTemplateLibrary'
import { useFilledForms, calcProgress } from '@/hooks/useFilledForms'
import { useExportEditable } from '@/hooks/useExportEditable'
import type { LibraryTemplate } from '@/utils/db'
import type { FilledForm } from '@/types/filledForm'

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function countFields(template: LibraryTemplate): number {
  return template.secciones.flatMap((s) => s.campos).length
}

// ── Tab types ─────────────────────────────────────────────────────────────────

type Tab = 'plantillas' | 'en-curso' | 'historial'

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="mb-4 text-gray-300">{icon}</div>
      <p className="text-sm font-medium text-gray-500">{title}</p>
      {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    </div>
  )
}

// ── Error banner ──────────────────────────────────────────────────────────────

function ErrorBanner({ errors, onDismiss }: { errors: string[]; onDismiss: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
      <div className="flex items-start gap-2.5">
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          {errors.length === 1 ? (
            <span>{errors[0]}</span>
          ) : (
            <ul className="list-disc pl-4 space-y-0.5">
              {errors.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          )}
        </div>
        <button onClick={onDismiss} className="shrink-0 text-red-400 hover:text-red-600">✕</button>
      </div>
    </div>
  )
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateCard({
  template,
  onNewForm,
  onDelete,
  creating,
}: {
  template: LibraryTemplate
  onNewForm: () => void
  onDelete: () => void
  creating: boolean
}) {
  const numCampos = countFields(template)
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-500">
          <FileText className="h-4.5 w-4.5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-gray-900">{template.nombre}</p>
          {template.descripcion ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">{template.descripcion}</p>
          ) : null}
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-gray-400">
        <span>{numCampos} campo{numCampos !== 1 ? 's' : ''}</span>
        <span>·</span>
        <span>Importado {formatDate(template.fechaImportacion)}</span>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={onNewForm}
          disabled={creating}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60 transition-colors"
        >
          {creating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Plus className="h-3.5 w-3.5" />
          )}
          Nuevo Formulario
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-gray-200 p-2 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Eliminar de biblioteca"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Draft card ────────────────────────────────────────────────────────────────

function DraftCard({
  form,
  onContinue,
  onDelete,
}: {
  form: FilledForm
  onContinue: () => void
  onDelete: () => void
}) {
  const progress = calcProgress(form)
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-500">
        <FilePlus2 className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{form.plantilla.nombre}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-amber-400 transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="shrink-0 text-xs text-gray-400">{progress}%</span>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Modificado {formatDate(form.fechaModificacion)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onContinue}
          className="rounded-lg bg-amber-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-amber-600 transition-colors"
        >
          Continuar
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-gray-200 p-1.5 text-gray-400 hover:border-red-200 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Eliminar"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── Completed card ────────────────────────────────────────────────────────────

function CompletedCard({
  form,
  onView,
  onExport,
}: {
  form: FilledForm
  onView: () => void
  onExport: () => void
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-500">
        <CheckCircle2 className="h-4.5 w-4.5" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-gray-900">{form.plantilla.nombre}</p>
        <p className="mt-0.5 text-xs text-gray-400">
          Completado {formatDate(form.fechaModificacion)}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={onView}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <Eye className="h-3.5 w-3.5" />
          Ver
        </button>
        <button
          onClick={onExport}
          className="flex items-center gap-1.5 rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
        >
          <FileDown className="h-3.5 w-3.5" />
          Exportar PDF
        </button>
      </div>
    </div>
  )
}

// ── HomePage ──────────────────────────────────────────────────────────────────

export default function HomePage() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<Tab>('plantillas')
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [creatingId, setCreatingId] = useState<string | null>(null)

  const importInputRef = useRef<HTMLInputElement>(null)
  const editableInputRef = useRef<HTMLInputElement>(null)

  const { templates, loading: loadingTemplates, importFromFile, deleteTemplate } = useTemplateLibrary()
  const { drafts, completed, loading: loadingForms, createForm, deleteForm } = useFilledForms()
  const { importar: importarEditable, loading: importingEditable, error: editableError, clearError: clearEditableError } = useExportEditable()

  // ── Import template ────────────────────────────────────────────────────────

  async function handleImportTemplate(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!importInputRef.current) return
    importInputRef.current.value = ''
    if (!file) return

    setImportErrors([])
    const result = await importFromFile(file)
    if (!result.success) setImportErrors(result.errors ?? ['Error desconocido.'])
    else setActiveTab('plantillas')
  }

  // ── Import editable ────────────────────────────────────────────────────────

  async function handleImportEditable(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!editableInputRef.current) return
    editableInputRef.current.value = ''
    if (!file) return

    clearEditableError()
    const formId = await importarEditable(file)
    if (formId) navigate(`/fill/${formId}`)
  }

  // ── Create new form ────────────────────────────────────────────────────────

  async function handleNewForm(template: LibraryTemplate) {
    setCreatingId(template.id)
    try {
      const formId = await createForm(template)
      navigate(`/fill/${formId}`)
    } finally {
      setCreatingId(null)
    }
  }

  // ── Tabs config ────────────────────────────────────────────────────────────

  const tabs: { id: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    {
      id: 'plantillas',
      label: 'Plantillas',
      icon: <Library className="h-4 w-4" />,
      count: templates.length || undefined,
    },
    {
      id: 'en-curso',
      label: 'En Curso',
      icon: <Clock className="h-4 w-4" />,
      count: drafts.length || undefined,
    },
    {
      id: 'historial',
      label: 'Historial',
      icon: <CheckCircle2 className="h-4 w-4" />,
      count: completed.length || undefined,
    },
  ]

  const isLoading = loadingTemplates || loadingForms

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-500">
              <FileText className="h-4 w-4 text-white" />
            </div>
            <span className="font-semibold text-gray-900">DashForm Filler</span>
          </div>

          <button
            onClick={() => editableInputRef.current?.click()}
            disabled={importingEditable}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 transition-colors"
            title="Importar formulario en progreso (.json)"
          >
            {importingEditable ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Upload className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Importar Editable</span>
          </button>
          <input
            ref={editableInputRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImportEditable}
          />
        </div>

        {/* ── Tab bar ───────────────────────────────────────────────────── */}
        <div className="mx-auto flex max-w-3xl gap-0 px-4">
          {tabs.map(({ id, label, icon, count }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
                activeTab === id
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {icon}
              {label}
              {count !== undefined && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs ${
                    activeTab === id
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      <main className="mx-auto max-w-3xl px-4 py-6">

        {editableError && (
          <div className="mb-4">
            <ErrorBanner errors={[editableError]} onDismiss={clearEditableError} />
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-gray-300" />
          </div>
        ) : (
          <>
            {/* ── Tab: Plantillas ───────────────────────────────────────── */}
            {activeTab === 'plantillas' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-medium text-gray-500 uppercase tracking-wide">
                    Biblioteca
                  </h2>
                  <button
                    onClick={() => {
                      setImportErrors([])
                      importInputRef.current?.click()
                    }}
                    className="flex items-center gap-1.5 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition-colors"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Importar Plantilla
                  </button>
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportTemplate}
                  />
                </div>

                {importErrors.length > 0 && (
                  <ErrorBanner errors={importErrors} onDismiss={() => setImportErrors([])} />
                )}

                {templates.length === 0 ? (
                  <EmptyState
                    icon={<BookOpen className="h-12 w-12" />}
                    title="Tu biblioteca está vacía"
                    subtitle="Importa una plantilla .json para empezar a rellenar formularios."
                  />
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {templates.map((tpl) => (
                      <TemplateCard
                        key={tpl.id}
                        template={tpl}
                        creating={creatingId === tpl.id}
                        onNewForm={() => handleNewForm(tpl)}
                        onDelete={() => deleteTemplate(tpl.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: En Curso ─────────────────────────────────────────── */}
            {activeTab === 'en-curso' && (
              <div className="space-y-3">
                {drafts.length === 0 ? (
                  <EmptyState
                    icon={<Clock className="h-12 w-12" />}
                    title="No tienes formularios en curso"
                    subtitle="Crea uno nuevo desde la pestaña Plantillas."
                  />
                ) : (
                  drafts.map((form) => (
                    <DraftCard
                      key={form.id}
                      form={form}
                      onContinue={() => navigate(`/fill/${form.id}`)}
                      onDelete={() => deleteForm(form.id)}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── Tab: Historial ────────────────────────────────────────── */}
            {activeTab === 'historial' && (
              <div className="space-y-3">
                {completed.length === 0 ? (
                  <EmptyState
                    icon={<CheckCircle2 className="h-12 w-12" />}
                    title="No hay formularios completados"
                    subtitle="Los formularios finalizados aparecerán aquí."
                  />
                ) : (
                  completed.map((form) => (
                    <CompletedCard
                      key={form.id}
                      form={form}
                      onView={() => navigate(`/fill/${form.id}`)}
                      onExport={() => navigate(`/export/${form.id}`)}
                    />
                  ))
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
