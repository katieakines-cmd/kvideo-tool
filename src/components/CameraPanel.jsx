// components/CameraPanel.jsx
// Drag fix: dedicated transparent overlay div in "both" mode
// owns all mouse events — no ambiguity about canvas intercepting them

import { useRef, useEffect, useCallback } from "react"
import { useCanvasCompositor } from "../hooks/useCanvasCompositor"
import { videoPanelBase } from "../styles/styles"

const CANVAS_W = 1280
const CANVAS_H = 720

function CameraPanel({
  webcamStream, screenStream, mode, webcamShape,
  onCanvasReady, bubblePos, onBubblePosChange, background
}) {
  const videoRef    = useRef(null)
  const wrapperRef  = useRef(null)
  const isDragging  = useRef(false)
  const dragOffset  = useRef({ x: 0, y: 0 })
  const useCanvas   = mode === "webcam" || mode === "both"

  const { canvasRef } = useCanvasCompositor({
    screenStream:   mode === "both" ? screenStream : null,
    webcamStream:   useCanvas ? webcamStream : null,
    webcamShape,
    webcamPosition: bubblePos,
    background,
  })

  useEffect(() => {
    if (videoRef.current && screenStream) {
      videoRef.current.srcObject = screenStream
    }
  }, [screenStream])

  useEffect(() => {
    if (!useCanvas || !canvasRef.current || !onCanvasReady) return
    const t = setTimeout(() => {
      onCanvasReady(canvasRef.current.captureStream(30))
    }, 500)
    return () => clearTimeout(t)
  }, [mode, canvasRef, onCanvasReady, useCanvas])

  // ── Coordinate conversion ──────────────────────────────────────────────
  const toCanvas = useCallback((clientX, clientY) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return {
      x: (clientX - rect.left) * (CANVAS_W / rect.width),
      y: (clientY - rect.top)  * (CANVAS_H / rect.height),
    }
  }, [])

  const getBubbleSize = useCallback(() => {
    const bW = Math.round(CANVAS_W * 0.22)
    const bH = Math.round(bW * (9 / 16))
    return { bW, bH, defaultX: CANVAS_W - bW - 20, defaultY: CANVAS_H - bH - 20 }
  }, [])

  // ── Drag handlers on the OVERLAY div ──────────────────────────────────
  // The overlay sits on top of everything in "both" mode.
  // This is more reliable than passing events through canvas.
  const onOverlayMouseDown = useCallback((e) => {
    isDragging.current = true
    const pos  = toCanvas(e.clientX, e.clientY)
    const { defaultX, defaultY } = getBubbleSize()
    dragOffset.current = {
      x: pos.x - (bubblePos?.x ?? defaultX),
      y: pos.y - (bubblePos?.y ?? defaultY),
    }
    e.preventDefault()
  }, [bubblePos, toCanvas, getBubbleSize])

  useEffect(() => {
    const onMove = (e) => {
      if (!isDragging.current) return
      const pos = toCanvas(e.clientX, e.clientY)
      const { bW, bH } = getBubbleSize()
      onBubblePosChange({
        x: Math.max(0, Math.min(CANVAS_W - bW, pos.x - dragOffset.current.x)),
        y: Math.max(0, Math.min(CANVAS_H - bH, pos.y - dragOffset.current.y)),
      })
    }
    const onUp = () => { isDragging.current = false }
    window.addEventListener("mousemove", onMove)
    window.addEventListener("mouseup", onUp)
    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("mouseup", onUp)
    }
  }, [toCanvas, getBubbleSize, onBubblePosChange])

  return (
    <div
      ref={wrapperRef}
      style={{
        ...videoPanelBase,
        backgroundColor: "#111",
        position: "relative",
        cursor: "default",
      }}
    >
      {/* Canvas — webcam and both modes */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          ...fill,
          display: useCanvas ? "block" : "none",
          pointerEvents: "none",
        }}
      />

      {/* Video — screen only mode */}
      <video
        ref={videoRef}
        autoPlay playsInline muted
        style={{
          ...fill,
          display: mode === "screen" ? "block" : "none",
          pointerEvents: "none",
        }}
      />

      {/* Transparent drag overlay — only in "both" mode.
          Sits on top of everything, owns all mouse events.
          This is the key fix — no ambiguity about what captures clicks.
          Think of it like a glass panel over the canvas. */}
      {mode === "both" && (
        <div
          style={dragOverlay}
          onMouseDown={onOverlayMouseDown}
        >
          <div style={dragHint}>⠿ drag webcam</div>
        </div>
      )}
    </div>
  )
}

const fill = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
}

// Full-size transparent overlay — invisible but captures all mouse events
const dragOverlay = {
  position: "absolute",
  inset: 0,              // shorthand for top/right/bottom/left: 0
  cursor: "grab",
  zIndex: 10,
}

const dragHint = {
  position: "absolute",
  bottom: "10px",
  right: "10px",
  background: "rgba(0,0,0,0.55)",
  color: "white",
  fontSize: "11px",
  padding: "4px 8px",
  borderRadius: "6px",
  userSelect: "none",
  pointerEvents: "none", // hint itself doesn't block drag
}

export default CameraPanel