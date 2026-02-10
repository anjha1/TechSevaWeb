import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessage } from '../components/MessageBox';
import { ButtonLoader } from '../components/LoadingSpinner';
import OTPInput from '../components/OTPInput';
import api from '../services/api';
import '../styles/PhoneUpdate.css';

const PhoneUpdatePage = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { showMessage } = useMessage();
    
    const [step, setStep] = useState(1); // 1: Enter phone, 2: Verify OTP
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [timer, setTimer] = useState(0);
    const [canResend, setCanResend] = useState(false);

    // Get redirect URL from location state
    const redirectTo = location.state?.redirectTo || '/user-dashboard';

    useEffect(() => {
        let interval;
        if (timer > 0) {
            interval = setInterval(() => {
                setTimer(prev => prev - 1);
            }, 1000);
        } else if (timer === 0 && step === 2) {
            setCanResend(true);
        }
        return () => clearInterval(interval);
    }, [timer, step]);

    const handleSendOTP = async (e) => {
        e.preventDefault();

        if (!phoneNumber || phoneNumber.length !== 10) {
            showMessage('Please enter a valid 10-digit phone number.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/auth/send-phone-otp', {
                phoneNumber: `+91${phoneNumber}`
            });

            if (response.data.success) {
                showMessage('OTP sent to your phone number.', 'success');
                setStep(2);
                setTimer(60);
                setCanResend(false);
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
            const response = await api.post('/api/auth/verify-phone-otp', {
                phoneNumber: `+91${phoneNumber}`,
                otp
            });

            if (response.data.success) {
                showMessage('Phone number verified successfully!', 'success');
                navigate(redirectTo);
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Invalid OTP. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = async () => {
        if (!canResend) return;

        setLoading(true);

        try {
            const response = await api.post('/api/auth/send-phone-otp', {
                phoneNumber: `+91${phoneNumber}`
            });

            if (response.data.success) {
                showMessage('OTP resent successfully!', 'success');
                setTimer(60);
                setCanResend(false);
                setOtp('');
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to resend OTP.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="phone-update-page">
            <div className="phone-update-container">
                <div className="phone-update-card">
                    <div className="phone-update-header">
                        <button className="back-btn" onClick={() => navigate(-1)}>
                            <i className="fas fa-arrow-left"></i>
                        </button>
                        <h1>
                            {step === 1 
                                ? (user?.phoneNumber ? 'Update Phone Number' : 'Add Phone Number')
                                : 'Verify Phone Number'
                            }
                        </h1>
                    </div>

                    {step === 1 ? (
                        <form onSubmit={handleSendOTP}>
                            <div className="phone-icon">
                                <i className="fas fa-mobile-alt"></i>
                            </div>
                            
                            <p className="description">
                                {user?.phoneNumber 
                                    ? 'Enter your new phone number to update'
                                    : 'Add your phone number for better communication'
                                }
                            </p>

                            <div className="phone-input-wrapper">
                                <span className="country-code">+91</span>
                                <input
                                    type="tel"
                                    placeholder="Enter 10-digit phone number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
                                    maxLength={10}
                                    required
                                />
                            </div>

                            <button type="submit" className="submit-btn" disabled={loading}>
                                {loading ? <ButtonLoader /> : 'Send OTP'}
                            </button>
                        </form>
                    ) : (
                        <div className="otp-section">
                            <div className="phone-icon success">
                                <i className="fas fa-sms"></i>
                            </div>

                            <p className="description">
                                Enter the 6-digit code sent to<br />
                                <strong>+91 {phoneNumber}</strong>
                            </p>

                            <button 
                                className="change-number-btn"
                                onClick={() => {
                                    setStep(1);
                                    setOtp('');
                                }}
                            >
                                Change Number
                            </button>

                            <div className="otp-container">
                                <OTPInput
                                    value={otp}
                                    onChange={setOtp}
                                    length={6}
                                />
                            </div>

                            <button 
                                className="submit-btn" 
                                onClick={handleVerifyOTP}
                                disabled={loading || otp.length !== 6}
                            >
                                {loading ? <ButtonLoader /> : 'Verify OTP'}
                            </button>

                            <div className="resend-section">
                                {timer > 0 ? (
                                    <span className="timer">Resend OTP in {timer}s</span>
                                ) : (
                                    <button 
                                        className="resend-btn"
                                        onClick={handleResendOTP}
                                        disabled={!canResend || loading}
                                    >
                                        Resend OTP
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PhoneUpdatePage;
