import { v4 as uuid } from 'uuid'
import type { Section, LayoutRow, SectionLayout } from '@/types/template'

/**
 * Returns a normalized layout for a section.
 * - Removes rows whose field IDs no longer exist in section.campos.
 * - Appends any orphaned campos as solo rows.
 * - If section.layout is empty/absent, builds one row per campo.
 */
export function normalizeLayout(section: Section): SectionLayout {
  const fieldIds = new Set(section.campos.map((f) => f.id))
  const existing = section.layout ?? []

  // Strip ghost IDs; drop fully empty rows
  const cleaned: LayoutRow[] = existing
    .map((row) => ({ ...row, campos: row.campos.filter((id) => fieldIds.has(id)) }))
    .filter((row) => row.campos.length > 0)

  // Find campos not covered by any row
  const covered = new Set(cleaned.flatMap((r) => r.campos))
  const orphans = section.campos.filter((f) => !covered.has(f.id))

  const orphanRows: LayoutRow[] = orphans.map((f) => ({ id: uuid(), campos: [f.id] }))

  return [...cleaned, ...orphanRows]
}

/** Remove a field ID from layout and drop any rows that become empty. */
export function removeFromLayout(layout: SectionLayout, fieldId: string): SectionLayout {
  return layout
    .map((row) => ({ ...row, campos: row.campos.filter((id) => id !== fieldId) }))
    .filter((row) => row.campos.length > 0)
}

/** Move a field from its current row into a target row. */
export function moveFieldToRow(
  layout: SectionLayout,
  fieldId: string,
  targetRowId: string,
): SectionLayout {
  // Remove from current position (drop empty rows)
  const withoutField = removeFromLayout(layout, fieldId)
  // Append to target row
  return withoutField.map((row) =>
    row.id === targetRowId ? { ...row, campos: [...row.campos, fieldId] } : row,
  )
}

/** Extract a field from its row into a new solo row inserted right after. */
export function extractToSoloRow(layout: SectionLayout, fieldId: string): SectionLayout {
  const idx = layout.findIndex((r) => r.campos.includes(fieldId))
  if (idx === -1) return layout

  // Remove from that row
  const updatedRow = { ...layout[idx], campos: layout[idx].campos.filter((id) => id !== fieldId) }
  const newRow: LayoutRow = { id: uuid(), campos: [fieldId] }

  const next = [...layout]
  next[idx] = updatedRow
  // Insert solo row right after; if the original row is now empty, replace it
  if (updatedRow.campos.length === 0) {
    next.splice(idx, 1, newRow)
  } else {
    next.splice(idx + 1, 0, newRow)
  }
  return next
}

/** Returns the IDs of fields that are alone in their own row (eligible to merge). */
export function soloFieldIds(layout: SectionLayout): string[] {
  return layout.filter((r) => r.campos.length === 1).map((r) => r.campos[0])
}

/** Swap two rows by index. */
export function swapRows(layout: SectionLayout, i: number, j: number): SectionLayout {
  const next = [...layout]
  ;[next[i], next[j]] = [next[j], next[i]]
  return next
}
