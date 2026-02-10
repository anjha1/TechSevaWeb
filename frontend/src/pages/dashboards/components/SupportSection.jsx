import React, { useState } from 'react';
import { useMessage } from '../../../components/MessageBox';
import { ButtonLoader } from '../../../components/LoadingSpinner';
import api from '../../../services/api';

const SupportSection = () => {
    const { showMessage } = useMessage();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        subject: '',
        message: ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject || !formData.message) {
            showMessage('Please fill all fields.', 'error');
            return;
        }

        setLoading(true);

        try {
            const response = await api.post('/api/contact', {
                ...formData,
                type: 'support'
            });

            if (response.data.success) {
                showMessage('Support ticket submitted successfully!', 'success');
                setFormData({ subject: '', message: '' });
            }
        } catch (error) {
            showMessage(error.response?.data?.message || 'Failed to submit ticket.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const faqs = [
        {
            question: 'How do I track my service request?',
            answer: 'You can track your service request from the "My Jobs" section. You\'ll see real-time status updates and technician details once assigned.'
        },
        {
            question: 'Can I cancel or reschedule my booking?',
            answer: 'Yes, you can cancel or reschedule your booking from the "My Jobs" section before the technician starts the work.'
        },
        {
            question: 'What payment methods are accepted?',
            answer: 'We accept UPI, debit/credit cards, net banking, and cash payments after the service is completed.'
        },
        {
            question: 'Is there a warranty on repairs?',
            answer: 'Yes, all repairs come with a warranty period. The warranty duration depends on the type of repair and parts used.'
        }
    ];

    return (
        <div className="support-section">
            <h2>Support</h2>

            {/* Contact Info */}
            <div className="support-contact">
                <div className="contact-card">
                    <i className="fas fa-phone"></i>
                    <div>
                        <h4>Phone Support</h4>
                        <p>+91-XXXXXXXXXX</p>
                        <span>Mon-Sat, 9AM-8PM</span>
                    </div>
                </div>
                
                <div className="contact-card">
                    <i className="fas fa-envelope"></i>
                    <div>
                        <h4>Email Support</h4>
                        <p>support@techseva.com</p>
                        <span>24/7 Response</span>
                    </div>
                </div>
            </div>

            {/* Support Form */}
            <div className="support-form-section">
                <h3>Submit a Ticket</h3>
                <form onSubmit={handleSubmit} className="support-form">
                    <div className="form-group">
                        <label htmlFor="subject">Subject</label>
                        <input
                            type="text"
                            id="subject"
                            name="subject"
                            placeholder="Brief description of your issue"
                            value={formData.subject}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="message">Message</label>
                        <textarea
                            id="message"
                            name="message"
                            placeholder="Describe your issue in detail"
                            rows={5}
                            value={formData.message}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="btn-primary" disabled={loading}>
                        {loading ? <ButtonLoader /> : (
                            <>
                                <i className="fas fa-paper-plane"></i> Submit Ticket
                            </>
                        )}
                    </button>
                </form>
            </div>

            {/* FAQs */}
            <div className="faqs-section">
                <h3>Frequently Asked Questions</h3>
                <div className="faqs-list">
                    {faqs.map((faq, index) => (
                        <details key={index} className="faq-item">
                            <summary>{faq.question}</summary>
                            <p>{faq.answer}</p>
                        </details>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SupportSection;
