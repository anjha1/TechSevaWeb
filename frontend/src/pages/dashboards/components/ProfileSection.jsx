import React, { useState } from 'react';
import { useMessage } from '../../../components/MessageBox';
import { ButtonLoader } from '../../../components/LoadingSpinner';
import api from '../../../services/api';

const ProfileSection = ({ user, onUpdate }) => {
    const { showMessage } = useMessage();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        phoneNumber: user?.phoneNumber || '',
        address: user?.address || '',
        city: user?.city || ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.put('/api/user/profile', formData);
            if (response.data.success) {
                showMessage('Profile updated successfully!', 'success');
                setIsEditing(false);
                onUpdate?.();
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to update profile.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showMessage('Image size should be less than 5MB.', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('photo', file);

        try {
            const response = await api.post('/api/user/profile/photo', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            if (response.data.success) {
                showMessage('Profile photo updated!', 'success');
                onUpdate?.();
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to upload photo.', 'error');
        }
    };

    return (
        <div className="profile-section">
            <h2>My Profile</h2>

            <div className="profile-card">
                {/* Profile Photo */}
                <div className="profile-photo-section">
                    <div className="profile-photo-wrapper">
                        {user?.profilePhoto ? (
                            <img src={user.profilePhoto} alt="Profile" className="profile-photo" />
                        ) : (
                            <div className="profile-photo-placeholder">
                                <i className="fas fa-user"></i>
                            </div>
                        )}
                        <label className="photo-upload-btn">
                            <i className="fas fa-camera"></i>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                hidden
                            />
                        </label>
                    </div>
                    <h3>{user?.fullName || 'User'}</h3>
                    <p className="user-email">{user?.email}</p>
                </div>

                {/* Profile Form */}
                <form onSubmit={handleSubmit} className="profile-form">
                    <div className="form-group">
                        <label>Full Name</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="fullName"
                                value={formData.fullName}
                                onChange={handleChange}
                                required
                            />
                        ) : (
                            <p className="form-value">{user?.fullName || '-'}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Email</label>
                        <p className="form-value">{user?.email || '-'}</p>
                        <span className="verified-badge">
                            <i className="fas fa-check-circle"></i> Verified
                        </span>
                    </div>

                    <div className="form-group">
                        <label>Phone Number</label>
                        {isEditing ? (
                            <input
                                type="tel"
                                name="phoneNumber"
                                value={formData.phoneNumber}
                                onChange={handleChange}
                                pattern="[0-9]{10}"
                            />
                        ) : (
                            <p className="form-value">{user?.phoneNumber || '-'}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Address</label>
                        {isEditing ? (
                            <textarea
                                name="address"
                                value={formData.address}
                                onChange={handleChange}
                                rows={2}
                            />
                        ) : (
                            <p className="form-value">{user?.address || '-'}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label>City</label>
                        {isEditing ? (
                            <input
                                type="text"
                                name="city"
                                value={formData.city}
                                onChange={handleChange}
                            />
                        ) : (
                            <p className="form-value">{user?.city || '-'}</p>
                        )}
                    </div>

                    <div className="form-group">
                        <label>Member Since</label>
                        <p className="form-value">
                            {user?.createdAt 
                                ? new Date(user.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })
                                : '-'}
                        </p>
                    </div>

                    <div className="form-actions">
                        {isEditing ? (
                            <>
                                <button
                                    type="button"
                                    className="btn-secondary"
                                    onClick={() => setIsEditing(false)}
                                >
                                    Cancel
                                </button>
                                <button type="submit" className="btn-primary" disabled={loading}>
                                    {loading ? <ButtonLoader /> : 'Save Changes'}
                                </button>
                            </>
                        ) : (
                            <button
                                type="button"
                                className="btn-primary"
                                onClick={() => setIsEditing(true)}
                            >
                                <i className="fas fa-edit"></i> Edit Profile
                            </button>
                        )}
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ProfileSection;
