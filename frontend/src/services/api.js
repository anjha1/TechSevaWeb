/**
 * API Service
 * Centralized API client with interceptors
 */

import axios from 'axios';

const API_BASE_URL = '';

const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        // Add any auth headers if needed
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Handle unauthorized - redirect to login
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;

// Auth API
export const authAPI = {
    sendOTP: (email, type = 'signup') => api.post('/api/auth/send-otp', { email, type }),
    verifyOTP: (email, otp) => api.post('/api/auth/verify-otp', { email, otp }),
    register: (data) => api.post('/api/auth/register', data),
    login: (data) => api.post('/api/auth/login', data),
    googleLogin: (idToken) => api.post('/api/auth/google-login', { idToken }),
    resetPassword: (data) => api.post('/api/auth/reset-password', data),
    logout: () => api.post('/api/auth/logout')
};

// User API
export const userAPI = {
    getMe: () => api.get('/api/user/me'),
    updateProfile: (data) => api.put('/api/user/profile', data),
    uploadPhoto: (photoData) => api.post('/api/user/profile/photo', { photoData }),
    updatePhone: (phoneNumber) => api.put('/api/user/phone', { phoneNumber }),
    bookService: (data) => api.post('/api/user/book', data),
    getJobs: () => api.get('/api/user/jobs'),
    cancelJob: (jobId) => api.post('/api/user/jobs/cancel', { jobId }),
    submitReview: (data) => api.post('/api/user/jobs/review', data),
    getAnnouncements: () => api.get('/api/user/announcements'),
    createTicket: (data) => api.post('/api/user/tickets', data)
};

// Technician API
export const technicianAPI = {
    getJobs: () => api.get('/api/technician/jobs'),
    acceptJob: (jobId) => api.post('/api/technician/jobs/accept', { jobId }),
    startJob: (jobId) => api.post('/api/technician/jobs/start', { jobId }),
    completeJob: (formData) => api.post('/api/technician/jobs/complete', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    rejectJob: (jobId) => api.post('/api/technician/jobs/reject', { jobId }),
    submitDiagnosis: (formData) => api.post('/api/technician/jobs/diagnosis', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    updateAvailability: (data) => api.put('/api/technician/availability', data),
    updateLocation: (data) => api.put('/api/technician/location', data),
    updatePaymentDetails: (data) => api.put('/api/technician/payment-details', data),
    withdraw: (amount) => api.post('/api/technician/withdraw', { amount })
};

// Admin API
export const adminAPI = {
    getDashboard: () => api.get('/api/admin/dashboard'),
    getUsers: () => api.get('/api/admin/users'),
    updateUserStatus: (userId, status) => api.put(`/api/admin/users/${userId}/status`, { status }),
    resetUserPassword: (userId) => api.post(`/api/admin/users/${userId}/reset-password`),
    createAdmin: (data) => api.post('/api/admin/users/admin', data),
    approveKYC: (userId) => api.post(`/api/admin/kyc/approve/${userId}`),
    rejectKYC: (userId) => api.post(`/api/admin/kyc/reject/${userId}`),
    getJobs: () => api.get('/api/admin/jobs'),
    assignTechnician: (jobId, technicianId) => api.post('/api/admin/jobs/assign', { jobId, technicianId }),
    getApplianceTypes: () => api.get('/api/admin/appliances'),
    createApplianceType: (data) => api.post('/api/admin/appliances', data),
    updateApplianceType: (id, data) => api.put(`/api/admin/appliances/${id}`, data),
    deleteApplianceType: (id) => api.delete(`/api/admin/appliances/${id}`),
    getLocations: () => api.get('/api/admin/locations'),
    createLocation: (data) => api.post('/api/admin/locations', data),
    updateLocation: (id, data) => api.put(`/api/admin/locations/${id}`, data),
    deleteLocation: (id) => api.delete(`/api/admin/locations/${id}`),
    getTickets: () => api.get('/api/admin/tickets'),
    assignTicket: (ticketId, assignedTo) => api.put(`/api/admin/tickets/${ticketId}/assign`, { assignedTo }),
    resolveTicket: (ticketId) => api.put(`/api/admin/tickets/${ticketId}/resolve`),
    closeTicket: (ticketId) => api.put(`/api/admin/tickets/${ticketId}/close`),
    getTransactions: () => api.get('/api/admin/transactions'),
    getContactMessages: () => api.get('/api/admin/contact-messages'),
    deleteContactMessage: (id) => api.delete(`/api/admin/contact-messages/${id}`)
};
