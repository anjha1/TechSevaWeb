/**
 * Service Admin Dashboard
 * Manages technicians and jobs for specific appliance categories
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';

const ServiceAdminDashboard = () => {
    const { user } = useAuth();
    const [technicians, setTechnicians] = useState([]);
    const [jobs, setJobs] = useState([]);
    const [applianceTypes, setApplianceTypes] = useState([]);
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [usersRes, jobsRes, appliancesRes] = await Promise.all([
                adminAPI.getUsers(),
                adminAPI.getJobs(),
                adminAPI.getApplianceTypes()
            ]);
            const techs = (usersRes.data.users || []).filter(u => u.role === 'technician');
            setTechnicians(techs);
            setJobs(jobsRes.data.jobs || []);
            setApplianceTypes(appliancesRes.data.applianceTypes || []);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAssignTechnician = async (jobId, technicianId) => {
        try {
            await adminAPI.assignTechnician(jobId, technicianId);
            alert('Technician assigned!');
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to assign');
        }
    };

    const handleUpdateAppliance = async (id, data) => {
        try {
            await adminAPI.updateApplianceType(id, data);
            fetchData();
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to update');
        }
    };

    const myServices = user?.skills || [];
    const myJobs = jobs.filter(j => myServices.includes(j.applianceType));
    const pendingJobs = myJobs.filter(j => j.status === 'Pending');
    const myAppliances = applianceTypes.filter(a => myServices.includes(a.name));

    const getStatusBadge = (status) => {
        const colors = { 'Pending': 'warning', 'Accepted': 'info', 'In Progress': 'primary', 'Completed': 'success', 'Cancelled': 'danger' };
        return `badge badge-${colors[status] || 'secondary'}`;
    };

    if (loading) return <div className="loading">Loading...</div>;

    return (
        <div className="serviceadmin-dashboard">
            <div className="dashboard-header-info">
                <h2>Service Admin Dashboard</h2>
                <p>Managing Services: <strong>{myServices.join(', ') || 'All Services'}</strong></p>
            </div>

            <div className="tab-nav">
                <button className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>Overview</button>
                <button className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} onClick={() => setActiveTab('jobs')}>Jobs ({myJobs.length})</button>
                <button className={`tab-btn ${activeTab === 'technicians' ? 'active' : ''}`} onClick={() => setActiveTab('technicians')}>Technicians ({technicians.length})</button>
                <button className={`tab-btn ${activeTab === 'appliances' ? 'active' : ''}`} onClick={() => setActiveTab('appliances')}>Appliance Types</button>
            </div>

            {activeTab === 'overview' && (
                <div className="dashboard-overview">
                    <div className="stats-grid">
                        <div className="stat-card"><h3>{myJobs.length}</h3><p>Total Jobs</p></div>
                        <div className="stat-card warning"><h3>{pendingJobs.length}</h3><p>Pending Assignment</p></div>
                        <div className="stat-card"><h3>{technicians.length}</h3><p>Technicians</p></div>
                        <div className="stat-card"><h3>{myAppliances.length}</h3><p>Service Categories</p></div>
                    </div>

                    <div className="recent-section">
                        <h3>Jobs Needing Assignment</h3>
                        {pendingJobs.slice(0, 5).map(job => (
                            <div key={job._id} className="job-card">
                                <div className="job-header">
                                    <h4>{job.applianceType}</h4>
                                    <span className={getStatusBadge(job.status)}>{job.status}</span>
                                </div>
                                <p><strong>Customer:</strong> {job.customerName}</p>
                                <p><strong>Location:</strong> {job.location?.city}</p>
                                <div className="job-actions">
                                    <select onChange={(e) => e.target.value && handleAssignTechnician(job.jobId, e.target.value)} className="form-control">
                                        <option value="">Assign Technician</option>
                                        {technicians.filter(t => t.kycStatus === 'approved').map(t => (
                                            <option key={t._id} value={t._id}>{t.fullName}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'jobs' && (
                <div className="table-section">
                    <h3>All Jobs ({myJobs.length})</h3>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>ID</th><th>Appliance</th><th>Customer</th><th>Technician</th><th>Status</th><th>Action</th></tr></thead>
                            <tbody>
                                {myJobs.map(job => (
                                    <tr key={job._id}>
                                        <td>{job.jobId}</td>
                                        <td>{job.applianceType}</td>
                                        <td>{job.customerName}</td>
                                        <td>{job.technicianName || 'Unassigned'}</td>
                                        <td><span className={getStatusBadge(job.status)}>{job.status}</span></td>
                                        <td>
                                            {job.status === 'Pending' && (
                                                <select onChange={(e) => e.target.value && handleAssignTechnician(job.jobId, e.target.value)} className="form-control form-control-sm">
                                                    <option value="">Assign</option>
                                                    {technicians.filter(t => t.kycStatus === 'approved').map(t => (
                                                        <option key={t._id} value={t._id}>{t.fullName}</option>
                                                    ))}
                                                </select>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'technicians' && (
                <div className="table-section">
                    <h3>Technicians in Your Services</h3>
                    <div className="table-responsive">
                        <table className="table">
                            <thead><tr><th>Name</th><th>Email</th><th>Skills</th><th>Status</th><th>Rating</th><th>Jobs Done</th></tr></thead>
                            <tbody>
                                {technicians.map(tech => (
                                    <tr key={tech._id}>
                                        <td>{tech.fullName}</td>
                                        <td>{tech.email}</td>
                                        <td>{tech.skills?.join(', ')}</td>
                                        <td><span className={`badge badge-${tech.status === 'active' ? 'success' : 'danger'}`}>{tech.status}</span></td>
                                        <td>{tech.averageRating?.toFixed(1) || '-'}</td>
                                        <td>{tech.ratingCount || 0}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'appliances' && (
                <div className="appliances-section">
                    <h3>Appliance Types</h3>
                    <div className="cards-grid">
                        {myAppliances.map(appliance => (
                            <div key={appliance._id} className="card">
                                <h4>{appliance.name}</h4>
                                <p>{appliance.description || 'No description'}</p>
                                <p><strong>Base Price:</strong> ₹{appliance.basePrice || 0}</p>
                                <p><strong>Commission:</strong> {(appliance.commissionRate || 0) * 100}%</p>
                                <div className="card-actions">
                                    <button 
                                        className={`btn btn-sm ${appliance.isActive ? 'btn-warning' : 'btn-success'}`}
                                        onClick={() => handleUpdateAppliance(appliance._id, { isActive: !appliance.isActive })}
                                    >
                                        {appliance.isActive ? 'Deactivate' : 'Activate'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ServiceAdminDashboard;
