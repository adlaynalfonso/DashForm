import type { Field } from '@/types/template'
import { PenLine } from 'lucide-react'
import { FieldWrapper } from '../FieldWrapper'

interface Props {
  field: Field
  value: unknown
  onChange: (value: string) => void
  error?: string
}

export function SignatureTextField({ field, value, onChange, error }: Props) {
  return (
    <FieldWrapper field={field} error={error}>
      <div className={`relative rounded-xl border transition-colors ${
        error ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50'
      }`}>
        <PenLine className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          id={field.id}
          type="text"
          value={typeof value === 'string' ? value : ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder ?? 'Escribe tu nombre completo…'}
          aria-invalid={!!error}
          aria-describedby={error ? `${field.id}-error` : undefined}
          className={`w-full rounded-xl border-none bg-transparent py-2.5 pl-10 pr-3.5 text-sm italic text-gray-800 outline-none focus:ring-2 focus:ring-inset placeholder:not-italic placeholder:text-gray-400 ${
            error ? 'focus:ring-red-200' : 'focus:ring-blue-100'
          }`}
          style={{ fontFamily: '"Segoe Script", "Brush Script MT", cursive, sans-serif' }}
        />
      </div>
      <p className="text-[11px] text-gray-400">
        Firma escrita — introduce tu nombre completo como firma.
      </p>
    </FieldWrapper>
  )
}
