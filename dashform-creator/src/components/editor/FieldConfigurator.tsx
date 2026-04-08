import { useRef, useEffect } from 'react'
import {
  X,
  Type,
  AlignLeft,
  Mail,
  Phone,
  CheckSquare,
  CircleDot,
  ChevronDown,
  Calendar,
  PenLine,
  Pen,
  Plus,
  Trash2,
  Hash,
  ListChecks,
  Heading,
  Table2,
} from 'lucide-react'
import { v4 as uuid } from 'uuid'
import type { Field, FieldType, FieldValidation, TablaColumna } from '@/types/template'

// ── Type metadata ─────────────────────────────────────────────────────────────

const FIELD_META: Record<FieldType, { label: string; icon: React.ReactNode; color: string }> = {
  'texto':            { label: 'Texto',          icon: <Type className="h-4 w-4" />,        color: 'bg-blue-100 text-blue-600' },
  'texto-expandible': { label: 'Texto largo',    icon: <AlignLeft className="h-4 w-4" />,   color: 'bg-blue-100 text-blue-600' },
  'email':            { label: 'Email',          icon: <Mail className="h-4 w-4" />,        color: 'bg-violet-100 text-violet-600' },
  'telefono':         { label: 'Teléfono',       icon: <Phone className="h-4 w-4" />,       color: 'bg-violet-100 text-violet-600' },
  'checkbox':         { label: 'Checkbox',       icon: <CheckSquare className="h-4 w-4" />, color: 'bg-green-100 text-green-600' },
  'radio':            { label: 'Opción única',   icon: <CircleDot className="h-4 w-4" />,   color: 'bg-orange-100 text-orange-600' },
  'select':           { label: 'Desplegable',    icon: <ChevronDown className="h-4 w-4" />, color: 'bg-orange-100 text-orange-600' },
  'fecha':            { label: 'Fecha',          icon: <Calendar className="h-4 w-4" />,    color: 'bg-cyan-100 text-cyan-600' },
  'firma-digital':    { label: 'Firma digital',      icon: <Pen className="h-4 w-4" />,         color: 'bg-pink-100 text-pink-600' },
  'firma-texto':      { label: 'Firma escrita',      icon: <PenLine className="h-4 w-4" />,     color: 'bg-pink-100 text-pink-600' },
  'numero':           { label: 'Número',             icon: <Hash className="h-4 w-4" />,        color: 'bg-emerald-100 text-emerald-600' },
  'texto-checkbox':   { label: 'Texto + Checkbox',   icon: <ListChecks className="h-4 w-4" />,  color: 'bg-orange-100 text-orange-600' },
  'encabezado':       { label: 'Encabezado',         icon: <Heading className="h-4 w-4" />,     color: 'bg-purple-100 text-purple-600' },
  'tabla':            { label: 'Tabla',              icon: <Table2 className="h-4 w-4" />,      color: 'bg-indigo-100 text-indigo-600' },
}

const TEXT_TYPES: FieldType[] = ['texto', 'texto-expandible', 'email', 'telefono']
const OPTION_TYPES: FieldType[] = ['radio', 'select']

const REGEX_EXAMPLES: Partial<Record<FieldType, string>> = {
  'email':    '^[\\w.-]+@[\\w.-]+\\.[a-z]{2,}$',
  'telefono': '^\\+?[0-9\\s\\-]{7,15}$',
  'texto':    '^[A-Za-z0-9 ]+$',
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  )
}

function InputRow({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium text-gray-600">{label}</label>
      {children}
    </div>
  )
}

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300'

// ── Main component ────────────────────────────────────────────────────────────

interface FieldConfiguratorProps {
  field: Field
  sectionId: string
  onUpdate: (sectionId: string, field: Field) => void
  onClose: () => void
}

