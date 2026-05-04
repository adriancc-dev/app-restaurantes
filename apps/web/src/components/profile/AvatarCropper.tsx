'use client'

import { useRef, useEffect, useState, useCallback } from 'react'

interface AvatarCropperProps {
  file: File
  onConfirm: (blob: Blob) => void
  onCancel: () => void
}

const SIZE = 256

export default function AvatarCropper({ file, onConfirm, onCancel }: AvatarCropperProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [image, setImage] = useState<HTMLImageElement | null>(null)
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const fitScale = Math.max(SIZE / img.width, SIZE / img.height)
      setScale(fitScale)
      setOffset({ x: 0, y: 0 })
      setImage(img)
    }
    img.src = url
    return () => URL.revokeObjectURL(url)
  }, [file])

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas || !image) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, SIZE, SIZE)
    ctx.save()
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2, 0, Math.PI * 2)
    ctx.clip()

    const w = image.width * scale
    const h = image.height * scale
    ctx.drawImage(image, (SIZE - w) / 2 + offset.x, (SIZE - h) / 2 + offset.y, w, h)
    ctx.restore()

    ctx.strokeStyle = 'rgba(255,255,255,0.6)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(SIZE / 2, SIZE / 2, SIZE / 2 - 1, 0, Math.PI * 2)
    ctx.stroke()
  }, [image, scale, offset])

  useEffect(() => { draw() }, [draw])

  function onMouseDown(e: React.MouseEvent) {
    setDragging(true)
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y })
  }
  function onMouseMove(e: React.MouseEvent) {
    if (!dragging) return
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  function onMouseUp() { setDragging(false) }

  function onTouchStart(e: React.TouchEvent) {
    const t = e.touches[0]
    if (!t) return
    setDragging(true)
    setDragStart({ x: t.clientX - offset.x, y: t.clientY - offset.y })
  }
  function onTouchMove(e: React.TouchEvent) {
    if (!dragging) return
    const t = e.touches[0]
    if (!t) return
    setOffset({ x: t.clientX - dragStart.x, y: t.clientY - dragStart.y })
  }

  function handleConfirm() {
    canvasRef.current?.toBlob((blob) => { if (blob) onConfirm(blob) }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Ajustar foto de perfil</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Arrastra para reposicionar · desliza el zoom</p>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            width={SIZE}
            height={SIZE}
            style={{ width: SIZE, height: SIZE }}
            className="rounded-full cursor-grab active:cursor-grabbing touch-none bg-gray-100 dark:bg-gray-800"
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseUp}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onMouseUp}
          />
        </div>

        <div className="mb-6 space-y-1">
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <span>Zoom</span>
            <span>{Math.round(scale * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.3}
            max={4}
            step={0.01}
            value={scale}
            onChange={(e) => setScale(parseFloat(e.target.value))}
            className="w-full accent-primary-500"
          />
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="btn-secondary flex-1">Cancelar</button>
          <button type="button" onClick={handleConfirm} className="btn-primary flex-1">Guardar foto</button>
        </div>
      </div>
    </div>
  )
}
