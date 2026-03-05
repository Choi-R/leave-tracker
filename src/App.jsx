// React specific hooks. useState is for holding data that changes, useEffect is for running code when the component loads.
import { useState, useEffect } from 'react'

// Imports the database client we configured in supabaseClient.js
import { supabase } from './supabaseClient'

// Importing children components that App will render depending on user state
import Login from './Login'
import Dashboard from './Dashboard'
import UpdatePassword from './UpdatePassword'

// Global CSS styles
import './index.css'

// App is the main "shell" component of the entire application
function App() {
  // --- STATE VARIABLES ---
  // session holds the logged-in user data. Null means the user is not logged in.
  const [session, setSession] = useState(null)

  // loading is true while we ask the database "is the user logged in?".
  // It prevents the app from flickering between Login and Dashboard before the database answers.
  const [loading, setLoading] = useState(true)

  // recoveryMode is true if the user clicks a "reset password" link from their email
  const [recoveryMode, setRecoveryMode] = useState(false)

  // --- USE EFFECT ---
  // useEffect runs the code inside it immediately after the App component renders for the first time.
  // The empty array [] at the end means "only run this once when the app starts".
  useEffect(() => {
    // A function to check if the user is already logged in (e.g., they refreshed the page)
    const fetchSession = async () => {
      // Ask Supabase to get the current session data
      const { data: { session } } = await supabase.auth.getSession()

      // Save that session data into our state variable
      setSession(session)

      // Check if the current website URL has '#type=recovery' in it.
      // This happens when clicking a password reset link sent via email.
      if (window.location.hash.includes('type=recovery')) {
        setRecoveryMode(true)
      }

      // We're done checking, so turn off the loading screen
      setLoading(false)
    }

    // Call the function we just created
    fetchSession()

    // Listen for auth changes (e.g., someone logs in or logs out in another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      // Update our state whenever the auth status changes
      setSession(session)

      // If Supabase tells us this is a password recovery event, turn on recovery mode
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }
    })

    // Cleanup subscription: When the App component dies (which is rare), stop listening.
    // This prevents memory leaks.
    return () => subscription.unsubscribe()
  }, []) // End of useEffect

  // --- RENDER FLOW ---
  // The UI that this component shows depends on the state variables above.

  // 1. If we are still checking the database, show a loading screen.
  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
        Loading Application...
      </div>
    )
  }

  // 2. If the user clicked a password reset link, show the Update Password screen.
  if (recoveryMode) {
    return (
      <div className="app-container">
        {/* Pass a prop called 'onComplete' so UpdatePassword can tell App when it's done */}
        <UpdatePassword onComplete={() => setRecoveryMode(false)} />
      </div>
    )
  }

  // 3. Otherwise, show the main app. 
  // If 'session' exists (logged in), show the Dashboard.
  // If 'session' is null (not logged in), show the Login screen.
  return (
    <div className="app-container">
      {session ? <Dashboard session={session} /> : <Login />}
    </div>
  )
}

// Exporting the App component so it can be imported in main.jsx
export default App
