import { useState } from 'react'
import {
  Type,
  AlignLeft,
  Mail,
  Phone,
  CheckSquare,
  CircleDot,
  ChevronDown,
  Calendar,
  Pen,
  PenLine,
  ChevronLeft,
  ChevronRight,
  Hash,
  ListChecks,
  Heading,
} from 'lucide-react'
import type { Field, FieldType, Section, Template } from '@/types/template'
import { normalizeLayout } from '@/utils/layoutHelpers'

// ── Type metadata ─────────────────────────────────────────────────────────────

const FIELD_ICON: Record<FieldType, React.ReactNode> = {
  'texto':            <Type className="h-3.5 w-3.5" />,
  'texto-expandible': <AlignLeft className="h-3.5 w-3.5" />,
  'email':            <Mail className="h-3.5 w-3.5" />,
  'telefono':         <Phone className="h-3.5 w-3.5" />,
  'checkbox':         <CheckSquare className="h-3.5 w-3.5" />,
  'radio':            <CircleDot className="h-3.5 w-3.5" />,
  'select':           <ChevronDown className="h-3.5 w-3.5" />,
  'fecha':            <Calendar className="h-3.5 w-3.5" />,
  'firma-digital':    <Pen className="h-3.5 w-3.5" />,
  'firma-texto':      <PenLine className="h-3.5 w-3.5" />,
  'numero':           <Hash className="h-3.5 w-3.5" />,
  'texto-checkbox':   <ListChecks className="h-3.5 w-3.5" />,
  'encabezado':       <Heading className="h-3.5 w-3.5" />,
}

// ── Base input classes ────────────────────────────────────────────────────────

const inputBase =
  'w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-400 outline-none cursor-not-allowed'

const labelCls = 'mb-1.5 block text-sm font-medium text-gray-700'

// ── Individual field renderers ────────────────────────────────────────────────

function FieldPreview({ field }: { field: Field }) {
  const required = field.obligatorio

  switch (field.tipo) {
    case 'texto':
      return (
        <div>
          <label className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <input
            disabled
            type="text"
            placeholder={field.placeholder ?? 'Texto…'}
            className={inputBase}
          />
        </div>
      )

    case 'texto-expandible':
      return (
        <div>
          <label className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <textarea
            disabled
            rows={3}
            placeholder={field.placeholder ?? 'Escribe aquí…'}
            className={`${inputBase} resize-none`}
          />
        </div>
      )

    case 'email':
      return (
        <div>
          <label className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <input
            disabled
            type="email"
            placeholder={field.placeholder ?? 'correo@ejemplo.com'}
            className={inputBase}
          />
        </div>
      )

    case 'telefono':
      return (
        <div>
          <label className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <input
            disabled
            type="tel"
            placeholder={field.placeholder ?? '+34 600 000 000'}
            className={inputBase}
          />
        </div>
      )

    case 'checkbox':
      return (
        <label className="flex cursor-not-allowed items-start gap-3">
          <input
            disabled
            type="checkbox"
            className="mt-0.5 h-4 w-4 shrink-0 rounded border-gray-300 accent-blue-500"
          />
          <span className="text-sm text-gray-700">
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </span>
        </label>
      )

    case 'radio':
      return (
        <fieldset>
          <legend className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </legend>
          <div className="space-y-2">
            {(field.opciones ?? []).map((opt, i) => (
              <label key={i} className="flex cursor-not-allowed items-center gap-2.5">
                <input
                  disabled
                  type="radio"
                  name={field.id}
                  className="h-4 w-4 shrink-0 border-gray-300 accent-blue-500"
                />
                <span className="text-sm text-gray-600">{opt}</span>
              </label>
            ))}
            {(!field.opciones || field.opciones.length === 0) && (
              <p className="text-xs text-gray-400 italic">Sin opciones definidas</p>
            )}
          </div>
        </fieldset>
      )

    case 'select':
      return (
        <div>
          <label className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <select disabled className={`${inputBase} appearance-none`}>
            <option value="">{field.placeholder ?? 'Selecciona una opción…'}</option>
            {(field.opciones ?? []).map((opt, i) => (
              <option key={i} value={opt}>
                {opt}
              </option>
            ))}
          </select>
        </div>
      )

    case 'fecha':
      return (
        <div>
          <label className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <input disabled type="date" className={inputBase} />
        </div>
      )

    case 'firma-digital':
    case 'firma-texto':
      return (
        <div>
          <label className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <div className="flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 bg-gray-50">
            <div className="flex flex-col items-center gap-1 text-gray-400">
              {field.tipo === 'firma-digital' ? (
                <Pen className="h-5 w-5" />
              ) : (
                <PenLine className="h-5 w-5" />
              )}
              <span className="text-xs">Firma aquí</span>
            </div>
          </div>
        </div>
      )

    case 'numero':
      return (
        <div>
          <label className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <input
            disabled
            type="number"
            min={field.min}
            max={field.max}
            step={field.step ?? 1}
            placeholder={field.placeholder ?? '0'}
            className={inputBase}
          />
        </div>
      )

    case 'texto-checkbox':
      return (
        <div>
          <label className={labelCls}>
            {field.label}
            {required && <span className="ml-1 text-red-400">*</span>}
          </label>
          <div className="flex items-center gap-3">
            <input
              disabled
              type="checkbox"
              className="h-4 w-4 shrink-0 rounded border-gray-300 accent-blue-500"
            />
            <input
              disabled
              type="text"
              placeholder={field.placeholder ?? 'Escriba aquí...'}
              className={`${inputBase} flex-1`}
            />
          </div>
        </div>
      )

    case 'encabezado': {
      const nivel = field.nivelEncabezado ?? 2
      const cls =
        nivel === 1 ? 'text-2xl font-bold text-gray-800' :
        nivel === 2 ? 'text-xl font-semibold text-gray-800' :
                      'text-lg font-medium text-gray-800'
      const Tag = `h${nivel}` as 'h1' | 'h2' | 'h3'
      return <Tag className={cls}>{field.label}</Tag>
    }
  }
}

