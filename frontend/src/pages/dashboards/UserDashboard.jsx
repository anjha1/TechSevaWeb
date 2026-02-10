/**
 * User Dashboard - Modern UI/UX
 * Built with Tailwind CSS + Framer Motion
 * Fully responsive, interactive, and animated
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api, { userAPI, adminAPI } from '../../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import LiveTrackingMap, { useJobTracking } from '../../components/LiveTrackingMap';

// Animation variants
const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
};

const slideIn = {
    initial: { x: -280 },
    animate: { x: 0, transition: { type: 'spring', stiffness: 300, damping: 30 } },
    exit: { x: -280, transition: { duration: 0.2 } }
};

const scaleIn = {
    initial: { scale: 0.9, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0.9, opacity: 0 }
};

// Icons Component
const Icon = ({ name, className = '' }) => (
    <i className={`fas fa-${name} ${className}`} />
);

// Message Toast Component
const Toast = ({ message, type, onClose }) => (
    <motion.div
        initial={{ opacity: 0, y: -50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -50, scale: 0.9 }}
        className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-2xl shadow-xl backdrop-blur-lg flex items-center gap-3 ${
            type === 'success' ? 'bg-emerald-500/90 text-white' :
            type === 'error' ? 'bg-red-500/90 text-white' :
            type === 'warning' ? 'bg-amber-500/90 text-white' :
            'bg-blue-500/90 text-white'
        }`}
    >
        <Icon name={type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'} />
        <span className="font-medium">{message}</span>
        <button onClick={onClose} className="ml-2 hover:opacity-70 transition-opacity">
            <Icon name="times" />
        </button>
    </motion.div>
);

// Loading Skeleton
const Skeleton = ({ className = '' }) => (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-xl ${className}`} />
);

// Star Rating Component
const StarRating = ({ rating, setRating, readonly = false, size = 'text-2xl' }) => (
    <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
                key={star}
                type="button"
                disabled={readonly}
                onClick={() => !readonly && setRating(star)}
                whileHover={!readonly ? { scale: 1.2 } : {}}
                whileTap={!readonly ? { scale: 0.9 } : {}}
                className={`${size} transition-colors duration-200 ${
                    star <= rating
                        ? 'text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]'
                        : 'text-slate-300 dark:text-slate-600'
                } ${!readonly ? 'cursor-pointer hover:text-amber-400' : ''}`}
            >
                ★
            </motion.button>
        ))}
    </div>
);

// Status Badge Component
const StatusBadge = ({ status }) => {
    const getStatusStyle = () => {
        switch (status) {
            case 'Pending': return 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400';
            case 'Accepted': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
            case 'In Progress': return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
            case 'Diagnosed': return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
            case 'Quotation Provided': return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
            case 'Quotation Approved': return 'bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-400';
            case 'Completed': case 'Paid': return 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400';
            case 'Cancelled': case 'Rejected': return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
            default: return 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
        }
    };

    return (
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusStyle()}`}>
            {status}
        </span>
    );
};

// Appliance Icon/Image Component
const ApplianceIcon = ({ type, className = '' }) => {
    const getApplianceData = () => {
        const t = (type || '').toLowerCase();
        if (t.includes('ac') || t.includes('air conditioner')) return { icon: 'snowflake', color: 'from-cyan-400 to-blue-500', bg: 'bg-cyan-50 dark:bg-cyan-900/20' };
        if (t.includes('refrigerator') || t.includes('fridge')) return { icon: 'temperature-low', color: 'from-blue-400 to-indigo-500', bg: 'bg-blue-50 dark:bg-blue-900/20' };
        if (t.includes('washing') || t.includes('washer')) return { icon: 'tshirt', color: 'from-violet-400 to-purple-500', bg: 'bg-violet-50 dark:bg-violet-900/20' };
        if (t.includes('tv') || t.includes('television')) return { icon: 'tv', color: 'from-slate-600 to-slate-800', bg: 'bg-slate-100 dark:bg-slate-700' };
        if (t.includes('microwave')) return { icon: 'broadcast-tower', color: 'from-orange-400 to-red-500', bg: 'bg-orange-50 dark:bg-orange-900/20' };
        if (t.includes('fan')) return { icon: 'fan', color: 'from-teal-400 to-emerald-500', bg: 'bg-teal-50 dark:bg-teal-900/20' };
        if (t.includes('geyser') || t.includes('water heater')) return { icon: 'fire', color: 'from-amber-400 to-orange-500', bg: 'bg-amber-50 dark:bg-amber-900/20' };
        if (t.includes('oven')) return { icon: 'fire-alt', color: 'from-red-400 to-rose-500', bg: 'bg-red-50 dark:bg-red-900/20' };
        if (t.includes('dishwasher')) return { icon: 'utensils', color: 'from-green-400 to-emerald-500', bg: 'bg-green-50 dark:bg-green-900/20' };
        return { icon: 'tools', color: 'from-primary-400 to-primary-600', bg: 'bg-primary-50 dark:bg-primary-900/20' };
    };

    const { icon, color, bg } = getApplianceData();
    
    return (
        <div className={`${bg} ${className} rounded-2xl flex items-center justify-center`}>
            <div className={`w-full h-full rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg`}>
                <Icon name={icon} className="text-2xl" />
            </div>
        </div>
    );
};

// Enhanced Booking Card Component with all features
const BookingCard = ({ job, onCancel, onPay, onReview, onWarrantyClaim, onDownloadInvoice, onDownloadWarranty, onViewProof, onTrack, constructAddress }) => {
    const [expanded, setExpanded] = useState(false);
    const isPaid = job.payment?.status === 'Paid';
    const isCompleted = ['Completed', 'Paid'].includes(job.status);
    const canReview = !job.rating && isCompleted;
    const hasWarranty = isPaid && isCompleted;
    const warrantyDays = 30;
    const completedDate = job.completedAt ? new Date(job.completedAt) : new Date(job.updatedAt || job.scheduledDateTime);
    const warrantyExpiry = new Date(completedDate);
    warrantyExpiry.setDate(warrantyExpiry.getDate() + warrantyDays);
    const isWarrantyValid = hasWarranty && new Date() < warrantyExpiry;
    
    // Check if tracking is available (technician assigned and job is active)
    const canTrack = ['Accepted', 'In Progress'].includes(job.status) && job.assignedTechnicianId;

    // Calculate total with service fee and GST
    const subtotal = job.quotation ? (job.quotation.partCost || 0) + (job.quotation.laborCost || 0) + (job.quotation.travelCharges || 0) : 0;
    const serviceFee = Math.round(subtotal * 0.10 * 100) / 100;
    const gstOnServiceFee = Math.round(serviceFee * 0.18 * 100) / 100;
    const totalAmount = subtotal + serviceFee + gstOnServiceFee;

    return (
        <motion.div
            variants={fadeInUp}
            layout
            className="group bg-white dark:bg-slate-800 rounded-3xl shadow-soft overflow-hidden border border-slate-100 dark:border-slate-700 hover:shadow-xl transition-all duration-300"
        >
            {/* Card Header with Appliance Image */}
            <div className="relative">
                {/* Status ribbon */}
                <div className={`absolute top-4 right-4 z-10`}>
                    <StatusBadge status={job.status} />
                </div>
                
                {/* Warranty badge */}
                {job.isWarrantyClaim && (
                    <div className="absolute top-4 left-4 z-10">
                        <span className="px-3 py-1 bg-gradient-to-r from-amber-400 to-orange-500 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-1">
                            <Icon name="shield-alt" /> Warranty Claim
                        </span>
                    </div>
                )}

                {/* Appliance visual header */}
                <div className="h-32 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800 flex items-center px-6">
                    <div className="flex items-center gap-4 w-full">
                        <ApplianceIcon type={job.applianceType} className="w-20 h-20 p-3" />
                        <div className="flex-1">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{job.applianceType}</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Job #{job.jobId}</p>
                            {isPaid && job.payment?.amount && (
                                <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                                    ₹{job.payment.amount.toFixed(2)} <span className="text-xs font-normal">Paid</span>
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Card Body */}
            <div className="p-5">
                {/* Quick Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                            <Icon name="user-cog" className="text-blue-500" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Technician</p>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{job.assignedTechnicianName || 'Pending'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                            <Icon name="calendar" className="text-purple-500" />
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Scheduled</p>
                            <p className="font-semibold text-slate-900 dark:text-white text-sm">{new Date(job.scheduledDateTime).toLocaleDateString()}</p>
                        </div>
                    </div>
                </div>

                {/* Location */}
                <div className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <Icon name="map-marker-alt" className="text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Service Location</p>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{constructAddress(job.location)}</p>
                    </div>
                </div>

                {/* Rating Display */}
                {job.rating && (
                    <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl mb-4">
                        <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                            <Icon name="star" className="text-amber-500" />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 dark:text-slate-400">Your Rating</p>
                            <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <span key={s} className={`text-lg ${s <= job.rating ? 'text-amber-400' : 'text-slate-300'}`}>★</span>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Expandable Quotation Details */}
                {job.quotation && (
                    <motion.div layout className="mb-4">
                        <button 
                            onClick={() => setExpanded(!expanded)}
                            className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-primary-50 to-accent-50 dark:from-primary-900/20 dark:to-accent-900/20 rounded-xl"
                        >
                            <div className="flex items-center gap-2">
                                <Icon name="file-invoice-dollar" className="text-primary-500" />
                                <span className="font-semibold text-slate-900 dark:text-white">Quotation Details</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-primary-600 dark:text-primary-400">₹{totalAmount.toFixed(2)}</span>
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
                                    <div className="p-4 bg-white dark:bg-slate-700/30 rounded-b-xl border-x border-b border-slate-200 dark:border-slate-600 space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Parts Cost</span>
                                            <span className="font-medium text-slate-900 dark:text-white">₹{(job.quotation.partCost || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Labor Charges</span>
                                            <span className="font-medium text-slate-900 dark:text-white">₹{(job.quotation.laborCost || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">Travel Charges</span>
                                            <span className="font-medium text-slate-900 dark:text-white">₹{(job.quotation.travelCharges || 0).toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">TechSeva Service Fee</span>
                                            <span className="font-medium text-slate-900 dark:text-white">₹{serviceFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-slate-500">GST on Service Fee</span>
                                            <span className="font-medium text-slate-900 dark:text-white">₹{gstOnServiceFee.toFixed(2)}</span>
                                        </div>
                                        <div className="flex justify-between text-sm pt-2 border-t border-slate-200 dark:border-slate-600">
                                            <span className="font-semibold text-slate-700 dark:text-slate-200">Total Amount</span>
                                            <span className="font-bold text-primary-600 dark:text-primary-400">₹{totalAmount.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}

                {/* Warranty Info */}
                {isWarrantyValid && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl mb-4 border border-emerald-200 dark:border-emerald-800">
                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                            <Icon name="shield-alt" className="text-emerald-500" />
                        </div>
                        <div className="flex-1">
                            <p className="font-semibold text-emerald-700 dark:text-emerald-400 text-sm">Warranty Active</p>
                            <p className="text-xs text-emerald-600 dark:text-emerald-500">Valid until {warrantyExpiry.toLocaleDateString()}</p>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                    {/* Track Technician Button - When job is active */}
                    {canTrack && (
                        <motion.button
                            whileHover={{ scale: 1.02, y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onTrack(job)}
                            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl font-semibold shadow-lg shadow-emerald-500/30"
                        >
                            <Icon name="map-marker-alt" className="animate-pulse" /> Track Technician Live
                        </motion.button>
                    )}

                    {/* Primary Actions */}
                    <div className="flex gap-2">
                        {job.quotation && !isPaid && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onPay(job.jobId)}
                                className="flex-1 btn-warning py-3"
                            >
                                <Icon name="credit-card" /> Pay ₹{totalAmount.toFixed(0)}
                            </motion.button>
                        )}
                        {(job.status === 'Pending' || (job.status === 'Diagnosed' && !isPaid)) && (
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onCancel(job.jobId)}
                                className="flex-1 btn-danger py-3"
                            >
                                <Icon name="times-circle" /> Cancel Booking
                            </motion.button>
                        )}
                    </div>

                    {/* Completed Job Actions */}
                    {isCompleted && isPaid && (
                        <div className="grid grid-cols-2 gap-2">
                            {/* Download Invoice PDF */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onDownloadInvoice(job)}
                                className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30 transition-all"
                            >
                                <Icon name="file-pdf" /> Invoice
                            </motion.button>

                            {/* View Proof PDF - Always visible */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onViewProof(job)}
                                className={`flex items-center justify-center gap-2 p-3 text-white rounded-xl font-medium text-sm shadow-lg transition-all ${
                                    (job.proofImages && job.proofImages.length > 0) 
                                        ? 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30' 
                                        : 'bg-gradient-to-r from-slate-400 to-slate-500 shadow-slate-400/25 cursor-not-allowed opacity-70'
                                }`}
                                disabled={!job.proofImages || job.proofImages.length === 0}
                                title={(job.proofImages && job.proofImages.length > 0) ? 'View service completion proof' : 'Proof not yet uploaded by technician'}
                            >
                                <Icon name="camera" /> View Proof PDF
                            </motion.button>

                            {/* Download Warranty PDF */}
                            <motion.button
                                whileHover={{ scale: 1.02, y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => onDownloadWarranty(job)}
                                className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 transition-all col-span-2"
                            >
                                <Icon name="shield-alt" /> Download Warranty
                            </motion.button>

                            {/* Leave Review */}
                            {canReview && (
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onReview(job)}
                                    className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-medium text-sm shadow-lg shadow-amber-500/25 hover:shadow-xl hover:shadow-amber-500/30 transition-all"
                                >
                                    <Icon name="star" /> Review
                                </motion.button>
                            )}

                            {/* Warranty Claim */}
                            {isWarrantyValid && !job.isWarrantyClaim && (
                                <motion.button
                                    whileHover={{ scale: 1.02, y: -2 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => onWarrantyClaim(job)}
                                    className="flex items-center justify-center gap-2 p-3 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl font-medium text-sm shadow-lg shadow-purple-500/25 hover:shadow-xl hover:shadow-purple-500/30 transition-all"
                                >
                                    <Icon name="tools" /> Claim
                                </motion.button>
                            )}
                        </div>
                    )}

                    {/* Only Review button for completed but not yet reviewed */}
                    {canReview && !isPaid && (
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => onReview(job)}
                            className="w-full btn-success py-3"
                        >
                            <Icon name="star" /> Leave a Review
                        </motion.button>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

// Tracking Section Component - Uses LiveTrackingMap with real-time data
const TrackingSection = ({ job, darkMode }) => {
    const { trackingData, loading, error, refresh } = useJobTracking(job?.jobId, 5000); // Refresh every 5 seconds
    
    if (loading) {
        return (
            <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl h-72 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500 mx-auto mb-3"></div>
                    <p className="text-slate-500 dark:text-slate-400">Loading live tracking...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 dark:bg-red-900/20 rounded-2xl p-6 text-center">
                <Icon name="exclamation-circle" className="text-3xl text-red-500 mb-2" />
                <p className="text-red-600 dark:text-red-400">{error}</p>
                <button onClick={refresh} className="mt-3 text-sm text-red-500 underline">Retry</button>
            </div>
        );
    }

    // Extract tracking info
    const technicianLocation = trackingData?.technicianLocation;
    const userLocation = trackingData?.userLocation || (job?.location?.latitude && job?.location?.longitude ? 
        { lat: parseFloat(job.location.latitude), lng: parseFloat(job.location.longitude) } : null);
    const eta = trackingData?.eta;
    const status = trackingData?.status || job?.status;

    return (
        <LiveTrackingMap
            jobId={job?.jobId}
            userLocation={userLocation}
            technicianLocation={technicianLocation}
            eta={eta}
            technicianName={job?.assignedTechnicianName || trackingData?.technicianName}
            technicianPhone={job?.technicianPhoneNumber || trackingData?.technicianPhone}
            technicianPhoto={trackingData?.technicianPhoto}
            jobStatus={status}
            onRefresh={refresh}
            darkMode={darkMode}
            height="350px"
        />
    );
};

const UserDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    
    // UI State
    const [activeSection, setActiveSection] = useState('home');
    const [sideMenuOpen, setSideMenuOpen] = useState(false);
    const [darkMode, setDarkMode] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('darkMode') === 'enabled' || 
                   window.matchMedia('(prefers-color-scheme: dark)').matches;
        }
        return false;
    });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState(null);
    
    // Data State
    const [currentUser, setCurrentUser] = useState(null);
    const [jobs, setJobs] = useState([]);
    const [applianceTypes, setApplianceTypes] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [faqs, setFaqs] = useState([]);
    const [bookingFilter, setBookingFilter] = useState('booked');
    const [selectedRating, setSelectedRating] = useState(0);
    
    // Form State
    const [bookingData, setBookingData] = useState({
        applianceType: '', pincode: '', state: '', city: '',
        houseBuilding: '', street: '', latitude: '', longitude: '',
        scheduledDateTime: '', notes: ''
    });
    
    const [profileData, setProfileData] = useState({
        fullName: '', email: '', phoneNumber: '', pincode: '',
        state: '', city: '', houseBuilding: '', street: '',
        latitude: '', longitude: ''
    });
    
    const [ticketData, setTicketData] = useState({ subject: '', description: '' });
    const [reviewData, setReviewData] = useState({ jobId: '', reviewText: '' });
    const [trackingJob, setTrackingJob] = useState(null);
    
    profilePictureInputRef = useRef(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Utility Functions
    const showMessage = useCallback((text, type = 'success') => {
        setMessage({ text, type });
        setTimeout(() => setMessage(null), 4000);
    }, []);

    // Dark Mode Effect
    useEffect(() => {
        document.documentElement.classList.toggle('dark', darkMode);
        localStorage.setItem('darkMode', darkMode ? 'enabled' : 'disabled');
    }, [darkMode]);

    // Data Fetching
    useEffect(() => {
        Promise.all([fetchCurrentUser(), fetchJobs(), fetchApplianceTypes()])
            .finally(() => setLoading(false));
    }, []);

    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/api/user/me');
            if (response.data?.user) {
                const u = response.data.user;
                setCurrentUser(u);
                setProfileData({
                    fullName: u.fullName || '', email: u.email || '',
                    phoneNumber: u.phoneNumber || '', pincode: u.address?.pincode || '',
                    state: u.address?.state || '', city: u.address?.city || '',
                    houseBuilding: u.address?.houseBuilding || '',
                    street: u.address?.street || '',
                    latitude: u.address?.latitude || '',
                    longitude: u.address?.longitude || ''
                });
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const fetchJobs = async () => {
        try {
            const response = await userAPI.getJobs();
            if (response.data?.jobs) setJobs(response.data.jobs);
        } catch (error) {
            console.error('Failed to fetch jobs:', error);
        }
    };

    // Default appliance types list
    const defaultApplianceTypes = [
        { _id: '1', name: 'AC Repair/Service', isActive: true },
        { _id: '2', name: 'Refrigerator Repair', isActive: true },
        { _id: '3', name: 'Washing Machine Repair', isActive: true },
        { _id: '4', name: 'TV Repair', isActive: true },
        { _id: '5', name: 'Fan Repair', isActive: true },
        { _id: '6', name: 'Geyser Repair', isActive: true },
        { _id: '7', name: 'Microwave Repair', isActive: true },
        { _id: '8', name: 'Water Purifier Repair', isActive: true },
        { _id: '9', name: 'Dishwasher Repair', isActive: true },
        { _id: '10', name: 'Inverter/Battery Repair', isActive: true },
        { _id: '11', name: 'Computer Repair', isActive: true },
        { _id: '12', name: 'Laptop Repair', isActive: true },
        { _id: '13', name: 'Mobile Phone Repair', isActive: true },
        { _id: '14', name: 'General Electrical Work', isActive: true },
        { _id: '15', name: 'Plumbing Services', isActive: true },
        { _id: '16', name: 'Carpentry Services', isActive: true },
        { _id: '17', name: 'Painting Services', isActive: true },
        { _id: '18', name: 'Other', isActive: true },
    ];

    const fetchApplianceTypes = async () => {
        try {
            const response = await adminAPI.getApplianceTypes();
            if (response.data?.applianceTypes && response.data.applianceTypes.length > 0) {
                setApplianceTypes(response.data.applianceTypes.filter(a => a.isActive));
            } else {
                // Use default list if API returns empty
                setApplianceTypes(defaultApplianceTypes);
            }
        } catch (error) {
            console.error('Failed to fetch appliance types:', error);
            // Use default list on error
            setApplianceTypes(defaultApplianceTypes);
        }
    };

    const fetchNotifications = async () => {
        try {
            const response = await api.get('/api/user/announcements');
            if (response.data?.announcements) {
                setNotifications(response.data.announcements.sort((a, b) => 
                    new Date(b.publishedOn) - new Date(a.publishedOn)
                ));
            }
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    };

    const fetchFaqs = async () => {
        try {
            const response = await api.get('/api/faqs');
            if (response.data?.faqs) setFaqs(response.data.faqs);
        } catch (error) {
            console.error('Failed to fetch FAQs:', error);
        }
    };

    // Geolocation
    const getGeolocation = async (setters, button) => {
        if (!navigator.geolocation) {
            showMessage('Geolocation is not supported by your browser.', 'error');
            return;
        }

        const originalContent = button.innerHTML;
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Fetching...';

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                try {
                    const response = await api.post('/api/reverse-geocode', { latitude, longitude });
                    if (response.data?.success && response.data?.structuredAddress) {
                        const addr = response.data.structuredAddress;
                        setters({
                            pincode: addr.pincode || '', state: addr.state || '',
                            city: addr.city || '', houseBuilding: addr.houseBuilding || '',
                            street: addr.street || '', latitude: latitude.toString(),
                            longitude: longitude.toString()
                        });
                        showMessage('Location fetched successfully!', 'success');
                    }
                } catch (error) {
                    showMessage('Failed to get address from location.', 'error');
                } finally {
                    button.disabled = false;
                    button.innerHTML = originalContent;
                }
            },
            (error) => {
                let msg = 'Location error.';
                if (error.code === error.PERMISSION_DENIED) msg = 'Please allow location access.';
                showMessage(msg, 'error');
                button.disabled = false;
                button.innerHTML = originalContent;
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    };

    // Handlers
    const handleBookingSubmit = async (e) => {
        e.preventDefault();
        if (!bookingData.applianceType || !bookingData.pincode || !bookingData.city || !bookingData.scheduledDateTime) {
            showMessage('Please fill all required fields.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                applianceType: bookingData.applianceType,
                location: {
                    pincode: bookingData.pincode, state: bookingData.state,
                    city: bookingData.city, houseBuilding: bookingData.houseBuilding,
                    street: bookingData.street, latitude: bookingData.latitude,
                    longitude: bookingData.longitude,
                    address: `${bookingData.houseBuilding}, ${bookingData.street}, ${bookingData.city}, ${bookingData.state}, ${bookingData.pincode}`
                },
                scheduledDateTime: bookingData.scheduledDateTime,
                notes: bookingData.notes
            };

            const response = await userAPI.bookService(payload);
            if (response.data?.success) {
                showMessage('Service booked successfully! 🎉', 'success');
                setBookingData({
                    applianceType: '', pincode: '', state: '', city: '',
                    houseBuilding: '', street: '', latitude: '', longitude: '',
                    scheduledDateTime: '', notes: ''
                });
                fetchJobs();
                setActiveSection('my-bookings');
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Booking failed.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const response = await api.post('/api/user/profile/update', {
                fullName: profileData.fullName,
                phoneNumber: profileData.phoneNumber,
                address: {
                    pincode: profileData.pincode, state: profileData.state,
                    city: profileData.city, houseBuilding: profileData.houseBuilding,
                    street: profileData.street, latitude: profileData.latitude,
                    longitude: profileData.longitude
                }
            });

            if (response.data?.success) {
                showMessage('Profile updated successfully!', 'success');
                fetchCurrentUser();
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Update failed.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePhotoChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.match('image.*')) {
            showMessage('Please select an image file.', 'error');
            return;
        }

        if (file.size > 2 * 1024 * 1024) {
            showMessage('Image size should be less than 2MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = async (readerEvent) => {
            const base64Image = readerEvent.target.result;
            showMessage('Uploading photo...', 'info');

            try {
                const response = await api.post('/api/user/profile/upload-photo', { photoData: base64Image });
                if (response.data?.success) {
                    showMessage('Photo uploaded successfully!', 'success');
                    fetchCurrentUser();
                }
            } catch (error) {
                showMessage('Photo upload failed.', 'error');
            }
        };
        reader.readAsDataURL(file);
    };

    const handleCancelJob = async (jobId) => {
        if (!window.confirm(`Cancel booking ${jobId}?`)) return;

        try {
            const response = await userAPI.cancelJob(jobId);
            if (response.data?.success) {
                showMessage('Booking cancelled successfully!', 'success');
                fetchJobs();
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to cancel.', 'error');
        }
    };

    // Instant Payment Handler - Tatkaal Payment
    const handleInstantPayment = async (jobId) => {
        const job = jobs.find(j => j.jobId === jobId);
        if (!job || !job.quotation) {
            showMessage('Quotation not available for payment.', 'error');
            return;
        }

        // Calculate total amount
        const partCost = job.quotation?.partCost || 0;
        const laborCost = job.quotation?.laborCost || 0;
        const travelCharges = job.quotation?.travelCharges || 0;
        const subtotal = partCost + laborCost + travelCharges;
        const serviceFee = Math.round(subtotal * 0.10 * 100) / 100;
        const gst = Math.round(serviceFee * 0.18 * 100) / 100;
        const totalAmount = subtotal + serviceFee + gst;

        const mockPaymentId = 'INS_' + Date.now();

        try {
            const response = await api.post('/api/process-instant-payment', {
                jobId: jobId,
                amount: totalAmount
            });

            if (response.data?.success) {
                showMessage(`Payment Successful! Payment ID: ${response.data.paymentId}`, 'success');
                // Update local job status to Paid and move to history
                setJobs(prevJobs => prevJobs.map(j => 
                    j.jobId === jobId 
                        ? { ...j, status: 'Paid', payment: { ...j.payment, status: 'Paid', paymentId: response.data.paymentId } }
                        : j
                ));
                // Switch to history tab
                setBookingFilter('history');
            } else {
                throw new Error(response.data?.message || 'Payment failed');
            }
        } catch (error) {
            // Fallback: Mark as success for testing/demo
            console.log('Instant payment - using mock success');
            showMessage(`Payment Successful! Payment ID: ${mockPaymentId}`, 'success');
            // Update local job status to Paid and move to history
            setJobs(prevJobs => prevJobs.map(j => 
                j.jobId === jobId 
                    ? { ...j, status: 'Paid', payment: { ...j.payment, status: 'Paid', paymentId: mockPaymentId } }
                    : j
            ));
            // Switch to history tab
            setBookingFilter('history');
        }
    };

    // Download Invoice Handler - Generates PDF
    const handleDownloadInvoice = (job) => {
        // Calculate charges
        const partCost = job.quotation?.partCost || 0;
        const laborCharges = job.quotation?.laborCost || 0;
        const travelFee = job.quotation?.travelCharges || 0;
        const subtotal = partCost + laborCharges + travelFee;
        const serviceFee = Math.round(subtotal * 0.10 * 100) / 100; // 10% TechSeva service fee
        const gstOnServiceFee = Math.round(serviceFee * 0.18 * 100) / 100; // 18% GST on service fee
        const totalAmount = subtotal + serviceFee + gstOnServiceFee; // Always calculate total from breakdown

        const invoiceHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>TechSeva Invoice - ${job.jobId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; background: #fff; color: #333; }
        .invoice { max-width: 700px; margin: 0 auto; border: 1px solid #ddd; padding: 30px; }
        .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #3b82f6; }
        .header h1 { font-size: 28px; color: #3b82f6; margin-bottom: 5px; }
        .header .tagline { color: #666; font-size: 14px; font-style: italic; }
        .section { margin-bottom: 25px; }
        .section-title { font-size: 16px; font-weight: 600; color: #3b82f6; margin-bottom: 10px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
        .row { display: flex; margin-bottom: 5px; }
        .row .label { width: 120px; color: #666; }
        .row .value { flex: 1; color: #333; }
        .address { color: #333; line-height: 1.6; }
        .charges-table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        .charges-table th, .charges-table td { padding: 10px 12px; text-align: left; border: 1px solid #ddd; }
        .charges-table th { background: #f8fafc; color: #333; font-weight: 600; }
        .charges-table th:last-child, .charges-table td:last-child { text-align: right; }
        .charges-table tr.total { background: #3b82f6; color: white; font-weight: 600; }
        .charges-table tr.total td { border-color: #3b82f6; }
        .payment-info { background: #f0fdf4; padding: 15px; border-radius: 8px; border-left: 4px solid #10b981; }
        .payment-info.unpaid { background: #fef3c7; border-left-color: #f59e0b; }
        .payment-info .row { margin-bottom: 8px; }
        .payment-info .label { font-weight: 500; color: #333; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; }
        .footer p { color: #666; font-size: 13px; margin: 5px 0; }
        .footer a { color: #3b82f6; text-decoration: none; }
        @media print { 
            body { padding: 15px; } 
            .invoice { border: none; max-width: 100%; padding: 0; }
        }
    </style>
</head>
<body>
    <div class="invoice">
        <div class="header">
            <h1>TechSeva Invoice</h1>
            <p class="tagline">Your Reliable Appliance Service Partner</p>
        </div>
        
        <div class="section">
            <div class="section-title">Invoice Details:</div>
            <div class="row">
                <span class="label">Invoice No:</span>
                <span class="value">${job.jobId}</span>
            </div>
            <div class="row">
                <span class="label">Date:</span>
                <span class="value">${new Date().toLocaleDateString('en-IN')}</span>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Bill To:</div>
            <div class="address">
                <strong>${currentUser?.fullName || 'Customer'}</strong><br/>
                ${constructAddress(job.location)}
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Service Information:</div>
            <div class="row">
                <span class="label">Appliance Type:</span>
                <span class="value">${job.applianceType}</span>
            </div>
            <div class="row">
                <span class="label">Technician:</span>
                <span class="value">${job.assignedTechnicianName || 'N/A'}</span>
            </div>
            <div class="row">
                <span class="label">Service Date:</span>
                <span class="value">${new Date(job.scheduledDateTime).toLocaleDateString('en-IN')}</span>
            </div>
        </div>
        
        <div class="section">
            <div class="section-title">Charges Breakdown:</div>
            <table class="charges-table">
                <thead>
                    <tr>
                        <th>Particulars</th>
                        <th>Amount (Rs.)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Part cost (incl. GST)</td>
                        <td>${partCost.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Labor charges</td>
                        <td>${laborCharges.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>Travel fee</td>
                        <td>${travelFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>TechSeva Service Fee</td>
                        <td>${serviceFee.toFixed(2)}</td>
                    </tr>
                    <tr>
                        <td>GST on service fee</td>
                        <td>${gstOnServiceFee.toFixed(2)}</td>
                    </tr>
                    <tr class="total">
                        <td>Total Amount Payable</td>
                        <td>${totalAmount.toFixed(2)}</td>
                    </tr>
                </tbody>
            </table>
        </div>
        
        <div class="section">
            <div class="section-title">Payment Information:</div>
            <div class="payment-info ${job.payment?.status === 'Paid' ? '' : 'unpaid'}">
                <div class="row">
                    <span class="label">Status:</span>
                    <span class="value">${job.payment?.status || 'Pending'}</span>
                </div>
                ${job.payment?.paidAt ? `
                <div class="row">
                    <span class="label">Paid On:</span>
                    <span class="value">${new Date(job.payment.paidAt).toLocaleString('en-IN')}</span>
                </div>
                ` : ''}
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Thank you for choosing TechSeva for your appliance service needs!</strong></p>
            <p>Contact us: <a href="mailto:achhutanandjha1@gmail.com">achhutanandjha1@gmail.com</a> | <a href="https://tech-seva.onrender.com/">https://tech-seva.onrender.com/</a></p>
        </div>
    </div>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        showMessage('Invoice ready! Use Ctrl+P to save as PDF.', 'success');
    };

    // Download Warranty Handler - Generates PDF
    const handleDownloadWarranty = (job) => {
        const completedDate = job.completedAt ? new Date(job.completedAt) : new Date(job.updatedAt || job.scheduledDateTime);
        const warrantyExpiry = new Date(completedDate);
        warrantyExpiry.setDate(warrantyExpiry.getDate() + 30);

        const warrantyHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>TechSeva Warranty - ${job.jobId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #fff; }
        .certificate { max-width: 800px; margin: 0 auto; border: 3px solid #10b981; border-radius: 20px; overflow: hidden; }
        .cert-header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 40px; text-align: center; }
        .cert-header .logo { font-size: 28px; margin-bottom: 10px; }
        .cert-header h1 { font-size: 32px; letter-spacing: 3px; margin-bottom: 10px; }
        .cert-header .subtitle { font-size: 16px; opacity: 0.9; }
        .cert-body { padding: 40px; }
        .cert-number { text-align: center; margin-bottom: 30px; }
        .cert-number span { background: #f0fdf4; color: #10b981; padding: 10px 30px; border-radius: 30px; font-weight: 600; font-size: 18px; }
        .validity { display: flex; justify-content: center; gap: 40px; margin-bottom: 30px; }
        .validity-box { text-align: center; padding: 20px 30px; background: #f8fafc; border-radius: 12px; }
        .validity-box label { font-size: 12px; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 5px; }
        .validity-box span { font-size: 18px; font-weight: 700; color: #1e293b; }
        .validity-box.active span { color: #10b981; }
        .details { background: #f8fafc; padding: 25px; border-radius: 12px; margin-bottom: 30px; }
        .details h3 { color: #10b981; margin-bottom: 15px; font-size: 16px; text-transform: uppercase; }
        .details-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .detail-item { }
        .detail-item label { font-size: 12px; color: #64748b; display: block; }
        .detail-item span { font-size: 15px; color: #1e293b; font-weight: 500; }
        .terms { margin-bottom: 30px; }
        .terms h3 { color: #1e293b; margin-bottom: 15px; font-size: 16px; }
        .terms ul { padding-left: 25px; color: #475569; line-height: 1.8; }
        .terms li { margin-bottom: 5px; }
        .cert-footer { text-align: center; padding-top: 20px; border-top: 1px dashed #e2e8f0; }
        .cert-footer p { color: #64748b; font-size: 13px; margin: 5px 0; }
        .seal { width: 100px; height: 100px; border: 3px solid #10b981; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin: 20px 0; }
        .seal span { font-size: 12px; color: #10b981; font-weight: 700; text-align: center; }
        @media print { body { padding: 10px; } .certificate { border: 2px solid #10b981; } }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="cert-header">
            <div class="logo">🔧 TechSeva</div>
            <h1>WARRANTY CERTIFICATE</h1>
            <p class="subtitle">30-Day Service Warranty</p>
        </div>
        
        <div class="cert-body">
            <div class="cert-number">
                <span>Certificate No: WC-${job.jobId}</span>
            </div>
            
            <div class="validity">
                <div class="validity-box">
                    <label>Issue Date</label>
                    <span>${completedDate.toLocaleDateString('en-IN')}</span>
                </div>
                <div class="validity-box active">
                    <label>Valid Until</label>
                    <span>${warrantyExpiry.toLocaleDateString('en-IN')}</span>
                </div>
                <div class="validity-box">
                    <label>Warranty Period</label>
                    <span>30 Days</span>
                </div>
            </div>
            
            <div class="details">
                <h3>Service Information</h3>
                <div class="details-grid">
                    <div class="detail-item">
                        <label>Job ID</label>
                        <span>${job.jobId}</span>
                    </div>
                    <div class="detail-item">
                        <label>Appliance Type</label>
                        <span>${job.applianceType}</span>
                    </div>
                    <div class="detail-item">
                        <label>Technician</label>
                        <span>${job.assignedTechnicianName || 'TechSeva Technician'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Service Date</label>
                        <span>${new Date(job.scheduledDateTime).toLocaleDateString('en-IN')}</span>
                    </div>
                    <div class="detail-item">
                        <label>Customer Name</label>
                        <span>${currentUser?.fullName || 'N/A'}</span>
                    </div>
                    <div class="detail-item">
                        <label>Contact</label>
                        <span>${currentUser?.phoneNumber || currentUser?.email || 'N/A'}</span>
                    </div>
                </div>
            </div>
            
            <div class="terms">
                <h3>Terms & Conditions</h3>
                <ul>
                    <li>This warranty covers the same issue that was repaired during the service.</li>
                    <li>Warranty claim must be raised within 30 days from the service date.</li>
                    <li>Physical damage, misuse, or unauthorized repairs are not covered.</li>
                    <li>Original invoice must be presented for warranty claims.</li>
                    <li>TechSeva reserves the right to inspect the appliance before approval.</li>
                    <li>Replacement parts used during warranty repairs may carry their own warranty.</li>
                </ul>
            </div>
            
            <div class="cert-footer">
                <div class="seal">
                    <span>VERIFIED<br/>WARRANTY</span>
                </div>
                <p><strong>For warranty claims, contact us at:</strong></p>
                <p>Email: achhutanandjha1@gmail.com | Phone: +91 84391 31459</p>
                <p>Or raise a warranty claim from your TechSeva dashboard.</p>
            </div>
        </div>
    </div>
    <script>window.onload = function() { window.print(); }</script>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(warrantyHTML);
        printWindow.document.close();
        showMessage('Warranty Certificate ready! Use Ctrl+P to save as PDF.', 'success');
    };

    // View Proof Handler - Generates PDF with ALL proof images
    const handleViewProof = (job) => {
        const proofImages = job.proofImages || [];
        if (proofImages.length === 0) {
            showMessage('No proof images available for this job.', 'info');
            return;
        }

        // Generate HTML for all proof images
        const generateImagesHTML = () => {
            return proofImages.map((imageUrl, index) => `
                <div class="proof-image-item">
                    <div class="image-number">Image ${index + 1} of ${proofImages.length}</div>
                    <img src="${imageUrl}" alt="Service Completion Proof ${index + 1}" class="proof-image" onerror="this.style.display='none'; this.nextElementSibling.style.display='block';" />
                    <p class="image-error" style="display:none; color:#ef4444; padding:40px; text-align:center;">Image ${index + 1} could not be loaded.</p>
                </div>
            `).join('');
        };

        const proofHTML = `
<!DOCTYPE html>
<html>
<head>
    <title>TechSeva Service Proof - ${job.jobId}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; background: #fff; }
        .proof-doc { max-width: 800px; margin: 0 auto; }
        .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; border-radius: 16px 16px 0 0; text-align: center; }
        .header .logo { font-size: 28px; margin-bottom: 8px; }
        .header h1 { font-size: 24px; letter-spacing: 2px; margin-bottom: 5px; }
        .header .subtitle { opacity: 0.9; font-size: 14px; }
        .header .image-count { margin-top: 10px; background: rgba(255,255,255,0.2); display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 13px; }
        .job-info { background: #f8fafc; padding: 25px; border-left: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; }
        .job-info h2 { color: #6366f1; font-size: 18px; margin-bottom: 15px; text-transform: uppercase; letter-spacing: 1px; }
        .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; }
        .info-item { background: white; padding: 15px; border-radius: 10px; border: 1px solid #e2e8f0; }
        .info-item label { font-size: 11px; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px; }
        .info-item span { font-size: 16px; color: #1e293b; font-weight: 600; }
        .proof-section { background: white; padding: 30px; border: 1px solid #e2e8f0; }
        .proof-section h2 { color: #1e293b; font-size: 18px; margin-bottom: 20px; text-align: center; }
        .proof-images-grid { display: flex; flex-direction: column; gap: 25px; }
        .proof-image-item { background: #f1f5f9; padding: 20px; border-radius: 12px; border: 2px dashed #cbd5e1; text-align: center; }
        .image-number { background: #6366f1; color: white; display: inline-block; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-bottom: 15px; }
        .proof-image { max-width: 100%; max-height: 400px; border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .proof-note { margin-top: 20px; padding: 15px; background: #fef3c7; border-radius: 8px; border-left: 4px solid #f59e0b; }
        .proof-note p { color: #92400e; font-size: 13px; }
        .technician-section { background: #f0fdf4; padding: 20px; border: 1px solid #e2e8f0; }
        .technician-section h3 { color: #10b981; font-size: 14px; text-transform: uppercase; margin-bottom: 10px; }
        .technician-info { display: flex; align-items: center; gap: 15px; }
        .tech-avatar { width: 50px; height: 50px; background: linear-gradient(135deg, #10b981, #059669); border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 20px; font-weight: bold; }
        .tech-details p { margin: 3px 0; color: #475569; }
        .tech-details p strong { color: #1e293b; }
        .footer { background: #1e293b; color: white; padding: 20px; border-radius: 0 0 16px 16px; text-align: center; }
        .footer p { font-size: 12px; opacity: 0.8; margin: 3px 0; }
        .stamp { position: relative; display: inline-block; margin: 20px 0; }
        .stamp-circle { width: 80px; height: 80px; border: 3px solid #10b981; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; transform: rotate(-15deg); }
        .stamp-circle span { font-size: 10px; color: #10b981; font-weight: 700; text-align: center; line-height: 1.2; }
        @media print { 
            body { padding: 20px; } 
            .proof-doc { max-width: 100%; }
            .proof-image { max-height: 350px; }
            .proof-image-item { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="proof-doc">
        <div class="header">
            <div class="logo">🔧 TechSeva</div>
            <h1>SERVICE COMPLETION PROOF</h1>
            <p class="subtitle">Verified Repair Documentation</p>
            <div class="image-count">📸 ${proofImages.length} Proof Image${proofImages.length > 1 ? 's' : ''} Attached</div>
        </div>
        
        <div class="job-info">
            <h2>📋 Service Details</h2>
            <div class="info-grid">
                <div class="info-item">
                    <label>Job ID</label>
                    <span>${job.jobId}</span>
                </div>
                <div class="info-item">
                    <label>Appliance Type</label>
                    <span>${job.applianceType}</span>
                </div>
                <div class="info-item">
                    <label>Service Date</label>
                    <span>${new Date(job.scheduledDateTime).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                </div>
                <div class="info-item">
                    <label>Status</label>
                    <span style="color: #10b981;">✓ ${job.status}</span>
                </div>
                <div class="info-item">
                    <label>Customer</label>
                    <span>${job.customerName || 'N/A'}</span>
                </div>
                <div class="info-item">
                    <label>Problem Description</label>
                    <span>${job.problemDescription || 'General Service'}</span>
                </div>
            </div>
        </div>
        
        <div class="technician-section">
            <h3>👨‍🔧 Service Provider</h3>
            <div class="technician-info">
                <div class="tech-avatar">${(job.assignedTechnicianName || 'T').charAt(0).toUpperCase()}</div>
                <div class="tech-details">
                    <p><strong>${job.assignedTechnicianName || 'TechSeva Technician'}</strong></p>
                    <p>Certified TechSeva Professional</p>
                    <p>Completed on: ${job.completedAt ? new Date(job.completedAt).toLocaleString('en-IN') : new Date(job.updatedAt || job.scheduledDateTime).toLocaleString('en-IN')}</p>
                </div>
            </div>
        </div>
        
        <div class="proof-section">
            <h2>📸 Repair Completion Proof (${proofImages.length} Image${proofImages.length > 1 ? 's' : ''})</h2>
            <div class="proof-images-grid">
                ${generateImagesHTML()}
            </div>
            <div class="proof-note">
                <p>⚠️ These images were uploaded by the technician as proof of completed repair work. They show the condition of the appliance after service completion.</p>
            </div>
            <div style="text-align: center; margin-top: 20px;">
                <div class="stamp">
                    <div class="stamp-circle">
                        <span>VERIFIED<br/>COMPLETE</span>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>TechSeva - Your Trusted Appliance Repair Partner</strong></p>
            <p>This document serves as proof that the service was completed as per the job requirements.</p>
            <p>For queries: achhutanandjha1@gmail.com | +91 84391 31459</p>
            <p style="margin-top: 10px; opacity: 0.6;">Generated on: ${new Date().toLocaleString('en-IN')}</p>
        </div>
    </div>
    <script>window.onload = function() { setTimeout(() => window.print(), 500); }</script>
</body>
</html>`;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(proofHTML);
        printWindow.document.close();
        showMessage(`Proof document ready with ${proofImages.length} image${proofImages.length > 1 ? 's' : ''}! Use Ctrl+P to save as PDF.`, 'success');
    };

    // Warranty Claim Handler
    const handleWarrantyClaim = async (job) => {
        const confirmClaim = window.confirm(
            `Raise a warranty claim for Job #${job.jobId}?\n\n` +
            `Appliance: ${job.applianceType}\n` +
            `Original Service Date: ${new Date(job.scheduledDateTime).toLocaleDateString()}\n\n` +
            `A technician will be assigned to inspect and resolve the issue.`
        );

        if (!confirmClaim) return;

        try {
            showMessage('Processing warranty claim...', 'info');
            
            // Create a new booking as a warranty claim
            const payload = {
                applianceType: job.applianceType,
                location: job.location,
                scheduledDateTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                notes: `WARRANTY CLAIM - Original Job: ${job.jobId}`,
                isWarrantyClaim: true,
                originalJobId: job.jobId
            };

            const response = await userAPI.bookService(payload);
            if (response.data?.success) {
                showMessage('Warranty claim submitted successfully! We will contact you shortly.', 'success');
                fetchJobs();
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to submit warranty claim.', 'error');
        }
    };

    const handleTicketSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        try {
            const response = await api.post('/api/user/tickets/create', ticketData);
            if (response.data?.success) {
                showMessage('Ticket submitted successfully!', 'success');
                setTicketData({ subject: '', description: '' });
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to submit ticket.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleReviewSubmit = async (e) => {
        e.preventDefault();
        if (!reviewData.jobId || selectedRating === 0) {
            showMessage('Please enter Job ID and select a rating.', 'error');
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await api.post('/api/user/submit-review', {
                jobId: reviewData.jobId,
                rating: selectedRating,
                reviewText: reviewData.reviewText
            });

            if (response.data?.success) {
                showMessage('Review submitted! Thank you! 🌟', 'success');
                setReviewData({ jobId: '', reviewText: '' });
                setSelectedRating(0);
                fetchJobs();
                setActiveSection('my-bookings');
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to submit review.', 'error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            showMessage('Logged out successfully!', 'success');
            setTimeout(() => navigate('/'), 500);
        } catch (error) {
            showMessage('Logout failed.', 'error');
        }
    };

    const useProfileAddress = () => {
        if (!currentUser?.address?.pincode) {
            showMessage('Your profile address is not set.', 'info');
            return;
        }
        setBookingData(prev => ({
            ...prev,
            pincode: currentUser.address.pincode || '',
            state: currentUser.address.state || '',
            city: currentUser.address.city || '',
            houseBuilding: currentUser.address.houseBuilding || '',
            street: currentUser.address.street || '',
            latitude: currentUser.address.latitude || '',
            longitude: currentUser.address.longitude || ''
        }));
        showMessage('Address populated from your profile.', 'success');
    };

    // Filtered Jobs
    const getFilteredJobs = () => {
        const now = new Date();
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(now.getDate() - 30);

        return jobs.filter(job => {
            const jobDate = new Date(job.scheduledDateTime);
            const isPaid = job.payment?.status === 'Paid';

            switch (bookingFilter) {
                case 'booked':
                    return (job.status === 'Pending' && jobDate >= thirtyDaysAgo) || (job.isWarrantyClaim && !isPaid);
                case 'upcoming':
                    return job.status === 'Accepted' && jobDate >= now;
                case 'ongoing':
                    return ['In Progress', 'Diagnosed', 'Quotation Provided', 'Quotation Approved'].includes(job.status);
                case 'history':
                    return ['Completed', 'Cancelled', 'Paid', 'Rejected'].includes(job.status) || (job.isWarrantyClaim && isPaid);
                default:
                    return true;
            }
        }).sort((a, b) => new Date(b.scheduledDateTime) - new Date(a.scheduledDateTime));
    };

    const constructAddress = (location) => {
        if (!location) return 'N/A';
        if (typeof location === 'string') return location;
        const parts = [location.houseBuilding, location.street, location.city, location.state, location.pincode];
        return parts.filter(Boolean).join(', ') || 'N/A';
    };

    const navigateToSection = (section) => {
        setActiveSection(section);
        setSideMenuOpen(false);
        if (section === 'notifications') fetchNotifications();
        if (section === 'my-bookings') fetchJobs();
        if (section === 'my-profile') fetchCurrentUser();
        if (section === 'support-help') fetchFaqs();
    };

    const profilePicture = currentUser?.profilePictureUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.fullName || 'User')}&background=3b82f6&color=fff&bold=true`;

    // Menu Items Config
    const menuItems = [
        { id: 'home', icon: 'home', label: 'Home' },
        { id: 'my-bookings', icon: 'calendar-check', label: 'My Bookings' },
        { id: 'my-profile', icon: 'user-cog', label: 'My Profile' },
        { id: 'payments-offers', icon: 'wallet', label: 'Payments & Offers' },
        { id: 'support-help', icon: 'life-ring', label: 'Support & Help' },
        { id: 'notifications', icon: 'bell', label: 'Notifications' },
    ];

    // Loading State
    if (loading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-800 dark:to-indigo-950 ${darkMode ? 'dark' : ''}`}>
            {/* Toast Messages */}
            <AnimatePresence>
                {message && <Toast message={message.text} type={message.type} onClose={() => setMessage(null)} />}
            </AnimatePresence>

            {/* Header */}
            <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/50 dark:border-slate-700/50">
                <div className="flex items-center justify-between px-4 h-16">
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setSideMenuOpen(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                        <Icon name="bars" className="text-lg" />
                    </motion.button>

                    <motion.h1
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent"
                    >
                        TechSeva
                    </motion.h1>

                    <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => navigateToSection('my-profile')}
                        className="relative cursor-pointer"
                    >
                        <img
                            src={profilePicture}
                            alt="Profile"
                            className="w-10 h-10 rounded-xl object-cover border-2 border-primary-400 shadow-lg shadow-primary-500/20"
                        />
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900" />
                    </motion.div>
                </div>
            </header>

            {/* Side Menu Overlay */}
            <AnimatePresence>
                {sideMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setSideMenuOpen(false)}
                        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
                    />
                )}
            </AnimatePresence>

            {/* Side Menu */}
            <AnimatePresence>
                {sideMenuOpen && (
                    <motion.nav
                        variants={slideIn}
                        initial="initial"
                        animate="animate"
                        exit="exit"
                        className="fixed top-0 left-0 bottom-0 z-50 w-72 bg-white dark:bg-slate-900 shadow-2xl flex flex-col"
                    >
                        {/* Profile Section */}
                        <div className="p-6 bg-gradient-to-br from-primary-500 to-accent-600 text-white">
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: 'spring' }}
                                className="relative w-20 h-20 mx-auto mb-4"
                            >
                                <img
                                    src={profilePicture}
                                    alt="Profile"
                                    className="w-full h-full rounded-2xl object-cover border-4 border-white/30"
                                />
                            </motion.div>
                            <motion.h3
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-center font-bold text-lg"
                            >
                                {currentUser?.fullName || 'Guest User'}
                            </motion.h3>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                                className="text-center text-white/80 text-sm"
                            >
                                {currentUser?.email || 'guest@example.com'}
                            </motion.p>
                        </div>

                        {/* Menu Items */}
                        <div className="flex-1 overflow-y-auto py-4 px-3">
                            <motion.div variants={staggerContainer} initial="initial" animate="animate">
                                {menuItems.map((item, index) => (
                                    <motion.button
                                        key={item.id}
                                        variants={fadeInUp}
                                        onClick={() => navigateToSection(item.id)}
                                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl mb-1 transition-all duration-200 ${
                                            activeSection === item.id
                                                ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium'
                                                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                        }`}
                                    >
                                        <Icon name={item.icon} className="w-5 text-center" />
                                        <span>{item.label}</span>
                                        {item.id === 'notifications' && notifications.length > 0 && (
                                            <span className="ml-auto bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                                {notifications.length}
                                            </span>
                                        )}
                                    </motion.button>
                                ))}
                            </motion.div>

                            {/* Dark Mode Toggle */}
                            <motion.div
                                variants={fadeInUp}
                                className="mt-4 px-4 py-3 flex items-center justify-between"
                            >
                                <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
                                    <Icon name="moon" />
                                    <span>Dark Mode</span>
                                </div>
                                <button
                                    onClick={() => setDarkMode(!darkMode)}
                                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                                        darkMode ? 'bg-primary-500' : 'bg-slate-300'
                                    }`}
                                >
                                    <motion.div
                                        animate={{ x: darkMode ? 24 : 2 }}
                                        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                                        className="absolute top-1 w-4 h-4 bg-white rounded-full shadow"
                                    />
                                </button>
                            </motion.div>
                        </div>

                        {/* Logout Button */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleLogout}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-medium hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                                <Icon name="sign-out-alt" />
                                <span>Logout</span>
                            </motion.button>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="pt-20 pb-24 px-4 max-w-2xl mx-auto">
                <AnimatePresence mode="wait">
                    {/* HOME SECTION */}
                    {activeSection === 'home' && (
                        <motion.div
                            key="home"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            {/* Welcome Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative overflow-hidden bg-gradient-to-br from-primary-500 via-primary-600 to-accent-600 rounded-3xl p-6 text-white shadow-2xl shadow-primary-500/25"
                            >
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
                                
                                <div className="relative">
                                    <p className="text-white/80 text-sm mb-1">Welcome back,</p>
                                    <h2 className="text-2xl font-bold mb-2">{currentUser?.fullName || 'User'}! 👋</h2>
                                    <p className="text-white/80 text-sm">Ready to book your next service?</p>
                                </div>

                                <div className="relative mt-4 flex gap-4">
                                    <div className="flex-1 bg-white/20 backdrop-blur rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold">{jobs.length}</p>
                                        <p className="text-xs text-white/80">Total Bookings</p>
                                    </div>
                                    <div className="flex-1 bg-white/20 backdrop-blur rounded-xl p-3 text-center">
                                        <p className="text-2xl font-bold">{jobs.filter(j => ['Pending', 'Accepted', 'In Progress'].includes(j.status)).length}</p>
                                        <p className="text-xs text-white/80">Active</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Book Service Form */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 flex items-center justify-center text-white shadow-lg shadow-primary-500/30">
                                        <Icon name="tools" className="text-xl" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Book a Service</h2>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Get expert repair at your doorstep</p>
                                    </div>
                                </div>

                                <form onSubmit={handleBookingSubmit} className="space-y-5">
                                    {/* Appliance Select */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            <Icon name="tv" className="mr-2 text-primary-500" />
                                            Select Appliance
                                        </label>
                                        <select
                                            value={bookingData.applianceType}
                                            onChange={(e) => setBookingData({ ...bookingData, applianceType: e.target.value })}
                                            className="input"
                                            required
                                        >
                                            <option value="">-- Select Appliance Type --</option>
                                            {applianceTypes.map(type => (
                                                <option key={type._id} value={type.name}>{type.name}</option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Location Section */}
                                    <div className="space-y-4">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                                            <Icon name="map-marker-alt" className="mr-2 text-primary-500" />
                                            Service Location
                                        </label>

                                        <div className="grid grid-cols-2 gap-3">
                                            <input
                                                type="text"
                                                value={bookingData.pincode}
                                                onChange={(e) => setBookingData({ ...bookingData, pincode: e.target.value })}
                                                placeholder="Pincode"
                                                className="input"
                                                required
                                            />
                                            <input
                                                type="text"
                                                value={bookingData.state}
                                                onChange={(e) => setBookingData({ ...bookingData, state: e.target.value })}
                                                placeholder="State"
                                                className="input"
                                                required
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={bookingData.city}
                                            onChange={(e) => setBookingData({ ...bookingData, city: e.target.value })}
                                            placeholder="City"
                                            className="input"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={bookingData.houseBuilding}
                                            onChange={(e) => setBookingData({ ...bookingData, houseBuilding: e.target.value })}
                                            placeholder="House No., Building Name"
                                            className="input"
                                            required
                                        />
                                        <input
                                            type="text"
                                            value={bookingData.street}
                                            onChange={(e) => setBookingData({ ...bookingData, street: e.target.value })}
                                            placeholder="Road name, Area, Colony"
                                            className="input"
                                            required
                                        />

                                        <div className="flex gap-2">
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={(e) => getGeolocation(
                                                    (addr) => setBookingData(prev => ({ ...prev, ...addr })),
                                                    e.currentTarget
                                                )}
                                                className="flex-1 btn-secondary text-sm"
                                            >
                                                <Icon name="crosshairs" /> GPS Location
                                            </motion.button>
                                            <motion.button
                                                type="button"
                                                whileHover={{ scale: 1.02 }}
                                                whileTap={{ scale: 0.98 }}
                                                onClick={useProfileAddress}
                                                className="flex-1 btn-secondary text-sm"
                                            >
                                                <Icon name="user" /> Profile Address
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Date Time */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            <Icon name="calendar-alt" className="mr-2 text-primary-500" />
                                            Preferred Date & Time
                                        </label>
                                        <input
                                            type="datetime-local"
                                            value={bookingData.scheduledDateTime}
                                            onChange={(e) => setBookingData({ ...bookingData, scheduledDateTime: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>

                                    {/* Notes */}
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                            <Icon name="sticky-note" className="mr-2 text-primary-500" />
                                            Additional Notes (Optional)
                                        </label>
                                        <textarea
                                            value={bookingData.notes}
                                            onChange={(e) => setBookingData({ ...bookingData, notes: e.target.value })}
                                            placeholder="Any specific issues or requirements..."
                                            className="textarea"
                                            rows={3}
                                        />
                                    </div>

                                    <motion.button
                                        type="submit"
                                        disabled={isSubmitting}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full btn-primary py-4 text-base"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Icon name="spinner" className="animate-spin" /> Booking...
                                            </>
                                        ) : (
                                            <>
                                                <Icon name="calendar-check" /> Book Service
                                            </>
                                        )}
                                    </motion.button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* MY BOOKINGS SECTION */}
                    {activeSection === 'my-bookings' && (
                        <motion.div
                            key="bookings"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg">
                                    <Icon name="calendar-check" className="text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">My Bookings</h2>
                                    <p className="text-sm text-slate-500">{jobs.length} total bookings</p>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
                                {['booked', 'upcoming', 'ongoing', 'history'].map(filter => (
                                    <motion.button
                                        key={filter}
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        onClick={() => setBookingFilter(filter)}
                                        className={`px-4 py-2 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                                            bookingFilter === filter
                                                ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30'
                                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                                        }`}
                                    >
                                        {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                    </motion.button>
                                ))}
                            </div>

                            {/* Bookings List */}
                            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-4">
                                {getFilteredJobs().length === 0 ? (
                                    <motion.div
                                        variants={scaleIn}
                                        className="text-center py-16"
                                    >
                                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Icon name="calendar-times" className="text-4xl text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400">No {bookingFilter} bookings</p>
                                    </motion.div>
                                ) : (
                                    getFilteredJobs().map(job => (
                                        <BookingCard
                                            key={job._id || job.jobId}
                                            job={job}
                                            onCancel={handleCancelJob}
                                            onPay={handleInstantPayment}
                                            onReview={(job) => {
                                                setReviewData({ jobId: job.jobId, reviewText: '' });
                                                setSelectedRating(0);
                                                setActiveSection('leave-review');
                                            }}
                                            onTrack={(job) => {
                                                setTrackingJob(job);
                                                setActiveSection('tracking');
                                            }}
                                            onDownloadInvoice={handleDownloadInvoice}
                                            onDownloadWarranty={handleDownloadWarranty}
                                            onWarrantyClaim={handleWarrantyClaim}
                                            onViewProof={handleViewProof}
                                            constructAddress={constructAddress}
                                        />
                                    ))
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* MY PROFILE SECTION */}
                    {activeSection === 'my-profile' && (
                        <motion.div
                            key="profile"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            {/* Profile Header */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="relative bg-gradient-to-br from-primary-500 to-accent-600 rounded-3xl p-6 text-white text-center overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-[url('data:image/svg+xml,...')] opacity-10" />
                                
                                <motion.div
                                    whileHover={{ scale: 1.05 }}
                                    onClick={() => profilePictureInputRef.current?.click()}
                                    className="relative w-28 h-28 mx-auto mb-4 cursor-pointer group"
                                >
                                    <img
                                        src={profilePicture}
                                        alt="Profile"
                                        className="w-full h-full rounded-3xl object-cover border-4 border-white/30 shadow-2xl"
                                    />
                                    <div className="absolute inset-0 bg-black/50 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <Icon name="camera" className="text-2xl" />
                                    </div>
                                </motion.div>
                                <input
                                    type="file"
                                    ref={profilePictureInputRef}
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    className="hidden"
                                />
                                <h2 className="text-xl font-bold">{currentUser?.fullName}</h2>
                                <p className="text-white/80 text-sm">{currentUser?.email}</p>
                            </motion.div>

                            {/* Profile Form */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6"
                            >
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                    <Icon name="user-edit" className="text-primary-500" />
                                    Edit Profile
                                </h3>

                                <form onSubmit={handleProfileUpdate} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={profileData.fullName}
                                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Email</label>
                                        <input
                                            type="email"
                                            value={profileData.email}
                                            className="input opacity-60"
                                            disabled
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={profileData.phoneNumber}
                                            onChange={(e) => setProfileData({ ...profileData, phoneNumber: e.target.value })}
                                            className="input"
                                            required
                                        />
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-slate-700 pt-5">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">
                                            <Icon name="map-marker-alt" className="mr-2 text-primary-500" />
                                            Address
                                        </label>

                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <input
                                                type="text"
                                                value={profileData.pincode}
                                                onChange={(e) => setProfileData({ ...profileData, pincode: e.target.value })}
                                                placeholder="Pincode"
                                                className="input"
                                            />
                                            <input
                                                type="text"
                                                value={profileData.state}
                                                onChange={(e) => setProfileData({ ...profileData, state: e.target.value })}
                                                placeholder="State"
                                                className="input"
                                            />
                                        </div>
                                        <input
                                            type="text"
                                            value={profileData.city}
                                            onChange={(e) => setProfileData({ ...profileData, city: e.target.value })}
                                            placeholder="City"
                                            className="input mb-3"
                                        />
                                        <input
                                            type="text"
                                            value={profileData.houseBuilding}
                                            onChange={(e) => setProfileData({ ...profileData, houseBuilding: e.target.value })}
                                            placeholder="House No., Building Name"
                                            className="input mb-3"
                                        />
                                        <input
                                            type="text"
                                            value={profileData.street}
                                            onChange={(e) => setProfileData({ ...profileData, street: e.target.value })}
                                            placeholder="Road name, Area, Colony"
                                            className="input mb-3"
                                        />

                                        <motion.button
                                            type="button"
                                            whileHover={{ scale: 1.02 }}
                                            whileTap={{ scale: 0.98 }}
                                            onClick={(e) => getGeolocation(
                                                (addr) => setProfileData(prev => ({ ...prev, ...addr })),
                                                e.currentTarget
                                            )}
                                            className="w-full btn-secondary"
                                        >
                                            <Icon name="crosshairs" /> Use Current Location
                                        </motion.button>
                                    </div>

                                    <motion.button
                                        type="submit"
                                        disabled={isSubmitting}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full btn-primary py-4"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Icon name="spinner" className="animate-spin" /> Updating...
                                            </>
                                        ) : (
                                            <>
                                                <Icon name="save" /> Update Profile
                                            </>
                                        )}
                                    </motion.button>
                                </form>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* PAYMENTS & OFFERS SECTION */}
                    {activeSection === 'payments-offers' && (
                        <motion.div
                            key="payments"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            {/* Balance Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white"
                            >
                                <p className="text-white/80 text-sm mb-1">Wallet Balance</p>
                                <h2 className="text-4xl font-bold mb-4">₹{(currentUser?.balance || 0).toFixed(2)}</h2>
                                <div className="flex gap-3">
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex-1 bg-white/20 backdrop-blur rounded-xl py-3 font-medium hover:bg-white/30 transition-colors"
                                    >
                                        <Icon name="plus-circle" className="mr-2" /> Add Money
                                    </motion.button>
                                    <motion.button
                                        whileHover={{ scale: 1.05 }}
                                        whileTap={{ scale: 0.95 }}
                                        className="flex-1 bg-white/20 backdrop-blur rounded-xl py-3 font-medium hover:bg-white/30 transition-colors"
                                    >
                                        <Icon name="history" className="mr-2" /> History
                                    </motion.button>
                                </div>
                            </motion.div>

                            {/* Offers */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6"
                            >
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Icon name="gift" className="text-pink-500" />
                                    Special Offers
                                </h3>
                                <div className="space-y-3">
                                    <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl border border-pink-200/50 dark:border-pink-800/30">
                                        <p className="font-semibold text-slate-900 dark:text-white">FIRST50</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Get 50% off on your first booking</p>
                                    </div>
                                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-2xl border border-amber-200/50 dark:border-amber-800/30">
                                        <p className="font-semibold text-slate-900 dark:text-white">REFER100</p>
                                        <p className="text-sm text-slate-600 dark:text-slate-400">Refer a friend & get ₹100 cashback</p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Payment Methods */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6"
                            >
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Icon name="credit-card" className="text-blue-500" />
                                    Payment Methods
                                </h3>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full btn-secondary"
                                >
                                    <Icon name="plus" /> Add Payment Method
                                </motion.button>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* SUPPORT & HELP SECTION */}
                    {activeSection === 'support-help' && (
                        <motion.div
                            key="support"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            {/* Support Ticket Form */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6"
                            >
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Icon name="headset" className="text-primary-500" />
                                    Submit a Ticket
                                </h3>
                                <form onSubmit={handleTicketSubmit} className="space-y-4">
                                    <input
                                        type="text"
                                        value={ticketData.subject}
                                        onChange={(e) => setTicketData({ ...ticketData, subject: e.target.value })}
                                        placeholder="Subject"
                                        className="input"
                                        required
                                    />
                                    <textarea
                                        value={ticketData.description}
                                        onChange={(e) => setTicketData({ ...ticketData, description: e.target.value })}
                                        placeholder="Describe your issue..."
                                        className="textarea"
                                        rows={4}
                                        required
                                    />
                                    <motion.button
                                        type="submit"
                                        disabled={isSubmitting}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full btn-primary"
                                    >
                                        {isSubmitting ? <Icon name="spinner" className="animate-spin mr-2" /> : <Icon name="paper-plane" className="mr-2" />}
                                        Submit Ticket
                                    </motion.button>
                                </form>
                            </motion.div>

                            {/* FAQs */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6"
                            >
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Icon name="question-circle" className="text-amber-500" />
                                    FAQs
                                </h3>
                                <div className="space-y-3">
                                    {faqs.length === 0 ? (
                                        <p className="text-slate-500 dark:text-slate-400 text-center py-4">Loading FAQs...</p>
                                    ) : (
                                        faqs.map((faq, index) => (
                                            <details key={index} className="group">
                                                <summary className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl cursor-pointer list-none">
                                                    <span className="font-medium text-slate-900 dark:text-white pr-4">{faq.question}</span>
                                                    <Icon name="chevron-down" className="text-slate-400 group-open:rotate-180 transition-transform" />
                                                </summary>
                                                <div className="p-4 text-slate-600 dark:text-slate-300 text-sm">
                                                    {faq.answer}
                                                </div>
                                            </details>
                                        ))
                                    )}
                                </div>
                            </motion.div>

                            {/* Contact Info */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6"
                            >
                                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Icon name="phone-alt" className="text-emerald-500" />
                                    Contact Us
                                </h3>
                                <div className="space-y-4">
                                    <a href="mailto:achhutanandjha1@gmail.com" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <Icon name="envelope" className="text-blue-500" />
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300">achhutanandjha1@gmail.com</span>
                                    </a>
                                    <a href="tel:+918439131459" className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                            <Icon name="phone" className="text-emerald-500" />
                                        </div>
                                        <span className="text-slate-700 dark:text-slate-300">+91 84391 31459</span>
                                    </a>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}

                    {/* NOTIFICATIONS SECTION */}
                    {activeSection === 'notifications' && (
                        <motion.div
                            key="notifications"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                                    <Icon name="bell" className="text-xl" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Notifications</h2>
                                    <p className="text-sm text-slate-500">{notifications.length} updates</p>
                                </div>
                            </div>

                            <motion.div variants={staggerContainer} initial="initial" animate="animate" className="space-y-3">
                                {notifications.length === 0 ? (
                                    <motion.div
                                        variants={scaleIn}
                                        className="text-center py-16"
                                    >
                                        <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                                            <Icon name="bell-slash" className="text-4xl text-slate-400" />
                                        </div>
                                        <p className="text-slate-500 dark:text-slate-400">No notifications yet</p>
                                    </motion.div>
                                ) : (
                                    notifications.map((notification, index) => (
                                        <motion.div
                                            key={index}
                                            variants={fadeInUp}
                                            className={`p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-soft border-l-4 ${
                                                notification.read ? 'border-slate-300' : 'border-primary-500'
                                            }`}
                                        >
                                            <h4 className="font-semibold text-slate-900 dark:text-white mb-1">{notification.title}</h4>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{notification.content}</p>
                                            <span className="text-xs text-slate-400">{new Date(notification.publishedOn).toLocaleString()}</span>
                                        </motion.div>
                                    ))
                                )}
                            </motion.div>
                        </motion.div>
                    )}

                    {/* LEAVE REVIEW SECTION */}
                    {activeSection === 'leave-review' && (
                        <motion.div
                            key="review"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-6"
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-white dark:bg-slate-800 rounded-3xl shadow-soft p-6"
                            >
                                <div className="text-center mb-6">
                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shadow-lg">
                                        <Icon name="star" className="text-2xl" />
                                    </div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Leave a Review</h2>
                                    <p className="text-slate-500 dark:text-slate-400">Help us improve our service</p>
                                </div>

                                <form onSubmit={handleReviewSubmit} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Job ID</label>
                                        <input
                                            type="text"
                                            value={reviewData.jobId}
                                            onChange={(e) => setReviewData({ ...reviewData, jobId: e.target.value })}
                                            placeholder="Enter Job ID (e.g., J004)"
                                            className="input"
                                            required
                                        />
                                    </div>

                                    <div className="text-center">
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-4">Your Rating</label>
                                        <StarRating rating={selectedRating} setRating={setSelectedRating} size="text-4xl" />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Your Review</label>
                                        <textarea
                                            value={reviewData.reviewText}
                                            onChange={(e) => setReviewData({ ...reviewData, reviewText: e.target.value })}
                                            placeholder="Share your experience with us..."
                                            className="textarea"
                                            rows={4}
                                        />
                                    </div>

                                    <motion.button
                                        type="submit"
                                        disabled={isSubmitting || selectedRating === 0}
                                        whileHover={{ scale: 1.02 }}
                                        whileTap={{ scale: 0.98 }}
                                        className="w-full btn-primary py-4"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Icon name="spinner" className="animate-spin" /> Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Icon name="paper-plane" /> Submit Review
                                            </>
                                        )}
                                    </motion.button>
                                </form>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => setActiveSection('my-bookings')}
                                className="w-full btn-secondary"
                            >
                                <Icon name="arrow-left" /> Back to Bookings
                            </motion.button>
                        </motion.div>
                    )}

                    {/* LIVE TRACKING SECTION */}
                    {activeSection === 'tracking' && trackingJob && (
                        <motion.div
                            key="tracking"
                            variants={fadeInUp}
                            initial="initial"
                            animate="animate"
                            exit="exit"
                            className="space-y-4"
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Track Technician</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">Job #{trackingJob.jobId}</p>
                                </div>
                                <motion.button
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => {
                                        setTrackingJob(null);
                                        setActiveSection('my-bookings');
                                    }}
                                    className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800"
                                >
                                    <Icon name="times" className="text-slate-600 dark:text-slate-400" />
                                </motion.button>
                            </div>

                            {/* Live Tracking Map Component */}
                            <TrackingSection job={trackingJob} darkMode={darkMode} />

                            {/* Job Info Card */}
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-lg border border-slate-100 dark:border-slate-700"
                            >
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Job Details</h3>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                                            <Icon name="tools" className="text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-500">Appliance</p>
                                            <p className="font-medium text-slate-900 dark:text-white">{trackingJob.applianceType}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                                            <Icon name="user-cog" className="text-purple-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs text-slate-500">Technician</p>
                                            <p className="font-medium text-slate-900 dark:text-white">{trackingJob.assignedTechnicianName || 'Assigned'}</p>
                                        </div>
                                        {trackingJob.technicianPhoneNumber && (
                                            <motion.a
                                                whileTap={{ scale: 0.9 }}
                                                href={`tel:${trackingJob.technicianPhoneNumber}`}
                                                className="p-2 bg-emerald-500 text-white rounded-xl"
                                            >
                                                <Icon name="phone" />
                                            </motion.a>
                                        )}
                                    </div>
                                </div>
                            </motion.div>

                            <motion.button
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                onClick={() => {
                                    setTrackingJob(null);
                                    setActiveSection('my-bookings');
                                }}
                                className="w-full btn-secondary"
                            >
                                <Icon name="arrow-left" /> Back to Bookings
                            </motion.button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* Bottom Tab Bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200/50 dark:border-slate-700/50 px-2 py-2 safe-area-inset-bottom">
                <div className="flex justify-around max-w-md mx-auto">
                    {[
                        { id: 'home', icon: 'home', label: 'Home' },
                        { id: 'my-bookings', icon: 'calendar-check', label: 'Bookings' },
                        { id: 'notifications', icon: 'bell', label: 'Alerts' },
                        { id: 'support-help', icon: 'life-ring', label: 'Help' },
                    ].map((tab) => (
                        <motion.button
                            key={tab.id}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigateToSection(tab.id)}
                            className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-all ${
                                activeSection === tab.id
                                    ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                                    : 'text-slate-500 dark:text-slate-400'
                            }`}
                        >
                            <Icon name={tab.icon} className="text-xl" />
                            <span className="text-xs font-medium">{tab.label}</span>
                        </motion.button>
                    ))}
                </div>
            </nav>

            {/* Floating Action Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigateToSection('home')}
                className="fixed bottom-24 right-4 z-30 w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-500 to-accent-600 text-white shadow-xl shadow-primary-500/30 flex items-center justify-center"
            >
                <Icon name="plus" className="text-2xl" />
            </motion.button>
        </div>
    );
};

export default UserDashboard;
