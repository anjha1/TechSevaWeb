import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../components/MessageBox';
import { ButtonLoader } from '../../components/LoadingSpinner';
import api from '../../services/api';
import '../../styles/AdminLogin.css';

const adminRoles = [
    { id: 'superadmin', label: 'Super Admin', icon: 'fas fa-user-shield' },
    { id: 'citymanager', label: 'City Manager', icon: 'fas fa-city' },
    { id: 'serviceadmin', label: 'Service Admin', icon: 'fas fa-tools' },
    { id: 'financeofficer', label: 'Finance Officer', icon: 'fas fa-calculator' },
    { id: 'supportagent', label: 'Support Agent', icon: 'fas fa-headset' }
];

const AdminLoginPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const { showMessage } = useMessage();
    
    const [selectedRole, setSelectedRole] = useState('');
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!selectedRole) {
            showMessage('Please select your admin role.', 'error');
            return;
        }

        if (!formData.email || !formData.password) {
            showMessage('Please fill all fields.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/auth/admin-login', {
                ...formData,
                role: selectedRole
            });

            if (response.data.success) {
                login(response.data.user, response.data.token);
                showMessage('Login successful!', 'success');
                
                // Navigate to appropriate dashboard
                const dashboardRoutes = {
                    superadmin: '/superadmin-dashboard',
                    citymanager: '/citymanager-dashboard',
                    serviceadmin: '/serviceadmin-dashboard',
                    financeofficer: '/financeofficer-dashboard',
                    supportagent: '/supportagent-dashboard'
                };
                
                navigate(dashboardRoutes[selectedRole] || '/admin-dashboard');
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="admin-login-page">
            <div className="admin-login-container">
                <div className="admin-login-card">
                    <div className="admin-login-header">
                        <div className="logo">
                            <span className="logo-icon">🔧</span>
                            <span className="logo-text">TechSeva</span>
                        </div>
                        <h1>Admin Portal</h1>
                        <p>Access the admin dashboard</p>
                    </div>

                    {/* Role Selection */}
                    {!selectedRole ? (
                        <div className="role-selection">
                            <h2>Select Your Role</h2>
                            <div className="roles-grid">
                                {adminRoles.map(role => (
                                    <button
                                        key={role.id}
                                        className="role-btn"
                                        onClick={() => setSelectedRole(role.id)}
                                    >
                                        <i className={role.icon}></i>
                                        <span>{role.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <form className="admin-login-form" onSubmit={handleSubmit}>
                            {/* Selected Role Display */}
                            <div className="selected-role">
                                <i className={adminRoles.find(r => r.id === selectedRole)?.icon}></i>
                                <span>{adminRoles.find(r => r.id === selectedRole)?.label}</span>
                                <button 
                                    type="button" 
                                    className="change-role-btn"
                                    onClick={() => setSelectedRole('')}
                                >
                                    Change
                                </button>
                            </div>

                            <div className="form-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-envelope"></i>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="Enter your email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-wrapper">
                                    <i className="fas fa-lock"></i>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        placeholder="Enter your password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="login-btn" disabled={loading}>
                                {loading ? <ButtonLoader /> : (
                                    <>
                                        <i className="fas fa-sign-in-alt"></i>
                                        Sign In
                                    </>
                                )}
                            </button>
                        </form>
                    )}

                    <div className="admin-login-footer">
                        <a href="/login">
                            <i className="fas fa-arrow-left"></i> Back to User Login
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminLoginPage;
