// context/BrandContext.jsx
// The global brand state for the whole app.
// Any component that calls useBrand() gets the current theme
// and re-renders automatically when it changes.
//
// React Context is like a Python global config that every
// module can import — except when it changes, every
// component that uses it updates instantly. No prop drilling needed.

import { createContext, useContext, useState, useCallback } from "react"

// ── Default brand tokens ──────────────────────────────────────────────────
// These are the raw design values every component reads from.
// Think of them like CSS variables — one value drives many places.
export const HOME_BASE_THEME = {
  id:          "home-base",
  name:        "Home Base",
  isHomeBase:  true,
  colors: {
    primary:     "#062f8f",   // deep navy — headers, key buttons
    secondary:   "#0754cb",   // mid blue — accents, hover states
    tertiary:    "#215ca4",   // softer blue — backgrounds, cards
    background:  "#f4f6f8",   // app background
    surface:     "#ffffff",   // card/panel background
    surfaceAlt:  "#f8fafc",   // alternate surface (toolbars)
    border:      "#e2e8f0",   // borders and dividers
    textPrimary: "#0f172a",   // main text
    textMuted:   "#64748b",   // secondary text
    textOnBrand: "#ffffff",   // text ON primary color (buttons etc)
    success:     "#16a34a",   // green — recording, connected
    danger:      "#dc2626",   // red — stop, error
    accent:      "#9fd3ff",   // light blue — highlights, mic bars
  },
  fonts: {
    heading: "Lexend Deca",
    body:    "DM Sans",
  },
  logo: null,   // URL string or null
}

// ── Context setup ─────────────────────────────────────────────────────────
const BrandContext = createContext(null)

export function BrandProvider({ children }) {
  const [activeTheme, setActiveTheme] = useState(HOME_BASE_THEME)

  // Custom themes the user creates — persisted in localStorage
  // so they survive page refreshes (Phase 5 will move this to the cloud)
  const [savedThemes, setSavedThemes] = useState(() => {
    try {
      const stored = localStorage.getItem("kvideo-themes")
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // Apply a theme — triggers re-render of every consumer
  const applyTheme = useCallback((theme) => {
    setActiveTheme(theme)
    // Also inject CSS variables so any plain CSS also updates
    // This lets us use var(--brand-primary) in CSS files too
    const root = document.documentElement
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--brand-${key}`, value)
    })
    root.style.setProperty("--font-heading", theme.fonts.heading)
    root.style.setProperty("--font-body",    theme.fonts.body)
  }, [])

  // Save a new custom theme
  const saveTheme = useCallback((theme) => {
    const withId = { ...theme, id: `theme-${Date.now()}`, isHomeBase: false }
    setSavedThemes(prev => {
      const next = [...prev, withId]
      localStorage.setItem("kvideo-themes", JSON.stringify(next))
      return next
    })
    return withId
  }, [])

  // Update an existing theme
  const updateTheme = useCallback((id, updates) => {
    setSavedThemes(prev => {
      const next = prev.map(t => t.id === id ? { ...t, ...updates } : t)
      localStorage.setItem("kvideo-themes", JSON.stringify(next))
      return next
    })
  }, [])

  // Delete a custom theme
  const deleteTheme = useCallback((id) => {
    setSavedThemes(prev => {
      const next = prev.filter(t => t.id !== id)
      localStorage.setItem("kvideo-themes", JSON.stringify(next))
      return next
    })
    // If deleting active theme, revert to Home Base
    if (activeTheme.id === id) applyTheme(HOME_BASE_THEME)
  }, [activeTheme, applyTheme])

  // Reset Home Base to defaults
  const resetHomeBase = useCallback(() => {
    applyTheme(HOME_BASE_THEME)
  }, [applyTheme])

  return (
    <BrandContext.Provider value={{
      theme: activeTheme,
      savedThemes,
      applyTheme,
      saveTheme,
      updateTheme,
      deleteTheme,
      resetHomeBase,
    }}>
      {children}
    </BrandContext.Provider>
  )
}

// ── Hook for consuming brand in any component ─────────────────────────────
// Usage: const { theme } = useBrand()
// Then:  style={{ color: theme.colors.primary }}
export function useBrand() {
  const ctx = useContext(BrandContext)
  if (!ctx) throw new Error("useBrand must be used inside BrandProvider")
  return ctx
}