// hooks/useWebRTC.js
// Fixed: race condition where onnegotiationneeded fired before
// guest joined, causing duplicate offers and state errors.

import { useRef, useState, useCallback, useEffect } from "react"

const SERVER_URL = import.meta.env.VITE_SIGNALING_SERVER || "ws://localhost:3001"

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
    { urls: "stun:stun.relay.metered.ca:80" },
    {
      urls: "turn:global.relay.metered.ca:80",
      username: "8c623e582754c770f9180582",
      credential: "gMud+HnoDGAzKFX1",
    },
    {
      urls: "turn:global.relay.metered.ca:80?transport=tcp",
      username: "8c623e582754c770f9180582",
      credential: "gMud+HnoDGAzKFX1",
    },
    {
      urls: "turn:global.relay.metered.ca:443",
      username: "8c623e582754c770f9180582",
      credential: "gMud+HnoDGAzKFX1",
    },
    {
      urls: "turns:global.relay.metered.ca:443?transport=tcp",
      username: "8c623e582754c770f9180582",
      credential: "gMud+HnoDGAzKFX1",
    },
  ],
}

export function useWebRTC({ onStartRecording, onStopRecording }) {
  const [roomCode,          setRoomCode]          = useState(null)
  const [participants,      setParticipants]      = useState(0)
  const [isConnected,       setIsConnected]       = useState(false)
  const [peerStreams,       setPeerStreams]        = useState([])
  const [peerScreenStreams, setPeerScreenStreams]  = useState([])
  const [error,             setError]             = useState(null)

  const wsRef           = useRef(null)
  const pcRef           = useRef(null)
  const isHostRef       = useRef(false)
  const roomCodeRef     = useRef(null)
  const localStreamRef  = useRef(null)
  const screenSenderRef = useRef(null)

  // ── Negotiation state refs ─────────────────────────────────────────────
  // These live outside React state so they don't cause re-renders.
  // isNegotiatingRef: true when offer/answer is in flight — blocks new offers
  // readyToNegotiateRef: false until we're in a room — blocks premature offers
  const isNegotiatingRef    = useRef(false)
  const readyToNegotiateRef = useRef(false)

  const sendToServer = useCallback((data) => {
    const ws = wsRef.current
    if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data))
  }, [])

  // ── createOffer — with state guards ───────────────────────────────────
  // Only sends an offer if:
  //   1. We're ready (in a room)
  //   2. Not already negotiating
  //   3. Peer connection is in "stable" state
  const createOffer = useCallback(async () => {
    const pc = pcRef.current
    if (!pc) return
    if (!readyToNegotiateRef.current) {
      console.log("Not ready to negotiate yet — skipping offer")
      return
    }
    if (isNegotiatingRef.current) {
      console.log("Already negotiating — skipping duplicate offer")
      return
    }
    if (pc.signalingState !== "stable") {
      console.log("Not in stable state — skipping offer:", pc.signalingState)
      return
    }

    console.log("Creating offer")
    isNegotiatingRef.current = true
    try {
      const offer = await pc.createOffer()
      if (pc.signalingState !== "stable") return // check again after await
      await pc.setLocalDescription(offer)
      sendToServer({ type: "offer", offer })
    } catch (err) {
      console.error("createOffer failed:", err)
      isNegotiatingRef.current = false
    }
  }, [sendToServer])

  const createPeerConnection = useCallback((localStream) => {
    const pc = new RTCPeerConnection(ICE_SERVERS)
    pcRef.current = pc

    localStream.getTracks().forEach(track => pc.addTrack(track, localStream))

    pc.ontrack = (event) => {
      const [remoteStream] = event.streams
      if (!remoteStream) return
      const hasAudio = remoteStream.getAudioTracks().length > 0
      if (hasAudio) {
        setPeerStreams(prev => {
          if (prev.find(s => s.id === remoteStream.id)) return prev
          return [...prev, remoteStream]
        })
      } else {
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

    // ── Race condition fix ─────────────────────────────────────────────
    // onnegotiationneeded fires the moment we call addTrack() above.
    // But at that point the guest hasn't joined yet — if we send an offer
    // now, there's nobody to receive it. We guard with readyToNegotiateRef.
    pc.onnegotiationneeded = async () => {
      await createOffer()
    }

    // Reset isNegotiating when signaling returns to stable state
    // (after a complete offer/answer exchange)
    pc.onsignalingstatechange = () => {
      console.log("Signaling state:", pc.signalingState)
      if (pc.signalingState === "stable") {
        isNegotiatingRef.current = false
      }
    }

    pc.onconnectionstatechange = () => {
      console.log("Peer state:", pc.connectionState)
      if (pc.connectionState === "failed") {
        setError("Connection to peer failed. Try rejoining.")
      }
    }

    return pc
  }, [sendToServer, createOffer])

  const handleOffer = useCallback(async (offer) => {
    const pc = pcRef.current
    if (!pc) return

    // Guard: only set remote description if we're in the right state
    if (pc.signalingState !== "stable") {
      console.warn("Received offer in non-stable state:", pc.signalingState)
      return
    }

    isNegotiatingRef.current = true
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer))
      const answer = await pc.createAnswer()
      await pc.setLocalDescription(answer)
      sendToServer({ type: "answer", answer })
    } catch (err) {
      console.error("handleOffer failed:", err)
      isNegotiatingRef.current = false
    }
  }, [sendToServer])

  const handleAnswer = useCallback(async (answer) => {
    const pc = pcRef.current
    if (!pc) return

    // Guard: only accept answer if we're expecting one
    if (pc.signalingState !== "have-local-offer") {
      console.warn("Received answer in wrong state:", pc.signalingState)
      return
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer))
    } catch (err) {
      console.error("handleAnswer failed:", err)
    }
  }, [])

  const handleIceCandidate = useCallback(async (candidate) => {
    const pc = pcRef.current
    if (!pc || !candidate) return
    try {
      await pc.addIceCandidate(new RTCIceCandidate(candidate))
    } catch (err) {
      console.error("ICE candidate error:", err)
    }
  }, [])

  const connectToServer = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return

    const ws = new WebSocket(SERVER_URL)
    wsRef.current = ws

    ws.onopen  = () => { setIsConnected(true); setError(null) }
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
          // Guest is now in the room — allow negotiation
          readyToNegotiateRef.current = true
          break

        case "guest-joined":
          setParticipants(msg.guestCount + 1)
          // Host: guest is here — NOW it's safe to send the offer
          readyToNegotiateRef.current = true
          await createOffer()
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
  }, [createOffer, handleOffer, handleAnswer, handleIceCandidate,
      onStartRecording, onStopRecording])

  const shareScreen = useCallback(async (screenStream) => {
    const pc = pcRef.current
    if (!pc) return
    const screenTrack = screenStream.getVideoTracks()[0]
    if (!screenTrack) return
    if (screenSenderRef.current) {
      await screenSenderRef.current.replaceTrack(screenTrack)
    } else {
      const sender = pc.addTrack(screenTrack, screenStream)
      screenSenderRef.current = sender
    }
    screenTrack.onended = () => stopSharingScreen()
  }, [])

  const stopSharingScreen = useCallback(() => {
    const pc = pcRef.current
    if (!pc || !screenSenderRef.current) return
    pc.removeTrack(screenSenderRef.current)
    screenSenderRef.current = null
    setPeerScreenStreams([])
  }, [])

  const createRoom = useCallback(async (localStream) => {
    localStreamRef.current = localStream
    isHostRef.current = true
    // Reset negotiation state for fresh session
    isNegotiatingRef.current = false
    readyToNegotiateRef.current = false
    createPeerConnection(localStream)
    sendToServer({ type: "create-room" })
  }, [createPeerConnection, sendToServer])

  const joinRoom = useCallback(async (code, localStream) => {
    localStreamRef.current = localStream
    isHostRef.current = false
    isNegotiatingRef.current = false
    readyToNegotiateRef.current = false
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
    isNegotiatingRef.current = false
    readyToNegotiateRef.current = false
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
    roomCode, participants, isConnected,
    peerStreams, peerScreenStreams, error,
    isHost: isHostRef.current,
    createRoom, joinRoom, leaveRoom,
    startRecording, stopRecording,
    shareScreen, stopSharingScreen,
  }
}