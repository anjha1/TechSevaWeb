import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMessage } from '../../components/MessageBox';
import { ButtonLoader } from '../../components/LoadingSpinner';
import OTPInput from '../../components/OTPInput';
import api from '../../services/api';
import '../../styles/Auth.css';

const ForgotPasswordPage = () => {
    const navigate = useNavigate();
    const { showMessage } = useMessage();
    
    const [step, setStep] = useState('email'); // email, reset
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        
        if (!email) {
            showMessage('Please enter your email address.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/auth/send-otp', {
                email,
                type: 'password_reset'
            });
            
            if (response.data.success) {
                showMessage('Reset OTP sent to your email!', 'success');
                setStep('reset');
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to send reset OTP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();

        if (otp.length !== 6) {
            showMessage('Please enter the complete 6-digit OTP.', 'error');
            return;
        }

        if (!newPassword || !confirmPassword) {
            showMessage('Please enter new password.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showMessage('Passwords do not match.', 'error');
            return;
        }

        if (newPassword.length < 8) {
            showMessage('Password must be at least 8 characters.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/auth/reset-password', {
                email,
                otp,
                newPassword
            });
            
            if (response.data.success) {
                showMessage('Password reset successful! Please login.', 'success');
                setTimeout(() => navigate('/login'), 2000);
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to reset password.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        setLoading(true);
        try {
            const response = await api.post('/api/auth/send-otp', {
                email,
                type: 'password_reset'
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

    if (step === 'reset') {
        return (
            <div className="auth-page">
                <div className="auth-container">
                    <div className="auth-header">
                        <Link to="/" className="auth-logo">
                            <span className="logo-icon">🔧</span> TechSeva
                        </Link>
                        <h1>Reset Password</h1>
                        <p>We've sent an OTP to <strong>{email}</strong></p>
                    </div>

                    <form onSubmit={handleResetPassword} className="auth-form">
                        <div className="otp-section">
                            <OTPInput
                                length={6}
                                value={otp}
                                onChange={setOtp}
                            />
                        </div>

                        <div className="form-group password-input">
                            <label htmlFor="newPassword">New Password:</label>
                            <input
                                type={showPassword ? 'text' : 'password'}
                                id="newPassword"
                                placeholder="Min 8 characters"
                                minLength={8}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                required
                            />
                            <i
                                className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                                onClick={() => setShowPassword(!showPassword)}
                            ></i>
                        </div>

                        <div className="form-group password-input">
                            <label htmlFor="confirmPassword">Confirm New Password:</label>
                            <input
                                type={showConfirmPassword ? 'text' : 'password'}
                                id="confirmPassword"
                                placeholder="Confirm new password"
                                minLength={8}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <i
                                className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'} toggle-password`}
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            ></i>
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? <ButtonLoader /> : 'Reset Password'}
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
                    </form>
                </div>
            </div>
        );
    }

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <Link to="/" className="auth-logo">
                        <span className="logo-icon">🔧</span> TechSeva
                    </Link>
                    <h1>Forgot Password</h1>
                    <p>Enter your email to reset your password</p>
                </div>

                <form onSubmit={handleSendOTP} className="auth-form">
                    <div className="form-group">
                        <label htmlFor="email">Email:</label>
                        <input
                            type="email"
                            id="email"
                            placeholder="Enter your registered email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? <ButtonLoader /> : 'Send Reset OTP'}
                    </button>

                    <div className="auth-footer">
                        <Link to="/login" className="back-link">← Back to Login</Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
