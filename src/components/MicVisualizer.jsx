// components/MicVisualizer.jsx
// 🎤 This component has ONE job: draw the mic level bars.
// It receives `micLevel` as a prop — it doesn't know or care
// where that number comes from. That's separation of concerns!

// styles is now passed in as a prop (built from the live theme in Studio.jsx)
// instead of imported statically, so this bar chart re-colors with the brand.
//
// Notice the function signature: ({ micLevel, styles })
// This is called "destructuring" — instead of writing props.micLevel,
// we pull the value out directly. Very common React pattern.
function MicVisualizer({ micLevel, styles }) {
  return (
    <div style={styles.micWrapper}>
      {Array.from({ length: 12 }).map((_, index) => {
        const normalized = Math.min(micLevel / 100, 1)
        const minHeightPercent = 5
        const maxHeightPercent = 90
        const barPercent =
          minHeightPercent +
          normalized * (maxHeightPercent - minHeightPercent) * (0.7 + index * 0.025)

        return (
          <div
            key={index}
            style={{
              ...styles.micBar,
              height: `${Math.min(barPercent, maxHeightPercent)}%`,
            }}
          />
        )
      })}
    </div>
  )
}

export default MicVisualizer