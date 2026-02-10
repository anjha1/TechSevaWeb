import React, { useState } from 'react';
import { useMessage } from '../../../components/MessageBox';
import api from '../../../services/api';

const MyJobsSection = ({ jobs, onRefresh }) => {
    const { showMessage } = useMessage();
    const [filter, setFilter] = useState('all');
    const [selectedJob, setSelectedJob] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewData, setReviewData] = useState({ rating: 5, comment: '' });

    const filteredJobs = jobs.filter(job => {
        if (filter === 'all') return true;
        if (filter === 'active') return ['pending', 'assigned', 'in-progress'].includes(job.status);
        if (filter === 'completed') return job.status === 'completed';
        if (filter === 'cancelled') return job.status === 'cancelled';
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'orange';
            case 'assigned': return 'blue';
            case 'in-progress': return 'purple';
            case 'completed': return 'green';
            case 'cancelled': return 'red';
            default: return 'gray';
        }
    };

    const handleCancelJob = async (jobId) => {
        if (!window.confirm('Are you sure you want to cancel this job?')) return;

        try {
            const response = await api.post('/api/user/jobs/cancel', { jobId });
            if (response.data.success) {
                showMessage('Job cancelled successfully.', 'success');
                onRefresh?.();
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to cancel job.', 'error');
        }
    };

    const handleSubmitReview = async () => {
        if (!selectedJob) return;

        try {
            const response = await api.post('/api/user/jobs/review', {
                jobId: selectedJob._id,
                rating: reviewData.rating,
                review: reviewData.comment
            });

            if (response.data.success) {
                showMessage('Review submitted successfully!', 'success');
                setShowReviewModal(false);
                setSelectedJob(null);
                setReviewData({ rating: 5, comment: '' });
                onRefresh?.();
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to submit review.', 'error');
        }
    };

    return (
        <div className="my-jobs-section">
            <h2>My Jobs</h2>

            {/* Filter Tabs */}
            <div className="filter-tabs">
                {['all', 'active', 'completed', 'cancelled'].map(f => (
                    <button
                        key={f}
                        className={`filter-tab ${filter === f ? 'active' : ''}`}
                        onClick={() => setFilter(f)}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Jobs List */}
            {filteredJobs.length === 0 ? (
                <div className="empty-state">
                    <i className="fas fa-clipboard-list"></i>
                    <p>No jobs found</p>
                </div>
            ) : (
                <div className="jobs-list">
                    {filteredJobs.map(job => (
                        <div key={job._id} className="job-card">
                            <div className="job-header">
                                <div className="job-service">
                                    <i className="fas fa-tools"></i>
                                    <span>{job.applianceType?.name || job.applianceName || 'Service'}</span>
                                </div>
                                <span className={`status-badge ${getStatusColor(job.status)}`}>
                                    {job.status}
                                </span>
                            </div>

                            <div className="job-details">
                                <div className="detail-row">
                                    <i className="fas fa-calendar"></i>
                                    <span>
                                        {new Date(job.preferredDate || job.createdAt).toLocaleDateString()}
                                        {job.preferredTime && ` • ${job.preferredTime}`}
                                    </span>
                                </div>
                                
                                <div className="detail-row">
                                    <i className="fas fa-map-marker-alt"></i>
                                    <span>{job.address}, {job.city}</span>
                                </div>

                                {job.issueDescription && (
                                    <div className="detail-row">
                                        <i className="fas fa-info-circle"></i>
                                        <span>{job.issueDescription}</span>
                                    </div>
                                )}

                                {job.technicianId && (
                                    <div className="detail-row technician-info">
                                        <i className="fas fa-user-cog"></i>
                                        <span>
                                            Technician: {job.technicianId.fullName || 'Assigned'}
                                            {job.technicianId.phoneNumber && ` • ${job.technicianId.phoneNumber}`}
                                        </span>
                                    </div>
                                )}

                                {job.diagnosis && (
                                    <div className="diagnosis-section">
                                        <h4>Diagnosis</h4>
                                        <p>{job.diagnosis.description}</p>
                                        {job.diagnosis.estimatedCost && (
                                            <p className="estimated-cost">
                                                Estimated Cost: ₹{job.diagnosis.estimatedCost}
                                            </p>
                                        )}
                                    </div>
                                )}

                                {job.totalAmount && job.status === 'completed' && (
                                    <div className="payment-info">
                                        <span className="amount">Total: ₹{job.totalAmount}</span>
                                    </div>
                                )}
                            </div>

                            <div className="job-actions">
                                {['pending', 'assigned'].includes(job.status) && (
                                    <button 
                                        className="btn-danger"
                                        onClick={() => handleCancelJob(job._id)}
                                    >
                                        Cancel Job
                                    </button>
                                )}
                                
                                {job.status === 'completed' && !job.review && (
                                    <button 
                                        className="btn-primary"
                                        onClick={() => {
                                            setSelectedJob(job);
                                            setShowReviewModal(true);
                                        }}
                                    >
                                        Leave Review
                                    </button>
                                )}

                                {job.review && (
                                    <div className="review-badge">
                                        <i className="fas fa-star"></i>
                                        <span>Rated {job.review.rating}/5</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {showReviewModal && (
                <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setShowReviewModal(false)}>
                            <i className="fas fa-times"></i>
                        </button>
                        
                        <h3>Rate Your Experience</h3>
                        
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    className={`star ${reviewData.rating >= star ? 'active' : ''}`}
                                    onClick={() => setReviewData(prev => ({ ...prev, rating: star }))}
                                >
                                    <i className="fas fa-star"></i>
                                </button>
                            ))}
                        </div>

                        <textarea
                            placeholder="Share your experience (optional)"
                            value={reviewData.comment}
                            onChange={e => setReviewData(prev => ({ ...prev, comment: e.target.value }))}
                            rows={4}
                        />

                        <button className="btn-primary" onClick={handleSubmitReview}>
                            Submit Review
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyJobsSection;
