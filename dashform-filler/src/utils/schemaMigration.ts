import type { ValidatedTemplate, ValidatedEditable } from './schemaValidator'

// ── Types ─────────────────────────────────────────────────────────────────────

export type MigratableData = ValidatedTemplate | ValidatedEditable

export interface MigrationResult<T extends MigratableData> {
  success: boolean
  data: T | null
  warnings: string[]
  errors: string[]
}

// ── Version handlers ──────────────────────────────────────────────────────────

/**
 * V1 → V1: no-op, already current.
 * Placeholder that demonstrates the pattern for future handlers.
 */
function migrateV1ToV1<T extends MigratableData>(data: T): MigrationResult<T> {
  return { success: true, data, warnings: [], errors: [] }
}

// Future example:
// function migrateV1ToV2<T extends MigratableData>(data: T): MigrationResult<T> {
//   // transform data from schema v1 to v2 shape
//   // return { success: true, data: transformed, warnings: [], errors: [] }
// }

// ── Version path resolver ─────────────────────────────────────────────────────

type MigrationStep<T extends MigratableData> = (data: T) => MigrationResult<T>

/**
 * Returns the ordered list of migration steps needed to go from `from` to `to`.
 * Each step upgrades by one version.
 */
function resolveMigrationPath<T extends MigratableData>(
  from: number,
  to: number,
): MigrationStep<T>[] {
  if (from === to) return []

  const steps: MigrationStep<T>[] = []

  for (let v = from; v < to; v++) {
    switch (v) {
      case 1:
        // v1 → v2: not yet defined, will be added here when needed
        break
      default:
        // Unknown transition — caller will receive an error
        return []
    }
  }

  return steps
}

// ── migrateSchema ─────────────────────────────────────────────────────────────

export const CURRENT_SCHEMA_VERSION = 1

/**
 * Migrate `data` from `fromVersion` to `toVersion`.
 *
 * - If `fromVersion === toVersion`, returns the data unchanged.
 * - If the path is not yet implemented, returns an error result.
 * - Accumulates warnings from every step so callers can surface them.
 */
export function migrateSchema<T extends MigratableData>(
  data: T,
  fromVersion: number,
  toVersion: number = CURRENT_SCHEMA_VERSION,
): MigrationResult<T> {
  // ── Already at target ────────────────────────────────────────────────────
  if (fromVersion === toVersion) {
    return migrateV1ToV1(data)
  }

  // ── Downgrade not supported ───────────────────────────────────────────────
  if (fromVersion > toVersion) {
    return {
      success: false,
      data: null,
      warnings: [],
      errors: [
        `No es posible bajar la versión del esquema de v${fromVersion} a v${toVersion}. ` +
        `El archivo fue creado con una versión más reciente de DashForm.`,
      ],
    }
  }

  // ── Unknown source version ────────────────────────────────────────────────
  if (fromVersion < 1) {
    return {
      success: false,
      data: null,
      warnings: [],
      errors: [
        `Versión de esquema desconocida: v${fromVersion}. ` +
        `No se puede migrar este archivo.`,
      ],
    }
  }

  // ── Future version ────────────────────────────────────────────────────────
  if (toVersion > CURRENT_SCHEMA_VERSION) {
    return {
      success: false,
      data: null,
      warnings: [],
      errors: [
        `La versión de destino v${toVersion} no está soportada todavía. ` +
        `Actualiza DashForm Filler para abrir este archivo.`,
      ],
    }
  }

  // ── Resolve and apply steps ───────────────────────────────────────────────
  const steps = resolveMigrationPath<T>(fromVersion, toVersion)

  if (steps.length === 0) {
    return {
      success: false,
      data: null,
      warnings: [],
      errors: [
        `La migración de v${fromVersion} a v${toVersion} aún no está implementada.`,
      ],
    }
  }

  let current = data
  const warnings: string[] = []

  for (const step of steps) {
    const result = step(current)
    warnings.push(...result.warnings)

    if (!result.success || result.data === null) {
      return {
        success: false,
        data: null,
        warnings,
        errors: result.errors,
      }
    }

    current = result.data
  }

  return { success: true, data: current, warnings, errors: [] }
}

/**
 * Convenience wrapper: reads the schemaVersion from the data itself
 * and migrates to the current version if needed.
 */
export function migrateToCurrentVersion<T extends MigratableData>(
  data: T,
): MigrationResult<T> {
  const version = data.schemaVersion ?? 1
  return migrateSchema(data, version, CURRENT_SCHEMA_VERSION)
}
