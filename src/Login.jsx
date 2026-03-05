import { useState } from 'react'
import { supabase } from './supabaseClient'
import styles from './Login.module.css'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [errorMsg, setErrorMsg] = useState('')
    const [successMsg, setSuccessMsg] = useState('')
    const [isResetMode, setIsResetMode] = useState(false)

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoading(true)
        setErrorMsg('')
        setSuccessMsg('')

        if (isResetMode) {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: window.location.origin,
            })
            if (error) {
                setErrorMsg(error.message)
            } else {
                setSuccessMsg('Password reset instructions sent to your email.')
            }
        } else {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (error) {
                setErrorMsg(error.message)
            }
        }
        setLoading(false)
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
                    <h2 className={styles.title}>Company Leave Tracker</h2>
                    <p className={styles.subtitle}>{isResetMode ? 'Reset your password' : 'Sign in to manage your time off'}</p>
                </div>

                <form onSubmit={handleLogin} className={styles.form}>
                    {errorMsg && <div className={styles.error}>{errorMsg}</div>}
                    {successMsg && <div className={styles.success}>{successMsg}</div>}
                    <div className={styles.inputGroup}>
                        <label htmlFor="email" className={styles.label}>Email Address</label>
                        <input
                            id="email"
                            className={styles.input}
                            type="email"
                            placeholder="name@company.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
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

                    <div className={styles.toggleMode}>
                        <button
                            type="button"
                            className={styles.textButton}
                            onClick={() => {
                                setIsResetMode(!isResetMode)
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
