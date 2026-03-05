import { useState } from 'react'
import { supabase } from './supabaseClient'
import styles from './Login.module.css'

// UpdatePassword is shown by App.jsx when the user arrives via a password reset link.
// It accepts a prop called 'onComplete' which is a function provided by the parent (App.jsx)
// that this component can call when it's done its job.
export default function UpdatePassword({ onComplete }) {
    // --- STATE VARIABLES ---
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState('') // Holds the new password
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    // --- FORM SUBMISSION HANDLER ---
    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')

        // Because the user clicked a secure link in their email, Supabase securely considers
        // them "logged in" for the purpose of updating their password.
        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            // Update failed
            setErrorMsg(error.message)
            setLoading(false)
        } else {
            // Update succeeded
            setSuccessMsg('Your password has been updated successfully!')
            setLoading(false)

            // Wait 2 seconds so the user can actually read the success message
            setTimeout(() => {
                // Remove the '#type=recovery' hash from the URL so we don't accidentally
                // trigger recovery mode again if the user refreshes the page.
                window.history.replaceState(null, '', window.location.pathname)

                // Call the function passed from App.jsx. This tells App.jsx to set 
                // recoveryMode to false, switching the UI back to Dashboard.
                if (onComplete) onComplete()
            }, 2000)
        }
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
                    <h2 className={styles.title}>Update Password</h2>
                    <p className={styles.subtitle}>Enter your new password below</p>
                </div>

                <form onSubmit={handleUpdatePassword} className={styles.form}>
                    {errorMsg && <div className={styles.error}>{errorMsg}</div>}
                    {successMsg && <div className={styles.success}>{successMsg}</div>}

                    <div className={styles.inputGroup}>
                        <label htmlFor="password" className={styles.label}>New Password</label>
                        <input
                            id="password"
                            className={styles.input}
                            type="password"
                            placeholder="Your new password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    <button className={styles.button} disabled={loading || !!successMsg} type="submit">
                        {loading ? 'Updating...' : 'Update Password'}
                    </button>

                    <div className={styles.toggleMode}>
                        <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => {
                                // If the user cancels, we manually clean up the URL hash
                                // and tell App.jsx we are done so it exits recovery mode.
                                window.history.replaceState(null, '', window.location.pathname)
                                if (onComplete) onComplete()
                            }}
                        >
                            Cancel and Go Back
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
