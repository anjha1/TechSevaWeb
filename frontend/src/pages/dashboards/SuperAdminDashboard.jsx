/**
 * SuperAdmin Dashboard
 * Complete admin control panel
 */

import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';

const SuperAdminDashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [dashboard, usersRes, jobsRes] = await Promise.all([
                adminAPI.getDashboard(),
                adminAPI.getUsers(),
                adminAPI.getJobs()
            ]);
            setDashboardData(dashboard.data.data);
            setUsers(usersRes.data.users || []);
            setJobs(jobsRes.data.jobs || []);
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveKYC = async (userId) => {
        try {
            await adminAPI.approveKYC(userId);
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to approve');
        }
    };

    const handleRejectKYC = async (userId) => {
        if (window.confirm('Reject this technician\'s KYC?')) {
            try {
                await adminAPI.rejectKYC(userId);
                fetchDashboardData();
            } catch (error) {
                alert(error.response?.data?.message || 'Failed to reject');
            }
        }
    };

    const handleUpdateStatus = async (userId, status) => {
        try {
            await adminAPI.updateUserStatus(userId, status);
            fetchDashboardData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };

    const technicians = users.filter(u => u.role === 'technician');
    const customers = users.filter(u => u.role === 'user');
    const pendingKYC = technicians.filter(t => t.kycStatus === 'pending');

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="admin-dashboard">
            {/* Tab Navigation */}
            <div className="tab-nav">
                <button 
                    className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                    onClick={() => setActiveTab('overview')}
                >
                    Overview
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'kyc' ? 'active' : ''}`}
                    onClick={() => setActiveTab('kyc')}
                >
                    KYC Approvals ({pendingKYC.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Users ({users.length})
                </button>
                <button 
                    className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`}
                    onClick={() => setActiveTab('jobs')}
                >
                    Jobs ({jobs.length})
                </button>
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && dashboardData && (
                <div className="dashboard-overview">
                    <h2>Dashboard Overview</h2>
                    <div className="stats-grid">
                        <div className="stat-card">
                            <h3>{dashboardData.totalJobs}</h3>
                            <p>Total Jobs</p>
                        </div>
                        <div className="stat-card">
                            <h3>{dashboardData.activeTechnicians}</h3>
                            <p>Active Technicians</p>
                        </div>
                        <div className="stat-card">
                            <h3>{dashboardData.totalCustomers}</h3>
                            <p>Customers</p>
                        </div>
                        <div className="stat-card highlight">
                            <h3>₹{dashboardData.revenueThisMonth?.toFixed(2)}</h3>
                            <p>Revenue (This Month)</p>
                        </div>
                        <div className="stat-card warning">
                            <h3>{dashboardData.pendingApprovals}</h3>
                            <p>Pending KYC</p>
                        </div>
                        <div className="stat-card">
                            <h3>{dashboardData.openTickets}</h3>
                            <p>Open Tickets</p>
                        </div>
                    </div>
                </div>
            )}

            {/* KYC Approvals Tab */}
            {activeTab === 'kyc' && (
                <div className="kyc-section">
                    <h2>Pending KYC Approvals</h2>
                    {pendingKYC.length === 0 ? (
                        <p className="no-data">No pending KYC requests</p>
                    ) : (
                        <div className="kyc-list">
                            {pendingKYC.map(tech => (
                                <div key={tech._id} className="kyc-card">
                                    <div className="kyc-header">
                                        <h4>{tech.fullName}</h4>
                                        <span className="badge badge-warning">Pending</span>
                                    </div>
                                    <div className="kyc-details">
                                        <p><strong>Email:</strong> {tech.email}</p>
                                        <p><strong>Phone:</strong> {tech.phoneNumber}</p>
                                        <p><strong>Aadhaar:</strong> {tech.aadhaar}</p>
                                        <p><strong>PAN:</strong> {tech.pan}</p>
                                        <p><strong>Skills:</strong> {tech.skills?.join(', ')}</p>
                                    </div>
                                    <div className="kyc-actions">
                                        <button 
                                            className="btn btn-success"
                                            onClick={() => handleApproveKYC(tech._id)}
                                        >
                                            Approve
                                        </button>
                                        <button 
                                            className="btn btn-danger"
                                            onClick={() => handleRejectKYC(tech._id)}
                                        >
                                            Reject
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Users Tab */}
            {activeTab === 'users' && (
                <div className="users-section">
                    <h2>All Users</h2>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Status</th>
                                    <th>Joined</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map(user => (
                                    <tr key={user._id}>
                                        <td>{user.fullName}</td>
                                        <td>{user.email}</td>
                                        <td>
                                            <span className={`badge badge-${user.role === 'technician' ? 'info' : 'secondary'}`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`badge badge-${user.status === 'active' ? 'success' : 'danger'}`}>
                                                {user.status}
                                            </span>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            {user.status === 'active' ? (
                                                <button 
                                                    className="btn btn-sm btn-warning"
                                                    onClick={() => handleUpdateStatus(user._id, 'suspended')}
                                                >
                                                    Suspend
                                                </button>
                                            ) : (
                                                <button 
                                                    className="btn btn-sm btn-success"
                                                    onClick={() => handleUpdateStatus(user._id, 'active')}
                                                >
                                                    Activate
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Jobs Tab */}
            {activeTab === 'jobs' && (
                <div className="jobs-section">
                    <h2>All Jobs</h2>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Job ID</th>
                                    <th>Customer</th>
                                    <th>Appliance</th>
                                    <th>Location</th>
                                    <th>Technician</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                {jobs.map(job => (
                                    <tr key={job._id}>
                                        <td>{job.jobId}</td>
                                        <td>{job.customerName}</td>
                                        <td>{job.applianceType}</td>
                                        <td>{job.location?.city}</td>
                                        <td>{job.technicianName || 'Unassigned'}</td>
                                        <td>
                                            <span className={`badge badge-${
                                                job.status === 'Completed' ? 'success' :
                                                job.status === 'Cancelled' ? 'danger' :
                                                job.status === 'Pending' ? 'warning' : 'info'
                                            }`}>
                                                {job.status}
                                            </span>
                                        </td>
                                        <td>{new Date(job.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SuperAdminDashboard;
