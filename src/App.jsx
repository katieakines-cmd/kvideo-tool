// App.jsx — now just the route switch.
// All the studio logic lives in pages/Studio.jsx,
// and the brand editor lives in pages/BrandBook.jsx.

import { Routes, Route } from "react-router-dom"
import Studio from "./pages/Studio"
import BrandBook from "./pages/BrandBook"

function App() {
  return (
    <Routes>
      <Route path="/" element={<Studio />} />
      <Route path="/brandbook" element={<BrandBook />} />
    </Routes>
  )
}

export default App
