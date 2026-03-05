import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import BasicView from './BasicView'
import AdminView from './AdminView'
import styles from './Dashboard.module.css'

export default function Dashboard({ session }) {
    const [loading, setLoading] = useState(true)
    const [profile, setProfile] = useState(null)
    const [leaveTypes, setLeaveTypes] = useState([])
    const [requests, setRequests] = useState([])
    const [allProfiles, setAllProfiles] = useState([])
    const [errorMsg, setErrorMsg] = useState('')

    useEffect(() => {
        fetchInitialData()
    }, [])

    const fetchInitialData = async () => {
        try {
            setLoading(true)

            const { data: profileData, error: profileErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .is('deleted_at', null)
                .single()

            if (profileErr) throw profileErr
            setProfile(profileData)

            const { data: typesData, error: typesErr } = await supabase
                .from('leave_types')
                .select('*')
                .order('name')

            if (typesErr) throw typesErr
            setLeaveTypes(typesData)

            // Fetch requests based on role
            const currentYear = new Date().getFullYear();

            if (profileData.role === 'admin') {
                const { data: allReqData, error: allReqErr } = await supabase
                    .from('leave_requests')
                    .select('*, profiles(name, email), leave_types(name, category)')
                    .is('deleted_at', null)
                    .order('date', { ascending: false })

                if (allReqErr) throw allReqErr
                setRequests(allReqData)

                const { data: allProfData, error: allProfErr } = await supabase
                    .from('profiles')
                    .select('*')
                    .is('deleted_at', null)
                    .order('name')

                if (allProfErr) throw allProfErr
                setAllProfiles(allProfData)
            } else {
                const { data: reqData, error: reqErr } = await supabase
                    .from('leave_requests')
                    .select('*, leave_types(name, category)')
                    .eq('user_id', session.user.id)
                    .is('deleted_at', null)
                    .order('date', { ascending: false })

                if (reqErr) throw reqErr
                setRequests(reqData)
            }
        } catch (error) {
            setErrorMsg(error.message)
        } finally {
            setLoading(false)
        }
    }

    // Admin updates profile
    const updateProfileQuotas = async (profileId, newYearly, newSick) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ yearly_quota: newYearly, sick_quota: newSick })
                .eq('id', profileId)

            if (error) throw error

            // Update local state
            setAllProfiles(prev => prev.map(p =>
                p.id === profileId ? { ...p, yearly_quota: newYearly, sick_quota: newSick } : p
            ))
            if (profileId === profile.id) {
                setProfile({ ...profile, yearly_quota: newYearly, sick_quota: newSick })
            }
        } catch (err) {
            alert("Error updating quotas: " + err.message)
        }
    }

    const addNewProfileLocally = (newProfile) => {
        setAllProfiles(prev => [...prev, newProfile].sort((a, b) => (a.name || '').localeCompare(b.name || '')))
    }

    const deleteProfile = async (profileId) => {
        try {
            const { error } = await supabase
                .rpc('soft_delete_user', { target_user: profileId })

            if (error) throw error

            setAllProfiles(prev => prev.filter(p => p.id !== profileId))
            setRequests(prev => prev.filter(req => req.user_id !== profileId))
        } catch (err) {
            alert("Error deleting user: " + err.message)
        }
    }

    // Basic user adds new request
    const submitLeaveRequest = async (typeId, date, amount, notes) => {
        try {
            const newRequest = {
                user_id: session.user.id,
                type_id: typeId,
                date,
                amount,
                notes
            }

            const { data, error } = await supabase
                .from('leave_requests')
                .insert([newRequest])
                .select()
                .single()

            if (error) throw error

            // Populate the mock data so it renders immediately without a hard refresh
            const leaveTypeObj = leaveTypes.find(t => t.id === typeId)
            const populatedReq = {
                ...data,
                profiles: { name: profile.name },
                leave_types: {
                    name: leaveTypeObj?.name || 'Unknown',
                    category: leaveTypeObj?.category || 'non-deductible'
                }
            }

            setRequests(prev => [populatedReq, ...prev].sort((a, b) => new Date(b.date) - new Date(a.date)))
        } catch (err) {
            alert("Error submitting request: " + err.message)
        }
    }

    const deleteLeaveRequest = async (requestId) => {
        try {
            const { error } = await supabase
                .from('leave_requests')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', requestId)

            if (error) throw error

            setRequests(prev => prev.filter(req => req.id !== requestId))
        } catch (err) {
            alert("Error deleting request: " + err.message)
        }
    }

    const [isSigningOut, setIsSigningOut] = useState(false)

    const handleSignOut = async () => {
        setIsSigningOut(true)
        await supabase.auth.signOut()
    }

    if (loading) {
        return (
            <div className={styles.layout}>
                <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center', color: 'var(--text-muted)' }}>
                    Loading Dashboard...
                </div>
            </div>
        )
    }

    if (errorMsg) {
        return (
            <div className={styles.layout}>
                <div style={{ display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center' }}>
                    <div className={styles.error} style={{ maxWidth: '400px', textAlign: 'center' }}>
                        <h3>Error Loading Dashboard</h3>
                        <p>{errorMsg}</p>
                        <button
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: 'var(--primary)', color: 'white', borderRadius: '4px', opacity: isSigningOut ? 0.7 : 1 }}
                        >
                            {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    if (!profile) return <div className={styles.error}>Profile not found. Please contact admin.</div>

    return (
        <div className={styles.layout}>
            <header className={styles.header}>
                <div className={styles.headerContent}>
                    <div className={styles.brand}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                            <line x1="16" y1="2" x2="16" y2="6"></line>
                            <line x1="8" y1="2" x2="8" y2="6"></line>
                            <line x1="3" y1="10" x2="21" y2="10"></line>
                        </svg>
                        <h1 className={styles.title}>Leave Tracker</h1>
                        {profile.role === 'admin' && (
                            <span className={styles.roleBadge}>Admin</span>
                        )}
                    </div>
                    <div className={styles.userSection}>
                        <span className={styles.greeting}>Hi, {profile.name || session.user.email}</span>
                        <button
                            className={styles.signOutBtn}
                            onClick={handleSignOut}
                            disabled={isSigningOut}
                            style={{ opacity: isSigningOut ? 0.7 : 1, cursor: isSigningOut ? 'not-allowed' : 'pointer' }}
                        >
                            {isSigningOut ? 'Signing out...' : 'Sign Out'}
                        </button>
                    </div>
                </div>
            </header>

            <main className={styles.main}>
                {profile.role === 'admin' ? (
                    <AdminView
                        profile={profile}
                        allProfiles={allProfiles}
                        requests={requests}
                        leaveTypes={leaveTypes}
                        updateProfileQuotas={updateProfileQuotas}
                        submitLeaveRequest={submitLeaveRequest}
                        addNewProfileLocally={addNewProfileLocally}
                        deleteProfile={deleteProfile}
                        deleteLeaveRequest={deleteLeaveRequest}
                    />
                ) : (
                    <BasicView
                        profile={profile}
                        requests={requests}
                        leaveTypes={leaveTypes}
                        submitLeaveRequest={submitLeaveRequest}
                        deleteLeaveRequest={deleteLeaveRequest}
                    />
                )}
            </main>
        </div>
    )
}
