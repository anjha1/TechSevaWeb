import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessage } from '../components/MessageBox';
import { PageLoader, ButtonLoader } from '../components/LoadingSpinner';
import api from '../services/api';
import '../styles/Diagnosis.css';

const DiagnosisPage = () => {
    const { jobId } = useParams();
    const navigate = useNavigate();
    const { showMessage } = useMessage();
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [job, setJob] = useState(null);
    const [formData, setFormData] = useState({
        description: '',
        partsRequired: [],
        laborCharges: 0,
        estimatedTime: '',
        notes: ''
    });
    const [currentPart, setCurrentPart] = useState({ name: '', price: 0 });

    useEffect(() => {
        fetchJobDetails();
    }, [jobId]);

    const fetchJobDetails = async () => {
        try {
            const response = await api.get(`/api/technician/jobs/${jobId}`);
            if (response.data.success) {
                setJob(response.data.data);
            }
        } catch (error) {
            showMessage('Failed to load job details.', 'error');
            navigate('/technician-dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'laborCharges' ? parseFloat(value) || 0 : value
        }));
    };

    const handleAddPart = () => {
        if (!currentPart.name || currentPart.price <= 0) {
            showMessage('Please enter part name and valid price.', 'error');
            return;
        }

        setFormData(prev => ({
            ...prev,
            partsRequired: [...prev.partsRequired, { ...currentPart }]
        }));
        setCurrentPart({ name: '', price: 0 });
    };

    const handleRemovePart = (index) => {
        setFormData(prev => ({
            ...prev,
            partsRequired: prev.partsRequired.filter((_, i) => i !== index)
        }));
    };

    const calculateTotal = () => {
        const partsTotal = formData.partsRequired.reduce((sum, part) => sum + part.price, 0);
        return partsTotal + formData.laborCharges;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.description) {
            showMessage('Please provide a diagnosis description.', 'error');
            return;
        }

        if (calculateTotal() <= 0) {
            showMessage('Please add labor charges or parts.', 'error');
            return;
        }

        setSubmitting(true);

        try {
            const response = await api.post('/api/technician/jobs/diagnosis', {
                jobId,
                diagnosis: {
                    description: formData.description,
                    partsRequired: formData.partsRequired,
                    laborCharges: formData.laborCharges,
                    estimatedCost: calculateTotal(),
                    estimatedTime: formData.estimatedTime,
                    notes: formData.notes
                }
            });

            if (response.data.success) {
                showMessage('Diagnosis submitted successfully!', 'success');
                navigate('/technician-dashboard');
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to submit diagnosis.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <PageLoader />;
    }

    if (!job) {
        return (
            <div className="diagnosis-page">
                <div className="error-state">
                    <i className="fas fa-exclamation-triangle"></i>
                    <p>Job not found</p>
                    <button onClick={() => navigate('/technician-dashboard')}>
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="diagnosis-page">
            <div className="diagnosis-container">
                <header className="diagnosis-header">
                    <button className="back-btn" onClick={() => navigate(-1)}>
                        <i className="fas fa-arrow-left"></i>
                    </button>
                    <h1>Job Diagnosis</h1>
                </header>

                {/* Job Summary */}
                <div className="job-summary">
                    <h3>Job Details</h3>
                    <div className="summary-grid">
                        <div className="summary-item">
                            <i className="fas fa-tools"></i>
                            <div>
                                <span>Service</span>
                                <strong>{job.applianceType?.name || job.applianceName}</strong>
                            </div>
                        </div>
                        <div className="summary-item">
                            <i className="fas fa-user"></i>
                            <div>
                                <span>Customer</span>
                                <strong>{job.userId?.fullName || 'N/A'}</strong>
                            </div>
                        </div>
                        <div className="summary-item">
                            <i className="fas fa-map-marker-alt"></i>
                            <div>
                                <span>Location</span>
                                <strong>{job.city}</strong>
                            </div>
                        </div>
                    </div>
                    {job.issueDescription && (
                        <div className="issue-description">
                            <h4>Reported Issue</h4>
                            <p>{job.issueDescription}</p>
                        </div>
                    )}
                </div>

                {/* Diagnosis Form */}
                <form className="diagnosis-form" onSubmit={handleSubmit}>
                    <div className="form-section">
                        <h3>Diagnosis Details</h3>
                        
                        <div className="form-group">
                            <label htmlFor="description">Diagnosis Description *</label>
                            <textarea
                                id="description"
                                name="description"
                                placeholder="Describe the problem found and the recommended solution..."
                                rows={4}
                                value={formData.description}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="estimatedTime">Estimated Repair Time</label>
                            <select
                                id="estimatedTime"
                                name="estimatedTime"
                                value={formData.estimatedTime}
                                onChange={handleChange}
                            >
                                <option value="">Select duration</option>
                                <option value="30 minutes">30 minutes</option>
                                <option value="1 hour">1 hour</option>
                                <option value="2 hours">2 hours</option>
                                <option value="Half day">Half day</option>
                                <option value="Full day">Full day</option>
                                <option value="Multiple visits">Multiple visits required</option>
                            </select>
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Parts Required</h3>
                        
                        <div className="parts-input">
                            <input
                                type="text"
                                placeholder="Part name"
                                value={currentPart.name}
                                onChange={e => setCurrentPart(prev => ({ ...prev, name: e.target.value }))}
                            />
                            <input
                                type="number"
                                placeholder="Price"
                                value={currentPart.price || ''}
                                onChange={e => setCurrentPart(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                            />
                            <button type="button" className="add-part-btn" onClick={handleAddPart}>
                                <i className="fas fa-plus"></i>
                            </button>
                        </div>

                        {formData.partsRequired.length > 0 && (
                            <div className="parts-list">
                                {formData.partsRequired.map((part, index) => (
                                    <div key={index} className="part-item">
                                        <span className="part-name">{part.name}</span>
                                        <span className="part-price">₹{part.price}</span>
                                        <button
                                            type="button"
                                            className="remove-part-btn"
                                            onClick={() => handleRemovePart(index)}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="form-section">
                        <h3>Labor Charges</h3>
                        
                        <div className="form-group">
                            <label htmlFor="laborCharges">Labor/Service Charges (₹) *</label>
                            <input
                                type="number"
                                id="laborCharges"
                                name="laborCharges"
                                placeholder="Enter labor charges"
                                value={formData.laborCharges || ''}
                                onChange={handleChange}
                                min="0"
                                required
                            />
                        </div>
                    </div>

                    <div className="form-section">
                        <h3>Additional Notes</h3>
                        
                        <div className="form-group">
                            <textarea
                                name="notes"
                                placeholder="Any additional notes for the customer..."
                                rows={3}
                                value={formData.notes}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    {/* Cost Summary */}
                    <div className="cost-summary">
                        <h3>Cost Summary</h3>
                        <div className="cost-breakdown">
                            <div className="cost-row">
                                <span>Parts Total</span>
                                <span>₹{formData.partsRequired.reduce((sum, p) => sum + p.price, 0)}</span>
                            </div>
                            <div className="cost-row">
                                <span>Labor Charges</span>
                                <span>₹{formData.laborCharges}</span>
                            </div>
                            <div className="cost-row total">
                                <span>Estimated Total</span>
                                <span>₹{calculateTotal()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn-secondary"
                            onClick={() => navigate(-1)}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary"
                            disabled={submitting}
                        >
                            {submitting ? <ButtonLoader /> : 'Submit Diagnosis'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default DiagnosisPage;
