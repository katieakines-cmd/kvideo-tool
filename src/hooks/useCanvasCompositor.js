// hooks/useCanvasCompositor.js
// Phase 4 addition: virtual backgrounds in webcam-only mode.
// Background draws BEHIND the webcam (full frame), webcam draws on top
// in its shape. Since we don't have body segmentation yet, the
// background only shows in the area OUTSIDE a non-rectangular shape
// (circle/rounded) — for "square" shape the webcam fills the frame
// completely so background isn't visible (that's expected; body
// cutout comes in a future phase).

import { useRef, useEffect } from "react"

const CANVAS_W = 1280
const CANVAS_H = 720

// Cache of loaded background images so we don't reload from URL every frame
const imageCache = new Map()

function getBackgroundImage(url) {
  if (imageCache.has(url)) return imageCache.get(url)
  const img = new Image()
  img.src = url
  imageCache.set(url, img)
  return img
}

export function useCanvasCompositor({
  screenStream, webcamStream, webcamShape, webcamPosition, background
}) {
  const canvasRef      = useRef(null)
  const animFrameRef   = useRef(null)
  const isRunningRef   = useRef(false)
  const screenVideoRef = useRef(null)
  const webcamVideoRef = useRef(null)
  const shapeRef       = useRef(webcamShape)
  const positionRef    = useRef(webcamPosition)
  const backgroundRef  = useRef(background)
  shapeRef.current      = webcamShape
  positionRef.current   = webcamPosition
  backgroundRef.current = background

  useEffect(() => {
    if (screenStream) {
      const v = document.createElement("video")
      v.srcObject = screenStream
      v.autoplay = true; v.muted = true; v.playsInline = true
      screenVideoRef.current = v
    } else {
      screenVideoRef.current = null
    }
  }, [screenStream])

  useEffect(() => {
    if (webcamStream) {
      const v = document.createElement("video")
      v.srcObject = webcamStream
      v.autoplay = true; v.muted = true; v.playsInline = true
      webcamVideoRef.current = v
    } else {
      webcamVideoRef.current = null
    }
  }, [webcamStream])

  useEffect(() => {
    if (isRunningRef.current) return
    isRunningRef.current = true

    let lastTime = 0
    const FRAME_MS = 1000 / 30

    const loop = (timestamp) => {
      animFrameRef.current = requestAnimationFrame(loop)
      if (timestamp - lastTime < FRAME_MS) return
      lastTime = timestamp

      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      const W = CANVAS_W, H = CANVAS_H

      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      ctx.filter = "none"
      ctx.shadowBlur = 0
      ctx.shadowColor = "transparent"
      ctx.lineWidth = 1
      ctx.strokeStyle = "#000"
      ctx.fillStyle = "#000"
      ctx.textAlign = "left"
      ctx.textBaseline = "alphabetic"

      const shape      = shapeRef.current
      const position    = positionRef.current
      const bg          = backgroundRef.current
      const screenVid   = screenVideoRef.current
      const webcamVid   = webcamVideoRef.current
      const hasScreen   = screenVid && screenVid.readyState >= 2
      const hasWebcam   = webcamVid && webcamVid.readyState >= 2

      if (hasScreen) {
        // Screen mode — background picker doesn't apply here,
        // the screen itself IS the background
        ctx.fillStyle = "#111"
        ctx.fillRect(0, 0, W, H)

        const sW = screenVid.videoWidth  || W
        const sH = screenVid.videoHeight || H
        const scale  = Math.min(W / sW, H / sH)
        const drawW  = sW * scale
        const drawH  = sH * scale
        const drawX  = (W - drawW) / 2
        const drawY  = (H - drawH) / 2
        ctx.drawImage(screenVid, 0, 0, sW, sH, drawX, drawY, drawW, drawH)

        if (hasWebcam) {
          const bW = Math.round(W * 0.22)
          const bH = Math.round(bW * (9 / 16))
          const bx = position?.x ?? (W - bW - 20)
          const by = position?.y ?? (H - bH - 20)

          ctx.save()
          ctx.beginPath()
          buildShapePath(ctx, shape, bx, by, bW, bH)
          ctx.fillStyle = "#111"
          ctx.fill()
          ctx.clip()
          drawCoverFit(ctx, webcamVid, bx, by, bW, bH)
          ctx.restore()

          ctx.save()
          ctx.strokeStyle = "rgba(255,255,255,0.85)"
          ctx.lineWidth = 3
          ctx.beginPath()
          buildShapePath(ctx, shape, bx, by, bW, bH)
          ctx.stroke()
          ctx.restore()
        }

      } else if (hasWebcam) {
        // ── Webcam only — background applies here ─────────────────────
        ctx.clearRect(0, 0, W, H)

        // STEP 1: draw the chosen background as the full-canvas backdrop.
        // This shows in any area NOT covered by the webcam shape —
        // most visible with "circle" or "rounded" shapes since they
        // don't fill every corner of the frame.
        drawVirtualBackground(ctx, bg, W, H)

        // STEP 2: draw webcam on top, clipped to the chosen shape.
        // For "square" shape this covers the whole frame (background
        // won't show) — that's expected without body segmentation.
        ctx.save()
        ctx.beginPath()
        buildShapePath(ctx, shape, 0, 0, W, H)
        ctx.clip()
        drawCoverFit(ctx, webcamVid, 0, 0, W, H)
        ctx.restore()

      } else {
        ctx.fillStyle = "#111"
        ctx.fillRect(0, 0, W, H)
        ctx.fillStyle = "rgba(255,255,255,0.35)"
        ctx.font = "28px system-ui"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText("Choose a mode above to begin", W / 2, H / 2)
      }
    }

    animFrameRef.current = requestAnimationFrame(loop)
    return () => {
      isRunningRef.current = false
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [])

  return { canvasRef }
}

// ── Draw the virtual background (color or image) ──────────────────────────
// bg is { type: "none"|"color"|"image", value } or null/undefined
function drawVirtualBackground(ctx, bg, W, H) {
  if (!bg || bg.type === "none") {
    // No background chosen — just dark fill (same as before Phase 4)
    ctx.fillStyle = "#111"
    ctx.fillRect(0, 0, W, H)
    return
  }

  if (bg.type === "color") {
    // Handle gradient strings vs plain hex colors
    if (bg.value.includes("gradient")) {
      // Parse the simple two-color linear-gradient we use in BackgroundPicker
      // Example: "linear-gradient(135deg, #062f8f, #2563eb)"
      const colors = bg.value.match(/#[0-9a-fA-F]{6}/g) || ["#111", "#111"]
      const gradient = ctx.createLinearGradient(0, 0, W, H)
      gradient.addColorStop(0, colors[0])
      gradient.addColorStop(1, colors[1] || colors[0])
      ctx.fillStyle = gradient
    } else {
      ctx.fillStyle = bg.value
    }
    ctx.fillRect(0, 0, W, H)
    return
  }

  if (bg.type === "image") {
    const img = getBackgroundImage(bg.value)
    if (img.complete && img.naturalWidth > 0) {
      // Image loaded — cover-fit it into the full canvas
      drawCoverFitImage(ctx, img, 0, 0, W, H)
    } else {
      // Still loading — show dark placeholder for this frame
      ctx.fillStyle = "#111"
      ctx.fillRect(0, 0, W, H)
    }
  }
}

// Same cover-fit logic as drawCoverFit but for a static <img> instead of <video>
function drawCoverFitImage(ctx, img, x, y, w, h) {
  const iW = img.naturalWidth  || w
  const iH = img.naturalHeight || h
  const scale   = Math.max(w / iW, h / iH)
  const scaledW = iW * scale
  const scaledH = iH * scale
  const cropX   = (scaledW - w) / 2
  const cropY   = (scaledH - h) / 2
  const sx = cropX / scale
  const sy = cropY / scale
  const sw = iW - (cropX * 2) / scale
  const sh = iH - (cropY * 2) / scale
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}

function drawCoverFit(ctx, vid, x, y, w, h) {
  const vW = vid.videoWidth  || w
  const vH = vid.videoHeight || h
  const scale   = Math.max(w / vW, h / vH)
  const scaledW = vW * scale
  const scaledH = vH * scale
  const cropX   = (scaledW - w) / 2
  const cropY   = (scaledH - h) / 2
  const sx = cropX / scale
  const sy = cropY / scale
  const sw = vW - (cropX * 2) / scale
  const sh = vH - (cropY * 2) / scale
  ctx.drawImage(vid, sx, sy, sw, sh, x, y, w, h)
}

function buildShapePath(ctx, shape, x, y, w, h) {
  if (shape === "circle") {
    ctx.arc(x + w / 2, y + h / 2, Math.min(w, h) / 2, 0, Math.PI * 2)
  } else if (shape === "rounded") {
    const r = Math.min(w, h) > 400 ? 80 : 20
    roundedRectPath(ctx, x, y, w, h, r)
  } else {
    ctx.rect(x, y, w, h)
  }
}

function roundedRectPath(ctx, x, y, w, h, r) {
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.arcTo(x + w, y,      x + w, y + r,    r)
  ctx.lineTo(x + w, y + h - r)
  ctx.arcTo(x + w, y + h,  x + w - r, y + h, r)
  ctx.lineTo(x + r, y + h)
  ctx.arcTo(x,     y + h,  x, y + h - r,    r)
  ctx.lineTo(x, y + r)
  ctx.arcTo(x,     y,      x + r, y,         r)
  ctx.closePath()
}