// components/BrandThemeCard.jsx
// A card in the theme gallery showing a mini color preview + theme name.
// Clicking it applies the theme to the whole app instantly.

function BrandThemeCard({ theme, isActive, onApply, onDelete }) {
  const { colors, fonts, name, isHomeBase } = theme

  return (
    <div style={{
      ...card,
      border: isActive
        ? `2.5px solid ${colors.primary}`
        : "2px solid #e2e8f0",
      boxShadow: isActive
        ? `0 0 0 3px ${colors.primary}22`
        : "0 2px 8px rgba(0,0,0,0.06)",
    }}>
      {/* Color palette preview bar */}
      <div style={paletteBar}>
        {[colors.primary, colors.secondary, colors.tertiary, colors.accent, colors.success].map((c, i) => (
          <div key={i} style={{ ...paletteSwatch, background: c }} />
        ))}
      </div>

      {/* Mini header preview */}
      <div style={{ ...miniHeader, background: colors.primary }}>
        {theme.logo && <img src={theme.logo} alt="" style={miniLogo} />}
        <span style={{ ...miniName, fontFamily: fonts.heading }}>
          Recording Studio
        </span>
      </div>

      {/* Theme info */}
      <div style={info}>
        <div>
          <p style={{ ...themeName, fontFamily: fonts.heading }}>
            {name}
            {isHomeBase && <span style={homeBadge}>Home Base</span>}
          </p>
          <p style={fontHint}>{fonts.heading} / {fonts.body}</p>
        </div>

        <div style={actions}>
          <button
            style={{
              ...applyBtn,
              background: isActive ? colors.primary : "white",
              color: isActive ? "white" : colors.primary,
              border: `1.5px solid ${colors.primary}`,
            }}
            onClick={() => onApply(theme)}
          >
            {isActive ? "✓ Active" : "Apply"}
          </button>
          {!isHomeBase && (
            <button style={deleteBtn} onClick={() => onDelete(theme.id)}>
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

const card = {
  borderRadius: "14px",
  overflow: "hidden",
  background: "white",
  transition: "box-shadow 0.15s ease, border 0.15s ease",
  cursor: "default",
}
const paletteBar = {
  display: "flex",
  height: "8px",
}
const paletteSwatch = {
  flex: 1,
}
const miniHeader = {
  padding: "8px 12px",
  display: "flex",
  alignItems: "center",
  gap: "6px",
}
const miniLogo = {
  width: "16px",
  height: "16px",
  objectFit: "contain",
  borderRadius: "3px",
}
const miniName = {
  fontSize: "10px",
  fontWeight: "700",
  color: "white",
}
const info = {
  padding: "12px 14px",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "space-between",
  gap: "8px",
}
const themeName = {
  margin: "0 0 3px",
  fontSize: "14px",
  fontWeight: "700",
  color: "#0f172a",
  display: "flex",
  alignItems: "center",
  gap: "6px",
}
const homeBadge = {
  fontSize: "9px",
  fontWeight: "600",
  color: "#0754cb",
  background: "#eff6ff",
  padding: "2px 6px",
  borderRadius: "4px",
  fontFamily: "system-ui",
}
const fontHint = {
  margin: 0,
  fontSize: "11px",
  color: "#94a3b8",
}
const actions = {
  display: "flex",
  gap: "6px",
  alignItems: "center",
  flexShrink: 0,
}
const applyBtn = {
  padding: "6px 14px",
  fontSize: "12px",
  fontWeight: "700",
  borderRadius: "8px",
  cursor: "pointer",
  transition: "all 0.15s ease",
}
const deleteBtn = {
  padding: "6px 8px",
  fontSize: "12px",
  borderRadius: "8px",
  border: "1.5px solid #fecaca",
  background: "white",
  color: "#dc2626",
  cursor: "pointer",
}

export default BrandThemeCard