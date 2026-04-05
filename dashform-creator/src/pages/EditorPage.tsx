import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  Save,
  Eye,
  CheckCircle,
  AlertCircle,
  Loader2,
  LayoutTemplate,
  FileText,
} from 'lucide-react'
import { useTemplateEditor } from '@/hooks/useTemplateEditor'
import { SectionManager } from '@/components/editor/SectionManager'
import { FieldList } from '@/components/editor/FieldList'
import { AddFieldButton } from '@/components/editor/AddFieldButton'
import { FieldConfigurator } from '@/components/editor/FieldConfigurator'
import { PdfConfigPanel } from '@/components/editor/PdfConfigPanel'
import type { Field } from '@/types/template'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'
type EditorTab = 'campos' | 'diseno-pdf'

export default function EditorPage() {
  const { id } = useParams<{ id?: string }>()
  const navigate = useNavigate()

  const { template, dispatch, loading, error, save } = useTemplateEditor(id)

  const [activeTab, setActiveTab] = useState<EditorTab>('campos')
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')

  // Auto-select the first section when sections change
  useEffect(() => {
    if (!activeSectionId && template.secciones.length > 0) {
      setActiveSectionId(template.secciones[0].id)
    }
    if (
      activeSectionId &&
      !template.secciones.find((s) => s.id === activeSectionId)
    ) {
      setActiveSectionId(template.secciones[0]?.id ?? null)
      setSelectedFieldId(null)
    }
  }, [template.secciones, activeSectionId])

  // Close field configurator when switching to PDF tab
  function handleTabChange(tab: EditorTab) {
    setActiveTab(tab)
    if (tab !== 'campos') setSelectedFieldId(null)
  }

  function handleSelectSection(sid: string) {
    setActiveSectionId(sid)
    setSelectedFieldId(null)
  }

  const activeSection = template.secciones.find((s) => s.id === activeSectionId)
  const selectedField: Field | undefined = activeSection?.campos.find(
    (f) => f.id === selectedFieldId,
  )

  async function handleSave() {
    setSaveStatus('saving')
    try {
      await save()
      setSaveStatus('saved')
      setTimeout(() => setSaveStatus('idle'), 2500)
      if (!id) navigate(`/editor/${template.id}`, { replace: true })
    } catch {
      setSaveStatus('error')
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }

  // ── Loading / error ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gray-50 text-center">
        <AlertCircle className="h-10 w-10 text-red-400" />
        <p className="text-gray-700">{error}</p>
        <button onClick={() => navigate('/')} className="text-sm text-blue-600 hover:underline">
          Volver al inicio
        </button>
      </div>
    )
  }

  // ── Layout ────────────────────────────────────────────────────────────────

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">

      {/* ── Top bar ─────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-10 border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex max-w-5xl items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate('/')}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Volver"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <input
            type="text"
            value={template.nombre}
            onChange={(e) => dispatch({ type: 'SET_NOMBRE', payload: e.target.value })}
            className="min-w-0 flex-1 rounded-lg border border-transparent bg-gray-50 px-3 py-1.5 text-base font-semibold text-gray-900 outline-none transition focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
            placeholder="Nombre de la plantilla"
          />

          <div className="flex items-center gap-2">
            {saveStatus === 'saved' && (
              <span className="flex items-center gap-1 text-xs text-green-600">
                <CheckCircle className="h-3.5 w-3.5" /> Guardado
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="flex items-center gap-1 text-xs text-red-500">
                <AlertCircle className="h-3.5 w-3.5" /> Error al guardar
              </span>
            )}

            <button
              onClick={() => navigate(`/preview/${template.id}`)}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Vista Previa</span>
            </button>

            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {saveStatus === 'saving' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Guardar
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="mx-auto max-w-5xl px-4 pb-1">
          <input
            type="text"
            value={template.descripcion}
            onChange={(e) => dispatch({ type: 'SET_DESCRIPCION', payload: e.target.value })}
            className="w-full rounded-lg border border-transparent bg-transparent px-3 py-1 text-sm text-gray-500 outline-none placeholder:text-gray-300 focus:border-gray-200 focus:bg-white"
            placeholder="Descripción opcional…"
          />
        </div>

        {/* ── Main tab bar ───────────────────────────────────────────────── */}
        <div className="mx-auto flex max-w-5xl items-center gap-1 px-4">
          <button
            onClick={() => handleTabChange('campos')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'campos'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            Campos
          </button>
          <button
            onClick={() => handleTabChange('diseno-pdf')}
            className={`flex items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-medium transition-colors ${
              activeTab === 'diseno-pdf'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <LayoutTemplate className="h-4 w-4" />
            Diseño PDF
          </button>
        </div>
      </header>

      {/* ── Tab: Campos ─────────────────────────────────────────────────── */}
      {activeTab === 'campos' && (
        <>
          <SectionManager
            sections={template.secciones}
            activeSectionId={activeSectionId}
            onSelectSection={handleSelectSection}
            onAddSection={() => dispatch({ type: 'ADD_SECTION' })}
            onRemoveSection={(sid) => dispatch({ type: 'REMOVE_SECTION', payload: sid })}
            onMoveSectionUp={(sid) => dispatch({ type: 'MOVE_SECTION_UP', payload: sid })}
            onMoveSectionDown={(sid) => dispatch({ type: 'MOVE_SECTION_DOWN', payload: sid })}
            onUpdateSectionName={(sid, nombre) =>
              dispatch({ type: 'UPDATE_SECTION_NAME', payload: { id: sid, nombre } })
            }
          />

          <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
            {template.secciones.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <p className="text-sm text-gray-400">
                  Añade una sección para empezar a organizar los campos.
                </p>
                <button
                  onClick={() => dispatch({ type: 'ADD_SECTION' })}
                  className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  + Añadir primera sección
                </button>
              </div>
            ) : activeSection ? (
              <div className="space-y-4">
                <FieldList
                  fields={activeSection.campos}
                  layout={activeSection.layout ?? []}
                  selectedFieldId={selectedFieldId}
                  onSelectField={(fid) =>
                    setSelectedFieldId((prev) => (prev === fid ? null : fid))
                  }
                  onRemoveField={(fid) => {
                    if (selectedFieldId === fid) setSelectedFieldId(null)
                    dispatch({ type: 'REMOVE_FIELD', payload: { sectionId: activeSection.id, fieldId: fid } })
                  }}
                  onMoveRowUp={(rowId) =>
                    dispatch({ type: 'MOVE_ROW_UP', payload: { sectionId: activeSection.id, rowId } })
                  }
                  onMoveRowDown={(rowId) =>
                    dispatch({ type: 'MOVE_ROW_DOWN', payload: { sectionId: activeSection.id, rowId } })
                  }
                  onAddFieldToRow={(rowId, fieldId) =>
                    dispatch({ type: 'ADD_FIELD_TO_ROW', payload: { sectionId: activeSection.id, rowId, fieldId } })
                  }
                  onRemoveFieldFromRow={(fieldId) =>
                    dispatch({ type: 'REMOVE_FIELD_FROM_ROW', payload: { sectionId: activeSection.id, fieldId } })
                  }
                  onAddNewFieldToRow={(rowId, tipo) =>
                    dispatch({ type: 'ADD_FIELD', payload: { sectionId: activeSection.id, tipo, targetRowId: rowId } })
                  }
                />
                <AddFieldButton
                  onAdd={(tipo) =>
                    dispatch({ type: 'ADD_FIELD', payload: { sectionId: activeSection.id, tipo } })
                  }
                />
              </div>
            ) : null}
          </main>

          {/* Field configurator panel */}
          {selectedField && activeSection && (
            <FieldConfigurator
              field={selectedField}
              sectionId={activeSection.id}
              onUpdate={(sectionId, field) =>
                dispatch({ type: 'UPDATE_FIELD', payload: { sectionId, field } })
              }
              onClose={() => setSelectedFieldId(null)}
            />
          )}
        </>
      )}

      {/* ── Tab: Diseño PDF ─────────────────────────────────────────────── */}
      {activeTab === 'diseno-pdf' && (
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8">
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="mb-6">
              <h2 className="text-base font-semibold text-gray-900">Diseño del PDF</h2>
              <p className="mt-0.5 text-sm text-gray-500">
                Configura el aspecto visual del documento generado.
              </p>
            </div>
            <PdfConfigPanel
              pdfConfig={template.pdfConfig}
              onUpdate={(partial) =>
                dispatch({ type: 'UPDATE_PDF_CONFIG', payload: partial })
              }
            />
          </div>
        </main>
      )}
    </div>
  )
}
