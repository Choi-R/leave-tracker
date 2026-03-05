import { useState } from 'react'
import styles from './BasicView.module.css'

export default function BasicView({ profile, requests, leaveTypes, submitLeaveRequest, deleteLeaveRequest }) {
    const [typeId, setTypeId] = useState(leaveTypes.length > 0 ? leaveTypes[0].id : '')
    const [date, setDate] = useState('')
    const [amount, setAmount] = useState('1')
    const [notes, setNotes] = useState('')
    const [submitting, setSubmitting] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 4

    const currentYear = new Date().getFullYear().toString()

    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    }

    // Calculate used quotas strictly for the current year
    const usedYearly = requests
        .filter(req => req.date.substring(0, 4) === currentYear && req.leave_types?.category === 'deductible')
        .reduce((sum, req) => sum + Number(req.amount), 0)

    const usedSick = requests
        .filter(req => req.date.substring(0, 4) === currentYear && req.leave_types?.category === 'sick')
        .reduce((sum, req) => sum + Number(req.amount), 0)

    const remainingYearly = profile.yearly_quota - usedYearly
    const remainingSick = profile.sick_quota - usedSick

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!typeId || !date || !amount) return

        setSubmitting(true)
        await submitLeaveRequest(typeId, date, Number(amount), notes)
        setSubmitting(false)

        setDate('')
        setAmount('1')
        setNotes('')
        setCurrentPage(1) // Snap back to page 1 on new submission
    }

    // Pagination logic
    const totalPages = Math.ceil(requests.length / itemsPerPage)
    const startIndex = (currentPage - 1) * itemsPerPage
    const paginatedRequests = requests.slice(startIndex, startIndex + itemsPerPage)

    return (
        <div className={styles.container}>
            {/* Quotas Dashboard */}
            <section className={styles.quotasSection}>
                <div className={styles.quotaCard}>
                    <div className={styles.quotaIcon} style={{ background: 'rgba(0, 92, 245, 0.1)', color: 'var(--primary)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className={styles.quotaTitle}>Annual Leave</h3>
                        <div className={styles.quotaNumbers}>
                            <span className={styles.quotaRemaining}>{remainingYearly}</span>
                            <span className={styles.quotaTotal}>/ {profile.yearly_quota} days</span>
                        </div>
                    </div>
                </div>

                <div className={styles.quotaCard}>
                    <div className={styles.quotaIcon} style={{ background: 'rgba(16, 185, 129, 0.1)', color: 'var(--success)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 12h-4l-3 9L9 3l-3 9H2"></path>
                        </svg>
                    </div>
                    <div>
                        <h3 className={styles.quotaTitle}>Sick Leave</h3>
                        <div className={styles.quotaNumbers}>
                            <span className={styles.quotaRemaining}>{remainingSick}</span>
                            <span className={styles.quotaTotal}>/ {profile.sick_quota} days</span>
                        </div>
                    </div>
                </div>
            </section>

            <div className={styles.mainGrid}>
                {/* Submit Form */}
                <section className={styles.formSection}>
                    <h2 className={styles.sectionTitle}>Request Leave</h2>
                    <form className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.inputGroup}>
                            <label>Leave Type</label>
                            <select
                                value={typeId}
                                onChange={e => setTypeId(e.target.value)}
                                required
                            >
                                {leaveTypes.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className={styles.formRow}>
                            <div className={styles.inputGroup}>
                                <label>Date</label>
                                <input
                                    type="date"
                                    value={date}
                                    onChange={e => setDate(e.target.value)}
                                    required
                                    style={{ width: '100%' }}
                                />
                            </div>
                            <div className={styles.inputGroup}>
                                <label>Days Amount</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    min="0.5"
                                    value={amount}
                                    onChange={e => setAmount(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className={styles.inputGroup}>
                            <label>Notes (Optional)</label>
                            <textarea
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows="3"
                                placeholder="Reason for leave..."
                            />
                        </div>

                        <button type="submit" className={styles.submitBtn} disabled={submitting}>
                            {submitting ? 'Submitting...' : 'Submit Request'}
                        </button>
                    </form>
                </section>

                {/* History Table */}
                <section className={styles.historySection}>
                    <h2 className={styles.sectionTitle}>My Requests</h2>
                    <div className={styles.tableContainer}>
                        {requests.length === 0 ? (
                            <p className={styles.emptyState}>No leave requests found.</p>
                        ) : (
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Date</th>
                                        <th>Type</th>
                                        <th>Amount</th>
                                        <th>Notes</th>
                                        <th>Action</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {paginatedRequests.map(req => (
                                        <tr key={req.id}>
                                            <td className={styles.dateCell}>{formatDate(req.date)}</td>
                                            <td>
                                                <span className={styles.typeBadge}>
                                                    {req.leave_types?.name}
                                                </span>
                                            </td>
                                            <td className={styles.amountCell}>{req.amount} d</td>
                                            <td className={styles.notesCell}>{req.notes || '-'}</td>
                                            <td>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('Are you sure you want to delete this leave request? Your quota will be restored.')) {
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
                                                    title="Delete My Request"
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
                                    ))}
                                </tbody>
                            </table>
                        )}

                        {totalPages > 1 && (
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', borderTop: '1px solid var(--border)' }}>
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', opacity: currentPage === 1 ? 0.5 : 1, fontSize: '0.875rem' }}
                                >
                                    Previous
                                </button>
                                <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    Page {currentPage} of {totalPages}
                                </span>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    style={{ padding: '0.4rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border)', background: 'transparent', color: 'var(--text)', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', opacity: currentPage === totalPages ? 0.5 : 1, fontSize: '0.875rem' }}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    )
}
