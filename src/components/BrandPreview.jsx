// components/BrandPreview.jsx
// A live mini-preview of the recording studio with the current theme applied.
// This is what makes Katie's Brandbook unique — you see your brand
// ON your actual tool, not just abstract swatches.

function BrandPreview({ theme }) {
  const { colors, fonts, logo } = theme

  return (
    <div style={{ ...previewWrapper, fontFamily: fonts.body }}>
      <p style={previewLabel}>Live preview</p>

      {/* Mini studio */}
      <div style={{ ...studio, background: colors.background, fontFamily: fonts.body }}>

        {/* Header */}
        <div style={{ ...header, background: colors.primary }}>
          <div style={headerLeft}>
            {logo ? (
              <img src={logo} alt="logo" style={logoImg} />
            ) : (
              <div style={{ ...logoPlaceholder, background: colors.secondary }} />
            )}
            <div>
              <div style={{ ...appName, fontFamily: fonts.heading, color: colors.textOnBrand }}>
                Recording Studio
              </div>
              <div style={{ ...tagline, color: colors.accent }}>
                Private Build 🚀
              </div>
            </div>
          </div>
          <div style={{ ...statusDot, background: colors.success }} />
        </div>

        {/* Room bar */}
        <div style={{ ...roomBar, background: colors.surfaceAlt, borderColor: colors.border }}>
          <div style={{ ...dot, background: colors.success }} />
          <span style={{ ...roomText, color: colors.textMuted, fontFamily: fonts.body }}>
            You are hosting · 2 people
          </span>
          <div style={{ ...roomCode, background: colors.surface, borderColor: colors.border }}>
            <span style={{ ...codeText, color: colors.primary, fontFamily: fonts.heading }}>ABC123</span>
          </div>
          <div style={{ ...recBtn, background: colors.success }}>
            ● Record
          </div>
        </div>

        {/* Mode selector */}
        <div style={{ ...modeBar, background: colors.surfaceAlt, borderColor: colors.border }}>
          {["📷 Webcam", "🖥️ Screen", "🎬 Both"].map((m, i) => (
            <div
              key={m}
              style={{
                ...modeBtn,
                background: i === 0 ? colors.surface : "transparent",
                border: i === 0 ? `1.5px solid ${colors.primary}` : `1.5px solid ${colors.border}`,
                color: i === 0 ? colors.primary : colors.textMuted,
                fontFamily: fonts.body,
              }}
            >
              {m}
            </div>
          ))}
        </div>

        {/* Camera zone */}
        <div style={{ ...cameraZone, background: colors.background }}>
          {/* Main cam */}
          <div style={{ ...camBox, background: colors.primary }}>
            <div style={{ ...camLabel, color: colors.accent, fontFamily: fonts.body }}>You</div>
            <div style={camIcon}>📹</div>
          </div>
          {/* Friend cam */}
          <div style={{ ...camBox, background: colors.tertiary }}>
            <div style={{ ...camLabel, color: colors.textOnBrand, fontFamily: fonts.body }}>Friend</div>
            <div style={camIcon}>📹</div>
          </div>
        </div>

        {/* Controls */}
        <div style={{ ...controls, background: colors.surfaceAlt, borderColor: colors.border }}>
          <div style={{ ...ctrlBtn, background: colors.success }}>● Record</div>
          <div style={{ ...ctrlBtn, background: colors.secondary }}>Shape ▾</div>
          <div style={{ ...ctrlBtn, background: colors.tertiary }}>View ▾</div>
        </div>

        {/* Takes library strip */}
        <div style={{ ...library, background: colors.surface, borderColor: colors.border }}>
          <span style={{ ...libraryTitle, color: colors.textPrimary, fontFamily: fonts.heading }}>
            Takes Library
          </span>
          <div style={clipStrip}>
            {[1, 2, 3].map(n => (
              <div key={n} style={{ ...clip, background: colors.surfaceAlt, borderColor: colors.border }}>
                <div style={{ ...clipNum, color: colors.primary, fontFamily: fonts.heading }}>Take {n}</div>
                <div style={{ ...clipThumb, background: colors.tertiary }} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div style={{ ...footer, background: colors.border }}>
          <span style={{ fontFamily: fonts.body, color: colors.textMuted, fontSize: "9px" }}>
            Status: Webcam live
          </span>
        </div>

      </div>
    </div>
  )
}

// ── Styles — everything scaled down to ~40% for preview ───────────────────
const previewWrapper = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
}
const previewLabel = {
  margin: 0,
  fontSize: "13px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#94a3b8",
}
const studio = {
  borderRadius: "12px",
  overflow: "hidden",
  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
  border: "1px solid #e2e8f0",
}
const header = {
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}
const headerLeft = {
  display: "flex",
  alignItems: "center",
  gap: "8px",
}
const logoImg = {
  width: "20px",
  height: "20px",
  objectFit: "contain",
  borderRadius: "4px",
}
const logoPlaceholder = {
  width: "20px",
  height: "20px",
  borderRadius: "4px",
}
const appName = {
  fontSize: "11px",
  fontWeight: "700",
  color: "white",
}
const tagline = {
  fontSize: "8px",
  opacity: 0.8,
}
const statusDot = {
  width: "6px",
  height: "6px",
  borderRadius: "50%",
}
const roomBar = {
  padding: "6px 12px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
  borderBottom: "1px solid",
}
const dot = {
  width: "5px",
  height: "5px",
  borderRadius: "50%",
  flexShrink: 0,
}
const roomText = {
  fontSize: "8px",
  flex: 1,
}
const roomCode = {
  padding: "2px 6px",
  borderRadius: "4px",
  border: "1px solid",
}
const codeText = {
  fontSize: "9px",
  fontWeight: "700",
  fontFamily: "monospace",
  letterSpacing: "0.05em",
}
const recBtn = {
  padding: "3px 8px",
  borderRadius: "4px",
  fontSize: "8px",
  fontWeight: "700",
  color: "white",
}
const modeBar = {
  padding: "6px 12px",
  display: "flex",
  gap: "4px",
  borderBottom: "1px solid",
}
const modeBtn = {
  flex: 1,
  padding: "4px 2px",
  borderRadius: "4px",
  fontSize: "7px",
  fontWeight: "600",
  textAlign: "center",
}
const cameraZone = {
  padding: "10px 12px",
  display: "flex",
  gap: "8px",
}
const camBox = {
  flex: 1,
  aspectRatio: "16/9",
  borderRadius: "8px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  position: "relative",
}
const camLabel = {
  position: "absolute",
  bottom: "4px",
  left: "6px",
  fontSize: "7px",
  fontWeight: "600",
}
const camIcon = {
  fontSize: "16px",
  opacity: 0.4,
}
const controls = {
  padding: "6px 12px",
  display: "flex",
  gap: "4px",
  borderTop: "1px solid",
}
const ctrlBtn = {
  padding: "3px 8px",
  borderRadius: "4px",
  fontSize: "8px",
  fontWeight: "600",
  color: "white",
}
const library = {
  padding: "8px 12px",
  borderTop: "1px solid",
}
const libraryTitle = {
  fontSize: "9px",
  fontWeight: "700",
  display: "block",
  marginBottom: "6px",
}
const clipStrip = {
  display: "flex",
  gap: "6px",
}
const clip = {
  flex: 1,
  borderRadius: "6px",
  border: "1px solid",
  padding: "4px",
}
const clipNum = {
  fontSize: "7px",
  fontWeight: "700",
  marginBottom: "3px",
}
const clipThumb = {
  height: "20px",
  borderRadius: "3px",
}
const footer = {
  padding: "4px 12px",
}

export default BrandPreview