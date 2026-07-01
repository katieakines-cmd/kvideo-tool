// components/BrandEditor.jsx
// The left panel of the brandbook — color pickers, font selector, logo upload.
// Every change fires onChange(updatedTheme) so the parent can
// update the live preview in real time.

import { useRef } from "react"

const FONT_OPTIONS = [
  "Lexend Deca",
  "DM Sans",
  "Inter",
  "Poppins",
  "Montserrat",
  "Raleway",
  "Nunito",
  "Playfair Display",
  "Space Grotesk",
  "Sora",
]

// Color slots with friendly labels
const COLOR_SLOTS = [
  { key: "primary",     label: "Primary",      hint: "Headers, main buttons" },
  { key: "secondary",   label: "Secondary",    hint: "Accents, hover states" },
  { key: "tertiary",    label: "Tertiary",     hint: "Backgrounds, cards" },
  { key: "background",  label: "Background",   hint: "App background" },
  { key: "surface",     label: "Surface",      hint: "Card & panel background" },
  { key: "textOnBrand", label: "Text on brand",hint: "Text on colored buttons" },
  { key: "success",     label: "Success",      hint: "Recording, connected" },
  { key: "danger",      label: "Danger",       hint: "Stop, error states" },
  { key: "accent",      label: "Accent",       hint: "Highlights, mic bars" },
]

