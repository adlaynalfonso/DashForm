import { useRef, useState } from 'react'
import { Camera } from 'react-camera-pro'
import type { Field } from '@/types/template'
import { FieldWrapper } from '../FieldWrapper'
import {
  Pen,
  Camera as CameraIcon,
  RotateCcw,
  RefreshCw,
  CheckCircle2,
  SwitchCamera,
  ImageOff,
} from 'lucide-react'

// ── Camera ref shape (exposed via useImperativeHandle inside react-camera-pro) ─

interface CameraHandle {
  takePhoto(type?: 'base64url' | 'imgData'): string | ImageData
  switchCamera(): 'user' | 'environment'
  getNumberOfCameras(): number
}

// ── Types ─────────────────────────────────────────────────────────────────────

type SignatureMode = 'draw' | 'photo'
type PhotoPhase = 'camera' | 'captured'

interface Props {
  field: Field
  value: unknown
  onChange: (value: string) => void
  error?: string
}

// ── Common styles ─────────────────────────────────────────────────────────────

const tabBase =
  'flex flex-1 items-center justify-center gap-1.5 border-b-2 py-2 text-sm font-medium transition-colors'
const tabActive = 'border-blue-600 text-blue-700'
const tabInactive = 'border-transparent text-gray-500 hover:text-gray-700'

const btnSecondary =
  'flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors'
const btnPrimary =
  'flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 transition-colors'

// ── SignatureField ─────────────────────────────────────────────────────────────

