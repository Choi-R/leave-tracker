import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import BasicView from './BasicView'
import AdminView from './AdminView'
import styles from './Dashboard.module.css'

// Dashboard serves as the main authenticated layout. It fetches the user's data
// and decides whether to show the AdminView or BasicView.
export default function Dashboard({ session }) {
    // --- STATE VARIABLES ---
    const [loading, setLoading] = useState(true) // Wait until all data is fetched
    const [profile, setProfile] = useState(null) // The current user's database profile (name, role, quotas)
    const [leaveTypes, setLeaveTypes] = useState([]) // List of available leave types (Sick, Annual, etc.)
    const [requests, setRequests] = useState([]) // Array of leave requests
    const [allProfiles, setAllProfiles] = useState([]) // Array of ALL users (only fetched if current user is admin)
    const [errorMsg, setErrorMsg] = useState('')

    // --- USE EFFECT ---
    // Fetch data immediately when the Dashboard loads
    useEffect(() => {
        fetchInitialData()
    }, [])

    // --- DATA FETCHING ---
    const fetchInitialData = async () => {
        try {
            setLoading(true)

            // 1. Fetch the currently logged in user's profile
            const { data: profileData, error: profileErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id) // Match the Supabase Auth ID with the Profiles table ID
                .is('deleted_at', null)    // Ignore soft-deleted accounts
                .single()                  // Expect exactly one row

            if (profileErr) throw profileErr
            setProfile(profileData)

            // 2. Fetch the catalog of leave types from the database
            const { data: typesData, error: typesErr } = await supabase
                .from('leave_types')
                .select('*')
                .order('name') // Sort alphabetically

            if (typesErr) throw typesErr
            setLeaveTypes(typesData)

            // 3. Fetch requests based on the user's role
            const currentYear = new Date().getFullYear();

            if (profileData.role === 'admin') {
                // If ADMIN: Fetch EVERYONE's leave requests, and attach their profile info and leave type info
                const { data: allReqData, error: allReqErr } = await supabase
                    .from('leave_requests')
                    .select('*, profiles(name, email), leave_types(name, category)')
                    .is('deleted_at', null)
                    .order('date', { ascending: false })

                if (allReqErr) throw allReqErr
                setRequests(allReqData)

                // Admins also need a list of all users to populate the "Manage Employee" table
                const { data: allProfData, error: allProfErr } = await supabase
                    .from('profiles')
                    .select('*')
                    .is('deleted_at', null)
                    .order('name')

                if (allProfErr) throw allProfErr
                setAllProfiles(allProfData)
            } else {
                // If BASIC USER: Only fetch their OWN leave requests
                const { data: reqData, error: reqErr } = await supabase
                    .from('leave_requests')
                    .select('*, leave_types(name, category)')
                    .eq('user_id', session.user.id) // Filter by their ID
                    .is('deleted_at', null)
                    .order('date', { ascending: false }) // Newest first

                if (reqErr) throw reqErr
                setRequests(reqData)
            }
        } catch (error) {
            setErrorMsg(error.message)
        } finally {
            setLoading(false)
        }
    }

    // --- ADMIN ACTION HANDLERS ---
    // These functions are passed down to the AdminView component as props.

    // Edits the annual and sick quota for a specific user
    const updateProfileQuotas = async (profileId, newYearly, newSick) => {
        try {
            // Update the database
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

    // --- LEAVE TYPE CRUD HANDLERS ---

    // Add a new leave type
    const addLeaveType = async (name, category) => {
        try {
            const { data, error } = await supabase
                .from('leave_types')
                .insert([{ name, category }])
                .select()
                .single()

            if (error) throw error

            setLeaveTypes(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)))
        } catch (err) {
            alert("Error adding leave type: " + err.message)
        }
    }

    // Update an existing leave type
    const updateLeaveType = async (id, name, category) => {
        try {
            const { error } = await supabase
                .from('leave_types')
                .update({ name, category })
                .eq('id', id)

            if (error) throw error

            setLeaveTypes(prev => prev.map(t =>
                t.id === id ? { ...t, name, category } : t
            ).sort((a, b) => a.name.localeCompare(b.name)))
        } catch (err) {
            alert("Error updating leave type: " + err.message)
        }
    }

    // Delete a leave type
    const deleteLeaveType = async (id) => {
        try {
            const { error } = await supabase
                .from('leave_types')
                .delete()
                .eq('id', id)

            if (error) {
                // If the leave type is already used in a leave request, deleting it violates foreign keys.
                if (error.code === '23503') {
                    throw new Error("Cannot delete this leave type because it is already used in existing leave requests.")
                }
                throw error
            }

            setLeaveTypes(prev => prev.filter(t => t.id !== id))
        } catch (err) {
            alert("Error deleting leave type: " + err.message)
        }
    }

    // --- USER ACTION HANDLERS ---
    // These functions are passed down to both BasicView and AdminView (since admins can also take leave).

    // Submits a new leave request to the database
    const submitLeaveRequest = async (typeId, date, amount, notes) => {
        try {
            const newRequest = {
                user_id: session.user.id,
                type_id: typeId,
                date,
                amount,
                notes
            }

            // Insert into Supabase and immediately ask for the created row back (.select().single())
            const { data, error } = await supabase
                .from('leave_requests')
                .insert([newRequest])
                .select()
                .single()

            if (error) throw error

            // Populate the mock data so it renders immediately without a hard page refresh.
            // When we inserted, we didn't get the joined table data (like leave_types.name),
            // so we manually stitch it together here for the UI.
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
                {/* 
                    Conditional Rendering: 
                    If the profile role is 'admin', render the AdminView and pass it all the admin-specific props.
                    Otherwise, render the BasicView.
                */}
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
                        addLeaveType={addLeaveType}
                        updateLeaveType={updateLeaveType}
                        deleteLeaveType={deleteLeaveType}
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
