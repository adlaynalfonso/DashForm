import type { Field } from '@/types/template'
import { FieldWrapper } from '../FieldWrapper'
import { ChevronDown } from 'lucide-react'

interface Props {
  field: Field
  value: unknown
  onChange: (value: string) => void
  error?: string
}

export function SelectField({ field, value, onChange, error }: Props) {
  const opciones = field.opciones ?? []

  return (
    <FieldWrapper field={field} error={error}>
      <div className="relative">
        <select
          id={field.id}
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? `${field.id}-error` : undefined}
          className={`w-full appearance-none rounded-xl border px-3.5 py-2.5 pr-9 text-sm outline-none transition-colors focus:ring-2 ${
            value === '' || value === undefined
              ? 'text-gray-400'
              : 'text-gray-900'
          } ${
            error
              ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
              : 'border-gray-200 bg-white focus:border-blue-400 focus:ring-blue-100'
          }`}
        >
          <option value="">{field.placeholder ?? 'Selecciona una opción…'}</option>
          {opciones.map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
      </div>
    </FieldWrapper>
  )
}
