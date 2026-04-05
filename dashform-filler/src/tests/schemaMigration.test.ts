import { describe, it, expect } from 'vitest'
import {
  migrateSchema,
  migrateToCurrentVersion,
  CURRENT_SCHEMA_VERSION,
} from '@/utils/schemaMigration'

// ── Minimal data fixture ──────────────────────────────────────────────────────
// migrateSchema only reads `schemaVersion` from the top-level object; the
// rest of the shape is passed through untouched when migration is a no-op.

function makeV1Data() {
  return {
    type: 'dashform-template' as const,
    schemaVersion: 1,
    template: {
      id: 'tpl-1',
      nombre: 'Test',
      descripcion: '',
      version: '1.0.0',
      schemaVersion: 1,
      secciones: [
        {
          id: 'sec-1',
          nombre: 'Sección',
          campos: [{ id: 'f1', tipo: 'texto' as const, label: 'Campo', obligatorio: false }],
        },
      ],
    },
  }
}

// ── v1 sin cambios ────────────────────────────────────────────────────────────

describe('migrateSchema – v1 sin cambios', () => {
  it('retorna los datos inalterados cuando fromVersion === toVersion === 1', () => {
    const data = makeV1Data()
    const result = migrateSchema(data, 1, 1)
    expect(result.success).toBe(true)
    expect(result.data).toStrictEqual(data)
    expect(result.warnings).toHaveLength(0)
    expect(result.errors).toHaveLength(0)
  })

  it('migrateToCurrentVersion no modifica datos ya en la versión actual', () => {
    const data = makeV1Data()
    const result = migrateToCurrentVersion(data)
    expect(result.success).toBe(true)
    expect(result.data).toStrictEqual(data)
  })

  it('CURRENT_SCHEMA_VERSION es 1', () => {
    expect(CURRENT_SCHEMA_VERSION).toBe(1)
  })
})

// ── Estructura preparada para v2 ──────────────────────────────────────────────

describe('schemaMigration – estructura preparada para v2', () => {
  it('falla con mensaje útil al intentar migrar a v2 (todavía no implementada)', () => {
    const data = makeV1Data()
    const result = migrateSchema(data, 1, 2)
    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
    expect(result.errors.length).toBeGreaterThan(0)
    // Error should mention that v2 is not yet supported
    expect(result.errors[0]).toMatch(/v2/)
  })

  it('falla al intentar bajar la versión de v2 a v1', () => {
    const data = makeV1Data()
    const result = migrateSchema(data, 2, 1)
    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
    expect(result.errors.some((e) => e.includes('bajar'))).toBe(true)
  })

  it('falla con versión de origen desconocida (v0)', () => {
    const data = makeV1Data()
    const result = migrateSchema(data, 0, 1)
    expect(result.success).toBe(false)
    expect(result.data).toBeNull()
  })

  it('resolveMigrationPath devuelve pasos vacíos para v1→v2 (no implementado aún)', () => {
    // Indirect test: migrateSchema(data, 1, 2) must fail, not silently succeed,
    // which means the path resolver returns [] and the caller surfaces an error.
    const data = makeV1Data()
    const result = migrateSchema(data, 1, 2)
    expect(result.success).toBe(false)
  })
})
