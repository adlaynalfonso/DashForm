import { useState } from 'react'
import { Check, Image, ImageOff } from 'lucide-react'
import type { PdfConfig } from '@/types/template'

// ── Template definitions ──────────────────────────────────────────────────────

type TemplateId = 'moderno-minimalista' | 'corporativo' | 'compacto'

interface TemplateOption {
  id: TemplateId
  label: string
  description: string
  preview: React.ReactNode
}

function MinimalistPreview({ color }: { color: string }) {
  return (
    <div className="flex h-full flex-col gap-1.5 p-2">
      <div className="h-1.5 w-14 rounded-full" style={{ backgroundColor: color }} />
      <div className="h-px w-full bg-gray-200" />
      <div className="space-y-1">
        <div className="h-1 w-10 rounded-full bg-gray-300" />
        <div className="h-2 w-full rounded bg-gray-100" />
      </div>
      <div className="space-y-1">
        <div className="h-1 w-8 rounded-full bg-gray-300" />
        <div className="h-2 w-full rounded bg-gray-100" />
      </div>
      <div className="mt-auto flex justify-end">
        <div className="h-2 w-8 rounded" style={{ backgroundColor: color }} />
      </div>
    </div>
  )
}

function CorporatePreview({ color }: { color: string }) {
  return (
    <div className="flex h-full flex-col">
      {/* Header band */}
      <div className="flex items-center gap-1 px-2 py-1.5" style={{ backgroundColor: color }}>
        <div className="h-2 w-2 rounded-sm bg-white/80" />
        <div className="h-1 w-10 rounded-full bg-white/70" />
      </div>
      <div className="flex flex-1 flex-col gap-1 p-2">
        <div className="h-1.5 w-12 rounded-full bg-gray-400" />
        <div className="space-y-0.5">
          <div className="h-1 w-8 rounded-full bg-gray-300" />
          <div className="h-2 w-full rounded bg-gray-100" />
        </div>
        <div className="space-y-0.5">
          <div className="h-1 w-10 rounded-full bg-gray-300" />
          <div className="h-2 w-full rounded bg-gray-100" />
        </div>
        <div className="mt-auto h-px w-full bg-gray-200" />
        <div className="h-1 w-16 rounded-full bg-gray-300" />
      </div>
    </div>
  )
}

function CompactPreview({ color }: { color: string }) {
  return (
    <div className="flex h-full flex-col gap-1.5 p-2">
      <div className="flex items-center justify-between">
        <div className="h-1.5 w-10 rounded-full bg-gray-800" />
        <div className="h-px w-8 bg-gray-800" />
      </div>
      <div className="h-px w-full bg-gray-800" />
      <div className="grid grid-cols-2 gap-1">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="space-y-0.5">
            <div className="h-0.5 w-5 rounded-full bg-gray-400" />
            <div className="h-1.5 w-full rounded bg-gray-100 border border-gray-200" />
          </div>
        ))}
      </div>
      <div className="mt-auto flex justify-center">
        <div className="h-1.5 w-10 rounded-full" style={{ backgroundColor: color }} />
      </div>
    </div>
  )
}

const TEMPLATE_OPTIONS: TemplateOption[] = [
  {
    id: 'moderno-minimalista',
    label: 'Moderno Minimalista',
    description: 'Limpio, sans-serif, espaciado generoso',
    preview: null, // filled dynamically
  },
  {
    id: 'corporativo',
    label: 'Corporativo',
    description: 'Encabezado de color, serif + sans-serif',
    preview: null,
  },
  {
    id: 'compacto',
    label: 'Compacto',
    description: 'Blanco/negro, layout de dos columnas',
    preview: null,
  },
]

// ── Shared input style ────────────────────────────────────────────────────────

const inputCls =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 placeholder:text-gray-300'

// ── Logo preview ──────────────────────────────────────────────────────────────

function LogoPreview({ url }: { url: string }) {
  const [valid, setValid] = useState(true)

  if (!url) return null

  return (
    <div className="mt-2 flex items-center gap-2">
      {valid ? (
        <img
          src={url}
          alt="Logo preview"
          onError={() => setValid(false)}
          onLoad={() => setValid(true)}
          className="h-10 max-w-[120px] rounded border border-gray-200 object-contain p-1"
        />
      ) : (
        <div className="flex items-center gap-1.5 rounded-lg border border-red-100 bg-red-50 px-3 py-2 text-xs text-red-500">
          <ImageOff className="h-3.5 w-3.5" />
          URL de imagen no válida
        </div>
      )}
    </div>
  )
}

