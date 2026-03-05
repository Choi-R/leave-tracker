import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css' // Imports global CSS styles that apply to the whole app

// App is our main root component that contains the rest of the application branches
import App from './App.jsx'

// createRoot is the entry point for React 18+. It hooks into the 'root' div in index.html
createRoot(document.getElementById('root')).render(
  // StrictMode is a tool for highlighting potential problems in an application.
  // It renders components twice (only in development) to detect side effects.
  <StrictMode>
    <App />
  </StrictMode>,
)
