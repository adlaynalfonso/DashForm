import { useState } from 'react'
import { Plus, X, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Section } from '@/types/template'

interface SectionManagerProps {
  sections: Section[]
  activeSectionId: string | null
  onSelectSection: (id: string) => void
  onAddSection: () => void
  onRemoveSection: (id: string) => void
  onMoveSectionUp: (id: string) => void
  onMoveSectionDown: (id: string) => void
  onUpdateSectionName: (id: string, nombre: string) => void
}

export function SectionManager({
  sections,
  activeSectionId,
  onSelectSection,
  onAddSection,
  onRemoveSection,
  onMoveSectionUp,
  onMoveSectionDown,
  onUpdateSectionName,
}: SectionManagerProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')

  function handleDeleteClick(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    setConfirmDeleteId(id)
  }

  function handleConfirmDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    onRemoveSection(id)
    setConfirmDeleteId(null)
  }

  function handleCancelDelete(e: React.MouseEvent) {
    e.stopPropagation()
    setConfirmDeleteId(null)
  }

  function handleDoubleClick(e: React.MouseEvent, section: Section) {
    e.stopPropagation()
    setEditingId(section.id)
    setEditingName(section.nombre)
  }

  function handleRenameCommit(id: string) {
    if (editingName.trim()) onUpdateSectionName(id, editingName.trim())
    setEditingId(null)
  }

  if (sections.length === 0) {
    return (
      <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3">
        <span className="text-sm text-gray-400">Sin secciones.</span>
        <button
          onClick={onAddSection}
          className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
        >
          <Plus className="h-3.5 w-3.5" />
          Añadir sección
        </button>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200 bg-white px-4">
      {sections.map((section, idx) => {
        const isActive = section.id === activeSectionId
        const isConfirming = confirmDeleteId === section.id
        const isEditing = editingId === section.id

        return (
          <div
            key={section.id}
            onClick={() => onSelectSection(section.id)}
            className={`group relative flex shrink-0 cursor-pointer items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm transition-colors select-none ${
              isActive
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {/* Rename order buttons — visible on hover for active tab */}
            {isActive && (
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveSectionUp(section.id) }}
                  disabled={idx === 0}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Mover izquierda"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onMoveSectionDown(section.id) }}
                  disabled={idx === sections.length - 1}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600 disabled:opacity-30"
                  title="Mover derecha"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            )}

            {/* Tab label */}
            {isEditing ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRenameCommit(section.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleRenameCommit(section.id)
                  if (e.key === 'Escape') setEditingId(null)
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-28 rounded border border-blue-400 bg-white px-1 py-0 text-sm text-gray-900 outline-none"
              />
            ) : (
              <span
                onDoubleClick={(e) => handleDoubleClick(e, section)}
                className="max-w-[120px] truncate"
                title={`${section.nombre} (doble clic para renombrar)`}
              >
                {section.nombre}
              </span>
            )}

            {/* Delete / confirm */}
            {isConfirming ? (
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={(e) => handleConfirmDelete(e, section.id)}
                  className="rounded p-0.5 text-red-500 hover:text-red-700"
                  title="Confirmar eliminación"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={handleCancelDelete}
                  className="rounded p-0.5 text-gray-400 hover:text-gray-600"
                  title="Cancelar"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={(e) => handleDeleteClick(e, section.id)}
                className="rounded p-0.5 text-gray-300 opacity-0 transition-opacity hover:text-red-500 group-hover:opacity-100"
                title="Eliminar sección"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        )
      })}

      {/* Add section button */}
      <button
        onClick={onAddSection}
        className="ml-2 flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
      >
        <Plus className="h-3.5 w-3.5" />
        Sección
      </button>
    </div>
  )
}
