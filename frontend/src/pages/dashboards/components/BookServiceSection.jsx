import React, { useState, useEffect } from 'react';
import { useMessage } from '../../../components/MessageBox';
import { ButtonLoader } from '../../../components/LoadingSpinner';
import api from '../../../services/api';

const services = [
    { id: 'ac', name: 'AC Repair & Service', icon: 'fas fa-snowflake' },
    { id: 'refrigerator', name: 'Refrigerator Repair', icon: 'fas fa-thermometer-empty' },
    { id: 'washing-machine', name: 'Washing Machine', icon: 'fas fa-tshirt' },
    { id: 'geyser', name: 'Geyser Repair', icon: 'fas fa-fire' },
    { id: 'fan', name: 'Fan Repair', icon: 'fas fa-fan' },
    { id: 'computer', name: 'Computer Repair', icon: 'fas fa-desktop' },
    { id: 'laptop', name: 'Laptop Repair', icon: 'fas fa-laptop' },
    { id: 'tv', name: 'TV Repair', icon: 'fas fa-tv' }
];

const BookServiceSection = ({ onBookingComplete }) => {
    const { showMessage } = useMessage();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        applianceType: '',
        issueDescription: '',
        address: '',
        city: '',
        pincode: '',
        preferredDate: '',
        preferredTime: '',
        urgency: 'normal'
    });

    useEffect(() => {
        // Check for prefill data
        const prefillData = sessionStorage.getItem('prefillBookingData');
        if (prefillData) {
            const { service } = JSON.parse(prefillData);
            if (service) {
                setFormData(prev => ({ ...prev, applianceType: service }));
            }
            sessionStorage.removeItem('prefillBookingData');
        }
    }, []);

    const handleServiceSelect = (serviceId) => {
        setFormData(prev => ({ ...prev, applianceType: serviceId }));
        setStep(2);
    };

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const { applianceType, issueDescription, address, city, pincode, preferredDate, preferredTime } = formData;
        
        if (!applianceType || !issueDescription || !address || !city || !pincode || !preferredDate || !preferredTime) {
            showMessage('Please fill all required fields.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/user/book', {
                ...formData,
                applianceName: services.find(s => s.id === applianceType)?.name || applianceType
            });

            if (response.data.success) {
                showMessage('Service booked successfully! A technician will be assigned soon.', 'success');
                setFormData({
                    applianceType: '',
                    issueDescription: '',
                    address: '',
                    city: '',
                    pincode: '',
                    preferredDate: '',
                    preferredTime: '',
                    urgency: 'normal'
                });
                setStep(1);
                onBookingComplete?.();
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to book service.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const getMinDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    };

    return (
        <div className="book-service-section">
            <h2>Book a Service</h2>

            {/* Progress Steps */}
            <div className="booking-progress">
                <div className={`progress-step ${step >= 1 ? 'active' : ''}`}>
                    <span className="step-number">1</span>
                    <span className="step-label">Select Service</span>
                </div>
                <div className={`progress-step ${step >= 2 ? 'active' : ''}`}>
                    <span className="step-number">2</span>
                    <span className="step-label">Issue Details</span>
                </div>
                <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
                    <span className="step-number">3</span>
                    <span className="step-label">Schedule & Address</span>
                </div>
            </div>

            {/* Step 1: Select Service */}
            {step === 1 && (
                <div className="services-selection">
                    <p>Select the appliance that needs repair:</p>
                    <div className="services-grid">
                        {services.map(service => (
                            <button
                                key={service.id}
                                className={`service-btn ${formData.applianceType === service.id ? 'selected' : ''}`}
                                onClick={() => handleServiceSelect(service.id)}
                            >
                                <i className={service.icon}></i>
                                <span>{service.name}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Step 2: Issue Details */}
            {step === 2 && (
                <div className="issue-details">
                    <div className="selected-service">
                        <i className={services.find(s => s.id === formData.applianceType)?.icon}></i>
                        <span>{services.find(s => s.id === formData.applianceType)?.name}</span>
                        <button className="change-btn" onClick={() => setStep(1)}>Change</button>
                    </div>

                    <form className="booking-form">
                        <div className="form-group">
                            <label htmlFor="issueDescription">Describe the issue *</label>
                            <textarea
                                id="issueDescription"
                                name="issueDescription"
                                placeholder="Please describe the problem you're facing..."
                                rows={4}
                                value={formData.issueDescription}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="urgency">Urgency</label>
                            <select
                                id="urgency"
                                name="urgency"
                                value={formData.urgency}
                                onChange={handleChange}
                            >
                                <option value="normal">Normal</option>
                                <option value="urgent">Urgent (within 24 hours)</option>
                            </select>
                        </div>

                        <div className="form-buttons">
                            <button type="button" className="btn-secondary" onClick={() => setStep(1)}>
                                Back
                            </button>
                            <button 
                                type="button" 
                                className="btn-primary"
                                onClick={() => {
                                    if (!formData.issueDescription) {
                                        showMessage('Please describe the issue.', 'error');
                                        return;
                                    }
                                    setStep(3);
                                }}
                            >
                                Next
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Step 3: Schedule & Address */}
            {step === 3 && (
                <form className="booking-form" onSubmit={handleSubmit}>
                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="preferredDate">Preferred Date *</label>
                            <input
                                type="date"
                                id="preferredDate"
                                name="preferredDate"
                                min={getMinDate()}
                                value={formData.preferredDate}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="preferredTime">Preferred Time *</label>
                            <select
                                id="preferredTime"
                                name="preferredTime"
                                value={formData.preferredTime}
                                onChange={handleChange}
                                required
                            >
                                <option value="">Select time slot</option>
                                <option value="09:00-11:00">09:00 AM - 11:00 AM</option>
                                <option value="11:00-13:00">11:00 AM - 01:00 PM</option>
                                <option value="14:00-16:00">02:00 PM - 04:00 PM</option>
                                <option value="16:00-18:00">04:00 PM - 06:00 PM</option>
                                <option value="18:00-20:00">06:00 PM - 08:00 PM</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-group">
                        <label htmlFor="address">Address *</label>
                        <textarea
                            id="address"
                            name="address"
                            placeholder="Enter your complete address"
                            rows={2}
                            value={formData.address}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-row">
                        <div className="form-group">
                            <label htmlFor="city">City *</label>
                            <input
                                type="text"
                                id="city"
                                name="city"
                                placeholder="City"
                                value={formData.city}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="pincode">Pincode *</label>
                            <input
                                type="text"
                                id="pincode"
                                name="pincode"
                                placeholder="Pincode"
                                pattern="[0-9]{6}"
                                value={formData.pincode}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="form-buttons">
                        <button type="button" className="btn-secondary" onClick={() => setStep(2)}>
                            Back
                        </button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? <ButtonLoader /> : 'Book Service'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default BookServiceSection;
