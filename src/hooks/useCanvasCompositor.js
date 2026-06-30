// hooks/useCanvasCompositor.js
// Phase 4: virtual backgrounds + mirror/reflection

import { useRef, useEffect } from "react"

const CANVAS_W = 1280
const CANVAS_H = 720

const imageCache = new Map()
function getBackgroundImage(url) {
  if (imageCache.has(url)) return imageCache.get(url)
  const img = new Image()
  img.src = url
  imageCache.set(url, img)
  return img
}

export function useCanvasCompositor({
  screenStream, webcamStream, webcamShape, webcamPosition, background, mirrorMode
}) {
  const canvasRef      = useRef(null)
  const animFrameRef   = useRef(null)
  const isRunningRef   = useRef(false)
  const screenVideoRef = useRef(null)
  const webcamVideoRef = useRef(null)
  const shapeRef       = useRef(webcamShape)
  const positionRef    = useRef(webcamPosition)
  const backgroundRef  = useRef(background)
  const mirrorModeRef  = useRef(mirrorMode)
  shapeRef.current       = webcamShape
  positionRef.current    = webcamPosition
  backgroundRef.current  = background
  mirrorModeRef.current  = mirrorMode

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

      // Reset state each frame
      ctx.globalAlpha = 1
      ctx.globalCompositeOperation = "source-over"
      ctx.filter = "none"
      ctx.shadowBlur = 0
      ctx.shadowColor = "transparent"
      ctx.setTransform(1, 0, 0, 1, 0, 0) // reset any transform from last frame

      const shape     = shapeRef.current
      const position  = positionRef.current
      const bg        = backgroundRef.current
      const mirror    = mirrorModeRef.current // "off" | "mirror" | "reflection"
      const screenVid = screenVideoRef.current
      const webcamVid = webcamVideoRef.current
      const hasScreen = screenVid && screenVid.readyState >= 2
      const hasWebcam = webcamVid && webcamVid.readyState >= 2

      if (hasScreen) {
        // ── Screen mode ───────────────────────────────────────────────
        ctx.fillStyle = "#111"
        ctx.fillRect(0, 0, W, H)

        const sW = screenVid.videoWidth  || W
        const sH = screenVid.videoHeight || H
        const scale = Math.min(W / sW, H / sH)
        const drawW = sW * scale
        const drawH = sH * scale
        const drawX = (W - drawW) / 2
        const drawY = (H - drawH) / 2
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
          // Mirror applies to webcam bubble in screen+webcam mode too
          drawWebcam(ctx, webcamVid, bx, by, bW, bH, mirror)
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
        // ── Webcam only ───────────────────────────────────────────────
        ctx.clearRect(0, 0, W, H)

        if (mirror === "reflection") {
          // ── Reflection effect ───────────────────────────────────────
          // Draw the main webcam in the top 75% of the frame,
          // then draw a faded flipped copy below it (the "floor reflection")
          //
          // Step 1: background fills full frame
          drawVirtualBackground(ctx, bg, W, H)

          // Step 2: main webcam in top portion
          const mainH = Math.round(H * 0.75)
          ctx.save()
          ctx.beginPath()
          buildShapePath(ctx, shape, 0, 0, W, mainH)
          ctx.clip()
          drawWebcam(ctx, webcamVid, 0, 0, W, mainH, "mirror") // reflection always mirrors
          ctx.restore()

          // Step 3: reflected copy below, flipped vertically + faded
          // ctx.scale(1, -1) flips the y axis, translate moves it back into view
          // Think of it like: flip the canvas upside down, draw, flip back
          ctx.save()
          ctx.globalAlpha = 0.25 // 25% opacity — subtle reflection
          ctx.translate(0, H * 2)  // move origin to bottom of doubled canvas
          ctx.scale(1, -1)         // flip vertically
          ctx.beginPath()
          buildShapePath(ctx, shape, 0, 0, W, mainH)
          ctx.clip()
          drawWebcam(ctx, webcamVid, 0, 0, W, mainH, "mirror")
          ctx.restore()

          // Step 4: gradient fade at the bottom to blend reflection away
          const fadeGrad = ctx.createLinearGradient(0, H * 0.7, 0, H)
          fadeGrad.addColorStop(0, "rgba(0,0,0,0)")
          fadeGrad.addColorStop(1, "rgba(0,0,0,0.85)")
          ctx.fillStyle = fadeGrad
          ctx.fillRect(0, H * 0.7, W, H * 0.3)

        } else {
          // ── Normal or mirror (no reflection) ───────────────────────
          drawVirtualBackground(ctx, bg, W, H)
          ctx.save()
          ctx.beginPath()
          buildShapePath(ctx, shape, 0, 0, W, H)
          ctx.clip()
          drawWebcam(ctx, webcamVid, 0, 0, W, H, mirror)
          ctx.restore()
        }

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

// ── Draw webcam with optional mirror transform ─────────────────────────────
// mirror: "off" | "mirror" | "reflection"
// For "mirror" we flip the canvas horizontally before drawing.
// ctx.save/restore ensures the transform doesn't affect anything else.
//
// How the flip works:
//   ctx.scale(-1, 1)       → flips x axis (things draw right-to-left)
//   ctx.translate(-W, 0)   → shift right so content stays in view
//   draw normally          → comes out mirrored
//   ctx.restore()          → back to normal
function drawWebcam(ctx, vid, x, y, w, h, mirror) {
  if (mirror === "off" || !mirror) {
    drawCoverFit(ctx, vid, x, y, w, h)
    return
  }

  // Both "mirror" and "reflection" flip horizontally
  ctx.save()
  ctx.translate(x + w, y)  // move origin to right edge of draw area
  ctx.scale(-1, 1)          // flip x
  // Now draw at (0,0) with the same size — it'll appear mirrored at (x,y)
  drawCoverFit(ctx, vid, 0, 0, w, h)
  ctx.restore()
}

function drawVirtualBackground(ctx, bg, W, H) {
  if (!bg || bg.type === "none") {
    ctx.fillStyle = "#111"
    ctx.fillRect(0, 0, W, H)
    return
  }
  if (bg.type === "color") {
    if (bg.value.includes("gradient")) {
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
      drawCoverFitImage(ctx, img, 0, 0, W, H)
    } else {
      ctx.fillStyle = "#111"
      ctx.fillRect(0, 0, W, H)
    }
  }
}

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