import { z } from 'zod'

// ── Field types ───────────────────────────────────────────────────────────────

const VALID_FIELD_TYPES = [
  'texto',
  'texto-expandible',
  'email',
  'telefono',
  'checkbox',
  'radio',
  'select',
  'fecha',
  'firma-digital',
  'firma-texto',
] as const

const FIELD_TYPE_LABELS: Record<(typeof VALID_FIELD_TYPES)[number], string> = {
  'texto': 'Texto',
  'texto-expandible': 'Texto largo',
  'email': 'Email',
  'telefono': 'Teléfono',
  'checkbox': 'Casilla de verificación',
  'radio': 'Opción única',
  'select': 'Desplegable',
  'fecha': 'Fecha',
  'firma-digital': 'Firma digital',
  'firma-texto': 'Firma escrita',
}

// ── Campo schema ──────────────────────────────────────────────────────────────

const campoSchema = z.object({
  id: z
    .string({ error: 'El identificador del campo debe ser texto.' })
    .min(1, 'El identificador del campo no puede estar vacío.'),
  tipo: z
    .enum(VALID_FIELD_TYPES, {
      error: `El tipo de campo no es válido. Tipos permitidos: ${VALID_FIELD_TYPES.join(', ')}.`,
    }),
  label: z
    .string({ error: 'La etiqueta del campo debe ser texto.' })
    .min(1, 'La etiqueta del campo no puede estar vacía.'),
  obligatorio: z
    .boolean({ error: 'El campo "obligatorio" debe ser verdadero o falso.' })
    .optional()
    .default(false),
  placeholder: z.string().optional(),
  opciones: z.array(z.string()).optional(),
  validacion: z
    .object({
      minLength: z.number().int().nonnegative().optional(),
      maxLength: z.number().int().positive().optional(),
      pattern: z.string().optional(),
      mensajeError: z.string().optional(),
    })
    .optional(),
}).passthrough()

// ── Section schema ────────────────────────────────────────────────────────────

const seccionSchema = z.object({
  id: z
    .string({ error: 'El identificador de la sección debe ser texto.' })
    .min(1, 'El identificador de la sección no puede estar vacío.'),
  nombre: z
    .string({ error: 'El nombre de la sección debe ser texto.' })
    .min(1, 'El nombre de la sección no puede estar vacío.'),
  campos: z
    .array(campoSchema, { error: 'Los campos de la sección deben ser una lista.' }),
}).passthrough()

// ── PDF config schema (optional) ──────────────────────────────────────────────

