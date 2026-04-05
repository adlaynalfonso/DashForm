import { AlertCircle, CheckCircle2 } from 'lucide-react'

// ── FieldError ────────────────────────────────────────────────────────────────
// Inline error message displayed below individual fields.

interface FieldErrorProps {
  error?: string | null
  id?: string
}

export function FieldError({ error, id }: FieldErrorProps) {
  if (!error) return null
  return (
    <p
      id={id}
      role="alert"
      className="flex items-center gap-1.5 text-xs text-red-600"
    >
      <AlertCircle className="h-3.5 w-3.5 shrink-0" />
      {error}
    </p>
  )
}

// ── ValidationFeedback ────────────────────────────────────────────────────────
// Summary badge shown near the export / complete button.
// Shows total pending errors or a green "all correct" indicator.

interface ValidationFeedbackProps {
  errores: Record<string, string>
  /** When true, always render something (even when there are no errors). Default: true */
  showWhenValid?: boolean
}

export function ValidationFeedback({ errores, showWhenValid = true }: ValidationFeedbackProps) {
  const count = Object.values(errores).filter(Boolean).length

  if (count === 0) {
    if (!showWhenValid) return null
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-green-600">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Todo correcto
      </span>
    )
  }

  return (
    <span className="flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
      <AlertCircle className="h-3 w-3" />
      {count} {count === 1 ? 'error' : 'errores'} pendiente{count !== 1 ? 's' : ''}
    </span>
  )
}
