/**
 * App Component
 * Main application component with route definitions
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Auth Pages
import { LoginPage, SignupPage, ForgotPasswordPage, AdminLoginPage } from './pages/auth';

// Public Pages
import { HomePage, ContactPage, HowItWorksPage } from './pages/public';

// Utility Pages
import DiagnosisPage from './pages/DiagnosisPage';
import PaymentPage from './pages/PaymentPage';
import PhoneUpdatePage from './pages/PhoneUpdatePage';

// Dashboard Pages
import UserDashboard from './pages/dashboards/UserDashboard';
import TechnicianDashboard from './pages/dashboards/TechnicianDashboard';
import SuperAdminDashboard from './pages/dashboards/SuperAdminDashboard';
import CityManagerDashboard from './pages/dashboards/CityManagerDashboard';
import ServiceAdminDashboard from './pages/dashboards/ServiceAdminDashboard';
import FinanceOfficerDashboard from './pages/dashboards/FinanceOfficerDashboard';
import SupportAgentDashboard from './pages/dashboards/SupportAgentDashboard';

// Route Guards
const ProtectedRoute = ({ children, allowedRoles }) => {
    const { user, loading } = useAuth();
    
    if (loading) {
        return <div className="loading">Loading...</div>;
    }
    
    if (!user) {
        return <Navigate to="/login" replace />;
    }
    
    if (allowedRoles && !allowedRoles.includes(user.role)) {
        return <Navigate to="/" replace />;
    }
    
    return children;
};

const App = () => {
    return (
        <Routes>
            {/* Public Routes */}
            <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/contact" element={<ContactPage />} />
                <Route path="/how-it-works" element={<HowItWorksPage />} />
                <Route path="/admin-login" element={<AdminLoginPage />} />
            </Route>

            {/* Protected Routes (No Layout - Full Page Dashboards) */}
            <Route 
                path="/user-dashboard" 
                element={
                    <ProtectedRoute allowedRoles={['user']}>
                        <UserDashboard />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/technician-dashboard" 
                element={
                    <ProtectedRoute allowedRoles={['technician']}>
                        <TechnicianDashboard />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/diagnosis/:jobId" 
                element={
                    <ProtectedRoute allowedRoles={['technician']}>
                        <DiagnosisPage />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/payment/:jobId" 
                element={
                    <ProtectedRoute allowedRoles={['user']}>
                        <PaymentPage />
                    </ProtectedRoute>
                } 
            />
            <Route 
                path="/phone-update" 
                element={
                    <ProtectedRoute>
                        <PhoneUpdatePage />
                    </ProtectedRoute>
                } 
            />

            {/* Admin Dashboard Routes */}
            <Route element={<DashboardLayout />}>
                <Route 
                    path="/superadmin-dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['Superadmin', 'superadmin']}>
                            <SuperAdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/citymanager-dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['Citymanager', 'citymanager']}>
                            <CityManagerDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/serviceadmin-dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['Serviceadmin', 'serviceadmin']}>
                            <ServiceAdminDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/financeofficer-dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['Financeofficer', 'financeofficer']}>
                            <FinanceOfficerDashboard />
                        </ProtectedRoute>
                    } 
                />
                <Route 
                    path="/supportagent-dashboard" 
                    element={
                        <ProtectedRoute allowedRoles={['Supportagent', 'supportagent']}>
                            <SupportAgentDashboard />
                        </ProtectedRoute>
                    } 
                />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
};

export default App;
