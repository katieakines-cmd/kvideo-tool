// components/BackgroundPicker.jsx
// 🖼️ Lets the user choose a virtual background: none, a default color/image,
// or upload their own PNG. This is a "controlled component" — it doesn't
// own the selected background itself, it just tells the parent what was picked.
//
// Data shape for each background option:
//   { id, type: "none" | "color" | "image", value, label }
//
// "value" depends on type:
//   type "none"  → value is null
//   type "color" → value is a hex string like "#062f8f"
//   type "image" → value is a URL or object URL to draw

import { useRef } from "react"

// ── Default backgrounds ─────────────────────────────────────────────────
// These ship with the app. Later, Phase 4.5 will add a "brand" category
// here using the same shape — no structural changes needed then!
const DEFAULT_BACKGROUNDS = [
  { id: "none",     type: "none",  value: null,      label: "None" },
  { id: "navy",     type: "color", value: "#062f8f",  label: "Navy" },
  { id: "softgray", type: "color", value: "#e2e8f0",  label: "Soft Gray" },
  { id: "gradient", type: "color", value: "linear-gradient(135deg, #062f8f, #2563eb)", label: "Gradient" },
]

function BackgroundPicker({ selectedBackground, onSelect, customBackgrounds, onUpload }) {
  const fileInputRef = useRef(null)

  // Triggered when user picks a file from their computer
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return

    // Only accept PNG/JPG — reject anything else with a friendly message
    if (!file.type.startsWith("image/")) {
      alert("Please choose an image file (PNG or JPG)")
      return
    }

    // createObjectURL makes a temporary browser-local URL for the file.
    // Like Python's io.BytesIO — it lets us treat the file as if it
    // were already loaded, without uploading it anywhere.
    const url = URL.createObjectURL(file)
    onUpload({
      id: `custom-${Date.now()}`,
      type: "image",
      value: url,
      label: file.name,
    })

    // Reset the input so the same file can be selected again later
    e.target.value = ""
  }

  const allBackgrounds = [...DEFAULT_BACKGROUNDS, ...customBackgrounds]

  return (
    <div style={wrapper}>
      <p style={label}>Virtual background</p>
      <div style={row}>
        {allBackgrounds.map(bg => (
          <button
            key={bg.id}
            onClick={() => onSelect(bg)}
            style={{
              ...swatch,
              ...(selectedBackground?.id === bg.id ? swatchActive : {}),
              background: bg.type === "image" ? `url(${bg.value}) center/cover` : (bg.value || "#fff"),
            }}
            title={bg.label}
          >
            {bg.type === "none" && <span style={noneIcon}>🚫</span>}
          </button>
        ))}

        {/* Upload button — styled like a swatch but triggers file picker */}
        <button
          onClick={() => fileInputRef.current.click()}
          style={uploadSwatch}
          title="Upload your own background"
        >
          +
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
      </div>
    </div>
  )
}

const wrapper = {
  padding: "12px 20px",
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
const row = {
  display: "flex",
  gap: "10px",
  flexWrap: "wrap",
}
const swatch = {
  width: "48px",
  height: "48px",
  borderRadius: "10px",
  border: "2px solid #e2e8f0",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "18px",
  padding: 0,
}
const swatchActive = {
  border: "3px solid #062f8f",
}
const noneIcon = {
  fontSize: "16px",
}
const uploadSwatch = {
  ...swatch,
  background: "white",
  color: "#94a3b8",
  fontSize: "22px",
  fontWeight: "300",
  border: "2px dashed #cbd5e1",
}

export default BackgroundPicker