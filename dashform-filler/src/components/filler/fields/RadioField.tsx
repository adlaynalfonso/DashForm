import type { Field } from '@/types/template'
import { FieldWrapper } from '../FieldWrapper'

interface Props {
  field: Field
  value: unknown
  onChange: (value: string) => void
  error?: string
}

export function RadioField({ field, value, onChange, error }: Props) {
  const opciones = field.opciones ?? []

  return (
    <FieldWrapper field={field} error={error}>
      <div
        role="radiogroup"
        aria-labelledby={`${field.id}-label`}
        aria-describedby={error ? `${field.id}-error` : undefined}
        className="flex flex-col gap-2"
      >
        {opciones.length === 0 ? (
          <p className="text-xs text-gray-400 italic">Sin opciones definidas.</p>
        ) : (
          opciones.map((opcion, i) => (
            <label
              key={i}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border px-3.5 py-2.5 transition-colors hover:bg-gray-50 ${
                value === opcion
                  ? 'border-blue-300 bg-blue-50'
                  : error
                    ? 'border-red-200'
                    : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name={field.id}
                value={opcion}
                checked={value === opcion}
                onChange={() => onChange(opcion)}
                className="h-4 w-4 shrink-0 cursor-pointer accent-blue-600 focus:outline-none"
              />
              <span className="text-sm text-gray-800">{opcion}</span>
            </label>
          ))
        )}
      </div>
    </FieldWrapper>
  )
}
