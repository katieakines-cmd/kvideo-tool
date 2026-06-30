// App.jsx — Phase 3 final
// Added: screen sharing between participants
// peerScreenStreams displayed alongside peer webcam feeds

import { useState, useCallback } from "react"
import { useMediaRecorder } from "./hooks/useMediaRecorder"
import { useWebRTC } from "./hooks/useWebRTC"
import MicVisualizer from "./components/MicVisualizer"
import CameraPanel from "./components/CameraPanel"
import ModeSelector from "./components/ModeSelector"
import RoomControls from "./components/RoomControls"
import Controls from "./components/Controls"
import TakesLibrary from "./components/TakesLibrary"
import BackgroundPicker from "./components/BackgroundPicker"
import AudioSourceSelector from "./components/AudioSourceSelector"
import { useAudioMixer } from "./hooks/useAudioMixer"
import { styles } from "./styles/styles"

function App() {
  const [webcamShape, setWebcamShape] = useState("rounded")
  const [mirrorMode, setMirrorMode] = useState("off")
  const [background, setBackground] = useState({ id: "none", type: "none", value: null, label: "None" })
  const [customBackgrounds, setCustomBackgrounds] = useState([])

  const {
    devices,
    selectedDeviceId,
    systemAudioOn,
    initWithStream,
    switchMic,
    toggleSystemAudio,
  } = useAudioMixer()
  const [bubblePos,   setBubblePos]   = useState(null)

  const {
    webcamStream,
    screenStream,
    status,
    micLevel,
    isRecording,
    recordings,
    mode,
    startCamera,
    switchMode,
    startRecording,
    stopRecording,
    startRecordingFromCanvas,
  } = useMediaRecorder()

  const hasStream = !!(webcamStream || screenStream)

  const {
    roomCode,
    participants,
    isConnected,
    peerStreams,
    peerScreenStreams,
    error,
    isHost,
    createRoom,
    joinRoom,
    leaveRoom,
    startRecording: startRoomRecording,
    stopRecording:  stopRoomRecording,
    shareScreen,
    stopSharingScreen,
  } = useWebRTC({
    onStartRecording: startRecording,
    onStopRecording:  stopRecording,
  })

  const handleModeSelect = useCallback(async (newMode) => {
    if (!hasStream) {
      const stream = await startCamera(newMode)
      if (stream) initWithStream(stream)
    } else {
      await switchMode(newMode)
    }

    // When switching to a screen mode while in a room,
    // automatically share that screen with the peer too
    if (roomCode && (newMode === "screen" || newMode === "both")) {
      // Small delay to let screen stream settle
      setTimeout(() => {
        if (screenStream) shareScreen(screenStream)
      }, 800)
    }

    // When switching away from screen mode, stop sharing
    if (roomCode && newMode === "webcam") {
      stopSharingScreen()
    }
  }, [hasStream, startCamera, switchMode, roomCode,
      screenStream, shareScreen, stopSharingScreen])

  const handleCanvasReady = useCallback((canvasStream) => {
    startRecordingFromCanvas(canvasStream)
  }, [startRecordingFromCanvas])

  const handleCreateRoom = useCallback(async () => {
    const stream = webcamStream || await startCamera("webcam")
    if (!stream) return
    initWithStream(stream)
    createRoom(stream)
  }, [webcamStream, startCamera, createRoom, initWithStream])

  const handleJoinRoom = useCallback(async (code) => {
    const stream = webcamStream || await startCamera("webcam")
    if (!stream) return
    initWithStream(stream)
    joinRoom(code, stream)
  }, [webcamStream, startCamera, joinRoom, initWithStream])

  return (
    <div style={styles.app}>

      <header style={styles.header}>
        <h1 style={{ margin: 0 }}>Recording Studio</h1>
        <p style={styles.subtitle}>Private v1 Build 🚀</p>
      </header>

      <RoomControls
        isConnected={isConnected}
        roomCode={roomCode}
        participants={participants}
        isHost={isHost}
        error={error}
        isRecording={isRecording}
        onCreateRoom={handleCreateRoom}
        onJoinRoom={handleJoinRoom}
        onLeaveRoom={leaveRoom}
        onStartRecording={startRoomRecording}
        onStopRecording={stopRoomRecording}
      />

      <ModeSelector
        selectedMode={mode}
        onSelect={handleModeSelect}
        isLive={hasStream}
      />

      {/* Background picker — only relevant when webcam is involved */}
      {(mode === "webcam" || mode === "both") && (
        <BackgroundPicker
          selectedBackground={background}
          onSelect={setBackground}
          customBackgrounds={customBackgrounds}
          onUpload={(newBg) => {
            setCustomBackgrounds(prev => [...prev, newBg])
            setBackground(newBg)
          }}
        />
      )}

      {/* Audio source selector — shown when stream is live */}
      {hasStream && (
        <AudioSourceSelector
          devices={devices}
          selectedDeviceId={selectedDeviceId}
          onDeviceChange={(id) => switchMic(id)}
          systemAudioOn={systemAudioOn}
          onSystemAudioToggle={() => toggleSystemAudio(screenStream, webcamStream)}
          showSystemAudio={mode === "screen" || mode === "both"}
        />
      )}

      <div style={styles.content}>
        <MicVisualizer micLevel={micLevel} />

        <div style={styles.cameraZone}>

          {/* Local feed */}
          {hasStream ? (
            <CameraPanel
              webcamStream={webcamStream}
              screenStream={screenStream}
              mode={mode}
              webcamShape={webcamShape}
              onCanvasReady={handleCanvasReady}
              bubblePos={bubblePos}
              onBubblePosChange={setBubblePos}
              background={background}
              mirrorMode={mirrorMode}
            />
          ) : (
            <div style={styles.videoBoxPlaceholder}>
              Choose a mode above to begin 👆
            </div>
          )}

          {/* Peer webcam feeds */}
          {peerStreams.length > 0 ? (
            peerStreams.map(stream => (
              <CameraPanel
                key={stream.id}
                webcamStream={stream}
                screenStream={null}
                mode="webcam"
                webcamShape={webcamShape}
                onCanvasReady={null}
                bubblePos={null}
                onBubblePosChange={() => {}}
              />
            ))
          ) : (
            <div style={styles.videoBoxPlaceholder}>
              {roomCode
                ? `Waiting for others... (${participants} connected)`
                : "Friend Cam (Coming Soon 👀)"
              }
            </div>
          )}

          {/* Peer screen share feeds — shown when someone shares their screen */}
          {peerScreenStreams.map(stream => (
            <CameraPanel
              key={stream.id}
              webcamStream={null}
              screenStream={stream}
              mode="screen"
              webcamShape={webcamShape}
              onCanvasReady={null}
              bubblePos={null}
              onBubblePosChange={() => {}}
            />
          ))}

        </div>
      </div>

      <Controls
        isRecording={isRecording}
        hasStream={hasStream}
        mode={mode}
        webcamShape={webcamShape}
        onShapeChange={setWebcamShape}
        mirrorMode={mirrorMode}
        onMirrorChange={setMirrorMode}
        startCamera={() => startCamera(mode)}
        startRecording={startRecording}
        stopRecording={stopRecording}
      />

      <TakesLibrary recordings={recordings} />

      <footer style={styles.footer}>
        <span>Status: {status}</span>
      </footer>

    </div>
  )
}

export default App