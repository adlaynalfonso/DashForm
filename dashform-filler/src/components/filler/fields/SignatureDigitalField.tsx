import { useRef, useEffect, useState } from 'react'
import type { Field } from '@/types/template'
import { FieldWrapper } from '../FieldWrapper'
import { Pen, RotateCcw } from 'lucide-react'

interface Props {
  field: Field
  value: unknown
  onChange: (value: string) => void
  error?: string
}

export function SignatureDigitalField({ field, value, onChange, error }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawing = useRef(false)
  const lastPoint = useRef<{ x: number; y: number } | null>(null)
  const [hasContent, setHasContent] = useState(!!value)

  // Restore from stored value (base64)
  useEffect(() => {
    if (!canvasRef.current || typeof value !== 'string' || !value) return
    const img = new Image()
    img.onload = () => {
      const ctx = canvasRef.current?.getContext('2d')
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
        ctx.drawImage(img, 0, 0)
      }
    }
    img.src = value
  // only restore on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0]
      if (!touch) return null
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      }
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawing.current = true
    lastPoint.current = getPos(e)
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const pos = getPos(e)
    if (!pos) return

    ctx.beginPath()
    ctx.moveTo(lastPoint.current?.x ?? pos.x, lastPoint.current?.y ?? pos.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    lastPoint.current = pos
    setHasContent(true)
  }

  function endDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawing.current) return
    drawing.current = false
    lastPoint.current = null
    const canvas = canvasRef.current
    if (canvas) onChange(canvas.toDataURL('image/png'))
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasContent(false)
    onChange('')
  }

  return (
    <FieldWrapper field={field} error={error}>
      <div className={`relative rounded-xl border overflow-hidden transition-colors ${
        error ? 'border-red-300' : 'border-gray-200'
      }`}>
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
          className="w-full cursor-crosshair touch-none bg-white"
          aria-label={`Área de firma: ${field.label}`}
        />

        {!hasContent && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1 text-gray-300">
            <Pen className="h-6 w-6" />
            <span className="text-xs">Dibuja tu firma aquí</span>
          </div>
        )}

        <button
          type="button"
          onClick={clearCanvas}
          className="absolute right-2 top-2 rounded-lg bg-white/80 p-1.5 text-gray-400 shadow-sm backdrop-blur-sm hover:bg-white hover:text-gray-600 transition-colors"
          title="Borrar firma"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </FieldWrapper>
  )
}