function BrandEditor({ theme, onChange }) {
  const logoInputRef = useRef(null)

  const updateColor = (key, value) => {
    onChange({
      ...theme,
      colors: { ...theme.colors, [key]: value }
    })
  }

  const updateFont = (slot, value) => {
    onChange({
      ...theme,
      fonts: { ...theme.fonts, [slot]: value }
    })
  }

  const handleLogoUpload = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const url = URL.createObjectURL(file)
    onChange({ ...theme, logo: url })
    e.target.value = ""
  }

  const updateName = (name) => {
    onChange({ ...theme, name })
  }

  return (
    <div style={wrapper}>

      {/* Theme name */}
      <section style={section}>
        <h3 style={sectionTitle}>Theme name</h3>
        <input
          style={nameInput}
          value={theme.name}
          onChange={e => updateName(e.target.value)}
          placeholder="My Theme"
          maxLength={32}
        />
      </section>

      {/* Logo */}
      <section style={section}>
        <h3 style={sectionTitle}>Logo</h3>
        <div style={logoRow}>
          {theme.logo ? (
            <img src={theme.logo} alt="Logo" style={logoPreview} />
          ) : (
            <div style={logoPlaceholder}>No logo</div>
          )}
          <div style={logoActions}>
            <button style={outlineBtn} onClick={() => logoInputRef.current.click()}>
              {theme.logo ? "Replace logo" : "Upload logo"}
            </button>
            {theme.logo && (
              <button style={dangerBtn} onClick={() => onChange({ ...theme, logo: null })}>
                Remove
              </button>
            )}
          </div>
          <input
            ref={logoInputRef}
            type="file"
            accept="image/*"
            onChange={handleLogoUpload}
            style={{ display: "none" }}
          />
        </div>
      </section>

      {/* Colors */}
      <section style={section}>
        <h3 style={sectionTitle}>Colors</h3>
        <div style={colorGrid}>
          {COLOR_SLOTS.map(slot => (
            <div key={slot.key} style={colorRow}>
              {/* Native color picker — the simplest, works everywhere */}
              <input
                type="color"
                value={theme.colors[slot.key] || "#000000"}
                onChange={e => updateColor(slot.key, e.target.value)}
                style={colorSwatch}
                title={slot.hint}
              />
              <div style={colorInfo}>
                <span style={colorLabel}>{slot.label}</span>
                <span style={colorHex}>{theme.colors[slot.key]}</span>
              </div>
              {/* Text input for manual hex entry */}
              <input
                type="text"
                value={theme.colors[slot.key] || ""}
                onChange={e => {
                  const val = e.target.value
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) updateColor(slot.key, val)
                }}
                style={hexInput}
                maxLength={7}
                placeholder="#000000"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Typography */}
      <section style={section}>
        <h3 style={sectionTitle}>Typography</h3>
        <div style={fontGrid}>
          <div style={fontRow}>
            <label style={fontLabel}>Heading font</label>
            <select
              style={fontSelect}
              value={theme.fonts.heading}
              onChange={e => updateFont("heading", e.target.value)}
            >
              {FONT_OPTIONS.map(f => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </div>
          <div style={fontRow}>
            <label style={fontLabel}>Body font</label>
            <select
              style={fontSelect}
              value={theme.fonts.body}
              onChange={e => updateFont("body", e.target.value)}
            >
              {FONT_OPTIONS.map(f => (
                <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Font preview */}
        <div style={{
          ...fontPreviewBox,
          fontFamily: theme.fonts.heading,
          borderColor: theme.colors.primary,
        }}>
          <p style={{ fontFamily: theme.fonts.heading, fontWeight: 700, margin: "0 0 4px", fontSize: "18px" }}>
            Heading — {theme.fonts.heading}
          </p>
          <p style={{ fontFamily: theme.fonts.body, margin: 0, fontSize: "14px", color: "#64748b" }}>
            Body text — {theme.fonts.body}. The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </section>

    </div>
  )
}

// ── Styles ─────────────────────────────────────────────────────────────────
const wrapper = {
  overflowY: "auto",
  height: "100%",
  padding: "0 0 40px",
}
const section = {
  padding: "24px 28px",
  borderBottom: "1px solid #e2e8f0",
}
const sectionTitle = {
  margin: "0 0 16px",
  fontSize: "13px",
  fontWeight: "700",
  textTransform: "uppercase",
  letterSpacing: "0.08em",
  color: "#94a3b8",
}
const nameInput = {
  width: "100%",
  padding: "10px 14px",
  fontSize: "16px",
  fontWeight: "600",
  borderRadius: "10px",
  border: "1.5px solid #e2e8f0",
  outline: "none",
  boxSizing: "border-box",
}
const logoRow = {
  display: "flex",
  alignItems: "center",
  gap: "16px",
}
const logoPreview = {
  width: "64px",
  height: "64px",
  objectFit: "contain",
  borderRadius: "10px",
  border: "1px solid #e2e8f0",
  background: "#f8fafc",
}
const logoPlaceholder = {
  width: "64px",
  height: "64px",
  borderRadius: "10px",
  border: "2px dashed #e2e8f0",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  color: "#94a3b8",
}
const logoActions = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
}
const outlineBtn = {
  padding: "8px 14px",
  fontSize: "13px",
  fontWeight: "600",
  borderRadius: "8px",
  border: "1.5px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
  color: "#475569",
}
const dangerBtn = {
  ...outlineBtn,
  border: "1.5px solid #fecaca",
  color: "#dc2626",
  background: "#fff5f5",
}
const colorGrid = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
}
const colorRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
}
const colorSwatch = {
  width: "40px",
  height: "40px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  cursor: "pointer",
  padding: "2px",
  flexShrink: 0,
}
const colorInfo = {
  flex: 1,
}
const colorLabel = {
  display: "block",
  fontSize: "13px",
  fontWeight: "600",
  color: "#0f172a",
}
const colorHex = {
  display: "block",
  fontSize: "11px",
  color: "#94a3b8",
  fontFamily: "monospace",
}
const hexInput = {
  width: "84px",
  padding: "6px 8px",
  fontSize: "12px",
  fontFamily: "monospace",
  borderRadius: "6px",
  border: "1px solid #e2e8f0",
  color: "#475569",
}
const fontGrid = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
  marginBottom: "16px",
}
const fontRow = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
}
const fontLabel = {
  fontSize: "13px",
  fontWeight: "500",
  color: "#475569",
  width: "100px",
  flexShrink: 0,
}
const fontSelect = {
  flex: 1,
  padding: "8px 10px",
  fontSize: "13px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  background: "white",
  cursor: "pointer",
}
const fontPreviewBox = {
  padding: "16px",
  borderRadius: "10px",
  border: "2px solid",
  background: "#f8fafc",
}

export default BrandEditor