// ── Section title ─────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400">
      {children}
    </p>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

interface PdfConfigPanelProps {
  pdfConfig: PdfConfig
  onUpdate: (partial: Partial<PdfConfig>) => void
}

export function PdfConfigPanel({ pdfConfig, onUpdate }: PdfConfigPanelProps) {
  const selectedTemplate = (pdfConfig.template as TemplateId) || 'moderno-minimalista'
  const color = pdfConfig.colorTema || '#3b82f6'

  const previews: Record<TemplateId, React.ReactNode> = {
    'moderno-minimalista': <MinimalistPreview color={color} />,
    'corporativo': <CorporatePreview color={color} />,
    'compacto': <CompactPreview color={color} />,
  }

  return (
    <div className="space-y-8 px-1">

      {/* ── Template selector ────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Plantilla de diseño</SectionTitle>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {TEMPLATE_OPTIONS.map((opt) => {
            const isSelected = selectedTemplate === opt.id
            return (
              <button
                key={opt.id}
                onClick={() => onUpdate({ template: opt.id })}
                className={`relative flex flex-col rounded-xl border-2 text-left transition-all ${
                  isSelected
                    ? 'border-blue-500 shadow-sm shadow-blue-100'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* Mini-preview */}
                <div className="h-24 w-full overflow-hidden rounded-t-[10px] bg-gray-50">
                  {previews[opt.id]}
                </div>

                {/* Label */}
                <div className="px-3 py-2.5">
                  <p className={`text-xs font-semibold ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                    {opt.label}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{opt.description}</p>
                </div>

                {/* Selected checkmark */}
                {isSelected && (
                  <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500">
                    <Check className="h-3 w-3 text-white" />
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </section>

      {/* ── Color tema ───────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Color tema</SectionTitle>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              type="color"
              value={color}
              onChange={(e) => onUpdate({ colorTema: e.target.value })}
              className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 p-0.5"
              title="Seleccionar color"
            />
          </div>
          <input
            type="text"
            value={color}
            onChange={(e) => {
              const v = e.target.value
              if (/^#[0-9a-fA-F]{0,6}$/.test(v)) onUpdate({ colorTema: v })
            }}
            maxLength={7}
            className="w-28 rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm text-gray-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            placeholder="#3b82f6"
            spellCheck={false}
          />
          <div
            className="h-9 w-9 shrink-0 rounded-lg border border-gray-200 shadow-inner"
            style={{ backgroundColor: color }}
            title="Vista previa del color"
          />
          {/* Quick palette */}
          <div className="flex items-center gap-1.5">
            {['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#1e293b'].map((c) => (
              <button
                key={c}
                onClick={() => onUpdate({ colorTema: c })}
                title={c}
                className={`h-5 w-5 rounded-full border-2 transition-transform hover:scale-110 ${
                  color === c ? 'border-gray-700 scale-110' : 'border-transparent'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── Logo ─────────────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Logo</SectionTitle>
        <div>
          <label className="mb-1.5 block text-xs font-medium text-gray-600">
            URL de la imagen
          </label>
          <div className="flex items-center gap-2">
            <Image className="h-4 w-4 shrink-0 text-gray-400" />
            <input
              type="url"
              value={pdfConfig.logoUrl ?? ''}
              onChange={(e) =>
                onUpdate({ logoUrl: e.target.value || undefined })
              }
              className={inputCls}
              placeholder="https://ejemplo.com/logo.png"
              spellCheck={false}
            />
          </div>
          <LogoPreview url={pdfConfig.logoUrl ?? ''} />
        </div>
      </section>

      {/* ── Encabezado ───────────────────────────────────────────────────── */}
      <section>
        <SectionTitle>Encabezado y pie de página</SectionTitle>
        <div className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Encabezado personalizado
            </label>
            <input
              type="text"
              value={pdfConfig.encabezado ?? ''}
              onChange={(e) =>
                onUpdate({ encabezado: e.target.value || undefined })
              }
              className={inputCls}
              placeholder="Ej. Empresa S.A. — Documento confidencial"
              maxLength={120}
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-medium text-gray-600">
              Pie de página personalizado
            </label>
            <input
              type="text"
              value={pdfConfig.piePagina ?? ''}
              onChange={(e) =>
                onUpdate({ piePagina: e.target.value || undefined })
              }
              className={inputCls}
              placeholder="Ej. © 2025 Empresa S.A. — Todos los derechos reservados"
              maxLength={120}
            />
          </div>
        </div>
      </section>

    </div>
  )
}
