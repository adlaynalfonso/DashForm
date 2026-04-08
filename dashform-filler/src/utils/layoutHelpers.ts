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
