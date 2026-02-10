/**
 * Signup Page
 * User registration with OTP verification
 */

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../services/api';

const Signup = () => {
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Details
    const [formData, setFormData] = useState({
        email: '',
        otp: '',
        fullName: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        role: 'user',
        // Technician fields
        aadhaar: '',
        pan: '',
        skills: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    useEffect(() => {
        if (user) {
            navigate(`/${user.role}-dashboard`, { replace: true });
        }
    }, [user, navigate]);

    const skillOptions = [
        'AC', 'Refrigerator', 'Washing Machine', 'TV', 
        'Microwave', 'Water Purifier', 'Chimney', 'Geyser'
    ];

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setError('');
    };

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authAPI.sendOTP(formData.email, 'signup');
            setSuccess('OTP sent to your email!');
            setStep(2);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await authAPI.verifyOTP(formData.email, formData.otp);
            setSuccess('OTP verified!');
            setStep(3);
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (formData.password.length < 8) {
            setError('Password must be at least 8 characters');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const result = await register({
                email: formData.email,
                fullName: formData.fullName,
                phoneNumber: formData.phoneNumber,
                password: formData.password,
                role: formData.role,
                aadhaar: formData.aadhaar,
                pan: formData.pan,
                skills: formData.skills
            });
            
            if (result.redirect) {
                navigate(result.redirect);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-container">
                <div className="auth-header">
                    <h1>Create Account</h1>
                    <p>Join TechSeva today</p>
                </div>

                {/* Progress Steps */}
                <div className="signup-steps">
                    <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Email</div>
                    <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Verify</div>
                    <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Details</div>
                </div>

                {error && <div className="alert alert-error">{error}</div>}
                {success && <div className="alert alert-success">{success}</div>}

                {/* Step 1: Email */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="role">Register as</label>
                            <select
                                id="role"
                                name="role"
                                value={formData.role}
                                onChange={handleChange}
                                className="form-control"
                            >
                                <option value="user">Customer</option>
                                <option value="technician">Technician</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label htmlFor="email">Email Address</label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Enter your email"
                                className="form-control"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Sending...' : 'Send OTP'}
                        </button>
                    </form>
                )}

                {/* Step 2: OTP Verification */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="otp">Enter OTP</label>
                            <input
                                type="text"
                                id="otp"
                                name="otp"
                                value={formData.otp}
                                onChange={handleChange}
                                placeholder="Enter 6-digit OTP"
                                className="form-control"
                                maxLength="6"
                                required
                            />
                            <small>OTP sent to {formData.email}</small>
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Verifying...' : 'Verify OTP'}
                        </button>

                        <button 
                            type="button" 
                            className="btn btn-link"
                            onClick={() => setStep(1)}
                        >
                            Change Email
                        </button>
                    </form>
                )}

                {/* Step 3: User Details */}
                {step === 3 && (
                    <form onSubmit={handleRegister} className="auth-form">
                        <div className="form-group">
                            <label htmlFor="fullName">Full Name</label>
                            <input
                                type="text"
                                id="fullName"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="phoneNumber">Phone Number</label>
                            <input
                                type="tel"
                                id="phoneNumber"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                className="form-control"
                                maxLength="10"
                                required
                            />
                        </div>

                        {formData.role === 'technician' && (
                            <>
                                <div className="form-group">
                                    <label htmlFor="aadhaar">Aadhaar Number</label>
                                    <input
                                        type="text"
                                        id="aadhaar"
                                        name="aadhaar"
                                        value={formData.aadhaar}
                                        onChange={handleChange}
                                        className="form-control"
                                        maxLength="12"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="pan">PAN Number</label>
                                    <input
                                        type="text"
                                        id="pan"
                                        name="pan"
                                        value={formData.pan}
                                        onChange={handleChange}
                                        className="form-control"
                                        maxLength="10"
                                        required
                                    />
                                </div>

                                <div className="form-group">
                                    <label htmlFor="skills">Skills</label>
                                    <select
                                        id="skills"
                                        name="skills"
                                        value={formData.skills}
                                        onChange={handleChange}
                                        className="form-control"
                                        multiple
                                    >
                                        {skillOptions.map(skill => (
                                            <option key={skill} value={skill}>{skill}</option>
                                        ))}
                                    </select>
                                    <small>Hold Ctrl/Cmd to select multiple</small>
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label htmlFor="password">Password</label>
                            <input
                                type="password"
                                id="password"
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                className="form-control"
                                minLength="8"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="confirmPassword">Confirm Password</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                className="form-control"
                                required
                            />
                        </div>

                        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
                            {loading ? 'Creating Account...' : 'Create Account'}
                        </button>
                    </form>
                )}

                <p className="auth-footer">
                    Already have an account? <Link to="/login">Sign In</Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;