// ── Section view ──────────────────────────────────────────────────────────────

function SectionView({ section }: { section: Section }) {
  const fieldMap = new Map(section.campos.map((f) => [f.id, f]))
  const layout = normalizeLayout(section)

  return (
    <div className="space-y-6">
      {section.campos.length === 0 ? (
        <p className="py-10 text-center text-sm text-gray-400 italic">
          Esta sección no tiene campos.
        </p>
      ) : (
        layout.map((row) => {
          const rowFields = row.campos.map((id) => fieldMap.get(id)).filter(Boolean) as Field[]
          if (rowFields.length === 0) return null
          return (
            <div key={row.id} className="flex flex-col gap-4 sm:flex-row">
              {rowFields.map((field) => (
                <div key={field.id} className="min-w-0 flex-1">
                  <FieldPreview field={field} />
                </div>
              ))}
            </div>
          )
        })
      )}
    </div>
  )
}

// ── FormPreview (exported, reusable) ──────────────────────────────────────────

interface FormPreviewProps {
  template: Template
}

export function FormPreview({ template }: FormPreviewProps) {
  const [activeIdx, setActiveIdx] = useState(0)

  if (template.secciones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center text-gray-400">
        <Type className="mb-3 h-10 w-10 opacity-30" />
        <p className="text-sm">Esta plantilla no tiene secciones.</p>
      </div>
    )
  }

  const activeSection = template.secciones[activeIdx]
  const total = template.secciones.length

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Section tabs — scrollable on mobile */}
      {total > 1 && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-100 px-4 pt-1 scrollbar-none">
          {template.secciones.map((section, idx) => (
            <button
              key={section.id}
              onClick={() => setActiveIdx(idx)}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm transition-colors whitespace-nowrap ${
                idx === activeIdx
                  ? 'border-blue-600 font-medium text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-800'
              }`}
            >
              {section.nombre}
            </button>
          ))}
        </div>
      )}

      {/* Fields */}
      <div className="px-6 py-6 sm:px-8">
        {total > 1 && (
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-900">
              {activeSection.nombre}
            </h2>
            <span className="text-xs text-gray-400">
              {activeIdx + 1} / {total}
            </span>
          </div>
        )}

        <SectionView section={activeSection} />
      </div>

      {/* Navigation footer — only when multiple sections */}
      {total > 1 && (
        <div className="flex items-center justify-between border-t border-gray-100 px-6 py-4 sm:px-8">
          <button
            onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
            disabled={activeIdx === 0}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
            Anterior
          </button>

          {/* Dot indicators */}
          <div className="flex items-center gap-1.5">
            {template.secciones.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIdx(idx)}
                className={`h-2 w-2 rounded-full transition-colors ${
                  idx === activeIdx ? 'bg-blue-600' : 'bg-gray-200 hover:bg-gray-400'
                }`}
                aria-label={`Sección ${idx + 1}`}
              />
            ))}
          </div>

          <button
            onClick={() => setActiveIdx((i) => Math.min(total - 1, i + 1))}
            disabled={activeIdx === total - 1}
            className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-30"
          >
            Siguiente
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  )
}

// Re-export icon map for external use
export { FIELD_ICON }
