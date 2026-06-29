// components/TakesLibrary.jsx
// Redesigned: horizontal card layout, takes as individual cards
// with number heading, horizontal scroll for overflow

import { styles } from "../styles/styles"

function TakesLibrary({ recordings }) {
  return (
    <div style={styles.library}>
      <h2 style={styles.libraryTitle}>Takes Library</h2>

      {recordings.length === 0 && (
        <p style={emptyStyle}>
          No recordings yet — hit record to capture your first take!
        </p>
      )}

      {/* Horizontal scroll row of take cards */}
      <div style={cardRow}>
        {recordings.map((clip, index) => {
          const takeNumber = recordings.length - index
          return (
            <div key={clip.id} style={card}>

              {/* Take number heading */}
              <div style={cardHeader}>
                <span style={takeNum}>Take {takeNumber}</span>
                <a
                  href={clip.url}
                  download={`take-${takeNumber}.webm`}
                  style={downloadBtn}
                >
                  ⬇
                </a>
              </div>

              {/* Video preview */}
              <video
                src={clip.url}
                controls
                style={cardVideo}
              />

            </div>
          )
        })}
      </div>
    </div>
  )
}

const emptyStyle = {
  color: "#64748b",
  fontStyle: "italic",
  margin: 0,
}

// Horizontal scroll container — like a Netflix row
const cardRow = {
  display: "flex",
  flexDirection: "row",
  gap: "16px",
  overflowX: "auto",
  paddingBottom: "12px",
  // Hide scrollbar on most browsers but keep scroll functionality
  scrollbarWidth: "thin",
}

const card = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
  flexShrink: 0,       // cards don't shrink — they scroll
  width: "240px",
  background: "white",
  borderRadius: "12px",
  padding: "12px",
  boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
  border: "1px solid #e2e8f0",
}

const cardHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
}

const takeNum = {
  fontWeight: "700",
  fontSize: "14px",
  color: "#0f172a",
}

const downloadBtn = {
  color: "#2563eb",
  textDecoration: "none",
  fontSize: "16px",
  lineHeight: 1,
}

const cardVideo = {
  width: "100%",
  borderRadius: "8px",
  display: "block",
  aspectRatio: "16 / 9",
  backgroundColor: "#000",
}

export default TakesLibrary