export function SignatureField({ field, value, onChange, error }: Props) {
  const savedValue = typeof value === 'string' ? value : ''

  // ── State ────────────────────────────────────────────────────────────────
  const [isEditing, setIsEditing] = useState(!savedValue)
  const [mode, setMode] = useState<SignatureMode>('draw')
  const [photoPhase, setPhotoPhase] = useState<PhotoPhase>('camera')
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [hasDrawing, setHasDrawing] = useState(false)
  const [numCameras, setNumCameras] = useState(0)
  const [captureError, setCaptureError] = useState<string | null>(null)

  // ── Canvas drawing refs ──────────────────────────────────────────────────
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)

  // ── Camera ref — typed as unknown, cast at call site ────────────────────
  const cameraRef = useRef<unknown>(null)

  // ── Canvas: coordinate helper ────────────────────────────────────────────

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

  // ── Canvas: drawing events ───────────────────────────────────────────────

  function handleMouseDown(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    drawingRef.current = true
    lastPointRef.current = getPos(e)
  }

  function handleMouseMove(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawingRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return

    const pos = getPos(e)
    if (!pos) return

    ctx.beginPath()
    ctx.moveTo(lastPointRef.current?.x ?? pos.x, lastPointRef.current?.y ?? pos.y)
    ctx.lineTo(pos.x, pos.y)
    ctx.strokeStyle = '#1e293b'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.stroke()

    lastPointRef.current = pos
    setHasDrawing(true)
  }

  function handleMouseUp(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault()
    if (!drawingRef.current) return
    drawingRef.current = false
    lastPointRef.current = null
    const canvas = canvasRef.current
    if (canvas && hasDrawing) {
      onChange(canvas.toDataURL('image/png'))
    }
  }

  function clearCanvas() {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx || !canvas) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawing(false)
    onChange('')
  }

  // ── Photo: capture & confirm ─────────────────────────────────────────────

  function handleCapture() {
    setCaptureError(null)
    try {
      const handle = cameraRef.current as CameraHandle | null
      if (!handle) return
      const result = handle.takePhoto('base64url')
      if (typeof result === 'string') {
        setCapturedPhoto(result)
        setPhotoPhase('captured')
      }
    } catch (err) {
      setCaptureError(err instanceof Error ? err.message : 'Error al capturar la foto.')
    }
  }

  function handleRetake() {
    setCapturedPhoto(null)
    setPhotoPhase('camera')
    setCaptureError(null)
  }

  function handleConfirmPhoto() {
    if (!capturedPhoto) return
    onChange(capturedPhoto)
    setIsEditing(false)
  }

  function handleSwitchCamera() {
    const handle = cameraRef.current as CameraHandle | null
    handle?.switchCamera()
  }

  // ── "Cambiar firma" ──────────────────────────────────────────────────────

  function handleChangeSignature() {
    setIsEditing(true)
    setMode('draw')
    setPhotoPhase('camera')
    setCapturedPhoto(null)
    setCaptureError(null)
    setHasDrawing(false)
  }

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <FieldWrapper field={field} error={error}>
      <div className={`overflow-hidden rounded-xl border transition-colors ${error ? 'border-red-300' : 'border-gray-200'}`}>

        {/* ── Preview mode ──────────────────────────────────────────────── */}
        {!isEditing && savedValue ? (
          <div className="flex flex-col items-center gap-3 bg-gray-50 p-4">
            <img
              src={savedValue}
              alt="Firma guardada"
              className="max-h-[200px] w-full max-w-[400px] rounded-lg border border-gray-200 bg-white object-contain"
            />
            <button type="button" onClick={handleChangeSignature} className={btnSecondary}>
              <RefreshCw className="h-3.5 w-3.5" />
              Cambiar firma
            </button>
          </div>
        ) : (

          /* ── Edit mode ────────────────────────────────────────────────── */
          <div>
            {/* Tab bar */}
            <div className="flex border-b border-gray-200 bg-white">
              <button
                type="button"
                onClick={() => setMode('draw')}
                className={`${tabBase} ${mode === 'draw' ? tabActive : tabInactive}`}
              >
                <Pen className="h-3.5 w-3.5" />
                Dibujar
              </button>
              <button
                type="button"
                onClick={() => setMode('photo')}
                className={`${tabBase} ${mode === 'photo' ? tabActive : tabInactive}`}
              >
                <CameraIcon className="h-3.5 w-3.5" />
                Foto
              </button>
            </div>

            {/* ── Draw tab ──────────────────────────────────────────────── */}
            {mode === 'draw' && (
              <div className="bg-white p-3">
                <div className="relative mx-auto max-w-[400px]">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={200}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleMouseDown}
                    onTouchMove={handleMouseMove}
                    onTouchEnd={handleMouseUp}
                    className="w-full touch-none cursor-crosshair rounded-lg border border-dashed border-gray-200 bg-white"
                    style={{ height: '200px' }}
                    aria-label={`Área de firma para ${field.label}`}
                  />

                  {/* Placeholder */}
                  {!hasDrawing && (
                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-gray-300">
                      <Pen className="h-7 w-7" />
                      <span className="text-xs">Dibuja tu firma aquí</span>
                    </div>
                  )}

                  {/* Clear button */}
                  {hasDrawing && (
                    <button
                      type="button"
                      onClick={clearCanvas}
                      className="absolute right-2 top-2 flex items-center gap-1 rounded-lg bg-white/90 px-2 py-1 text-xs text-gray-500 shadow-sm hover:text-red-500 transition-colors"
                      title="Borrar firma"
                    >
                      <RotateCcw className="h-3 w-3" />
                      Borrar
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* ── Photo tab ─────────────────────────────────────────────── */}
            {mode === 'photo' && (
              <div className="bg-black">
                {photoPhase === 'camera' ? (
                  <div className="flex flex-col">
                    {/* Camera viewport */}
                    <div className="relative mx-auto w-full max-w-[400px]" style={{ height: '220px' }}>
                      <Camera
                        ref={cameraRef}
                        facingMode="environment"
                        aspectRatio="cover"
                        numberOfCamerasCallback={setNumCameras}
                        errorMessages={{
                          noCameraAccessible: 'No se detectó ninguna cámara en este dispositivo.',
                          permissionDenied: 'Permiso de cámara denegado. Actívalo en Ajustes del navegador.',
                          switchCamera: 'No es posible cambiar de cámara.',
                          canvas: 'Error al capturar la imagen.',
                        }}
                      />
                    </div>

                    {/* Camera controls */}
                    <div className="flex items-center justify-center gap-3 bg-gray-900 px-4 py-3">
                      {numCameras > 1 && (
                        <button
                          type="button"
                          onClick={handleSwitchCamera}
                          className="rounded-full bg-gray-700 p-2 text-white hover:bg-gray-600 transition-colors"
                          title="Cambiar cámara"
                        >
                          <SwitchCamera className="h-4 w-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleCapture}
                        className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-gray-900 shadow-lg hover:bg-gray-100 transition-colors"
                        title="Capturar"
                      >
                        <CameraIcon className="h-6 w-6" />
                      </button>
                    </div>

                    {captureError && (
                      <div className="flex items-center gap-2 bg-red-900 px-4 py-2 text-xs text-red-200">
                        <ImageOff className="h-3.5 w-3.5 shrink-0" />
                        {captureError}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Captured preview */
                  <div className="flex flex-col">
                    <div className="relative mx-auto w-full max-w-[400px]" style={{ height: '220px' }}>
                      {capturedPhoto && (
                        <img
                          src={capturedPhoto}
                          alt="Vista previa de la firma"
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-center gap-3 bg-gray-900 px-4 py-3">
                      <button
                        type="button"
                        onClick={handleRetake}
                        className={`${btnSecondary} border-gray-700 bg-gray-800 text-gray-200 hover:bg-gray-700`}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Repetir
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmPhoto}
                        className={`${btnPrimary} bg-green-600 hover:bg-green-700`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Usar esta firma
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </FieldWrapper>
  )
}
