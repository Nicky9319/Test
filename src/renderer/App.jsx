import { HashRouter as Router, Routes, Route } from 'react-router-dom'
import MainPage from './Features/main/components/mainPage'
import TaskBar from './Features/common/components/TaskBar'
// import AuthPage from './Features/auth/components/authPage'



function App() {
  // Example function to determine which route to show


  return (
    <div className="app-container">
      <TaskBar />
      <div className="main-content">
        <Router>
          <Routes>
            <Route
              path="/"
              element={<MainPage />}
            />
          </Routes>
        </Router>
      </div>
    </div>
  )
}

export default App
