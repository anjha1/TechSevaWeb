import React, { useState } from 'react';
import { Header, Footer } from '../../components';
import { useMessage } from '../../components/MessageBox';
import { ButtonLoader } from '../../components/LoadingSpinner';
import api from '../../services/api';
import '../../styles/Contact.css';

const ContactPage = () => {
    const { showMessage } = useMessage();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.name || !formData.email || !formData.message) {
            showMessage('Please fill all required fields.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/contact', formData);
            
            if (response.data.success) {
                showMessage('Message sent successfully! We\'ll get back to you soon.', 'success');
                setFormData({
                    name: '',
                    email: '',
                    phone: '',
                    subject: '',
                    message: ''
                });
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to send message. Please try again.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="contact-page">
            <Header />
            
            {/* Hero Section */}
            <section className="contact-hero">
                <div className="container">
                    <h1>Contact Us</h1>
                    <p>We're here to help! Reach out to us with any questions or concerns.</p>
                </div>
            </section>

            {/* Main Content */}
            <section className="contact-content">
                <div className="container">
                    <div className="contact-grid">
                        {/* Contact Information */}
                        <div className="contact-info">
                            <h2>Get in Touch</h2>
                            <p>Have questions about our services? Need help with a booking? Our team is ready to assist you.</p>
                            
                            <div className="info-cards">
                                <div className="info-card">
                                    <div className="info-icon">
                                        <i className="fas fa-phone"></i>
                                    </div>
                                    <div className="info-content">
                                        <h3>Phone</h3>
                                        <p>+91-XXXXXXXXXX</p>
                                        <p className="sub">Mon-Sat, 9AM-8PM</p>
                                    </div>
                                </div>
                                
                                <div className="info-card">
                                    <div className="info-icon">
                                        <i className="fas fa-envelope"></i>
                                    </div>
                                    <div className="info-content">
                                        <h3>Email</h3>
                                        <p>support@techseva.com</p>
                                        <p className="sub">24/7 Support</p>
                                    </div>
                                </div>
                                
                                <div className="info-card">
                                    <div className="info-icon">
                                        <i className="fas fa-map-marker-alt"></i>
                                    </div>
                                    <div className="info-content">
                                        <h3>Office</h3>
                                        <p>TechSeva Headquarters</p>
                                        <p className="sub">Bangalore, India</p>
                                    </div>
                                </div>
                                
                                <div className="info-card">
                                    <div className="info-icon">
                                        <i className="fas fa-comments"></i>
                                    </div>
                                    <div className="info-content">
                                        <h3>Live Chat</h3>
                                        <p>Available on our app</p>
                                        <p className="sub">Instant Support</p>
                                    </div>
                                </div>
                            </div>

                            <div className="social-section">
                                <h3>Follow Us</h3>
                                <div className="social-links">
                                    <a href="#" className="social-link facebook">
                                        <i className="fab fa-facebook-f"></i>
                                    </a>
                                    <a href="#" className="social-link twitter">
                                        <i className="fab fa-twitter"></i>
                                    </a>
                                    <a href="#" className="social-link instagram">
                                        <i className="fab fa-instagram"></i>
                                    </a>
                                    <a href="#" className="social-link linkedin">
                                        <i className="fab fa-linkedin-in"></i>
                                    </a>
                                    <a href="#" className="social-link youtube">
                                        <i className="fab fa-youtube"></i>
                                    </a>
                                </div>
                            </div>
                        </div>

                        {/* Contact Form */}
                        <div className="contact-form-section">
                            <h2>Send us a Message</h2>
                            <p>Fill out the form below and we'll get back to you within 24 hours.</p>
                            
                            <form onSubmit={handleSubmit} className="contact-form">
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="name">Name *</label>
                                        <input
                                            type="text"
                                            id="name"
                                            name="name"
                                            placeholder="Your name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="email">Email *</label>
                                        <input
                                            type="email"
                                            id="email"
                                            name="email"
                                            placeholder="Your email"
                                            value={formData.email}
                                            onChange={handleChange}
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
                                            placeholder="Your phone number"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    
                                    <div className="form-group">
                                        <label htmlFor="subject">Subject</label>
                                        <input
                                            type="text"
                                            id="subject"
                                            name="subject"
                                            placeholder="Subject"
                                            value={formData.subject}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-group">
                                    <label htmlFor="message">Message *</label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        placeholder="How can we help you?"
                                        rows={6}
                                        value={formData.message}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <button type="submit" className="submit-btn" disabled={loading}>
                                    {loading ? <ButtonLoader /> : (
                                        <>
                                            <i className="fas fa-paper-plane"></i> Send Message
                                        </>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section className="faq-section">
                <div className="container">
                    <h2>Frequently Asked Questions</h2>
                    
                    <div className="faq-grid">
                        <div className="faq-item">
                            <h3>How do I book a service?</h3>
                            <p>Simply go to our homepage, select the appliance you need repaired, choose a convenient time slot, and our technician will arrive at your doorstep.</p>
                        </div>
                        
                        <div className="faq-item">
                            <h3>What are the service charges?</h3>
                            <p>Service charges vary by appliance type. You'll see the visiting charge upfront, and the technician will provide a detailed estimate after diagnosis.</p>
                        </div>
                        
                        <div className="faq-item">
                            <h3>Are the technicians verified?</h3>
                            <p>Yes, all our technicians undergo thorough background verification and skill assessment before joining our platform.</p>
                        </div>
                        
                        <div className="faq-item">
                            <h3>What if I'm not satisfied with the service?</h3>
                            <p>We offer a satisfaction guarantee. If you're not happy with the service, contact us and we'll make it right.</p>
                        </div>
                        
                        <div className="faq-item">
                            <h3>How can I become a technician?</h3>
                            <p>Simply sign up as a technician on our platform, complete the verification process, and start accepting jobs in your area.</p>
                        </div>
                        
                        <div className="faq-item">
                            <h3>What payment methods do you accept?</h3>
                            <p>We accept all major payment methods including UPI, debit/credit cards, net banking, and cash on delivery.</p>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
};

export default ContactPage;
