// components/MicVisualizer.jsx
// 🎤 This component has ONE job: draw the mic level bars.
// It receives `micLevel` as a prop — it doesn't know or care
// where that number comes from. That's separation of concerns!

import { styles } from "../styles/styles"

// Notice the function signature: ({ micLevel })
// This is called "destructuring" — instead of writing props.micLevel,
// we pull the value out directly. Very common React pattern.
function MicVisualizer({ micLevel }) {
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