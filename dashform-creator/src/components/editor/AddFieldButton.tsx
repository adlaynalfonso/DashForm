import { useState, useRef, useEffect } from 'react'
import {
  Plus,
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
} from 'lucide-react'
import type { FieldType } from '@/types/template'

const FIELD_OPTIONS: { tipo: FieldType; label: string; icon: React.ReactNode }[] = [
  { tipo: 'texto',            label: 'Texto',          icon: <Type className="h-4 w-4" /> },
  { tipo: 'texto-expandible', label: 'Texto largo',    icon: <AlignLeft className="h-4 w-4" /> },
  { tipo: 'email',            label: 'Email',          icon: <Mail className="h-4 w-4" /> },
  { tipo: 'telefono',         label: 'Teléfono',       icon: <Phone className="h-4 w-4" /> },
  { tipo: 'checkbox',         label: 'Checkbox',       icon: <CheckSquare className="h-4 w-4" /> },
  { tipo: 'radio',            label: 'Opción única',   icon: <CircleDot className="h-4 w-4" /> },
  { tipo: 'select',           label: 'Desplegable',    icon: <ChevronDown className="h-4 w-4" /> },
  { tipo: 'fecha',            label: 'Fecha',          icon: <Calendar className="h-4 w-4" /> },
  { tipo: 'firma-digital',    label: 'Firma digital',  icon: <Pen className="h-4 w-4" /> },
  { tipo: 'firma-texto',      label: 'Firma escrita',  icon: <PenLine className="h-4 w-4" /> },
]

interface AddFieldButtonProps {
  onAdd: (tipo: FieldType) => void
  disabled?: boolean
}

export function AddFieldButton({ onAdd, disabled }: AddFieldButtonProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  function handleSelect(tipo: FieldType) {
    onAdd(tipo)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        className="flex items-center gap-2 rounded-lg border border-dashed border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-500 hover:border-blue-400 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <Plus className="h-4 w-4" />
        Añadir Campo
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-20 mt-1.5 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
          <p className="px-3 py-2 text-xs font-medium uppercase tracking-wide text-gray-400">
            Tipo de campo
          </p>
          {FIELD_OPTIONS.map(({ tipo, label, icon }) => (
            <button
              key={tipo}
              onClick={() => handleSelect(tipo)}
              className="flex w-full items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700"
            >
              <span className="text-gray-400">{icon}</span>
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
