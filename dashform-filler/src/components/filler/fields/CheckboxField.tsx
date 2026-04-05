import type { Field } from '@/types/template'
import { AlertCircle } from 'lucide-react'

interface Props {
  field: Field
  value: unknown
  onChange: (value: boolean) => void
  error?: string
}

export function CheckboxField({ field, value, onChange, error }: Props) {
  const checked = value === true

  return (
    <div className="flex flex-col gap-1.5">
      <label className="flex cursor-pointer items-start gap-3 rounded-xl border px-3.5 py-3 transition-colors hover:bg-gray-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-blue-100">
        <input
          id={field.id}
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          aria-invalid={!!error}
          aria-describedby={error ? `${field.id}-error` : undefined}
          className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded accent-blue-600 focus:outline-none"
        />
        <span className="text-sm text-gray-800">
          {field.label}
          {field.obligatorio && <span className="ml-1 text-red-500">*</span>}
        </span>
      </label>

      {error && (
        <p id={`${field.id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
