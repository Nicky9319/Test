import React from 'react'
import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import MainPage from './Features/main/components/mainPage'
import UndetectableWindowDemo from './UndetectableWindowDemo'
import TestUndetectableFeatures from './TestUndetectableFeatures'
// import AuthPage from './Features/auth/components/authPage'

function App() {
  return (
    <div className="app-container">
      <Router>
        <Routes>
          <Route
            path="/"
            element={<MainPage />}
          />
          <Route
            path="/undetectable-demo"
            element={<UndetectableWindowDemo />}
          />
          <Route
            path="/test-features"
            element={<TestUndetectableFeatures />}
          />
        </Routes>
      </Router>
    </div>
  )
}

export default App
