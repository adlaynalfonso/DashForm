import { AlertCircle, Plus, Trash2 } from 'lucide-react'
import type { Field, TablaColumna } from '@/types/template'

interface Props {
  field: Field
  value: unknown
  onChange: (value: Record<string, unknown>[]) => void
  error?: string
}

function emptyRow(columnas: TablaColumna[]): Record<string, unknown> {
  return Object.fromEntries(columnas.map((c) => [c.id, c.tipo === 'checkbox' ? false : '']))
}

function parseRows(value: unknown, columnas: TablaColumna[], filasMin: number): Record<string, unknown>[] {
  const existing = Array.isArray(value) ? (value as Record<string, unknown>[]) : []
  const rows = existing.map((row) => ({ ...row }))
  while (rows.length < filasMin) rows.push(emptyRow(columnas))
  return rows
}

const cellInputCls =
  'w-full bg-transparent text-sm text-gray-800 outline-none focus:ring-0 placeholder:text-gray-300'

function CellInput({
  col,
  value,
  onChange,
}: {
  col: TablaColumna
  value: unknown
  onChange: (v: unknown) => void
}) {
  if (col.tipo === 'checkbox') {
    return (
      <div className="flex justify-center">
        <input
          type="checkbox"
          checked={!!value}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 accent-blue-500 cursor-pointer"
        />
      </div>
    )
  }

  if (col.tipo === 'fecha') {
    return (
      <input
        type="date"
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className={cellInputCls}
      />
    )
  }

  if (col.tipo === 'select') {
    return (
      <select
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${cellInputCls} cursor-pointer`}
      >
        <option value="">—</option>
        {(col.opciones ?? []).map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  return (
    <input
      type="text"
      value={typeof value === 'string' ? value : ''}
      onChange={(e) => onChange(e.target.value)}
      className={cellInputCls}
    />
  )
}

export function TablaField({ field, value, onChange, error }: Props) {
  const columnas = field.columnas ?? []
  const filasMin = field.filasMin ?? 5
  const filasMax = field.filasMax ?? 20

  if (columnas.length === 0) {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          {field.label}
          {field.obligatorio && <span className="ml-1 text-red-400" aria-label="obligatorio">*</span>}
        </label>
        <p className="text-sm text-gray-400 italic">Sin columnas definidas.</p>
      </div>
    )
  }

  const rows = parseRows(value, columnas, filasMin)

  function updateCell(rowIdx: number, colId: string, val: unknown) {
    const next = rows.map((row, i) => i === rowIdx ? { ...row, [colId]: val } : row)
    onChange(next)
  }

  function addRow() {
    if (rows.length >= filasMax) return
    onChange([...rows, emptyRow(columnas)])
  }

  function removeRow(rowIdx: number) {
    const next = rows.filter((_, i) => i !== rowIdx)
    onChange(next)
  }

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">
        {field.label}
        {field.obligatorio && <span className="ml-1 text-red-400" aria-label="obligatorio">*</span>}
      </label>

      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-gray-100">
              {columnas.map((col) => (
                <th
                  key={col.id}
                  className="border border-gray-200 px-3 py-2 text-left text-xs font-semibold text-gray-600 whitespace-nowrap"
                  style={col.ancho ? { width: `${col.ancho}%` } : undefined}
                >
                  {col.label}
                </th>
              ))}
              {/* Delete column header */}
              <th className="w-8 border border-gray-200 bg-gray-100" aria-label="Eliminar fila" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`group ${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50/30 transition-colors`}
              >
                {columnas.map((col) => (
                  <td key={col.id} className="border border-gray-200 px-3 py-1.5">
                    <CellInput
                      col={col}
                      value={row[col.id]}
                      onChange={(v) => updateCell(rowIdx, col.id, v)}
                    />
                  </td>
                ))}
                <td className="border border-gray-200 px-1 text-center">
                  <button
                    onClick={() => removeRow(rowIdx)}
                    className="rounded p-1 text-gray-300 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 transition-all"
                    title="Eliminar fila"
                    type="button"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <button
        onClick={addRow}
        disabled={rows.length >= filasMax}
        type="button"
        className="mt-2 flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="h-3.5 w-3.5" />
        Agregar fila
      </button>

      {error && (
        <p role="alert" className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
