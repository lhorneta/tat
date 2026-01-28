import { Route, Routes } from 'react-router-dom'
import { ToursManager } from './features/tours/ToursManager'

function App() {
  return (
    <Routes>
      <Route path="*" element={<ToursManager />} />
    </Routes>
  )
}

export default App