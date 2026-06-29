// components/ModeSelector.jsx
// Always visible so users can switch modes at any time — before OR during a session.
// When live, clicking a mode calls onSelect() which triggers switchMode() in the hook.

const MODES = [
  { id: "webcam", icon: "📷", label: "Webcam only",     description: "Just your face cam"       },
  { id: "screen", icon: "🖥️", label: "Screen only",     description: "Record your screen"        },
  { id: "both",   icon: "🎬", label: "Screen + Webcam", description: "Screen with face overlay"  },
]

function ModeSelector({ selectedMode, onSelect, isLive }) {
  return (
    <div style={wrapper}>
      <p style={label}>
        Recording mode
        {isLive && <span style={liveHint}> — tap to switch</span>}
      </p>
      <div style={row}>
        {MODES.map(m => (
          <button
            key={m.id}
            onClick={() => onSelect(m.id)}
            style={{
              ...btn,
              ...(selectedMode === m.id ? btnActive : {}),
            }}
          >
            <span style={{ fontSize: "20px" }}>{m.icon}</span>
            <span style={btnLabel}>{m.label}</span>
            <span style={btnDesc}>{m.description}</span>
            {/* Green dot shows which mode is currently live */}
            {isLive && selectedMode === m.id && <span style={liveDot} />}
          </button>
        ))}
      </div>
    </div>
  )
}

const wrapper = {
  padding: "14px 20px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
}
const label = {
  margin: "0 0 10px",
  fontSize: "13px",
  color: "#64748b",
  fontWeight: "500",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
}
const liveHint = {
  fontWeight: "400",
  textTransform: "none",
  letterSpacing: "normal",
  color: "#94a3b8",
}
const row = { display: "flex", gap: "10px" }
const btn = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "4px",
  padding: "12px 8px",
  borderRadius: "10px",
  border: "2px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
  transition: "all 0.15s ease",
  position: "relative",
}
const btnActive = {
  border: "2px solid #062f8f",
  background: "#eff6ff",
}
const btnLabel = { fontSize: "13px", fontWeight: "600", color: "#0f172a" }
const btnDesc  = { fontSize: "11px", color: "#64748b" }
const liveDot  = {
  position: "absolute",
  top: "8px", right: "8px",
  width: "8px", height: "8px",
  borderRadius: "50%",
  background: "#16a34a",
}

export default ModeSelector