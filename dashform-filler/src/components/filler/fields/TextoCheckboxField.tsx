import type { Field } from '@/types/template'
import { FieldWrapper } from '../FieldWrapper'

export interface TextoCheckboxValue {
  checked: boolean
  texto: string
}

interface Props {
  field: Field
  value: unknown
  onChange: (value: TextoCheckboxValue) => void
  error?: string
}

function parseValue(value: unknown): TextoCheckboxValue {
  if (value && typeof value === 'object' && 'checked' in value) {
    const v = value as { checked?: boolean; texto?: string }
    return { checked: !!v.checked, texto: v.texto ?? '' }
  }
  return { checked: false, texto: '' }
}

export function TextoCheckboxField({ field, value, onChange, error }: Props) {
  const current = parseValue(value)

  function handleCheckbox(checked: boolean) {
    onChange({ checked, texto: current.texto })
  }

  function handleTexto(texto: string) {
    onChange({ checked: current.checked, texto })
  }

  return (
    <FieldWrapper field={field} error={error}>
      <div className="flex items-center gap-3">
        <input
          id={`${field.id}-check`}
          type="checkbox"
          checked={current.checked}
          onChange={(e) => handleCheckbox(e.target.checked)}
          className="h-4 w-4 shrink-0 rounded border-gray-300 accent-blue-500 cursor-pointer"
        />
        <input
          id={field.id}
          type="text"
          value={current.texto}
          disabled={!current.checked}
          onChange={(e) => handleTexto(e.target.value)}
          placeholder={field.placeholder ?? 'Escriba aquí...'}
          aria-invalid={!!error}
          aria-describedby={error ? `${field.id}-error` : undefined}
          className={`flex-1 rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
            !current.checked
              ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
              : error
                ? 'border-red-300 bg-red-50 text-gray-900 focus:border-red-400 focus:ring-red-100'
                : 'border-gray-200 bg-white text-gray-900 focus:border-blue-400 focus:ring-blue-100'
          }`}
        />
      </div>
    </FieldWrapper>
  )
}
