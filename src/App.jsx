import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Login from './Login'
import Dashboard from './Dashboard'
import UpdatePassword from './UpdatePassword'
import './index.css'

function App() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [recoveryMode, setRecoveryMode] = useState(false)

  useEffect(() => {
    // Fetch initial session
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)

      // Also check if the URL contains a recovery hash directly on initial load
      if (window.location.hash.includes('type=recovery')) {
        setRecoveryMode(true)
      }

      setLoading(false)
    }

    fetchSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      if (event === 'PASSWORD_RECOVERY') {
        setRecoveryMode(true)
      }
    })

    // Cleanup subscription
    return () => subscription.unsubscribe()
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: '#94a3b8' }}>
        Loading Application...
      </div>
    )
  }

  if (recoveryMode) {
    return (
      <div className="app-container">
        <UpdatePassword onComplete={() => setRecoveryMode(false)} />
      </div>
    )
  }

  return (
    <div className="app-container">
      {session ? <Dashboard session={session} /> : <Login />}
    </div>
  )
}

export default App
