import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Footer.css';

const Footer = () => {
    return (
        <footer className="main-footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>TechSeva</h3>
                    <p>Your trusted partner for appliance repair services across India.</p>
                </div>
                
                <div className="footer-section">
                    <h4>Quick Links</h4>
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/how-it-works">How It Works</Link></li>
                        <li><Link to="/contact">Contact</Link></li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h4>Services</h4>
                    <ul>
                        <li>AC Repair</li>
                        <li>Refrigerator Repair</li>
                        <li>Washing Machine</li>
                        <li>Laptop & Computer</li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h4>Contact</h4>
                    <p><i className="fas fa-envelope"></i> support@techseva.com</p>
                    <p><i className="fas fa-phone"></i> +91-XXXXXXXXXX</p>
                    <div className="social-links">
                        <a href="#"><i className="fab fa-facebook"></i></a>
                        <a href="#"><i className="fab fa-twitter"></i></a>
                        <a href="#"><i className="fab fa-instagram"></i></a>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} TechSeva. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;
