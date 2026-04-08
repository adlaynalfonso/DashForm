import { View, Text } from '@react-pdf/renderer'
import type { Style } from '@react-pdf/types'
import type { Field, TablaColumna } from '@/types/template'

/** True when a field is a tabla type with at least one column. */
export function isTablaField(field: Field): boolean {
  return field.tipo === 'tabla'
}

function formatCellValue(col: TablaColumna, value: unknown): string {
  if (value === null || value === undefined || value === '') return ''
  if (col.tipo === 'checkbox') return value ? '✓' : ''
  if (col.tipo === 'fecha' && typeof value === 'string') {
    try {
      return new Date(value).toLocaleDateString('es-ES', {
        day: '2-digit', month: '2-digit', year: 'numeric',
      })
    } catch {
      return String(value)
    }
  }
  return String(value)
}

interface RenderTablaOptions {
  labelStyle: Style
  theme?: string
}

/**
 * Renders a tabla field as a @react-pdf/renderer table.
 * Used by all three PDF templates to avoid code duplication.
 */
export function renderTablaField(
  field: Field,
  value: unknown,
  { labelStyle }: RenderTablaOptions,
) {
  const columnas = field.columnas ?? []
  const rows = Array.isArray(value) ? (value as Record<string, unknown>[]) : []

  if (columnas.length === 0) {
    return (
      <View>
        <Text style={labelStyle}>{field.label}</Text>
        <Text style={{ fontSize: 8, color: '#9ca3af' }}>—</Text>
      </View>
    )
  }

  // Compute column flex weights from ancho (percentage) or equal distribution
  const totalAncho = columnas.reduce((sum, c) => sum + (c.ancho ?? 0), 0)
  const useAncho = totalAncho > 0
  const colFlex = columnas.map((c) =>
    useAncho ? (c.ancho ?? (100 / columnas.length)) : 1,
  )

  const borderColor = '#d1d5db'
  const headerBg = '#f3f4f6'
  const cellPad = { paddingHorizontal: 4, paddingVertical: 3 }

  return (
    <View style={{ marginBottom: 2 }}>
      <Text style={labelStyle}>{field.label}</Text>

      {/* Header row */}
      <View style={{ flexDirection: 'row', backgroundColor: headerBg, borderWidth: 0.5, borderColor }}>
        {columnas.map((col, idx) => (
          <View
            key={col.id}
            style={{
              flex: colFlex[idx],
              ...cellPad,
              borderRightWidth: idx < columnas.length - 1 ? 0.5 : 0,
              borderRightColor: borderColor,
            }}
          >
            <Text style={{ fontSize: 7, fontFamily: 'Helvetica-Bold', color: '#374151' }}>
              {col.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Data rows */}
      {rows.length === 0 ? (
        <View style={{ flexDirection: 'row', borderWidth: 0.5, borderTopWidth: 0, borderColor }}>
          <View style={{ flex: 1, ...cellPad }}>
            <Text style={{ fontSize: 8, color: '#9ca3af' }}>—</Text>
          </View>
        </View>
      ) : (
        rows.map((row, rowIdx) => (
          <View
            key={rowIdx}
            style={{
              flexDirection: 'row',
              borderWidth: 0.5,
              borderTopWidth: 0,
              borderColor,
              backgroundColor: rowIdx % 2 === 1 ? '#f9fafb' : '#ffffff',
            }}
          >
            {columnas.map((col, colIdx) => (
              <View
                key={col.id}
                style={{
                  flex: colFlex[colIdx],
                  ...cellPad,
                  borderRightWidth: colIdx < columnas.length - 1 ? 0.5 : 0,
                  borderRightColor: borderColor,
                }}
              >
                <Text style={{ fontSize: 8, color: '#111827' }}>
                  {formatCellValue(col, row[col.id]) || ''}
                </Text>
              </View>
            ))}
          </View>
        ))
      )}
    </View>
  )
}
