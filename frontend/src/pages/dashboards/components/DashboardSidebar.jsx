import React from 'react';

const DashboardSidebar = ({
    isOpen,
    onClose,
    user,
    menuItems,
    activeSection,
    onSectionChange,
    onLogout,
    darkMode,
    onToggleDarkMode
}) => {
    const handleItemClick = (id) => {
        onSectionChange(id);
        onClose();
    };

    return (
        <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
            {/* Profile Section */}
            <div className="sidebar-profile">
                <div className="profile-avatar">
                    {user?.profilePhoto ? (
                        <img src={user.profilePhoto} alt="Profile" />
                    ) : (
                        <i className="fas fa-user"></i>
                    )}
                </div>
                <div className="profile-info">
                    <h3>{user?.fullName || 'User'}</h3>
                    <p>{user?.email || ''}</p>
                </div>
            </div>

            {/* Menu Items */}
            <nav className="sidebar-menu">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        className={`menu-item ${activeSection === item.id ? 'active' : ''}`}
                        onClick={() => handleItemClick(item.id)}
                    >
                        <i className={item.icon}></i>
                        <span>{item.label}</span>
                    </button>
                ))}

                <div className="menu-divider"></div>

                {/* Dark Mode Toggle */}
                <button className="menu-item" onClick={onToggleDarkMode}>
                    <i className={`fas ${darkMode ? 'fa-sun' : 'fa-moon'}`}></i>
                    <span>{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>

                {/* Logout */}
                <button className="menu-item danger" onClick={onLogout}>
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Logout</span>
                </button>
            </nav>
        </aside>
    );
};

export default DashboardSidebar;
