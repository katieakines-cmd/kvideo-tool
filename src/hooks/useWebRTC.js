// hooks/useWebRTC.js
// Updated: screen sharing between participants via track replacement
// and automatic renegotiation when tracks change.

import { useRef, useState, useCallback, useEffect } from "react"

const SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER || "ws://localhost:3001"

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
}

export function useWebRTC({ onStartRecording, onStopRecording }) {
  const [roomCode,     setRoomCode]     = useState(null)
  const [participants, setParticipants] = useState(0)
  const [isConnected,  setIsConnected]  = useState(false)
  const [peerStreams,  setPeerStreams]   = useState([])
  const [peerScreenStreams, setPeerScreenStreams] = useState([]) // NEW: peer screen shares
  const [error,        setError]        = useState(null)

  const wsRef          = useRef(null)
  const pcRef          = useRef(null)
  const isHostRef      = useRef(false)
  const roomCodeRef    = useRef(null)
  const localStreamRef = useRef(null)

  // ── NEW: track screen share sender so we can replace/remove it ──────────
  // A "sender" is a reference to a specific outgoing track in the peer conn.
  // We keep it in a ref so we can replace it when screen sharing changes.
  const screenSenderRef = useRef(null)

  const connectToServer = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(SERVER_URL)
    wsRef.current = ws

    ws.onopen = () => {
      setIsConnected(true)
      setError(null)
    }

    ws.onclose = () => setIsConnected(false)
    ws.onerror = () => {
      setError("Could not connect to server. Is kvideo-server running?")
      setIsConnected(false)
    }

    ws.onmessage = async (event) => {
      const msg = JSON.parse(event.data)
      console.log("Received:", msg.type)

      switch (msg.type) {
        case "room-created":
          setRoomCode(msg.roomCode)
          roomCodeRef.current = msg.roomCode
          setParticipants(1)
          break

        case "room-joined":
          setRoomCode(msg.roomCode)
          roomCodeRef.current = msg.roomCode
          setParticipants(2)
          break

        case "guest-joined":
          setParticipants(msg.guestCount + 1)
          if (isHostRef.current) await createOffer()
          break

        case "guest-left":
          setParticipants(msg.guestCount + 1)
          break

        case "offer":
          await handleOffer(msg.offer)
          break

        case "answer":
          await handleAnswer(msg.answer)
          break

        case "ice-candidate":
          await handleIceCandidate(msg.candidate)
          break

        case "start-recording":
          onStartRecording?.()
          break

        case "stop-recording":
          onStopRecording?.()
          break

        case "host-left":
          setError("The host ended the session.")
          cleanup()
          break

        case "error":
          setError(msg.message)
          break
      }
    }
  }, [onStartRecording, onStopRecording])

  const sendToServer = useCallback((data) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data))
    }
  }, [])

  const createPeerConnection = useCallback((localStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc

    // Add local webcam/mic tracks
    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream)
    })

    // ── Handle incoming tracks from peer ──────────────────────────────
    // Each track arrives with metadata about what KIND it is.
    // We use the stream's track count to distinguish webcam vs screen:
    //   stream with audio+video = webcam
    //   stream with video only  = screen share
    //
    // A more robust approach (Phase 5) would be to send metadata
    // alongside the offer, but track count works well for now.
    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      const hasAudio = remoteStream.getAudioTracks().length > 0

      if (hasAudio) {
        // Webcam stream (has both video + audio)
        setPeerStreams(prev => {
          if (prev.find(s => s.id === remoteStream.id)) return prev
          return [...prev, remoteStream]
        })
      } else {
        // Screen share stream (video only, no audio)
        setPeerScreenStreams(prev => {
          if (prev.find(s => s.id === remoteStream.id)) return prev
          return [...prev, remoteStream]
        })
      }
    }

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        sendToServer({ type: "ice-candidate", candidate: event.candidate })
      }
    }

    // ── Renegotiation ─────────────────────────────────────────────────
    // When we add or remove a track (e.g. starting screen share),
    // the browser fires this event telling us to create a new offer.
    // This is called "renegotiation" — updating an existing connection.
    // Without this, the peer would never know about the new track.
    pc.onnegotiationneeded = async () => {
      console.log("Renegotiation needed — creating new offer")
      try {
        await createOffer()
      } catch (err) {
        console.error("Renegotiation failed:", err)
      }
    }

    pc.onconnectionstatechange = () => {
      console.log("Peer state:", pc.connectionState)
      if (pc.connectionState === "failed") {
        setError("Connection to peer failed. Try rejoining.")
      }
    }

    return pc
  }, [sendToServer])

  const createOffer = useCallback(async () => {
    const pc = pcRef.current
    if (!pc) return
    const offer = await pc.createOffer()
    await pc.setLocalDescription(offer)
    sendToServer({ type: "offer", offer })
  }, [sendToServer])

  const handleOffer = useCallback(async (offer) => {
    const pc = pcRef.current
    if (!pc) return
    await pc.setRemoteDescription(new RTCSessionDescription(offer))
    const answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    sendToServer({ type: "answer", answer })
  }, [sendToServer])

  const handleAnswer = useCallback(async (answer) => {
    const pc = pcRef.current
    if (!pc) return
    await pc.setRemoteDescription(new RTCSessionDescription(answer))
  }, [])

  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = pcRef.current
    if (!pc) return
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error("ICE candidate error:", err)
    }
  }, [])

  // ── Share screen to peer ───────────────────────────────────────────────
  // Adds the screen video track to the peer connection.
  // If we were already sharing a screen, REPLACE the old track.
  // This triggers onnegotiationneeded which sends a new offer automatically.
  //
  // Python analogy: like replacing a value in a shared dict —
  // the other side sees the update without reconnecting.
  const shareScreen = useCallback(async (screenStream) => {
    const pc = pcRef.current
    if (!pc) return

    const screenTrack = screenStream.getVideoTracks()[0]
    if (!screenTrack) return

    if (screenSenderRef.current) {
      // Already sharing — replace the track (no renegotiation needed for replace)
      await screenSenderRef.current.replaceTrack(screenTrack)
    } else {
      // First time sharing — add a new sender (triggers renegotiation)
      const sender = pc.addTrack(screenTrack, screenStream)
      screenSenderRef.current = sender
    }

    // When user stops sharing via browser's stop button
    screenTrack.onended = () => {
      stopSharingScreen()
    }
  }, [])

  // ── Stop sharing screen to peer ────────────────────────────────────────
  const stopSharingScreen = useCallback(() => {
    const pc = pcRef.current
    if (!pc || !screenSenderRef.current) return

    // Remove the screen track sender from the connection
    // This triggers renegotiation — peer sees the track disappear
    pc.removeTrack(screenSenderRef.current)
    screenSenderRef.current = null

    // Clear peer screen streams on our end
    setPeerScreenStreams([])
  }, [])

  const createRoom = useCallback(async (localStream) => {
    localStreamRef.current = localStream
    isHostRef.current = true
    createPeerConnection(localStream)
    sendToServer({ type: "create-room" })
  }, [createPeerConnection, sendToServer])

  const joinRoom = useCallback(async (code, localStream) => {
    localStreamRef.current = localStream
    isHostRef.current = false
    createPeerConnection(localStream)
    sendToServer({ type: "join-room", roomCode: code.toUpperCase() })
  }, [createPeerConnection, sendToServer])

  const startRecording = useCallback(() => {
    sendToServer({ type: "start-recording" })
  }, [sendToServer])

  const stopRecording = useCallback(() => {
    sendToServer({ type: "stop-recording" })
  }, [sendToServer])

  const leaveRoom = useCallback(() => cleanup(), [])

  const cleanup = useCallback(() => {
    pcRef.current?.close()
    pcRef.current = null
    wsRef.current?.close()
    wsRef.current = null
    screenSenderRef.current = null
    setPeerStreams([])
    setPeerScreenStreams([])
    setRoomCode(null)
    setParticipants(0)
    setIsConnected(false)
    isHostRef.current = false
    roomCodeRef.current = null
  }, [])

  useEffect(() => {
    connectToServer()
    return () => { wsRef.current?.close() }
  }, [connectToServer])

  return {
    roomCode,
    participants,
    isConnected,
    peerStreams,
    peerScreenStreams, // NEW: expose peer screen streams
    error,
    isHost: isHostRef.current,
    createRoom,
    joinRoom,
    leaveRoom,
    startRecording,
    stopRecording,
    shareScreen,        // NEW
    stopSharingScreen,  // NEW
  }
}