export function FieldConfigurator({
  field,
  sectionId,
  onUpdate,
  onClose,
}: FieldConfiguratorProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  // Close on outside click
  useEffect(() => {
    function onMouse(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    // Delay so the click that opened the panel doesn't immediately close it
    const id = setTimeout(() => document.addEventListener('mousedown', onMouse), 100)
    return () => {
      clearTimeout(id)
      document.removeEventListener('mousedown', onMouse)
    }
  }, [onClose])

  // ── Helpers ─────────────────────────────────────────────────────────────

  function patch(partial: Partial<Field>) {
    onUpdate(sectionId, { ...field, ...partial })
  }

  function patchValidation(partial: Partial<FieldValidation>) {
    onUpdate(sectionId, {
      ...field,
      validacion: { ...field.validacion, ...partial },
    })
  }

  function clearValidationKey(key: keyof FieldValidation) {
    if (!field.validacion) return
    const next = { ...field.validacion }
    delete next[key]
    const isEmpty = Object.keys(next).every((k) => next[k as keyof FieldValidation] == null || next[k as keyof FieldValidation] === '')
    onUpdate(sectionId, { ...field, validacion: isEmpty ? undefined : next })
  }

  // Options helpers
  function addOption() {
    patch({ opciones: [...(field.opciones ?? []), `Opción ${(field.opciones?.length ?? 0) + 1}`] })
  }

  function updateOption(idx: number, value: string) {
    const opciones = [...(field.opciones ?? [])]
    opciones[idx] = value
    patch({ opciones })
  }

  function removeOption(idx: number) {
    patch({ opciones: (field.opciones ?? []).filter((_, i) => i !== idx) })
  }

  const meta = FIELD_META[field.tipo]
  const hasTextValidation = TEXT_TYPES.includes(field.tipo)
  const hasOptions = OPTION_TYPES.includes(field.tipo)
  const isEncabezado = field.tipo === 'encabezado'
  const isNumero = field.tipo === 'numero'
  const isTabla = field.tipo === 'tabla'

  // ── Tabla column helpers ─────────────────────────────────────────────────
  function addColumna() {
    const columnas: TablaColumna[] = [
      ...(field.columnas ?? []),
      { id: uuid(), label: `Columna ${(field.columnas?.length ?? 0) + 1}`, tipo: 'texto' },
    ]
    patch({ columnas })
  }

  function updateColumna(idx: number, partial: Partial<TablaColumna>) {
    const columnas = (field.columnas ?? []).map((c, i) => i === idx ? { ...c, ...partial } : c)
    patch({ columnas })
  }

  function removeColumna(idx: number) {
    patch({ columnas: (field.columnas ?? []).filter((_, i) => i !== idx) })
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-30 bg-black/10" aria-hidden />

      {/* Sliding panel */}
      <aside
        ref={panelRef}
        className="fixed right-0 top-0 z-40 flex h-full w-full max-w-sm flex-col border-l border-gray-200 bg-white shadow-2xl"
        style={{ animation: 'slideIn 180ms ease-out' }}
      >
        {/* Panel header */}
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-4">
          <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${meta.color}`}>
            {meta.icon}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {field.label || 'Campo sin nombre'}
            </p>
            <p className="text-xs text-gray-400">{meta.label}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
            title="Cerrar (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 space-y-6 overflow-y-auto px-5 py-5">

          {/* ── General ─────────────────────────────────────────────────── */}
          <section>
            <SectionTitle>General</SectionTitle>
            <div className="space-y-3">
              <InputRow label="Etiqueta (label)">
                <input
                  className={inputCls}
                  value={field.label}
                  onChange={(e) => patch({ label: e.target.value })}
                  placeholder="Ej. Nombre completo"
                />
              </InputRow>

              {!isEncabezado && !isTabla && (
                <InputRow label="Placeholder">
                  <input
                    className={inputCls}
                    value={field.placeholder ?? ''}
                    onChange={(e) =>
                      patch({ placeholder: e.target.value || undefined })
                    }
                    placeholder="Texto de ayuda dentro del campo"
                  />
                </InputRow>
              )}

              {/* Obligatorio toggle — not shown for encabezado */}
              {!isEncabezado && (
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Obligatorio</p>
                    <p className="text-xs text-gray-400">El usuario debe rellenarlo</p>
                  </div>
                  <button
                    role="switch"
                    aria-checked={field.obligatorio}
                    onClick={() => patch({ obligatorio: !field.obligatorio })}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                      field.obligatorio ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                        field.obligatorio ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              )}
            </div>
          </section>

          {/* ── Encabezado: nivel ────────────────────────────────────────── */}
          {isEncabezado && (
            <section>
              <SectionTitle>Nivel</SectionTitle>
              <div className="flex gap-2">
                {([1, 2, 3] as const).map((n) => (
                  <button
                    key={n}
                    onClick={() => patch({ nivelEncabezado: n })}
                    className={`flex-1 rounded-lg border py-2 text-sm font-medium transition-colors ${
                      (field.nivelEncabezado ?? 2) === n
                        ? 'border-purple-400 bg-purple-50 text-purple-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    H{n}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* ── Número: min / max / step ─────────────────────────────────── */}
          {isNumero && (
            <section>
              <SectionTitle>Configuración numérica</SectionTitle>
              <div className="grid grid-cols-3 gap-3">
                <InputRow label="Mínimo">
                  <input
                    type="number"
                    className={inputCls}
                    value={field.min ?? ''}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      patch({ min: isNaN(v) ? undefined : v })
                    }}
                    placeholder="—"
                  />
                </InputRow>
                <InputRow label="Máximo">
                  <input
                    type="number"
                    className={inputCls}
                    value={field.max ?? ''}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      patch({ max: isNaN(v) ? undefined : v })
                    }}
                    placeholder="—"
                  />
                </InputRow>
                <InputRow label="Paso">
                  <input
                    type="number"
                    min={0}
                    className={inputCls}
                    value={field.step ?? ''}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value)
                      patch({ step: isNaN(v) ? undefined : v })
                    }}
                    placeholder="1"
                  />
                </InputRow>
              </div>
            </section>
          )}

          {/* ── Tabla: columnas + filas ─────────────────────────────────── */}
          {isTabla && (
            <section>
              <SectionTitle>Columnas</SectionTitle>
              <div className="space-y-3">
                {(field.columnas ?? []).map((col, idx) => (
                  <div key={col.id} className="rounded-lg border border-gray-200 p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 w-5 text-right shrink-0">{idx + 1}.</span>
                      <input
                        className={`${inputCls} flex-1`}
                        value={col.label}
                        onChange={(e) => updateColumna(idx, { label: e.target.value })}
                        placeholder="Nombre de columna"
                      />
                      <button
                        onClick={() => removeColumna(idx)}
                        disabled={(field.columnas?.length ?? 0) <= 1}
                        className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30 shrink-0"
                        title="Eliminar columna"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex gap-2 pl-7">
                      <div className="flex-1">
                        <label className="mb-1 block text-xs font-medium text-gray-500">Tipo</label>
                        <select
                          className={inputCls}
                          value={col.tipo}
                          onChange={(e) => updateColumna(idx, { tipo: e.target.value as TablaColumna['tipo'], opciones: undefined })}
                        >
                          <option value="texto">Texto</option>
                          <option value="checkbox">Checkbox</option>
                          <option value="fecha">Fecha</option>
                          <option value="select">Desplegable</option>
                        </select>
                      </div>
                      <div className="w-20">
                        <label className="mb-1 block text-xs font-medium text-gray-500">Ancho %</label>
                        <input
                          type="number"
                          min={5}
                          max={100}
                          className={inputCls}
                          value={col.ancho ?? ''}
                          onChange={(e) => {
                            const v = parseInt(e.target.value)
                            updateColumna(idx, { ancho: isNaN(v) ? undefined : v })
                          }}
                          placeholder="auto"
                        />
                      </div>
                    </div>
                    {col.tipo === 'select' && (
                      <div className="pl-7 space-y-1">
                        <label className="block text-xs font-medium text-gray-500">Opciones (una por línea)</label>
                        <textarea
                          className={`${inputCls} resize-none`}
                          rows={3}
                          value={(col.opciones ?? []).join('\n')}
                          onChange={(e) =>
                            updateColumna(idx, {
                              opciones: e.target.value.split('\n').filter((o) => o.trim()),
                            })
                          }
                          placeholder={"Opción 1\nOpción 2"}
                        />
                      </div>
                    )}
                  </div>
                ))}
                <button
                  onClick={addColumna}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 hover:border-indigo-400 hover:text-indigo-600 w-full justify-center"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Añadir columna
                </button>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Filas mínimas</label>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={field.filasMin ?? ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value)
                      patch({ filasMin: isNaN(v) ? undefined : v })
                    }}
                    placeholder="5"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">Filas máximas</label>
                  <input
                    type="number"
                    min={1}
                    className={inputCls}
                    value={field.filasMax ?? ''}
                    onChange={(e) => {
                      const v = parseInt(e.target.value)
                      patch({ filasMax: isNaN(v) ? undefined : v })
                    }}
                    placeholder="20"
                  />
                </div>
              </div>
            </section>
          )}

          {/* ── Opciones (radio / select) ────────────────────────────────── */}
          {hasOptions && (
            <section>
              <SectionTitle>Opciones</SectionTitle>
              <div className="space-y-2">
                {(field.opciones ?? []).map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}.</span>
                    <input
                      className={`${inputCls} flex-1`}
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      placeholder={`Opción ${idx + 1}`}
                    />
                    <button
                      onClick={() => removeOption(idx)}
                      disabled={(field.opciones?.length ?? 0) <= 1}
                      className="rounded p-1.5 text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-30"
                      title="Eliminar opción"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={addOption}
                  className="flex items-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-xs font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 w-full justify-center"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Añadir opción
                </button>
              </div>
            </section>
          )}

          {/* ── Validación de texto ──────────────────────────────────────── */}
          {hasTextValidation && (
            <section>
              <SectionTitle>Validación</SectionTitle>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <InputRow label="Longitud mínima">
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={field.validacion?.minLength ?? ''}
                      onChange={(e) => {
                        const v = parseInt(e.target.value)
                        if (isNaN(v)) clearValidationKey('minLength')
                        else patchValidation({ minLength: v })
                      }}
                      placeholder="0"
                    />
                  </InputRow>
                  <InputRow label="Longitud máxima">
                    <input
                      type="number"
                      min={0}
                      className={inputCls}
                      value={field.validacion?.maxLength ?? ''}
                      onChange={(e) => {
                        const v = parseInt(e.target.value)
                        if (isNaN(v)) clearValidationKey('maxLength')
                        else patchValidation({ maxLength: v })
                      }}
                      placeholder="∞"
                    />
                  </InputRow>
                </div>

                <InputRow label="Patrón (regex)">
                  <input
                    className={inputCls}
                    value={field.validacion?.pattern ?? ''}
                    onChange={(e) => {
                      if (!e.target.value) clearValidationKey('pattern')
                      else patchValidation({ pattern: e.target.value })
                    }}
                    placeholder={REGEX_EXAMPLES[field.tipo] ?? '^[\\s\\S]+$'}
                    spellCheck={false}
                  />
                  {REGEX_EXAMPLES[field.tipo] && (
                    <p className="mt-1 text-xs text-gray-400">
                      Ej:{' '}
                      <code className="rounded bg-gray-100 px-1 text-gray-500">
                        {REGEX_EXAMPLES[field.tipo]}
                      </code>
                    </p>
                  )}
                </InputRow>
              </div>
            </section>
          )}

          {/* ── Mensaje de error ─────────────────────────────────────────── */}
          {!isEncabezado && !isTabla && (
            <section>
              <SectionTitle>Mensaje de error</SectionTitle>
              <InputRow label="Texto mostrado al fallar la validación">
                <input
                  className={inputCls}
                  value={field.validacion?.mensajeError ?? ''}
                  onChange={(e) => {
                    if (!e.target.value) clearValidationKey('mensajeError')
                    else patchValidation({ mensajeError: e.target.value })
                  }}
                  placeholder="Ej. Este campo es obligatorio"
                />
              </InputRow>
            </section>
          )}
        </div>

        {/* Panel footer */}
        <div className="border-t border-gray-100 px-5 py-4">
          <button
            onClick={onClose}
            className="w-full rounded-lg border border-gray-200 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cerrar
          </button>
        </div>
      </aside>

      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </>
  )
}
