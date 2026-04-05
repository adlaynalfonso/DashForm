import { useEffect, useRef } from 'react'
import type { Field } from '@/types/template'
import { FieldWrapper } from '../FieldWrapper'

interface Props {
  field: Field
  value: unknown
  onChange: (value: string) => void
  error?: string
}

export function TextExpandibleField({ field, value, onChange, error }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null)

  // Auto-grow height
  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <FieldWrapper field={field} error={error}>
      <textarea
        ref={ref}
        id={field.id}
        rows={3}
        value={typeof value === 'string' ? value : ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder ?? ''}
        aria-invalid={!!error}
        aria-describedby={error ? `${field.id}-error` : undefined}
        className={`w-full resize-none overflow-hidden rounded-xl border px-3.5 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2 ${
          error
            ? 'border-red-300 bg-red-50 focus:border-red-400 focus:ring-red-100'
            : 'border-gray-200 bg-white focus:border-blue-400 focus:ring-blue-100'
        }`}
      />
    </FieldWrapper>
  )
}
