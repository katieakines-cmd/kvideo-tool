// hooks/useMediaRecorder.js
// Fix: reshare prompt uses setTimeout so it fires AFTER
// the state update settles, not simultaneously with it

import { useRef, useState, useCallback } from "react"

export function useMediaRecorder() {
  const mediaRecorderRef = useRef(null)
  const chunksRef        = useRef([])
  const micLevelRef      = useRef(0)
  const audioContextRef  = useRef(null)
  const modeRef          = useRef("webcam")
  const webcamStreamRef  = useRef(null)
  const screenStreamRef  = useRef(null)

  const [webcamStream, setWebcamStream] = useState(null)
  const [screenStream, setScreenStream] = useState(null)
  const [status,       setStatus]       = useState("Ready — choose a mode to begin")
  const [micLevel,     setMicLevel]     = useState(0)
  const [isRecording,  setIsRecording]  = useState(false)
  const [recordings,   setRecordings]   = useState([])
  const [mode,         setMode]         = useState("webcam")

  const setWebcamStreamBoth = (s) => { webcamStreamRef.current = s; setWebcamStream(s) }
  const setScreenStreamBoth = (s) => { screenStreamRef.current = s; setScreenStream(s) }
  const setModeBoth         = (m) => { modeRef.current = m; setMode(m) }

  const setupMicVisualizer = useCallback((stream) => {
    if (audioContextRef.current) audioContextRef.current.close()
    const ac = new AudioContext()
    audioContextRef.current = ac
    const analyser = ac.createAnalyser()
    ac.createMediaStreamSource(stream).connect(analyser)
    analyser.fftSize = 256
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      if (ac.state === "closed") return
      analyser.getByteFrequencyData(data)
      const avg      = data.reduce((a, b) => a + b, 0) / data.length
      const smoothed = micLevelRef.current * 0.7 + avg * 8 * 0.3
      micLevelRef.current = smoothed
      setMicLevel(smoothed)
      requestAnimationFrame(tick)
    }
    tick()
  }, [])

  const setupRecorder = useCallback((stream) => {
    const rec = new MediaRecorder(stream)
    rec.ondataavailable = e => chunksRef.current.push(e.data)
    rec.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" })
      setRecordings(prev => [{ id: Date.now(), url: URL.createObjectURL(blob) }, ...prev])
      chunksRef.current = []
    }
    mediaRecorderRef.current = rec
  }, [])

  const stopWebcamTracks = useCallback(() => {
    webcamStreamRef.current?.getTracks().forEach(t => t.stop())
    setWebcamStreamBoth(null)
  }, [])

  const stopScreenTracks = useCallback(() => {
    screenStreamRef.current?.getTracks().forEach(t => t.stop())
    setScreenStreamBoth(null)
  }, [])

  const getWebcam = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    setWebcamStreamBoth(stream)
    setupMicVisualizer(stream)
    return stream
  }, [setupMicVisualizer])

  const getScreen = useCallback(async () => {
    let stream
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: 30 }, audio: true
      })
    } catch (err) {
      // User cancelled the screen picker or denied permission —
      // this is normal behaviour, not a real error. Just restore
      // the previous status and return null so callers can check.
      if (err.name === "NotAllowedError") {
        setStatus(modeRef.current === "both"
          ? "🎬 Screen + webcam live"
          : "📷 Webcam live")
        return null
      }
      throw err // re-throw anything unexpected
    }

    stream.getVideoTracks()[0].onended = () => {
      // Clear the screen stream first
      setScreenStreamBoth(null)

      // ── KEY FIX: use setTimeout so the status update fires
      // AFTER React processes the state update above.
      // Without this, setStatus runs at the same time as setScreenStream
      // and React may batch them, causing the status to get overwritten
      // by a re-render triggered by the stream becoming null.
      setTimeout(() => {
        const m = modeRef.current
        if (m === "screen" || m === "both") {
          setStatus("🖥️ Screen share ended — click Screen or Screen+Webcam to reshare")
        }
      }, 100)
    }

    setScreenStreamBoth(stream)
    return stream
  }, [])

  const startCamera = useCallback(async (selectedMode = "webcam") => {
    setModeBoth(selectedMode)
    try {
      if (selectedMode === "webcam") {
        const s = await getWebcam()
        setupRecorder(s)
        setStatus("📷 Webcam live")

      } else if (selectedMode === "screen") {
        const screen = await getScreen()
        if (!screen) return // user cancelled picker
        const mic    = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        setupMicVisualizer(mic)
        setupRecorder(new MediaStream([
          ...screen.getVideoTracks(),
          ...mic.getAudioTracks(),
        ]))
        setStatus("🖥️ Screen capture live")

      } else if (selectedMode === "both") {
        await getWebcam()
        const screen = await getScreen()
        if (!screen) return // user cancelled picker
        setStatus("🎬 Screen + webcam live")
      }
    } catch (err) {
      console.error(err)
      setStatus("⚠️ Access denied — check browser permissions")
    }
  }, [getWebcam, getScreen, setupMicVisualizer, setupRecorder])

  const switchMode = useCallback(async (newMode) => {
    if (newMode === modeRef.current) return
    if (isRecording) {
      setStatus("⚠️ Stop recording before switching modes")
      setTimeout(() => setStatus("🔴 Recording..."), 2500)
      return
    }
    setModeBoth(newMode)
    try {
      if (newMode === "webcam") {
        stopScreenTracks()
        if (!webcamStreamRef.current) {
          const s = await getWebcam()
          setupRecorder(s)
        }
        setStatus("📷 Webcam live")

      } else if (newMode === "screen") {
        stopWebcamTracks()
        const screen = await getScreen()
        if (!screen) return // user cancelled picker
        const mic    = await navigator.mediaDevices.getUserMedia({ video: false, audio: true })
        setupMicVisualizer(mic)
        setupRecorder(new MediaStream([
          ...screen.getVideoTracks(),
          ...mic.getAudioTracks(),
        ]))
        setStatus("🖥️ Screen capture live")

      } else if (newMode === "both") {
        if (!webcamStreamRef.current) await getWebcam()
        if (!screenStreamRef.current) {
          const screen = await getScreen()
          if (!screen) return // user cancelled picker
        }
        setStatus("🎬 Screen + webcam live")
      }
    } catch (err) {
      console.error(err)
      setStatus("⚠️ Could not switch — try again")
    }
  }, [isRecording, getWebcam, getScreen, stopWebcamTracks,
      stopScreenTracks, setupMicVisualizer, setupRecorder])

  const startRecordingFromCanvas = useCallback((canvasStream) => {
    const audio = webcamStreamRef.current?.getAudioTracks() ?? []
    setupRecorder(new MediaStream([
      ...canvasStream.getVideoTracks(),
      ...audio,
    ]))
  }, [setupRecorder])

  const startRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return
    chunksRef.current = []
    mediaRecorderRef.current.start()
    setIsRecording(true)
    setStatus("🔴 Recording...")
  }, [])

  const stopRecording = useCallback(() => {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    setIsRecording(false)
    setStatus("Live")
  }, [])

  return {
    webcamStream, screenStream, status, micLevel,
    isRecording, recordings, mode,
    startCamera, switchMode, startRecording,
    stopRecording, startRecordingFromCanvas,
  }
}