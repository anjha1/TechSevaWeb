/**
 * Dashboard Layout
 * Layout for authenticated dashboard pages
 */

import React, { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const DashboardLayout = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getSidebarLinks = () => {
        const roleLinks = {
            user: [
                { to: '/user', label: 'Dashboard', icon: '🏠' },
                { to: '/user/bookings', label: 'My Bookings', icon: '📋' },
                { to: '/user/profile', label: 'Profile', icon: '👤' }
            ],
            technician: [
                { to: '/technician', label: 'Dashboard', icon: '🏠' },
                { to: '/technician/jobs', label: 'Jobs', icon: '🔧' },
                { to: '/technician/earnings', label: 'Earnings', icon: '💰' },
                { to: '/technician/settings', label: 'Settings', icon: '⚙️' }
            ],
            Superadmin: [
                { to: '/superadmin', label: 'Dashboard', icon: '🏠' },
                { to: '/superadmin/users', label: 'Users', icon: '👥' },
                { to: '/superadmin/jobs', label: 'Jobs', icon: '📋' },
                { to: '/superadmin/technicians', label: 'Technicians', icon: '🔧' },
                { to: '/superadmin/settings', label: 'Settings', icon: '⚙️' }
            ]
        };
        return roleLinks[user?.role] || [];
    };

    return (
        <div className="dashboard-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
                <div className="sidebar-header">
                    <Link to="/" className="logo">
                        <span className="logo-icon">🔧</span>
                        {sidebarOpen && <span className="logo-text">TechSeva</span>}
                    </Link>
                    <button 
                        className="sidebar-toggle" 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                    >
                        {sidebarOpen ? '◀' : '▶'}
                    </button>
                </div>
                
                <nav className="sidebar-nav">
                    {getSidebarLinks().map((link) => (
                        <Link 
                            key={link.to} 
                            to={link.to} 
                            className="sidebar-link"
                        >
                            <span className="link-icon">{link.icon}</span>
                            {sidebarOpen && <span className="link-label">{link.label}</span>}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button onClick={handleLogout} className="logout-btn">
                        <span className="link-icon">🚪</span>
                        {sidebarOpen && <span className="link-label">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="dashboard-main">
                <header className="dashboard-header">
                    <div className="header-left">
                        <h1>Welcome, {user?.fullName || 'User'}</h1>
                    </div>
                    <div className="header-right">
                        <span className="user-role">{user?.role}</span>
                        <div className="user-avatar">
                            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                    </div>
                </header>
                
                <main className="dashboard-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
