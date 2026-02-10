/**
 * Finance Officer Dashboard
 * Manages transactions, payouts, and financial reports
 */

import React, { useState, useEffect } from 'react';
import { adminAPI, technicianAPI } from '../../services/api';

const FinanceOfficerDashboard = () => {
    const [transactions, setTransactions] = useState([]);
    const [technicians, setTechnicians] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [payoutAmount, setPayoutAmount] = useState({});
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [transRes, usersRes, jobsRes] = await Promise.all([
                adminAPI.getTransactions(),
                adminAPI.getUsers(),
                adminAPI.getJobs()
            ]);
            setTransactions(transRes.data.transactions || []);
            setTechnicians((usersRes.data.users || []).filter(u => u.role === 'technician'));
            setJobs(jobsRes.data.jobs || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePayout = async (technicianId) => {
        const amount = payoutAmount[technicianId];
        if (!amount || amount <= 0) {
            alert('Enter valid amount');
            return;
        }
        try {
            await technicianAPI.withdraw(amount);
            alert('Payout processed!');
            setPayoutAmount({ ...payoutAmount, [technicianId]: '' });
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Payout failed');
        }
    };

    // Financial calculations
    const totalRevenue = transactions.filter(t => t.type === 'payment').reduce((sum, t) => sum + (t.amount || 0), 0);
    const totalPayouts = transactions.filter(t => t.type === 'payout').reduce((sum, t) => sum + (t.amount || 0), 0);
    const pendingPayouts = technicians.reduce((sum, t) => sum + (t.balance || 0), 0);
    const paidJobs = jobs.filter(j => j.status === 'Paid' || j.status === 'Completed');
    const totalCommission = paidJobs.reduce((sum, j) => sum + (j.payment?.appCommission || 0), 0);

    const getTypeBadge = (type) => {
        const colors = { 'payment': 'success', 'payout': 'info', 'refund': 'warning', 'commission': 'primary' };
        return `badge badge-${colors[type] || 'secondary'}`;
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="finance-dashboard">
            <h2>Finance Officer Dashboard</h2>

            <div className="tab-nav">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`} onClick={() => setActiveTab('transactions')}>Transactions ({transactions.length})</button>
                <button className={`tab-btn ${activeTab === 'payouts' ? 'active' : ''}`} onClick={() => setActiveTab('payouts')}>Technician Payouts</button>
                <button className={`tab-btn ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>Reports</button>
            </div>

            {activeTab === 'overview' && (
                <div className="dashboard-overview">
                    <div className="stats-grid">
                        <div className="stat-card highlight"><h3>₹{totalRevenue.toFixed(2)}</h3><p>Total Revenue</p></div>
                        <div className="stat-card"><h3>₹{totalCommission.toFixed(2)}</h3><p>Commission Earned</p></div>
                        <div className="stat-card"><h3>₹{totalPayouts.toFixed(2)}</h3><p>Total Payouts</p></div>
                        <div className="stat-card warning"><h3>₹{pendingPayouts.toFixed(2)}</h3><p>Pending Payouts</p></div>
                    </div>

                    <div className="recent-section">
                        <h3>Recent Transactions</h3>
                        <div className="table-responsive">
                            <table className="table">
                                <thead><tr><th>ID</th><th>Type</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                                <tbody>
                                    {transactions.slice(0, 10).map(trans => (
                                        <tr key={trans._id}>
                                            <td>{trans.transactionId}</td>
                                            <td><span className={getTypeBadge(trans.type)}>{trans.type}</span></td>
                                            <td>₹{trans.amount?.toFixed(2)}</td>
                                            <td>{new Date(trans.createdAt).toLocaleDateString()}</td>
                                            <td><span className={`badge badge-${trans.status === 'completed' ? 'success' : 'warning'}`}>{trans.status}</span></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'transactions' && (
                <div className="transactions-section">
                    <h3>All Transactions</h3>
                    <div className="filters">
                        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="form-control" />
                        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="form-control" />
                    </div>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>ID</th><th>Type</th><th>Job ID</th><th>Amount</th><th>Date</th><th>Status</th></tr></thead>
                            <tbody>
                                {transactions.map(trans => (
                                    <tr key={trans._id}>
                                        <td>{trans.transactionId}</td>
                                        <td><span className={getTypeBadge(trans.type)}>{trans.type}</span></td>
                                        <td>{trans.jobId || '-'}</td>
                                        <td>₹{trans.amount?.toFixed(2)}</td>
                                        <td>{new Date(trans.createdAt).toLocaleString()}</td>
                                        <td><span className={`badge badge-${trans.status === 'completed' ? 'success' : 'warning'}`}>{trans.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'payouts' && (
                <div className="payouts-section">
                    <h3>Technician Balances & Payouts</h3>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>Technician</th><th>Email</th><th>Balance</th><th>Bank Details</th><th>Action</th></tr></thead>
                            <tbody>
                                {technicians.filter(t => t.balance > 0).map(tech => (
                                    <tr key={tech._id}>
                                        <td>{tech.fullName}</td>
                                        <td>{tech.email}</td>
                                        <td><strong>₹{tech.balance?.toFixed(2)}</strong></td>
                                        <td>
                                            {tech.bankDetails?.bankName ? (
                                                <small>{tech.bankDetails.bankName} - {tech.bankDetails.accountNumber?.slice(-4)}</small>
                                            ) : (
                                                <span className="text-muted">Not provided</span>
                                            )}
                                        </td>
                                        <td>
                                            <div className="payout-input">
                                                <input 
                                                    type="number" 
                                                    placeholder="Amount"
                                                    value={payoutAmount[tech._id] || ''}
                                                    onChange={(e) => setPayoutAmount({...payoutAmount, [tech._id]: e.target.value})}
                                                    className="form-control form-control-sm"
                                                    max={tech.balance}
                                                />
                                                <button className="btn btn-sm btn-success" onClick={() => handlePayout(tech._id)}>Pay</button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'reports' && (
                <div className="reports-section">
                    <h3>Financial Reports</h3>
                    <div className="cards-grid">
                        <div className="card">
                            <h4>Revenue Report</h4>
                            <p>Total Paid Jobs: {paidJobs.length}</p>
                            <p>Total Revenue: ₹{totalRevenue.toFixed(2)}</p>
                            <p>App Commission: ₹{totalCommission.toFixed(2)}</p>
                            <button className="btn btn-primary btn-sm">Export CSV</button>
                        </div>
                        <div className="card">
                            <h4>Payout Report</h4>
                            <p>Total Payouts: ₹{totalPayouts.toFixed(2)}</p>
                            <p>Pending: ₹{pendingPayouts.toFixed(2)}</p>
                            <p>Technicians with Balance: {technicians.filter(t => t.balance > 0).length}</p>
                            <button className="btn btn-primary btn-sm">Export CSV</button>
                        </div>
                        <div className="card">
                            <h4>Tax Report</h4>
                            <p>Total GST Collected: ₹{paidJobs.reduce((sum, j) => sum + (j.payment?.taxAmount || 0), 0).toFixed(2)}</p>
                            <p>Tax Rate: 18%</p>
                            <button className="btn btn-primary btn-sm">Export CSV</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FinanceOfficerDashboard;
