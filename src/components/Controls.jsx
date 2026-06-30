// components/Controls.jsx
// Phase 4: added mirror/reflection toggle

import { styles } from "../styles/styles"

const SHAPES = [
  { id: "square",  label: "▣ Square"  },
  { id: "rounded", label: "▢ Rounded" },
  { id: "circle",  label: "● Circle"  },
]

const MIRRORS = [
  { id: "off",        label: "Normal"     },
  { id: "mirror",     label: "⟺ Mirror"   },
  { id: "reflection", label: "⬦ Reflect"  },
]

function Controls({
  isRecording, hasStream, mode,
  webcamShape, onShapeChange,
  mirrorMode, onMirrorChange,
  startCamera, startRecording, stopRecording,
}) {
  const showWebcamControls = hasStream && (mode === "webcam" || mode === "both")

  return (
    <div style={styles.controls}>

      {!hasStream && (
        <button style={styles.button} onClick={startCamera}>
          Start Camera and Microphone
        </button>
      )}

      {hasStream && !isRecording && (
        <button style={styles.buttonRecord} onClick={startRecording}>
          ● Start Recording
        </button>
      )}
      {hasStream && isRecording && (
        <button style={styles.buttonStop} onClick={stopRecording}>
          🔴 Recording... Stop
        </button>
      )}

      {/* Webcam shape toggle */}
      {showWebcamControls && (
        <div style={controlGroup}>
          <span style={groupLabel}>Shape</span>
          {SHAPES.map(s => (
            <button
              key={s.id}
              onClick={() => onShapeChange(s.id)}
              style={{
                ...toggleBtn,
                ...(webcamShape === s.id ? toggleBtnActive : {}),
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

      {/* Mirror/reflection toggle */}
      {showWebcamControls && (
        <div style={controlGroup}>
          <span style={groupLabel}>View</span>
          {MIRRORS.map(m => (
            <button
              key={m.id}
              onClick={() => onMirrorChange(m.id)}
              style={{
                ...toggleBtn,
                ...(mirrorMode === m.id ? toggleBtnActive : {}),
              }}
            >
              {m.label}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}

const controlGroup = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  padding: "6px 10px",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "10px",
}
const groupLabel = {
  fontSize: "12px",
  color: "#94a3b8",
  marginRight: "4px",
  fontWeight: "500",
}
const toggleBtn = {
  padding: "6px 12px",
  fontSize: "12px",
  borderRadius: "6px",
  border: "1.5px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
  fontWeight: "500",
  color: "#475569",
}
const toggleBtnActive = {
  border: "1.5px solid #062f8f",
  background: "#eff6ff",
  color: "#062f8f",
}

export default Controls