import { useState, useRef, useEffect } from 'react'
import {
  Type, AlignLeft, Mail, Phone, CheckSquare, CircleDot,
  ChevronDown, Calendar, PenLine, Pen,
  ChevronUp, Trash2, Settings2, X, Plus,
} from 'lucide-react'
import type { Field, FieldType, LayoutRow } from '@/types/template'
import { soloFieldIds } from '@/utils/layoutHelpers'

// ── Type maps ─────────────────────────────────────────────────────────────────

const FIELD_ICON: Record<FieldType, React.ReactNode> = {
  'texto':            <Type className="h-4 w-4" />,
  'texto-expandible': <AlignLeft className="h-4 w-4" />,
  'email':            <Mail className="h-4 w-4" />,
  'telefono':         <Phone className="h-4 w-4" />,
  'checkbox':         <CheckSquare className="h-4 w-4" />,
  'radio':            <CircleDot className="h-4 w-4" />,
  'select':           <ChevronDown className="h-4 w-4" />,
  'fecha':            <Calendar className="h-4 w-4" />,
  'firma-digital':    <Pen className="h-4 w-4" />,
  'firma-texto':      <PenLine className="h-4 w-4" />,
}

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  'texto':            'Texto',
  'texto-expandible': 'Texto largo',
  'email':            'Email',
  'telefono':         'Teléfono',
  'checkbox':         'Checkbox',
  'radio':            'Radio',
  'select':           'Select',
  'fecha':            'Fecha',
  'firma-digital':    'Firma digital',
  'firma-texto':      'Firma escrita',
}

const FIELD_TYPE_OPTIONS: { tipo: FieldType; label: string }[] = [
  { tipo: 'texto',            label: 'Texto' },
  { tipo: 'texto-expandible', label: 'Texto largo' },
  { tipo: 'email',            label: 'Email' },
  { tipo: 'telefono',         label: 'Teléfono' },
  { tipo: 'checkbox',         label: 'Checkbox' },
  { tipo: 'radio',            label: 'Opción única' },
  { tipo: 'select',           label: 'Desplegable' },
  { tipo: 'fecha',            label: 'Fecha' },
  { tipo: 'firma-digital',    label: 'Firma digital' },
  { tipo: 'firma-texto',      label: 'Firma escrita' },
]

// ── Row '+' dropdown ──────────────────────────────────────────────────────────

interface RowAddDropdownProps {
  rowId: string
  soloFields: Field[]
  onAddExisting: (fieldId: string) => void
  onAddNew: (tipo: FieldType) => void
}

