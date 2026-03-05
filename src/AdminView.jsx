import { useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { supabase, supabaseUrl, supabaseAnonKey } from './supabaseClient'
import BasicView from './BasicView'
import styles from './AdminView.module.css'

// AdminView is only rendered if the logged-in user has the 'admin' role.
// It receives data (like all profiles and all requests) and functions (like deleteProfile) 
// as "props" from Dashboard.jsx.
export default function AdminView({ profile, allProfiles, requests, leaveTypes, updateProfileQuotas, submitLeaveRequest, addNewProfileLocally, deleteProfile, deleteLeaveRequest, addLeaveType, updateLeaveType, deleteLeaveType }) {
    // --- STATE VARIABLES ---
    // activeTab controls which section of the admin dashboard is currently visible
    const [activeTab, setActiveTab] = useState('requests') // 'requests', 'profiles', or 'my_leave'

    // --- DERIVED STATE ---
    // We filter the massive 'requests' array (which contains EVERYONE's requests)
    // to only include ones belonging to the currently logged in admin.
    const myRequests = requests.filter(req => req.user_id === profile.id)

    // --- RENDER FLOW ---
    return (
        <div className={styles.container}>
            <div className={styles.tabs}>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'requests' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('requests')}
                >
                    All Leave Requests
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'calendar' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('calendar')}
                >
                    Calendar
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'profiles' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('profiles')}
                >
                    Manage Employee
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'leave_types' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('leave_types')}
                >
                    Leave Types
                </button>
                <button
                    className={`${styles.tabBtn} ${activeTab === 'my_leave' ? styles.activeTab : ''}`}
                    onClick={() => setActiveTab('my_leave')}
                >
                    My Leave
                </button>
            </div>

            <div className={styles.contentPanel}>
                {/* Render the specific component based on which tab is active */}

                {activeTab === 'requests' && (
                    <RequestsTable requests={requests} allProfiles={allProfiles} deleteLeaveRequest={deleteLeaveRequest} />
                )}

                {activeTab === 'calendar' && (
                    <CalendarView requests={requests} allProfiles={allProfiles} />
                )}

                {activeTab === 'profiles' && (
                    <>
                        <AddEmployeeForm onEmployeeAdded={addNewProfileLocally} />
                        <ProfilesTable profiles={allProfiles} requests={requests} updateProfileQuotas={updateProfileQuotas} deleteProfile={deleteProfile} />
                    </>
                )}

                {activeTab === 'leave_types' && (
                    <LeaveTypesTable
                        leaveTypes={leaveTypes}
                        addLeaveType={addLeaveType}
                        updateLeaveType={updateLeaveType}
                        deleteLeaveType={deleteLeaveType}
                    />
                )}

                {activeTab === 'my_leave' && (
                    // Admins use the exact same BasicView component for their own leave as regular employees do!
                    <BasicView
                        profile={profile}
                        requests={myRequests} // Notice we pass the filtered requests here, not all requests
                        leaveTypes={leaveTypes}
                        submitLeaveRequest={submitLeaveRequest}
                        updateProfileQuotas={updateProfileQuotas}
                        deleteLeaveRequest={deleteLeaveRequest}
                    />
                )}
            </div>
        </div>
    )
}

// --- SUB-COMPONENTS ---
// These are smaller components defined in the same file to keep things organized.
// They are only used by AdminView.

