// hooks/useAudioMixer.js
// Manages audio source selection and mixing.
// Lets users pick which mic to use and toggle system audio.
//
// Key concepts:
//   enumerateDevices() → lists all available audio/video devices
//   AudioContext       → the Web Audio API's processing engine
//   MediaStreamSource  → connects a stream into the audio graph
//   GainNode           → controls volume of a source (like a fader)
//   MediaStreamDestination → the output of the mixed audio graph
//
// Python analogy:
//   Think of AudioContext like a mixing board in Python:
//   source1 = AudioSource(mic_stream)
//   source2 = AudioSource(system_stream)
//   mixer = Mixer()
//   mixer.add(source1, volume=1.0)
//   mixer.add(source2, volume=0.8)
//   output = mixer.get_output()

import { useRef, useState, useCallback, useEffect } from "react"

export function useAudioMixer() {
  const [devices,       setDevices]       = useState([]) // all audioinput devices
  const [selectedDeviceId, setSelectedDeviceId] = useState(null)
  const [micLevel,      setMicLevel]      = useState(0)
  const [systemAudioOn, setSystemAudioOn] = useState(false)

  const audioContextRef   = useRef(null)
  const micLevelRef       = useRef(0)
  const micSourceRef      = useRef(null)
  const systemSourceRef   = useRef(null)
  const destinationRef    = useRef(null)
  const animFrameRef      = useRef(null)

  // ── Enumerate devices ────────────────────────────────────────────────
  // Must be called AFTER getUserMedia has been granted, otherwise
  // device labels are empty strings (browser privacy protection).
  const loadDevices = useCallback(async () => {
    const all = await navigator.mediaDevices.enumerateDevices()
    const mics = all.filter(d => d.kind === "audioinput")
    setDevices(mics)
    // Default to first device if none selected
    if (mics.length > 0 && !selectedDeviceId) {
      setSelectedDeviceId(mics[0].deviceId)
    }
  }, [selectedDeviceId])

  // ── Set up the audio graph ────────────────────────────────────────────
  // This builds a Web Audio "graph":
  //
  //   micStream ──► GainNode(1.0) ──┐
  //                                  ├──► Analyser ──► setMicLevel
  //   sysStream ──► GainNode(0.8) ──┘         │
  //                                            └──► Destination (mixed output)
  //
  // The destination is a MediaStream we can pass to MediaRecorder.
  const setupAudioGraph = useCallback((micStream, systemStream = null) => {
    // Clean up previous audio context
    if (audioContextRef.current) {
      audioContextRef.current.close()
    }

    const ac = new AudioContext()
    audioContextRef.current = ac

    // Destination node — this is what we record
    // Think of it as the "master output" of our mixing board
    const destination = ac.createMediaStreamDestination()
    destinationRef.current = destination

    // Analyser for the visualizer
    const analyser = ac.createAnalyser()
    analyser.fftSize = 256
    analyser.connect(destination)

    // Connect mic source
    if (micStream) {
      const micSource = ac.createMediaStreamSource(micStream)
      const micGain   = ac.createGain()
      micGain.gain.value = 1.0  // full volume
      micSource.connect(micGain)
      micGain.connect(analyser)
      micSourceRef.current = micSource
    }

    // Connect system audio source (if provided)
    if (systemStream) {
      const sysAudioTracks = systemStream.getAudioTracks()
      if (sysAudioTracks.length > 0) {
        const sysStream  = new MediaStream(sysAudioTracks)
        const sysSource  = ac.createMediaStreamSource(sysStream)
        const sysGain    = ac.createGain()
        sysGain.gain.value = 0.8  // slightly quieter than mic
        sysSource.connect(sysGain)
        sysGain.connect(analyser)
        systemSourceRef.current = sysSource
      }
    }

    // Start mic level animation loop
    const data = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      if (ac.state === "closed") return
      analyser.getByteFrequencyData(data)
      const avg     = data.reduce((a, b) => a + b, 0) / data.length
      const smoothed = micLevelRef.current * 0.7 + avg * 8 * 0.3
      micLevelRef.current = smoothed
      setMicLevel(smoothed)
      animFrameRef.current = requestAnimationFrame(tick)
    }
    tick()

    return destination.stream
  }, [])

  // ── Switch microphone source ──────────────────────────────────────────
  // Gets a new stream from the selected device and rebuilds the audio graph.
  // Returns the new mixed stream for the recorder to use.
  const switchMic = useCallback(async (deviceId) => {
    setSelectedDeviceId(deviceId)
    try {
      const newMicStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
        video: false,
      })
      const mixedStream = setupAudioGraph(newMicStream)
      return { micStream: newMicStream, mixedStream }
    } catch (err) {
      console.error("Could not switch microphone:", err)
      return null
    }
  }, [setupAudioGraph])

  // ── Toggle system audio ───────────────────────────────────────────────
  // System audio is only available from a screen share stream.
  // Pass in the current screenStream to mix it in.
  const toggleSystemAudio = useCallback((screenStream, micStream) => {
    const next = !systemAudioOn
    setSystemAudioOn(next)
    if (next && screenStream && micStream) {
      setupAudioGraph(micStream, screenStream)
    } else if (micStream) {
      setupAudioGraph(micStream) // mic only
    }
  }, [systemAudioOn, setupAudioGraph])

  // ── Initialize with an existing stream ───────────────────────────────
  const initWithStream = useCallback((stream) => {
    loadDevices()
    return setupAudioGraph(stream)
  }, [loadDevices, setupAudioGraph])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close()
    }
  }, [])

  return {
    devices,
    selectedDeviceId,
    micLevel,
    systemAudioOn,
    initWithStream,
    switchMic,
    toggleSystemAudio,
    loadDevices,
  }
}