// components/AudioSourceSelector.jsx
// UI for selecting microphone and toggling system audio.
// Appears below the mode selector, only when a stream is live.

import { colors } from "../styles/styles"

function AudioSourceSelector({
  devices,           // array of audioinput MediaDeviceInfo objects
  selectedDeviceId,  // currently selected device ID
  onDeviceChange,    // fn(deviceId) — called when user picks a mic
  systemAudioOn,     // bool — is system audio mixed in?
  onSystemAudioToggle, // fn() — toggle system audio
  showSystemAudio,   // bool — only show system audio option in screen modes
}) {
  if (devices.length === 0) return null

  return (
    <div style={wrapper}>
      <div style={row}>

        {/* Mic icon */}
        <span style={icon}>🎤</span>

        {/* Device dropdown */}
        <select
          style={select}
          value={selectedDeviceId || ""}
          onChange={e => onDeviceChange(e.target.value)}
        >
          {devices.map(d => (
            <option key={d.deviceId} value={d.deviceId}>
              {/* Fallback label if browser hides device name */}
              {d.label || `Microphone ${d.deviceId.slice(0, 6)}`}
            </option>
          ))}
        </select>

        {/* System audio toggle — only shown in screen share modes */}
        {showSystemAudio && (
          <button
            style={{
              ...sysBtn,
              ...(systemAudioOn ? sysBtnActive : {}),
            }}
            onClick={onSystemAudioToggle}
            title="Mix system audio (what's playing on your computer) into the recording"
          >
            {systemAudioOn ? "🔊 System audio on" : "🔇 System audio off"}
          </button>
        )}

      </div>
    </div>
  )
}

const wrapper = {
  padding: "10px 20px",
  borderBottom: "1px solid #e2e8f0",
  background: "#f8fafc",
}
const row = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  flexWrap: "wrap",
}
const icon = {
  fontSize: "16px",
  flexShrink: 0,
}
const select = {
  padding: "6px 10px",
  fontSize: "13px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "white",
  color: "#0f172a",
  cursor: "pointer",
  maxWidth: "260px",
}
const sysBtn = {
  padding: "6px 12px",
  fontSize: "12px",
  fontWeight: "600",
  borderRadius: "8px",
  border: "1.5px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
  color: "#64748b",
}
const sysBtnActive = {
  border: "1.5px solid #16a34a",
  background: "#f0fdf4",
  color: "#16a34a",
}

export default AudioSourceSelector