function RowAddDropdown({ rowId: _rowId, soloFields, onAddExisting, onAddNew }: RowAddDropdownProps) {
  const [open, setOpen] = useState(false)
  const [showNewTypes, setShowNewTypes] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function onMouse(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setShowNewTypes(false)
      }
    }
    const tid = setTimeout(() => document.addEventListener('mousedown', onMouse), 80)
    return () => { clearTimeout(tid); document.removeEventListener('mousedown', onMouse) }
  }, [open])

  const hasContent = soloFields.length > 0 || true // always show "Nuevo campo"

  if (!hasContent) return null

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => { setOpen((v) => !v); setShowNewTypes(false) }}
        className="flex h-7 w-7 items-center justify-center rounded-md border border-dashed border-gray-300 text-gray-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
        title="Añadir campo a esta fila"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-1 w-52 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden">
          {!showNewTypes ? (
            <>
              {soloFields.length > 0 && (
                <>
                  <p className="px-3 py-2 text-xs font-medium text-gray-400 uppercase tracking-wide">
                    Mover campo aquí
                  </p>
                  {soloFields.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => { onAddExisting(f.id); setOpen(false) }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                    >
                      <span className="text-gray-400">{FIELD_ICON[f.tipo]}</span>
                      <span className="truncate">{f.label}</span>
                    </button>
                  ))}
                  <div className="mx-3 my-1 border-t border-gray-100" />
                </>
              )}
              <button
                onClick={() => setShowNewTypes(true)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-3.5 w-3.5 text-gray-400" />
                Nuevo campo en esta fila
                <ChevronDown className="ml-auto h-3 w-3 -rotate-90 text-gray-400" />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowNewTypes(false)}
                className="flex w-full items-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:bg-gray-50"
              >
                <ChevronDown className="h-3 w-3 rotate-90" />
                Volver
              </button>
              <div className="mx-3 mb-1 border-t border-gray-100" />
              {FIELD_TYPE_OPTIONS.map(({ tipo, label }) => (
                <button
                  key={tipo}
                  onClick={() => { onAddNew(tipo); setOpen(false); setShowNewTypes(false) }}
                  className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
                >
                  <span className="text-gray-400">{FIELD_ICON[tipo]}</span>
                  {label}
                </button>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Single field card ─────────────────────────────────────────────────────────

interface FieldCardProps {
  field: Field
  isSelected: boolean
  isInMultiRow: boolean
  onSelect: () => void
  onRemoveFromRow: () => void
  onDelete: () => void
}

function FieldCard({ field, isSelected, isInMultiRow, onSelect, onRemoveFromRow, onDelete }: FieldCardProps) {
  return (
    <div
      onClick={onSelect}
      className={`flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-lg border bg-white px-3 py-2.5 shadow-sm transition-all ${
        isSelected
          ? 'border-blue-400 ring-2 ring-blue-100'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      {/* Type icon */}
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm ${
          isSelected ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {FIELD_ICON[field.tipo]}
      </span>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-gray-800">
          {field.label}
          {field.obligatorio && <span className="ml-1 text-red-500">*</span>}
        </p>
        <p className="text-xs text-gray-400">{FIELD_TYPE_LABEL[field.tipo]}</p>
      </div>

      {/* Actions — stop propagation so click doesn't select */}
      <div className="flex shrink-0 items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
        {isSelected && !isInMultiRow && (
          <Settings2 className="mr-1 h-3.5 w-3.5 text-blue-400" />
        )}

        {isInMultiRow && (
          <button
            onClick={onRemoveFromRow}
            className="rounded p-1 text-gray-300 hover:bg-amber-50 hover:text-amber-500 transition-colors"
            title="Sacar de esta fila (vuelve a ser fila individual)"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <button
          onClick={onDelete}
          className="rounded p-1 text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
          title="Eliminar campo"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

// ── FieldList ─────────────────────────────────────────────────────────────────

interface FieldListProps {
  fields: Field[]
  layout: LayoutRow[]
  selectedFieldId: string | null
  onSelectField: (fieldId: string) => void
  onRemoveField: (fieldId: string) => void
  onMoveRowUp: (rowId: string) => void
  onMoveRowDown: (rowId: string) => void
  onAddFieldToRow: (rowId: string, fieldId: string) => void
  onRemoveFieldFromRow: (fieldId: string) => void
  onAddNewFieldToRow: (rowId: string, tipo: FieldType) => void
}

export function FieldList({
  fields,
  layout,
  selectedFieldId,
  onSelectField,
  onRemoveField,
  onMoveRowUp,
  onMoveRowDown,
  onAddFieldToRow,
  onRemoveFieldFromRow,
  onAddNewFieldToRow,
}: FieldListProps) {
  const fieldMap = new Map(fields.map((f) => [f.id, f]))
  // Fields currently alone in their row (candidates to merge into other rows)
  const soloIds = new Set(soloFieldIds(layout))

  if (fields.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-gray-400">
        Esta sección no tiene campos. Añade uno abajo.
      </p>
    )
  }

  return (
    <ul className="space-y-2">
      {layout.map((row, rowIdx) => {
        const rowFields = row.campos.map((id) => fieldMap.get(id)).filter(Boolean) as Field[]
        if (rowFields.length === 0) return null

        const isMulti = rowFields.length > 1
        // Solo fields from OTHER rows that could be merged into this one
        const mergeTargets = fields.filter(
          (f) => soloIds.has(f.id) && !row.campos.includes(f.id),
        )

        return (
          <li key={row.id}>
            <div
              className={`flex items-stretch gap-2 rounded-xl p-2 transition-colors ${
                isMulti
                  ? 'border border-dashed border-blue-200 bg-blue-50/40'
                  : 'bg-transparent'
              }`}
            >
              {/* Field cards */}
              <div className={`flex min-w-0 flex-1 gap-2 ${isMulti ? 'flex-row' : ''}`}>
                {rowFields.map((field) => (
                  <FieldCard
                    key={field.id}
                    field={field}
                    isSelected={field.id === selectedFieldId}
                    isInMultiRow={isMulti}
                    onSelect={() => onSelectField(field.id)}
                    onRemoveFromRow={() => onRemoveFieldFromRow(field.id)}
                    onDelete={() => onRemoveField(field.id)}
                  />
                ))}
              </div>

              {/* Row controls */}
              <div className="flex shrink-0 flex-col items-center justify-between gap-1 py-0.5">
                {/* Move row up/down */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => onMoveRowUp(row.id)}
                    disabled={rowIdx === 0}
                    className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-25 transition-colors"
                    title="Subir fila"
                  >
                    <ChevronUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => onMoveRowDown(row.id)}
                    disabled={rowIdx === layout.length - 1}
                    className="rounded p-1 text-gray-400 hover:bg-white hover:text-gray-700 disabled:opacity-25 transition-colors"
                    title="Bajar fila"
                  >
                    <ChevronDown className="h-3.5 w-3.5" />
                  </button>
                </div>

                {/* Add to row button */}
                <RowAddDropdown
                  rowId={row.id}
                  soloFields={mergeTargets}
                  onAddExisting={(fid) => onAddFieldToRow(row.id, fid)}
                  onAddNew={(tipo) => onAddNewFieldToRow(row.id, tipo)}
                />
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
