import { useState, useEffect, useRef } from 'react'
import type { FilledForm } from '@/types/filledForm'
import { updateFilledForm } from '@/utils/db'

// ── Types ─────────────────────────────────────────────────────────────────────

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions {
  /** Milliseconds to wait after the last change before saving. Default: 2000 */
  debounceMs?: number
}

interface UseAutoSaveReturn {
  status: SaveStatus
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SAVED_DISPLAY_MS = 2500

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Debounced auto-save for a FilledForm.
 *
 * Watches `form` for reference changes (recreate with useMemo on data
 * changes upstream) and persists to IndexedDB after `debounceMs` ms of
 * inactivity.  Returns a `status` flag for the UI indicator.
 */
export function useAutoSave(
  form: FilledForm | null,
  { debounceMs = 2000 }: UseAutoSaveOptions = {},
): UseAutoSaveReturn {
  const [status, setStatus] = useState<SaveStatus>('idle')

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const savedResetRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mountedRef = useRef(true)

  // Track mounted state to avoid state updates after unmount
  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  // Cleanup both timers on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      if (savedResetRef.current) clearTimeout(savedResetRef.current)
    }
  }, [])

  useEffect(() => {
    // Nothing to save yet (loading or no form)
    if (!form?.id) return

    // Clear any pending save and "saved" display
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (savedResetRef.current) clearTimeout(savedResetRef.current)

    debounceRef.current = setTimeout(async () => {
      if (!mountedRef.current) return
      setStatus('saving')

      try {
        await updateFilledForm(form)

        if (!mountedRef.current) return
        setStatus('saved')

        savedResetRef.current = setTimeout(() => {
          if (mountedRef.current) setStatus('idle')
        }, SAVED_DISPLAY_MS)
      } catch {
        if (mountedRef.current) setStatus('error')
      }
    }, debounceMs)

    // Cleanup: cancel debounce if form changes before the timer fires
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [form, debounceMs])

  return { status }
}
