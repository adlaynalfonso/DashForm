import type { Field } from '@/types/template'
import { FieldWrapper } from '../FieldWrapper'

interface Props {
  field: Field
  value: unknown
  onChange: (value: number | '') => void
  error?: string
}

export function NumeroField({ field, value, onChange, error }: Props) {
  return (
    <FieldWrapper field={field} error={error}>
      <input
        id={field.id}
        type="number"
        min={field.min}
        max={field.max}
        step={field.step ?? 1}
        value={typeof value === 'number' ? value : (value === '' ? '' : '')}
        onChange={(e) => {
          const v = e.target.value
          onChange(v === '' ? '' : parseFloat(v))
        }}
        placeholder={field.placeholder ?? '0'}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.id}-error` : undefined}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
          error
            ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
            : 'border-gray-200 bg-white focus:border-blue-400 focus:ring-blue-100'
        }`}
      />
    </FieldWrapper>
  )
}
