import React from 'react';

const DashboardHeader = ({ user, onMenuClick, darkMode, onToggleDarkMode }) => {
    return (
        <header className="dashboard-header">
            <button className="menu-toggle" onClick={onMenuClick}>
                <i className="fas fa-bars"></i>
            </button>

            <div className="header-logo">
                <span className="logo-icon">🔧</span> TechSeva
            </div>

            <div className="header-actions">
                <button className="header-btn" onClick={onToggleDarkMode}>
                    <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                </button>
                
                <div className="profile-mini">
                    {user?.profilePhoto ? (
                        <img src={user.profilePhoto} alt="Profile" />
                    ) : (
                        <i className="fas fa-user"></i>
                    )}
                </div>
            </div>
        </header>
    );
};

export default DashboardHeader;
