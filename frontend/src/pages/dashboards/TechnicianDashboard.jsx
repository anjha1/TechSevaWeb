/**
 * TechnicianDashboard - Premium UI/UX Design
 * Matching UserDashboard Style with Framer Motion + Tailwind CSS
 * Includes Real-time Tracking like Zomato/Swiggy
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { technicianAPI, userAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { useTechnicianLocation } from '../../components/LiveTrackingMap';

// ============ CONSTANTS ============
const APP_COMMISSION_RATE = 0.10;
const TAX_RATE_INDIA = 0.18;

// ============ ANIMATION VARIANTS ============
const fadeIn = { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } };
const fadeInUp = { initial: { opacity: 0, y: 30 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: -20 } };
const fadeInDown = { initial: { opacity: 0, y: -30 }, animate: { opacity: 1, y: 0 } };
const scaleIn = { initial: { scale: 0.8, opacity: 0 }, animate: { scale: 1, opacity: 1 } };
const slideInLeft = { initial: { x: -300, opacity: 0 }, animate: { x: 0, opacity: 1 }, exit: { x: -300, opacity: 0 } };
const staggerChildren = { animate: { transition: { staggerChildren: 0.08 } } };

// ============ ICON COMPONENT ============
const Icon = ({ name, className = '' }) => <i className={`fas fa-${name} ${className}`} />;

// ============ TOAST NOTIFICATION ============
const Toast = ({ message, type, onClose }) => (
    <motion.div
        initial={{ opacity: 0, y: -60, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -60, scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-[999] px-5 py-3 rounded-2xl shadow-2xl backdrop-blur-xl flex items-center gap-3 ${
            type === 'success' ? 'bg-emerald-500/95 text-white' :
            type === 'error' ? 'bg-red-500/95 text-white' :
            type === 'warning' ? 'bg-amber-500/95 text-white' :
            'bg-blue-500/95 text-white'
        }`}
    >
        <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
            <Icon name={type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} className="text-xl" />
        </motion.div>
        <span className="font-medium text-sm">{message}</span>
        <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={onClose} className="ml-2 hover:bg-white/20 rounded-full p-1">
            <Icon name="times" />
        </motion.button>
    </motion.div>
);

// ============ STATUS BADGE ============
const StatusBadge = ({ status }) => {
    const styles = {
        'Pending': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
        'Accepted': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
        'In Progress': 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
        'Diagnosed': 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
        'Completed': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'Paid': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
        'Cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${styles[status] || 'bg-slate-100 text-slate-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${status === 'Pending' ? 'bg-amber-500 animate-pulse' : status === 'Completed' || status === 'Paid' ? 'bg-emerald-500' : 'bg-current'}`}></span>
            {status}
        </span>
    );
};

// ============ APPLIANCE ICON ============
const ApplianceIcon = ({ type, size = 'w-12 h-12' }) => {
    const getIcon = () => {
        const t = (type || '').toLowerCase();
        if (t.includes('ac') || t.includes('air')) return { icon: 'snowflake', gradient: 'from-cyan-400 to-blue-500' };
        if (t.includes('fridge') || t.includes('refrigerator')) return { icon: 'temperature-low', gradient: 'from-blue-400 to-indigo-500' };
        if (t.includes('washing') || t.includes('washer')) return { icon: 'soap', gradient: 'from-violet-400 to-purple-500' };
        if (t.includes('tv') || t.includes('television')) return { icon: 'tv', gradient: 'from-slate-500 to-slate-700' };
        if (t.includes('microwave')) return { icon: 'broadcast-tower', gradient: 'from-orange-400 to-red-500' };
        if (t.includes('fan')) return { icon: 'fan', gradient: 'from-teal-400 to-cyan-500' };
        if (t.includes('geyser') || t.includes('heater')) return { icon: 'fire', gradient: 'from-amber-400 to-orange-500' };
        return { icon: 'tools', gradient: 'from-blue-400 to-indigo-500' };
    };
    const { icon, gradient } = getIcon();
    return (
        <motion.div whileHover={{ scale: 1.1, rotate: 5 }} className={`${size} rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center text-white shadow-lg`}>
            <Icon name={icon} className="text-xl" />
        </motion.div>
    );
};

// ============ JOB CARD COMPONENT ============
const JobCard = ({ job, onAccept, onReject, onDiagnose, onComplete, onViewProof, currentUserId }) => {
    const [expanded, setExpanded] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [previews, setPreviews] = useState([]);
    const fileInputRef = useRef(null);

    const isMyJob = job.assignedTechnicianId?.toString() === currentUserId;
    const isPending = job.status === 'Pending';
    const canAccept = isPending && !job.assignedTechnicianId;
    const canDiagnose = ['Accepted', 'In Progress'].includes(job.status) && isMyJob;
    const canComplete = job.status === 'Diagnosed' && isMyJob;
    const hasProof = job.proofImages?.length > 0;

    const constructAddress = (loc) => {
        if (!loc) return 'N/A';
        if (typeof loc === 'string') return loc;
        return [loc.houseBuilding, loc.street, loc.city, loc.state, loc.pincode].filter(Boolean).join(', ');
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        setSelectedFiles(files);
        setPreviews(files.map(f => URL.createObjectURL(f)));
    };

    const handleComplete = () => {
        if (selectedFiles.length === 0) {
            alert('Please upload proof photo(s)');
            return;
        }
        onComplete(job.jobId, selectedFiles);
    };

    return (
        <motion.div
            variants={fadeInUp}
            layout
            className="bg-white dark:bg-slate-800 rounded-3xl shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
        >
            {/* Header with colored left border */}
            <div className={`relative pl-1 ${isPending ? 'bg-amber-500' : canDiagnose ? 'bg-blue-500' : canComplete ? 'bg-purple-500' : 'bg-emerald-500'}`}>
                <div className="bg-white dark:bg-slate-800 p-4">
                    <div className="flex items-start gap-4">
                        <ApplianceIcon type={job.applianceType} />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg leading-tight">
                                        {job.applianceType}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                        ID: {job.jobId}
                                    </p>
                                </div>
                                <StatusBadge status={job.status} />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="p-4 pt-2 space-y-3">
                {/* Customer & Schedule Info */}
                <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white">
                            <Icon name="user" className="text-sm" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Customer</p>
                            <p className="font-semibold text-slate-800 dark:text-white text-sm truncate">{job.customerName}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2.5 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center text-white">
                            <Icon name="calendar-alt" className="text-sm" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Scheduled</p>
                            <p className="font-semibold text-slate-800 dark:text-white text-sm">
                                {new Date(job.scheduledDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Location with Call Button */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white flex-shrink-0">
                        <Icon name="map-marker-alt" className="text-sm" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">Location</p>
                        <p className="font-medium text-slate-700 dark:text-slate-300 text-sm truncate">{constructAddress(job.location)}</p>
                    </div>
                    {job.customerPhoneNumber && (
                        <motion.a
                            href={`tel:${job.customerPhoneNumber}`}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white shadow-lg shadow-emerald-500/30"
                        >
                            <Icon name="phone" />
                        </motion.a>
                    )}
                </div>

                {/* Expandable Quotation */}
                {job.quotation && (
                    <motion.div layout>
                        <button
                            onClick={() => setExpanded(!expanded)}
                            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl"
                        >
                            <div className="flex items-center gap-2">
                                <Icon name="file-invoice-dollar" className="text-indigo-500" />
                                <span className="font-semibold text-slate-700 dark:text-slate-300 text-sm">Quotation</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-indigo-600 dark:text-indigo-400">₹{job.quotation.totalEstimate?.toFixed(0)}</span>
                                <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
                                    <Icon name="chevron-down" className="text-slate-400" />
                                </motion.div>
                            </div>
                        </button>
                        <AnimatePresence>
                            {expanded && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                >
                                    <div className="p-3 bg-slate-50 dark:bg-slate-700/30 rounded-b-xl space-y-2 text-sm">
                                        <div className="flex justify-between"><span className="text-slate-500">Parts</span><span className="font-medium">₹{job.quotation.partCost || 0}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Labor</span><span className="font-medium">₹{job.quotation.laborCost || 0}</span></div>
                                        <div className="flex justify-between"><span className="text-slate-500">Travel</span><span className="font-medium">₹{job.quotation.travelCharges || 0}</span></div>
                                        <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                                            <span className="font-semibold">Total</span>
                                            <span className="font-bold text-indigo-600">₹{job.quotation.totalEstimate}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Payment Status */}
                <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <span className="text-sm text-slate-500">Payment Status</span>
                    <span className={`font-bold text-sm ${job.payment?.status === 'Paid' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {job.payment?.status || 'Pending'}
                    </span>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2 pt-2">
                    {canAccept && (
                        <div className="grid grid-cols-2 gap-2">
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onAccept(job.jobId)}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30"
                            >
                                <Icon name="check" /> Accept
                            </motion.button>
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onReject(job.jobId)}
                                className="flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-red-500/30"
                            >
                                <Icon name="times" /> Reject
                            </motion.button>
                        </div>
                    )}

                    {canDiagnose && (
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onDiagnose(job.jobId)}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-amber-500/30"
                        >
                            <Icon name="stethoscope" /> Diagnose & Quote
                        </motion.button>
                    )}

                    {canComplete && (
                        <div className="space-y-2">
                            {job.payment?.status === 'Paid' ? (
                                <>
                                    <div className="border-2 border-dashed border-emerald-300 dark:border-emerald-700 rounded-xl p-3 bg-emerald-50 dark:bg-emerald-900/20">
                                        <label className="block text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">
                                            <Icon name="camera" className="mr-2" />Upload Proof Photo(s)
                                        </label>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileChange}
                                            className="w-full text-sm file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:font-semibold file:bg-emerald-100 file:text-emerald-700 hover:file:bg-emerald-200"
                                        />
                                        {previews.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {previews.map((p, i) => (
                                                    <img key={i} src={p} alt="" className="w-14 h-14 object-cover rounded-lg border-2 border-emerald-300" />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <motion.button
                                        whileHover={{ scale: 1.02, y: -2 }}
                                        whileTap={{ scale: 0.98 }}
                                        onClick={handleComplete}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-emerald-500/30"
                                    >
                                        <Icon name="check-double" /> Mark as Complete
                                    </motion.button>
                                </>
                            ) : (
                                <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
                                    <Icon name="clock" className="text-amber-500 text-2xl mb-2" />
                                    <p className="text-sm text-amber-700 dark:text-amber-400 font-medium">(Waiting for customer payment)</p>
                                </div>
                            )}
                        </div>
                    )}

                    {hasProof && (
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onViewProof(job)}
                            className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-500/30"
                        >
                            <Icon name="file-pdf" /> View Proof PDF
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// ============ MAIN DASHBOARD COMPONENT ============
const TechnicianDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    // State
    const [activeTab, setActiveTab] = useState('dashboard');
    const [jobTab, setJobTab] = useState('new');
    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') === 'enabled');
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);

    // Online Status & Tracking
    const [isOnline, setIsOnline] = useState(() => localStorage.getItem('technicianOnline') === 'true');
    const [activeJob, setActiveJob] = useState(null);
    const [journeyStarted, setJourneyStarted] = useState(false);
    
    // Use location tracking hook
    const { location: currentLocation } = useTechnicianLocation(isOnline);

    // Data
    const [currentUser, setCurrentUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [notifications, setNotifications] = useState([]);

    // Settings Forms
    const [availabilityForm, setAvailabilityForm] = useState({ availableDays: [], startTime: '09:00', endTime: '18:00', emergencyCalls: false });
    const [locationForm, setLocationForm] = useState({ pincode: '', city: '', state: '', street: '', radiusKm: 10, latitude: '', longitude: '' });
    const [paymentForm, setPaymentForm] = useState({ bankName: '', accountNumber: '', ifscCode: '', upiId: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Helpers
    const showMessage = useCallback((text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    }, []);

    // Dark Mode
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('darkMode', darkMode ? 'enabled' : 'disabled');
    }, [darkMode]);

    // Online Status Effect
    useEffect(() => {
        localStorage.setItem('technicianOnline', isOnline.toString());
        if (isOnline) {
            // Update online status on server
            api.post('/api/tracking/technician/online-status', { isOnline: true })
                .catch(console.error);
        } else {
            api.post('/api/tracking/technician/online-status', { isOnline: false })
                .catch(console.error);
        }
    }, [isOnline]);

    // Fetch active job for tracking
    const fetchActiveJob = async () => {
        try {
            const res = await api.get('/api/tracking/technician/active-job');
            if (res.data?.success && res.data.activeJob) {
                setActiveJob(res.data.activeJob);
                setJourneyStarted(res.data.activeJob.technicianJourneyStarted || false);
            }
        } catch (e) { console.error(e); }
    };

    // Fetch Data
    useEffect(() => {
        Promise.all([fetchCurrentUser(), fetchJobs(), fetchActiveJob()]).finally(() => setLoading(false));
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const res = await userAPI.getMe();
            if (res.data?.success) {
                const u = res.data.user;
                setCurrentUser(u);
                if (u.availability) setAvailabilityForm(u.availability);
                if (u.workingLocation) setLocationForm(u.workingLocation);
                if (u.bankDetails) setPaymentForm(u.bankDetails);
            }
        } catch (e) { console.error(e); }
    };

    const fetchJobs = async () => {
        try {
            const res = await technicianAPI.getJobs();
            if (res.data?.success) setJobs(res.data.jobs || []);
        } catch (e) { console.error(e); }
    };

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/api/technician/announcements');
            if (res.data?.success) setNotifications(res.data.announcements || []);
        } catch (e) { console.error(e); }
    };

    // Job Actions
    const handleAcceptJob = async (jobId) => {
        try {
            const res = await technicianAPI.acceptJob(jobId);
            if (res.data?.success) {
                showMessage('Job accepted! 🎉');
                fetchJobs();
            }
        } catch (e) { showMessage(e.response?.data?.message || 'Failed', 'error'); }
    };

    const handleRejectJob = async (jobId) => {
        if (!window.confirm('Reject this job?')) return;
        try {
            const res = await technicianAPI.rejectJob(jobId);
            if (res.data?.success) {
                showMessage('Job rejected');
                fetchJobs();
            }
        } catch (e) { showMessage(e.response?.data?.message || 'Failed', 'error'); }
    };

    const handleDiagnose = (jobId) => navigate(`/diagnosis?jobId=${jobId}`);

    // Journey Tracking Handlers
    const handleStartJourney = async (jobId) => {
        try {
            setIsSubmitting(true);
            const res = await api.post('/api/tracking/technician/start-journey', { jobId });
            if (res.data?.success) {
                setJourneyStarted(true);
                showMessage('Journey started! 🚗 Customer can now track you.');
                fetchActiveJob();
            }
        } catch (e) { showMessage(e.response?.data?.message || 'Failed to start journey', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleMarkArrived = async (jobId) => {
        try {
            setIsSubmitting(true);
            const res = await api.post('/api/tracking/technician/arrived', { jobId });
            if (res.data?.success) {
                showMessage('Marked as arrived! 📍');
                fetchJobs();
                fetchActiveJob();
            }
        } catch (e) { showMessage(e.response?.data?.message || 'Failed', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleToggleOnline = () => {
        if (!isOnline) {
            // Going online - check if location permission exists
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(
                    () => {
                        setIsOnline(true);
                        showMessage('You are now Online! 🟢');
                    },
                    () => {
                        showMessage('Location permission required to go online', 'error');
                    }
                );
            }
        } else {
            setIsOnline(false);
            showMessage('You are now Offline 🔴', 'warning');
        }
    };

    const handleCompleteJob = async (jobId, files) => {
        try {
            setIsSubmitting(true);
            const base64Images = await Promise.all(files.map(f => new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(f);
            })));
            const res = await api.post('/api/technician/jobs/complete', { jobId, proofImages: base64Images });
            if (res.data?.success) {
                showMessage('Job completed! 💰');
                fetchJobs();
            }
        } catch (e) { showMessage(e.response?.data?.message || 'Failed', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleViewProof = (job) => {
        const images = job.proofImages || [];
        if (!images.length) return;
        const html = `<!DOCTYPE html><html><head><title>Proof - ${job.jobId}</title><style>body{font-family:system-ui;padding:30px;background:#f8fafc;}h1{color:#1e293b;}.img-box{background:white;padding:20px;border-radius:16px;margin:20px 0;box-shadow:0 4px 20px rgba(0,0,0,0.1);}img{max-width:100%;border-radius:12px;}</style></head><body><h1>🔧 TechSeva Proof</h1><p><strong>Job:</strong> ${job.jobId} | <strong>Appliance:</strong> ${job.applianceType}</p>${images.map((url, i) => `<div class="img-box"><p>Image ${i + 1}</p><img src="${url}" /></div>`).join('')}<script>setTimeout(()=>window.print(),500)</script></body></html>`;
        const win = window.open('', '_blank');
        win.document.write(html);
        win.document.close();
    };

    // Settings Handlers
    const handleGetLocation = () => {
        if (!navigator.geolocation) return showMessage('Geolocation not supported', 'error');
        showMessage('Getting location...', 'info');
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setLocationForm(p => ({ ...p, latitude, longitude }));
                try {
                    const res = await api.post('/api/reverse-geocode', { latitude, longitude });
                    if (res.data?.success) {
                        const a = res.data.structuredAddress;
                        setLocationForm(p => ({ ...p, pincode: a.pincode || '', city: a.city || '', state: a.state || '' }));
                        showMessage('Location fetched! 📍');
                    }
                } catch { showMessage('Coordinates saved', 'info'); }
            },
            () => showMessage('Location denied', 'error'),
            { enableHighAccuracy: true }
        );
    };

    const handleUpdateAvailability = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await api.post('/api/technician/update-availability', availabilityForm);
            if (res.data?.success) showMessage('Availability updated! ✅');
        } catch (e) { showMessage(e.response?.data?.message || 'Failed', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleUpdateLocation = async (e) => {
        e.preventDefault();
        if (!locationForm.pincode || !locationForm.city) return showMessage('Fill required fields', 'error');
        setIsSubmitting(true);
        try {
            const res = await api.post('/api/technician/update-location', { workingLocation: locationForm });
            if (res.data?.success) showMessage('Location updated! 📍');
        } catch (e) { showMessage(e.response?.data?.message || 'Failed', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleUpdatePayment = async (e) => {
        e.preventDefault();
        if (!paymentForm.accountNumber && !paymentForm.upiId) return showMessage('Add payment method', 'error');
        setIsSubmitting(true);
        try {
            const res = await api.post('/api/technician/update-payment-details', paymentForm);
            if (res.data?.success) showMessage('Payment updated! 💳');
        } catch (e) { showMessage(e.response?.data?.message || 'Failed', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleWithdraw = async () => {
        if ((currentUser?.balance || 0) <= 0) return showMessage('No balance', 'info');
        setIsSubmitting(true);
        try {
            const res = await technicianAPI.withdraw(currentUser.balance);
            if (res.data?.success) {
                showMessage('Withdrawal initiated! 💸');
                fetchCurrentUser();
            }
        } catch (e) { showMessage(e.response?.data?.message || 'Failed', 'error'); }
        finally { setIsSubmitting(false); }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/');
        } catch { showMessage('Logout failed', 'error'); }
    };

    // Computed
    const totalJobs = jobs.filter(j => j.assignedTechnicianId?.toString() === currentUser?._id).length;
    const activeJobs = jobs.filter(j => ['Accepted', 'In Progress', 'Diagnosed'].includes(j.status) && j.assignedTechnicianId?.toString() === currentUser?._id).length;
    const completedJobs = jobs.filter(j => ['Completed', 'Paid'].includes(j.status) && j.assignedTechnicianId?.toString() === currentUser?._id).length;
    const pendingJobs = jobs.filter(j => j.status === 'Pending' && !j.assignedTechnicianId).length;

    const newJobs = jobs.filter(j => j.status === 'Pending' && !j.assignedTechnicianId);
    const myJobs = jobs.filter(j => j.assignedTechnicianId?.toString() === currentUser?._id);

    const calculateEarnings = (period) => {
        const paid = jobs.filter(j => j.payment?.status === 'Paid' && j.assignedTechnicianId?.toString() === currentUser?._id);
        const today = new Date();
        return paid.filter(j => {
            const d = j.payment?.paidAt ? new Date(j.payment.paidAt) : null;
            if (!d) return false;
            if (period === 'daily') return d.toDateString() === today.toDateString();
            if (period === 'weekly') { const ws = new Date(today); ws.setDate(today.getDate() - today.getDay()); return d >= ws; }
            if (period === 'monthly') return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
            return true;
        }).reduce((sum, j) => {
            const gross = j.quotation?.totalEstimate || 0;
            const net = gross * (1 - APP_COMMISSION_RATE) * (1 - TAX_RATE_INDIA);
            return sum + net;
        }, 0);
    };

    const profilePic = currentUser?.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'T')}&background=3b82f6&color=fff&bold=true`;
    const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    // Loading
    if (loading) return (
        <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 pb-24 ${darkMode ? 'dark' : ''}`}>
            {/* Toast */}
            <AnimatePresence>{message && <Toast message={message.text} type={message.type} onClose={() => setMessage(null)} />}</AnimatePresence>

            {/* Header */}
            <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between px-4 h-16">
                    <motion.button whileTap={{ scale: 0.9 }} onClick={() => setSideMenuOpen(true)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800">
                        <Icon name="bars" className="text-slate-600 dark:text-slate-300" />
                    </motion.button>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">TechSeva</h1>
                    
                    {/* Online/Offline Toggle */}
                    <div className="flex items-center gap-3">
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={handleToggleOnline}
                            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                                isOnline 
                                    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400' 
                                    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                            }`}
                        >
                            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                            {isOnline ? 'Online' : 'Offline'}
                        </motion.button>
                        <motion.img whileTap={{ scale: 0.9 }} src={profilePic} alt="" className="w-10 h-10 rounded-xl object-cover border-2 border-blue-400 cursor-pointer" onClick={() => setActiveTab('settings')} />
                    </div>
                </div>
            </header>

            {/* Side Menu */}
            <AnimatePresence>
                {sideMenuOpen && (
                    <>
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSideMenuOpen(false)} className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" />
                        <motion.nav variants={slideInLeft} initial="initial" animate="animate" exit="exit" className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col">
                            <div className="p-6 bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                                <motion.img initial={{ scale: 0 }} animate={{ scale: 1 }} src={profilePic} alt="" className="w-20 h-20 mx-auto mb-3 rounded-2xl object-cover border-4 border-white/30" />
                                <h3 className="text-center font-bold text-lg">{currentUser?.fullName || 'Technician'}</h3>
                                <p className="text-center text-white/70 text-sm">{currentUser?.email}</p>
                            </div>
                            <div className="flex-1 p-4 space-y-1">
                                {[
                                    { id: 'dashboard', icon: 'home', label: 'Dashboard' },
                                    { id: 'jobs', icon: 'wrench', label: 'Jobs', badge: pendingJobs },
                                    { id: 'earnings', icon: 'wallet', label: 'Earnings' },
                                    { id: 'settings', icon: 'cog', label: 'Settings' },
                                ].map(item => (
                                    <motion.button key={item.id} whileHover={{ x: 5 }} onClick={() => { setActiveTab(item.id); setSideMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 font-semibold' : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                        <Icon name={item.icon} className="w-5" />
                                        <span>{item.label}</span>
                                        {item.badge > 0 && <span className="ml-auto w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{item.badge}</span>}
                                    </motion.button>
                                ))}
                                <div className="flex items-center justify-between px-4 py-3">
                                    <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2"><Icon name="moon" /> Dark Mode</span>
                                    <button onClick={() => setDarkMode(!darkMode)} className={`relative w-11 h-6 rounded-full transition-colors ${darkMode ? 'bg-blue-500' : 'bg-slate-300'}`}>
                                        <motion.div animate={{ x: darkMode ? 22 : 2 }} className="absolute top-1 w-4 h-4 bg-white rounded-full shadow" />
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                                <motion.button whileTap={{ scale: 0.98 }} onClick={handleLogout} className="w-full py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold">
                                    <Icon name="sign-out-alt" className="mr-2" /> Logout
                                </motion.button>
                            </div>
                        </motion.nav>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="px-4 pt-4 max-w-2xl mx-auto">
                <AnimatePresence mode="wait">
                    {/* DASHBOARD TAB */}
                    {activeTab === 'dashboard' && (
                        <motion.div key="dashboard" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-5">
                            {/* Welcome Card - Matching UserDashboard */}
                            <motion.div variants={scaleIn} className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 rounded-3xl p-6 text-white shadow-2xl shadow-blue-500/30">
                                <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
                                <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center justify-between mb-2">
                                        <div>
                                            <p className="text-blue-100 text-sm">Welcome back,</p>
                                            <h2 className="text-2xl font-bold">{currentUser?.fullName || 'Technician'} 👋</h2>
                                        </div>
                                        <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${isOnline ? 'bg-emerald-500/20 text-emerald-200' : 'bg-red-500/20 text-red-200'}`}>
                                            <span className={`w-2 h-2 inline-block rounded-full mr-1.5 ${isOnline ? 'bg-emerald-400 animate-pulse' : 'bg-red-400'}`}></span>
                                            {isOnline ? 'Online' : 'Offline'}
                                        </div>
                                    </div>
                                    <p className="text-blue-100 text-sm mb-5">Ready to serve your customers?</p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <motion.div whileHover={{ scale: 1.02 }} className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                                            <p className="text-3xl font-bold">{totalJobs}</p>
                                            <p className="text-sm text-blue-100">Total Jobs</p>
                                        </motion.div>
                                        <motion.div whileHover={{ scale: 1.02 }} className="bg-white/20 backdrop-blur rounded-2xl p-4 text-center">
                                            <p className="text-3xl font-bold">{activeJobs}</p>
                                            <p className="text-sm text-blue-100">Active</p>
                                        </motion.div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Active Job Tracking Card */}
                            {activeJob && (
                                <motion.div variants={fadeInUp} className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl p-5 text-white shadow-lg overflow-hidden relative">
                                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                                                <Icon name="route" className="text-xl" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg">Active Job</h3>
                                                <p className="text-emerald-100 text-sm">{activeJob.applianceType}</p>
                                            </div>
                                        </div>
                                        
                                        {/* Customer Info */}
                                        <div className="bg-white/10 rounded-xl p-3 mb-4">
                                            <p className="text-sm text-emerald-100">Customer</p>
                                            <p className="font-semibold">{activeJob.customerName}</p>
                                            <p className="text-sm text-emerald-200 truncate">{typeof activeJob.location === 'object' ? `${activeJob.location.houseBuilding || ''}, ${activeJob.location.city || ''}` : activeJob.location}</p>
                                        </div>

                                        {/* Action Buttons */}
                                        <div className="flex gap-3">
                                            {!journeyStarted ? (
                                                <motion.button
                                                    whileHover={{ scale: 1.02 }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => handleStartJourney(activeJob.jobId)}
                                                    disabled={isSubmitting}
                                                    className="flex-1 py-3 bg-white text-emerald-600 rounded-xl font-semibold flex items-center justify-center gap-2"
                                                >
                                                    <Icon name="play" /> Start Journey
                                                </motion.button>
                                            ) : (
                                                <>
                                                    <motion.button
                                                        whileHover={{ scale: 1.02 }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => handleMarkArrived(activeJob.jobId)}
                                                        disabled={isSubmitting}
                                                        className="flex-1 py-3 bg-white text-emerald-600 rounded-xl font-semibold flex items-center justify-center gap-2"
                                                    >
                                                        <Icon name="map-pin" /> Mark Arrived
                                                    </motion.button>
                                                    {activeJob.customerPhoneNumber && (
                                                        <motion.a
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            href={`tel:${activeJob.customerPhoneNumber}`}
                                                            className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center"
                                                        >
                                                            <Icon name="phone" />
                                                        </motion.a>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        
                                        {journeyStarted && (
                                            <p className="text-center text-emerald-200 text-xs mt-3">
                                                <Icon name="broadcast-tower" className="mr-1" /> Live location is being shared
                                            </p>
                                        )}
                                    </div>
                                </motion.div>
                            )}

                            {/* Quick Stats */}
                            <motion.div variants={staggerChildren} initial="initial" animate="animate" className="grid grid-cols-2 gap-3">
                                <motion.div variants={fadeInUp} whileHover={{ y: -3 }} onClick={() => { setActiveTab('jobs'); setJobTab('new'); }} className="cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white">
                                            <Icon name="inbox" className="text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">{pendingJobs}</p>
                                            <p className="text-xs text-slate-500">New Requests</p>
                                        </div>
                                    </div>
                                </motion.div>
                                <motion.div variants={fadeInUp} whileHover={{ y: -3 }} onClick={() => setActiveTab('earnings')} className="cursor-pointer bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg shadow-slate-200/50 dark:shadow-slate-900/50 border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center text-white">
                                            <Icon name="rupee-sign" className="text-xl" />
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-slate-900 dark:text-white">₹{calculateEarnings('daily').toFixed(0)}</p>
                                            <p className="text-xs text-slate-500">Today's Earnings</p>
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Recent Jobs Preview */}
                            {myJobs.slice(0, 2).length > 0 && (
                                <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-lg border border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="font-bold text-slate-900 dark:text-white">Recent Jobs</h3>
                                        <button onClick={() => setActiveTab('jobs')} className="text-sm text-blue-600 font-medium">View All →</button>
                                    </div>
                                    <div className="space-y-3">
                                        {myJobs.slice(0, 2).map(job => (
                                            <div key={job._id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                                <ApplianceIcon type={job.applianceType} size="w-10 h-10" />
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-medium text-slate-900 dark:text-white text-sm truncate">{job.applianceType}</p>
                                                    <p className="text-xs text-slate-500 truncate">{job.customerName}</p>
                                                </div>
                                                <StatusBadge status={job.status} />
                                            </div>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}

                    {/* JOBS TAB */}
                    {activeTab === 'jobs' && (
                        <motion.div key="jobs" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-4">
                            {/* Tab Switcher */}
                            <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                                <button onClick={() => setJobTab('new')} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${jobTab === 'new' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-500'}`}>
                                    New Jobs {pendingJobs > 0 && <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">{pendingJobs}</span>}
                                </button>
                                <button onClick={() => setJobTab('history')} className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${jobTab === 'history' ? 'bg-white dark:bg-slate-700 text-blue-600 shadow-md' : 'text-slate-500'}`}>
                                    Job History
                                </button>
                            </div>

                            {/* Job List */}
                            <motion.div variants={staggerChildren} initial="initial" animate="animate" className="space-y-4">
                                {(jobTab === 'new' ? newJobs : myJobs).length === 0 ? (
                                    <motion.div variants={scaleIn} className="text-center py-16">
                                        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Icon name="inbox" className="text-3xl text-slate-400" />
                                        </div>
                                        <p className="text-slate-500">No jobs found</p>
                                    </motion.div>
                                ) : (
                                    (jobTab === 'new' ? newJobs : myJobs).map(job => (
                                        <JobCard
                                            key={job._id}
                                            job={job}
                                            currentUserId={currentUser?._id}
                                            onAccept={handleAcceptJob}
                                            onReject={handleRejectJob}
                                            onDiagnose={handleDiagnose}
                                            onComplete={handleCompleteJob}
                                            onViewProof={handleViewProof}
                                        />
                                    ))
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* EARNINGS TAB */}
                    {activeTab === 'earnings' && (
                        <motion.div key="earnings" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-5">
                            {/* Balance Card */}
                            <motion.div variants={scaleIn} className="bg-gradient-to-br from-emerald-500 to-green-600 rounded-3xl p-6 text-white shadow-2xl shadow-emerald-500/30">
                                <p className="text-emerald-100 text-sm text-center">Available Balance</p>
                                <p className="text-4xl font-bold text-center my-2">₹{(currentUser?.balance || 0).toFixed(2)}</p>
                                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={handleWithdraw} disabled={isSubmitting} className="w-full mt-4 py-3 bg-white/20 hover:bg-white/30 rounded-xl font-semibold transition-colors disabled:opacity-50">
                                    {isSubmitting ? 'Processing...' : 'Withdraw Now'}
                                </motion.button>
                            </motion.div>

                            {/* Earnings Grid */}
                            <div className="grid grid-cols-3 gap-3">
                                {[
                                    { label: 'Today', value: calculateEarnings('daily'), color: 'blue' },
                                    { label: 'This Week', value: calculateEarnings('weekly'), color: 'purple' },
                                    { label: 'This Month', value: calculateEarnings('monthly'), color: 'emerald' },
                                ].map((item, i) => (
                                    <motion.div key={i} variants={fadeInUp} className="bg-white dark:bg-slate-800 rounded-2xl p-4 text-center shadow-lg border border-slate-100 dark:border-slate-700">
                                        <p className="text-xl font-bold text-slate-900 dark:text-white">₹{item.value.toFixed(0)}</p>
                                        <p className="text-xs text-slate-500">{item.label}</p>
                                    </motion.div>
                                ))}
                            </div>

                            {/* Stats */}
                            <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Performance</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2"><Icon name="check-double" className="text-emerald-500" /> Completed</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{completedJobs}</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                                        <span className="text-slate-600 dark:text-slate-300 flex items-center gap-2"><Icon name="star" className="text-amber-500" /> Rating</span>
                                        <span className="font-bold text-slate-900 dark:text-white">{(currentUser?.averageRating || 0).toFixed(1)} ★</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {/* SETTINGS TAB */}
                    {activeTab === 'settings' && (
                        <motion.div key="settings" variants={fadeIn} initial="initial" animate="animate" exit="exit" className="space-y-5">
                            {/* Profile Card */}
                            <motion.div variants={scaleIn} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700 flex items-center gap-4">
                                <img src={profilePic} alt="" className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-200" />
                                <div>
                                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{currentUser?.fullName}</h3>
                                    <p className="text-sm text-slate-500">{currentUser?.email}</p>
                                </div>
                            </motion.div>

                            {/* Availability */}
                            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Icon name="clock" className="text-blue-500" /> Availability</h3>
                                <form onSubmit={handleUpdateAvailability} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Available Days</label>
                                        <div className="flex flex-wrap gap-2">
                                            {daysOfWeek.map(day => (
                                                <button key={day} type="button" onClick={() => setAvailabilityForm(p => ({ ...p, availableDays: p.availableDays.includes(day) ? p.availableDays.filter(d => d !== day) : [...p.availableDays, day] }))} className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${availabilityForm.availableDays.includes(day) ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                                    {day}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Start</label>
                                            <input type="time" value={availabilityForm.startTime} onChange={e => setAvailabilityForm(p => ({ ...p, startTime: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                        </div>
                                        <div>
                                            <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">End</label>
                                            <input type="time" value={availabilityForm.endTime} onChange={e => setAvailabilityForm(p => ({ ...p, endTime: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                        </div>
                                    </div>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold shadow-lg shadow-blue-500/30 disabled:opacity-50">
                                        {isSubmitting ? 'Saving...' : 'Update Availability'}
                                    </motion.button>
                                </form>
                            </motion.div>

                            {/* Location */}
                            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Icon name="map-marker-alt" className="text-emerald-500" /> Working Location</h3>
                                <form onSubmit={handleUpdateLocation} className="space-y-3">
                                    <motion.button whileTap={{ scale: 0.98 }} type="button" onClick={handleGetLocation} className="w-full py-3 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl font-medium">
                                        <Icon name="crosshairs" className="mr-2" /> Use My Location
                                    </motion.button>
                                    <div className="grid grid-cols-2 gap-3">
                                        <input type="text" placeholder="Pincode *" value={locationForm.pincode} onChange={e => setLocationForm(p => ({ ...p, pincode: e.target.value }))} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                        <input type="text" placeholder="City *" value={locationForm.city} onChange={e => setLocationForm(p => ({ ...p, city: e.target.value }))} className="px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                    </div>
                                    <input type="text" placeholder="State" value={locationForm.state} onChange={e => setLocationForm(p => ({ ...p, state: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                    <div>
                                        <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Service Radius: {locationForm.radiusKm} km</label>
                                        <input type="range" min="5" max="50" value={locationForm.radiusKm} onChange={e => setLocationForm(p => ({ ...p, radiusKm: +e.target.value }))} className="w-full" />
                                    </div>
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30 disabled:opacity-50">
                                        {isSubmitting ? 'Saving...' : 'Update Location'}
                                    </motion.button>
                                </form>
                            </motion.div>

                            {/* Payment */}
                            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Icon name="credit-card" className="text-purple-500" /> Payment Details</h3>
                                <form onSubmit={handleUpdatePayment} className="space-y-3">
                                    <input type="text" placeholder="Bank Name" value={paymentForm.bankName} onChange={e => setPaymentForm(p => ({ ...p, bankName: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                    <input type="text" placeholder="Account Number" value={paymentForm.accountNumber} onChange={e => setPaymentForm(p => ({ ...p, accountNumber: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                    <input type="text" placeholder="IFSC Code" value={paymentForm.ifscCode} onChange={e => setPaymentForm(p => ({ ...p, ifscCode: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                    <div className="flex items-center gap-3"><div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" /><span className="text-sm text-slate-400">OR</span><div className="flex-1 h-px bg-slate-200 dark:bg-slate-600" /></div>
                                    <input type="text" placeholder="UPI ID (e.g., name@upi)" value={paymentForm.upiId} onChange={e => setPaymentForm(p => ({ ...p, upiId: e.target.value }))} className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white" />
                                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isSubmitting} className="w-full py-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50">
                                        {isSubmitting ? 'Saving...' : 'Update Payment Details'}
                                    </motion.button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Tab Bar - Matching UserDashboard Style */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 px-4 py-2 safe-area-pb">
                <div className="flex justify-around max-w-md mx-auto">
                    {[
                        { id: 'dashboard', icon: 'home', label: 'Dashboard' },
                        { id: 'jobs', icon: 'wrench', label: 'Jobs', badge: pendingJobs },
                        { id: 'earnings', icon: 'rupee-sign', label: 'Earnings' },
                        { id: 'settings', icon: 'user-cog', label: 'Settings' },
                    ].map(tab => (
                        <motion.button
                            key={tab.id}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex flex-col items-center justify-center py-2 px-4 rounded-xl transition-all ${activeTab === tab.id ? 'text-blue-600 bg-blue-50 dark:bg-blue-900/30' : 'text-slate-400'}`}
                        >
                            {tab.badge > 0 && <span className="absolute -top-1 right-2 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold">{tab.badge}</span>}
                            <Icon name={tab.icon} className="text-xl mb-1" />
                            <span className="text-xs font-medium">{tab.label}</span>
                        </motion.button>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default TechnicianDashboard;
