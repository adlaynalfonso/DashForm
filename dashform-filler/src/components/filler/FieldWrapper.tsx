import type { Field } from '@/types/template'
import { AlertCircle } from 'lucide-react'

interface Props {
  field: Field
  error?: string
  children: React.ReactNode
}

export function FieldWrapper({ field, error, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={field.id} className="flex items-baseline gap-1 text-sm font-medium text-gray-700">
        {field.label}
        {field.obligatorio && (
          <span className="text-red-500" aria-label="obligatorio">*</span>
        )}
      </label>

      {children}

      {error && (
        <p id={`${field.id}-error`} role="alert" className="flex items-center gap-1.5 text-xs text-red-600">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}
