// styles/styles.js
// Now theme-aware: instead of hardcoded colors, buildColors() and buildStyles()
// take the live brand theme (from BrandContext) and derive every value from it.
// This is what makes brand changes show up live in the Studio, not just the preview.

// ── Colors ───────────────────────────────────────────────────────────────
// Maps brand theme tokens onto the same shape the old hardcoded `colors`
// object had, so existing components (RoomControls, AudioSourceSelector)
// keep working with minimal changes — just pass buildColors(theme) in as a prop.
export function buildColors(theme) {
  const c = theme.colors
  return {
    brand: c.primary,
    brandLight: c.accent,
    bg: c.background,
    bgCard: c.surfaceAlt,
    bgMic: `${c.primary}0D`, // ~5% alpha version of primary, replaces old rgba
    black: "#000",
    blue: { light: c.accent, mid: c.secondary },
    green: c.success,
    red: c.danger,
    border: c.border,
  }
}

// ── Shared panel size ──────────────────────────────────────────────────────
// Not theme-dependent — layout only, kept as a plain export.
export const videoPanelBase = {
  width: "45%",
  aspectRatio: "16 / 9",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
  flexShrink: 0,
}

// ── Full style object, rebuilt any time the theme changes ─────────────────
export function buildStyles(theme) {
  const colors = buildColors(theme)
  const fonts  = theme.fonts

  return {
    colors, // handy to have alongside styles when a component needs both

    app: {
      fontFamily: fonts.body,
      backgroundColor: colors.bg,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
    },
    content: {
      display: "flex",
      flex: 1,
      minHeight: "300px",
    },
    header: {
      padding: "16px",
      backgroundColor: colors.brand,
      color: "white",
      textAlign: "center",
    },
    subtitle: { margin: 0, opacity: 0.8 },

    micWrapper: {
      width: "70px",
      background: colors.bgMic,
      display: "flex",
      alignItems: "flex-end",
      justifyContent: "space-between",
      padding: "20px 8px",
      boxShadow: `inset -2px 0 10px ${colors.brand}33`,
    },
    micBar: {
      width: "6px",
      borderRadius: "20px",
      transition: "height 0.08s ease",
      background: `linear-gradient(to top, ${colors.brandLight}, ${colors.brand})`,
      boxShadow: `0 0 14px ${colors.brand}99`,
    },

    cameraZone: {
      flex: 1,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      gap: "24px",
      padding: "32px",
    },

    // Placeholder box — uses videoPanelBase for identical sizing to CameraPanel
    videoBoxPlaceholder: {
      ...videoPanelBase,
      backgroundColor: colors.blue.light,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: colors.brand,
      fontWeight: "600",
      fontSize: "15px",
    },

    controls: {
      padding: "20px",
      display: "flex",
      gap: "20px",
      justifyContent: "center",
      alignItems: "center",
      flexWrap: "wrap",
    },
    button: {
      padding: "12px 22px",
      fontSize: "16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: colors.blue.mid,
      color: "white",
      cursor: "pointer",
    },
    buttonRecord: {
      padding: "12px 22px",
      fontSize: "16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: colors.green,
      color: "white",
      cursor: "pointer",
    },
    buttonStop: {
      padding: "12px 22px",
      fontSize: "16px",
      borderRadius: "10px",
      border: "none",
      backgroundColor: colors.red,
      color: "white",
      cursor: "pointer",
    },

    library: { padding: "30px", background: colors.bgCard },
    libraryTitle: { marginBottom: "15px", fontFamily: fonts.heading },
    clip: {
      display: "flex",
      alignItems: "center",
      gap: "20px",
      marginBottom: "20px",
    },
    clipVideo: { width: "200px", borderRadius: "8px" },
    footer: {
      padding: "15px",
      textAlign: "center",
      backgroundColor: colors.border,
    },
  }
}
