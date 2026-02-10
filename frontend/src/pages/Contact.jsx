/**
 * Contact Page
 * Contact form for inquiries
 */

import React, { useState } from 'react';
import api from '../services/api';

const Contact = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [status, setStatus] = useState({ type: '', message: '' });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatus({ type: '', message: '' });

        try {
            await api.post('/contact', formData);
            setStatus({ type: 'success', message: 'Message sent successfully! We will get back to you soon.' });
            setFormData({ name: '', email: '', phone: '', subject: '', message: '' });
        } catch (err) {
            setStatus({ 
                type: 'error', 
                message: err.response?.data?.message || 'Failed to send message. Please try again.' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page">
            <div className="contact-container">
                <div className="contact-info">
                    <h1>Get in Touch</h1>
                    <p>Have questions or need help? We're here for you!</p>
                    
                    <div className="contact-details">
                        <div className="detail-item">
                            <span className="icon">📧</span>
                            <div>
                                <h3>Email</h3>
                                <p>support@techseva.com</p>
                            </div>
                        </div>
                        <div className="detail-item">
                            <span className="icon">📞</span>
                            <div>
                                <h3>Phone</h3>
                                <p>+91 1800-123-4567</p>
                            </div>
                        </div>
                        <div className="detail-item">
                            <span className="icon">📍</span>
                            <div>
                                <h3>Address</h3>
                                <p>123 Tech Street, Bangalore, India</p>
                            </div>
                        </div>
                        <div className="detail-item">
                            <span className="icon">🕐</span>
                            <div>
                                <h3>Hours</h3>
                                <p>Mon-Sat: 9AM - 8PM</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="contact-form-container">
                    <h2>Send us a Message</h2>
                    
                    {status.message && (
                        <div className={`alert alert-${status.type}`}>{status.message}</div>
                    )}

                    <form onSubmit={handleSubmit} className="contact-form">
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="name">Name</label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="form-control"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="form-control"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="phone">Phone</label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="form-control"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="subject">Subject</label>
                                <input
                                    type="text"
                                    id="subject"
                                    name="subject"
                                    value={formData.subject}
                                    onChange={handleChange}
                                    className="form-control"
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label htmlFor="message">Message</label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                className="form-control"
                                rows="5"
                                required
                            ></textarea>
                        </div>

                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Message'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Contact;
