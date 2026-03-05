import { useState } from 'react'
import { supabase } from './supabaseClient'
import styles from './Login.module.css'

// Login component handles both signing in and requesting a password reset
export default function Login() {
    // --- STATE VARIABLES ---
    const [loading, setLoading] = useState(false) // True when waiting for Supabase
    const [email, setEmail] = useState('') // Controlled input for email address
    const [password, setPassword] = useState('') // Controlled input for password
    const [errorMsg, setErrorMsg] = useState('') // Message to show if login fails
    const [successMsg, setSuccessMsg] = useState('') // Message to show if reset link is sent
    const [isResetMode, setIsResetMode] = useState(false) // Toggles between "Sign In" and "Forgot Password" forms

    // --- FORM SUBMISSION HANDLER ---
    // This runs when the user clicks the "Sign In" or "Send Reset Link" button
    const handleLogin = async (e) => {
        // e.preventDefault() stops the browser from refreshing the page when submitting the form
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')

        // Check which mode the form is in
        if (isResetMode) {
            // IF IN RESET MODE: Ask Supabase to send a reset email
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                // redirectTo tells Supabase where to send the user after they click the email link.
                // window.location.origin is the base URL of our app (e.g. http://localhost:5173)
                redirectTo: window.location.origin,
            })
            if (error) {
                setErrorMsg(error.message) // Show error if Supabase complains (e.g. invalid email)
            } else {
                setSuccessMsg('Password reset instructions sent to your email.')
            }
        } else {
            // IF IN LOGIN MODE: Ask Supabase to sign the user in
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            // Note: If sign-in is successful, the App.jsx 'onAuthStateChange' listener 
            // will notice automatically and switch the view to Dashboard. We don't need to 
            // manually redirect here. We only handle errors.
            if (error) {
                setErrorMsg(error.message)
            }
        }

        // Operation finished, turn off loading state
        setLoading(false)
    }

    // --- RENDER FLOW ---

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <div className={styles.logo}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--primary)', marginBottom: '1rem' }}>
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                        <line x1="16" y1="2" x2="16" y2="6"></line>
                        <line x1="8" y1="2" x2="8" y2="6"></line>
                        <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    <h2 className={styles.title}>Company Leave Tracker</h2>
                    <p className={styles.subtitle}>{isResetMode ? 'Reset your password' : 'Sign in to manage your time off'}</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    {/* Conditionally render error or success messages if they exist */}
                    {errorMsg && <div className={styles.error}>{errorMsg}</div>}
                    {successMsg && <div className={styles.success}>{successMsg}</div>}

                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Email Address</label>
                        <input
                            id="email"
                            className={styles.input}
                            type="email"
                            placeholder="name@company.com"
                            // Tie the input value to the 'email' state variable
                            value={email}
                            // Update the state variable every time the user types a character
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    {/* Only show the password field if we are NOT in reset mode */}
                    {!isResetMode && (
                        <div className={styles.inputGroup}>
                            <label htmlFor="password" className={styles.label}>Password</label>
                            <input
                                id="password"
                                className={styles.input}
                                type="password"
                                placeholder="Your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>
                    )}
                    <button className={styles.button} disabled={loading} type="submit">
                        {loading
                            ? (isResetMode ? 'Sending...' : 'Signing in...')
                            : (isResetMode ? 'Send Reset Link' : 'Sign In')}
                    </button>

                    {/* Toggle between "Sign In" and "Forgot Password" */}
                    <div className={styles.toggleMode}>
                        <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => {
                                // Flip the boolean state
                                setIsResetMode(!isResetMode)
                                // Clear any leftover messages
                                setErrorMsg('')
                                setSuccessMsg('')
                            }}
                        >
                            {isResetMode ? 'Back to Sign In' : 'Forgot Password?'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
