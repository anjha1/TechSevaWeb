/**
 * City Manager Dashboard
 * Manages users, technicians and jobs within assigned cities
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';

const CityManagerDashboard = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, jobsRes] = await Promise.all([
                adminAPI.getUsers(),
                adminAPI.getJobs()
            ]);
            setUsers(usersRes.data.users || []);
            setJobs(jobsRes.data.jobs || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveKYC = async (userId) => {
        try {
            await adminAPI.approveKYC(userId);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to approve KYC');
        }
    };

    const technicians = users.filter(u => u.role === 'technician');
    const customers = users.filter(u => u.role === 'user');
    const pendingKYC = technicians.filter(t => t.kycStatus === 'pending');
    const activeJobs = jobs.filter(j => !['Completed', 'Cancelled'].includes(j.status));

    const getStatusBadge = (status) => {
        const colors = {
            'Pending': 'warning', 'Accepted': 'info', 'In Progress': 'primary',
            'Diagnosed': 'secondary', 'Paid': 'success', 'Completed': 'success', 'Cancelled': 'danger'
        };
        return `badge badge-${colors[status] || 'default'}`;
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="citymanager-dashboard">
            <div className="dashboard-header-info">
                <h2>City Manager Dashboard</h2>
                <p>Managing: <strong>{user?.assignedCities?.join(', ') || 'All Cities'}</strong></p>
            </div>

            <div className="tab-nav">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-btn ${activeTab === 'technicians' ? 'active' : ''}`} onClick={() => setActiveTab('technicians')}>Technicians ({technicians.length})</button>
                <button className={`tab-btn ${activeTab === 'customers' ? 'active' : ''}`} onClick={() => setActiveTab('customers')}>Customers ({customers.length})</button>
                <button className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Jobs ({jobs.length})</button>
                <button className={`tab-btn ${activeTab === 'kyc' ? 'active' : ''}`} onClick={() => setActiveTab('kyc')}>KYC ({pendingKYC.length})</button>
            </div>

            {activeTab === 'overview' && (
                <div className="dashboard-overview">
                    <div className="stats-grid">
                        <div className="stat-card"><h3>{technicians.length}</h3><p>Technicians</p></div>
                        <div className="stat-card"><h3>{customers.length}</h3><p>Customers</p></div>
                        <div className="stat-card"><h3>{activeJobs.length}</h3><p>Active Jobs</p></div>
                        <div className="stat-card warning"><h3>{pendingKYC.length}</h3><p>Pending KYC</p></div>
                    </div>

                    <div className="recent-section">
                        <h3>Recent Jobs in Your Cities</h3>
                        {jobs.slice(0, 5).map(job => (
                            <div key={job._id} className="job-item">
                                <div className="job-info">
                                    <h4>{job.applianceType} - {job.customerName}</h4>
                                    <p>{job.location?.city}, {job.location?.pincode}</p>
                                </div>
                                <span className={getStatusBadge(job.status)}>{job.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'technicians' && (
                <div className="table-section">
                    <h3>Technicians</h3>
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr><th>Name</th><th>Email</th><th>Phone</th><th>Skills</th><th>KYC</th><th>Rating</th></tr>
                            </thead>
                            <tbody>
                                {technicians.map(tech => (
                                    <tr key={tech._id}>
                                        <td>{tech.fullName}</td>
                                        <td>{tech.email}</td>
                                        <td>{tech.phoneNumber}</td>
                                        <td>{tech.skills?.join(', ')}</td>
                                        <td><span className={`badge badge-${tech.kycStatus === 'approved' ? 'success' : tech.kycStatus === 'pending' ? 'warning' : 'danger'}`}>{tech.kycStatus}</span></td>
                                        <td>{tech.averageRating?.toFixed(1) || '-'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'customers' && (
                <div className="table-section">
                    <h3>Customers</h3>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>City</th><th>Joined</th></tr></thead>
                            <tbody>
                                {customers.map(cust => (
                                    <tr key={cust._id}>
                                        <td>{cust.fullName}</td>
                                        <td>{cust.email}</td>
                                        <td>{cust.phoneNumber}</td>
                                        <td>{cust.city || '-'}</td>
                                        <td>{new Date(cust.createdAt).toLocaleDateString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'jobs' && (
                <div className="table-section">
                    <h3>All Jobs</h3>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>ID</th><th>Customer</th><th>Appliance</th><th>City</th><th>Technician</th><th>Status</th></tr></thead>
                            <tbody>
                                {jobs.map(job => (
                                    <tr key={job._id}>
                                        <td>{job.jobId}</td>
                                        <td>{job.customerName}</td>
                                        <td>{job.applianceType}</td>
                                        <td>{job.location?.city}</td>
                                        <td>{job.technicianName || 'Unassigned'}</td>
                                        <td><span className={getStatusBadge(job.status)}>{job.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'kyc' && (
                <div className="kyc-section">
                    <h3>Pending KYC Approvals</h3>
                    {pendingKYC.length === 0 ? <p className="no-data">No pending KYC</p> : (
                        pendingKYC.map(tech => (
                            <div key={tech._id} className="kyc-card">
                                <div className="kyc-header"><h4>{tech.fullName}</h4><span className="badge badge-warning">Pending</span></div>
                                <div className="kyc-details">
                                    <p><strong>Email:</strong> {tech.email}</p>
                                    <p><strong>Aadhaar:</strong> {tech.aadhaar}</p>
                                    <p><strong>PAN:</strong> {tech.pan}</p>
                                    <p><strong>Skills:</strong> {tech.skills?.join(', ')}</p>
                                </div>
                                <div className="kyc-actions">
                                    <button className="btn btn-success" onClick={() => handleApproveKYC(tech._id)}>Approve</button>
                                    <button className="btn btn-danger" onClick={() => adminAPI.rejectKYC(tech._id).then(fetchData)}>Reject</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default CityManagerDashboard;