function RequestsTable({ requests, allProfiles, deleteLeaveRequest }) {
    // We need to figure out what the current year is so we can set it as the default filter
    const currentYear = new Date().getFullYear().toString()

    // --- STATE VARIABLES ---
    const [yearFilter, setYearFilter] = useState(currentYear) // The currently selected year in the dropdown
    const [userFilter, setUserFilter] = useState('all')       // The currently selected user in the dropdown
    const [currentPage, setCurrentPage] = useState(1)         // For pagination tracking

    const itemsPerPage = 10 // How many rows to show per page

    // A small helper function to format dates from YYYY-MM-DD to DD/MM/YYYY
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }

    // --- DATA PREPARATION ---

    // 1. Build the dropdown options for years.
    // We map over all requests, grab the first 4 characters (the year), put them in a Set (to remove duplicates),
    // convert it back to an array, and sort it from newest to oldest.
    const availableYears = Array.from(new Set(requests.map(req => req.date.substring(0, 4)))).sort((a, b) => b - a)
    if (!availableYears.includes(currentYear)) {
        availableYears.unshift(currentYear) // Ensure current year is always an option even if there are no requests
    }

    // 2. Filter the requests based on what the user selected in the dropdowns.
    const filteredRequests = requests.filter(req => {
        const reqYear = req.date.substring(0, 4)

        // If the years don't match (and we aren't showing 'all'), throw this row away
        if (yearFilter !== 'all' && reqYear !== yearFilter) return false

        // If the users don't match (and we aren't showing 'all'), throw this row away
        if (userFilter !== 'all' && req.user_id !== userFilter) return false

        // If it passed all tests, keep it
        return true
    })

    // 3. Slice the filtered list for pagination
    const totalPages = Math.ceil(filteredRequests.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedRequests = filteredRequests.slice(startIndex, startIndex + itemsPerPage) // Grab exactly 10 items starting from the index

    // --- EVENT HANDLERS ---
    // Reset back to page 1 whenever a filter is changed
    const handleYearChange = (e) => {
        setYearFilter(e.target.value)
        setCurrentPage(1)
    }

    const handleUserChange = (e) => {
        setUserFilter(e.target.value)
        setCurrentPage(1)
    }

    if (!requests || requests.length === 0) {
        return <p className={styles.emptyState}>No requests found across the company.</p>
    }

    return (
        <div>
            <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Filter by Year</label>
                    <select
                        value={yearFilter}
                        onChange={handleYearChange}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                    >
                        <option value="all">All Time</option>
                        {availableYears.map(year => (
                            <option key={year} value={year}>{year}</option>
                        ))}
                    </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Filter by Employee</label>
                    <select
                        value={userFilter}
                        onChange={handleUserChange}
                        style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                    >
                        <option value="all">All Employees</option>
                        {allProfiles.map(p => (
                            <option key={p.id} value={p.id}>{p.name || 'Unknown'}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Leave Type</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Notes</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedRequests.length > 0 ? (
                            paginatedRequests.map(req => (
                                <tr key={req.id}>
                                    <td className={styles.empName}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{req.profiles?.name || allProfiles?.find(p => p.id === req.user_id)?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={styles.typeBadge}>{req.leave_types?.name}</span>
                                    </td>
                                    <td className={styles.dateCell}>{formatDate(req.date)}</td>
                                    <td className={styles.amountCell}>{req.amount} d</td>
                                    <td className={styles.notesCell}>{req.notes || '-'}</td>
                                    <td>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to delete this specific leave record for ' + (req.profiles?.name || 'this employee') + '?')) {
                                                    deleteLeaveRequest(req.id)
                                                }
                                            }}
                                            style={{
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '0.25rem',
                                                color: 'var(--text-muted)'
                                            }}
                                            title="Delete Leave Request"
                                        >
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="3 6 5 6 21 6"></polyline>
                                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                                <line x1="10" y1="11" x2="10" y2="17"></line>
                                                <line x1="14" y1="11" x2="14" y2="17"></line>
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className={styles.emptyState} style={{ textAlign: 'center', padding: '2rem' }}>
                                    No requests match the selected filters.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem' }}>
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                            style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1 }}
                        >
                            Previous
                        </button>
                        <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                            Page {currentPage} of {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                            style={{ padding: '0.5rem 1rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1 }}
                        >
                            Next
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}

function ProfilesTable({ profiles, requests, updateProfileQuotas, deleteProfile }) {
    return (
        <div className={styles.tableContainer}>
            <table className={styles.table}>
                <thead>
                    <tr>
                        <th>Employee Name</th>
                        <th>Role</th>
                        <th>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>Annual Quota</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '2px' }}>(Remaining / Total)</span>
                            </div>
                        </th>
                        <th>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span>Sick Quota</span>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal', marginTop: '2px' }}>(Remaining / Total)</span>
                            </div>
                        </th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {profiles.map(p => (
                        <ProfileRow key={p.id} profile={p} requests={requests} updateProfileQuotas={updateProfileQuotas} deleteProfile={deleteProfile} />
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function ProfileRow({ profile, requests, updateProfileQuotas, deleteProfile }) {
    // --- STATE VARIABLES ---
    const [isEditing, setIsEditing] = useState(false) // Toggles the row between text mode and input mode
    const [yearly, setYearly] = useState(profile.yearly_quota) // Controlled input for editing yearly quota
    const [sick, setSick] = useState(profile.sick_quota)       // Controlled input for editing sick quota

    // --- USAGE CALCULATIONS ---
    // Get all requests for just this one user
    const userRequests = requests?.filter(req => req.user_id === profile.id) || []

    const currentYear = new Date().getFullYear().toString()

    const usedYearly = userRequests
        .filter(req => req.date.substring(0, 4) === currentYear && req.leave_types?.category === 'deductible')
        .reduce((sum, req) => sum + Number(req.amount), 0)

    const usedSick = userRequests
        .filter(req => req.date.substring(0, 4) === currentYear && req.leave_types?.category === 'sick')
        .reduce((sum, req) => sum + Number(req.amount), 0)

    const remainingYearly = profile.yearly_quota - usedYearly
    const remainingSick = profile.sick_quota - usedSick

    const handleSave = () => {
        updateProfileQuotas(profile.id, Number(yearly), Number(sick))
        setIsEditing(false)
    }

    const handleDelete = () => {
        if (window.confirm(`Are you sure you want to permanently delete the profile for ${profile.name || 'this user'}?`)) {
            deleteProfile(profile.id)
        }
    }

    return (
        <tr>
            <td className={styles.empName}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{profile.name || 'No Name'}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                        {profile.email || 'No Email'}
                    </span>
                </div>
            </td>
            <td className={styles.roleCell}>{profile.role}</td>
            <td>
                {isEditing ? (
                    <input
                        className={styles.quotaInput}
                        type="number"
                        value={yearly}
                        onChange={(e) => setYearly(e.target.value)}
                    />
                ) : (
                    `${remainingYearly} / ${profile.yearly_quota}`
                )}
            </td>
            <td>
                {isEditing ? (
                    <input
                        className={styles.quotaInput}
                        type="number"
                        value={sick}
                        onChange={(e) => setSick(e.target.value)}
                    />
                ) : (
                    `${remainingSick} / ${profile.sick_quota}`
                )}
            </td>
            <td>
                {isEditing ? (
                    <div className={styles.actionBtns}>
                        <button className={styles.saveBtn} onClick={handleSave}>Save</button>
                        <button className={styles.cancelBtn} onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                ) : (
                    <div className={styles.actionBtns}>
                        <button className={styles.editBtn} onClick={() => setIsEditing(true)} title="Edit Quotas" style={{ padding: '0.4rem', display: 'flex' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button className={styles.cancelBtn} onClick={handleDelete} title="Delete" style={{ padding: '0.4rem', display: 'flex' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                        </button>
                    </div>
                )}
            </td>
        </tr>
    )
}

// A form to create a new user account directly from the admin dashboard
function AddEmployeeForm({ onEmployeeAdded }) {
    // --- STATE VARIABLES ---
    const [isExpanded, setIsExpanded] = useState(false) // Toggles the form visibility
    const [loading, setLoading] = useState(false)
    const [email, setEmail] = useState('')
    const [name, setName] = useState('')
    const [role, setRole] = useState('employee')
    const [msg, setMsg] = useState({ type: '', text: '' }) // Feedback message (error or success)

    // --- FORM SUBMISSION HANDLER ---
    const handleAddUser = async (e) => {
        e.preventDefault()
        setLoading(true)
        setMsg({ type: '', text: '' })

        try {
            // Use a secondary client so we don't accidentally sign the admin out
            const tempSupabase = createClient(supabaseUrl, supabaseAnonKey, {
                auth: { persistSession: false, autoRefreshToken: false }
            })

            // Generate a random secure password. The user will reset it via "Forgot Password"
            const randomPassword = Math.random().toString(36).slice(-10) + 'A1!'

            const { data, error } = await tempSupabase.auth.signUp({
                email,
                password: randomPassword,
            })

            if (error) throw error

            // Wait briefly to let database triggers create the profile if applicable
            await new Promise(resolve => setTimeout(resolve, 500))

            // Now update the created profile with their name, role, and email using the regular signed-in admin client
            if (data?.user?.id) {
                const { data: updatedProfile, error: updateErr } = await supabase
                    .from('profiles')
                    .update({ name: name, role: role, email: email })
                    .eq('id', data.user.id)
                    .select()
                    .single()

                if (updateErr) {
                    console.warn("Could not update profile traits:", updateErr)
                } else if (onEmployeeAdded) {
                    onEmployeeAdded(updatedProfile)
                }
            }

            setMsg({ type: 'success', text: 'Employee added successfully! They can log in via "Forgot Password".' })
            setEmail('')
            setName('')
            setRole('employee')
        } catch (err) {
            setMsg({ type: 'error', text: err.message })
        } finally {
            setLoading(false)
        }
    }

    if (!isExpanded) {
        return (
            <div style={{ marginBottom: '2rem' }}>
                <button
                    onClick={() => setIsExpanded(true)}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'transparent',
                        color: 'var(--primary)',
                        border: '2px dashed var(--border)',
                        borderRadius: 'var(--radius)',
                        cursor: 'pointer',
                        fontWeight: '600',
                        width: '100%',
                        justifyContent: 'center',
                        transition: 'all 0.2s',
                    }}
                    onMouseOver={(e) => {
                        e.currentTarget.style.borderColor = 'var(--primary)';
                        e.currentTarget.style.backgroundColor = 'rgba(79, 70, 229, 0.05)';
                    }}
                    onMouseOut={(e) => {
                        e.currentTarget.style.borderColor = 'var(--border)';
                        e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                >
                    <span style={{ fontSize: '1.25rem' }}>+</span> Add New Employee
                </button>
            </div>
        )
    }

    return (
        <div style={{ padding: '1.5rem', background: 'var(--surface)', borderRadius: 'var(--radius)', marginBottom: '2rem', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>Add New Employee</h3>
                <button
                    onClick={() => setIsExpanded(false)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.5rem', lineHeight: 1 }}
                >
                    &times;
                </button>
            </div>

            {msg.text && (
                <div style={{
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '1rem',
                    backgroundColor: msg.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: msg.type === 'error' ? 'var(--error)' : 'var(--success)',
                    border: `1px solid ${msg.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)'}`
                }}>
                    {msg.text}
                </div>
            )}

            <form onSubmit={handleAddUser} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Email Address</label>
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        style={{ padding: '0.625rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                        placeholder="employee@company.com"
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Full Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ padding: '0.625rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                        placeholder="John Doe"
                    />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Role</label>
                    <select
                        value={role}
                        onChange={e => setRole(e.target.value)}
                        style={{ padding: '0.625rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', cursor: 'pointer' }}
                    >
                        <option value="employee">Employee</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
                <button
                    type="submit"
                    disabled={loading}
                    style={{
                        padding: '0.5rem 1rem',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '6px',
                        height: '41px',
                        opacity: loading ? 0.7 : 1
                    }}>
                    {loading ? 'Adding...' : 'Add User'}
                </button>
            </form>
        </div>
    )
}

// Visualizes leave requests on a monthly calendar grid
function CalendarView({ requests, allProfiles }) {
    // --- DATE PREPARATION ---
    // Get current month and year to know what specific month to draw
    const today = new Date()
    const currentYear = today.getFullYear()
    const currentMonth = today.getMonth() // Note: match in JS is 0-indexed (0-11)
    const monthName = today.toLocaleString('default', { month: 'long' }) // e.g., "October"

    // Build array of days in the month
    // "new Date(year, month + 1, 0)" is a trick to get the LAST day of the current month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

    // Create an array mapping each number from 1 to daysInMonth, attaching extra info like if it's a weekend
    const days = Array.from({ length: daysInMonth }, (_, i) => {
        const date = new Date(currentYear, currentMonth, i + 1)
        return {
            dateNum: i + 1,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
            isWeekend: date.getDay() === 0 || date.getDay() === 6 // 0 is Sunday, 6 is Saturday
        }
    })

    // --- MAPPING LEAVE TO CALENDAR ---
    // Map leave requests to specific cells on the calendar grid.
    // Strategy: create a dictionary structure like activeLeavesMap[user_id][date_number] = "badge text/style"
    const activeLeavesMap = {}

    requests.forEach(req => {
        if (!req.date || !req.amount) return

        const [y, m, d] = req.date.split('-').map(Number)
        // Note: m is 1-indexed. Date constructor expects month 0-11
        let iterDate = new Date(y, m - 1, d)

        // define colors based on typical category (blue = annual, red = sick, purple = other)
        const category = req.leave_types?.category || 'other'
        let bgColor = 'rgba(168, 85, 247, 0.2)'
        let textColor = '#9333ea'

        if (category === 'deductible') {
            bgColor = 'rgba(59, 130, 246, 0.2)'
            textColor = '#2563eb'
        } else if (category === 'sick') {
            bgColor = 'rgba(239, 68, 68, 0.2)'
            textColor = '#dc2626'
        }

        const initial = req.leave_types?.name ? req.leave_types.name.charAt(0).toUpperCase() : 'L'

        let workingDaysToAdd = Number(req.amount)
        let loops = 0

        while (workingDaysToAdd > 0 && loops < 200) {
            loops++
            const dayOfWeek = iterDate.getDay() // 0 is Sun, 6 is Sat
            const isIterWeekend = dayOfWeek === 0 || dayOfWeek === 6

            if (!isIterWeekend) {
                // Evaluate if this specific working day lands in the currently rendered month view
                if (iterDate.getFullYear() === currentYear && iterDate.getMonth() === currentMonth) {
                    const dateNum = iterDate.getDate()
                    if (!activeLeavesMap[req.user_id]) activeLeavesMap[req.user_id] = {}

                    // Mark the cell with the visual properties
                    activeLeavesMap[req.user_id][dateNum] = { initial, bgColor, textColor }
                }
                workingDaysToAdd-- // Decrease the amount of remaining leave working days
            }

            // advance internal pointer to the next calendar day
            iterDate.setDate(iterDate.getDate() + 1)
        }
    })

    return (
        <div className={styles.tableContainer} style={{ overflowX: 'auto' }}>
            <div style={{ padding: '1rem', borderBottom: '2px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h3 style={{ margin: 0, fontSize: '1.25rem' }}>{monthName} {currentYear}</h3>
            </div>

            <table className={styles.table} style={{ whiteSpace: 'nowrap', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ position: 'sticky', left: 0, background: 'var(--surface)', zIndex: 10, width: '120px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', padding: '0.25rem 0.5rem', fontSize: '0.65rem' }}>Employee</th>
                        <th style={{ position: 'sticky', left: '120px', background: 'var(--surface)', zIndex: 10, width: '60px', padding: '0.25rem 0.5rem', fontSize: '0.65rem' }}>Role</th>
                        {days.map(d => (
                            <th
                                key={d.dateNum}
                                style={{
                                    width: '24px',
                                    minWidth: '24px',
                                    textAlign: 'center',
                                    padding: '0.25rem 0.1rem',
                                    background: d.isWeekend ? 'rgba(0,0,0,0.05)' : 'transparent',
                                    borderRight: '1px solid var(--border)'
                                }}
                            >
                                <div style={{ fontSize: '0.55rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>{d.dayName}</div>
                                <div style={{ fontSize: '0.7rem' }}>{String(d.dateNum).padStart(2, '0')}</div>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {allProfiles.map(p => (
                        <tr key={p.id}>
                            <td
                                className={styles.empName}
                                style={{
                                    position: 'sticky',
                                    left: 0,
                                    background: 'var(--surface)',
                                    zIndex: 5,
                                    borderRight: '1px solid var(--border)',
                                    width: '120px',
                                    maxWidth: '120px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.75rem' // Slightly smaller text to fit
                                }}
                                title={p.name || 'Unknown'} // Add tooltip in case name gets truncated
                            >
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <span>{p.name || 'Unknown'}</span>
                                </div>
                            </td>
                            <td
                                className={styles.roleCell}
                                style={{
                                    position: 'sticky',
                                    left: '120px',
                                    background: 'var(--surface)',
                                    zIndex: 5,
                                    borderRight: '2px solid var(--border)',
                                    width: '60px',
                                    padding: '0.25rem 0.5rem',
                                    fontSize: '0.65rem' // Slightly smaller role text to fit
                                }}
                            >
                                {p.role}
                            </td>
                            {days.map(d => (
                                <td
                                    key={d.dateNum}
                                    style={{
                                        padding: '0',
                                        height: '24px', // Reduce height
                                        width: '24px',  // Match header width
                                        minWidth: '24px',
                                        background: d.isWeekend ? 'rgba(0,0,0,0.02)' : 'transparent',
                                        borderRight: '1px solid var(--border)'
                                    }}
                                >
                                    {activeLeavesMap[p.id]?.[d.dateNum] && (
                                        <div style={{
                                            height: '100%',
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            backgroundColor: activeLeavesMap[p.id][d.dateNum].bgColor,
                                            color: activeLeavesMap[p.id][d.dateNum].textColor,
                                            fontWeight: 'bold',
                                            fontSize: '0.875rem'
                                        }}>
                                            {activeLeavesMap[p.id][d.dateNum].initial}
                                        </div>
                                    )}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

function LeaveTypesTable({ leaveTypes, addLeaveType, updateLeaveType, deleteLeaveType }) {
    const [newName, setNewName] = useState('')
    const [newCategory, setNewCategory] = useState('non-deductible')
    const [isAdding, setIsAdding] = useState(false)

    const handleAdd = async (e) => {
        e.preventDefault()
        if (!newName) return
        setIsAdding(true)
        await addLeaveType(newName, newCategory)
        setNewName('')
        setNewCategory('non-deductible')
        setIsAdding(false)
    }

    return (
        <div className={styles.tableContainer}>
            <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
                <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.25rem' }}>Manage Leave Types</h3>
                <form onSubmit={handleAdd} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Type Name</label>
                        <input
                            type="text"
                            required
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            style={{ padding: '0.625rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)' }}
                            placeholder="e.g. Bereavement, Maternity"
                        />
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', flex: 1, minWidth: '200px' }}>
                        <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>Category</label>
                        <select
                            value={newCategory}
                            onChange={e => setNewCategory(e.target.value)}
                            style={{ padding: '0.625rem 0.75rem', borderRadius: '6px', border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--text)', cursor: 'pointer' }}
                        >
                            <option value="deductible">Deductible (from Annual Quota)</option>
                            <option value="sick">Sick (from Sick Quota)</option>
                            <option value="non-deductible">Non-deductible</option>
                        </select>
                    </div>
                    <button
                        type="submit"
                        disabled={isAdding}
                        style={{
                            padding: '0.5rem 1.5rem',
                            background: 'var(--primary)',
                            color: 'white',
                            borderRadius: '6px',
                            height: '41px',
                            opacity: isAdding ? 0.7 : 1,
                            whiteSpace: 'nowrap'
                        }}>
                        {isAdding ? 'Adding...' : 'Add Leave Type'}
                    </button>
                </form>
            </div>

            <table className={styles.table}>
                <thead>
                    <tr>
                        <th style={{ width: '40%' }}>Type Name</th>
                        <th style={{ width: '40%' }}>Category</th>
                        <th style={{ width: '20%' }}>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {leaveTypes.map(type => (
                        <LeaveTypeRow
                            key={type.id}
                            type={type}
                            updateLeaveType={updateLeaveType}
                            deleteLeaveType={deleteLeaveType}
                        />
                    ))}
                    {leaveTypes.length === 0 && (
                        <tr>
                            <td colSpan="3" style={{ textAlign: 'center', padding: '1.5rem', color: 'var(--text-muted)' }}>
                                No leave types configured.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    )
}

function LeaveTypeRow({ type, updateLeaveType, deleteLeaveType }) {
    const [isEditing, setIsEditing] = useState(false)
    const [name, setName] = useState(type.name)
    const [category, setCategory] = useState(type.category)
    const [isSaving, setIsSaving] = useState(false)

    const handleSave = async () => {
        setIsSaving(true)
        await updateLeaveType(type.id, name, category)
        setIsSaving(false)
        setIsEditing(false)
    }

    const handleDelete = async () => {
        if (window.confirm(`Are you sure you want to delete the leave type "${type.name}"?`)) {
            await deleteLeaveType(type.id)
        }
    }

    if (isEditing) {
        return (
            <tr>
                <td>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid var(--primary)', background: 'var(--background)', color: 'var(--text)' }}
                    />
                </td>
                <td>
                    <select
                        value={category}
                        onChange={e => setCategory(e.target.value)}
                        style={{ width: '100%', padding: '0.4rem 0.75rem', borderRadius: '4px', border: '1px solid var(--primary)', background: 'var(--background)', color: 'var(--text)' }}
                    >
                        <option value="deductible">deductible</option>
                        <option value="sick">sick</option>
                        <option value="non-deductible">non-deductible</option>
                    </select>
                </td>
                <td>
                    <div className={styles.actionBtns}>
                        <button className={styles.saveBtn} onClick={handleSave} disabled={isSaving || !name.trim()} title="Save" style={{ padding: '0.4rem', display: 'flex' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button className={styles.cancelBtn} onClick={() => { setIsEditing(false); setName(type.name); setCategory(type.category); }} disabled={isSaving} title="Cancel" style={{ padding: '0.4rem', display: 'flex' }}>
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                    </div>
                </td>
            </tr>
        )
    }

    return (
        <tr>
            <td style={{ fontWeight: '500' }}>{type.name}</td>
            <td>
                <span style={{
                    padding: '0.2rem 0.6rem',
                    borderRadius: '12px',
                    fontSize: '0.75rem',
                    backgroundColor: type.category === 'sick' ? 'rgba(239, 68, 68, 0.1)' :
                        type.category === 'deductible' ? 'rgba(59, 130, 246, 0.1)' :
                            'rgba(168, 85, 247, 0.1)',
                    color: type.category === 'sick' ? '#dc2626' :
                        type.category === 'deductible' ? '#2563eb' :
                            '#9333ea',
                    fontWeight: '500'
                }}>
                    {type.category}
                </span>
            </td>
            <td>
                <div className={styles.actionBtns}>
                    <button className={styles.editBtn} onClick={() => setIsEditing(true)} title="Edit Leave Type" style={{ padding: '0.4rem', display: 'flex' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button className={styles.cancelBtn} onClick={handleDelete} title="Delete Leave Type" style={{ padding: '0.4rem', display: 'flex' }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </td>
        </tr>
    )
}
