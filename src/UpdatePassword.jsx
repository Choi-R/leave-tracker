import { useState } from 'react'
import { supabase } from './supabaseClient'
import styles from './Login.module.css'

export default function UpdatePassword({ onComplete }) {
    const [loading, setLoading] = useState(false)
    const [password, setPassword] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')

    const handleUpdatePassword = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')

        const { error } = await supabase.auth.updateUser({
            password: password
        })

        if (error) {
            setErrorMsg(error.message)
            setLoading(false)
        } else {
            setSuccessMsg('Your password has been updated successfully!')
            setLoading(false)
            // Wait 2 seconds before continuing
            setTimeout(() => {
                // Return to normal flow, clear hash
                window.history.replaceState(null, '', window.location.pathname)
                if (onComplete) onComplete()
            }, 2000)
        }
    }

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