const pdfConfigSchema = z
  .object({
    template: z.string({ error: 'El nombre de la plantilla PDF debe ser texto.' }),
    colorTema: z
      .string({ error: 'El color del tema debe ser texto.' })
      .regex(/^#[0-9a-fA-F]{3,8}$/, 'El color del tema debe ser un color hexadecimal válido (ej. #3b82f6).'),
    logoUrl: z.string().url('La URL del logo no tiene un formato válido.').optional().or(z.literal('')),
    encabezado: z.string().optional(),
    piePagina: z.string().optional(),
  })
  .passthrough()
  .optional()

// ── Template body schema (inner template object) ──────────────────────────────

const templateBodySchema = z.object({
  id: z
    .string({ error: 'El identificador de la plantilla debe ser texto.' })
    .min(1, 'El identificador de la plantilla no puede estar vacío.'),
  nombre: z
    .string({ error: 'El nombre de la plantilla debe ser texto.' })
    .min(1, 'El nombre de la plantilla no puede estar vacío.'),
  descripcion: z
    .string({ error: 'La descripción debe ser texto.' })
    .default(''),
  version: z
    .string({ error: 'La versión debe ser texto.' })
    .default('1.0.0'),
  schemaVersion: z
    .number({ error: 'La versión del esquema debe ser un número.' })
    .int('La versión del esquema debe ser un número entero.')
    .positive('La versión del esquema debe ser mayor que cero.')
    .default(1),
  pdfConfig: pdfConfigSchema,
  secciones: z
    .array(seccionSchema, { error: 'Las secciones deben ser una lista.' })
    .min(1, 'La plantilla debe tener al menos una sección.'),
}).passthrough()

// ── Top-level templateSchema ──────────────────────────────────────────────────

export const templateSchema = z.object({
  type: z.literal('dashform-template', {
    error: 'El archivo no es una plantilla DashForm exportada (falta el campo "type": "dashform-template").',
  }),
  schemaVersion: z
    .number({ error: 'La versión del esquema del archivo debe ser un número.' })
    .int()
    .positive(),
  exportedAt: z.string().optional(),
  template: templateBodySchema,
})

// ── editableSchema ────────────────────────────────────────────────────────────

export const editableSchema = z.object({
  type: z.literal('dashform-editable', {
    error: 'El archivo no es un formulario DashForm exportado (falta el campo "type": "dashform-editable").',
  }),
  schemaVersion: z
    .number({ error: 'La versión del esquema del archivo debe ser un número.' })
    .int()
    .positive(),
  exportedAt: z.string().optional(),
  form: z.object({
    id: z
      .string({ error: 'El identificador del formulario debe ser texto.' })
      .min(1, 'El identificador del formulario no puede estar vacío.'),
    templateId: z
      .string({ error: 'El identificador de la plantilla debe ser texto.' })
      .min(1),
    templateVersion: z.string({ error: 'La versión de la plantilla debe ser texto.' }),
    schemaVersion: z.number({ error: 'La versión del esquema debe ser un número.' }).int().positive(),
    plantilla: templateBodySchema,
    datos: z.record(z.string(), z.unknown()),
    estado: z.union([z.literal('borrador'), z.literal('completado')], {
      error: 'El estado del formulario debe ser "borrador" o "completado".',
    }),
    fechaCreacion: z
      .string({ error: 'La fecha de creación debe ser texto.' })
      .datetime({ offset: true, message: 'La fecha de creación no tiene un formato ISO 8601 válido.' }),
    fechaModificacion: z
      .string({ error: 'La fecha de modificación debe ser texto.' })
      .datetime({ offset: true, message: 'La fecha de modificación no tiene un formato ISO 8601 válido.' }),
  }),
})

// ── Types ─────────────────────────────────────────────────────────────────────

export type ValidatedTemplate = z.infer<typeof templateSchema>
export type ValidatedEditable = z.infer<typeof editableSchema>
export type FieldTypeLabel = typeof FIELD_TYPE_LABELS

// ── Error formatter ───────────────────────────────────────────────────────────

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? `[${issue.path.join(' → ')}]: ` : ''
    return `${path}${issue.message}`
  })
}

// ── validateImportedFile ──────────────────────────────────────────────────────

export type ValidationResult =
  | { valid: true;  type: 'template'; data: ValidatedTemplate; errors: [] }
  | { valid: true;  type: 'editable'; data: ValidatedEditable; errors: [] }
  | { valid: false; type: 'template' | 'editable' | null; data: null; errors: string[] }

export function validateImportedFile(fileContent: string): ValidationResult {
  // ── Parse JSON ─────────────────────────────────────────────────────────────
  let raw: unknown
  try {
    raw = JSON.parse(fileContent)
  } catch {
    return {
      valid: false,
      type: null,
      data: null,
      errors: ['El archivo no es un JSON válido. Comprueba que no esté corrupto o incompleto.'],
    }
  }

  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) {
    return {
      valid: false,
      type: null,
      data: null,
      errors: ['El archivo debe contener un objeto JSON, no un array ni un valor primitivo.'],
    }
  }

  // ── Detect type ────────────────────────────────────────────────────────────
  const rawType = (raw as Record<string, unknown>)['type']

  if (rawType === 'dashform-template') {
    const result = templateSchema.safeParse(raw)
    if (result.success) {
      return { valid: true, type: 'template', data: result.data, errors: [] }
    }
    return {
      valid: false,
      type: 'template',
      data: null,
      errors: formatZodErrors(result.error),
    }
  }

  if (rawType === 'dashform-editable') {
    const result = editableSchema.safeParse(raw)
    if (result.success) {
      return { valid: true, type: 'editable', data: result.data, errors: [] }
    }
    return {
      valid: false,
      type: 'editable',
      data: null,
      errors: formatZodErrors(result.error),
    }
  }

  // ── Unknown type ───────────────────────────────────────────────────────────
  const typeDisplay =
    rawType === undefined
      ? 'ausente'
      : typeof rawType === 'string'
        ? `"${rawType}"`
        : `tipo incorrecto (${typeof rawType})`

  return {
    valid: false,
    type: null,
    data: null,
    errors: [
      `El archivo no es reconocido como un archivo DashForm. ` +
      `Campo "type" ${typeDisplay}. ` +
      `Se esperaba "dashform-template" o "dashform-editable".`,
    ],
  }
}

// Re-export field type info for use in UI
export { VALID_FIELD_TYPES, FIELD_TYPE_LABELS }
