import { CheckCircle2, Circle } from 'lucide-react'
import type { Template } from '@/types/template'
import { isSectionComplete } from '@/hooks/useFormFiller'

interface Props {
  secciones: Template['secciones']
  seccionActual: number
  datos: Record<string, unknown>
  onSelect: (index: number) => void
}

export function SectionTabs({ secciones, seccionActual, datos, onSelect }: Props) {
  if (secciones.length <= 1) return null

  return (
    <nav
      aria-label="Secciones del formulario"
      className="flex items-center gap-0.5 overflow-x-auto border-b border-gray-200 bg-white px-4 scrollbar-none"
    >
      {secciones.map((section, idx) => {
        const complete = isSectionComplete(section, datos)
        const isActive = idx === seccionActual

        return (
          <button
            key={section.id}
            onClick={() => onSelect(idx)}
            className={`flex shrink-0 items-center gap-2 border-b-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ${
              isActive
                ? 'border-blue-600 text-blue-700'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
            aria-current={isActive ? 'step' : undefined}
          >
            {complete ? (
              <CheckCircle2 className={`h-4 w-4 shrink-0 ${isActive ? 'text-green-500' : 'text-green-400'}`} />
            ) : (
              <Circle className={`h-4 w-4 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-300'}`} />
            )}
            <span>{section.nombre}</span>
          </button>
        )
      })}
    </nav>
  )
}
