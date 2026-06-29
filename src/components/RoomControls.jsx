// components/RoomControls.jsx
// UI for creating and joining WebRTC rooms.
// Three states:
//   1. Not in a room → show Create + Join buttons
//   2. In a room as host → show room code to share + participant count
//   3. In a room as guest → show connected status + participant count

import { useState } from "react"
import { colors } from "../styles/styles"

function RoomControls({
  isConnected,    // bool: connected to signaling server?
  roomCode,       // string | null: current room code
  participants,   // number: people in the room
  isHost,         // bool: are we the host?
  error,          // string | null: any error to show
  onCreateRoom,   // fn: called when host clicks Create Room
  onJoinRoom,     // fn(code): called when guest clicks Join
  onLeaveRoom,    // fn: called when leaving
  isRecording,    // bool: is recording active?
  onStartRecording, // fn: host starts recording for everyone
  onStopRecording,  // fn: host stops recording for everyone
}) {
  const [codeInput, setCodeInput] = useState("")
  const [copied,    setCopied]    = useState(false)

  // Copy room code to clipboard with visual feedback
  const copyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // ── Not connected to server yet ──────────────────────────────────────
  if (!isConnected) {
    return (
      <div style={wrapper}>
        <div style={statusRow}>
          <span style={dot("gray")} />
          <span style={statusText}>
            {error || "Connecting to server..."}
          </span>
        </div>
      </div>
    )
  }

  // ── In a room ────────────────────────────────────────────────────────
  if (roomCode) {
    return (
      <div style={wrapper}>
        <div style={inRoomRow}>

          {/* Room status */}
          <div style={statusRow}>
            <span style={dot("green")} />
            <span style={statusText}>
              {isHost ? "You are hosting" : "You are connected"} · {participants} {participants === 1 ? "person" : "people"}
            </span>
          </div>

          {/* Room code — host shows it so others can join */}
          {isHost && (
            <div style={codeBox}>
              <span style={codeLabel}>Room code</span>
              <span style={codeValue}>{roomCode}</span>
              <button style={copyBtn} onClick={copyCode}>
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          )}

          {/* Recording controls — host only */}
          {isHost && (
            !isRecording ? (
              <button style={recBtn} onClick={onStartRecording}>
                ● Record Everyone
              </button>
            ) : (
              <button style={stopBtn} onClick={onStopRecording}>
                🔴 Stop Everyone
              </button>
            )
          )}

          {/* Leave button */}
          <button style={leaveBtn} onClick={onLeaveRoom}>
            Leave Room
          </button>

        </div>

        {error && <p style={errorText}>{error}</p>}
      </div>
    )
  }

  // ── Not in a room yet ────────────────────────────────────────────────
  return (
    <div style={wrapper}>
      <div style={notInRoomRow}>

        <div style={statusRow}>
          <span style={dot("green")} />
          <span style={statusText}>Server connected — start or join a session</span>
        </div>

        {/* Create room */}
        <button style={createBtn} onClick={onCreateRoom}>
          + Create Room
        </button>

        {/* Join room */}
        <div style={joinRow}>
          <input
            style={input}
            placeholder="Room code"
            value={codeInput}
            onChange={e => setCodeInput(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <button
            style={joinBtn}
            onClick={() => onJoinRoom(codeInput)}
            disabled={codeInput.length < 6}
          >
            Join
          </button>
        </div>

      </div>

      {error && <p style={errorText}>{error}</p>}
    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────

const wrapper = {
  padding: "12px 20px",
  background: "#f1f5f9",
  borderBottom: "1px solid #e2e8f0",
  display: "flex",
  flexDirection: "column",
  gap: "8px",
}

const statusRow = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
}

const inRoomRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
}

const notInRoomRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  flexWrap: "wrap",
}

const joinRow = {
  display: "flex",
  gap: "8px",
  alignItems: "center",
}

const dot = (color) => ({
  width: "8px",
  height: "8px",
  borderRadius: "50%",
  background: color === "green" ? "#16a34a" : "#94a3b8",
  flexShrink: 0,
})

const statusText = {
  fontSize: "13px",
  color: "#475569",
}

const codeBox = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
  background: "white",
  border: "1px solid #e2e8f0",
  borderRadius: "8px",
  padding: "6px 12px",
}

const codeLabel = {
  fontSize: "12px",
  color: "#94a3b8",
}

const codeValue = {
  fontFamily: "monospace",
  fontWeight: "700",
  fontSize: "16px",
  color: colors.brand,
  letterSpacing: "0.1em",
}

const copyBtn = {
  fontSize: "12px",
  padding: "2px 8px",
  borderRadius: "4px",
  border: "1px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
  color: "#475569",
}

const baseBtn = {
  padding: "8px 16px",
  fontSize: "13px",
  fontWeight: "600",
  borderRadius: "8px",
  border: "none",
  cursor: "pointer",
}

const createBtn = {
  ...baseBtn,
  background: colors.brand,
  color: "white",
}

const joinBtn = {
  ...baseBtn,
  background: colors.blue.mid,
  color: "white",
}

const recBtn = {
  ...baseBtn,
  background: colors.green,
  color: "white",
}

const stopBtn = {
  ...baseBtn,
  background: colors.red,
  color: "white",
}

const leaveBtn = {
  ...baseBtn,
  background: "white",
  color: "#64748b",
  border: "1px solid #e2e8f0",
}

const input = {
  padding: "8px 12px",
  fontSize: "14px",
  fontFamily: "monospace",
  fontWeight: "600",
  letterSpacing: "0.1em",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  width: "100px",
  textTransform: "uppercase",
}

const errorText = {
  color: colors.red,
  fontSize: "13px",
  margin: 0,
}

export default RoomControls