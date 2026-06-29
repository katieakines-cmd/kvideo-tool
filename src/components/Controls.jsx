// components/Controls.jsx
// Updated for Phase 2: adds webcam shape toggle buttons.
// Shape options: "square" | "rounded" | "circle"

import { styles } from "../styles/styles"

const SHAPES = [
  { id: "square",  label: "▣ Square"  },
  { id: "rounded", label: "▢ Rounded" },
  { id: "circle",  label: "● Circle"  },
]

function Controls({
  isRecording,
  hasStream,
  mode,
  webcamShape,
  onShapeChange,
  startCamera,
  startRecording,
  stopRecording,
}) {
  return (
    <div style={styles.controls}>

      {/* Start button — only shown before stream starts */}
      {!hasStream && (
        <button style={styles.button} onClick={startCamera}>
          Start Camera and Microphone
        </button>
      )}

      {/* Record / Stop */}
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

      {/* Webcam shape toggle — only shown in webcam or both mode */}
      {hasStream && (mode === "webcam" || mode === "both") && (
        <div style={shapeRow}>
          <span style={shapeLabel}>Webcam shape</span>
          {SHAPES.map(s => (
            <button
              key={s.id}
              onClick={() => onShapeChange(s.id)}
              style={{
                ...shapeBtn,
                ...(webcamShape === s.id ? shapeBtnActive : {}),
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      )}

    </div>
  )
}

const shapeRow = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  marginLeft: "8px",
}
const shapeLabel = {
  fontSize: "13px",
  color: "#64748b",
  marginRight: "4px",
}
const shapeBtn = {
  padding: "8px 14px",
  fontSize: "13px",
  borderRadius: "8px",
  border: "2px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
}
const shapeBtnActive = {
  border: "2px solid #062f8f",
  background: "#eff6ff",
  color: "#062f8f",
  fontWeight: "600",
}

export default Controls