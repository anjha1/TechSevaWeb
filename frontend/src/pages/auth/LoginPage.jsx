import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../components/MessageBox';
import { ButtonLoader } from '../../components/LoadingSpinner';
import api from '../../services/api';
import '../../styles/Auth.css';

const GOOGLE_CLIENT_ID = '288517656224-7d5eubb0763efq1cooulh8v1eplacf84.apps.googleusercontent.com';

// Helper function to get the correct dashboard route based on role
const getDashboardRoute = (role) => {
    const roleRoutes = {
        'user': '/user-dashboard',
        'technician': '/technician-dashboard',
        'superadmin': '/superadmin-dashboard',
        'Superadmin': '/superadmin-dashboard',
        'citymanager': '/citymanager-dashboard',
        'Citymanager': '/citymanager-dashboard',
        'serviceadmin': '/serviceadmin-dashboard',
        'Serviceadmin': '/serviceadmin-dashboard',
        'financeofficer': '/financeofficer-dashboard',
        'Financeofficer': '/financeofficer-dashboard',
        'supportagent': '/supportagent-dashboard',
        'Supportagent': '/supportagent-dashboard'
    };
    return roleRoutes[role] || '/user-dashboard';
};

const LoginPage = () => {
    const navigate = useNavigate();
    const { login, user, setUserData } = useAuth();
    const { showMessage } = useMessage();
    
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        role: 'user'
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const googleBtnRef = useRef(null);
    const formDataRef = useRef(formData);

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const dashboardRoute = getDashboardRoute(user.role);
            navigate(dashboardRoute, { replace: true });
        }
    }, [user, navigate]);

    // Keep ref synced with formData
    useEffect(() => {
        formDataRef.current = formData;
    }, [formData]);

    // Initialize Google Sign-In button
    useEffect(() => {
        const handleGoogleResponse = async (response) => {
            try {
                const res = await api.post('/api/auth/google-login', {
                    idToken: response.credential,
                    role: formDataRef.current.role
                });
                
                if (res.data.success) {
                    const userData = res.data.data?.user;
                    if (userData) {
                        setUserData(userData);
                    }
                    
                    if (res.data.data?.needsPhoneUpdate) {
                        showMessage('Please add your phone number to complete your profile.', 'info');
                        navigate('/phone-update', { replace: true });
                    } else {
                        showMessage('Google login successful!', 'success');
                        const dashboardRoute = getDashboardRoute(userData?.role);
                        setTimeout(() => navigate(dashboardRoute, { replace: true }), 100);
                    }
                }
            } catch (error) {
                showMessage(error.response?.data?.message || 'Google login failed.', 'error');
            }
        };

        const initGoogleButton = () => {
            if (window.google && window.google.accounts && googleBtnRef.current) {
                window.google.accounts.id.initialize({
                    client_id: GOOGLE_CLIENT_ID,
                    callback: handleGoogleResponse,
                    auto_select: false
                });
                window.google.accounts.id.renderButton(
                    googleBtnRef.current,
                    { 
                        type: 'standard',
                        theme: 'outline', 
                        size: 'large',
                        text: 'signin_with',
                        width: '100%'
                    }
                );
            }
        };

        // Wait for Google script to load
        if (window.google) {
            initGoogleButton();
        } else {
            window.addEventListener('load', initGoogleButton);
            return () => window.removeEventListener('load', initGoogleButton);
        }
    }, [login, navigate, showMessage]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password) {
            showMessage('Please enter email and password.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/auth/login', formData);
            
            if (response.data.success) {
                showMessage('Login successful!', 'success');
                setUserData(response.data.data.user);
                
                // Check for prefill data
                const prefillData = sessionStorage.getItem('prefillBookingData');
                if (prefillData) {
                    sessionStorage.removeItem('prefillBookingData');
                    setTimeout(() => navigate('/user-dashboard', { replace: true }), 100);
                } else {
                    const dashboardRoute = getDashboardRoute(response.data.data.user.role);
                    setTimeout(() => navigate(dashboardRoute, { replace: true }), 100);
                }
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Login failed. Please check your credentials.', 'error');
        } finally {
            setLoading(false);
        }
    };



    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">🔧</span> TechSeva
                    </Link>
                    <h1>Welcome Back</h1>
                    <p>Login to your TechSeva account</p>
                </div>

                <div className="role-selection">
                    <label>I am a:</label>
                    <div className="role-options">
                        <button
                            type="button"
                            className={`role-btn ${formData.role === 'user' ? 'active' : ''}`}
                            onClick={() => handleRoleSelect('user')}
                        >
                            <i className="fas fa-user"></i> User
                        </button>
                        <button
                            type="button"
                            className={`role-btn ${formData.role === 'technician' ? 'active' : ''}`}
                            onClick={() => handleRoleSelect('technician')}
                        >
                            <i className="fas fa-tools"></i> Technician
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
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

                    <div className="form-group password-input">
                        <label htmlFor="password">Password:</label>
                        <input
                            type={showPassword ? 'text' : 'password'}
                            id="password"
                            name="password"
                            placeholder="Enter your password"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <i
                            className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                            onClick={() => setShowPassword(!showPassword)}
                        ></i>
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <ButtonLoader /> : 'Login'}
                    </button>

                    <div className="auth-divider">
                        <span>OR</span>
                    </div>

                    <div 
                        ref={googleBtnRef} 
                        className="google-btn-container"
                        style={{ display: 'flex', justifyContent: 'center', width: '100%' }}
                    ></div>

                    <div className="auth-footer">
                        <Link to="/forgot-password" className="forgot-password">Forgot Password?</Link>
                        <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default LoginPage;
