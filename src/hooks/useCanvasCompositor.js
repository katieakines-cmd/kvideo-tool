// hooks/useCanvasCompositor.js
// Core fix: use 9-argument drawImage for cover-fit so image is
// correctly centered rather than drawn offset to the left.
// Also: reset canvas state each frame to prevent leftover settings.

import { useRef, useEffect } from "react"

const CANVAS_W = 1280
const CANVAS_H = 720

export function useCanvasCompositor({ screenStream, webcamStream, webcamShape, webcamPosition }) {
  const canvasRef      = useRef(null)
  const animFrameRef   = useRef(null)
  const isRunningRef   = useRef(false)
  const screenVideoRef = useRef(null)
  const webcamVideoRef = useRef(null)
  const shapeRef       = useRef(webcamShape)
  const positionRef    = useRef(webcamPosition)
  shapeRef.current     = webcamShape
  positionRef.current  = webcamPosition

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

      // ── Reset ALL canvas state each frame ─────────────────────────
      // Canvas state is persistent — font, textAlign, globalAlpha etc
      // carry over between frames. This prevents leftover state from
      // the "waiting" screen affecting video draws.
      // Think of it like clearing all variables at the top of a loop.
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

      const shape     = shapeRef.current
      const position  = positionRef.current
      const screenVid = screenVideoRef.current
      const webcamVid = webcamVideoRef.current
      const hasScreen = screenVid && screenVid.readyState >= 2
      const hasWebcam = webcamVid && webcamVid.readyState >= 2

      if (hasScreen) {
        // ── Draw screen: contain-fit so full screen is visible ───────
        // Fill background with dark first (no bars — bg is just dark)
        ctx.fillStyle = "#111"
        ctx.fillRect(0, 0, W, H)

        const sW = screenVid.videoWidth  || W
        const sH = screenVid.videoHeight || H
        const scale  = Math.min(W / sW, H / sH) // contain = full screen visible
        const drawW  = sW * scale
        const drawH  = sH * scale
        const drawX  = (W - drawW) / 2
        const drawY  = (H - drawH) / 2
        ctx.drawImage(screenVid, 0, 0, sW, sH, drawX, drawY, drawW, drawH)

        // ── Webcam bubble ────────────────────────────────────────────
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

          // Border
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
        // Clear to transparent so panel bg shows outside the shape
        ctx.clearRect(0, 0, W, H)

        ctx.save()
        ctx.beginPath()
        buildShapePath(ctx, shape, 0, 0, W, H)
        ctx.clip()
        // Draw solid bg color INSIDE clip so there's no transparent gap
        ctx.fillStyle = "#111"
        ctx.fillRect(0, 0, W, H)
        // Draw webcam cover-fit inside clip
        drawCoverFit(ctx, webcamVid, 0, 0, W, H)
        ctx.restore()

      } else {
        // ── Waiting for stream ────────────────────────────────────────
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

// ── Cover-fit using 9-argument drawImage ───────────────────────────────────
// This is the key fix. Instead of drawing an oversized image that extends
// outside the target area (causing misalignment), we calculate which part
// of the SOURCE video to crop, then draw exactly that part into the target.
//
// 3-arg:  drawImage(vid, dx, dy)
// 5-arg:  drawImage(vid, dx, dy, dw, dh)
// 9-arg:  drawImage(vid, sx, sy, sw, sh, dx, dy, dw, dh)
//           sx/sy = where to start reading from the source
//           sw/sh = how much of the source to read
//           dx/dy = where to draw on canvas
//           dw/dh = how big to draw it
//
// Python/Pillow analogy:
//   img.crop((sx, sy, sx+sw, sy+sh)).resize((dw, dh))
function drawCoverFit(ctx, vid, x, y, w, h) {
  const vW = vid.videoWidth  || w
  const vH = vid.videoHeight || h

  const scale  = Math.max(w / vW, h / vH) // cover scale
  const scaledW = vW * scale
  const scaledH = vH * scale

  // How much is cropped off each side in scaled space
  const cropX = (scaledW - w) / 2
  const cropY = (scaledH - h) / 2

  // Convert crop back to source video coordinates
  const sx = cropX / scale
  const sy = cropY / scale
  const sw = vW - (cropX * 2) / scale
  const sh = vH - (cropY * 2) / scale

  // Draw: take (sx,sy,sw,sh) from source, draw into (x,y,w,h) on canvas
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