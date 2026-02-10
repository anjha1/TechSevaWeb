import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Header.css';

const Header = () => {
    const [menuOpen, setMenuOpen] = useState(false);
    const location = useLocation();
    const { user } = useAuth();

    const isActive = (path) => location.pathname === path ? 'active' : '';

    return (
        <header className="main-header">
            <Link to="/" className="logo">
                <span className="logo-icon">🔧</span> TechSeva
            </Link>
            
            <button 
                className="menu-toggle" 
                onClick={() => setMenuOpen(!menuOpen)}
            >
                ☰
            </button>
            
            <nav className={`nav-menu ${menuOpen ? 'open' : ''}`}>
                <li className="nav-item">
                    <Link to="/" className={isActive('/')}>Home</Link>
                </li>
                <li className="nav-item">
                    <Link to="/how-it-works" className={isActive('/how-it-works')}>How It Works</Link>
                </li>
                <li className="nav-item">
                    <Link to="/contact" className={isActive('/contact')}>Contact</Link>
                </li>
                <li className="nav-item">
                    {user ? (
                        <Link to={`/${user.role}`} className="dashboard-link">
                            Dashboard
                        </Link>
                    ) : (
                        <Link to="/login">Login/Signup</Link>
                    )}
                </li>
            </nav>
        </header>
    );
};

export default Header;
