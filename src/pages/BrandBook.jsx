// pages/BrandBook.jsx
// Katie's Brandbook — the full page experience.
// Three sections: theme gallery, editor, live preview.
// This is what makes your tool unique — brand changes
// show up on a real preview of YOUR recording studio.

import { useState, useCallback } from "react"
import { useNavigate } from "react-router-dom"
import { useBrand, HOME_BASE_THEME } from "../context/BrandContext"
import BrandEditor from "../components/BrandEditor"
import BrandPreview from "../components/BrandPreview"
import BrandThemeCard from "../components/BrandThemeCard"

function BrandBook() {
  const navigate = useNavigate()
  const { theme, savedThemes, applyTheme, saveTheme, deleteTheme, resetHomeBase } = useBrand()

  // Draft is what the editor is working on — not yet applied
  const [draft, setDraft] = useState(theme)
  const [activeTab, setActiveTab] = useState("gallery") // "gallery" | "editor"
  const [saveSuccess, setSaveSuccess] = useState(false)

  // Apply draft to the whole app
  const handleApplyDraft = useCallback(() => {
    applyTheme(draft)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }, [draft, applyTheme])

  // Save as a new named theme
  const handleSaveNew = useCallback(() => {
    const saved = saveTheme(draft)
    applyTheme(saved)
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 2000)
  }, [draft, saveTheme, applyTheme])

  // Export theme as JSON
  const handleExport = useCallback(() => {
    const json = JSON.stringify(draft, null, 2)
    const blob = new Blob([json], { type: "application/json" })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement("a")
    a.href     = url
    a.download = `${draft.name.replace(/\s+/g, "-").toLowerCase()}-theme.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [draft])

  // Import theme from JSON
  const handleImport = useCallback((e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      try {
        const imported = JSON.parse(ev.target.result)
        setDraft({ ...imported, id: `imported-${Date.now()}`, isHomeBase: false })
        setActiveTab("editor")
      } catch {
        alert("Could not read theme file. Make sure it's a valid JSON theme.")
      }
    }
    reader.readAsText(file)
    e.target.value = ""
  }, [])

  const allThemes = [HOME_BASE_THEME, ...savedThemes]

  return (
    <div style={{ ...page, background: draft.colors.background, fontFamily: draft.fonts.body }}>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{ ...topBar, background: draft.colors.primary }}>
        <button style={backBtn} onClick={() => navigate("/")}>
          ← Studio
        </button>
        <div style={topBarCenter}>
          {draft.logo && <img src={draft.logo} alt="" style={topBarLogo} />}
          <h1 style={{ ...title, fontFamily: draft.fonts.heading }}>
            Katie's Brandbook
          </h1>
        </div>
        <div style={topBarActions}>
          <label style={importBtn}>
            Import
            <input type="file" accept=".json" onChange={handleImport} style={{ display: "none" }} />
          </label>
          <button style={exportBtn} onClick={handleExport}>
            Export
          </button>
        </div>
      </div>

      {/* ── Tab nav ──────────────────────────────────────────────────────── */}
      <div style={{ ...tabBar, borderColor: draft.colors.border }}>
        {[
          { id: "gallery", label: "🎨 Theme Gallery" },
          { id: "editor",  label: "✏️ Editor" },
        ].map(tab => (
          <button
            key={tab.id}
            style={{
              ...tabBtn,
              color: activeTab === tab.id ? draft.colors.primary : draft.colors.textMuted,
              borderBottom: activeTab === tab.id
                ? `3px solid ${draft.colors.primary}`
                : "3px solid transparent",
              fontFamily: draft.fonts.body,
            }}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Gallery tab ──────────────────────────────────────────────────── */}
      {activeTab === "gallery" && (
        <div style={galleryPane}>
          <div style={galleryHeader}>
            <div>
              <h2 style={{ ...sectionHeading, fontFamily: draft.fonts.heading, color: draft.colors.textPrimary }}>
                Your themes
              </h2>
              <p style={{ margin: 0, fontSize: "14px", color: draft.colors.textMuted }}>
                Click Apply to instantly repaint the whole studio.
              </p>
            </div>
            <button
              style={{ ...newThemeBtn, background: draft.colors.primary }}
              onClick={() => {
                setDraft({ ...theme, id: `new-${Date.now()}`, name: "New Theme", isHomeBase: false })
                setActiveTab("editor")
              }}
            >
              + New theme
            </button>
          </div>

          <div style={themeGrid}>
            {allThemes.map(t => (
              <BrandThemeCard
                key={t.id}
                theme={t}
                isActive={theme.id === t.id}
                onApply={(t) => { applyTheme(t); setDraft(t) }}
                onDelete={deleteTheme}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── Editor tab ───────────────────────────────────────────────────── */}
      {activeTab === "editor" && (
        <div style={editorPane}>

          {/* Left: controls */}
          <div style={editorLeft}>
            <BrandEditor theme={draft} onChange={setDraft} />
          </div>

          {/* Right: live preview + actions */}
          <div style={editorRight}>
            <div style={previewSticky}>
              <BrandPreview theme={draft} />

              {/* Action buttons */}
              <div style={editorActions}>
                <button
                  style={{ ...actionBtn, background: draft.colors.primary }}
                  onClick={handleApplyDraft}
                >
                  {saveSuccess ? "✓ Applied!" : "Apply to studio"}
                </button>
                {!draft.isHomeBase && (
                  <button
                    style={{ ...actionBtn, background: draft.colors.secondary }}
                    onClick={handleSaveNew}
                  >
                    Save as new theme
                  </button>
                )}
                {draft.isHomeBase && (
                  <button
                    style={{ ...outlineActionBtn, borderColor: draft.colors.border, color: draft.colors.textMuted }}
                    onClick={() => { resetHomeBase(); setDraft(HOME_BASE_THEME) }}
                  >
                    Reset to defaults
                  </button>
                )}
              </div>

              {/* Color harmony hint */}
              <div style={{ ...harmonyHint, borderColor: draft.colors.border, background: draft.colors.surface }}>
                <p style={{ margin: "0 0 6px", fontSize: "12px", fontWeight: "700", color: draft.colors.textMuted }}>
                  YOUR BLUES
                </p>
                {["#062f8f", "#0754cb", "#215ca4"].map(c => (
                  <div key={c} style={harmonyRow}>
                    <div style={{ ...harmonySwatch, background: c }} />
                    <span style={{ fontFamily: "monospace", fontSize: "12px", color: draft.colors.textMuted }}>{c}</span>
                  </div>
                ))}
                <p style={{ margin: "8px 0 0", fontSize: "11px", color: draft.colors.textMuted }}>
                  Click any color swatch above to apply these to your palette.
                </p>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  )
}

// ── Page styles ────────────────────────────────────────────────────────────
const page = {
  minHeight: "100vh",
  display: "flex",
  flexDirection: "column",
}
const topBar = {
  padding: "12px 24px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
}
const backBtn = {
  background: "rgba(255,255,255,0.15)",
  border: "none",
  color: "white",
  padding: "8px 14px",
  borderRadius: "8px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: "600",
}
const topBarCenter = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
}
const topBarLogo = {
  width: "28px",
  height: "28px",
  objectFit: "contain",
  borderRadius: "6px",
}
const title = {
  margin: 0,
  fontSize: "20px",
  fontWeight: "800",
  color: "white",
}
const topBarActions = {
  display: "flex",
  gap: "8px",
}
const importBtn = {
  padding: "8px 14px",
  fontSize: "13px",
  fontWeight: "600",
  borderRadius: "8px",
  border: "1.5px solid rgba(255,255,255,0.3)",
  color: "white",
  cursor: "pointer",
  background: "transparent",
}
const exportBtn = {
  ...importBtn,
  background: "rgba(255,255,255,0.15)",
}
const tabBar = {
  display: "flex",
  gap: "0",
  padding: "0 24px",
  background: "white",
  borderBottom: "1px solid",
}
const tabBtn = {
  padding: "14px 20px",
  fontSize: "14px",
  fontWeight: "600",
  background: "none",
  border: "none",
  cursor: "pointer",
  transition: "all 0.15s ease",
}
const galleryPane = {
  padding: "32px 28px",
  flex: 1,
}
const galleryHeader = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  marginBottom: "24px",
}
const sectionHeading = {
  margin: "0 0 4px",
  fontSize: "22px",
  fontWeight: "800",
}
const newThemeBtn = {
  padding: "10px 18px",
  fontSize: "14px",
  fontWeight: "700",
  borderRadius: "10px",
  border: "none",
  color: "white",
  cursor: "pointer",
}
const themeGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
  gap: "20px",
}
const editorPane = {
  display: "flex",
  flex: 1,
  overflow: "hidden",
}
const editorLeft = {
  width: "380px",
  flexShrink: 0,
  borderRight: "1px solid #e2e8f0",
  overflowY: "auto",
  background: "white",
}
const editorRight = {
  flex: 1,
  padding: "28px",
  overflowY: "auto",
  background: "#f8fafc",
}
const previewSticky = {
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  maxWidth: "480px",
}
const editorActions = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
}
const actionBtn = {
  width: "100%",
  padding: "12px",
  fontSize: "14px",
  fontWeight: "700",
  borderRadius: "10px",
  border: "none",
  color: "white",
  cursor: "pointer",
}
const outlineActionBtn = {
  width: "100%",
  padding: "12px",
  fontSize: "14px",
  fontWeight: "600",
  borderRadius: "10px",
  border: "1.5px solid",
  background: "white",
  cursor: "pointer",
}
const harmonyHint = {
  padding: "14px",
  borderRadius: "10px",
  border: "1px solid",
}
const harmonyRow = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
  marginBottom: "6px",
}
const harmonySwatch = {
  width: "24px",
  height: "24px",
  borderRadius: "6px",
  flexShrink: 0,
}

export default BrandBook