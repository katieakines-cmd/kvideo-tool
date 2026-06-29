// styles/styles.js

export const colors = {
  brand: "#062f8f",
  brandLight: "#9fd3ff",
  bg: "#f4f6f8",
  bgCard: "#f8fafc",
  bgMic: "rgba(6, 47, 143, 0.05)",
  black: "#000",
  blue: { light: "#dbeafe", mid: "#2563eb" },
  green: "#16a34a",
  red: "#dc2626",
  border: "#e2e8f0",
}

// ── Shared panel size ──────────────────────────────────────────────────────
// Both the live camera panel AND the placeholder use this exact same style.
// This guarantees they're always identical in size, no stretching.
export const videoPanelBase = {
  width: "45%",
  aspectRatio: "16 / 9",
  borderRadius: "20px",
  overflow: "hidden",
  boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
  flexShrink: 0,
}

export const styles = {
  app: {
    fontFamily: "system-ui, sans-serif",
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
    boxShadow: "inset -2px 0 10px rgba(6,47,143,0.2)",
  },
  micBar: {
    width: "6px",
    borderRadius: "20px",
    transition: "height 0.08s ease",
    background: `linear-gradient(to top, ${colors.brandLight}, ${colors.brand})`,
    boxShadow: `0 0 14px rgba(6, 47, 143, 0.6)`,
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
  libraryTitle: { marginBottom: "15px" },
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