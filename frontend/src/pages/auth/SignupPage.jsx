import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMessage } from '../../components/MessageBox';
import { ButtonLoader } from '../../components/LoadingSpinner';
import OTPInput from '../../components/OTPInput';
import api from '../../services/api';
import '../../styles/Auth.css';

// Helper function to get the correct dashboard route based on role
const getDashboardRoute = (role) => {
    const roleRoutes = {
        'user': '/user-dashboard',
        'technician': '/technician-dashboard',
        'superadmin': '/superadmin-dashboard',
        'Superadmin': '/superadmin-dashboard'
    };
    return roleRoutes[role] || '/user-dashboard';
};

const SignupPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { showMessage } = useMessage();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            const dashboardRoute = getDashboardRoute(user.role);
            navigate(dashboardRoute, { replace: true });
        }
    }, [user, navigate]);
    
    const [step, setStep] = useState('form'); // form, otp
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        // Technician specific
        aadhaar: '',
        pan: '',
        skills: ''
    });
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleRoleSelect = (role) => {
        setFormData(prev => ({ ...prev, role }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const { fullName, email, phoneNumber, password, confirmPassword, role, aadhaar, pan, skills } = formData;

        if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
            showMessage('Please fill all required fields.', 'error');
            return;
        }

        if (password !== confirmPassword) {
            showMessage('Passwords do not match.', 'error');
            return;
        }

        if (password.length < 8) {
            showMessage('Password must be at least 8 characters.', 'error');
            return;
        }

        if (role === 'technician' && (!aadhaar || !pan || !skills)) {
            showMessage('Please fill all technician details.', 'error');
            return;
        }

        setLoading(true);

        try {
            // Send OTP first
            const response = await api.post('/api/auth/send-otp', { 
                email,
                type: 'registration'
            });
            
            if (response.data.success) {
                showMessage('OTP sent to your email!', 'success');
                setStep('otp');
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to send OTP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async () => {
        if (otp.length !== 6) {
            showMessage('Please enter the complete 6-digit OTP.', 'error');
            return;
        }

        setLoading(true);

        try {
            // Verify OTP and register
            const response = await api.post('/api/auth/register', {
                ...formData,
                otp,
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : []
            });
            
            if (response.data.success) {
                showMessage('Registration successful! Please login.', 'success');
                setTimeout(() => navigate('/login'), 1500);
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Registration failed.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            const response = await api.post('/api/auth/send-otp', {
                email: formData.email,
                type: 'registration'
            });
            
            if (response.data.success) {
                showMessage('OTP resent successfully!', 'success');
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to resend OTP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSignup = () => {
        if (formData.role === 'technician') {
            showMessage('Google signup is not available for technicians. Please fill the form.', 'warning');
            return;
        }

        if (window.google) {
            window.google.accounts.id.initialize({
                client_id: '288517656224-7d5eubb0763efq1cooulh8v1eplacf84.apps.googleusercontent.com',
                callback: handleGoogleResponse,
                context: 'signup'
            });
            window.google.accounts.id.prompt();
        }
    };

    const handleGoogleResponse = async (response) => {
        try {
            const res = await api.post('/api/auth/google-login', {
                idToken: response.credential,
                role: formData.role
            });
            
            if (res.data.success) {
                showMessage('Google signup successful!', 'success');
                setTimeout(() => navigate('/login'), 1500);
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Google signup failed.', 'error');
        }
    };

    if (step === 'otp') {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <span className="logo-icon">🔧</span> TechSeva
                        </Link>
                        <h1>Email Verification</h1>
                        <p>We've sent a 6-digit OTP to <strong>{formData.email}</strong></p>
                    </div>

                    <div className="otp-section">
                        <OTPInput
                            length={6}
                            value={otp}
                            onChange={setOtp}
                        />

                        <button 
                            className="auth-btn" 
                            onClick={handleVerifyOTP}
                            disabled={loading}
                        >
                            {loading ? <ButtonLoader /> : 'Verify & Register'}
                        </button>

                        <p className="resend-otp">
                            Didn't receive OTP?{' '}
                            <button 
                                type="button" 
                                onClick={handleResendOTP}
                                disabled={loading}
                                className="link-btn"
                            >
                                Resend
                            </button>
                        </p>

                        <button 
                            type="button" 
                            className="back-btn"
                            onClick={() => setStep('form')}
                        >
                            ← Back to form
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container signup-container">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">🔧</span> TechSeva
                    </Link>
                    <h1>Join TechSeva</h1>
                    <p>Create your account to get started</p>
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
                        <label htmlFor="fullName">Full Name:</label>
                        <input
                            type="text"
                            id="fullName"
                            name="fullName"
                            placeholder="Your Full Name"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Your Email Address"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="phoneNumber">Phone Number:</label>
                        <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            placeholder="e.g., 9876543210"
                            pattern="[0-9]{10}"
                            value={formData.phoneNumber}
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
                            placeholder="Min 8 characters"
                            minLength={8}
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                        <i
                            className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                            onClick={() => setShowPassword(!showPassword)}
                        ></i>
                    </div>

                    <div className="form-group password-input">
                        <label htmlFor="confirmPassword">Confirm Password:</label>
                        <input
                            type={showConfirmPassword ? 'text' : 'password'}
                            id="confirmPassword"
                            name="confirmPassword"
                            placeholder="Confirm your password"
                            minLength={8}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                            required
                        />
                        <i
                            className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        ></i>
                    </div>

                    {/* Technician Specific Fields */}
                    {formData.role === 'technician' && (
                        <div className="technician-fields">
                            <div className="form-group">
                                <label htmlFor="aadhaar">Aadhaar Number:</label>
                                <input
                                    type="text"
                                    id="aadhaar"
                                    name="aadhaar"
                                    placeholder="12-digit Aadhaar"
                                    pattern="[0-9]{12}"
                                    value={formData.aadhaar}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="pan">PAN Number:</label>
                                <input
                                    type="text"
                                    id="pan"
                                    name="pan"
                                    placeholder="10-character PAN (e.g., ABCDE1234F)"
                                    pattern="[A-Z]{5}[0-9]{4}[A-Z]{1}"
                                    value={formData.pan}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="skills">Skills (comma-separated):</label>
                                <input
                                    type="text"
                                    id="skills"
                                    name="skills"
                                    placeholder="e.g., AC Repair, Electrician"
                                    value={formData.skills}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <ButtonLoader /> : 'Sign Up'}
                    </button>

                    {formData.role === 'user' && (
                        <>
                            <div className="auth-divider">
                                <span>OR</span>
                            </div>

                            <button 
                                type="button" 
                                className="google-btn"
                                onClick={handleGoogleSignup}
                            >
                                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                                Sign up with Google
                            </button>
                        </>
                    )}

                    <div className="auth-footer">
                        <p>Already have an account? <Link to="/login">Login</Link></p>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SignupPage;
